package com.quizapp.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "questions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_id", nullable = false)
    private Quiz quiz;

    @Column(nullable = false, length = 4000)
    private String text;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private QuestionType type = QuestionType.SINGLE_CHOICE;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    @Builder.Default
    private DifficultyLevel difficulty = DifficultyLevel.MEDIUM;

    // Optional custom marks for this question (null falls back to quiz.marksPerQuestion)
    private Double marks;

    // For image-based questions
    @Column(length = 1000)
    private String imageUrl;

    // For code-based questions
    @Column(length = 4000)
    private String codeSnippet;

    @Column(length = 50)
    private String codeLanguage;

    // optional explanation shown to the student after results are published
    @Column(length = 2000)
    private String explanation;

    // display order within the quiz
    @Builder.Default
    private Integer position = 0;

    @OneToMany(mappedBy = "question", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<QuestionOption> options = new ArrayList<>();
}
