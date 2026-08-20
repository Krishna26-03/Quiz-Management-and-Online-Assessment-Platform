package com.quizapp.service;

import com.quizapp.dto.AuthDtos.*;
import com.quizapp.entity.ERole;
import com.quizapp.entity.User;
import com.quizapp.exception.BadRequestException;
import com.quizapp.repository.UserRepository;
import com.quizapp.security.CustomUserDetails;
import com.quizapp.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import com.quizapp.entity.PasswordResetToken;
import com.quizapp.repository.PasswordResetTokenRepository;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new BadRequestException("An account with this email already exists");
        }

        User user = User.builder()
                .fullName(request.fullName())
                .email(request.email().toLowerCase())
                .password(passwordEncoder.encode(request.password()))
                .role(ERole.STUDENT) // public self-registration always creates a Student account
                .enabled(true)
                .build();

        user = userRepository.save(user);

        String token = jwtTokenProvider.generateTokenFromEmail(user.getEmail(), user.getId(), user.getRole().name());
        return new AuthResponse(token, user.getId(), user.getFullName(), user.getEmail(), user.getRole());
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email().toLowerCase(), request.password())
        );

        CustomUserDetails principal = (CustomUserDetails) authentication.getPrincipal();
        String token = jwtTokenProvider.generateToken(authentication);

        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new BadRequestException("User no longer exists"));
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        return new AuthResponse(token, user.getId(), user.getFullName(), user.getEmail(), user.getRole());
    }

    @Transactional
    public ForgotPasswordResponse forgotPassword(ForgotPasswordRequest request) {
        String email = request.email().trim().toLowerCase();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("No account found with email: " + email));

        if (!user.isEnabled()) {
            throw new BadRequestException("This account is currently disabled. Please contact an administrator.");
        }

        // Invalidate previous unused tokens
        passwordResetTokenRepository.invalidateExistingTokensForUser(user);

        // Generate a new secure token valid for 30 minutes
        String resetToken = UUID.randomUUID().toString();
        PasswordResetToken tokenEntity = PasswordResetToken.builder()
                .token(resetToken)
                .user(user)
                .expiryDate(LocalDateTime.now().plusMinutes(30))
                .used(false)
                .build();

        passwordResetTokenRepository.save(tokenEntity);

        System.out.println("======================================================");
        System.out.println(" Password Reset Token generated for: " + user.getEmail());
        System.out.println(" Token: " + resetToken);
        System.out.println(" Valid for 30 minutes");
        System.out.println("======================================================");

        return new ForgotPasswordResponse(
                "Password reset token generated successfully. Please use the token to set a new password.",
                resetToken
        );
    }

    @Transactional
    public SimpleMessageResponse resetPassword(ResetPasswordRequest request) {
        PasswordResetToken tokenEntity = passwordResetTokenRepository.findByToken(request.token().trim())
                .orElseThrow(() -> new BadRequestException("Invalid or non-existent password reset token"));

        if (tokenEntity.isUsed()) {
            throw new BadRequestException("This password reset token has already been used");
        }

        if (tokenEntity.isExpired()) {
            throw new BadRequestException("This password reset token has expired. Please request a new one");
        }

        User user = tokenEntity.getUser();
        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);

        tokenEntity.setUsed(true);
        passwordResetTokenRepository.save(tokenEntity);

        return new SimpleMessageResponse("Password has been reset successfully. You can now sign in with your new password.");
    }

    @Transactional
    public SimpleMessageResponse changePassword(Long userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BadRequestException("User not found"));

        if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
            throw new BadRequestException("Current password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);

        return new SimpleMessageResponse("Password changed successfully.");
    }
}
