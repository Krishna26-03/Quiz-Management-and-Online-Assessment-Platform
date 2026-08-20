package com.quizapp.dto;

import com.quizapp.entity.ERole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AuthDtos {

    public record RegisterRequest(
            @NotBlank(message = "Full name is required") String fullName,
            @NotBlank @Email(message = "A valid email is required") String email,
            @NotBlank @Size(min = 6, message = "Password must be at least 6 characters") String password
    ) {}

    public record LoginRequest(
            @NotBlank @Email String email,
            @NotBlank String password
    ) {}

    public record AuthResponse(
            String token,
            Long userId,
            String fullName,
            String email,
            ERole role
    ) {}

    public record ForgotPasswordRequest(
            @NotBlank(message = "Email is required") @Email(message = "A valid email is required") String email
    ) {}

    public record ForgotPasswordResponse(
            String message,
            String resetToken
    ) {}

    public record ResetPasswordRequest(
            @NotBlank(message = "Reset token is required") String token,
            @NotBlank(message = "New password is required") @Size(min = 6, message = "Password must be at least 6 characters") String newPassword
    ) {}

    public record ChangePasswordRequest(
            @NotBlank(message = "Current password is required") String currentPassword,
            @NotBlank(message = "New password is required") @Size(min = 6, message = "Password must be at least 6 characters") String newPassword
    ) {}

    public record SimpleMessageResponse(
            String message
    ) {}
}
