# 작업 규칙 (중요 — 반드시 준수)

## 이 앱은 운영 중인 서비스다
- Duty Swap App은 Brisbane Transport 드라이버들이 실제로 사용 중인 서비스다.
- 배포 주소: https://ustarman.github.io/duty-swap-app/
- `git push` → GitHub Actions가 자동 빌드 → **라이브 사이트에 바로 반영된다.**

## 변경 전 승인 규칙
1. **기존 파일을 수정하기 전에** 반드시 다음을 설명하고 승인을 받는다:
   - 어떤 파일을 수정하는지
   - 무엇이 어떻게 바뀌는지 (기존 동작과의 차이)
   - 라이브 사용자에게 미치는 영향
2. **git commit / git push는 별도 승인**을 받는다.
   - 코드 수정 승인 ≠ 배포 승인. 푸시 전에 반드시 다시 확인받는다.
3. **여러 작업을 묶어서 한 번에 승인받지 않는다.** 배포는 항상 개별 확인.
4. 읽기/조사/신규 파일 생성은 자유롭게 해도 된다 (기존 동작에 영향 없음).

## 과거 사고 사례 (재발 방지)
- 2026-06-11: 미커밋 로컬 변경(Admin PIN, 메일링 리스트)이 있는 상태에서
  자동 배포를 돌려 라이브 사이트가 옛 버전으로 덮어씌워짐.
  → 푸시 전에 `git status`로 미커밋 변경 여부를 반드시 확인할 것.

## 기술 참고사항
- Node 22 필요 (Vite 8). deploy.yml의 node-version 변경 금지.
- deploy.yml 수정은 PAT workflow 권한이 없어 푸시 불가 → 사용자가 GitHub 웹에서 직접 수정해야 함.
- 빌드 환경변수(GitHub Secrets): VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY,
  VITE_ADMIN_PIN, VITE_MAILING_PIN — 새 VITE_ 변수 추가 시 deploy.yml에도 반드시 추가.
- 푸시 전 `npm run build`로 로컬 빌드 검증 필수 (과거 미커밋 import로 CI 3연속 실패 사례 있음).
- 프리필 연동: Swap Board(duty-swap-board-metro)가 URL 파라미터로 이 앱의
  /screen1에 데이터를 전달함. Screen1.jsx의 getInitialForm() 수정 시 주의.

## 이메일 / DB 보안 구조 (2026-07-02 적용)
- 이메일은 Edge Function `send-approval-email-v2`가 담당: 클라이언트는 { type, swapId }만
  전달하고, 스왑 내용·수신자 목록은 함수가 서버 측(service role)에서 조회한다.
  Brevo 응답을 검증해 전부 실패 시 500을 반환 → 앱의 경고 배너가 작동한다.
- 구버전 함수 `send-approval-email-`는 롤백용으로 배포 유지 중 (클라이언트는 미사용).
- `shift_swap_requests`에 RLS 적용됨 (정책: supabase/rls-policies.sql 참고).
  anon 키로 DELETE 불가, Completed 레코드 UPDATE 불가. 테스트 레코드 정리는
  Supabase 대시보드 SQL Editor 또는 Management API로만 가능.
- 안전한 이메일 테스트 방법: 함수 사본을 배포해 수신자를 본인 이메일로 강제
  (recipients.forEach(r => r.email = '...')) 후 테스트, 끝나면 함수 삭제.
