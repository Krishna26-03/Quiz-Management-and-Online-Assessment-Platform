package com.quizapp.controller;

import com.quizapp.dto.QuizDtos.QuizStudentSummary;
import com.quizapp.security.CurrentUserResolver;
import com.quizapp.service.QuizService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/quizzes")
@RequiredArgsConstructor
public class StudentQuizController {

    private final QuizService quizService;
    private final CurrentUserResolver currentUserResolver;

    @GetMapping
    public ResponseEntity<List<QuizStudentSummary>> browse(Authentication authentication) {
        Long studentId = currentUserResolver.resolve(authentication).getId();
        return ResponseEntity.ok(quizService.getAvailableQuizzesForStudent(studentId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<QuizStudentSummary> getOne(@PathVariable Long id, Authentication authentication) {
        Long studentId = currentUserResolver.resolve(authentication).getId();
        return ResponseEntity.ok(quizService.getQuizStudentSummary(id, studentId));
    }
}
