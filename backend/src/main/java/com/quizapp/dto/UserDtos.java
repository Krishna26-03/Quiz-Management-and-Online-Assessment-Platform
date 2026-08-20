package com.quizapp.dto;

import com.quizapp.dto.AnalyticsDtos.CategoryPerformance;
import com.quizapp.dto.AttemptDtos.AttemptHistoryItem;
import com.quizapp.entity.ERole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.List;

public class UserDtos {

    public record UserResponse(
            Long id,
            String fullName,
            String email,
            ERole role,
            boolean enabled,
            LocalDateTime createdAt,
            LocalDateTime lastLoginAt
    ) {}

    public record UpdateUserRequest(
            String fullName,
            Boolean enabled,
            ERole role
    ) {}

    public record CreateUserRequest(
            @NotBlank(message = "Full name is required") String fullName,
            @NotBlank(message = "Email is required") @Email(message = "A valid email is required") String email,
            @NotBlank(message = "Password is required") @Size(min = 6, message = "Password must be at least 6 characters") String password,
            @NotNull(message = "Role is required") ERole role
    ) {}

    public record AdminResetPasswordRequest(
            @NotBlank(message = "New password is required") @Size(min = 6, message = "Password must be at least 6 characters") String newPassword
    ) {}

    public record StudentSummaryResponse(
            Long id,
            String fullName,
            String email,
            ERole role,
            boolean enabled,
            LocalDateTime createdAt,
            LocalDateTime lastLoginAt,
            long quizzesAttempted,
            double averageScore,
            double highestScore,
            long quizzesPassed,
            long quizzesFailed
    ) {}

    public record StudentStats(
            long quizzesAttempted,
            double averageScore,
            double highestScore,
            long quizzesPassed,
            long quizzesFailed
    ) {}

    public record StudentProfileResponse(
            UserResponse user,
            StudentStats stats,
            List<AttemptHistoryItem> history,
            List<CategoryPerformance> categoryPerformance
    ) {}
}
