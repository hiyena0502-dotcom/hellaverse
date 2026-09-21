"use strict";

(()=>{
  const VERSION=4;
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
    [/오[버베]로드.*회의.*초대장/i,1.08],
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

  const CHARACTER_TASTES={
    charliemorningstar:{love:/편지|사진|별|수제품|리본|기념|희망|호텔/i,dislike:/무기|처형|피묻|독촉/i},
    sera:{love:/천국|기록|문서|후광|장식핀/i,dislike:/폭탄|악마|피묻|저주/i},
    lute:{love:/검|무기|훈장|보고서|전투|천국/i,dislike:/인형|리본|장난감|오리/i},
    adam:{love:/기타|왕관|굿즈|무기|날개|천국/i,dislike:/독촉|청소|업무|사과문/i},
    vaggie:{love:/무기|지도|열쇠|체크리스트|붕대|사진/i,dislike:/함정|저주|위험/i},
    alastor:{love:/라디오|요리|악보|빈티지|레시피|마이크/i,dislike:/텔레비전|디지털|굿즈/i},
    vox:{love:/화면|전선|기어|렌즈|리모컨|기술|시청률/i,dislike:/라디오|낡은|빈티지/i},
    niffty:{love:/바늘|리본|청소|칼|벌레|단추|레이스/i,dislike:/먼지|곰팡이/i},
    angeldust:{love:/화장|향수|장신구|리본|사진|술|옷/i,dislike:/계약|사슬|독촉/i},
    husk:{love:/술|카드|병|칩|커피|열쇠/i,dislike:/반짝|소음|굿즈/i},
    blitzo:{love:/말|총|무기|칼|폭탄|스티커|사진/i,dislike:/계약서|업무철|벌금/i},
    paimon:{love:/왕관|인장|왕실|보석|문서|금빛/i,dislike:/싸구려|낡은|수제품/i},
    satan:{love:/운동|불|쇠|장갑|무기|문진/i,dislike:/핑크|리본|인형/i},
    mammon:{love:/돈|금|굿즈|티켓|왕관|보석/i,dislike:/무료|기부|빚/i},
    asmodeus:{love:/향수|장미|음악|무대|장신구|칵테일/i,dislike:/강요|계약|수갑/i},
    beelzebub:{love:/사탕|케이크|음식|꿀|파티|네온/i,dislike:/상한|금지|다이어트/i},
    belphegor:{love:/베개|담요|차|향|수면|구름/i,dislike:/알람|소음|독촉/i},
    leviathan:{love:/거울|바다|진주|보석|패션|사진/i,dislike:/짝퉁|깨진|촌스러운/i},
    sirpentious:{love:/기어|발명|도면|차|톱니|폭탄/i,dislike:/실패|고장/i},
    cherribomb:{love:/폭탄|불꽃|스프레이|술|무기/i,dislike:/규칙|보고서|청소/i},
    velvette:{love:/패션|화장|사진|휴대폰|리본|굿즈/i,dislike:/구식|낡은|촌스러운/i},
    valentino:{love:/향수|장신구|술|계약|사진/i,dislike:/거절|경고|깨진/i},
    carmillacarmine:{love:/무기|장갑|인장|보고서|보석/i,dislike:/장난감|폭발|무질서/i},
    rosie:{love:/차|레시피|리본|빈티지|편지|수제품/i,dislike:/무례|싸구려|상한/i},
    abel:{love:/음악|별|깃털|간식|수제품/i,dislike:/피묻|처형|무기/i},
    emily:{love:/별|리본|수제품|편지|사진|음식/i,dislike:/처형|피묻|부러진/i},
    baxter:{love:/기어|전선|혈청|렌즈|도구|부품/i,dislike:/비과학|고장|빈\s*상자/i},
    zestial:{love:/고서|편지|차|인장|빈티지|거미/i,dislike:/휴대폰|네온|싸구려/i},
    stolas:{love:/별|책|식물|깃털|차|보석/i,dislike:/독촉|총|피묻/i},
    loona:{love:/휴대폰|헤드폰|커피|목걸이|검정/i,dislike:/리본|인형|유치/i},
    moxxie:{love:/악보|총|책|와인|도구|정장/i,dislike:/조잡|폭주|독촉/i},
    millie:{love:/칼|도끼|음식|리본|농장|수제품/i,dislike:/겁쟁이|무례/i},
    fizzarolli:{love:/무대|마이크|장난감|굿즈|리본|사진/i,dislike:/고장|계약|사슬/i},
    octavia:{love:/별|헤드폰|음악|책|검정|사진/i,dislike:/왕실|파티|소음/i}
  };
  const RELATION_TASTES={
    lucifermorningstar:{love:["charlie-morningstar"],dislike:[]},
    charliemorningstar:{love:["lucifer-morningstar","vaggie","emily"],dislike:[]},
    vaggie:{love:["charlie-morningstar"],dislike:[]},
    alastor:{love:[],dislike:["vox"]},
    vox:{love:[],dislike:["alastor"]},
    angeldust:{love:["husk","cherri-bomb"],dislike:["valentino"]},
    husk:{love:["angel-dust"],dislike:[]},
    lute:{love:["adam"],dislike:[]},
    adam:{love:["lute"],dislike:[]},
    emily:{love:["charlie-morningstar","sera"],dislike:[]},
    blitzo:{love:["loona","moxxie","millie","fizzarolli"],dislike:[]},
    loona:{love:["blitzo"],dislike:[]},
    moxxie:{love:["millie"],dislike:[]},
    millie:{love:["moxxie"],dislike:[]},
    stolas:{love:["octavia","blitzo"],dislike:[]},
    octavia:{love:["stolas"],dislike:[]},
    fizzarolli:{love:["asmodeus"],dislike:[]},
    asmodeus:{love:["fizzarolli"],dislike:[]}
  };
  const PREF_RANK={HATED:0,DISLIKED:1,NEUTRAL:2,LIKED:3,LOVED:4};
  function relationPreference(item,character,current){
    const rel=RELATION_TASTES[charKey(character)];
    const owner=String(item.collectionCharacterId||"");
    if(!rel||!owner)return current;
    if(rel.dislike?.includes(owner)&&PREF_RANK[current]>PREF_RANK.DISLIKED)return"DISLIKED";
    if(rel.love?.includes(owner)&&PREF_RANK[current]>=PREF_RANK.NEUTRAL){
      const sentimentalOwner=sentimental.test(item.name)||item.rarity==="LEGENDARY"||item.rarity==="MISTIC";
      const floor=sentimentalOwner?"LOVED":"LIKED";
      if(PREF_RANK[current]<PREF_RANK[floor])return floor;
    }
    return current;
  }
  function preferenceForCharacter(item,character){
    const base=preferenceFor(item);
    const ck=charKey(character);
    const taste=CHARACTER_TASTES[ck];
    let preference=base.preference;
    if(taste?.dislike?.test(item.name))preference="DISLIKED";
    if(taste?.love?.test(item.name))preference="LOVED";
    preference=relationPreference(item,character,preference);
    if(item.collectionCharacterId===character.id&&preference==="NEUTRAL")preference="LIKED";
    const [emotionState,emotionIntensity]=preference===base.preference
      ? [base.emotionState,base.emotionIntensity]
      : (EMOTION_BY_PREF[preference]||EMOTION_BY_PREF.NEUTRAL);
    return{...base,preference,emotionState,emotionIntensity};
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
      sera:{
        first:disliked?`이 물건은 우려스럽군요. 의도는 고맙지만 「${n}」은 신중히 다루겠습니다.`:`「${n}」을 제게? 예상하지 못했지만 성의는 알겠습니다. 고맙습니다.`,
        repeat:`같은 선물을 다시 준비했군요. 당신이 중요하게 여기는 이유가 있겠지요.`,
        special:`규정이나 의무가 아니라 저를 생각해 골랐다는 점은… 소중히 받아들이겠습니다.`
      },
      blitzo:{
        first:disliked?`뭐야, 「${n}」? 이걸 받고 좋아하길 바란 건 아니지? …일단 줘 봐.`:`오, 「${n}」! 생각보다 내 취향 잘 맞혔는데? 훔친 건 아니고? 농담이야. 아마도.`,
        repeat:`또 가져왔냐? 좋아, 이제 네 선물 루트에 내가 들어갔다는 건 확실하네.`,
        special:`이런 거 계속 주면 내가 정든 티 내야 하잖아. 빌어먹을… 고맙다.`
      },
      paimon:{
        first:disliked?`이것을 감히 왕에게 바치는 선물이라 부르는가? …그래도 네 성의는 기록해 두지.`:`「${n}」이라. 왕실의 보관품으로 삼기에 부족하지 않군. 받도록 하마.`,
        repeat:`같은 공물을 다시 바치는군. 충성심이 꾸준하다는 뜻으로 이해하지.`,
        special:`물건의 값보다 네가 나를 위해 골랐다는 사실이 흥미롭구나. 특별히 가까이 두마.`
      },
      satan:{
        first:disliked?`이딴 걸 왜 들고 왔지? 화내기 전에 설명해. …됐어, 일단 받아두지.`:`「${n}」? 제법 묵직하군. 쓸모도 있어 보여. 고맙다.`,
        repeat:`또 같은 거군. 꾸준한 건 마음에 든다. 거기 둬.`,
        special:`네가 대충 고른 게 아니라는 건 안다. 그런 성의까지 무시할 생각은 없어.`
      },
      mammon:{
        first:disliked?`이게 선물이라고? 재판매 가치도 없잖아! …잠깐, 한정판이면 얘기가 다르지.`:`「${n}」! 좋아, 이거 상품화하면 수익이— 아, 나 주는 거라고? 더 좋네!`,
        repeat:`또 가져왔어? 공급이 안정적이군! 넌 제법 쓸 만한 파트너야!`,
        special:`이건 안 팔 거야. 놀라지 마! 나도 가끔은 값을 매기지 않는 물건이 있다고.`
      },
      asmodeus:{
        first:disliked?`자기야, 마음은 예쁘지만 「${n}」은 분위기를 완전히 죽이네. 그래도 받아둘게.`:`오, 「${n}」? 센스 있네. 선물은 상대를 보고 골라야 하는데, 넌 제대로 봤어.`,
        repeat:`또 준비했어? 좋아, 이제 네가 어떤 취향으로 날 보는지 좀 알겠는데.`,
        special:`진짜 매력적인 건 물건보다 솔직한 마음이야. 오늘 건 둘 다 마음에 드네.`
      },
      beelzebub:{
        first:disliked?`어, 이건 바이브가 좀 무겁다! 그래도 나 생각해서 가져온 거지? 고마워!`:`우와! 「${n}」?! 완전 좋다! 같이 열어보자, 같이 보면 기쁨도 두 배잖아!`,
        repeat:`또야?! 최고! 같은 게 많으면 친구들이랑 나눌 수도 있겠다!`,
        special:`네가 올 때마다 파티가 아니라도 기분이 좋아져. 이건 진짜 네 덕분이야!`
      },
      belphegor:{
        first:disliked?`…이건 잠을 깨울 만큼 불편한 물건이네. 그래도 가져온 건 고마워.`:`「${n}」? 좋아. 침대 옆에 두고 천천히 볼게. 지금은 조금 졸려서.`,
        repeat:`또 가져왔구나. 거기 놓아줘… 잊은 것 같아도 다 기억하고 있어.`,
        special:`네가 조용히 챙겨주는 게 편해. 굳이 많은 말을 하지 않아도 알 수 있으니까.`
      },
      leviathan:{
        first:disliked?`「${n}」? 솔직히 내 기준엔 부족해. 그래도 네가 골랐다는 점까진 인정할게.`:`흠, 「${n}」. 사진으로 볼 때보다 괜찮네. 내 컬렉션에 둬도 되겠어.`,
        repeat:`또 같은 걸 가져왔네. 취향이 흔들리지 않는 건 나쁘지 않아.`,
        special:`남들이 가진 것보다 네가 내게 골라준 이게 더 눈에 들어오네. 조금 억울할 정도로.`
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
      },
      velvette:{
        first:disliked?`아니, 「${n}」? 이걸 내 피드에 올리면 계정이 죽어. …네 앞에서는 받아는 둘게.`:`「${n}」? 오, 생각보다 안 촌스럽네. 네 안목이 드디어 업데이트됐어.`,
        repeat:`또 이거? 일관된 콘셉트는 좋아. 사진 각도는 내가 정할게.`,
        special:`좋아, 이건 진짜 마음에 들어. 네가 골랐다는 태그는… 비공개로 달아둘게.`
      },
      valentino:{
        first:disliked?`이걸 나한테? 자기, 취향 교육이 좀 필요하겠는데. 그래도 두고 가.`:`「${n}」이라. 제법 화려하네. 내 시선을 끈 건 칭찬해 주지.`,
        repeat:`또 선물이야? 내가 받는 데 익숙한 건 알지만, 넌 꽤 끈질기네.`,
        special:`이건 남한테 넘기지 않고 내가 가질게. 그 정도면 얼마나 마음에 든 건지 알겠지?`
      },
      carmillacarmine:{
        first:disliked?`선택의 의도를 이해하기 어렵군. 「${n}」은 확인한 뒤 보관 여부를 정하겠다.`:`「${n}」. 실용적이고 상태도 좋군. 신중히 골랐다는 게 보인다. 고맙다.`,
        repeat:`다시 같은 물건을 준비했군. 예비품은 쓸모가 있으니 받아두지.`,
        special:`내가 필요로 하는 것을 먼저 살피는 사람은 드물다. 네 배려를 잊지 않겠다.`
      },
      rosie:{
        first:disliked?`어머, 「${n}」이라니. 취향이 조금 섬뜩하구나—내가 할 말은 아니지만! 그래도 고마워.`:`세상에, 「${n}」! 이렇게 다정한 선물을 준비하다니. 차와 함께 천천히 구경해야겠어.`,
        repeat:`또 챙겨왔니? 정성은 반복될수록 더 선명해지는 법이란다.`,
        special:`물건보다 네가 건네는 표정이 더 마음에 드는구나. 아주 예쁘게 간직할게.`
      },
      abel:{
        first:disliked?`어… 「${n}」은 조금 무섭네. 그래도 날 생각해 준 거니까 고마워!`:`와, 「${n}」! 진짜 나 주는 거야? 고마워, 잘 간직할게!`,
        repeat:`또 가져왔어? 하하, 이제 받을 때마다 먼저 웃게 된다!`,
        special:`나한테 좋은 기억 하나를 더 만들어줬네. 이건 오래 기억할게.`
      },
      zestial:{
        first:disliked?`기묘한 물건을 가져왔구나. 내 마음엔 들지 않으나 네 뜻까지 물리치진 않으리.`:`「${n}」이라. 오래 살았으나 이처럼 정성 어린 선택은 여전히 반갑도다.`,
        repeat:`다시금 같은 선물을 건네는구나. 꾸준한 마음 또한 귀한 법이지.`,
        special:`물건은 세월에 닳으나 그것을 건넨 뜻은 오래 남는 법. 소중히 간직하리라.`
      },
      stolas:{
        first:disliked?`아… 「${n}」. 조금 난처한 기억을 부르는군. 그래도 네가 준 것이니 받아둘게.`:`오, 「${n}」! 얼마나 사랑스러운 선택인지. 별빛 아래에서 다시 자세히 보고 싶구나.`,
        repeat:`또 가져왔구나! 같은 물건도 네가 건네면 전혀 다르게 느껴져.`,
        special:`궁전의 값비싼 물건보다 네가 직접 골라준 이 작은 선물이 더 따뜻하구나.`
      },
      loona:{
        first:disliked?`뭐야, 「${n}」? 내 취향 아니거든. …그래도 버리진 않을게.`:`「${n}」? 어… 괜찮네. 고맙다고 두 번 말하게 하진 마.`,
        repeat:`또 가져왔어? 알았어, 받아둘게. 싫다는 건 아니고.`,
        special:`네가 계속 기억해주는 거… 나쁘지 않아. 그러니까 이상하게 웃지 마.`
      },
      moxxie:{
        first:disliked?`이건 품질도 용도도 애매하군요. 하지만 선의로 주신 거라면 예의 있게 받겠습니다.`:`「${n}」! 꽤 세심한 선택이군요. 정말 감사합니다.`,
        repeat:`같은 물건이라도 예비품은 필요하죠. 꼼꼼하게 챙겨주셔서 고맙습니다.`,
        special:`제 취향을 이렇게 정확히 기억해 주실 줄은 몰랐습니다. 진심으로 기쁘군요.`
      },
      millie:{
        first:disliked?`어우, 이건 좀 별론데! 그래도 네가 직접 가져온 거니까 고맙게 받을게!`:`오, 「${n}」! 멋진데? 실용적이면 더 좋고, 예쁘면 그것도 좋지! 고마워!`,
        repeat:`또 챙겨왔어? 좋아! 많으면 가족이랑 나눠도 되겠네!`,
        special:`날 생각하면서 골랐다는 게 제일 좋다. 이건 정말 소중히 쓸게!`
      },
      fizzarolli:{
        first:disliked?`「${n}」? 와, 관객 반응이었다면 야유 타이밍이야. 그래도 네 성의는 합격!`:`오호, 「${n}」! 이거 무대 소품으로도 좋고 내 방에 둬도 좋겠는데? 센스 있다!`,
        repeat:`앙코르 선물이야? 좋아, 같은 것도 연출만 바꾸면 새로워지는 법이지!`,
        special:`농담 빼고 말하면… 네가 날 웃기려고가 아니라 웃게 하려고 골랐다는 게 좋아. 고마워.`
      },
      octavia:{
        first:disliked?`어… 「${n}」. 솔직히 내 취향은 아니야. 그래도 생각해준 건 고마워.`:`「${n}」? 괜찮다. 생각보다 내 방에도 잘 어울릴 것 같아.`,
        repeat:`또 가져왔네. 이상하게 익숙해져서 그런지 이번엔 더 마음에 들어.`,
        special:`누가 내 취향을 기억해준다는 게 아직 좀 낯설어. 그래도… 좋은 쪽으로 낯설어.`
      }
    };
    const fallback={
      first:disliked?`「${n}」은 내 취향과는 조금 다르네. 그래도 네가 골라온 마음까지 거절하진 않을게.`:`「${n}」? 나를 생각해서 고른 거구나. 고마워, 잘 받아둘게.`,
      repeat:`또 챙겨왔네. 네가 기억해준 건 고맙게 생각하고 있어.`,
      special:`이제는 물건보다 네가 나를 생각해줬다는 사실이 더 크게 느껴져. 정말 고마워.`
    };
    const set=lines[ck]||fallback;
    return set[phase]||fallback[phase];
  }

  function customLucifer(item,phase){
    const name=String(item.name||"");
    const table=[
      [/오[버베]로드.*회의.*초대장/i,{preference:"NEUTRAL",emotionState:"guarded",emotionIntensity:24,specialMinAffection:54}],
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
    const settings=preferenceForCharacter(item,character);
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
        narration(base+"-first-n",item.collectionCharacterId===character.id
          ? `${character.name}가 「${item.name}」을(를) 알아보고 잠시 시선을 멈춘다.`
          : `${character.name}가 「${item.name}」을(를) 받아 든다.`),
        dialogue(base+"-first-d",character,text("first"))
      ],
      repeatEntries:[dialogue(base+"-repeat-d",character,text("repeat"))],
      specialEntries:[
        narration(base+"-special-n",item.collectionCharacterId===character.id
          ? `${character.name}가 자기와 얽힌 물건을 손안에서 천천히 돌려보며 이번에는 기억을 피하지 않는다.`
          : `${character.name}가 이번에는 물건을 바로 치우지 않고 잠시 더 바라본다.`),
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
    let eligibleItems=0;
    let populatedReactions=0;
    const currentVersion=Math.max(0,Number(source.itemPresetVersion)||0);
    const characters=Array.isArray(source.characters)?source.characters:[];
    const byId=new Map(characters.map(character=>[character.id,character]));
    const ownerFor=item=>byId.get(item.collectionCharacterId)||
      characters.find(character=>
        charKey(character)===key(item.collectionCharacterId).replace(/[^a-z0-9가-힣]+/g,"")
      );
    const needsReactionRepair=source.items.some(item=>{
      const owner=ownerFor(item);
      if(!owner||item.giftable===false)return false;
      const reaction=(item.reactions||[]).find(entry=>entry.characterId===owner.id);
      if(!reaction||placeholderReaction(reaction))return true;
      return !reaction.firstEntries?.length||!reaction.repeatEntries?.length||!reaction.specialEntries?.length;
    });
    if(currentVersion>=VERSION&&!needsReactionRepair)return{state:source,changed:false};

    const applyWeights=currentVersion<3;
    for(const item of source.items){
      if(applyWeights){
        const nextWeight=individualWeight(item);
        if(Number(item.weight)!==nextWeight){item.weight=nextWeight;changed=true}
      }

      const owner=ownerFor(item);
      if(!owner||item.giftable===false)continue;
      eligibleItems+=1;
      item.reactions=Array.isArray(item.reactions)?item.reactions:[];
      const index=item.reactions.findIndex(reaction=>reaction.characterId===owner.id);
      const preset=normalizeReaction(buildReaction(item,owner),owner.id);
      if(index<0){
        item.reactions.push(preset);
        populatedReactions+=1;
        changed=true;
      }else if(placeholderReaction(item.reactions[index])){
        item.reactions[index]=preset;
        populatedReactions+=1;
        changed=true;
      }else{
        const old=item.reactions[index];
        let patched=false;
        if(!old.firstEntries?.length){old.firstEntries=preset.firstEntries;patched=true}
        if(!old.repeatEntries?.length){old.repeatEntries=preset.repeatEntries;patched=true}
        if(!old.specialEntries?.length){old.specialEntries=preset.specialEntries;patched=true}
        if(!old.specialMinAffection){old.specialMinAffection=preset.specialMinAffection;patched=true}
        if(!old.emotionState){old.emotionState=preset.emotionState;old.emotionIntensity=preset.emotionIntensity;patched=true}
        if(patched){
          populatedReactions+=1;
          changed=true;
        }
      }
    }
    if(eligibleItems>0&&currentVersion<VERSION){
      source.itemPresetVersion=VERSION;
      changed=true;
    }
    return{state:source,changed,eligibleItems,populatedReactions};
  };
  window.HV_BUILD_ITEM_REACTION=(item,character)=>buildReaction(item,character);
  window.HV_ITEM_PRESET_VERSION=VERSION;
})();
