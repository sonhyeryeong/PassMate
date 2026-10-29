package com.passmate.domain.auth;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.web.csrf.CsrfToken;
@RestController @RequestMapping("/auth") @RequiredArgsConstructor
public class AuthController {
 private final AuthService auth;
 public record CsrfResponse(String token, String headerName) {}
 @GetMapping("/csrf") public CsrfResponse csrf(CsrfToken token) { return new CsrfResponse(token.getToken(), token.getHeaderName()); }
 @PostMapping("/signup") public ResponseEntity<Void> signup(@RequestBody AuthService.Signup request) {
  auth.signup(request); return ResponseEntity.status(201).build();
 }
}
