package com.quizapp.service;

import com.quizapp.dto.QuizDtos.QuizAdminResponse;
import com.quizapp.entity.Category;
import com.quizapp.entity.Quiz;
import com.quizapp.exception.BadRequestException;
import com.quizapp.exception.ResourceNotFoundException;
import com.quizapp.repository.CategoryRepository;
import com.quizapp.repository.QuestionRepository;
import com.quizapp.repository.QuizRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final QuizRepository quizRepository;
    private final QuestionRepository questionRepository;

    public List<Category> getAll() {
        return categoryRepository.findAll();
    }

    @Transactional
    public Category create(String name, String description) {
        if (categoryRepository.existsByNameIgnoreCase(name)) {
            throw new BadRequestException("A category with this name already exists");
        }
        return categoryRepository.save(Category.builder().name(name).description(description).build());
    }

    @Transactional
    public Category update(Long id, String name, String description) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
        if (name != null && !name.isBlank()) category.setName(name);
        if (description != null) category.setDescription(description);
        return categoryRepository.save(category);
    }

    @Transactional
    public void delete(Long id) {
        if (!categoryRepository.existsById(id)) {
            throw new ResourceNotFoundException("Category not found");
        }
        categoryRepository.deleteById(id);
    }

    public List<QuizAdminResponse> getQuizzesByCategory(Long categoryId) {
        if (!categoryRepository.existsById(categoryId)) {
            throw new ResourceNotFoundException("Category not found");
        }
        return quizRepository.findByCategoryId(categoryId).stream()
                .map(this::toAdminResponse)
                .toList();
    }

    private QuizAdminResponse toAdminResponse(Quiz quiz) {
        return new QuizAdminResponse(
                quiz.getId(), quiz.getTitle(), quiz.getDescription(),
                quiz.getCategory() != null ? quiz.getCategory().getName() : null,
                quiz.getDifficulty(), quiz.getDurationMinutes(), quiz.getMarksPerQuestion(),
                quiz.getNegativeMarksPerQuestion(), quiz.getPassPercentage(), quiz.getMaxAttempts(),
                quiz.isShuffleQuestions(), quiz.isShuffleOptions(), quiz.getStatus(), quiz.isPublished(),
                quiz.getStartsAt(), quiz.getEndsAt(),
                (int) questionRepository.countByQuizId(quiz.getId()),
                quiz.getCreatedBy() != null ? quiz.getCreatedBy().getFullName() : null,
                quiz.getCreatedAt()
        );
    }
}
