# 🧹 GitHub 저장소 정리 가이드

## 현재 상태

**저장소**: https://github.com/josihu0604-lang/ASDASD

### 브랜치 현황

- ✅ `main` - 메인 브랜치
- ✅ `genspark_ai_developer` - AI 개발 브랜치 (기본 브랜치)
- ⚠️ `be/day3-4-core` - 백엔드 개발 완료 (정리 필요)
- ⚠️ `feature/db-setup-smoke` - DB 설정 완료 (정리 필요)
- ⚠️ `feature/vercel-preview-system` - 프리뷰 시스템 (정리 필요)

---

## 📋 정리 체크리스트

### 1. 저장소 정보 업데이트 ✅

GitHub 웹사이트에서 수동으로 업데이트:

- [ ] **About** 섹션 편집
  - Description: `🌍 ZZIK LIVE - Location-based real-time experience platform with triple verification (GPS × QR × Receipt)`
  - Website: `https://zzik.live`
  - Topics: `nextjs`, `mapbox`, `geolocation`, `qr-code`, `real-time`, `typescript`, `postgis`, `privacy-first`

### 2. 기본 브랜치 설정 ✅

현재 기본 브랜치가 `genspark_ai_developer`로 설정되어 있습니다.

**권장 사항**: `main`을 기본 브랜치로 변경

- [ ] GitHub Settings → Branches → Default branch
- [ ] `main`으로 변경
- [ ] `genspark_ai_developer`의 변경사항을 `main`으로 머지

### 3. 브랜치 정리

#### 정리할 브랜치

```bash
# GitHub 웹사이트에서 또는 CLI로 삭제

# 로컬에서 확인
git branch -r

# 원격 브랜치 삭제 (GitHub 웹에서 하는 것을 권장)
# git push origin --delete be/day3-4-core
# git push origin --delete feature/db-setup-smoke
# git push origin --delete feature/vercel-preview-system
```

#### 브랜치 삭제 전 확인사항

- [ ] PR이 머지되었는지 확인
- [ ] 중요한 커밋이 main에 포함되었는지 확인
- [ ] 팀원에게 알림

### 4. PR 정리

**현재 오픈 PR**: #1

- [ ] 제목과 설명이 명확한지 확인
- [ ] 리뷰어 할당
- [ ] 라벨 추가 (`enhancement`, `setup`, `infrastructure`)
- [ ] 마일스톤 설정 (Phase 1)

### 5. 이슈 관리

- [ ] 템플릿 설정 확인 (✅ 이미 완료)
- [ ] 초기 이슈 생성
  - [ ] #20 - DB Setup & Smoke Tests
  - [ ] #19 - Security Headers & Logging
  - [ ] #16 - UX Entry Complete
  - [ ] #17 - Mapbox Core Integration
  - [ ] #18 - QR & Wallet Implementation

### 6. GitHub Actions / Workflows

**현재 상태**: 워크플로우 파일 생성됨 (권한 문제로 푸시 안됨)

#### 해결 방법

1. **옵션 A**: GitHub App 권한 업데이트
   - Settings → Integrations → GitHub Apps
   - Workflow 권한 활성화

2. **옵션 B**: 수동으로 GitHub에서 생성
   - Actions 탭에서 새 워크플로우 생성
   - 로컬의 `.github/workflows/` 파일 내용 복사

#### 필요한 워크플로우

- [ ] `ci.yml` - CI/CD 파이프라인
- [ ] `codeql.yml` - 보안 스캔
- [ ] `gitleaks.yml` - 시크릿 감지
- [ ] `release-please.yml` - 자동 릴리즈

### 7. Branch Protection Rules

`main` 브랜치 보호 설정:

- [ ] Require pull request reviews (1명 이상)
- [ ] Require status checks to pass
  - [ ] CI
  - [ ] CodeQL
  - [ ] Gitleaks
- [ ] Require branches to be up to date
- [ ] Include administrators (선택사항)

### 8. 저장소 설정

#### General Settings

- [ ] Features
  - [x] Issues
  - [x] Projects
  - [x] Wiki (필요시)
  - [x] Discussions (선택사항)

#### Security

- [ ] Private vulnerability reporting 활성화
- [ ] Dependabot alerts 활성화
- [ ] Dependabot security updates 활성화
- [ ] Code scanning (CodeQL) 활성화
- [ ] Secret scanning 활성화

#### Collaborators

- [ ] 팀원 추가
- [ ] 역할 할당 (Write, Maintain, Admin)

---

## 🚀 빠른 정리 스크립트

로컬에서 실행:

```bash
# 브랜치 정리 스크립트 실행
chmod +x scripts/cleanup-branches.sh
./scripts/cleanup-branches.sh

# 원격 추적 브랜치 정리
git fetch --prune
git remote prune origin
```

---

## 📊 정리 후 구조

```
ASDASD (Repository)
├── main (default branch)
├── genspark_ai_developer (development)
│
├── Issues
│   ├── #16 - UX Entry
│   ├── #17 - Mapbox Core
│   ├── #18 - QR & Wallet
│   ├── #19 - Security
│   └── #20 - DB Setup
│
├── Pull Requests
│   └── #1 - Repository Structure Setup
│
├── Projects (선택사항)
│   └── ZZIK LIVE - Phase 1
│
└── Actions
    ├── CI/CD
    ├── Security Scanning
    └── Release Management
```

---

## 🔗 유용한 링크

- **저장소**: https://github.com/josihu0604-lang/ASDASD
- **PR #1**: https://github.com/josihu0604-lang/ASDASD/pull/1
- **Issues**: https://github.com/josihu0604-lang/ASDASD/issues
- **Actions**: https://github.com/josihu0604-lang/ASDASD/actions
- **Settings**: https://github.com/josihu0604-lang/ASDASD/settings

---

## ✅ 완료 후 확인사항

- [ ] README.md가 명확하고 최신 상태
- [ ] 불필요한 브랜치 삭제됨
- [ ] 브랜치 보호 규칙 설정됨
- [ ] CI/CD 워크플로우 작동
- [ ] 보안 기능 활성화됨
- [ ] 이슈 템플릿 작동
- [ ] PR 템플릿 작동
- [ ] Dependabot 설정됨

---

**마지막 업데이트**: 2025-11-13
