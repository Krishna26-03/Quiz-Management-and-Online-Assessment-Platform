package com.quizapp.dto;

import com.quizapp.entity.DifficultyLevel;
import com.quizapp.entity.QuizStatus;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;
import java.util.List;

public class QuizDtos {

    public record CreateQuizRequest(
            @NotBlank String title,
            String description,
            Long categoryId,
            DifficultyLevel difficulty,
            @NotNull @Min(1) Integer durationMinutes,
            Double marksPerQuestion,
            Double negativeMarksPerQuestion,
            Double passPercentage,
            Integer maxAttempts,
            Boolean shuffleQuestions,
            Boolean shuffleOptions,
            QuizStatus status,
            LocalDateTime startsAt,
            LocalDateTime endsAt
    ) {}

    public record UpdateQuizRequest(
            String title,
            String description,
            Long categoryId,
            DifficultyLevel difficulty,
            Integer durationMinutes,
            Double marksPerQuestion,
            Double negativeMarksPerQuestion,
            Double passPercentage,
            Integer maxAttempts,
            Boolean shuffleQuestions,
            Boolean shuffleOptions,
            QuizStatus status,
            Boolean published,
            LocalDateTime startsAt,
            LocalDateTime endsAt
    ) {}

    // Full detail used by Admin (includes status and correct answers)
    public record QuizAdminResponse(
            Long id,
            String title,
            String description,
            String categoryName,
            DifficultyLevel difficulty,
            Integer durationMinutes,
            Double marksPerQuestion,
            Double negativeMarksPerQuestion,
            Double passPercentage,
            Integer maxAttempts,
            boolean shuffleQuestions,
            boolean shuffleOptions,
            QuizStatus status,
            boolean published,
            LocalDateTime startsAt,
            LocalDateTime endsAt,
            int questionCount,
            String createdByName,
            LocalDateTime createdAt
    ) {}

    // Summary card shown to students on the quiz browse page (no answers)
    public record QuizStudentSummary(
            Long id,
            String title,
            String description,
            String categoryName,
            Long categoryId,
            DifficultyLevel difficulty,
            Integer durationMinutes,
            int questionCount,
            Double passPercentage,
            Integer maxAttempts,
            long attemptsUsed,
            long popularityCount, // total completed attempts by all students - powers "Popularity" sort
            QuizStatus status,
            boolean available,
            String unavailableReason,
            LocalDateTime startsAt,
            LocalDateTime endsAt,
            LocalDateTime createdAt // powers "Recently added" sort
    ) {}
}
