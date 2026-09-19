"use strict";

/**
 * WORLD 기본 데이터.
 * 현재는 Hazbin Hotel 한 지역만 구현합니다.
 * 이후 Heaven / Imp City / 각 Ring은 regions 배열에 같은 구조로 추가할 수 있습니다.
 */
window.HV_WORLD_CONFIG = {
  schemaVersion: 2,
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
    }
  ]
};
