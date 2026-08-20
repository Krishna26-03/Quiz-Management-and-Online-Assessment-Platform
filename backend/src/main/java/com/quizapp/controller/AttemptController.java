package com.quizapp.controller;

import com.quizapp.dto.AttemptDtos.*;
import com.quizapp.security.CurrentUserResolver;
import com.quizapp.service.AttemptService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/attempts")
@RequiredArgsConstructor
public class AttemptController {

    private final AttemptService attemptService;
    private final CurrentUserResolver currentUserResolver;

    @PostMapping("/start/{quizId}")
    public ResponseEntity<StartAttemptResponse> start(@PathVariable Long quizId, Authentication authentication) {
        var student = currentUserResolver.resolve(authentication);
        return ResponseEntity.ok(attemptService.startAttempt(quizId, student));
    }

    // Progressive autosave - called by the client periodically / on each answer change
    @PutMapping("/{attemptId}/answer")
    public ResponseEntity<Void> saveAnswer(@PathVariable Long attemptId, @Valid @RequestBody SaveAnswerRequest request,
                                            Authentication authentication) {
        var student = currentUserResolver.resolve(authentication);
        attemptService.saveAnswer(attemptId, student, request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{attemptId}/submit")
    public ResponseEntity<AttemptResultResponse> submit(@PathVariable Long attemptId,
                                                         @RequestBody(required = false) SubmitAttemptRequest request,
                                                         Authentication authentication) {
        var student = currentUserResolver.resolve(authentication);
        return ResponseEntity.ok(attemptService.submitAttempt(attemptId, student, request));
    }

    @GetMapping("/{attemptId}/result")
    public ResponseEntity<AttemptResultResponse> getResult(@PathVariable Long attemptId, Authentication authentication) {
        var student = currentUserResolver.resolve(authentication);
        return ResponseEntity.ok(attemptService.getResult(attemptId, student));
    }

    @GetMapping("/history")
    public ResponseEntity<List<AttemptHistoryItem>> history(Authentication authentication) {
        var student = currentUserResolver.resolve(authentication);
        return ResponseEntity.ok(attemptService.getHistory(student.getId()));
    }
}
