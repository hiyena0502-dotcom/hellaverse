"use strict";

/*
 * Lucifer dialogue acquisition layer.
 *
 * 목적:
 * - 루시퍼 컬렉션 중 루시퍼가 직접 건네는 것이 자연스러운 아이템만 TALK/ASK에서 획득.
 * - 가족 원본 / 릴리스 관련 / 다른 캐릭터 테마 아이템은 여기서 강제로 연결하지 않음.
 * - 아이템이 현재 저장 데이터에 실제로 존재할 때만 연결하므로, 삭제된 아이템 참조를 만들지 않음.
 */
(()=>{
  const C="lucifer-morningstar";
  const NAME="Lucifer Morningstar";
  const VERSION=1;
  const previous=window.HV_APPLY_DIALOGUE_PRESETS;

  const I={
    OVERLORD_INVITE:"item-1789238830690-db356f25266758",
    SATAN_NOTICE:"item-1789238792086-992728174da068",
    EMPTY_FRAME:"item-1789238744943-adaa3960399728",
    STAR_MAP:"item-1789238615638-c2e89857e40d18",
    BROKEN_HALO:"item-1789238548284-daf8410f10f588",
    HEAVEN_PIN:"item-1789238498802-e45972dd87f898",
    APPLE_SEED:"item-1789238451393-f86b182f0fbdf",
    FIRST_DUCK:"item-1789237823842-ce78e0dde29ba",
    BACKFLIP_DUCK:"item-1789237782413-b24d1dcc58ec3",
    SMILE_DUCK:"item-1789237732781-2da6a1f6246018",
    SAD_DUCK:"item-1789237655521-7cf647fd73b38",
    APPLE_DUCK:"item-1789237596542-0f87f58378c328",
    MOOD_DUCK:"item-1789236904744-cdb184a391dd3",
    HOLOGRAM_DUCK:"item-1789236716185-d6d8e835fd2068",
    MUSIC_DUCK:"item-1789236578576-d7b95632d5f788",
    SWAN_DUCK:"item-1789235422433-8445e8ce9c86d8",
    MINI_THRONE:"item-1789235103529-48738d661fb41",
    MINI_DUCK:"lucifer-keepsake-mini-duck",
    GOLD_APPLE_PIN:"lucifer-keepsake-gold-apple-pin",
    CLOCKWORK_DUCK:"lucifer-keepsake-clockwork-duck",
    HANDWRITTEN_CARD:"lucifer-keepsake-handwritten-card",
    PRIVATE_BLUEPRINT:"lucifer-keepsake-private-blueprint"
  };

  const itemGate=itemId=>({itemId,operator:"<",value:1});
  const affectionGate=min=>({characterId:C,operator:">=",value:min});

  function entry(id,type,text,itemId,minAffection=0,grant=false){
    const out={
      id,
      type,
      text,
      itemCondition:itemGate(itemId)
    };
    if(type==="dialogue"){
      out.speaker=NAME;
      out.speakerCharacterId=C;
    }else{
      out.narrationRole="reaction";
    }
    if(minAffection>0)out.affectionCondition=affectionGate(minAffection);
    if(grant){
      out.itemEffects=[{
        id:id+"-grant",
        itemId,
        amount:1,
        once:true
      }];
    }
    return out;
  }

  function scene(prefix,itemId,minAffection,rows){
    return rows.map((row,index)=>entry(
      prefix+"-"+(index+1),
      row[0],
      row[1],
      itemId,
      minAffection,
      index===rows.length-1
    ));
  }

  function findOption(entries,label){
    for(const row of entries||[]){
      if(row?.type!=="choice")continue;
      for(const option of row.options||[]){
        if(option?.label===label)return option;
        const nested=findOption(option?.entries,label);
        if(nested)return nested;
      }
    }
    return null;
  }

  function syncOptionReward(source,kind,ownerId,label,itemId,minAffection,prefix,rows){
    const exists=(source.items||[]).some(item=>item.id===itemId);
    const owner=kind==="ask"
      ? (source.asks||[]).find(row=>row.id===ownerId)
      : (source.events||[]).find(row=>row.id===ownerId);
    if(!owner)return false;
    const option=findOption(owner.entries,label);
    if(!option)return false;

    const before=JSON.stringify(option.entries||[]);
    option.entries=(option.entries||[]).filter(row=>!String(row?.id||"").startsWith(prefix+"-"));
    if(exists)option.entries.push(...scene(prefix,itemId,minAffection,rows));
    return before!==JSON.stringify(option.entries||[]);
  }

  function rewardOption(id,label,itemId,minAffection,rows){
    return {
      id,
      label,
      tone:"neutral",
      entries:scene(id,itemId,minAffection,rows),
      condition:null,
      effects:[],
      itemEffects:[],
      itemCondition:itemGate(itemId),
      askCondition:null,
      affectionCondition:minAffection>0?affectionGate(minAffection):null,
      affectionEffects:[],
      emotionCondition:null,
      emotionEffects:[],
      exitMode:"continue",
      targetEventId:""
    };
  }

  function fallbackOption(id,label,text){
    return {
      id,label,tone:"neutral",
      entries:[{
        id:id+"-line",
        type:"dialogue",
        speaker:NAME,
        speakerCharacterId:C,
        text
      }],
      condition:null,effects:[],itemEffects:[],itemCondition:null,askCondition:null,
      affectionCondition:null,affectionEffects:[],emotionCondition:null,emotionEffects:[],
      exitMode:"continue",targetEventId:""
    };
  }

  function acquisitionEventOne(source){
    const options=[];
    if((source.items||[]).some(item=>item.id===I.BACKFLIP_DUCK)){
      options.push(rewardOption(
        "luc-acq-workbench-o1","뒤집기를 반복하는 오리를 본다",I.BACKFLIP_DUCK,0,
        [
          ["dialogue","오, 얘? 잘 봐. 하나, 둘, 셋—"],
          ["narration","작은 오리가 손바닥 위에서 깔끔하게 뒤집힌다. 루시퍼가 성공한 쪽보다 더 신난 얼굴을 한다."],
          ["dialogue","봤지? 가져. 대신 성공 횟수 세다가 밤새진 마."],
          ["narration","루시퍼가 뒤집기 오리를 네 손에 올려놓는다."]
        ]
      ));
    }
    if((source.items||[]).some(item=>item.id===I.SMILE_DUCK)){
      options.push(rewardOption(
        "luc-acq-workbench-o2","활짝 웃는 오리를 본다",I.SMILE_DUCK,0,
        [
          ["dialogue","얘는 표정이 좋아. 별일 없어도 혼자 기분 좋아 보이잖아."],
          ["narration","루시퍼가 오리의 볼을 손끝으로 툭 건드린다."],
          ["dialogue","네 방에 두면 좀 덜 칙칙하겠네. 가져."],
          ["narration","웃는 오리가 네 쪽으로 넘어온다."]
        ]
      ));
    }
    if((source.items||[]).some(item=>item.id===I.SAD_DUCK)){
      options.push(rewardOption(
        "luc-acq-workbench-o3","축 처진 오리를 본다",I.SAD_DUCK,20,
        [
          ["dialogue","왜 그런 얼굴이야. 우울한 오리도 오리야."],
          ["narration","루시퍼가 축 처진 오리를 바로 세웠다가, 다시 원래 자세로 돌려놓는다."],
          ["dialogue","…신경 쓰이면 네가 데려가. 얘는 혼자 있어도 조용하니까."],
          ["narration","루시퍼가 잠깐 망설인 뒤 작은 오리를 밀어준다."]
        ]
      ));
    }
    if((source.items||[]).some(item=>item.id===I.APPLE_DUCK)){
      options.push(rewardOption(
        "luc-acq-workbench-o4","사과 장식이 달린 오리를 본다",I.APPLE_DUCK,0,
        [
          ["dialogue","사과는 그냥 장식이야. 특별한 의미 없어."],
          ["narration","루시퍼가 네 표정을 읽고는 바로 눈을 가늘게 뜬다."],
          ["dialogue","왜 웃어. 됐어, 가져. 내가 하나 더 만들면 되니까."],
          ["narration","사과 장식 오리가 네 손에 들어온다."]
        ]
      ));
    }
    if(!options.length)return null;
    options.push(fallbackOption("luc-acq-workbench-skip","오늘은 상자만 닫아둔다","그래, 현명해. 고르기 시작하면 내가 설명을 너무 많이 하거든."));

    return {
      id:"lucifer-dialogue-acquisition-workbench",
      name:"TALK · Lucifer Morningstar · 작업대 아래 오리 상자",
      characterId:C,
      eventRole:"talk",
      menuVisible:true,
      randomEligible:false,
      startMode:"EVENT",
      sensitivity:"light",
      topicFamily:"lucifer_dialogue_acquisition_ducks",
      emotionExitMode:"keep",
      entries:[
        {
          id:"luc-acq-workbench-intro-1",
          type:"narration",
          text:"루시퍼의 작업대 아래에서 작은 상자 하나가 반쯤 열린 채 발견된다. 뚜껑에는 ‘실패작 아님’이라고 두 번 적혀 있다.",
          narrationRole:"intro"
        },
        {
          id:"luc-acq-workbench-intro-2",
          type:"dialogue",
          speaker:NAME,
          speakerCharacterId:C,
          text:"실패작 상자 아니야. 아직 둘 자리가 없는 완성품들이지."
        },
        {
          id:"luc-acq-workbench-choice",
          type:"choice",
          prompt:"상자 안에서 무엇을 볼까?",
          options
        }
      ]
    };
  }

  function acquisitionEventTwo(source){
    const options=[];
    if((source.items||[]).some(item=>item.id===I.HOLOGRAM_DUCK)){
      options.push(rewardOption(
        "luc-acq-gadgets-o1","옆면에 버튼이 달린 오리를 본다",I.HOLOGRAM_DUCK,0,
        [
          ["dialogue","오, 그건 눌러봐도 돼. 이번 버튼은 안전해."],
          ["narration","버튼을 누르자 작은 홀로그램이 오리 위로 반짝이며 떠오른다."],
          ["dialogue","멋지지? 내가 만든 거야. 그러니까 당연히 멋지고. 가져도 돼."],
          ["narration","홀로그램 오리가 네 쪽으로 건너온다."]
        ]
      ));
    }
    if((source.items||[]).some(item=>item.id===I.SWAN_DUCK)){
      options.push(rewardOption(
        "luc-acq-gadgets-o2","백조처럼 생긴 흰 오리를 본다",I.SWAN_DUCK,0,
        [
          ["dialogue","오리야."],
          ["narration","루시퍼가 네가 입을 열기도 전에 한 글자씩 또박또박 못 박는다."],
          ["dialogue","백조 아니고 오리. 그걸 기억한다는 조건으로 가져."],
          ["narration","우아하게 생긴 ‘오리’가 네 손에 놓인다."]
        ]
      ));
    }
    if((source.items||[]).some(item=>item.id===I.MINI_THRONE)){
      options.push(rewardOption(
        "luc-acq-gadgets-o3","손바닥만 한 왕좌를 돌려본다",I.MINI_THRONE,10,
        [
          ["dialogue","그거 돌아가. 이게 중요해."],
          ["narration","미니 왕좌가 손가락 끝에서 빙글빙글 돈다. 루시퍼는 한동안 그걸 진지하게 지켜본다."],
          ["dialogue","…실제 왕좌보다 이쪽이 재밌네. 가져. 난 또 만들면 되니까."],
          ["narration","작은 회전 왕좌가 네 것이 된다."]
        ]
      ));
    }
    if((source.items||[]).some(item=>item.id===I.GOLD_APPLE_PIN)){
      options.push(rewardOption(
        "luc-acq-gadgets-o4","금색 사과 핀을 집어 든다",I.GOLD_APPLE_PIN,25,
        [
          ["dialogue","그건 왕실 훈장 같은 거 아니야. 그냥 핀이야."],
          ["narration","루시퍼가 핀을 빛에 비춰보더니 네 쪽으로 방향을 돌린다."],
          ["dialogue","네가 달고 다니는 편이 더 낫겠네. 잃어버리지만 마."],
          ["narration","금색 사과 핀이 네 손바닥 위에 놓인다."]
        ]
      ));
    }
    if(!options.length)return null;
    options.push(fallbackOption("luc-acq-gadgets-skip","손대지 않고 구경만 한다","오. 조심성 있네. 마음 바뀌면 말해."));

    return {
      id:"lucifer-dialogue-acquisition-gadgets",
      name:"TALK · Lucifer Morningstar · 작업대 구석의 작은 것들",
      characterId:C,
      eventRole:"talk",
      menuVisible:true,
      randomEligible:false,
      startMode:"EVENT",
      sensitivity:"light",
      topicFamily:"lucifer_dialogue_acquisition_gadgets",
      emotionExitMode:"keep",
      entries:[
        {
          id:"luc-acq-gadgets-intro-1",
          type:"narration",
          text:"작업대 구석에 오리와 작은 장식품, 정체를 알 수 없는 미니어처들이 한데 놓여 있다.",
          narrationRole:"intro"
        },
        {
          id:"luc-acq-gadgets-intro-2",
          type:"dialogue",
          speaker:NAME,
          speakerCharacterId:C,
          text:"내 작업대에 오리만 있는 건 아니야. 오리가 대부분일 뿐이지."
        },
        {
          id:"luc-acq-gadgets-choice",
          type:"choice",
          prompt:"눈에 들어오는 물건을 하나 살펴본다.",
          options
        }
      ]
    };
  }

  function syncManagedEvent(source,raw,normalizeEvent){
    if(!raw)return false;
    const fresh=typeof normalizeEvent==="function"?normalizeEvent(raw):raw;
    const index=(source.events||[]).findIndex(event=>event.id===fresh.id);
    if(index<0){
      source.events.push(fresh);
      return true;
    }
    if(JSON.stringify(source.events[index])!==JSON.stringify(fresh)){
      source.events[index]=fresh;
      return true;
    }
    return false;
  }

  function removeManagedEventIfEmpty(source,id,shouldExist){
    if(shouldExist)return false;
    const before=(source.events||[]).length;
    source.events=(source.events||[]).filter(event=>event.id!==id);
    return source.events.length!==before;
  }

  window.HV_APPLY_DIALOGUE_PRESETS=(source,helpers={})=>{
    let priorResult={state:source,changed:false};
    if(typeof previous==="function"){
      try{priorResult=previous(source,helpers)||priorResult}catch{priorResult={state:source,changed:false}}
    }
    source=priorResult?.state||source;
    let changed=Boolean(priorResult?.changed);
    if(!source||!Array.isArray(source.items))return{...priorResult,state:source,changed};

    const normalizeEvent=helpers.normalizeEvent;

    const eventOne=acquisitionEventOne(source);
    if(eventOne)changed=syncManagedEvent(source,eventOne,normalizeEvent)||changed;
    else changed=removeManagedEventIfEmpty(source,"lucifer-dialogue-acquisition-workbench",false)||changed;

    const eventTwo=acquisitionEventTwo(source);
    if(eventTwo)changed=syncManagedEvent(source,eventTwo,normalizeEvent)||changed;
    else changed=removeManagedEventIfEmpty(source,"lucifer-dialogue-acquisition-gadgets",false)||changed;

    // TALK 61 · 설계도를 존중해서 봤을 때 개인용 복사본을 건넨다.
    changed=syncOptionReward(source,"event","solo-talk-lucifer-morningstar-01","설계도를 봐도 되는지 묻는다",I.PRIVATE_BLUEPRINT,55,"luc-acq-t61-blueprint",[
      ["narration","네가 손을 대지 않고 기다리자 루시퍼가 설계도 묶음 맨 아래에서 작은 복사본 한 장을 빼낸다."],
      ["dialogue","이건 가져도 돼. 원본은 아니야. 당연히."],
      ["narration","루시퍼가 접힌 설계도 복사본을 네 쪽으로 밀어놓는다."]
    ])||changed;

    // TALK 61 · 완성품을 먼저 보고 싶다고 했을 때 태엽 오리 시험판.
    changed=syncOptionReward(source,"event","solo-talk-lucifer-morningstar-01","완성되면 첫 번째로 보여달라고 한다",I.CLOCKWORK_DUCK,35,"luc-acq-t61-clockwork",[
      ["narration","루시퍼가 잠깐 고민하다 서랍에서 손바닥만 한 태엽 오리를 꺼낸다."],
      ["dialogue","완성품은 아직이고 이건 시험판. 네가 먼저 봤으니까… 그냥 가져."],
      ["narration","작은 태엽 오리가 규칙적으로 발을 움직이며 네 손에 건너온다."]
    ])||changed;

    // TALK 63 · 연주 대신 음악 오리를 건넨다.
    changed=syncOptionReward(source,"event","solo-talk-lucifer-morningstar-03","한번 연주해달라고 한다",I.MUSIC_DUCK,45,"luc-acq-t63-music",[
      ["narration","잠시 악보를 보던 루시퍼가 피아노 대신 선반에서 작은 오리 하나를 집어 든다."],
      ["dialogue","오늘 연주는 이걸로 대신해. 버튼 누르면 짧게 나오니까."],
      ["narration","작은 멜로디가 흐르는 오리가 네 쪽으로 건너온다."]
    ])||changed;

    // TALK 64 · 가족사진 원본 대신 빈 액자를 준다.
    changed=syncOptionReward(source,"event","solo-talk-lucifer-morningstar-04","호텔에 가져다놓을 생각은 없는지 묻는다",I.EMPTY_FRAME,45,"luc-acq-t64-frame",[
      ["dialogue","사진은 안 가져갈 거야."],
      ["narration","루시퍼가 바로 옆에 세워져 있던 빈 액자를 집어 든다."],
      ["dialogue","대신 이건 가져. 비어 있으면 네가 채우면 되잖아."],
      ["narration","사진 대신 빈 액자가 네 손에 남는다."]
    ])||changed;

    // TALK 66 · 천국 물건을 더 캐묻지 않았을 때 장식핀.
    changed=syncOptionReward(source,"event","solo-talk-lucifer-morningstar-06","더 묻지 않는다",I.HEAVEN_PIN,60,"luc-acq-t66-pin",[
      ["narration","네가 화제를 더 이어가지 않자 루시퍼가 한동안 손안의 물건만 만지작거린다."],
      ["dialogue","…잠깐."],
      ["narration","그가 오래된 금빛 장식핀 하나를 골라 네 앞에 내려놓는다."],
      ["dialogue","이건 네가 가지고 있어. 내가 보는 것보단 낫겠네."],
      ["narration","천국 시절의 오래된 장식핀이 네게 넘어온다."]
    ])||changed;

    // TALK 68 · 서류 더미에서 기한이 지난 초대장.
    changed=syncOptionReward(source,"event","topic-talk-lucifer-morningstar-01","밀린 서류를 가리킨다",I.OVERLORD_INVITE,0,"luc-acq-t68-invite",[
      ["narration","루시퍼가 서류 더미를 뒤적이다 이미 날짜가 지난 초대장 하나를 발견한다."],
      ["dialogue","오! 끝났네. 완벽해. 이제 갈 필요도 없어."],
      ["narration","그는 눈에 띄게 기분이 좋아진 채 초대장을 네 쪽으로 넘긴다."]
    ])||changed;

    // TALK 68 · 중요한 것만 보자는 말에 사탄의 붉은 독촉장을 따로 빼놓는다.
    changed=syncOptionReward(source,"event","topic-talk-lucifer-morningstar-01","중요한 것만 먼저 보라고 한다",I.SATAN_NOTICE,20,"luc-acq-t68-satan",[
      ["narration","루시퍼가 몇 장을 골라내다가 붉은 봉투 하나에서 손을 멈춘다."],
      ["dialogue","이건 중요하긴 한데… 오늘의 나는 읽고 싶지 않네."],
      ["narration","봉투를 뒤집어 제목을 가린 채 네 쪽으로 슬쩍 밀어놓는다."],
      ["dialogue","잠깐 맡아줘. 버리진 말고. 걔가 알면 또 보낼 테니까."],
      ["narration","사탄에게서 온 붉은 독촉장이 잠시 네 보관품이 된다."]
    ])||changed;

    // ASK · 왜 오리를 만들어요? — 오래 보관하는 이유를 존중해서 물었을 때 첫 오리.
    changed=syncOptionReward(source,"ask","lucifer-ask-ducks","만든 걸 왜 다 가지고 있어요?",I.FIRST_DUCK,70,"luc-acq-ask-ducks-first",[
      ["narration","대답을 마친 루시퍼가 진열대 가장 안쪽에서 유난히 삐뚤어진 오리 하나를 꺼낸다."],
      ["dialogue","이게 첫 번째야. 못생겼지?"],
      ["narration","놀리는 기색이 없자 괜히 뿌듯한 표정이 된다."],
      ["dialogue","…됐어. 네가 가져. 잃어버리지만 마."],
      ["narration","루시퍼가 첫 번째 오리를 조심스럽게 네 손에 올려놓는다."]
    ])||changed;

    // ASK · 좋아하는 음식 — 사과를 놀리지 않았을 때 오래된 씨앗.
    changed=syncOptionReward(source,"ask","lucifer-ask-food","역시 사과군요.",I.APPLE_SEED,50,"luc-acq-ask-food-seed",[
      ["narration","루시퍼가 잠깐 눈을 가늘게 뜨더니 작은 상자에서 씨앗 하나를 꺼낸다."],
      ["dialogue","이것도 사과야. 아니, 정확히는 될 예정이었던 거고."],
      ["dialogue","평범한 씨앗이니까 의미 붙이지 마."],
      ["narration","말과 달리 오래 보관된 사과 씨앗 하나가 네 손에 남는다."]
    ])||changed;

    // ASK · 천국 과거 — 스스로 멈춰준 플레이어에게 오래된 별 지도.
    changed=syncOptionReward(source,"ask","lucifer-ask-heaven-past","오늘은 여기까지만 해도 돼요.",I.STAR_MAP,75,"luc-acq-ask-heaven-map",[
      ["narration","네가 더 묻지 않자 루시퍼가 서랍을 열어 오래 접혀 있던 종이 한 장을 꺼낸다."],
      ["dialogue","말로 설명하는 것보다 이게 낫겠네. 아주 오래된 거야."],
      ["dialogue","지금은 없는 것도 많고. 그러니까 자료로 믿진 말고."],
      ["narration","오래된 별 지도가 조심스럽게 네게 건네진다."]
    ])||changed;

    // ASK · 추락의 순간 — 최고 호감도에서 경계를 지켜준 경우에만 후광 조각.
    changed=syncOptionReward(source,"ask","topic-ask-lucifer-morningstar-03","미안해요. 더 안 물어볼게요.",I.BROKEN_HALO,90,"luc-acq-ask-fall-halo",[
      ["narration","한참 뒤, 루시퍼가 먼저 작은 상자를 네 쪽으로 밀어놓는다."],
      ["dialogue","아까 그 질문. 대답은 안 할 거야."],
      ["narration","상자 안에서 희미하게 빛나는 오래된 조각이 드러난다."],
      ["dialogue","이걸로 대신해. 그리고 지금은 더 묻지 마."],
      ["narration","부러진 후광의 조각이 네 보관품에 들어온다."]
    ])||changed;

    // ASK · 외로움 — 감정을 규정하려 들지 않았을 때 조용한 오리.
    changed=syncOptionReward(source,"ask","lucifer-ask-lonely","혼자 있고 싶을 때랑 외로운 건 다르죠.",I.MOOD_DUCK,60,"luc-acq-ask-lonely-duck",[
      ["narration","루시퍼가 한동안 대답하지 않다가 상자 안에서 가만히 앉아 있는 작은 오리를 꺼낸다."],
      ["dialogue","얘는 가만히 있는데도 기분이 좀 묘하지."],
      ["narration","오리를 네 쪽으로 밀어놓고는 시선을 먼저 피한다."],
      ["dialogue","…네가 가지고 있어."],
      ["narration","조용히 앉아 있는 작은 오리가 네 손에 남는다."]
    ])||changed;

    // ASK · 플레이어 인상 — 높은 호감도에서 편하다는 말을 돌려받았을 때 손글씨 카드.
    changed=syncOptionReward(source,"ask","lucifer-ask-player-impression","저도 당신이 편해요.",I.HANDWRITTEN_CARD,75,"luc-acq-ask-player-card",[
      ["narration","루시퍼가 대답 대신 잠시 책상 서랍을 뒤적인다."],
      ["dialogue","이거 받아."],
      ["narration","짧은 손글씨가 적힌 작은 카드 한 장이 네 앞으로 온다."],
      ["dialogue","지금 읽어도 되는데, 내 앞에서 소리 내서 읽지는 마."],
      ["narration","루시퍼가 직접 적은 작은 카드가 네 것이 된다."]
    ])||changed;

    // ASK · 최애 오리 — 새로 하나 만들어 달라는 요청에 미니 덕.
    changed=syncOptionReward(source,"ask","banter-ask-lucifer-morningstar-02","제일 좋아하는 걸 저한테 만들어줘요.",I.MINI_DUCK,60,"luc-acq-ask-favorite-mini",[
      ["narration","루시퍼가 한동안 못마땅한 척하다가 손가락 사이에서 아주 작은 오리 하나를 꺼낸다."],
      ["dialogue","최애랑 똑같은 건 아니야. 그러면 최애가 둘이 되잖아."],
      ["dialogue","대신 이건 네 거."],
      ["narration","손바닥보다 작은 미니 오리가 네 손에 놓인다."]
    ])||changed;

    return{...priorResult,state:source,changed,luciferDialogueAcquisitionVersion:VERSION};
  };

  window.HV_LUCIFER_DIALOGUE_ACQUISITION_VERSION=VERSION;
})();
