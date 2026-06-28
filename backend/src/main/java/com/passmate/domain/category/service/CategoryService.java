package com.passmate.domain.category.service;

import com.passmate.domain.category.dto.CategoryDto;
import com.passmate.domain.category.entity.Category;
import com.passmate.domain.category.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryDto.Response getCategory(Long categoryId, Long deckId) {
        Category category = categoryRepository.findByIdAndDeckId(categoryId, deckId)
                .orElseThrow(() -> new IllegalArgumentException("Category not found"));
        return toResponse(category);
    }

    public CategoryDto.ListResponse getDeckCategories(Long deckId) {
        List<Category> categories = categoryRepository.findByDeckIdOrderBySortOrder(deckId);
        List<CategoryDto.Response> items = categories.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return CategoryDto.ListResponse.builder()
                .items(items)
                .build();
    }

    @Transactional
    public CategoryDto.Response createCategory(Long deckId, CategoryDto.CreateRequest request) {
        Category category = Category.builder()
                .deckId(deckId)
                .name(request.getName())
                .sortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0)
                .build();

        Category savedCategory = categoryRepository.save(category);
        return toResponse(savedCategory);
    }

    @Transactional
    public CategoryDto.Response updateCategory(Long categoryId, Long deckId, CategoryDto.UpdateRequest request) {
        Category category = categoryRepository.findByIdAndDeckId(categoryId, deckId)
                .orElseThrow(() -> new IllegalArgumentException("Category not found"));

        category.update(request.getName(), request.getSortOrder());
        Category updatedCategory = categoryRepository.save(category);
        return toResponse(updatedCategory);
    }

    @Transactional
    public void deleteCategory(Long categoryId, Long deckId) {
        Category category = categoryRepository.findByIdAndDeckId(categoryId, deckId)
                .orElseThrow(() -> new IllegalArgumentException("Category not found"));
        categoryRepository.delete(category);
    }

    private CategoryDto.Response toResponse(Category category) {
        return CategoryDto.Response.builder()
                .id(category.getId())
                .deckId(category.getDeckId())
                .name(category.getName())
                .sortOrder(category.getSortOrder())
                .createdAt(category.getCreatedAt())
                .updatedAt(category.getUpdatedAt())
                .build();
    }
}
