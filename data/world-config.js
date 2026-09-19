"use strict";

/**
 * WORLD 기본 데이터.
 * 현재는 Hazbin Hotel 한 지역만 구현합니다.
 * 이후 Heaven / Imp City / 각 Ring은 regions 배열에 같은 구조로 추가할 수 있습니다.
 */
window.HV_WORLD_CONFIG = {
  schemaVersion: 1,
  defaultRegion: "hotel",
  regions: [
    {
      id: "hotel",
      name: "HAZBIN HOTEL",
      subtitle: "PRIDE RING · PENTAGRAM CITY",
      status: "OPEN",
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
