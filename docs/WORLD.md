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

HOTEL에는 재화 획득용 WORK 루프가 구현되어 있습니다.

- LOBBY / BAR / SUITES / LOUNGE에 업무 카드가 표시됩니다.
- READY 상태에서 업무를 시작하면 실제 시간 기준으로 자동 진행됩니다.
- WORLD를 나가거나 브라우저를 닫아도 종료 시각은 저장됩니다.
- 완료 시 가챠의 동일한 재화 잔액(`state.gacha.balance`)에 자동 지급됩니다.
- 캐릭터가 있으면 가까운 캐릭터 한 명이 업무 위치로 이동하는 연출이 생기지만, 캐릭터 능력치가 보상이나 시간에 영향을 주지는 않습니다.
- HOTEL SETTINGS의 보상 배율/시간 배율로 경제 밸런스를 조절할 수 있습니다.
- 개별 업무 정의는 `data/world-config.js`의 `activities`에서 관리합니다.


## 직접 드래그 배치

호텔 화면의 실제 캐릭터는 마우스/포인터로 직접 집어서 좌우 위치를 바꾸거나 다른 층으로 옮길 수 있습니다.
드롭한 위치는 `hellaverse-world-settings-v1`의 캐릭터별 `placement`에 저장되고 새로고침 뒤에도 유지됩니다.
HOTEL SETTINGS에는 별도의 지정 spot 선택 UI를 두지 않습니다. 기본 층을 바꾸면 기존 수동 배치는 해제되고, 그 이후 다시 화면에서 직접 배치할 수 있습니다.


## 추가 WORLD 지역

HOTEL 외에 다음 장면형 지역이 추가되었습니다.

- HEAVEN — 금빛 문, 구름, 후광, 보라/핑크 첨탑 도시
- WRATH — 주황빛 하늘, 목장 게이트, 울타리, 헛간과 황무지
- LUST — 남색 하늘, 청록/보라 네온, OZZIE'S 계열 클럽 거리
- I.M.P OFFICE — 임프 시티의 I.M.P 사무소 실내

상단 WORLD 지역 탭으로 전환하며, HOTEL WORK는 호텔 화면에만 표시됩니다.
장면형 지역에서도 캐릭터를 직접 드래그해 배치할 수 있고 위치는 `hellaverse-world-scene-placement-v1`에 지역별로 저장됩니다.
배경은 참조 이미지를 직접 삽입하지 않고 HTML/CSS 도형으로 구성합니다.


## Heaven inner district

Heaven은 입구 문을 전면에 두는 장면에서, 문 뒤의 실제 도심을 보여주는 장면으로 변경되었습니다.

- CELESTIAL PLAZA: 캐릭터가 배치되는 중앙 광장
- WELCOME HALL: 도착 안내 / ARRIVAL DESK
- CLOUD TRANSIT: 후광·구름 이동 노선 / HALO ROUTE
- SERAPH COURT: 청원서 전달 / PETITION DELIVERY
- CELESTIAL ARCHIVE: 기록 분류 / RECORD SORTING
- SKY GARDEN: 구름 정원 관리 / SKY GARDEN CARE

천국 업무는 `hellaverse-world-scene-work-v1`에 진행 상태와 종료 시간을 저장합니다.
완료 시 HOTEL WORK와 동일한 가챠 재화 잔액에 보상이 자동 지급됩니다.


## Wrath ranch update

WRATH는 낮은 사막 마을과 목장 중심으로 재정렬했습니다.

- 멀리 화산과 메사/사막 능선
- 낮은 집들과 물탱크
- 큰 RANCH GATE
- 목장집, 마굿간, 양쪽 우리
- 네모/원형 건초 묶음과 건초 더미
- 급수통, 선인장, 바위, 전경 울타리
- 모든 주요 소품은 하나의 ground line에 맞춰 바닥에 붙도록 배치

WRATH CHORES:
STABLE CARE / HAY STACKING / FENCE REPAIR / WATER TROUGH / RANCH ROUND.


## Lust district update

LUST는 OZZIE'S 한 건물 중심 장면에서 야간 엔터테인먼트 거리로 확장했습니다.

- 중앙 OZZIE'S 클럽: 왕관형 상부 장식, 발코니, 창, 하트 출입구
- 좌측 VELVET 상가와 네온 아치
- 우측 LOUNGE 외관과 좁은 골목
- 입구 대기 로프, 안내 podium
- 가로등, 보도 턱, 네온 반사가 있는 도로

LUST NIGHT SHIFT:
ENTRY SETUP / NEON CHECK / STAGE PREP / LOUNGE RESET / STREET CLEANUP.
