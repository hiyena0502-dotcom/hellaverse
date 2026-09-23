"use strict";

(()=>{
  const packs=Array.isArray(window.HV_STORY_PACKS)?window.HV_STORY_PACKS:[];
  const pack=packs.find(row=>row?.id==="pooltalk-52-charlie-morningstar");
  if(!pack||!Array.isArray(pack.events))return;

  // Charlie는 작품의 중심 인물이므로 호텔의 목표, 구원, 천국/지옥, 가족,
  // 호텔 운영 책임, 그리고 주요 인물 관계가 드러나는 TALK를 우선한다.
  // 아래 항목은 Charlie에게 굳이 물을 이유가 약하거나 다른 TALK와 중복되는
  // 범용 생활/랜덤 토픽이라 목록에서 제외한다.
  const REMOVE=new Set([
    "pooltalk-charlie-morningstar-18-hz-245", // 호텔 요리 대회
    "pooltalk-charlie-morningstar-23-hz-095", // 호텔에서 가장 이상한 취미를 가진 사람
    "pooltalk-charlie-morningstar-26-hz-011", // 호텔에 반려동물을 들여도 되는가
    "pooltalk-charlie-morningstar-27-hz-002", // 호텔 조식 메뉴를 누가 정해야 하는가
    "pooltalk-charlie-morningstar-28-hz-103", // 새로운 호텔 지점을 만들어야 하는가 (TALK 09와 중복)
    "pooltalk-charlie-morningstar-29-hz-015", // 호텔에 자꾸 물건이 사라지는 문제
    "pooltalk-charlie-morningstar-35-hz-005", // 객실 청소 담당을 정하는 문제
    "pooltalk-charlie-morningstar-36-hz-001", // 호텔에서 가장 시끄러운 방은 누구 방인가
    "pooltalk-charlie-morningstar-38-hz-016", // 객실 인테리어를 각자 마음대로 바꿔도 되는가
    "pooltalk-charlie-morningstar-39-hz-254", // 호텔 전체에 인터넷이 끊긴 상황
    "pooltalk-charlie-morningstar-44-mx-101", // 서로의 직업을 하루 동안 바꿔보기
    "pooltalk-charlie-morningstar-48-hz-196", // Vees가 서로 없이는 얼마나 강할까
    "pooltalk-charlie-morningstar-49-hz-004", // 호텔에서 절대 맡기면 안 되는 사람이 요리를 한다면
    "pooltalk-charlie-morningstar-50-mx-109", // 서로의 직장에 하루 동안 출근하기
    "pooltalk-charlie-morningstar-51-hz-013", // 호텔에서 가장 편한 소파를 누가 차지하는가
    "pooltalk-charlie-morningstar-55-hz-017", // 호텔에 새로운 바를 만들자는 의견
    "pooltalk-charlie-morningstar-59-hz-018"  // 호텔에 게임룸을 만들자는 의견
  ]);

  pack.events=pack.events.filter(event=>!REMOVE.has(event?.id));
  pack.version=Math.max(1,Number(pack.version)||1)+1;
})();