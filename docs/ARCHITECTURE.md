# Architecture

## 로딩 순서

1. `data/default-content.js`
2. `js/core/state.js`
3. `js/core/game-state.js`
4. `js/ui/app-shell.js`
5. `js/game/dialogue.js`
6. `js/editor/editor-ui.js`
7. `js/editor/editor-events.js`

기존 단일 런타임의 실행 순서를 그대로 유지하면서 역할별로 분리했습니다.
초기 session 생성은 game-state가 로드된 뒤 실행하도록 옮겨 단일 파일 함수 호이스팅 의존성을 제거했습니다.

## 저장

- 상태 키: `hellaverse-studio-state-v2`
- 사용자 플레이/EDITOR 데이터: 브라우저 `localStorage`
- 사이트 기본 데이터: `data/default-content.js`

## 수정 원칙

- 임시 fix/repair 버전 파일을 새로 쌓지 않고 실제 소유 모듈을 수정합니다.
- 캐릭터/대사 기본값은 런타임 코드에 직접 박지 않습니다.
- UI 수정은 대응 CSS/UI 모듈 안에서 처리합니다.
