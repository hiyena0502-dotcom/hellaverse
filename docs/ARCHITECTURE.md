# Architecture

## 로딩 순서

1. `data/default-content.js`
2. `data/world-config.js`
3. `js/core/state.js`
4. `js/core/game-state.js`
5. `js/ui/app-shell.js`
6. `js/world/hotel.js`
7. `js/world/regions.js`
8. `js/game/dialogue.js`
9. `js/editor/editor-ui.js`
10. `js/editor/editor-events.js`

모듈은 전역 state/session을 공유하므로 위 순서를 유지합니다.

## 저장

### IndexedDB

대형 데이터의 주 저장소는 `hellaverse-studio-db` IndexedDB입니다. `kv` object store에 다음 레코드를 둡니다.

- `state` — 캐릭터 / EVENT / ASK / ITEM / THOUGHT 등 프로젝트 전체
- `progress` — 프로필, 호감도·감정·변수, 인벤토리, ASK/선물/THOUGHT/가챠 진행
- `backups` — 수동 슬롯 3개 + 자동 안전 백업
- `editorSnapshot` — 마지막 EDITOR 저장 전 상태

기존 localStorage의 다음 키가 있으면 `bootstrapStorage()`에서 IndexedDB로 자동 이전합니다.

- `hellaverse-studio-state-v2`
- `hellaverse-studio-backups-v2`
- `hellaverse-studio-editor-snapshot-v2`

IndexedDB를 사용할 수 없는 환경에서는 localStorage fallback을 유지합니다.

### Schema migration

현재 `CURRENT_SCHEMA_VERSION`은 3입니다. `normalizeState()` 전에 `migrateStateSchema()`가 v1 → v2 → v3 순서로 적용됩니다. 새 구조 변경은 기존 migration을 수정하지 말고 다음 버전 migration을 추가합니다.

### localStorage 유지 항목

작은 환경 설정과 WORLD 보조 값은 localStorage를 계속 사용합니다.

- `hellaverse-studio-prefs-v2`
- `hellaverse-world-settings-v1`
- `hellaverse-world-region-v1`
- `hellaverse-world-scene-placement-v1`
- `hellaverse-world-scene-work-v1`

## 플레이 상태

`session`은 실행 중 조건 계산에 사용하지만, `saveState()` 시 다음 값이 `state.playState`에 동기화됩니다.

- variables
- affection
- emotions
- dialogue log

따라서 새로고침과 EDITOR 저장 뒤에도 진행 상태가 유지됩니다. 일반 플레이 중에는 `saveProgressState()`만 호출하고, 프로젝트 콘텐츠가 실제로 바뀌는 EDITOR 저장 / IMPORT에서는 `saveState()`를 사용합니다.

## UI 소유

- HOME / CHARACTERS / GACHA / THOUGHT / COLLECTION / DATA: `app-shell.js`
- WORLD: `hotel.js`, `regions.js`
- ROOM: `dialogue.js`
- EDITOR: `editor-ui.js`, `editor-events.js`

WORLD는 이미 별도 모듈로 활성화되어 있으므로 같은 기능을 app-shell에 중복 구현하지 않습니다.

## IMPORT / 오류 격리

IMPORT는 먼저 `prepareImportPreview()`로 legacy 변환 및 schema migration을 적용한 뒤 `validateDraft()` 검사를 수행합니다. ERROR가 있으면 적용 버튼을 비활성화합니다.

전역 `error` / `unhandledrejection`은 `recoverUiFromError()`가 받아 EDITOR나 모달을 닫고 사용 가능한 화면으로 복구합니다. 저장 데이터 자체를 자동 삭제하지 않습니다.

## 자동 회귀 검사

`tests/smoke.mjs`와 `.github/workflows/smoke.yml`이 대형 fixture와 주요 UI wiring을 검사합니다. 새 기능 추가 시 기존 smoke 조건을 제거하지 말고 필요한 검사를 확장합니다.

## 수정 원칙

- 임시 fix/repair 파일을 새로 쌓지 않고 실제 소유 모듈을 수정합니다.
- 캐릭터/대사 기본값은 런타임 코드에 직접 박지 않습니다.
- UI 변경은 대응 CSS/UI 모듈 안에서 처리합니다.
- THOUGHT의 현재 랜덤 발견 규칙과 기존 WORLD 생활/활동 루프는 별도 요청 없이는 변경하지 않습니다.
