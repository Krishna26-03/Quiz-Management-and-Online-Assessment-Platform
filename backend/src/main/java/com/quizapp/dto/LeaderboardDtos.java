package com.quizapp.dto;

public class LeaderboardDtos {

    public record LeaderboardEntry(
            int rank,
            Long userId,
            String userName,
            Double totalScore,
            Double bestPercentage,    // highest single-attempt score % - powers "Highest score" ranking
            Double averagePercentage, // average score % across counted attempts - powers "Average score" ranking
            Integer attemptsCount,
            Integer quizzesCompleted, // distinct quizzes completed - powers "Quizzes completed" ranking
            String bestQuizTitle      // only populated on the platform leaderboard, not the single-quiz one
    ) {}
}
