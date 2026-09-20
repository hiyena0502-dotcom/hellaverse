# Hellaverse

개인용 Hellaverse 대화 / WORLD / 컬렉션 / 가챠 사이트입니다.

## 현재 구조

- `index.html` — 화면 뼈대와 모듈 로딩 순서
- `data/default-content.js` — 기본 캐릭터 / 대화 / ASK / 아이템 / THOUGHT
- `data/world-config.js` — WORLD 지역 / 활동 기본 데이터
- `js/core/state.js` — 데이터 정규화, schema migration, IndexedDB 저장, 플레이 상태·백업
- `js/core/game-state.js` — 조건/효과/관계/아이템/상호작용 상태
- `js/ui/app-shell.js` — HOME / CHARACTERS / GACHA / THOUGHT / COLLECTION / DATA
- `js/world/hotel.js` — Hazbin Hotel WORLD
- `js/world/regions.js` — Heaven / Wrath / Lust / Greed / Gluttony / I.M.P Office 등 WORLD 지역
- `js/game/dialogue.js` — ROOM, 선택지, ASK, 인벤토리, 가챠 실행
- `js/editor/editor-ui.js` — EDITOR 화면
- `js/editor/editor-events.js` — 앱/EDITOR 이벤트, 저장/추가/삭제/검사
- `css/*.css` — 화면 역할별 스타일

## 저장과 백업

큰 프로젝트 데이터는 **IndexedDB**에 저장합니다. 기존 `localStorage`의 state / 백업 / EDITOR 복구본이 있으면 첫 실행 때 자동으로 IndexedDB로 옮기고, 대화 중에는 전체 프로젝트가 아니라 진행도만 별도 `progress` 레코드로 저장합니다. 작은 사용자 설정과 WORLD 보조 키는 계속 localStorage를 사용합니다.

현재 데이터 schema는 `schemaVersion: 3`이며, 이전 schema는 시작/IMPORT 시 단계별 migration을 거칩니다.

상단 **DATA**에서 다음을 사용할 수 있습니다.

- 자동 저장
- 저장소 상태(INDEXEDDB / schema / 프로젝트 크기) 확인
- 수동 세이브 슬롯 3개
- 자동 안전 백업
- JSON 내보내기
- JSON 가져오기 전 구조 검사 및 미리보기
- 플레이 진행도 초기화

IMPORT는 CHARACTER / EVENT / ASK / ITEM / THOUGHT / VARIABLE 개수와 ERROR / WARNING을 먼저 검사합니다. ERROR가 남은 데이터는 즉시 적용하지 않습니다.

DATA 백업에는 메인 state뿐 아니라 WORLD의 호텔 설정, 현재 지역, 지역 배치와 지역 활동 상태도 같이 포함됩니다.

## EDITOR 안전장치

EDITOR에는 CHECK 외에 다음 보호 기능이 있습니다.

- 일반 프로젝트: 제한된 UNDO / REDO
- 대용량 프로젝트: 전체 스냅샷 UNDO 대신 RESTORE 사용
- 마지막 저장 전 상태 RESTORE
- 삭제 전 확인
- 미저장 변경이 있을 때 닫기 확인
- 저장 직전 자동 안전 백업
- EVENT / ASK / ITEM / THOUGHT 검색·페이지 분할
- ASK / ITEM / THOUGHT는 선택한 항목 1개만 상세 렌더링
- 화면 오류 발생 시 EDITOR/모달을 닫고 HOME으로 복구하는 UI recovery boundary

## 기본 콘텐츠

사이트 기본 캐릭터와 대사는 `data/default-content.js`에 넣습니다. 브라우저 EDITOR 저장은 IndexedDB의 프로젝트 state를 수정하며 기본 콘텐츠 파일 자체를 자동 수정하지 않습니다.

자세한 데이터 형태는 `docs/DEFAULT_CONTENT.md`, WORLD 구조는 `docs/WORLD.md`를 참고하세요.


## 자동 검사

`.github/workflows/smoke.yml`은 push / pull request에서 `tests/smoke.mjs`를 실행합니다.

- 모든 주요 JavaScript 파일 문법 검사
- 핵심 버튼/탐색 이벤트 구조 확인
- IndexedDB / schema migration / IMPORT preview / recovery boundary 존재 확인
- EVENT 1,000 / ASK 500 / ITEM 300 / THOUGHT 500 대형 fixture 정규화
- 전체 프로젝트와 progress 저장 크기 분리 검증
