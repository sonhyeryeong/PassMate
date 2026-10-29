 'use client';
import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { login, signup } from '@/lib/userApi';
import { getErrorMessage } from '@/lib/apiClient';
export function AuthForm({register=false}: {register?:boolean}) {
 const [ready,setReady]=useState(false);
 useEffect(()=>setReady(true),[]);
 const [loginId,setLoginId]=useState('');const [nickname,setNickname]=useState('');
 const [password,setPassword]=useState('');const [confirm,setConfirm]=useState('');
 const [error,setError]=useState('');const [busy,setBusy]=useState(false);
 async function submit(event:FormEvent) {
  event.preventDefault();setError('');
  if(register&&password!==confirm){setError('비밀번호가 일치하지 않습니다.');return;}
  setBusy(true);
  try {
   if(register){await signup(loginId,nickname,password);window.location.replace('/login?registered=1');}
   else {await login(loginId,password);window.location.replace('/');}
  } catch(e){setError(getErrorMessage(e,'요청을 처리하지 못했습니다.'));setBusy(false);}
 }
 return <main className="auth-panel surface-panel"><Link href="/">PassMate</Link><h1>{register?'회원가입':'로그인'}</h1>
 <form onSubmit={submit} className="stack-layout"><fieldset disabled={!ready||busy} className="auth-fields">
 <label>아이디<input required autoComplete="username" value={loginId} onChange={e=>setLoginId(e.target.value)} maxLength={32} pattern={register?'[a-zA-Z0-9_]{4,32}':undefined}/></label>
 {register&&<><p>아이디는 영문·숫자·밑줄 4~32자이며 대소문자를 구분하지 않습니다.</p><label>닉네임<input required autoComplete="nickname" value={nickname} onChange={e=>setNickname(e.target.value)} maxLength={30}/></label></>}
 <label>비밀번호<input required type="password" autoComplete={register?'new-password':'current-password'} value={password} onChange={e=>setPassword(e.target.value)} minLength={register?12:undefined} maxLength={64}/></label>
 {register&&<><p>비밀번호는 12~64자, UTF-8 기준 72바이트 이내로 입력해 주세요.</p><label>비밀번호 확인<input required type="password" autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)}/></label><p>현재 비밀번호 찾기·재설정을 지원하지 않습니다. 비밀번호를 잊으면 이 계정에 다시 로그인할 수 없습니다.</p></>}
 {error&&<p role="alert">{error}</p>}
 <button className="submit-button" disabled={busy} type="submit">{busy?'처리 중…':register?'가입하기':'로그인'}</button>
 </fieldset></form><p><Link href={register?'/login':'/signup'}>{register?'로그인으로 이동':'회원가입'}</Link></p></main>;
}
