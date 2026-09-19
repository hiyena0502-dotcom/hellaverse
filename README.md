# Hellaverse

`hellaverse_`의 최신 실행본을 정리해서 옮긴 메인 저장소입니다.

## 구조

- `index.html` — 화면 뼈대와 로딩 순서
- `data/default-content.js` — 기본 캐릭터 / 대화 / ASK / 아이템 / THOUGHT
- `js/core/state.js` — 데이터 정규화, localStorage, 공통 상태
- `js/core/game-state.js` — 조건/효과/관계/아이템/상호작용 상태
- `js/ui/app-shell.js` — HOME/GACHA/THOUGHT/COLLECTION 화면
- `js/game/dialogue.js` — 대화방, 선택지, ASK, 인벤토리, 가챠 실행
- `js/editor/editor-ui.js` — EDITOR 화면
- `js/editor/editor-events.js` — EDITOR 저장/추가/삭제/검사
- `css/*.css` — 화면 역할별 스타일

## 기본 캐릭터와 대사

앞으로 사이트에 기본으로 포함할 캐릭터와 대사는 **`data/default-content.js`** 에 넣습니다.
브라우저 EDITOR 저장은 기존처럼 `localStorage`를 사용하며 이 파일 자체를 자동 수정하지 않습니다.

자세한 데이터 형태는 `docs/DEFAULT_CONTENT.md`를 참고하세요.

## 정리 기준

기존 `hellaverse_`에서 현재 페이지가 실제로 로드하던 최신 번들은 `css/app.css`와 `js/site-runtime.js`였습니다.
과거 `repair`, `cleanup`, `v1/v2/v3`, 분할 default-content 조각 등 현재 로딩되지 않는 legacy 파일은 새 저장소로 복사하지 않았습니다.

저장 키 `hellaverse-studio-state-v2`는 유지하므로 기존 브라우저 저장 데이터와 호환됩니다.
