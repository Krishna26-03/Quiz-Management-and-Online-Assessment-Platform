package com.quizapp.dto;

import com.quizapp.entity.DifficultyLevel;
import com.quizapp.entity.QuestionType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public class QuestionDtos {

    public record OptionRequest(
            Long id, // null for a new option, present when editing an existing one
            @NotBlank String text,
            boolean correct
    ) {}

    public record CreateQuestionRequest(
            @NotBlank String text,
            @NotNull QuestionType type,
            DifficultyLevel difficulty,
            Double marks,
            String imageUrl,
            String codeSnippet,
            String codeLanguage,
            String explanation,
            Integer position,
            @NotEmpty @Valid List<OptionRequest> options
    ) {}

    public record OptionResponse(
            Long id,
            String text,
            Boolean correct // null when returned to a student before submission
    ) {}

    public record QuestionAdminResponse(
            Long id,
            String text,
            QuestionType type,
            DifficultyLevel difficulty,
            Double marks,
            String imageUrl,
            String codeSnippet,
            String codeLanguage,
            String explanation,
            Integer position,
            List<OptionResponse> options
    ) {}

    // Sent to a student while attempting a quiz - never reveals `correct`
    public record QuestionAttemptView(
            Long id,
            String text,
            QuestionType type,
            DifficultyLevel difficulty,
            Double marks,
            String imageUrl,
            String codeSnippet,
            String codeLanguage,
            Integer position,
            List<OptionResponse> options
    ) {}

    public record BulkImportRequest(
            @NotEmpty @Valid List<CreateQuestionRequest> questions
    ) {}
}
