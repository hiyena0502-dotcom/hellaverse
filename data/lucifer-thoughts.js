"use strict";

(()=>{
  const VERSION=3;
  const C="lucifer-morningstar";
  const previous=window.HV_APPLY_THOUGHT_PRESETS;

  const THOUGHTS=[
    // 초반 경계 · 일부만 높은 호감도에서 자연스럽게 퇴장
    {id:"lucifer-thought-cold-01",category:"일상",frequency:"common",rarity:"COMMON",minAffection:0,maxAffection:35,text:"또 왔네.\n왜 이렇게 자주 마주치는 거지."},
    {id:"lucifer-thought-cold-02",category:"관계",frequency:"common",rarity:"COMMON",minAffection:0,maxAffection:24,text:"아직은 굳이 오래 이야기할 필요 없어.\n필요한 말만 하면 되지."},
    {id:"lucifer-thought-cold-03",category:"일상",frequency:"normal",rarity:"UNCOMMON",minAffection:0,maxAffection:50,text:"오리를 쳐다보는 건 상관없어.\n손대지만 않으면."},
    {id:"lucifer-thought-cold-04",category:"관계",frequency:"normal",rarity:"UNCOMMON",minAffection:0,maxAffection:39,text:"찰리랑 아는 사이라고 해서 내가 자동으로 편해져야 하는 건 아니잖아."},
    {id:"lucifer-thought-cold-05",category:"비밀",frequency:"rare",rarity:"RARE",minAffection:0,maxAffection:45,text:"과거 얘기는 안 해.\n저 사람한테만 그런 게 아니라, 누구한테도."},

    // 초반부터 누적 · 익숙해지며 열리는 생각
    {id:"lucifer-thought-distant-01",category:"일상",frequency:"common",rarity:"COMMON",minAffection:10,maxAffection:100,text:"오리 설명을 시작하면 끝까지 듣기는 하네.\n중간에 도망갈 줄 알았는데."},
    {id:"lucifer-thought-distant-02",category:"관계",frequency:"common",rarity:"COMMON",minAffection:15,maxAffection:55,text:"이름을 기억해둘 정도는 됐나.\n…아니, 아직 굳이 입 밖으로 부를 필요는 없고."},
    {id:"lucifer-thought-distant-03",category:"일상",frequency:"normal",rarity:"UNCOMMON",minAffection:10,maxAffection:100,text:"사과 좋아하냐고 물었던 거, 생각보다 평범한 질문이었지.\n그런 질문은 대답하기 편해."},
    {id:"lucifer-thought-distant-04",category:"지옥",frequency:"normal",rarity:"UNCOMMON",minAffection:20,maxAffection:100,text:"서류 더미를 볼 때마다 급한 것만 고르라고 하는 얼굴이 떠오르네.\n좋은 조언이긴 한데, 듣기 싫어."},
    {id:"lucifer-thought-distant-05",category:"과거",frequency:"rare",rarity:"RARE",minAffection:20,maxAffection:100,text:"가족사진은 보여줘도 되는 것과 안 되는 것이 있다.\n그 선은 아직 내가 정해."},

    // 중간 호감도부터 누적
    {id:"lucifer-thought-neutral-01",category:"일상",frequency:"common",rarity:"COMMON",minAffection:30,maxAffection:100,text:"작업대 밑에 여분 오리가 너무 많아졌네.\n하나쯤 줘도 티 안 나겠지."},
    {id:"lucifer-thought-neutral-02",category:"일상",frequency:"common",rarity:"COMMON",minAffection:25,maxAffection:100,text:"그… 매기.\n아니, Vaggie.\n이번에는 맞았다."},
    {id:"lucifer-thought-neutral-03",category:"관계",frequency:"normal",rarity:"UNCOMMON",minAffection:35,maxAffection:100,text:"같은 질문을 다시 하는 건 답을 못 들었다는 뜻일까, 그냥 또 듣고 싶은 걸까."},
    {id:"lucifer-thought-neutral-04",category:"과거",frequency:"normal",rarity:"UNCOMMON",minAffection:35,maxAffection:100,text:"낡은 악보는 연주하는 것보다 그냥 두는 게 편하다.\n…그래도 음악 오리 정도면 괜찮겠지."},
    {id:"lucifer-thought-neutral-05",category:"천국",frequency:"normal",rarity:"UNCOMMON",minAffection:40,maxAffection:100,text:"말로 설명하기 싫으면 별 지도를 보여주는 방법도 있겠네.\n그게 더 쉬울지도 몰라."},
    {id:"lucifer-thought-neutral-06",category:"관계",frequency:"normal",rarity:"UNCOMMON",minAffection:45,maxAffection:100,text:"우울한 오리를 보고도 바로 이유부터 묻진 않았지.\n그건 기억해둘 만해."},
    {id:"lucifer-thought-neutral-07",category:"지옥",frequency:"normal",rarity:"UNCOMMON",minAffection:30,maxAffection:100,text:"사슴 대가리 오리를 보고 웃었던 표정이 아직 기억나네.\n뭐가 그렇게 마음에 든 거야."},
    {id:"lucifer-thought-neutral-08",category:"천국",frequency:"rare",rarity:"RARE",minAffection:50,maxAffection:100,text:"오래된 장식핀 하나쯤은 이제 내가 안 가지고 있어도 되나.\n…아직 모르겠네."},

    // 높은 호감도에서 열리고 이후에도 유지
    {id:"lucifer-thought-warm-01",category:"관계",frequency:"common",rarity:"COMMON",minAffection:55,maxAffection:100,text:"요즘은 안 보이면 오히려 좀 이상하네.\n언제부터 이렇게 자주 봤다고."},
    {id:"lucifer-thought-warm-02",category:"일상",frequency:"common",rarity:"COMMON",minAffection:50,maxAffection:100,text:"여분 하나 주면 좋아하긴 하더라.\n그러니까 만든 보람은 있지."},
    {id:"lucifer-thought-warm-03",category:"일상",frequency:"normal",rarity:"UNCOMMON",minAffection:55,maxAffection:100,text:"첫 번째 오리 원본은 절대 안 줘.\n두 번째 시제품을 준 것도 꽤 많이 준 거야."},
    {id:"lucifer-thought-warm-04",category:"관계",frequency:"normal",rarity:"UNCOMMON",minAffection:50,maxAffection:100,text:"찰리 오리를 몇 번이나 들여다보는지.\n그렇게 마음에 드나.\n…잘 만들긴 했어."},
    {id:"lucifer-thought-warm-05",category:"일상",frequency:"normal",rarity:"UNCOMMON",minAffection:45,maxAffection:100,text:"미니 오리를 더 작게 만들 수는 있어.\n문제는 내가 먼저 잃어버릴 것 같다는 거지."},
    {id:"lucifer-thought-warm-06",category:"일상",frequency:"normal",rarity:"UNCOMMON",minAffection:45,maxAffection:100,text:"그 사과 씨앗, 진짜 심으려나.\n싹이 나면 조금 웃길 것 같기도 하고."},
    {id:"lucifer-thought-warm-07",category:"과거",frequency:"normal",rarity:"UNCOMMON",minAffection:55,maxAffection:100,text:"사진 대신 빈 액자를 준 건 잘한 선택이었어.\n무엇을 넣을지는 저 사람이 정하면 되고."},
    {id:"lucifer-thought-warm-08",category:"관계",frequency:"rare",rarity:"RARE",minAffection:60,maxAffection:100,text:"사과하는 문장을 연습하는 걸 못 본 척해준 건… 고마웠지.\n그때는 말 안 했지만."},
    {id:"lucifer-thought-warm-09",category:"천국",frequency:"rare",rarity:"RARE",minAffection:55,maxAffection:100,text:"에밀리는 질문이 많고, 저 사람은 그 질문을 또 가져온다.\n천국 얘기를 피하는 것도 점점 일이네."},
    {id:"lucifer-thought-warm-10",category:"관계",frequency:"rare",rarity:"RARE",minAffection:65,maxAffection:100,text:"혼자 있고 싶은 거랑 외로운 건 다르다고 했지.\n그걸 바로 알아들은 사람이 있다는 건… 생각보다 나쁘지 않다."},

    // 매우 가까워졌을 때 추가
    {id:"lucifer-thought-close-01",category:"관계",frequency:"common",rarity:"COMMON",minAffection:70,maxAffection:100,text:"이제는 또 무슨 질문을 들고 올지 대충 예상돼.\n이상하게 그게 싫진 않고."},
    {id:"lucifer-thought-close-02",category:"일상",frequency:"common",rarity:"COMMON",minAffection:65,maxAffection:100,text:"같은 오리 얘기를 세 번씩 물어보는 걸 보면 저 사람도 슬슬 수집가 다 됐네.\n내 영향이 아주 훌륭해."},
    {id:"lucifer-thought-close-03",category:"관계",frequency:"normal",rarity:"UNCOMMON",minAffection:70,maxAffection:100,text:"내가 준 물건을 잘 가지고 있는지 괜히 확인하게 된다.\n뺏어올 생각은 없는데. 그냥 확인만."},
    {id:"lucifer-thought-close-04",category:"관계",frequency:"normal",rarity:"UNCOMMON",minAffection:75,maxAffection:100,text:"손글씨 카드를 굳이 다시 읽어주진 않을 거야.\n이미 썼고, 이미 줬고… 그걸로 충분하잖아."},
    {id:"lucifer-thought-close-05",category:"과거",frequency:"normal",rarity:"UNCOMMON",minAffection:80,maxAffection:100,text:"편지를 읽지 않았다는 걸 안다.\n그래서 아직 맡겨둘 수 있는 거고."},
    {id:"lucifer-thought-close-06",category:"천국",frequency:"normal",rarity:"UNCOMMON",minAffection:75,maxAffection:100,text:"별 지도에서 하나쯤 내가 먼저 골라 설명해줘도 괜찮을 것 같다.\n질문을 기다리지 않고."},
    {id:"lucifer-thought-close-07",category:"일상",frequency:"normal",rarity:"UNCOMMON",minAffection:65,maxAffection:100,text:"내 오리를 몇 번이나 확인하는지 모르겠네.\n취향은 아주 훌륭하다고 해두자."},
    {id:"lucifer-thought-close-08",category:"관계",frequency:"rare",rarity:"RARE",minAffection:80,maxAffection:100,text:"그 우울한 오리를 맡겼을 때 이상하게 마음이 조금 조용해졌었다.\n물건 하나 옮긴 것뿐인데."},
    {id:"lucifer-thought-close-09",category:"천국",frequency:"rare",rarity:"EPIC",minAffection:90,maxAffection:100,text:"후광 조각은 보여주기 싫어서 숨긴 게 아니었다.\n보여주면 그때의 나까지 같이 보일 것 같아서 싫었던 거지."},
    {id:"lucifer-thought-close-10",category:"비밀",frequency:"rare",rarity:"EPIC",minAffection:85,maxAffection:100,text:"말하지 않아도 기다려주는 사람이 있다는 건 이상하다.\n예전엔 기다림이 이렇게 편한 거라고 생각한 적이 없었는데."},
    {id:"lucifer-thought-close-11",category:"과거",frequency:"rare",rarity:"EPIC",minAffection:85,maxAffection:100,text:"찰리에게 쓰다 만 말들은 아직 많다.\n언젠가 전부 말할 수 있을까.\n…적어도 예전보단 가능성이 있어 보인다."},
    {id:"lucifer-thought-close-12",category:"관계",frequency:"rare",rarity:"EPIC",minAffection:90,maxAffection:100,text:"내가 먼저 무언가를 보여주고 싶다는 생각이 드는 건 꽤 오랜만이다.\n질문받기 전에, 그냥 내가 먼저."}
  ];


  function autoRangeForExistingThought(thought){
    const text=String(thought?.text||"");
    const category=String(thought?.category||"일상");
    const frequency=String(thought?.frequency||"common");

    // Clearly early/guarded inner voice should fade out after the relationship changes.
    const earlyGuarded=/(아직은|굳이 .*필요|필요한 말만|손대지|자동으로 편해|과거 얘기는 안|누구한테도|왜 이렇게 자주|경계|낯설|믿을 이유|상관없어)/i.test(text);
    if(earlyGuarded){
      const min=0;
      const max=/(과거|누구한테도|경계|믿을 이유)/i.test(text)?45:35;
      return{minAffection:min,maxAffection:max};
    }

    let min={
      "일상":0,
      "지옥":15,
      "관계":30,
      "과거":45,
      "천국":50,
      "비밀":70
    }[category] ?? 15;

    // Content-specific adjustments. These only determine when the thought unlocks;
    // ordinary unlocked thoughts stay in the pool at higher affection.
    if(/오리|러버덕|사과|서류|왕관|모자|피아노|악보|호텔|회의|열쇠|장난|작업대|가챠/i.test(text))min=Math.min(min,25);
    if(/찰리|딸|아빠|가족|가족사진|액자/i.test(text))min=Math.max(min,45);
    if(/배기|Vaggie|알래스터|사슴|허스크|니프티|엔젤|복스|Vox|마몬|사탄|오지|비\b/i.test(text))min=Math.max(min,25);
    if(/에밀리|천사|천국|별 지도|별지도|에덴|장식핀/i.test(text))min=Math.max(min,50);
    if(/과거|예전|기억|후회|미안|사과하|연습/i.test(text))min=Math.max(min,55);
    if(/외롭|혼자 있고 싶은|기다려|편해|믿|의지|고맙|고마워|보고 싶|곁에/i.test(text))min=Math.max(min,65);
    if(/편지|손글씨|릴리스|반지|커플링/i.test(text))min=Math.max(min,75);
    if(/후광|추락|타락|떨어지던|그때의 나/i.test(text))min=Math.max(min,85);
    if(/사랑|소중|잃고 싶지|먼저 .*보여주|먼저 .*말해/i.test(text))min=Math.max(min,85);

    if(frequency==="rare")min+=5;
    else if(frequency==="normal")min+=2;

    min=Math.max(0,Math.min(95,min));
    return{minAffection:min,maxAffection:100};
  }

  function migrateExistingLuciferThoughtRanges(source,luciferId,normalize){
    let changed=false;
    const curatedIds=new Set(THOUGHTS.map(row=>row.id));

    source.thoughts=(source.thoughts||[]).map(thought=>{
      if(thought?.characterId!==luciferId)return thought;
      if(curatedIds.has(String(thought.id||"")))return thought;

      const normalized=normalize(thought);
      const min=Number(normalized.minAffection||0);
      const max=Number(normalized.maxAffection??100);

      // Respect any range the user has already set manually.
      if(min!==0||max!==100)return normalized;

      const range=autoRangeForExistingThought(normalized);
      if(range.minAffection===0&&range.maxAffection===100)return normalized;

      changed=true;
      return normalize({...normalized,...range});
    });

    return changed;
  }

  window.HV_APPLY_THOUGHT_PRESETS=(source,helpers={})=>{
    let prior={state:source,changed:false};
    if(typeof previous==="function"){
      try{prior=previous(source,helpers)||prior}catch{prior={state:source,changed:false}}
    }
    source=prior?.state||source;
    let changed=Boolean(prior?.changed);
    if(!source||!Array.isArray(source.characters)||!Array.isArray(source.thoughts))return{...prior,state:source,changed};

    const lucifer=(source.characters||[]).find(character=>
      character?.id===C||String(character?.name||"").trim().toLowerCase()==="lucifer morningstar"
    );
    if(!lucifer)return{...prior,state:source,changed};

    source.storyPackVersions ||= {};
    const versionKey="thought-preset-lucifer-affinity";
    const previousVersion=Number(source.storyPackVersions[versionKey]||0);
    if(previousVersion>=VERSION)return{...prior,state:source,changed};

    const normalize=typeof helpers.normalizeThought==="function"?helpers.normalizeThought:value=>value;

    if(migrateExistingLuciferThoughtRanges(source,lucifer.id,normalize))changed=true;

    for(const raw of THOUGHTS){
      const fresh=normalize({...raw,characterId:lucifer.id,enabled:true});
      const index=source.thoughts.findIndex(row=>row.id===fresh.id);
      if(index<0)source.thoughts.push(fresh);
      else source.thoughts[index]=fresh;
      changed=true;
    }

    source.storyPackVersions[versionKey]=VERSION;
    changed=true;
    window.HV_LUCIFER_THOUGHT_PRESET_VERSION=VERSION;
    return{...prior,state:source,changed,luciferThoughtPresetVersion:VERSION};
  };
})();