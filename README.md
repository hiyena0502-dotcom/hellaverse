# Hellaverse

개인용 Hellaverse 대화 / WORLD / 컬렉션 / 가챠 사이트입니다.

## 현재 구조

- `index.html` — 화면 뼈대와 모듈 로딩 순서
- `data/default-content.js` — 기본 캐릭터 / 대화 / ASK / 아이템 / THOUGHT
- `data/world-config.js` — WORLD 지역 / 활동 기본 데이터
- `js/core/state.js` — 데이터 정규화, localStorage, 플레이 상태·백업
- `js/core/game-state.js` — 조건/효과/관계/아이템/상호작용 상태
- `js/ui/app-shell.js` — HOME / CHARACTERS / GACHA / THOUGHT / COLLECTION / DATA
- `js/world/hotel.js` — Hazbin Hotel WORLD
- `js/world/regions.js` — Heaven / Wrath / Lust / Greed / Gluttony / I.M.P Office 등 WORLD 지역
- `js/game/dialogue.js` — ROOM, 선택지, ASK, 인벤토리, 가챠 실행
- `js/editor/editor-ui.js` — EDITOR 화면
- `js/editor/editor-events.js` — 앱/EDITOR 이벤트, 저장/추가/삭제/검사
- `css/*.css` — 화면 역할별 스타일

## 저장과 백업

주 상태 키는 `hellaverse-studio-state-v2`입니다. 이제 호감도, 감정, 일반 변수, 대화 로그도 `playState`로 저장되어 새로고침 뒤 유지됩니다.

상단 **DATA**에서 다음을 사용할 수 있습니다.

- 자동 저장
- 수동 세이브 슬롯 3개
- 자동 안전 백업
- JSON 내보내기 / 가져오기
- 플레이 진행도 초기화

DATA 백업에는 메인 state뿐 아니라 WORLD의 호텔 설정, 현재 지역, 지역 배치와 지역 활동 상태도 같이 포함됩니다.

## EDITOR 안전장치

EDITOR에는 CHECK 외에 다음 보호 기능이 있습니다.

- UNDO / REDO
- 마지막 저장 전 상태 RESTORE
- 삭제 전 확인
- 미저장 변경이 있을 때 닫기 확인
- 저장 직전 자동 안전 백업

## 기본 콘텐츠

사이트 기본 캐릭터와 대사는 `data/default-content.js`에 넣습니다. 브라우저 EDITOR 저장은 `localStorage`를 수정하며 기본 콘텐츠 파일 자체를 자동 수정하지 않습니다.

자세한 데이터 형태는 `docs/DEFAULT_CONTENT.md`, WORLD 구조는 `docs/WORLD.md`를 참고하세요.
