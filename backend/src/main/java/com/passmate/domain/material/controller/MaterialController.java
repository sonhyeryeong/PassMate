package com.passmate.domain.material.controller;

import com.passmate.domain.material.dto.MaterialDto;
import com.passmate.domain.material.service.MaterialService;
import lombok.RequiredArgsConstructor;
import com.passmate.common.security.CurrentUser;
import com.passmate.common.security.Ownership;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/categories/{categoryId}/materials")
@RequiredArgsConstructor
public class MaterialController {
    private final CurrentUser currentUser;
    private final Ownership ownership;


    private final MaterialService materialService;

    @GetMapping
    public ResponseEntity<MaterialDto.ListResponse> getCategoryMaterials(
            @PathVariable Long categoryId) {
        Long userId = currentUser.id();
        ownership.category(categoryId);
        return ResponseEntity.ok(materialService.getCategoryMaterials(categoryId));
    }

    @GetMapping("/{materialId}")
    public ResponseEntity<MaterialDto.Response> getMaterial(
            @PathVariable Long categoryId,
            @PathVariable Long materialId) {
        Long userId = currentUser.id();
        ownership.category(categoryId);
        return ResponseEntity.ok(materialService.getMaterial(materialId, categoryId));
    }

    @PostMapping
    public ResponseEntity<MaterialDto.Response> createMaterial(
            @PathVariable Long categoryId,
            @RequestBody MaterialDto.CreateRequest request) {
        Long userId = currentUser.id();
        ownership.category(categoryId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(materialService.createMaterial(categoryId, request));
    }

    @PostMapping("/with-cards")
    public ResponseEntity<MaterialDto.WithCardsResponse> createMaterialWithCards(
            @PathVariable Long categoryId,
            @RequestBody MaterialDto.CreateWithCardsRequest request) {
        Long userId = currentUser.id();
        ownership.category(categoryId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(materialService.createMaterialWithCards(categoryId, request));
    }

    @PatchMapping("/{materialId}")
    public ResponseEntity<MaterialDto.Response> updateMaterial(
            @PathVariable Long categoryId,
            @PathVariable Long materialId,
            @RequestBody MaterialDto.UpdateRequest request) {
        Long userId = currentUser.id();
        ownership.category(categoryId);
        return ResponseEntity.ok(materialService.updateMaterial(materialId, categoryId, request));
    }

    @DeleteMapping("/{materialId}")
    public ResponseEntity<Void> deleteMaterial(
            @PathVariable Long categoryId,
            @PathVariable Long materialId) {
        Long userId = currentUser.id();
        ownership.category(categoryId);
        materialService.deleteMaterial(materialId, categoryId, userId);
        return ResponseEntity.noContent().build();
    }
}
