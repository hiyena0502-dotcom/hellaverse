"use strict";

/**
 * WORLD 기본 데이터.
 * 현재는 Hazbin Hotel 한 지역만 구현합니다.
 * 이후 Heaven / Imp City / 각 Ring은 regions 배열에 같은 구조로 추가할 수 있습니다.
 */
window.HV_WORLD_CONFIG = {
  schemaVersion: 3,
  defaultRegion: "hotel",
  regions: [
    {
      id: "hotel",
      name: "HAZBIN HOTEL",
      subtitle: "PRIDE RING · PENTAGRAM CITY",
      status: "OPEN",
      activities: [
        { id:"front-checkin", floor:"lobby", title:"FRONT DESK", detail:"체크인 서류 정리", icon:"◆", duration:45, reward:40, anchor:22 },
        { id:"front-register", floor:"lobby", title:"GUEST REGISTER", detail:"투숙객 기록 정리", icon:"▤", duration:55, reward:48, anchor:26 },
        { id:"bar-orders", floor:"bar", title:"BAR ORDERS", detail:"밀린 주문 정리", icon:"♥", duration:60, reward:58, anchor:73 },
        { id:"stage-reset", floor:"bar", title:"STAGE RESET", detail:"무대와 장비 정돈", icon:"♪", duration:70, reward:66, anchor:25 },
        { id:"room-service", floor:"suites", title:"ROOM SERVICE", detail:"객실 서비스 정리", icon:"◇", duration:90, reward:84, anchor:25 },
        { id:"corridor-round", floor:"suites", title:"CORRIDOR ROUND", detail:"객실 복도 점검", icon:"✦", duration:75, reward:72, anchor:74 },
        { id:"lounge-tidy", floor:"lounge", title:"LOUNGE CARE", detail:"라운지 정돈", icon:"♢", duration:65, reward:62, anchor:27 },
        { id:"fireplace-care", floor:"lounge", title:"FIREPLACE", detail:"벽난로와 휴게실 관리", icon:"◉", duration:80, reward:74, anchor:52 }
      ],
      floors: [
        { id: "penthouse", number: "05", name: "PENTHOUSE", description: "호텔 가장 높은 곳. 중앙 타워와 사적인 공간이 있는 층." },
        { id: "suites", number: "04", name: "SUITES", description: "객실과 긴 복도가 이어지는 숙박 층." },
        { id: "lounge", number: "03", name: "LOUNGE", description: "소파와 작은 테이블이 놓인 공용 휴식 공간." },
        { id: "bar", number: "02", name: "BAR & STAGE", description: "바와 작은 무대가 붙어 있는 활기찬 층." },
        { id: "lobby", number: "01", name: "LOBBY", description: "현관, 프런트 데스크와 메인 홀이 있는 호텔의 중심." }
      ]
    },
    {
      id:"heaven",
      type:"scene",
      name:"HEAVEN",
      subtitle:"CELESTIAL CITY · GOLDEN GATE",
      status:"OPEN",
      description:"복숭아빛 하늘과 구름, 금빛 문, 보라색 첨탑이 이어지는 천국 도심."
    },
    {
      id:"wrath",
      type:"scene",
      name:"WRATH",
      subtitle:"WRATH RING · RANCHLAND",
      status:"OPEN",
      description:"주황빛 하늘 아래 목장과 농장, 거친 울타리와 바위 지형이 이어지는 분노의 고리."
    },
    {
      id:"lust",
      type:"scene",
      name:"LUST",
      subtitle:"LUST RING · OZZIE'S DISTRICT",
      status:"OPEN",
      description:"짙은 남색 하늘과 청록·보라 네온이 번지는 오지스 주변의 야간 거리."
    },
    {
      id:"imp-office",
      type:"scene",
      name:"I.M.P OFFICE",
      subtitle:"IMP CITY · BLITZØ'S OFFICE",
      status:"OPEN",
      description:"낡은 줄무늬 벽, 회의 테이블과 서류함이 뒤섞인 I.M.P 사무실."
    }
  ]
};
