package com.quizapp.dto;

import java.util.List;
import java.util.Map;

public class AnalyticsDtos {

    // Admin: platform-wide overview & control panel stats
    public record PlatformOverview(
            long totalUsers,
            long totalStudents,
            long totalQuizzes,
            long publishedQuizzes,
            long draftQuizzes,
            long totalQuestions,
            long totalAttempts,
            long completedAttempts,
            double averageScorePercentage,
            long passedAttempts,
            long failedAttempts,
            Map<String, Long> attemptsByDay,
            Map<String, Long> registrationsByDay,
            List<PopularQuizStat> popularQuizzes,
            List<PopularCategoryStat> popularCategories,
            List<QuizScoreStat> quizScores
    ) {}

    public record PopularQuizStat(
            Long quizId,
            String quizTitle,
            String categoryName,
            long attemptCount,
            double averagePercentage
    ) {}

    public record PopularCategoryStat(
            String categoryName,
            long attemptCount,
            long quizCount
    ) {}

    public record QuizScoreStat(
            Long quizId,
            String quizTitle,
            double averagePercentage,
            long attemptCount
    ) {}

    // Admin: per-quiz analytics
    public record QuizAnalytics(
            Long quizId,
            String quizTitle,
            long totalAttempts,
            double averagePercentage,
            double highestPercentage,
            double lowestPercentage,
            long passCount,
            long failCount,
            List<QuestionStat> toughestQuestions
    ) {}

    public record QuestionStat(
            Long questionId,
            String questionText,
            long timesAnswered,
            long timesCorrect,
            double correctRate
    ) {}

    // Student: personal performance analytics
    public record StudentPerformance(
            long totalAttempts,
            double averagePercentage,
            double bestPercentage,
            long quizzesPassed,
            long quizzesFailed,
            long totalQuestionsAnswered,
            List<CategoryPerformance> byCategory,
            List<RecentAttempt> recentAttempts
    ) {}

    public record CategoryPerformance(
            String categoryName,
            long attempts,
            double averagePercentage
    ) {}

    // One row in the student dashboard's "Recent Attempts" list
    public record RecentAttempt(
            Long attemptId,
            Long quizId,
            String quizTitle,
            double percentage,
            boolean passed,
            String status,
            java.time.LocalDateTime submittedAt
    ) {}
}
