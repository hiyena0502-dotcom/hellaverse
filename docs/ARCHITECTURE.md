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

주 키:

- `hellaverse-studio-state-v2` — 프로젝트 데이터 + 플레이 진행
- `hellaverse-studio-prefs-v2` — 대화 속도 / AUTO / stage click
- `hellaverse-studio-backups-v2` — 수동 슬롯 3개 + 자동 안전 백업
- `hellaverse-studio-editor-snapshot-v2` — 마지막 EDITOR 저장 전 상태

WORLD 보조 키도 DATA 백업에 함께 포함합니다.

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

따라서 새로고침과 EDITOR 저장 뒤에도 진행 상태가 유지됩니다.

## UI 소유

- HOME / CHARACTERS / GACHA / THOUGHT / COLLECTION / DATA: `app-shell.js`
- WORLD: `hotel.js`, `regions.js`
- ROOM: `dialogue.js`
- EDITOR: `editor-ui.js`, `editor-events.js`

WORLD는 이미 별도 모듈로 활성화되어 있으므로 같은 기능을 app-shell에 중복 구현하지 않습니다.

## 수정 원칙

- 임시 fix/repair 파일을 새로 쌓지 않고 실제 소유 모듈을 수정합니다.
- 캐릭터/대사 기본값은 런타임 코드에 직접 박지 않습니다.
- UI 변경은 대응 CSS/UI 모듈 안에서 처리합니다.
- THOUGHT의 현재 랜덤 발견 규칙과 기존 WORLD 생활/활동 루프는 별도 요청 없이는 변경하지 않습니다.
