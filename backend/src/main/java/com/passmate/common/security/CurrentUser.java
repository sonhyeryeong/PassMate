package com.passmate.common.security;
import com.passmate.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
@Component @RequiredArgsConstructor
public class CurrentUser {
 private final UserRepository users;
 public Long id() {
  var auth = SecurityContextHolder.getContext().getAuthentication();
  if (auth == null || !(auth.getPrincipal() instanceof AccountPrincipal account)
      || !users.existsById(account.getUserId())) {
   throw new AuthenticationCredentialsNotFoundException("로그인이 필요합니다.");
  }
  return account.getUserId();
 }
}
