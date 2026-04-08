# [SOKOBAN 3D](https://jik-k.github.io/SOKOBAN/)

> HTML5 + Three.js 기반의 3D 소코반 퍼즐 게임

<br/>

## 소개

클래식 소코반(Sokoban) 규칙을 3D 공간으로 재해석한 웹 퍼즐 게임입니다.  
빨간 공을 조종해 초록 블록을 파란 목표칸 위로 밀어 넣으면 스테이지가 클리어됩니다.  
별도 설치 없이 브라우저에서 바로 실행되며, 마우스 드래그로 시점을 자유롭게 돌려가며 퍼즐을 풀 수 있습니다.

<br/>

## 개발 환경

- **언어** — HTML5, CSS3, Vanilla JavaScript (ES6+)
- **프레임워크** — 없음 (순수 웹 표준)
- **렌더링** — Three.js r128 (WebGL)

<br/>

## 사용 라이브러리

| 라이브러리                       | 버전 | 용도                   |
| -------------------------------- | ---- | ---------------------- |
| [Three.js](https://threejs.org/) | r128 | 3D 렌더링 엔진         |
| Google Fonts                     | —    | Orbitron, Noto Sans KR |

외부 의존성은 CDN으로 로드합니다.

**클리어 조건** — 모든 🟩 초록 블록을 🟦 파란 목표칸 위에 올려놓기  
**이동 제약** — 🟩 블록은 흰 벽이나 다른 블록 방향으로는 밀 수 없음

<br/>

## 프로젝트 구조

```
sokoban/
├── index.html              # 메인 허브 (스테이지 선택 화면)
│
├── stages/
│   ├── stage1.html         # 각 스테이지 페이지
│   ├── stage2.html
│   ├── stage3.html
│   ├── stage4.html
│   └── stage5.html
│
├── css/
│   ├── base.css            # CSS 변수 / 리셋 / body 기반 설정
│   ├── hud.css             # 인게임 UI (헤더, D패드, 오버레이 등)
│   └── index.css           # 메인 허브 전용 스타일
│
└── js/
    ├── constants.js        # 게임 전역 상수 (색상, 치수, 카메라, 조명 등)
    ├── scene.js            # Three.js 씬 빌드 (타일, 블록, 파티클)
    ├── orbit.js            # 마우스/터치 카메라 오비트 컨트롤
    ├── input.js            # 키보드·D패드·스와이프 입력 + localStorage
    └── game3d.js           # 메인 게임 클래스 (로직·렌더루프 조합)
```

<br/>

## 핵심 기술 및 구현

### Three.js 3D 렌더링

- **WebGL 렌더러** — PCFSoft 그림자맵, ACES Filmic 톤매핑으로 영화적 조명 구현
- **씬 구성** — 흰 벽(BoxGeometry), 파란 목표칸(발광 emissive), 초록 블록(엣지라인 + 하이라이트 캡), 빨간 공(SphereGeometry + 글로우 링)
- **조명** — AmbientLight + DirectionalLight(그림자) + PointLight ×2(청록·파랑 강조), 실시간 펄스 애니메이션

### 오비트 컨트롤 (`orbit.js`)

- Three.js OrbitControls 없이 **구면 좌표계(spherical coordinates)** 로 직접 구현
- 마우스 좌클릭 드래그로 theta(수평각) / phi(수직각) 변환
- **관성 감쇠(damping)** — 드래그를 놓아도 자연스럽게 감속
- 마우스 휠 줌 + 거리 관성 지원
- `V` 키 또는 버튼으로 초기 시점 스무스 복귀 (ease in-out quad)

### 게임 로직 (`game3d.js`)

- 블록 충돌 검사, 벽 경계, 연쇄 블록 충돌 처리
- **이동 애니메이션** — 포물선 아크(sin 곡선) 보간으로 자연스러운 이동감
- 블록이 목표칸 도착 시 색상 변경 + **글로우 파티클 폭발** 이펙트
- 클리어 시 **3D 컨페티** 60개 큐브 낙하 애니메이션

### HTML5 API 활용

| API                     | 용도                                        |
| ----------------------- | ------------------------------------------- |
| `<canvas>` + WebGL      | Three.js 3D 렌더링                          |
| `requestAnimationFrame` | 60fps 렌더 루프                             |
| `localStorage`          | 스테이지별 최고 이동 횟수 저장, 클리어 뱃지 |
| Touch Events            | 모바일 1핑거 스와이프 조작                  |
| CSS Custom Properties   | 디자인 토큰 기반 테마 시스템                |

### 디자인 시스템

- **폰트** — Orbitron(디스플레이) + Noto Sans KR(본문)
- **컬러 팔레트** — 다크 사이버 테마, CSS 변수로 일관성 유지
- 스캔라인 오버레이, 배경 격자 패턴으로 레트로-퓨처리스틱 분위기
- 모바일 반응형 — HUD가 하단으로 재배치, 범례/키 힌트 자동 숨김

<br/>
