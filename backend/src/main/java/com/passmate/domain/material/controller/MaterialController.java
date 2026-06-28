package com.passmate.domain.material.controller;

import com.passmate.domain.material.dto.MaterialDto;
import com.passmate.domain.material.service.MaterialService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/categories/{categoryId}/materials")
@RequiredArgsConstructor
public class MaterialController {

    private final MaterialService materialService;

    @GetMapping
    public ResponseEntity<MaterialDto.ListResponse> getCategoryMaterials(
            @PathVariable Long categoryId) {
        return ResponseEntity.ok(materialService.getCategoryMaterials(categoryId));
    }

    @GetMapping("/{materialId}")
    public ResponseEntity<MaterialDto.Response> getMaterial(
            @PathVariable Long categoryId,
            @PathVariable Long materialId) {
        return ResponseEntity.ok(materialService.getMaterial(materialId, categoryId));
    }

    @PostMapping
    public ResponseEntity<MaterialDto.Response> createMaterial(
            @PathVariable Long categoryId,
            @RequestBody MaterialDto.CreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(materialService.createMaterial(categoryId, request));
    }

    @PatchMapping("/{materialId}")
    public ResponseEntity<MaterialDto.Response> updateMaterial(
            @PathVariable Long categoryId,
            @PathVariable Long materialId,
            @RequestBody MaterialDto.UpdateRequest request) {
        return ResponseEntity.ok(materialService.updateMaterial(materialId, categoryId, request));
    }

    @DeleteMapping("/{materialId}")
    public ResponseEntity<Void> deleteMaterial(
            @PathVariable Long categoryId,
            @PathVariable Long materialId) {
        materialService.deleteMaterial(materialId, categoryId);
        return ResponseEntity.noContent().build();
    }
}
