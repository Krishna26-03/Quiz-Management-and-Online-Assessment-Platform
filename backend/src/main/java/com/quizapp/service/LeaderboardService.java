package com.quizapp.service;

import com.quizapp.dto.LeaderboardDtos.LeaderboardEntry;
import com.quizapp.entity.QuizAttempt;
import com.quizapp.exception.BadRequestException;
import com.quizapp.repository.QuizAttemptRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LeaderboardService {

    private final QuizAttemptRepository attemptRepository;

    /** Which attempts count towards the leaderboard. */
    public enum Scope { OVERALL, CATEGORY, WEEKLY, MONTHLY }

    /** What number attempts are ranked by. */
    public enum Metric { HIGHEST_SCORE, AVERAGE_SCORE, QUIZZES_COMPLETED }

    /** Best attempt per student for a single quiz, ranked by score. */
    public List<LeaderboardEntry> getQuizLeaderboard(Long quizId) {
        List<QuizAttempt> attempts = attemptRepository.findLeaderboardForQuiz(quizId);

        Map<Long, QuizAttempt> bestPerStudent = new LinkedHashMap<>();
        Map<Long, Long> attemptCounts = new HashMap<>();
        for (QuizAttempt a : attempts) {
            Long userId = a.getUser().getId();
            attemptCounts.merge(userId, 1L, Long::sum);
            bestPerStudent.merge(userId, a, (existing, incoming) ->
                    incoming.getTotalScore() > existing.getTotalScore() ? incoming : existing);
        }

        List<QuizAttempt> ranked = bestPerStudent.values().stream()
                .sorted(Comparator.comparingDouble(QuizAttempt::getTotalScore).reversed()
                        .thenComparing(QuizAttempt::getSubmittedAt))
                .toList();

        List<LeaderboardEntry> result = new ArrayList<>();
        int rank = 1;
        for (QuizAttempt a : ranked) {
            Long userId = a.getUser().getId();
            result.add(new LeaderboardEntry(rank++, userId, a.getUser().getFullName(),
                    a.getTotalScore(), a.getPercentage(), a.getPercentage(),
                    attemptCounts.get(userId).intValue(), 1, null));
        }
        return result;
    }

    /**
     * Platform-wide leaderboard.
     *
     * @param scope      which attempts count: every attempt ever (OVERALL), only a chosen
     *                   category (CATEGORY, requires categoryId), only this calendar week
     *                   starting Monday (WEEKLY), or only this calendar month (MONTHLY).
     * @param categoryId required when scope == CATEGORY, ignored otherwise.
     * @param metric     what students are ranked by: their single best score (HIGHEST_SCORE),
     *                   their average score across counted attempts (AVERAGE_SCORE), or how
     *                   many distinct quizzes they've completed (QUIZZES_COMPLETED).
     */
    public List<LeaderboardEntry> getLeaderboard(Scope scope, Long categoryId, Metric metric) {
        List<QuizAttempt> attempts = attemptRepository.findGlobalLeaderboard();

        attempts = switch (scope) {
            case CATEGORY -> {
                if (categoryId == null) {
                    throw new BadRequestException("categoryId is required for a category-wise leaderboard");
                }
                yield attempts.stream()
                        .filter(a -> a.getQuiz().getCategory() != null
                                && categoryId.equals(a.getQuiz().getCategory().getId()))
                        .toList();
            }
            case WEEKLY -> {
                LocalDateTime weekStart = LocalDate.now().with(DayOfWeek.MONDAY).atStartOfDay();
                yield attempts.stream()
                        .filter(a -> a.getSubmittedAt() != null && !a.getSubmittedAt().isBefore(weekStart))
                        .toList();
            }
            case MONTHLY -> {
                LocalDateTime monthStart = LocalDate.now().with(TemporalAdjusters.firstDayOfMonth()).atStartOfDay();
                yield attempts.stream()
                        .filter(a -> a.getSubmittedAt() != null && !a.getSubmittedAt().isBefore(monthStart))
                        .toList();
            }
            case OVERALL -> attempts;
        };

        record Aggregated(Long userId, String userName, double totalScore, double bestPercentage,
                           double avgPercentage, int attemptsCount, int quizzesCompleted, String bestQuizTitle) {}

        Map<Long, List<QuizAttempt>> byStudent = attempts.stream()
                .collect(Collectors.groupingBy(a -> a.getUser().getId(), LinkedHashMap::new, Collectors.toList()));

        List<Aggregated> aggregated = byStudent.values().stream().map(studentAttempts -> {
            double totalScore = studentAttempts.stream().mapToDouble(QuizAttempt::getTotalScore).sum();
            double avgPercentage = studentAttempts.stream().mapToDouble(QuizAttempt::getPercentage).average().orElse(0);
            QuizAttempt best = studentAttempts.stream()
                    .max(Comparator.comparingDouble(QuizAttempt::getPercentage)).orElse(studentAttempts.get(0));
            long quizzesCompleted = studentAttempts.stream().map(a -> a.getQuiz().getId()).distinct().count();
            return new Aggregated(studentAttempts.get(0).getUser().getId(), studentAttempts.get(0).getUser().getFullName(),
                    totalScore, best.getPercentage(), avgPercentage, studentAttempts.size(),
                    (int) quizzesCompleted, best.getQuiz().getTitle());
        }).toList();

        Comparator<Aggregated> comparator = switch (metric) {
            case AVERAGE_SCORE -> Comparator.comparingDouble(Aggregated::avgPercentage).reversed();
            case QUIZZES_COMPLETED -> Comparator.comparingInt(Aggregated::quizzesCompleted).reversed()
                    .thenComparing(Comparator.comparingDouble(Aggregated::avgPercentage).reversed());
            case HIGHEST_SCORE -> Comparator.comparingDouble(Aggregated::bestPercentage).reversed();
        };

        List<Aggregated> ranked = aggregated.stream().sorted(comparator).toList();

        List<LeaderboardEntry> result = new ArrayList<>();
        int rank = 1;
        for (Aggregated a : ranked) {
            result.add(new LeaderboardEntry(rank++, a.userId(), a.userName(),
                    Math.round(a.totalScore() * 100.0) / 100.0,
                    Math.round(a.bestPercentage() * 100.0) / 100.0,
                    Math.round(a.avgPercentage() * 100.0) / 100.0,
                    a.attemptsCount(), a.quizzesCompleted(), a.bestQuizTitle()));
        }
        return result;
    }
}
