package com.quizapp.controller;

import com.quizapp.dto.AnalyticsDtos.*;
import com.quizapp.security.CurrentUserResolver;
import com.quizapp.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;
    private final CurrentUserResolver currentUserResolver;

    @GetMapping("/api/admin/analytics/overview")
    public ResponseEntity<PlatformOverview> platformOverview() {
        return ResponseEntity.ok(analyticsService.getPlatformOverview());
    }

    @GetMapping("/api/admin/analytics/quiz/{quizId}")
    public ResponseEntity<QuizAnalytics> quizAnalytics(@PathVariable Long quizId) {
        return ResponseEntity.ok(analyticsService.getQuizAnalytics(quizId));
    }

    // Student's own performance dashboard
    @GetMapping("/api/analytics/me")
    public ResponseEntity<StudentPerformance> myPerformance(Authentication authentication) {
        Long studentId = currentUserResolver.resolve(authentication).getId();
        return ResponseEntity.ok(analyticsService.getStudentPerformance(studentId));
    }
}
