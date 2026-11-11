# 도트리아: 별등 유랑기

코드로 한 점씩 찍은 도트를 3D 공간에 세운 오픈월드 액션 RPG. 이미지·소리·모델 파일 없이 전부 코드로 그리고 합성합니다.

- 실행: 저장소 루트의 `index.html` 을 정적 서버로 열면 됩니다. 빌드 과정 없음, 외부 의존 없음.
  - 로컬: `python3 -m http.server` 후 `http://localhost:8000/`
  - 깃허브 페이지: Settings → Pages → Build and deployment → Source: **Deploy from a branch**, Branch: 이 브랜치(또는 main) / **/(root)** → `https://choivoo.github.io/Sgenshin/`
- 자동 플레이(녹화용): 시작 화면의 「자동 플레이」 또는 주소 끝에 `?auto=1`

## 조작
| 동작 | 키보드·마우스 | 터치 |
|---|---|---|
| 이동 / 카메라 | WASD / 마우스(화면 클릭 후), 휠 줌 | 왼쪽 화면 스틱 / 오른쪽 화면 끌기, 두 손가락 줌 |
| 공격(꾹: 강공격, 공중: 낙하 공격) | 마우스 왼쪽 | 공격 버튼 |
| 점프·활공·벽에서 뛰어오르기 | Space | 점프 버튼 |
| 대시(꾹: 달리기) | Shift | 대시 버튼(스틱을 끝까지 밀면 달리기) |
| 원소 스킬 / 필살기 / 교체 | E / Q / 1~4 | 버튼 / 초상화 |
| 상호작용 / 정령안 / 음식 | F / V / Z | 버튼 |
| 벽에서 내려오기 | X 또는 Shift | 대시 버튼 |
| 지도·가방·캐릭터·임무·기원·파티·모험 수첩·메뉴 | M B C J G L K Esc | 위쪽 버튼 |

벽을 향해 계속 밀면 벽을 타고, 공중에서 점프를 누르면 활공합니다.

## 구조
`js/pixel.js` 도트 생성기(프리미티브를 광선으로 찍어 8방향 스프라이트 생성) · `js/gl.js` WebGL 렌더러(낮은 내부 해상도, 최근접 샘플링, 디더) · `js/world.js` 세계 생성 · `js/game.js` 이동·카메라·환경 · `js/combat.js` 전투·원소 반응·보스 · `js/interact.js` 탐험·임무 · `js/state.js` 저장·성장 · `js/gacha.js` 뽑기 규칙 · `js/ui*.js` 화면 · `js/audio.js` 칩튠 합성 · `js/auto.js` 자동 플레이

뽑기 모의 실행: `node tools/gacha_sim.js 2000000`
