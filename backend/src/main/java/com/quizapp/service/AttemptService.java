package com.quizapp.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.quizapp.dto.AttemptDtos.*;
import com.quizapp.dto.QuestionDtos.*;
import com.quizapp.entity.*;
import com.quizapp.exception.BadRequestException;
import com.quizapp.exception.ForbiddenOperationException;
import com.quizapp.exception.ResourceNotFoundException;
import com.quizapp.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AttemptService {

    private final QuizAttemptRepository attemptRepository;
    private final QuizRepository quizRepository;
    private final QuestionRepository questionRepository;
    private final AttemptAnswerRepository attemptAnswerRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional
    public StartAttemptResponse startAttempt(Long quizId, User student) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found"));

        validateAvailability(quiz, student.getId());

        // Resume an already-active attempt instead of creating a duplicate
        Optional<QuizAttempt> existing = attemptRepository.findByUserIdOrderByStartedAtDesc(student.getId()).stream()
                .filter(a -> a.getQuiz().getId().equals(quizId) && a.getStatus() == AttemptStatus.IN_PROGRESS
                        && a.getDeadlineAt().isAfter(LocalDateTime.now()))
                .findFirst();
        if (existing.isPresent()) {
            return toStartResponse(existing.get());
        }

        List<Question> questions = new ArrayList<>(questionRepository.findByQuizIdOrderByPositionAsc(quizId));
        if (questions.isEmpty()) {
            throw new BadRequestException("This quiz has no questions yet");
        }
        if (quiz.isShuffleQuestions()) {
            Collections.shuffle(questions);
        }

        List<ShuffledQuestion> shuffled = new ArrayList<>();
        for (Question q : questions) {
            List<Long> optionIds = q.getOptions().stream().map(QuestionOption::getId).collect(Collectors.toList());
            if (quiz.isShuffleOptions()) {
                Collections.shuffle(optionIds);
            }
            shuffled.add(new ShuffledQuestion(q.getId(), optionIds));
        }

        LocalDateTime now = LocalDateTime.now();
        QuizAttempt attempt = QuizAttempt.builder()
                .quiz(quiz)
                .user(student)
                .startedAt(now)
                .deadlineAt(now.plusMinutes(quiz.getDurationMinutes()))
                .status(AttemptStatus.IN_PROGRESS)
                .questionOrder(writeJson(shuffled))
                .build();

        attempt = attemptRepository.save(attempt);
        return toStartResponse(attempt);
    }

    private void validateAvailability(Quiz quiz, Long studentId) {
        if (!quiz.isPublished()) {
            throw new ForbiddenOperationException("This quiz is not published");
        }
        LocalDateTime now = LocalDateTime.now();
        if (quiz.getStartsAt() != null && now.isBefore(quiz.getStartsAt())) {
            throw new ForbiddenOperationException("This quiz has not opened yet");
        }
        if (quiz.getEndsAt() != null && now.isAfter(quiz.getEndsAt())) {
            throw new ForbiddenOperationException("This quiz has closed");
        }
        if (quiz.getMaxAttempts() != null && quiz.getMaxAttempts() > 0) {
            long used = attemptRepository.countCompletedByQuizIdAndUserId(quiz.getId(), studentId);
            if (used >= quiz.getMaxAttempts()) {
                throw new ForbiddenOperationException("You have used all your attempts for this quiz");
            }
        }
    }

    @Transactional
    public void saveAnswer(Long attemptId, User student, SaveAnswerRequest req) {
        QuizAttempt attempt = getOwnedActiveAttempt(attemptId, student.getId());

        Question question = questionRepository.findById(req.questionId())
                .orElseThrow(() -> new ResourceNotFoundException("Question not found"));

        AttemptAnswer answer = attempt.getAnswers().stream()
                .filter(a -> a.getQuestion().getId().equals(req.questionId()))
                .findFirst()
                .orElseGet(() -> {
                    AttemptAnswer a = AttemptAnswer.builder().attempt(attempt).question(question).build();
                    attempt.getAnswers().add(a);
                    return a;
                });

        answer.setSelectedOptionIds(joinIds(req.selectedOptionIds()));
        answer.setTimeSpentSeconds(req.timeSpentSeconds());

        attemptRepository.save(attempt);
    }

    @Transactional
    public AttemptResultResponse submitAttempt(Long attemptId, User student, SubmitAttemptRequest req) {
        QuizAttempt attempt = getOwnedActiveAttempt(attemptId, student.getId());

        // Merge any final answers sent with the submit call over whatever was autosaved
        if (req != null && req.answers() != null) {
            for (AnswerSubmission sub : req.answers()) {
                Question question = questionRepository.findById(sub.questionId())
                        .orElseThrow(() -> new ResourceNotFoundException("Question not found"));
                AttemptAnswer answer = attempt.getAnswers().stream()
                        .filter(a -> a.getQuestion().getId().equals(sub.questionId()))
                        .findFirst()
                        .orElseGet(() -> {
                            AttemptAnswer a = AttemptAnswer.builder().attempt(attempt).question(question).build();
                            attempt.getAnswers().add(a);
                            return a;
                        });
                answer.setSelectedOptionIds(joinIds(sub.selectedOptionIds()));
                if (sub.timeSpentSeconds() != null) answer.setTimeSpentSeconds(sub.timeSpentSeconds());
            }
        }

        return finalizeAttempt(attempt, AttemptStatus.SUBMITTED);
    }

    /**
     * Scheduled job entry point: finds every attempt whose countdown has expired but that's
     * still IN_PROGRESS, and finalizes each one.
     *
     * IMPORTANT: this used to be two separate calls - findExpiredInProgressAttempts() (its own,
     * non-transactional query) followed by autoSubmitIfExpired(attempt) (a separate @Transactional
     * call per attempt). By the time the second call ran, the attempt entity from the first query
     * was detached (its session had already closed), so touching the lazy `answers` collection
     * inside finalizeAttempt() blew up with LazyInitializationException - which silently killed
     * every scheduler run. Doing the query and the finalization inside one transaction keeps the
     * entities attached to the same session throughout.
     */
    @Transactional
    public void closeExpiredAttempts() {
        List<QuizAttempt> expired = attemptRepository.findByStatus(AttemptStatus.IN_PROGRESS).stream()
                .filter(a -> a.getDeadlineAt().isBefore(LocalDateTime.now()))
                .toList();
        for (QuizAttempt attempt : expired) {
            finalizeAttempt(attempt, AttemptStatus.AUTO_SUBMITTED);
        }
    }

    private AttemptResultResponse finalizeAttempt(QuizAttempt attempt, AttemptStatus finalStatus) {
        Quiz quiz = attempt.getQuiz();
        List<Question> questions = questionRepository.findByQuizIdOrderByPositionAsc(quiz.getId());

        double totalScore = 0;
        int correctCount = 0, wrongCount = 0, unansweredCount = 0;
        List<AnswerResult> results = new ArrayList<>();

        for (Question q : questions) {
            Set<Long> correctIds = q.getOptions().stream().filter(QuestionOption::isCorrect)
                    .map(QuestionOption::getId).collect(Collectors.toSet());

            AttemptAnswer answer = attempt.getAnswers().stream()
                    .filter(a -> a.getQuestion().getId().equals(q.getId()))
                    .findFirst().orElse(null);

            List<Long> selected = answer != null ? splitIds(answer.getSelectedOptionIds()) : List.of();
            boolean answered = !selected.isEmpty();
            boolean correct = answered && correctIds.equals(new HashSet<>(selected));

            double qMarks = (q.getMarks() != null && q.getMarks() > 0) ? q.getMarks() : quiz.getMarksPerQuestion();
            double marks;
            if (!answered) {
                unansweredCount++;
                marks = 0;
            } else if (correct) {
                correctCount++;
                marks = qMarks;
            } else {
                wrongCount++;
                marks = -quiz.getNegativeMarksPerQuestion();
            }
            totalScore += marks;

            if (answer == null) {
                answer = AttemptAnswer.builder().attempt(attempt).question(q).selectedOptionIds("").build();
                attempt.getAnswers().add(answer);
            }
            answer.setCorrect(answered ? correct : null);
            answer.setMarksAwarded(marks);

            List<OptionResponse> optionResponses = q.getOptions().stream()
                    .map(o -> new OptionResponse(o.getId(), o.getText(), o.isCorrect()))
                    .toList();

            results.add(new AnswerResult(q.getId(), q.getText(), optionResponses, selected,
                    new ArrayList<>(correctIds), answered ? correct : null, marks, q.getExplanation()));
        }

        double maxPossible = questions.stream()
                .mapToDouble(qu -> (qu.getMarks() != null && qu.getMarks() > 0) ? qu.getMarks() : quiz.getMarksPerQuestion())
                .sum();
        double percentage = maxPossible > 0 ? Math.max(0, (totalScore / maxPossible) * 100.0) : 0;

        attempt.setStatus(finalStatus);
        // For auto-submitted attempts, the scheduler (or a lazy on-demand check in getResult/getHistory)
        // may run well after the countdown actually hit zero - using LocalDateTime.now() here made
        // "time taken" (submittedAt - startedAt) blow past the quiz's own duration (e.g. 28m57s on a
        // 15-minute quiz). The student's real submission time IS the deadline for an auto-submit, so
        // cap it there. A manual submit is always validated against the deadline before reaching this
        // point, so LocalDateTime.now() there is already guaranteed to be <= deadlineAt.
        LocalDateTime submittedAt = (finalStatus == AttemptStatus.AUTO_SUBMITTED)
                ? attempt.getDeadlineAt()
                : LocalDateTime.now();
        attempt.setSubmittedAt(submittedAt);
        attempt.setTotalScore(totalScore);
        attempt.setMaxPossibleScore(maxPossible);
        attempt.setPercentage(percentage);
        attempt.setCorrectCount(correctCount);
        attempt.setWrongCount(wrongCount);
        attempt.setUnansweredCount(unansweredCount);
        attempt.setPassed(percentage >= quiz.getPassPercentage());

        attempt = attemptRepository.save(attempt);
        return toResultResponse(attempt, results);
    }

    @Transactional
    public AttemptResultResponse getResult(Long attemptId, User student) {
        QuizAttempt attempt = attemptRepository.findByIdAndUserId(attemptId, student.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Attempt not found"));

        if (attempt.getStatus() == AttemptStatus.IN_PROGRESS) {
            if (attempt.getDeadlineAt().isBefore(LocalDateTime.now())) {
                return finalizeAttempt(attempt, AttemptStatus.AUTO_SUBMITTED);
            } else {
                throw new BadRequestException("This attempt is still in progress");
            }
        }

        List<AnswerResult> results = attempt.getAnswers().stream().map(answer -> {
            Question q = answer.getQuestion();
            Set<Long> correctIds = q.getOptions().stream().filter(QuestionOption::isCorrect)
                    .map(QuestionOption::getId).collect(Collectors.toSet());
            List<OptionResponse> optionResponses = q.getOptions().stream()
                    .map(o -> new OptionResponse(o.getId(), o.getText(), o.isCorrect()))
                    .toList();
            return new AnswerResult(q.getId(), q.getText(), optionResponses, splitIds(answer.getSelectedOptionIds()),
                    new ArrayList<>(correctIds), answer.getCorrect(), answer.getMarksAwarded(), q.getExplanation());
        }).toList();

        return toResultResponse(attempt, results);
    }

    @Transactional
    public List<AttemptHistoryItem> getHistory(Long studentId) {
        // Auto-finalize any expired in-progress attempts for this student on-demand
        List<QuizAttempt> inProgress = attemptRepository.findByUserIdOrderByStartedAtDesc(studentId).stream()
                .filter(a -> a.getStatus() == AttemptStatus.IN_PROGRESS && a.getDeadlineAt().isBefore(LocalDateTime.now()))
                .toList();
        for (QuizAttempt a : inProgress) {
            finalizeAttempt(a, AttemptStatus.AUTO_SUBMITTED);
        }

        return attemptRepository.findByUserIdOrderByStartedAtDesc(studentId).stream()
                .filter(a -> a.getStatus() != AttemptStatus.IN_PROGRESS)
                .map(a -> {
                    long timeTaken = 0;
                    if (a.getStartedAt() != null && a.getSubmittedAt() != null) {
                        timeTaken = Math.max(0, java.time.Duration.between(a.getStartedAt(), a.getSubmittedAt()).getSeconds());
                    }
                    return new AttemptHistoryItem(
                            a.getId(),
                            a.getQuiz().getId(),
                            a.getQuiz().getTitle(),
                            a.getStatus(),
                            a.getStartedAt(),
                            a.getSubmittedAt(),
                            timeTaken,
                            a.getTotalScore(),
                            a.getMaxPossibleScore(),
                            a.getPercentage(),
                            a.getPassed()
                    );
                })
                .toList();
    }

    @Transactional
    public StartAttemptResponse getActiveAttempt(Long attemptId, User student) {
        QuizAttempt attempt = getOwnedActiveAttempt(attemptId, student.getId());
        return toStartResponse(attempt);
    }

    private QuizAttempt getOwnedActiveAttempt(Long attemptId, Long studentId) {
        QuizAttempt attempt = attemptRepository.findByIdAndUserId(attemptId, studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Attempt not found"));
        if (attempt.getStatus() != AttemptStatus.IN_PROGRESS) {
            throw new BadRequestException("This attempt has already been submitted");
        }
        if (attempt.getDeadlineAt().isBefore(LocalDateTime.now())) {
            finalizeAttempt(attempt, AttemptStatus.AUTO_SUBMITTED);
            throw new ForbiddenOperationException("Time is up - this attempt was auto-submitted");
        }
        return attempt;
    }

    private StartAttemptResponse toStartResponse(QuizAttempt attempt) {
        List<ShuffledQuestion> order = readJson(attempt.getQuestionOrder());
        Map<Long, Question> questionsById = questionRepository.findByQuizIdOrderByPositionAsc(attempt.getQuiz().getId())
                .stream().collect(Collectors.toMap(Question::getId, q -> q));

        List<QuestionAttemptView> views = new ArrayList<>();
        int pos = 0;
        for (ShuffledQuestion sq : order) {
            Question q = questionsById.get(sq.questionId());
            if (q == null) continue;
            Map<Long, QuestionOption> optionsById = q.getOptions().stream()
                    .collect(Collectors.toMap(QuestionOption::getId, o -> o));
            List<OptionResponse> options = sq.optionIds().stream()
                    .map(optionsById::get)
                    .filter(Objects::nonNull)
                    .map(o -> new OptionResponse(o.getId(), o.getText(), null))
                    .toList();
            views.add(new QuestionAttemptView(q.getId(), q.getText(), q.getType(), q.getDifficulty(),
                    q.getMarks(), q.getImageUrl(), q.getCodeSnippet(), q.getCodeLanguage(), pos++, options));
        }

        Map<Long, List<Long>> savedAnswers = new HashMap<>();
        if (attempt.getAnswers() != null) {
            for (AttemptAnswer a : attempt.getAnswers()) {
                if (a.getQuestion() != null) {
                    savedAnswers.put(a.getQuestion().getId(), splitIds(a.getSelectedOptionIds()));
                }
            }
        }

        return new StartAttemptResponse(attempt.getId(), attempt.getQuiz().getId(), attempt.getQuiz().getTitle(),
                attempt.getQuiz().getDurationMinutes(), attempt.getStartedAt(), attempt.getDeadlineAt(), views, savedAnswers);
    }

    private AttemptResultResponse toResultResponse(QuizAttempt attempt, List<AnswerResult> results) {
        long timeTaken = 0;
        if (attempt.getStartedAt() != null && attempt.getSubmittedAt() != null) {
            timeTaken = Math.max(0, java.time.Duration.between(attempt.getStartedAt(), attempt.getSubmittedAt()).getSeconds());
        }
        int totalQuestions = results.size();
        return new AttemptResultResponse(
                attempt.getId(),
                attempt.getQuiz().getId(),
                attempt.getQuiz().getTitle(),
                attempt.getStatus(),
                attempt.getStartedAt(),
                attempt.getSubmittedAt(),
                timeTaken,
                totalQuestions,
                attempt.getCorrectCount(),
                attempt.getWrongCount(),
                attempt.getUnansweredCount(),
                Math.round(attempt.getTotalScore() * 100.0) / 100.0,
                Math.round(attempt.getMaxPossibleScore() * 100.0) / 100.0,
                Math.round(attempt.getPercentage() * 10.0) / 10.0,
                attempt.getPassed(),
                results
        );
    }

    private String joinIds(List<Long> ids) {
        if (ids == null || ids.isEmpty()) return "";
        return ids.stream().map(String::valueOf).collect(Collectors.joining(","));
    }

    private List<Long> splitIds(String csv) {
        if (csv == null || csv.isBlank()) return List.of();
        return Arrays.stream(csv.split(",")).map(Long::parseLong).toList();
    }

    private String writeJson(Object o) {
        try {
            return objectMapper.writeValueAsString(o);
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize attempt state", e);
        }
    }

    private List<ShuffledQuestion> readJson(String json) {
        try {
            return objectMapper.readValue(json,
                    objectMapper.getTypeFactory().constructCollectionType(List.class, ShuffledQuestion.class));
        } catch (Exception e) {
            throw new RuntimeException("Failed to deserialize attempt state", e);
        }
    }
}
