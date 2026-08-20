package com.quizapp.controller;

import com.quizapp.dto.QuizDtos.*;
import com.quizapp.security.CurrentUserResolver;
import com.quizapp.service.QuizService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/quizzes")
@RequiredArgsConstructor
public class AdminQuizController {

    private final QuizService quizService;
    private final CurrentUserResolver currentUserResolver;

    @GetMapping
    public ResponseEntity<List<QuizAdminResponse>> getAll() {
        return ResponseEntity.ok(quizService.getAllQuizzesForAdmin());
    }

    @GetMapping("/{id}")
    public ResponseEntity<QuizAdminResponse> getOne(@PathVariable Long id) {
        return ResponseEntity.ok(quizService.getQuizForAdmin(id));
    }

    @PostMapping
    public ResponseEntity<QuizAdminResponse> create(@Valid @RequestBody CreateQuizRequest request,
                                                     Authentication authentication) {
        var admin = currentUserResolver.resolve(authentication);
        return ResponseEntity.ok(quizService.createQuiz(request, admin));
    }

    @PutMapping("/{id}")
    public ResponseEntity<QuizAdminResponse> update(@PathVariable Long id, @RequestBody UpdateQuizRequest request) {
        return ResponseEntity.ok(quizService.updateQuiz(id, request));
    }

    @PatchMapping("/{id}/publish")
    public ResponseEntity<QuizAdminResponse> setPublished(@PathVariable Long id, @RequestBody Map<String, Boolean> body) {
        return ResponseEntity.ok(quizService.setPublished(id, Boolean.TRUE.equals(body.get("published"))));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<QuizAdminResponse> setStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String statusStr = body.get("status");
        com.quizapp.entity.QuizStatus status = com.quizapp.entity.QuizStatus.valueOf(statusStr.toUpperCase());
        return ResponseEntity.ok(quizService.setStatus(id, status));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        quizService.deleteQuiz(id);
        return ResponseEntity.noContent().build();
    }
}
