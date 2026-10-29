package com.passmate.auth;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.passmate.domain.auth.LocalCredentialRepository;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.*;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import java.util.Map;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;

@SpringBootTest(properties={"spring.datasource.url=jdbc:h2:mem:auth-tests;DB_CLOSE_DELAY=-1", "spring.jpa.hibernate.ddl-auto=create-drop"})
@AutoConfigureMockMvc
class AuthenticationIntegrationTest {
 @Autowired MockMvc mvc;
 @Autowired ObjectMapper json;
 @Autowired LocalCredentialRepository credentials;
 @Autowired org.springframework.session.jdbc.JdbcIndexedSessionRepository sessions;
 static final String PASSWORD="test-only-password!23";
 class Client {
  String cookie;
  final String address=UUID.randomUUID().toString();
  MvcResult call(MockHttpServletRequestBuilder request) throws Exception {
   if(cookie!=null) request.cookie(new Cookie("PM_SESSION",cookie));
   request.with(r->{r.setRemoteAddr(address);return r;});
   var result=mvc.perform(request).andReturn();
   for(String header:result.getResponse().getHeaders("Set-Cookie")) {
    if(header.startsWith("PM_SESSION=")) cookie=header.split(";",2)[0].substring("PM_SESSION=".length());
   }
   return result;
  }
  String csrf() throws Exception {return body(call(get("/auth/csrf"))).get("token").asText();}
  MvcResult write(MockHttpServletRequestBuilder request) throws Exception {return call(request.header("X-CSRF-TOKEN",csrf()));}
  MvcResult postJson(String path,Object value) throws Exception {return write(post(path).contentType("application/json").content(json.writeValueAsBytes(value)));}
  String register() throws Exception {
   String id="u_"+UUID.randomUUID().toString().replace("-", "").substring(0,20);
   assertEquals(201,postJson("/auth/signup",Map.of("loginId",id,"nickname","학습자","password",PASSWORD)).getResponse().getStatus());
   return id;
  }
  void loginAs(String id) throws Exception {assertEquals(204,write(post("/auth/login").param("loginId",id).param("password",PASSWORD)).getResponse().getStatus());}
  JsonNode create(String path,Object value) throws Exception {
   var result=postJson(path,value);assertEquals(201,result.getResponse().getStatus(),result.getResponse().getContentAsString());return body(result);
  }
 }
 JsonNode body(MvcResult result) throws Exception {return json.readTree(result.getResponse().getContentAsByteArray());}
 @Test void signupLoginCsrfRotationLogoutAndOldRoutes() throws Exception {
  var client=new Client();
  assertEquals(401,client.call(get("/users/me")).getResponse().getStatus());
  assertEquals(403,client.call(post("/auth/signup").contentType("application/json").content("{}")).getResponse().getStatus());
  String id=client.register();
  assertNotEquals(PASSWORD,credentials.findByLoginId(id).orElseThrow().getPasswordHash());
  assertEquals(409,client.postJson("/auth/signup",Map.of("loginId",id.toUpperCase(),"nickname","다른 이름","password",PASSWORD)).getResponse().getStatus());
  assertEquals(401,client.write(post("/auth/login").param("loginId",id).param("password","wrong")).getResponse().getStatus());
  String before=client.cookie;
  client.loginAs(id.toUpperCase());
  assertNotEquals(before,client.cookie);
  assertEquals(200,client.call(get("/users/me")).getResponse().getStatus());
  assertEquals(404,client.call(get("/users")).getResponse().getStatus());
  assertEquals(400,client.call(get("/decks").param("userId","1")).getResponse().getStatus());
  assertEquals(403,client.call(post("/auth/logout")).getResponse().getStatus());
  String loggedIn=client.cookie;
  assertEquals(204,client.write(post("/auth/logout")).getResponse().getStatus());
  client.cookie=loggedIn;
  assertEquals(401,client.call(get("/users/me")).getResponse().getStatus());
 }
 @Test void allResourceBoundariesRejectOtherAccountWithoutMutation() throws Exception {
  var owner=new Client();owner.loginAs(owner.register());
  var stranger=new Client();stranger.loginAs(stranger.register());
  long deck=owner.create("/decks",Map.of("name","본인 폴더")).get("id").asLong();
  long category=owner.create("/decks/"+deck+"/categories",Map.of("name","기본","sortOrder",0)).get("id").asLong();
  long material=owner.create("/categories/"+category+"/materials",Map.of("title","세트")).get("id").asLong();
  long card=owner.create("/materials/"+material+"/cards",Map.of("front","질문","back","답변")).get("id").asLong();
  long review=owner.create("/reviews/cards/"+card,Map.of("result","GOOD")).get("id").asLong();
  String[] reads={"/decks/"+deck,"/decks/"+deck+"/categories","/decks/"+deck+"/categories/"+category,
   "/categories/"+category+"/materials","/categories/"+category+"/materials/"+material,
   "/materials/"+material+"/cards","/materials/"+material+"/cards/"+card,
   "/reviews/"+review,"/reviews/cards/"+card,"/reviews/today?materialId="+material};
  for(String path:reads) assertEquals(404,stranger.call(get(path)).getResponse().getStatus(),path);
  Map<String,Object> update=Map.of("name","수정","title","수정","front","수정","back","수정");
  String[] resources={reads[0],reads[2],reads[4],reads[6]};
  for(String path:resources) {
   assertEquals(404,stranger.write(patch(path).contentType("application/json").content(json.writeValueAsBytes(update))).getResponse().getStatus(),path);
   assertEquals(404,stranger.write(delete(path)).getResponse().getStatus(),path);
  }
  for(String path:new String[]{reads[1],reads[3],reads[3]+"/with-cards",reads[5],"/reviews/cards/"+card}) {
   assertEquals(404,stranger.postJson(path,Map.of("name","침입","title","침입","front","침입","back","침입","result","GOOD")).getResponse().getStatus(),path);
  }
  assertEquals(0,body(stranger.call(get("/decks"))).get("items").size());
  assertEquals(0,body(stranger.call(get("/reviews/history"))).get("items").size());
  assertEquals("질문",body(owner.call(get(reads[6]))).get("front").asText());
  assertEquals(1,body(owner.call(get("/reviews/history"))).get("items").size());
  assertEquals(204,owner.write(delete("/decks/"+deck)).getResponse().getStatus());
  assertEquals(0,body(owner.call(get("/reviews/history"))).get("items").size());
 }
 @Test void sessionIsRejectedAfterAbsoluteLifetime() throws Exception {
  var client=new Client();client.loginAs(client.register());
  String sessionId=new String(java.util.Base64.getDecoder().decode(client.cookie),java.nio.charset.StandardCharsets.UTF_8);
  var session=sessions.findById(sessionId);
  assertNotNull(session);
  ((org.springframework.session.Session) session).setAttribute("authenticatedAt",System.currentTimeMillis()-86400001L);
  sessions.save(session);
  assertEquals(401,client.call(get("/users/me")).getResponse().getStatus());
  assertNull(sessions.findById(sessionId));
 }
 @Test void weakPasswordsAreRejectedAndAuthRequestsAreBounded() throws Exception {
  var client=new Client();
  assertEquals(400,client.postJson("/auth/signup",Map.of("loginId","valid_id","nickname","이름","password","short")).getResponse().getStatus());
  for(int i=0;i<29;i++) client.postJson("/auth/signup",Map.of("loginId","x","nickname","이름","password","short"));
  assertEquals(429,client.postJson("/auth/signup",Map.of()).getResponse().getStatus());
 }
}
