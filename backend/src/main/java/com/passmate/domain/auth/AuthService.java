package com.passmate.domain.auth;
import com.passmate.common.security.AccountPrincipal;
import com.passmate.domain.user.entity.User;
import com.passmate.domain.user.repository.UserRepository;
import com.passmate.domain.error.InvalidRequestException;
import com.passmate.domain.error.ConflictException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.core.userdetails.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
@Service @RequiredArgsConstructor
public class AuthService implements UserDetailsService {
 private final LocalCredentialRepository credentials;
 private final UserRepository users;
 private final PasswordEncoder encoder;
 public record Signup(String loginId, String nickname, String password) {}
 public static String normalize(String id) { return id == null ? "" : id.trim().toLowerCase(Locale.ROOT); }
 @Transactional
 public void signup(Signup request) {
  String id = normalize(request.loginId());
  String name = request.nickname() == null ? "" : request.nickname().trim();
  String password = request.password();
  if (!id.matches("[a-z0-9_]{4,32}") || name.isEmpty() || name.length()>30 || password==null
    || password.length()<12 || password.length()>64 || password.getBytes(StandardCharsets.UTF_8).length>72) {
   throw new InvalidRequestException("SIGNUP_VALIDATION_ERROR", "아이디는 영문 소문자·숫자·밑줄 4~32자, 닉네임은 1~30자, 비밀번호는 12~64자(UTF-8 72바이트 이내)로 입력해 주세요.");
  }
  if(credentials.existsByLoginId(id)) throw new ConflictException("LOGIN_ID_EXISTS", "이미 사용 중인 아이디입니다.");
  User user = users.save(User.builder().nickname(name).build());
  credentials.saveAndFlush(LocalCredential.builder().userId(user.getId()).loginId(id).passwordHash(encoder.encode(password)).build());
 }
 @Override @Transactional(readOnly=true)
 public UserDetails loadUserByUsername(String loginId) {
  var credential = credentials.findByLoginId(normalize(loginId))
   .orElseThrow(()->new UsernameNotFoundException("인증 실패"));
  if(!users.existsById(credential.getUserId())) throw new UsernameNotFoundException("인증 실패");
  return new AccountPrincipal(credential.getUserId(),credential.getLoginId(),credential.getPasswordHash());
 }
}
