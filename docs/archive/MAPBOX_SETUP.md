# Mapbox 통합 설정 가이드

## 📦 설치 완료

```bash
npm install mapbox-gl react-map-gl supercluster
```

## 🔑 Mapbox 토큰 발급

1. **Mapbox 계정 생성**
   - https://account.mapbox.com/ 방문
   - "Sign Up" 클릭하여 무료 계정 생성

2. **액세스 토큰 생성**
   - 대시보드에서 "Access tokens" 섹션으로 이동
   - "Create a token" 클릭
   - 토큰 이름: "zzik-live-production"
   - 권한 선택:
     - ✅ `styles:read`
     - ✅ `fonts:read`
     - ✅ `datasets:read`
     - ✅ `geocoding:read` (선택사항)
   - "Create token" 클릭
   - **토큰 복사** (한 번만 표시됨)

3. **환경 변수 설정**

   ```bash
   # .env.local 파일 수정
   NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1Ijoie...your_actual_token_here...}
   ```

4. **개발 서버 재시작**
   ```bash
   npm run dev
   ```

## 🗺️ 구현된 기능

### 1. MapView 컴포넌트 (`components/pass/MapView.tsx`)

- ✅ Mapbox GL JS 통합
- ✅ 반응형 뷰포트
- ✅ 핀 렌더링 및 클릭 이벤트
- ✅ 클러스터링 (Supercluster)
- ✅ 내비게이션 컨트롤 (확대/축소/나침반)
- ✅ 위치 추적 (Geolocate)
- ✅ 내 위치 FAB 버튼
- ✅ 접근성 (ARIA labels)
- ✅ 애니메이션 (pin-pulse, hover/active)

### 2. 클러스터링 로직 (`lib/map-clustering.ts`)

- ✅ Supercluster 래퍼 함수
- ✅ GeoJSON Feature 변환
- ✅ 동적 클러스터 계산
- ✅ 클러스터 확장 줌 레벨
- ✅ 클러스터 자식 노드 추출

### 3. 전체 지도 페이지 (`app/(tabs)/pass/map/page.tsx`)

- ✅ 풀스크린 지도
- ✅ 뒤로 가기 헤더
- ✅ PlaceSheet 통합
- ✅ 핀 → PlaceSheet → 오퍼 플로우
- ✅ Analytics 이벤트 추적
- ✅ 5개 이상 핀으로 클러스터링 테스트

## 🎯 사용 방법

### Pass 페이지 (MiniMap)

```typescript
// app/(tabs)/pass/page.tsx
import MiniMap from '@/components/pass/MiniMap';

<MiniMap
  pins={mockPins}
  onPinTap={handlePinTap}
  onMyLocation={handleMyLocation}
  className="h-[300px]"
/>
```

### 전체 지도 페이지

```typescript
// 사용자가 "전체 지도 보기" 클릭 시
router.push('/pass/map');

// 또는 직접 URL 접근
// http://localhost:3000/pass/map
```

### MapView 컴포넌트 직접 사용

```typescript
import MapView from '@/components/pass/MapView';

<MapView
  pins={pins}
  onPinTap={(placeId) => {
    console.log('Pin tapped:', placeId);
    openPlaceSheet(placeId);
  }}
  className="h-[600px]"
  defaultLat={37.5665}
  defaultLng={126.978}
  defaultZoom={14}
/>
```

## 📊 클러스터링 동작

### 줌 레벨별 동작

- **Zoom 0-13**: 핀들이 클러스터로 그룹화
- **Zoom 14-16**: 클러스터 점차 해제
- **Zoom 17+**: 모든 핀 개별 표시

### 클러스터 설정 (`lib/map-clustering.ts`)

```typescript
const index = new Supercluster({
  radius: 60, // 클러스터 반경 (픽셀)
  maxZoom: 16, // 최대 클러스터링 줌
  minZoom: 0, // 최소 클러스터링 줌
  minPoints: 2, // 최소 클러스터 포인트 수
});
```

### 클러스터 클릭 시

```typescript
// 자동으로 확장 줌 레벨로 이동
const expansionZoom = getClusterExpansionZoom(index, clusterId);
map.flyTo({ zoom: expansionZoom, duration: 500 });
```

## 🚨 토큰 미설정 시

토큰이 없거나 `your_mapbox_token_here`인 경우:

```
┌─────────────────────────────────────┐
│ Mapbox 토큰이 설정되지 않았습니다    │
│ .env.local에                        │
│ NEXT_PUBLIC_MAPBOX_TOKEN을          │
│ 설정해주세요                        │
└─────────────────────────────────────┘
```

## 🔧 커스터마이징

### 맵 스타일 변경

```typescript
// MapView.tsx
mapStyle = 'mapbox://styles/mapbox/streets-v12'; // 기본
mapStyle = 'mapbox://styles/mapbox/dark-v11'; // 다크 모드
mapStyle = 'mapbox://styles/mapbox/light-v11'; // 라이트 모드
mapStyle = 'mapbox://styles/mapbox/satellite-v9'; // 위성
```

### 클러스터 색상/크기 조정

```typescript
// MapView.tsx - 클러스터 마커
<button
  style={{
    width: `${30 + (pointCount || 0) / pins.length * 20}px`,
    height: `${30 + (pointCount || 0) / pins.length * 20}px`,
  }}
  className="bg-[var(--brand)] text-white"
>
  {pointCount}
</button>
```

### 개별 핀 스타일

```typescript
// MapView.tsx - 개별 핀
<PinIcon
  size={32}
  className="text-[var(--brand)]"
  fill="currentColor"
  strokeWidth={1.5}
/>
```

## 📱 반응형 설정

```typescript
// 모바일: 전체 화면
<MapView className="h-screen" />

// 데스크톱: 고정 높이
<MapView className="h-[600px]" />

// Pass 페이지: 미니맵
<MiniMap className="h-[300px]" />
```

## 🎨 접근성

```typescript
// 핀 버튼
aria-label={`장소 ${pinId}`}

// 클러스터 버튼
aria-label={`${pointCount}개 장소 클러스터`}

// 내 위치 버튼
aria-label="내 위치로 이동"

// 뒤로 가기 버튼
aria-label="뒤로 가기"
```

## 🧪 테스트 방법

1. **개발 서버 실행**

   ```bash
   cd /home/user/webapp && npm run dev
   ```

2. **Pass 탭 접근**
   - http://localhost:3000/pass
   - MiniMap 표시 확인

3. **"전체 지도 보기" 클릭**
   - http://localhost:3000/pass/map
   - 풀스크린 지도 렌더링 확인

4. **클러스터링 테스트**
   - 줌 아웃: 핀들이 클러스터로 합쳐짐
   - 클러스터 클릭: 확대되며 해제
   - 줌 인: 개별 핀 표시

5. **핀 클릭**
   - PlaceSheet 하프 높이로 표시
   - 장소 정보 + 오퍼 리스트
   - 오퍼 CTA 클릭 → `/offers` 이동

6. **내 위치 버튼**
   - 위치 권한 요청
   - 허용 시: 지도 중심 이동
   - 거부 시: 기본 위치 유지

## 📈 성능 최적화

### 이미 적용된 최적화

- ✅ `useCallback` for cluster calculation
- ✅ Debounced viewport updates
- ✅ Lazy cluster recalculation (onMoveEnd)
- ✅ CSS GPU acceleration (transform/opacity)
- ✅ Marker virtualization (only visible markers)

### 추가 최적화 (선택사항)

```typescript
// 1. Throttle move events
import { throttle } from 'lodash';
const throttledUpdate = throttle(updateClusters, 100);

// 2. Memoize cluster calculations
const clustersCache = useMemo(() => getClusters(...), [deps]);

// 3. Virtual scrolling for markers
// (Mapbox already does this)
```

## 🔗 관련 파일

```
components/
  pass/
    MapView.tsx              # 핵심 지도 컴포넌트
    MiniMap.tsx              # Pass 탭 미니맵
    PlaceSheet.tsx           # 장소 정보 시트

lib/
  map-clustering.ts          # Supercluster 로직

app/
  (tabs)/
    pass/
      page.tsx               # Pass 탭 (MiniMap)
      map/
        page.tsx             # 전체 지도 페이지

.env.local                   # 환경 변수 (토큰)
```

## 🎉 완료 확인

- [x] Mapbox GL JS 설치
- [x] react-map-gl 설치
- [x] supercluster 설치
- [x] MapView 컴포넌트 구현
- [x] 클러스터링 로직 구현
- [x] 전체 지도 페이지 구현
- [x] PlaceSheet 통합
- [x] Analytics 이벤트 추적
- [x] 접근성 ARIA labels
- [x] 반응형 디자인
- [x] 내 위치 기능
- [x] 뒤로 가기 네비게이션
- [x] 환경 변수 설정 가이드
- [x] 에러 처리 (토큰 미설정)

## 🚀 배포 전 체크리스트

- [ ] `.env.local`에 실제 Mapbox 토큰 설정
- [ ] `.env.production`에 프로덕션 토큰 복사
- [ ] Vercel/Netlify 환경 변수에 토큰 등록
- [ ] 프로덕션 URL 허용 목록에 추가 (Mapbox 대시보드)
- [ ] 맵 렌더링 테스트 (실제 토큰)
- [ ] 클러스터링 동작 확인
- [ ] 핀 → PlaceSheet 플로우 테스트
- [ ] Analytics 이벤트 발생 확인
- [ ] 모바일 반응형 확인

---

**다음 단계**: `.env.local`에 실제 Mapbox 토큰을 설정하고 개발 서버를 재시작하세요.
