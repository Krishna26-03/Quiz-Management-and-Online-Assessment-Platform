package com.quizapp.service;

import com.quizapp.dto.QuestionDtos.*;
import com.quizapp.entity.DifficultyLevel;
import com.quizapp.entity.Question;
import com.quizapp.entity.QuestionOption;
import com.quizapp.entity.QuestionType;
import com.quizapp.entity.Quiz;
import com.quizapp.exception.BadRequestException;
import com.quizapp.exception.ResourceNotFoundException;
import com.quizapp.repository.QuestionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class QuestionService {

    private final QuestionRepository questionRepository;
    private final QuizService quizService;

    @Transactional
    public QuestionAdminResponse addQuestion(Long quizId, CreateQuestionRequest req) {
        Quiz quiz = quizService.getQuizOrThrow(quizId);
        validateOptions(req);

        Question question = Question.builder()
                .quiz(quiz)
                .text(req.text())
                .type(req.type())
                .difficulty(req.difficulty() != null ? req.difficulty() : DifficultyLevel.MEDIUM)
                .marks(req.marks())
                .imageUrl(req.imageUrl())
                .codeSnippet(req.codeSnippet())
                .codeLanguage(req.codeLanguage())
                .explanation(req.explanation())
                .position(req.position() != null ? req.position() : (int) questionRepository.countByQuizId(quizId))
                .build();

        req.options().forEach(o -> question.getOptions().add(
                QuestionOption.builder()
                        .question(question)
                        .text(o.text())
                        .correct(o.correct())
                        .position(question.getOptions().size())
                        .build()
        ));

        return toAdminResponse(questionRepository.save(question));
    }

    @Transactional
    public QuestionAdminResponse updateQuestion(Long questionId, CreateQuestionRequest req) {
        Question question = findOrThrow(questionId);
        validateOptions(req);

        question.setText(req.text());
        question.setType(req.type());
        question.setDifficulty(req.difficulty() != null ? req.difficulty() : DifficultyLevel.MEDIUM);
        question.setMarks(req.marks());
        question.setImageUrl(req.imageUrl());
        question.setCodeSnippet(req.codeSnippet());
        question.setCodeLanguage(req.codeLanguage());
        question.setExplanation(req.explanation());
        if (req.position() != null) question.setPosition(req.position());

        question.getOptions().clear();
        req.options().forEach(o -> question.getOptions().add(
                QuestionOption.builder()
                        .question(question)
                        .text(o.text())
                        .correct(o.correct())
                        .position(question.getOptions().size())
                        .build()
        ));

        return toAdminResponse(questionRepository.save(question));
    }

    @Transactional
    public void deleteQuestion(Long questionId) {
        if (!questionRepository.existsById(questionId)) {
            throw new ResourceNotFoundException("Question not found");
        }
        questionRepository.deleteById(questionId);
    }

    @Transactional
    public List<QuestionAdminResponse> bulkImport(Long quizId, BulkImportRequest request) {
        return request.questions().stream()
                .map(q -> addQuestion(quizId, q))
                .toList();
    }

    public List<QuestionAdminResponse> getQuestionsForAdmin(Long quizId) {
        return questionRepository.findByQuizIdOrderByPositionAsc(quizId).stream()
                .map(this::toAdminResponse)
                .toList();
    }

    private void validateOptions(CreateQuestionRequest req) {
        if (req.options().size() < 2) {
            throw new BadRequestException("A question needs at least 2 options");
        }
        long correctCount = req.options().stream().filter(OptionRequest::correct).count();
        if (correctCount == 0) {
            throw new BadRequestException("At least one option must be marked correct");
        }
        switch (req.type()) {
            case SINGLE_CHOICE, TRUE_FALSE, IMAGE_BASED, CODE_BASED, FILL_BLANKS -> {
                if (correctCount != 1 && req.type() != QuestionType.MULTIPLE_CHOICE && req.type() != QuestionType.MATCH_FOLLOWING) {
                    if (correctCount < 1) {
                        throw new BadRequestException("At least one option must be marked correct");
                    }
                }
            }
            case MULTIPLE_CHOICE, MATCH_FOLLOWING -> { /* multiple correct options allowed */ }
        }
    }

    private Question findOrThrow(Long id) {
        return questionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found with id: " + id));
    }

    private QuestionAdminResponse toAdminResponse(Question q) {
        List<OptionResponse> options = q.getOptions().stream()
                .map(o -> new OptionResponse(o.getId(), o.getText(), o.isCorrect()))
                .toList();
        return new QuestionAdminResponse(
                q.getId(),
                q.getText(),
                q.getType(),
                q.getDifficulty(),
                q.getMarks(),
                q.getImageUrl(),
                q.getCodeSnippet(),
                q.getCodeLanguage(),
                q.getExplanation(),
                q.getPosition(),
                options
        );
    }
}
