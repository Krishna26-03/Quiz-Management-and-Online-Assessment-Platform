package com.quizapp.controller;

import com.quizapp.dto.QuestionDtos.*;
import com.quizapp.service.QuestionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/quizzes/{quizId}/questions")
@RequiredArgsConstructor
public class QuestionController {

    private final QuestionService questionService;

    @GetMapping
    public ResponseEntity<List<QuestionAdminResponse>> getAll(@PathVariable Long quizId) {
        return ResponseEntity.ok(questionService.getQuestionsForAdmin(quizId));
    }

    @PostMapping
    public ResponseEntity<QuestionAdminResponse> add(@PathVariable Long quizId,
                                                       @Valid @RequestBody CreateQuestionRequest request) {
        return ResponseEntity.ok(questionService.addQuestion(quizId, request));
    }

    @PostMapping("/bulk")
    public ResponseEntity<List<QuestionAdminResponse>> bulkImport(@PathVariable Long quizId,
                                                                   @Valid @RequestBody BulkImportRequest request) {
        return ResponseEntity.ok(questionService.bulkImport(quizId, request));
    }

    @PutMapping("/{questionId}")
    public ResponseEntity<QuestionAdminResponse> update(@PathVariable Long quizId, @PathVariable Long questionId,
                                                         @Valid @RequestBody CreateQuestionRequest request) {
        return ResponseEntity.ok(questionService.updateQuestion(questionId, request));
    }

    @DeleteMapping("/{questionId}")
    public ResponseEntity<Void> delete(@PathVariable Long quizId, @PathVariable Long questionId) {
        questionService.deleteQuestion(questionId);
        return ResponseEntity.noContent().build();
    }
}
