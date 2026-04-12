# [SOKOBAN 3D](https://jik-k.github.io/SOKOBAN/)

> HTML5 + Three.js 기반의 3D 소코반 퍼즐 게임

<br/>

## 소개

클래식 소코반(Sokoban) 규칙을 3D 공간으로 재해석한 웹 퍼즐 게임입니다.  
빨간 공을 조종해 초록 블록을 파란 목표칸 위로 밀어 넣으면 스테이지가 클리어됩니다.  
별도 설치 없이 브라우저에서 바로 실행되며, 마우스 드래그로 시점을 자유롭게 돌려가며 퍼즐을 풀 수 있습니다.

<br/>

**클리어 조건** — 모든 🟩 초록 블록을 🟦 파란 목표칸 위에 올려놓기  
**이동 제약** — 🟩 블록은 흰 벽이나 다른 블록 방향으로는 밀 수 없음

<br/>

## 기술 스택

- **Engine**: Three.js (r128)
- **Language**: JavaScript (ES6+), HTML5, CSS3
- **Library**: Cloudflare CDN을 통한 Three.js 로드
- **Storage**: localStorage를 이용한 스테이지별 최고 기록(Moves) 및 클리어 상태 저장

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

### 씬 빌더 (Scene Management) - scene.js
- 단순한 렌더링을 넘어 씬의 동적 구성을 담당합니다.
- 레이어 구조: 바닥 타일, 벽, 목표 지점(blues), 가동 블록(greens), 플레이어(red)를 논리적으로 분리하여 생성합니다.
- 시각 효과: * PointLight를 활용한 듀얼 액센트 조명 시스템.
- spawnGlowParticles: 블록 이동 시 발생하는 발광 파티클.
- spawnConfetti: 스테이지 클리어 시 3D 공간에 흩날리는 축하 종이 효과.

### 입력 처리 시스템 - input.js
- 다양한 환경을 고려한 멀티 플랫폼 입력을 지원합니다.
- Keyboard: 방향키 및 WASD 지원.
- D-Pad: 모바일 및 터치 환경을 위한 온스크린 컨트롤러.
- Swipe: 화면 드래그를 통한 캐릭터 이동 로직 (거리 임계값 25px 적용).

### 궤도 컨트롤러 - orbit.js
- Three.js의 기본 OrbitControls 대신 커스텀 컨트롤러를 구현했습니다.
- 관성(Damping): 회전(theta, phi)과 거리(r)에 관성을 적용하여 부드러운 시점 전환을 제공합니다.
- Zoom: 마우스 휠 및 핀치 줌을 지원하며, 설정된 MIN_DIST, MAX_DIST 내에서만 작동합니다.

### 데이터 매니저 - StorageManager
- localStorage를 활용해 서버 없이도 유저 데이터를 유지합니다.
- SOKOBAN_best_{stageId} 키를 사용하여 스테이지별 최소 이동 횟수 저장.
- SOKOBAN_cleared 리스트를 관리하여 스테이지 선택 화면과 연동 가능.

### 게임 로직 (`game3d.js`)
- 블록 충돌 검사, 벽 경계, 연쇄 블록 충돌 처리
- **이동 애니메이션** — 포물선 아크(sin 곡선) 보간으로 자연스러운 이동감
- 블록이 목표칸 도착 시 색상 변경 + **글로우 파티클 폭발** 이펙트

<br/>
