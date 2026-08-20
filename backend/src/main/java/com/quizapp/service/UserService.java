package com.quizapp.service;

import com.quizapp.dto.AnalyticsDtos.CategoryPerformance;
import com.quizapp.dto.AttemptDtos.AttemptHistoryItem;
import com.quizapp.dto.UserDtos.*;
import com.quizapp.entity.AttemptStatus;
import com.quizapp.entity.ERole;
import com.quizapp.entity.QuizAttempt;
import com.quizapp.entity.User;
import com.quizapp.exception.BadRequestException;
import com.quizapp.exception.ResourceNotFoundException;
import com.quizapp.repository.QuizAttemptRepository;
import com.quizapp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final QuizAttemptRepository attemptRepository;
    private final AttemptService attemptService;
    private final AnalyticsService analyticsService;
    private final PasswordEncoder passwordEncoder;

    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream().map(this::toResponse).toList();
    }

    public List<UserResponse> getUsersByRole(ERole role) {
        return userRepository.findByRole(role).stream().map(this::toResponse).toList();
    }

    public List<StudentSummaryResponse> getStudents(String search) {
        List<User> students = userRepository.findByRole(ERole.STUDENT);
        if (search != null && !search.trim().isBlank()) {
            String q = search.trim().toLowerCase();
            students = students.stream()
                    .filter(s -> s.getFullName().toLowerCase().contains(q) || s.getEmail().toLowerCase().contains(q))
                    .toList();
        }

        return students.stream().map(this::toStudentSummary).toList();
    }

    public StudentProfileResponse getStudentProfile(Long studentId) {
        User user = findUser(studentId);
        List<QuizAttempt> completed = attemptRepository.findByUserIdOrderByStartedAtDesc(studentId).stream()
                .filter(a -> a.getStatus() == AttemptStatus.SUBMITTED || a.getStatus() == AttemptStatus.AUTO_SUBMITTED)
                .toList();

        double avg = completed.stream().mapToDouble(QuizAttempt::getPercentage).average().orElse(0);
        double max = completed.stream().mapToDouble(QuizAttempt::getPercentage).max().orElse(0);
        long passed = completed.stream().filter(a -> Boolean.TRUE.equals(a.getPassed())).count();
        long failed = completed.size() - passed;

        StudentStats stats = new StudentStats(
                completed.size(),
                Math.round(avg * 100.0) / 100.0,
                Math.round(max * 100.0) / 100.0,
                passed,
                failed
        );

        List<AttemptHistoryItem> history = attemptService.getHistory(studentId);
        List<CategoryPerformance> categoryPerf = analyticsService.getStudentPerformance(studentId).byCategory();

        return new StudentProfileResponse(toResponse(user), stats, history, categoryPerf);
    }

    public UserResponse getUser(Long id) {
        return toResponse(findUser(id));
    }

    @Transactional
    public UserResponse createUser(CreateUserRequest request) {
        String email = request.email().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new BadRequestException("An account with this email already exists");
        }

        User user = User.builder()
                .fullName(request.fullName().trim())
                .email(email)
                .password(passwordEncoder.encode(request.password()))
                .role(request.role())
                .enabled(true)
                .build();

        return toResponse(userRepository.save(user));
    }

    @Transactional
    public UserResponse updateUser(Long id, UpdateUserRequest request, Long requestingAdminId) {
        User user = findUser(id);

        if (request.fullName() != null && !request.fullName().isBlank()) {
            user.setFullName(request.fullName());
        }
        if (request.enabled() != null) {
            if (user.getId().equals(requestingAdminId) && !request.enabled()) {
                throw new BadRequestException("You cannot disable your own admin account");
            }
            user.setEnabled(request.enabled());
        }
        if (request.role() != null) {
            if (user.getId().equals(requestingAdminId) && request.role() != ERole.ADMIN) {
                throw new BadRequestException("You cannot demote your own admin account");
            }
            user.setRole(request.role());
        }

        return toResponse(userRepository.save(user));
    }

    @Transactional
    public UserResponse adminResetPassword(Long targetUserId, String newPassword, Long requestingAdminId) {
        User user = findUser(targetUserId);
        user.setPassword(passwordEncoder.encode(newPassword));
        return toResponse(userRepository.save(user));
    }

    @Transactional
    public void deleteUser(Long id, Long requestingAdminId) {
        if (id.equals(requestingAdminId)) {
            throw new BadRequestException("You cannot delete your own account");
        }
        User user = findUser(id);
        userRepository.delete(user);
    }

    private User findUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
    }

    private UserResponse toResponse(User user) {
        return new UserResponse(
                user.getId(), user.getFullName(), user.getEmail(), user.getRole(),
                user.isEnabled(), user.getCreatedAt(), user.getLastLoginAt()
        );
    }

    private StudentSummaryResponse toStudentSummary(User user) {
        List<QuizAttempt> completed = attemptRepository.findByUserIdOrderByStartedAtDesc(user.getId()).stream()
                .filter(a -> a.getStatus() == AttemptStatus.SUBMITTED || a.getStatus() == AttemptStatus.AUTO_SUBMITTED)
                .toList();

        double avg = completed.stream().mapToDouble(QuizAttempt::getPercentage).average().orElse(0);
        double max = completed.stream().mapToDouble(QuizAttempt::getPercentage).max().orElse(0);
        long passed = completed.stream().filter(a -> Boolean.TRUE.equals(a.getPassed())).count();
        long failed = completed.size() - passed;

        return new StudentSummaryResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole(),
                user.isEnabled(),
                user.getCreatedAt(),
                user.getLastLoginAt(),
                completed.size(),
                Math.round(avg * 100.0) / 100.0,
                Math.round(max * 100.0) / 100.0,
                passed,
                failed
        );
    }
}
