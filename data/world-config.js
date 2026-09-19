"use strict";

/**
 * WORLD 기본 데이터.
 * 현재는 Hazbin Hotel 한 지역만 구현합니다.
 * 이후 Heaven / Imp City / 각 Ring은 regions 배열에 같은 구조로 추가할 수 있습니다.
 */
window.HV_WORLD_CONFIG = {
  schemaVersion: 6,
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
      subtitle:"CELESTIAL CITY · INNER DISTRICT",
      status:"OPEN",
      description:"Golden Gate를 지나 들어오는 중앙 광장과 행정·기록·교통·정원 구역.",
      activities:[
        {id:"heaven-arrival",building:"welcome",title:"ARRIVAL DESK",detail:"새로 도착한 영혼의 안내표 정리",icon:"✦",duration:55,reward:52},
        {id:"heaven-route",building:"transit",title:"HALO ROUTE",detail:"구름 이동 플랫폼과 후광 노선 점검",icon:"◎",duration:70,reward:66},
        {id:"heaven-records",building:"archive",title:"RECORD SORTING",detail:"천국 기록 보관소의 문서 분류",icon:"▤",duration:85,reward:82},
        {id:"heaven-petition",building:"court",title:"PETITION DELIVERY",detail:"Seraph Court로 청원서 전달",icon:"◇",duration:95,reward:92},
        {id:"heaven-garden",building:"garden",title:"SKY GARDEN CARE",detail:"구름 정원과 별꽃 관리",icon:"✧",duration:75,reward:72}
      ]
    },
    {
      id:"wrath",
      type:"scene",
      name:"WRATH",
      subtitle:"WRATH RING · RANCHLAND",
      status:"OPEN",
      description:"주황빛 하늘 아래 낮은 마을, 화산과 큰 목장 게이트, 마굿간과 사막 목장이 이어지는 분노의 고리.",
      activities:[
        {id:"wrath-stable-care",building:"stable",title:"STABLE CARE",detail:"마굿간 바닥과 말칸 정리",icon:"♞",duration:70,reward:68},
        {id:"wrath-hay-stacking",building:"hay",title:"HAY STACKING",detail:"건초 묶음을 창고 옆에 쌓기",icon:"▧",duration:55,reward:54},
        {id:"wrath-fence-repair",building:"fence",title:"FENCE REPAIR",detail:"목장 울타리와 우리 보수",icon:"╫",duration:85,reward:80},
        {id:"wrath-water-trough",building:"trough",title:"WATER TROUGH",detail:"급수통 채우고 주변 정리",icon:"◒",duration:60,reward:58},
        {id:"wrath-ranch-round",building:"ranch",title:"RANCH ROUND",detail:"목장 전체를 한 바퀴 점검",icon:"✦",duration:95,reward:90}
      ]
    },
    {
      id:"lust",
      type:"scene",
      name:"LUST",
      subtitle:"LUST RING · OZZIE'S DISTRICT",
      status:"OPEN",
      description:"OZZIE'S를 중심으로 라운지와 네온 상가, 대기 구역과 야간 거리가 이어지는 LUST 지구.",
      activities:[
        {id:"lust-entry-setup",building:"entry",title:"ENTRY SETUP",detail:"입구 로프와 대기 구역 정리",icon:"◇",duration:55,reward:56},
        {id:"lust-neon-check",building:"neon",title:"NEON CHECK",detail:"거리 간판과 네온 전원 점검",icon:"✦",duration:70,reward:68},
        {id:"lust-stage-prep",building:"stage",title:"STAGE PREP",detail:"클럽 무대와 조명 준비",icon:"♪",duration:90,reward:88},
        {id:"lust-lounge-reset",building:"lounge",title:"LOUNGE RESET",detail:"라운지 좌석과 테이블 정리",icon:"♡",duration:75,reward:74},
        {id:"lust-street-cleanup",building:"street",title:"STREET CLEANUP",detail:"영업 후 거리와 드롭오프 구역 정돈",icon:"✧",duration:65,reward:64}
      ]
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
