package com.quizapp.dto;

import com.quizapp.entity.AttemptStatus;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;
import java.util.List;

public class AttemptDtos {

    public record ShuffledQuestion(Long questionId, List<Long> optionIds) {}

    public record StartAttemptResponse(
            Long attemptId,
            Long quizId,
            String quizTitle,
            Integer durationMinutes,
            LocalDateTime startedAt,
            LocalDateTime deadlineAt,
            Long remainingSeconds,
            List<QuestionDtos.QuestionAttemptView> questions,
            java.util.Map<Long, List<Long>> savedAnswers
    ) {}

    public record AnswerSubmission(
            @NotNull Long questionId,
            // list of selected option IDs; empty list = unanswered
            List<Long> selectedOptionIds,
            Integer timeSpentSeconds
    ) {}

    public record SaveAnswerRequest(
            @NotNull Long questionId,
            List<Long> selectedOptionIds,
            Integer timeSpentSeconds
    ) {}

    public record SubmitAttemptRequest(
            @NotEmpty List<AnswerSubmission> answers
    ) {}

    public record AnswerResult(
            Long questionId,
            String questionText,
            List<QuestionDtos.OptionResponse> options,
            List<Long> selectedOptionIds,
            List<Long> correctOptionIds,
            Boolean correct,
            Double marksAwarded,
            String explanation
    ) {}

    public record AttemptResultResponse(
            Long attemptId,
            Long quizId,
            String quizTitle,
            AttemptStatus status,
            LocalDateTime startedAt,
            LocalDateTime submittedAt,
            Long timeTakenSeconds,
            Integer totalQuestions,
            Integer correctCount,
            Integer wrongCount,
            Integer unansweredCount,
            Double totalScore,
            Double maxPossibleScore,
            Double percentage,
            Boolean passed,
            List<AnswerResult> answers
    ) {}

    public record AttemptHistoryItem(
            Long attemptId,
            Long quizId,
            String quizTitle,
            AttemptStatus status,
            LocalDateTime startedAt,
            LocalDateTime submittedAt,
            Long timeTakenSeconds,
            Double totalScore,
            Double maxPossibleScore,
            Double percentage,
            Boolean passed
    ) {}
}
