package com.passmate.domain.material.service;

import com.passmate.domain.material.dto.MaterialDto;
import com.passmate.domain.material.entity.Material;
import com.passmate.domain.material.repository.MaterialRepository;
import com.passmate.domain.flashcard.repository.FlashCardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MaterialService {

    private final MaterialRepository materialRepository;
    private final FlashCardRepository flashCardRepository;

    public MaterialDto.Response getMaterial(Long materialId, Long categoryId) {
        Material material = materialRepository.findByIdAndCategoryId(materialId, categoryId)
                .orElseThrow(() -> new IllegalArgumentException("Material not found"));
        return toResponse(material);
    }

    public MaterialDto.ListResponse getCategoryMaterials(Long categoryId) {
        List<Material> materials = materialRepository.findByCategoryId(categoryId);
        List<MaterialDto.Response> items = materials.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return MaterialDto.ListResponse.builder()
                .items(items)
                .build();
    }

    @Transactional
    public MaterialDto.Response createMaterial(Long categoryId, MaterialDto.CreateRequest request) {
        Material material = Material.builder()
                .categoryId(categoryId)
                .title(request.getTitle())
                .content(request.getContent())
                .build();

        Material savedMaterial = materialRepository.save(material);
        return toResponse(savedMaterial);
    }

    @Transactional
    public MaterialDto.Response updateMaterial(Long materialId, Long categoryId, MaterialDto.UpdateRequest request) {
        Material material = materialRepository.findByIdAndCategoryId(materialId, categoryId)
                .orElseThrow(() -> new IllegalArgumentException("Material not found"));

        material.update(request.getTitle(), request.getContent());
        Material updatedMaterial = materialRepository.save(material);
        return toResponse(updatedMaterial);
    }

    @Transactional
    public void deleteMaterial(Long materialId, Long categoryId) {
        Material material = materialRepository.findByIdAndCategoryId(materialId, categoryId)
                .orElseThrow(() -> new IllegalArgumentException("Material not found"));
        flashCardRepository.deleteByMaterialId(materialId);
        materialRepository.delete(material);
    }

    private MaterialDto.Response toResponse(Material material) {
        return MaterialDto.Response.builder()
                .id(material.getId())
                .categoryId(material.getCategoryId())
                .title(material.getTitle())
                .content(material.getContent())
                .createdAt(material.getCreatedAt())
                .updatedAt(material.getUpdatedAt())
                .build();
    }
}
