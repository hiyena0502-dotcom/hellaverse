"use strict";

(()=>{
  const VERSION=1;
  const PREF_DELTA={LOVED:5,LIKED:3,NEUTRAL:1,DISLIKED:-2,HATED:-4};
  const EMOTION_BY_PREF={
    LOVED:["joy",60],LIKED:["joy",38],NEUTRAL:["curious",24],
    DISLIKED:["guarded",38],HATED:["angry",62]
  };
  const RARITY_RANGE={
    COMMON:[1.12,1.86],UNCOMMON:[.92,1.48],RARE:[.72,1.20],
    EPIC:[.50,.94],LEGENDARY:[.30,.68],MISTIC:[.15,.44]
  };
  const EXACT_WEIGHT=[
    [/오버로드.*회의.*초대장/i,1.08],
    [/사탄.*독촉장/i,.84],
    [/빈\s*액자/i,.66],
    [/최고의\s*아빠.*머그컵/i,.78],
    [/찰리.*보내려다.*편지/i,.62],
    [/오래된\s*별\s*지도/i,.57],
    [/부러진\s*후광/i,.23],
    [/천국\s*시절.*장식핀/i,.20],
    [/사과\s*씨앗/i,.46],
    [/에덴.*잎사귀/i,.18],
    [/러버덕/i,.48]
  ];
  const EXACT_PREF=[
    [/사탄.*독촉장/i,{preference:"DISLIKED",emotionState:"angry",emotionIntensity:46,specialMinAffection:58}],
    [/빈\s*액자/i,{preference:"NEUTRAL",emotionState:"guarded",emotionIntensity:30,specialMinAffection:55}],
    [/최고의\s*아빠.*머그컵/i,{preference:"LOVED",emotionState:"embarrassed",emotionIntensity:58,specialMinAffection:52}],
    [/찰리.*보내려다.*편지/i,{preference:"LIKED",emotionState:"embarrassed",emotionIntensity:50,specialMinAffection:62}],
    [/오래된\s*별\s*지도/i,{preference:"LIKED",emotionState:"curious",emotionIntensity:42,specialMinAffection:58}],
    [/부러진\s*후광/i,{preference:"DISLIKED",emotionState:"sad",emotionIntensity:52,specialMinAffection:68}],
    [/천국\s*시절.*장식핀/i,{preference:"NEUTRAL",emotionState:"guarded",emotionIntensity:42,specialMinAffection:66}],
    [/사과\s*씨앗/i,{preference:"LOVED",emotionState:"joy",emotionIntensity:60,specialMinAffection:56}],
    [/에덴.*잎사귀/i,{preference:"NEUTRAL",emotionState:"guarded",emotionIntensity:44,specialMinAffection:70}],
    [/러버덕/i,{preference:"LOVED",emotionState:"joy",emotionIntensity:70,specialMinAffection:48}]
  ];

  const key=v=>String(v||"").normalize("NFKC").trim().toLowerCase();
  const hash=value=>{
    let h=2166136261;
    for(const ch of String(value||"")){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}
    return h>>>0;
  };
  const charKey=character=>key(character?.id||character?.name).replace(/[^a-z0-9가-힣]+/g,"");
  const round2=n=>Math.round(n*100)/100;
  const exact=(list,name)=>list.find(([pattern])=>pattern.test(String(name||"")))?.[1];

  function individualWeight(item){
    const override=exact(EXACT_WEIGHT,item.name);
    if(override!=null)return override;
    const [lo,hi]=RARITY_RANGE[item.rarity]||RARITY_RANGE.COMMON;
    const fraction=(hash((item.id||"")+"::"+(item.name||""))%1000)/999;
    let value=lo+(hi-lo)*fraction;
    if(item.acquisitionMode==="unique")value*=.88;
    if(item.secret)value*=.72;
    return Math.max(.01,round2(value));
  }

  const sentimental=/편지|사진|포토|리본|기념|머그컵|일기|노트|카드|추억|악보|별\s*지도|씨앗|레시피|손수건|브로치|장식핀|목걸이|반지/i;
  const painful=/독촉|부러진|찢어진|깨진|낡아버린|빚|벌금|경고|처형|후광|피묻|핏자국|실패 보고|거절/i;
  const practical=/열쇠|키카드|붕대|지도|도구|렌치|나사|기어|호루라기|체크리스트|장갑|칼|무기|부품|렌즈/i;
  const playful=/오리|러버덕|스티커|장난감|인형|반짝|왕관|굿즈/i;

  function preferenceFor(item){
    const override=exact(EXACT_PREF,item.name);
    if(override)return override;
    let preference="NEUTRAL";
    if(painful.test(item.name))preference="DISLIKED";
    else if(sentimental.test(item.name))preference=["EPIC","LEGENDARY","MISTIC"].includes(item.rarity)?"LOVED":"LIKED";
    else if(practical.test(item.name))preference="LIKED";
    else if(playful.test(item.name))preference="LIKED";
    else if(["LEGENDARY","MISTIC"].includes(item.rarity))preference="LOVED";
    else if(["RARE","EPIC"].includes(item.rarity))preference="LIKED";
    const [emotionState,emotionIntensity]=EMOTION_BY_PREF[preference]||EMOTION_BY_PREF.NEUTRAL;
    const specialMinAffection={COMMON:52,UNCOMMON:54,RARE:57,EPIC:60,LEGENDARY:64,MISTIC:68}[item.rarity]||58;
    return{preference,emotionState,emotionIntensity,specialMinAffection};
  }

  const dialogue=(id,character,text)=>({
    id,type:"dialogue",speaker:character.name||"",speakerCharacterId:character.id,text
  });
  const narration=(id,text)=>({id,type:"narration",text});

  function voice(character,item,phase,pref){
    const ck=charKey(character),n=item.name;
    const loved=pref==="LOVED"||pref==="LIKED";
    const disliked=pref==="DISLIKED"||pref==="HATED";
    const lines={
      lucifermorningstar:{
        first:disliked?`...아. 「${n}」. 이건 굳이 다시 보고 싶던 물건은 아닌데.`:loved?`오! 잠깐, 「${n}」을 어디서 찾았어? 하, 이건 좀 반칙인데.`:`「${n}」라... 꽤 오래된 물건이네. 네가 이걸 가져올 줄은 몰랐어.`,
        repeat:disliked?`또 이거야? 네가 일부러 내 표정 구경하는 거라면 제법 성공적이네.`:loved?`하하! 또 가져왔네. 좋아, 이건 내가 잘 챙겨둘게.`:`응, 기억하고 있어. 이번엔 놀라진 않을게.`,
        special:disliked?`...그래도 네가 가져온 거라면 버리진 않을게. 싫은 기억까지 전부 없었던 일로 만들 순 없으니까.`:`이걸 네가 나한테 건넨다는 게 이상하게 좋네. 물건 자체보다... 네가 기억해줬다는 게.`
      },
      charliemorningstar:{
        first:disliked?`어... 고마워! 진짜로! 조금 복잡한 물건이긴 하지만 네 마음은 기뻐!`:`와!! 「${n}」?! 이거 진짜 나 주는 거야?! 너무 고마워!!`,
        repeat:`또 챙겨왔어?! 세상에, 너 진짜 세심하다! 이번 것도 잘 둘게!`,
        special:`나 이런 거 받으면 자꾸 다 기억하고 싶어져! 오늘도 좋은 기억으로 남길게. 정말 고마워!!`
      },
      vaggie:{
        first:disliked?`...이걸 왜 나한테 주는지부터 설명해. 버리진 않겠지만 좋아하진 않아.`:`「${n}」? 쓸모 있겠네. 아니면 적어도 네가 신경 써서 골랐다는 건 알겠어. 고마워.`,
        repeat:`응, 이거 기억해. 또 챙겨준 건 고맙고. 잃어버리지 않게 둘게.`,
        special:`네가 그냥 아무거나 주는 사람이 아니라는 건 알아. 그래서 더 고맙게 받을게.`
      },
      alastor:{
        first:disliked?`호오. 「${n}」이라... 취향이 대단히 짓궂으시군요. 그래도 선물은 선물이니 받아두지요.`:`하하! 「${n}」이라니, 제법 흥미로운 선택입니다. 감사히 받도록 하지요.`,
        repeat:`또 이 물건입니까? 반복에도 나름의 운치가 있지요. 잘 보관하겠습니다.`,
        special:`당신이 제 취향을 관찰해 왔다는 사실이 물건보다 더 흥미롭군요. 아주 훌륭합니다.`
      },
      angeldust:{
        first:disliked?`어우, 자기야. 이건 좀 아니지. 그래도 네가 준 거니까 바로 쓰레기통엔 안 넣을게.`:`오, 자기. 「${n}」? 생각보다 센스 있는데? 나 주는 거 맞지?`,
        repeat:`또 챙겨왔네? 나 버릇 나빠지면 네 책임이다, 알지?`,
        special:`...농담 말고, 고마워. 나한테 뭘 줄 때 대가부터 생각 안 하는 사람, 생각보다 별로 없거든.`
      },
      husk:{
        first:disliked?`젠장, 하필 이거냐. ...뭐, 가져왔으니 받긴 할게.`:`「${n}」? 나쁘진 않네. 고맙다. 거기 두면 돼.`,
        repeat:`또 이거네. 됐어, 알아. 네가 챙겨온 건 고맙게 받을게.`,
        special:`물건보다 네가 계속 챙겨주는 게 더 신경 쓰이네. 좋은 뜻으로. ...고맙다.`
      },
      niffty:{
        first:disliked?`으악!! 이거 싫어!! 근데 싫어서 더 보고 싶어!! 잠깐만, 닦으면 달라질까?!`:`꺄아아!! 「${n}」?! 나 줘?! 진짜?! 어디부터 닦지?! 아니 먼저 숨겨둘까?!`,
        repeat:`또야?! 좋아!! 같은 게 두 개면 하나는 쓰고 하나는 비상용으로 숨기면 돼!!`,
        special:`나 이거 진짜 좋아해!! 그리고 네가 가져오는 것도 좋아!! 다음엔 뭐 가져올 거야?! 지금 말해줘!!`
      },
      baxter:{
        first:disliked?`이건 실험 가치가 낮아 보여. ...하지만 폐기 전에 분석은 해보지. 데이터는 데이터니까.`:`오호! 「${n}」이라! 질량, 재질, 반응성부터 측정해야겠군. 선물이라고? 더 좋지! 표본 확보 완료!`,
        repeat:`또 같은 표본인가? 훌륭해! 대조군이 늘었군. 과학은 반복에서 강해지는 법이지!`,
        special:`좋아, 이건 내 개인 보관함에 넣겠다! 실험 재료가 아니라 '내 것'으로. ...왜 웃지? 과학자도 소유욕은 있어!`
      },
      emily:{
        first:disliked?`어, 이건 조금 무섭다! 그래도 나 생각해서 가져온 거지?! 고마워!! 조심해서 볼게!`:`우와아!! 「${n}」?! 나한테 주는 거야?! 진짜?! 너무 좋아!! 고마워!!`,
        repeat:`또 가져왔어?! 와!! 나 이제 이거 전문가 될 것 같아!! 같이 어디 둘지 정하자!`,
        special:`나 진짜 기뻐!! 네가 나 생각하면서 골랐다는 게 제일 좋아!! 이건 오래오래 기억할래!!`
      },
      lute:{
        first:disliked?`이딴 걸 왜 나한테 줘? 치워. ...아니, 됐어. 이미 가져왔으니 내가 처리하지.`:`「${n}」? ...쓸데없는 짓 했네. 그래도 완전히 형편없는 선택은 아니야.`,
        repeat:`또냐. 네가 끈질긴 건 알겠어. 거기 둬. 내가 알아서 할 테니까.`,
        special:`착각하지 마. 물건 때문에 봐주는 거 아니야. ...그래도 네가 고른 건 이제 대충 믿을 만해.`
      },
      adam:{
        first:disliked?`뭐야, 이딴 걸 나한테 준다고? 존나 웃기네. ...됐어, 두고 가.`:`오, 「${n}」? 드디어 좀 보는 눈이 생겼네. 나한테 어울리는 걸 가져와야지, 당연히.`,
        repeat:`또 가져왔냐? 하, 그래. 나한테 선물하는 맛 들였네. 이해한다. 나라도 그럴 듯.`,
        special:`씨발, 알았어. 이건 진짜 마음에 든다. 너무 뿌듯해하진 마. 네 안목이 내 수준에 잠깐 올라온 거니까.`
      },
      vox:{
        first:disliked?`이걸 내 앞까지 들고 온 이유가 뭐지? 내 시간을 쓸 만큼 가치 있어 보이진 않는데.`:`「${n}」? 흠. 최소한 완전히 수준 이하인 선택은 아니네. 거기 둬.`,
        repeat:`또 이거야? 적어도 일관성은 있네. 내 스케줄 방해한 값으로는 받아두지.`,
        special:`좋아, 인정할게. 네가 고른 건 이제 확인할 가치가 있어. 이건 내가 직접 보관하지.`
      },
      sirpentious:{
        first:disliked?`이, 이게 선물이라고?! Sssss실로 당황스럽군! ...그래도 위대한 나는 관대하게 받아주겠다!`:`오오! 「${n}」! 훌륭하다! 자네가 드디어 나의 천재적인 취향을 이해했군!`,
        repeat:`또 가져왔나! Sssss좋다! 예비 부품— 아니, 소중한 선물은 많을수록 좋은 법이지!`,
        special:`자네가 이렇게 계속 챙겨줄 줄은 몰랐네. Sssss솔직히... 꽤 기쁘군. 아주 조금이 아니라 꽤 많이!`
      },
      cherribomb:{
        first:disliked?`야, 이건 좀 구린데. 그래도 네가 직접 들고 왔으니까 버리진 않을게.`:`오, 「${n}」? 존나 괜찮은데? 센스 있네!`,
        repeat:`또 가져왔냐? 좋아, 이쯤 되면 네가 뭘 골라올지 기대되는데.`,
        special:`진짜 고맙다. 다음엔 선물 말고 같이 놀러 가자. 그게 더 재밌잖아.`
      }
    };
    const fallback={
      first:disliked?`「${n}」을 받아 들고 표정이 잠시 굳는다. 그래도 선물은 받아둔다.`:`「${n}」을 받아 들고 자세히 살펴본다. 고맙다는 뜻을 전한다.`,
      repeat:`익숙한 물건을 다시 받아 들고 가볍게 반응한다.`,
      special:`이번에는 물건보다 그것을 골라온 마음을 더 오래 바라본다.`
    };
    const set=lines[ck]||fallback;
    return set[phase]||fallback[phase];
  }

  function customLucifer(item,phase){
    const name=String(item.name||"");
    const table=[
      [/사탄.*독촉장/i,{
        first:"아, 젠장. 사탄이 아직도 이걸 보관하고 있었어? 아니, 잠깐. 왜 네가 가지고 있었는데?",
        repeat:"이 종이만 보면 머리가 아파. 다음엔 사탄한테 그냥 내가 죽었다고 해.",
        special:"...예전엔 이런 것까지 전부 외면했지. 지금은 적어도 읽어볼게. 네가 갖고 왔으니까."
      }],
      [/최고의\s*아빠.*머그컵/i,{
        first:"뭐야, 이거— 잠깐. '최고의 아빠'? 하하... 찰리가 만든 거야? 아니면 네가?",
        repeat:"또 이 머그컵이네. 좋아, 오늘 커피는 여기다 마실게. 절대 일부러 자랑하는 건 아니고.",
        special:"이 문구가 예전엔 농담처럼 느껴졌을 텐데... 지금은 좀 믿어보고 싶어. 고마워."
      }],
      [/찰리.*보내려다.*편지/i,{
        first:"...이걸 어디서 찾았어? 이건 찰리한테 보내려고 했다가 결국 접어둔 건데.",
        repeat:"또 읽을 필요는 없어. 내용은 아직 다 기억해. 너무 잘 기억해서 문제지.",
        special:"이번엔 끝까지 써볼까 해. 보내는 것까지. ...옆에 있어줄래?"
      }],
      [/부러진\s*후광/i,{
        first:"...그건 내려놔. 미안, 네가 잘못한 건 아닌데... 갑자기 보기엔 좀 세네.",
        repeat:"이젠 놀라진 않아. 그렇다고 편해진 것도 아니고.",
        special:"부러졌다는 사실보다, 한때 이게 내 일부였다는 게 더 이상해. 그래도 이제는 손에 들 수 있네."
      }],
      [/천국\s*시절.*장식핀/i,{
        first:"와. 이 디자인, 진짜 그대로네. 천국은 물건을 안 버리는 취미라도 있나?",
        repeat:"응, 기억나. 너무 선명하게 기억나서 별로 반갑진 않지만.",
        special:"싫은 기억만 있는 건 아니야. 그걸 인정하는 데 오래 걸렸을 뿐이지."
      }],
      [/사과\s*씨앗/i,{
        first:"사과 씨앗? 하! 이건 좀 귀엽다. 심어볼까? 지옥에서 제대로 자라면 그것도 기적이겠네.",
        repeat:"또 씨앗이네! 좋아, 이번엔 화분부터 제대로 고르자. 지난번보다 성공률이 높아졌어.",
        special:"뭔가를 다시 심는다는 건... 생각보다 기분 좋은 일이네. 이번엔 끝까지 키워보고 싶어."
      }],
      [/에덴.*잎사귀/i,{
        first:"...에덴의 잎사귀. 와, 오늘 정말 과거 여행 제대로 시켜주네.",
        repeat:"이걸 보면 아직도 머릿속에 너무 많은 장면이 한꺼번에 떠올라.",
        special:"모든 시작이 좋은 결말로 이어지진 않았지. 그래도 그때의 선택 전부를 후회한다고 말하고 싶진 않아."
      }],
      [/러버덕/i,{
        first:"오! 오오, 잠깐만! 이건 진짜 괜찮은데?! 봐, 부리 각도까지 완벽해!",
        repeat:"또 오리야?! 하하! 좋아, 얘는 저 선반 맨 앞자리다. 반박 안 받아.",
        special:"네가 내가 오리 좋아하는 걸 기억해주는 게... 생각보다 엄청 좋네. 이건 절대 안 잃어버릴게."
      }],
      [/빈\s*액자/i,{
        first:"빈 액자라... 뭐, 꼭 빈 채로 둘 필요는 없지. 사진 하나 고르면 되니까.",
        repeat:"아직 뭘 넣을지는 못 정했어. 선택지가 많아서가 아니라... 반대에 가깝지만.",
        special:"찰리랑 새로 찍은 사진을 넣을까 해. 과거보다 지금 걸 걸어두는 편이 낫잖아."
      }],
      [/오래된\s*별\s*지도/i,{
        first:"별 지도? 이건 꽤 오래된 방식인데. 예전엔 이런 걸 보고 길 찾는 걸 좋아했어.",
        repeat:"몇몇 별자리는 아직 이름까지 기억나. 이상하지? 이렇게 오래됐는데.",
        special:"언젠가 찰리한테도 보여주고 싶네. 내가 알던 하늘이 어떤 곳이었는지, 좋은 얘기부터 조금씩."
      }]
    ];
    const match=table.find(([pattern])=>pattern.test(name));
    return match?.[1]?.[phase]||"";
  }

  function buildReaction(item,character){
    const settings=preferenceFor(item);
    const preference=settings.preference;
    const delta=PREF_DELTA[preference]??1;
    const base=(item.id||"item")+"::"+character.id;
    const custom=charKey(character)==="lucifermorningstar";
    const text=phase=>customLucifer(item,phase)||voice(character,item,phase,preference);
    return{
      id:"preset-reaction-"+base.replace(/[^a-zA-Z0-9_-]+/g,"-"),
      characterId:character.id,
      preference,
      affectionDelta:delta,
      emotionState:settings.emotionState,
      emotionIntensity:settings.emotionIntensity,
      specialMinAffection:settings.specialMinAffection,
      specialEmotionState:"",
      specialEmotionIntensity:0,
      firstEntries:[
        narration(base+"-first-n",`${character.name}가 「${item.name}」을(를) 받아 든다.`),
        dialogue(base+"-first-d",character,text("first"))
      ],
      repeatEntries:[dialogue(base+"-repeat-d",character,text("repeat"))],
      specialEntries:[
        narration(base+"-special-n",`${character.name}가 이번에는 물건을 바로 치우지 않고 잠시 더 바라본다.`),
        dialogue(base+"-special-d",character,text("special"))
      ]
    };
  }

  function placeholderReaction(reaction){
    if(!reaction)return true;
    const flows=[reaction.firstEntries,reaction.repeatEntries,reaction.specialEntries];
    const hasFlow=flows.some(list=>Array.isArray(list)&&list.length);
    if(hasFlow)return false;
    return reaction.preference==="NEUTRAL"&&Number(reaction.affectionDelta||0)<=1;
  }

  window.HV_APPLY_ITEM_PRESETS=(source,helpers={})=>{
    if(!source||!Array.isArray(source.items))return{state:source,changed:false};
    const normalizeReaction=typeof helpers.normalizeItemReaction==="function"
      ?helpers.normalizeItemReaction
      :value=>value;
    let changed=false;
    const currentVersion=Math.max(0,Number(source.itemPresetVersion)||0);
    if(currentVersion>=VERSION)return{state:source,changed:false};

    const characters=Array.isArray(source.characters)?source.characters:[];
    const byId=new Map(characters.map(character=>[character.id,character]));
    for(const item of source.items){
      const nextWeight=individualWeight(item);
      if(Number(item.weight)!==nextWeight){item.weight=nextWeight;changed=true}

      const owner=byId.get(item.collectionCharacterId);
      if(!owner||item.giftable===false)continue;
      item.reactions=Array.isArray(item.reactions)?item.reactions:[];
      const index=item.reactions.findIndex(reaction=>reaction.characterId===owner.id);
      const preset=normalizeReaction(buildReaction(item,owner),owner.id);
      if(index<0){
        item.reactions.push(preset);
        changed=true;
      }else if(placeholderReaction(item.reactions[index])){
        item.reactions[index]=preset;
        changed=true;
      }else{
        const old=item.reactions[index];
        let patched=false;
        if(!old.firstEntries?.length){old.firstEntries=preset.firstEntries;patched=true}
        if(!old.repeatEntries?.length){old.repeatEntries=preset.repeatEntries;patched=true}
        if(!old.specialEntries?.length){old.specialEntries=preset.specialEntries;patched=true}
        if(!old.specialMinAffection){old.specialMinAffection=preset.specialMinAffection;patched=true}
        if(!old.emotionState){old.emotionState=preset.emotionState;old.emotionIntensity=preset.emotionIntensity;patched=true}
        if(patched)changed=true;
      }
    }
    source.itemPresetVersion=VERSION;
    return{state:source,changed:true||changed};
  };
  window.HV_ITEM_PRESET_VERSION=VERSION;
})();
