package com.passmate.common.security;
import java.util.List;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
public class AccountPrincipal extends org.springframework.security.core.userdetails.User {
 private static final long serialVersionUID = 1L;
 private final Long userId;
 public AccountPrincipal(Long userId, String loginId, String hash) {
  super(loginId, hash, List.of(new SimpleGrantedAuthority("ROLE_USER")));
  this.userId = userId;
 }
 public Long getUserId() { return userId; }
}
