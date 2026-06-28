package com.passmate.domain.category.controller;

import com.passmate.domain.category.dto.CategoryDto;
import com.passmate.domain.category.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/decks/{deckId}/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    public ResponseEntity<CategoryDto.ListResponse> getDeckCategories(
            @PathVariable Long deckId) {
        return ResponseEntity.ok(categoryService.getDeckCategories(deckId));
    }

    @GetMapping("/{categoryId}")
    public ResponseEntity<CategoryDto.Response> getCategory(
            @PathVariable Long deckId,
            @PathVariable Long categoryId) {
        return ResponseEntity.ok(categoryService.getCategory(categoryId, deckId));
    }

    @PostMapping
    public ResponseEntity<CategoryDto.Response> createCategory(
            @PathVariable Long deckId,
            @RequestBody CategoryDto.CreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(categoryService.createCategory(deckId, request));
    }

    @PatchMapping("/{categoryId}")
    public ResponseEntity<CategoryDto.Response> updateCategory(
            @PathVariable Long deckId,
            @PathVariable Long categoryId,
            @RequestBody CategoryDto.UpdateRequest request) {
        return ResponseEntity.ok(categoryService.updateCategory(categoryId, deckId, request));
    }

    @DeleteMapping("/{categoryId}")
    public ResponseEntity<Void> deleteCategory(
            @PathVariable Long deckId,
            @PathVariable Long categoryId) {
        categoryService.deleteCategory(categoryId, deckId);
        return ResponseEntity.noContent().build();
    }
}
