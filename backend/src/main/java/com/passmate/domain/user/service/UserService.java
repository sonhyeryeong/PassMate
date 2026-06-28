package com.passmate.domain.user.service;

import com.passmate.domain.user.dto.UserDto;
import com.passmate.domain.user.entity.User;
import com.passmate.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;

    public UserDto.Response getUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return toResponse(user);
    }

    public UserDto.ListResponse getAllUsers() {
        List<User> users = userRepository.findAll();
        List<UserDto.Response> items = users.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return UserDto.ListResponse.builder()
                .items(items)
                .build();
    }

    @Transactional
    public UserDto.Response createUser(UserDto.CreateRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already exists");
        }

        User user = User.builder()
                .email(request.getEmail())
                .nickname(request.getNickname())
                .build();

        User savedUser = userRepository.save(user);
        return toResponse(savedUser);
    }

    @Transactional
    public UserDto.Response updateUser(Long userId, UserDto.UpdateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        user.updateNickname(request.getNickname());
        User updatedUser = userRepository.save(user);
        return toResponse(updatedUser);
    }

    @Transactional
    public void deleteUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        userRepository.delete(user);
    }

    private UserDto.Response toResponse(User user) {
        return UserDto.Response.builder()
                .id(user.getId())
                .email(user.getEmail())
                .nickname(user.getNickname())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
