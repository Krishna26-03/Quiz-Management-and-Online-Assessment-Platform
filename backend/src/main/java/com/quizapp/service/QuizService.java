package com.quizapp.service;

import com.quizapp.dto.QuizDtos.*;
import com.quizapp.entity.*;
import com.quizapp.exception.BadRequestException;
import com.quizapp.exception.ResourceNotFoundException;
import com.quizapp.repository.CategoryRepository;
import com.quizapp.repository.QuestionRepository;
import com.quizapp.repository.QuizAttemptRepository;
import com.quizapp.repository.QuizRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class QuizService {

    private final QuizRepository quizRepository;
    private final CategoryRepository categoryRepository;
    private final QuestionRepository questionRepository;
    private final QuizAttemptRepository attemptRepository;

    @Transactional
    public QuizAdminResponse createQuiz(CreateQuizRequest req, User admin) {
        QuizStatus initialStatus = req.status() != null ? req.status() : QuizStatus.DRAFT;

        Quiz quiz = Quiz.builder()
                .title(req.title())
                .description(req.description())
                .difficulty(req.difficulty() != null ? req.difficulty() : DifficultyLevel.MEDIUM)
                .durationMinutes(req.durationMinutes())
                .marksPerQuestion(req.marksPerQuestion() != null ? req.marksPerQuestion() : 1.0)
                .negativeMarksPerQuestion(req.negativeMarksPerQuestion() != null ? req.negativeMarksPerQuestion() : 0.0)
                .passPercentage(req.passPercentage() != null ? req.passPercentage() : 40.0)
                .maxAttempts(req.maxAttempts() != null ? req.maxAttempts() : 1)
                .shuffleQuestions(req.shuffleQuestions() == null || req.shuffleQuestions())
                .shuffleOptions(req.shuffleOptions() == null || req.shuffleOptions())
                .status(initialStatus)
                .published(initialStatus == QuizStatus.PUBLISHED)
                .startsAt(req.startsAt())
                .endsAt(req.endsAt())
                .createdBy(admin)
                .build();

        if (req.categoryId() != null) {
            quiz.setCategory(categoryRepository.findById(req.categoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found")));
        }

        return toAdminResponse(quizRepository.save(quiz));
    }

    @Transactional
    public QuizAdminResponse updateQuiz(Long quizId, UpdateQuizRequest req) {
        Quiz quiz = getQuizOrThrow(quizId);

        if (req.title() != null) quiz.setTitle(req.title());
        if (req.description() != null) quiz.setDescription(req.description());
        if (req.categoryId() != null) {
            quiz.setCategory(categoryRepository.findById(req.categoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found")));
        }
        if (req.difficulty() != null) quiz.setDifficulty(req.difficulty());
        if (req.durationMinutes() != null) quiz.setDurationMinutes(req.durationMinutes());
        if (req.marksPerQuestion() != null) quiz.setMarksPerQuestion(req.marksPerQuestion());
        if (req.negativeMarksPerQuestion() != null) quiz.setNegativeMarksPerQuestion(req.negativeMarksPerQuestion());
        if (req.passPercentage() != null) quiz.setPassPercentage(req.passPercentage());
        if (req.maxAttempts() != null) quiz.setMaxAttempts(req.maxAttempts());
        if (req.shuffleQuestions() != null) quiz.setShuffleQuestions(req.shuffleQuestions());
        if (req.shuffleOptions() != null) quiz.setShuffleOptions(req.shuffleOptions());
        if (req.status() != null) {
            if (req.status() == QuizStatus.PUBLISHED && quiz.getQuestions().isEmpty() && questionRepository.countByQuizId(quizId) == 0) {
                throw new BadRequestException("Cannot publish a quiz with no questions");
            }
            quiz.setStatus(req.status());
        } else if (req.published() != null) {
            quiz.setPublished(req.published());
        }
        if (req.startsAt() != null) quiz.setStartsAt(req.startsAt());
        if (req.endsAt() != null) quiz.setEndsAt(req.endsAt());
        quiz.setUpdatedAt(LocalDateTime.now());

        return toAdminResponse(quizRepository.save(quiz));
    }

    @Transactional
    public QuizAdminResponse setStatus(Long quizId, QuizStatus status) {
        Quiz quiz = getQuizOrThrow(quizId);
        if (status == QuizStatus.PUBLISHED && questionRepository.countByQuizId(quizId) == 0) {
            throw new BadRequestException("Cannot publish a quiz with no questions");
        }
        quiz.setStatus(status);
        quiz.setUpdatedAt(LocalDateTime.now());
        return toAdminResponse(quizRepository.save(quiz));
    }

    @Transactional
    public QuizAdminResponse setPublished(Long quizId, boolean published) {
        return setStatus(quizId, published ? QuizStatus.PUBLISHED : QuizStatus.UNPUBLISHED);
    }

    @Transactional
    public void deleteQuiz(Long quizId) {
        Quiz quiz = getQuizOrThrow(quizId);
        quizRepository.delete(quiz);
    }

    public List<QuizAdminResponse> getAllQuizzesForAdmin() {
        return quizRepository.findAll().stream().map(this::toAdminResponse).toList();
    }

    public QuizAdminResponse getQuizForAdmin(Long quizId) {
        return toAdminResponse(getQuizOrThrow(quizId));
    }

    public Quiz getQuizOrThrow(Long quizId) {
        return quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found with id: " + quizId));
    }

    /** Quizzes visible to a student: ONLY PUBLISHED quizzes are available. */
    public List<QuizStudentSummary> getAvailableQuizzesForStudent(Long studentId) {
        return quizRepository.findByStatus(QuizStatus.PUBLISHED).stream()
                .map(quiz -> toStudentSummary(quiz, studentId))
                .toList();
    }

    public QuizStudentSummary getQuizStudentSummary(Long quizId, Long studentId) {
        return toStudentSummary(getQuizOrThrow(quizId), studentId);
    }

    private QuizStudentSummary toStudentSummary(Quiz quiz, Long studentId) {
        long attemptsUsed = attemptRepository.countCompletedByQuizIdAndUserId(quiz.getId(), studentId);
        LocalDateTime now = LocalDateTime.now();

        String unavailableReason = null;
        boolean available = true;

        if (quiz.getStatus() != QuizStatus.PUBLISHED) {
            available = false;
            unavailableReason = "This quiz is not currently published";
        } else if (quiz.getStartsAt() != null && now.isBefore(quiz.getStartsAt())) {
            available = false;
            unavailableReason = "This quiz opens on " + quiz.getStartsAt();
        } else if (quiz.getEndsAt() != null && now.isAfter(quiz.getEndsAt())) {
            available = false;
            unavailableReason = "This quiz closed on " + quiz.getEndsAt();
        } else if (quiz.getMaxAttempts() != null && quiz.getMaxAttempts() > 0 && attemptsUsed >= quiz.getMaxAttempts()) {
            available = false;
            unavailableReason = "You have used all " + quiz.getMaxAttempts() + " of your attempts";
        }

        return new QuizStudentSummary(
                quiz.getId(), quiz.getTitle(), quiz.getDescription(),
                quiz.getCategory() != null ? quiz.getCategory().getName() : null,
                quiz.getCategory() != null ? quiz.getCategory().getId() : null,
                quiz.getDifficulty(), quiz.getDurationMinutes(),
                (int) questionRepository.countByQuizId(quiz.getId()),
                quiz.getPassPercentage(),
                quiz.getMaxAttempts(), attemptsUsed,
                attemptRepository.countCompletedAttemptsByQuizId(quiz.getId()),
                quiz.getStatus(), available, unavailableReason,
                quiz.getStartsAt(), quiz.getEndsAt(), quiz.getCreatedAt()
        );
    }

    private QuizAdminResponse toAdminResponse(Quiz quiz) {
        return new QuizAdminResponse(
                quiz.getId(), quiz.getTitle(), quiz.getDescription(),
                quiz.getCategory() != null ? quiz.getCategory().getName() : null,
                quiz.getDifficulty(), quiz.getDurationMinutes(), quiz.getMarksPerQuestion(),
                quiz.getNegativeMarksPerQuestion(), quiz.getPassPercentage(), quiz.getMaxAttempts(),
                quiz.isShuffleQuestions(), quiz.isShuffleOptions(), quiz.getStatus(), quiz.isPublished(),
                quiz.getStartsAt(), quiz.getEndsAt(),
                (int) questionRepository.countByQuizId(quiz.getId()),
                quiz.getCreatedBy() != null ? quiz.getCreatedBy().getFullName() : null,
                quiz.getCreatedAt()
        );
    }
}
