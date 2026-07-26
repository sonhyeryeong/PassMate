package com.passmate.domain.user.service;

import com.passmate.domain.error.ConflictException;
import com.passmate.domain.error.InvalidRequestException;
import com.passmate.domain.error.ResourceNotFoundException;
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
                .orElseThrow(() -> new ResourceNotFoundException("USER_NOT_FOUND", "프로필을 찾을 수 없습니다."));
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
        validateCreateRequest(request);
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ConflictException("EMAIL_ALREADY_EXISTS", "이미 사용 중인 이메일입니다.");
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
        if (request == null || request.getNickname() == null || request.getNickname().isBlank()) {
            throw new InvalidRequestException("USER_VALIDATION_ERROR", "닉네임을 입력해 주세요.");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("USER_NOT_FOUND", "프로필을 찾을 수 없습니다."));

        user.updateNickname(request.getNickname());
        User updatedUser = userRepository.save(user);
        return toResponse(updatedUser);
    }

    @Transactional
    public void deleteUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("USER_NOT_FOUND", "프로필을 찾을 수 없습니다."));
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

    private void validateCreateRequest(UserDto.CreateRequest request) {
        if (request == null || request.getEmail() == null || request.getEmail().isBlank()) {
            throw new InvalidRequestException("USER_VALIDATION_ERROR", "이메일을 입력해 주세요.");
        }
        if (request.getNickname() == null || request.getNickname().isBlank()) {
            throw new InvalidRequestException("USER_VALIDATION_ERROR", "닉네임을 입력해 주세요.");
        }
    }
}
