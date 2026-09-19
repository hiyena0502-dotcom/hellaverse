# WORLD / Hotel module

현재 WORLD에는 **Hazbin Hotel 한 지역만** 구현되어 있습니다.

## 파일

- \`data/world-config.js\`: WORLD 지역과 호텔 층 기본 데이터
- \`js/world/hotel.js\`: 호텔 단면 화면, 캐릭터 배치, 전용 설정창
- \`css/world.css\`: 호텔 외형/층/소품/애니메이션
- \`index.html\`: 상단 WORLD 버튼과 모듈 로딩
- \`js/ui/app-shell.js\`: WORLD 페이지 라우팅만 연결

## 호텔 화면

호텔은 이미지 한 장을 배경으로 쓰지 않고 CSS 도형으로 만든 단면형 구조입니다.
참고 이미지의 붉은 외벽, 크림색 테두리, 중앙 타워, 눈 모양 간판, 하트/네온/아르데코 장식을 참고하되 각 층 내부가 보이도록 재구성했습니다.

현재 층은 PENTHOUSE / SUITES / LOUNGE / BAR & STAGE / LOBBY입니다.
각 층의 VIEW를 누르면 설명을 볼 수 있습니다.

## 캐릭터 표시

HOTEL SETTINGS에서 다음을 바꿀 수 있습니다.

- 자동 캐릭터 배치
- 수동 호텔 등장 캐릭터 선택
- 한 화면 최대 캐릭터 수
- 움직임 속도
- 애니메이션/네온/입자 효과
- 빈 층 장식 실루엣
- 층 표시 이름

설정은 \`hellaverse-world-settings-v1\` localStorage에 저장됩니다.
캐릭터 이미지를 등록하면 호텔 안에서도 같은 이미지를 작은 이동 캐릭터로 사용하며, 이미지가 없으면 이니셜 실루엣으로 표시합니다.

## 다음 확장

Heaven, Imp 지역, 각 Ring은 \`data/world-config.js\`의 \`regions\`에 추가하고 각 지역 렌더러를 별도 파일로 만들면 됩니다.
대화/가챠/컬렉션 모듈과 분리되어 있기 때문에 WORLD 확장이 기존 시스템을 직접 건드리지 않도록 유지합니다.

현재 HOTEL은 **시각/이동/설정 기반만** 구현했습니다. 실제 SOUL 생산, 업무 시작/완료, 방치 수익은 다음 단계에서 이 모듈에 붙일 수 있습니다.
