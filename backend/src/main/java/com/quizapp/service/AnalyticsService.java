package com.quizapp.service;

import com.quizapp.dto.AnalyticsDtos.*;
import com.quizapp.entity.*;
import com.quizapp.exception.ResourceNotFoundException;
import com.quizapp.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final UserRepository userRepository;
    private final QuizRepository quizRepository;
    private final QuestionRepository questionRepository;
    private final QuizAttemptRepository attemptRepository;
    private final AttemptAnswerRepository attemptAnswerRepository;

    public PlatformOverview getPlatformOverview() {
        long totalUsers = userRepository.count();
        List<User> students = userRepository.findByRole(ERole.STUDENT);
        long totalStudents = students.size();
        long totalQuizzes = quizRepository.count();
        List<Quiz> allQuizzes = quizRepository.findAll();
        long publishedQuizzes = allQuizzes.stream().filter(Quiz::isPublished).count();
        long draftQuizzes = Math.max(0, totalQuizzes - publishedQuizzes);
        long totalQuestions = questionRepository.count();

        List<QuizAttempt> allAttempts = attemptRepository.findAll();
        long totalAttempts = allAttempts.size();
        List<QuizAttempt> completed = allAttempts.stream()
                .filter(a -> a.getStatus() == AttemptStatus.SUBMITTED || a.getStatus() == AttemptStatus.AUTO_SUBMITTED)
                .toList();

        double avgScore = completed.stream().mapToDouble(QuizAttempt::getPercentage).average().orElse(0);
        long passedAttempts = completed.stream().filter(a -> Boolean.TRUE.equals(a.getPassed())).count();
        long failedAttempts = completed.size() - passedAttempts;

        DateTimeFormatter fmt = DateTimeFormatter.ISO_LOCAL_DATE;
        LocalDate today = LocalDate.now();

        // 1. Attempts over last 14 days
        Map<String, Long> attemptsByDay = new LinkedHashMap<>();
        for (int i = 13; i >= 0; i--) {
            attemptsByDay.put(today.minusDays(i).format(fmt), 0L);
        }
        for (QuizAttempt a : allAttempts) {
            if (a.getStartedAt() != null) {
                String day = a.getStartedAt().toLocalDate().format(fmt);
                if (attemptsByDay.containsKey(day)) {
                    attemptsByDay.merge(day, 1L, Long::sum);
                }
            }
        }

        // 2. Student registrations over last 14 days
        Map<String, Long> registrationsByDay = new LinkedHashMap<>();
        for (int i = 13; i >= 0; i--) {
            registrationsByDay.put(today.minusDays(i).format(fmt), 0L);
        }
        for (User u : students) {
            if (u.getCreatedAt() != null) {
                String day = u.getCreatedAt().toLocalDate().format(fmt);
                if (registrationsByDay.containsKey(day)) {
                    registrationsByDay.merge(day, 1L, Long::sum);
                }
            }
        }

        // Group attempts by Quiz ID for fast stats
        Map<Long, List<QuizAttempt>> attemptsByQuiz = allAttempts.stream()
                .filter(a -> a.getQuiz() != null)
                .collect(Collectors.groupingBy(a -> a.getQuiz().getId()));

        // 3. Most popular quizzes
        List<PopularQuizStat> popularQuizzes = allQuizzes.stream().map(q -> {
            List<QuizAttempt> qAttempts = attemptsByQuiz.getOrDefault(q.getId(), Collections.emptyList());
            double avg = qAttempts.stream()
                    .filter(a -> a.getStatus() == AttemptStatus.SUBMITTED || a.getStatus() == AttemptStatus.AUTO_SUBMITTED)
                    .mapToDouble(QuizAttempt::getPercentage).average().orElse(0);
            String cat = q.getCategory() != null ? q.getCategory().getName() : "General";
            return new PopularQuizStat(q.getId(), q.getTitle(), cat, qAttempts.size(), Math.round(avg * 100.0) / 100.0);
        })
        .sorted((a, b) -> Long.compare(b.attemptCount(), a.attemptCount()))
        .limit(6)
        .toList();

        // 4. Most popular categories
        Map<String, Long> categoryAttemptCounts = new HashMap<>();
        Map<String, Long> categoryQuizCounts = new HashMap<>();
        for (Quiz q : allQuizzes) {
            String cat = q.getCategory() != null ? q.getCategory().getName() : "General";
            categoryQuizCounts.merge(cat, 1L, Long::sum);
            long atts = attemptsByQuiz.getOrDefault(q.getId(), Collections.emptyList()).size();
            categoryAttemptCounts.merge(cat, atts, Long::sum);
        }

        List<PopularCategoryStat> popularCategories = categoryAttemptCounts.entrySet().stream()
                .map(e -> new PopularCategoryStat(e.getKey(), e.getValue(), categoryQuizCounts.getOrDefault(e.getKey(), 0L)))
                .sorted((a, b) -> Long.compare(b.attemptCount(), a.attemptCount()))
                .toList();

        // 5. Average quiz scores comparison
        List<QuizScoreStat> quizScores = allQuizzes.stream()
                .map(q -> {
                    List<QuizAttempt> qAttempts = attemptsByQuiz.getOrDefault(q.getId(), Collections.emptyList());
                    double avg = qAttempts.stream()
                            .filter(a -> a.getStatus() == AttemptStatus.SUBMITTED || a.getStatus() == AttemptStatus.AUTO_SUBMITTED)
                            .mapToDouble(QuizAttempt::getPercentage).average().orElse(0.0);
                    return new QuizScoreStat(q.getId(), q.getTitle(), Math.round(avg * 100.0) / 100.0, qAttempts.size());
                })
                .sorted((a, b) -> Long.compare(b.attemptCount(), a.attemptCount()))
                .limit(8)
                .toList();

        return new PlatformOverview(
                totalUsers,
                totalStudents,
                totalQuizzes,
                publishedQuizzes,
                draftQuizzes,
                totalQuestions,
                totalAttempts,
                completed.size(),
                Math.round(avgScore * 100.0) / 100.0,
                passedAttempts,
                failedAttempts,
                attemptsByDay,
                registrationsByDay,
                popularQuizzes,
                popularCategories,
                quizScores
        );
    }

    public QuizAnalytics getQuizAnalytics(Long quizId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found"));

        List<QuizAttempt> completed = attemptRepository.findByQuizIdOrderByStartedAtDesc(quizId).stream()
                .filter(a -> a.getStatus() == AttemptStatus.SUBMITTED || a.getStatus() == AttemptStatus.AUTO_SUBMITTED)
                .toList();

        double avg = completed.stream().mapToDouble(QuizAttempt::getPercentage).average().orElse(0);
        double max = completed.stream().mapToDouble(QuizAttempt::getPercentage).max().orElse(0);
        double min = completed.stream().mapToDouble(QuizAttempt::getPercentage).min().orElse(0);
        long passCount = completed.stream().filter(a -> Boolean.TRUE.equals(a.getPassed())).count();
        long failCount = completed.size() - passCount;

        List<Question> questions = questionRepository.findByQuizIdOrderByPositionAsc(quizId);
        // Include every question in the quiz (previously capped at 5 with .limit(5)),
        // sorted with the lowest correct-rate (toughest) questions first.
        List<QuestionStat> toughest = questions.stream().map(q -> {
            List<AttemptAnswer> answers = attemptAnswerRepository.findByQuestionId(q.getId());
            long answered = answers.stream().filter(a -> a.getSelectedOptionIds() != null && !a.getSelectedOptionIds().isBlank()).count();
            long correct = answers.stream().filter(a -> Boolean.TRUE.equals(a.getCorrect())).count();
            double rate = answered > 0 ? (correct * 100.0 / answered) : 0;
            return new QuestionStat(q.getId(), q.getText(), answered, correct, Math.round(rate * 100.0) / 100.0);
        })
        .sorted(Comparator.comparingDouble(QuestionStat::correctRate))
        .toList();

        return new QuizAnalytics(quiz.getId(), quiz.getTitle(), completed.size(),
                Math.round(avg * 100.0) / 100.0, Math.round(max * 100.0) / 100.0, Math.round(min * 100.0) / 100.0,
                passCount, failCount, toughest);
    }

    public StudentPerformance getStudentPerformance(Long studentId) {
        List<QuizAttempt> completed = attemptRepository.findByUserIdOrderByStartedAtDesc(studentId).stream()
                .filter(a -> a.getStatus() == AttemptStatus.SUBMITTED || a.getStatus() == AttemptStatus.AUTO_SUBMITTED)
                .toList();

        double avg = completed.stream().mapToDouble(QuizAttempt::getPercentage).average().orElse(0);
        double best = completed.stream().mapToDouble(QuizAttempt::getPercentage).max().orElse(0);
        long passed = completed.stream().filter(a -> Boolean.TRUE.equals(a.getPassed())).count();
        long failed = completed.size() - passed;
        // "Answered" = every question the student actually selected an option for (correct or wrong),
        // which is exactly correctCount + wrongCount as computed when the attempt was finalized.
        long questionsAnswered = completed.stream()
                .mapToLong(a -> (a.getCorrectCount() != null ? a.getCorrectCount() : 0)
                        + (a.getWrongCount() != null ? a.getWrongCount() : 0))
                .sum();

        Map<String, List<QuizAttempt>> byCategory = completed.stream()
                .collect(Collectors.groupingBy(a -> a.getQuiz().getCategory() != null
                        ? a.getQuiz().getCategory().getName() : "Uncategorized"));

        List<CategoryPerformance> categoryPerf = byCategory.entrySet().stream()
                .map(e -> new CategoryPerformance(e.getKey(), e.getValue().size(),
                        Math.round(e.getValue().stream().mapToDouble(QuizAttempt::getPercentage).average().orElse(0) * 100.0) / 100.0))
                .sorted(Comparator.comparing(CategoryPerformance::categoryName))
                .toList();

        List<RecentAttempt> recentAttempts = completed.stream()
                .sorted(Comparator.comparing(QuizAttempt::getSubmittedAt,
                        Comparator.nullsFirst(Comparator.<LocalDateTime>naturalOrder())).reversed())
                .limit(5)
                .map(a -> new RecentAttempt(a.getId(), a.getQuiz().getId(), a.getQuiz().getTitle(),
                        Math.round(a.getPercentage() * 10.0) / 10.0, Boolean.TRUE.equals(a.getPassed()),
                        a.getStatus().name(), a.getSubmittedAt()))
                .toList();

        return new StudentPerformance(completed.size(), Math.round(avg * 100.0) / 100.0,
                Math.round(best * 100.0) / 100.0, passed, failed, questionsAnswered, categoryPerf, recentAttempts);
    }
}
