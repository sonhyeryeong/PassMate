package com.passmate.domain.user.controller;
import com.passmate.domain.user.dto.UserDto;
import com.passmate.domain.user.service.UserService;
import com.passmate.common.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/users") @RequiredArgsConstructor
public class UserController {
 private final UserService users;
 private final CurrentUser current;
 @GetMapping("/me") public UserDto.Response me() { return users.getUser(current.id()); }
 @PatchMapping("/me") public UserDto.Response update(@RequestBody UserDto.UpdateRequest request) {
  return users.updateUser(current.id(),request);
 }
}
