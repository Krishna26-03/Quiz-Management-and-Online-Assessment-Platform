package com.quizapp.controller;

import com.quizapp.dto.UserDtos.*;
import com.quizapp.entity.ERole;
import com.quizapp.security.CurrentUserResolver;
import com.quizapp.service.UserService;
import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final UserService userService;
    private final CurrentUserResolver currentUserResolver;

    @PostMapping
    public ResponseEntity<UserResponse> createUser(@Valid @RequestBody CreateUserRequest request) {
        return ResponseEntity.ok(userService.createUser(request));
    }

    @GetMapping
    public ResponseEntity<List<UserResponse>> getAllUsers(@RequestParam(required = false) ERole role) {
        return ResponseEntity.ok(role != null ? userService.getUsersByRole(role) : userService.getAllUsers());
    }

    @GetMapping("/students")
    public ResponseEntity<List<StudentSummaryResponse>> getStudents(@RequestParam(required = false) String search) {
        return ResponseEntity.ok(userService.getStudents(search));
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUser(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUser(id));
    }

    @GetMapping("/{id}/profile")
    public ResponseEntity<StudentProfileResponse> getStudentProfile(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getStudentProfile(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserResponse> updateUser(@PathVariable Long id, @RequestBody UpdateUserRequest request,
                                                    Authentication authentication) {
        Long adminId = currentUserResolver.resolve(authentication).getId();
        return ResponseEntity.ok(userService.updateUser(id, request, adminId));
    }

    @PutMapping("/{id}/reset-password")
    public ResponseEntity<UserResponse> resetUserPassword(@PathVariable Long id,
                                                          @Valid @RequestBody AdminResetPasswordRequest request,
                                                          Authentication authentication) {
        Long adminId = currentUserResolver.resolve(authentication).getId();
        return ResponseEntity.ok(userService.adminResetPassword(id, request.newPassword(), adminId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id, Authentication authentication) {
        Long adminId = currentUserResolver.resolve(authentication).getId();
        userService.deleteUser(id, adminId);
        return ResponseEntity.noContent().build();
    }
}
