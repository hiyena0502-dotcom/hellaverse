"use strict";

(()=>{
  const C="lucifer-morningstar";
  const NAME="Lucifer Morningstar";
  const VERSION=3;
  const previous=window.HV_APPLY_DIALOGUE_PRESETS;

  const I={
    OVERLORD_INVITE:"item-1789238830690-db356f25266758",
    SATAN_NOTICE:"item-1789238792086-992728174da068",
    EMPTY_FRAME:"item-1789238744943-adaa3960399728",
    LETTER_TO_CHARLIE:"item-1789238646478-d91291c2644b3",
    STAR_MAP:"item-1789238615638-c2e89857e40d18",
    BROKEN_HALO:"item-1789238548284-daf8410f10f588",
    HEAVEN_PIN:"item-1789238498802-e45972dd87f898",
    APPLE_SEED:"item-1789238451393-f86b182f0fbdf",
    EDEN_LEAF:"item-1789238400778-78cf7af97e2308",
    LILITH_LETTER:"item-1789238355840-d8eafc2e2c7478",
    FAMILY_PHOTO:"item-1789238283951-1f42a73c88547",
    FIRST_DUCK:"item-1789237823842-ce78e0dde29ba",
    BACKFLIP_DUCK:"item-1789237782413-b24d1dcc58ec3",
    SMILE_DUCK:"item-1789237732781-2da6a1f6246018",
    SAD_DUCK:"item-1789237655521-7cf647fd73b38",
    APPLE_DUCK:"item-1789237596542-0f87f58378c328",
    BEE_DUCK:"item-1789237339684-cb4ed73ba01b08",
    OZZIE_DUCK:"item-1789237260981-07a9f1b5c7908",
    MAMMON_DUCK:"item-1789237178026-72c6fa010308a8",
    SATAN_DUCK:"item-1789237097182-6b74ab9fe64b28",
    ROSIE_DUCK:"item-1789236982055-3a00d6cfb19d2",
    MOOD_DUCK:"item-1789236904744-cdb184a391dd3",
    CARMILLA_DUCK:"item-1789236820277-1576615b28742",
    VALENTINO_DUCK:"item-1789236765248-49c8dea973eec8",
    VELVETTE_DUCK:"item-1789236716185-d6d8e835fd2068",
    VOX_DUCK:"item-1789236656368-14fed6e10fa618",
    MUSIC_DUCK:"item-1789236578576-d7b95632d5f788",
    CHERRI_DUCK:"item-1789236383880-f234c56121d958",
    PENTIOUS_DUCK:"item-1789236337755-9fa1cc10ea7678",
    NIFFTY_DUCK:"item-1789236273534-535f2c7fdd09d8",
    HUSK_DUCK:"item-1789236172176-ad1968a279cc4",
    ALASTOR_DUCK:"item-1789236040045-896bc75f2ece8",
    ANGEL_DUCK:"item-1789235948866-5b195045419e48",
    VAGGIE_DUCK:"item-1789235890096-634c274758e558",
    EMILY_DUCK:"item-1789235503729-8aad12fbc724b",
    SWAN_DUCK:"item-1789235422433-8445e8ce9c86d8",
    MINI_THRONE:"item-1789235103529-48738d661fb41",
    CHARLIE_DUCK:"item-1789234402975-d900a81a86d8d8",
    LUCIFER_DUCK:"item-1789234145036-c9d1585a1d80b",
    LILITH_DUCK:"item-1789233900632-c3fe9e7d4b3c78",
    MINI_DUCK:"lucifer-keepsake-mini-duck",
    GOLD_APPLE_PIN:"lucifer-keepsake-gold-apple-pin",
    CLOCKWORK_DUCK:"lucifer-keepsake-clockwork-duck",
    HANDWRITTEN_CARD:"lucifer-keepsake-handwritten-card",
    PRIVATE_BLUEPRINT:"lucifer-keepsake-private-blueprint"
  };

  const important={
    [I.BROKEN_HALO]:{
      hint:"어떤 과거는 답을 요구하지 않았을 때 가까워집니다.",
      secret:true,gachaEnabled:false,acquisitionMode:"unique"
    },
    [I.LETTER_TO_CHARLIE]:{
      hint:"읽을 수 있다고 해서 반드시 읽어야 하는 것은 아닙니다.",
      secret:true,gachaEnabled:false,acquisitionMode:"unique"
    },
    [I.EDEN_LEAF]:{
      hint:"아주 오래전, 모든 것이 시작된 장소와 관련이 있습니다.",
      secret:true,gachaEnabled:false,acquisitionMode:"unique"
    },
    [I.LILITH_LETTER]:{
      hint:"이 이야기는 루시퍼 혼자서는 끝낼 수 없습니다.",
      secret:true,gachaEnabled:false,acquisitionMode:"unique"
    },
    [I.FAMILY_PHOTO]:{
      hint:"한 사람만의 추억은 아닙니다.",
      secret:true,gachaEnabled:false,acquisitionMode:"unique"
    },
    [I.STAR_MAP]:{
      hint:"하늘에 대해 알고 싶다면, 때로는 질문을 멈추는 것도 필요합니다."
    },
    [I.HEAVEN_PIN]:{
      hint:"오래된 물건에는 주인의 경계도 함께 남아 있습니다."
    },
    [I.LILITH_DUCK]:{
      hint:"상자 깊숙한 곳에는 유난히 버전이 많은 오리가 있습니다."
    }
  };

  const safe=value=>String(value||"").replace(/[^a-zA-Z0-9_-]+/g,"-");
  const claimId=itemId=>"lucifer-dialogue-acquired-"+safe(itemId);
  const itemGate=(itemId,operator,value)=>({itemId,operator,value});
  const claimGate=(itemId,status)=>({effectId:claimId(itemId),status});
  const affectionGate=value=>({characterId:C,operator:">=",value});

  function itemExists(source,itemId){
    return (source.items||[]).some(item=>item.id===itemId);
  }

  function baseEntry(id,type,text){
    const entry={
      id,type,text,
      condition:null,effects:[],itemEffects:[],itemCondition:null,itemEffectClaimCondition:null,
      askCondition:null,affectionCondition:null,affectionEffects:[],emotionCondition:null,emotionEffects:[]
    };
    if(type==="dialogue"){
      entry.speaker=NAME;
      entry.speakerCharacterId=C;
    }else{
      entry.narrationRole="reaction";
    }
    return entry;
  }

  function rows(prefix,itemId,owned,lines,{grant=true,minAffection=0}={}){
    const result=[];
    const effectId=claimId(itemId);
    lines.forEach((line,index)=>{
      const type=line[0];
      const text=line[1];
      const entry=baseEntry(prefix+"-"+(index+1),type,text);
      entry.itemCondition=itemGate(itemId,owned?">=":"<",1);
      entry.itemEffectClaimCondition=claimGate(itemId,"unclaimed");
      if(minAffection)entry.affectionCondition=affectionGate(minAffection);
      if(grant&&index===lines.length-1){
        entry.itemEffects=[{id:effectId,itemId,amount:1,once:true}];
      }
      result.push(entry);
    });
    return result;
  }

  function claimedRows(prefix,itemId,lines){
    return lines.map((line,index)=>{
      const entry=baseEntry(prefix+"-"+(index+1),line[0],line[1]);
      entry.itemEffectClaimCondition=claimGate(itemId,"claimed");
      return entry;
    });
  }

  function acquisitionFlow(prefix,itemId,firstLines,ownedLines,afterLines=[],opts={}){
    return [
      ...rows(prefix+"-new",itemId,false,firstLines,opts),
      ...rows(prefix+"-owned",itemId,true,ownedLines,opts),
      ...claimedRows(prefix+"-after",itemId,afterLines)
    ];
  }

  function option(id,label,entries,tone="neutral"){
    return {
      id,label,tone,entries,
      condition:null,effects:[],itemEffects:[],itemCondition:null,itemEffectClaimCondition:null,
      askCondition:null,affectionCondition:null,affectionEffects:[],emotionCondition:null,emotionEffects:[],
      exitMode:"continue",targetEventId:""
    };
  }

  function choice(id,prompt,options){
    return {
      id,type:"choice",prompt,options,
      condition:null,effects:[],itemEffects:[],itemCondition:null,itemEffectClaimCondition:null,
      askCondition:null,affectionCondition:null,affectionEffects:[],emotionCondition:null,emotionEffects:[]
    };
  }

  function dedicatedEvent(id,title,itemId,entries,{minAffection=0,sensitivity="light"}={}){
    if(!itemId)return null;
    const event={
      id,
      name:"TALK · Lucifer Morningstar · "+title,
      characterId:C,
      eventRole:"talk",
      menuVisible:true,
      randomEligible:false,
      startMode:"EVENT",
      sensitivity,
      topicFamily:"lucifer_dialogue_acquisition",
      dialogueAcquisitionEffectId:claimId(itemId),
      emotionExitMode:"keep",
      entries
    };
    if(minAffection){
      event.entries=event.entries.map(entry=>{
        if(entry.type==="choice")return entry;
        return {...entry,affectionCondition:entry.affectionCondition||affectionGate(minAffection)};
      });
    }
    return event;
  }

  function makeAsk(id,label,minAffection,entries,extra={}){
    return {
      id,characterId:C,label,minAffection,
      startLocked:Boolean(extra.startLocked),
      unlockMinAffection:Number(extra.unlockMinAffection||0),
      unlockCondition:extra.unlockCondition||null,
      unlockItemCondition:null,
      unlockAskCondition:extra.unlockAskCondition||null,
      unlockEmotionCondition:null,
      unlockHint:String(extra.unlockHint||""),
      repeatable:true,
      affectionDelta:0,
      repeatAffectionDelta:0,
      applyAskDeltaOnce:true,
      emotionState:"",
      emotionIntensity:0,
      entries,
      enabled:true
    };
  }

  function upsertEventById(list,event,normalizeEvent){
    const fresh=typeof normalizeEvent==="function"?normalizeEvent(event):event;
    const index=(list||[]).findIndex(row=>row.id===fresh.id);
    if(index<0){list.push(fresh);return true}
    if(JSON.stringify(list[index])!==JSON.stringify(fresh)){list[index]=fresh;return true}
    return false;
  }

  function upsertAskById(list,ask,normalizeEntry){
    const fresh=typeof normalizeEntry==="function"
      ? {...ask,entries:(ask.entries||[]).map(normalizeEntry)}
      : ask;
    const index=(list||[]).findIndex(row=>row.id===fresh.id);
    if(index<0){list.push(fresh);return true}
    if(JSON.stringify(list[index])!==JSON.stringify(fresh)){list[index]=fresh;return true}
    return false;
  }

  function findOption(entries,label){
    for(const entry of entries||[]){
      if(entry?.type!=="choice")continue;
      for(const opt of entry.options||[]){
        if(opt?.label===label)return opt;
        const nested=findOption(opt?.entries,label);
        if(nested)return nested;
      }
    }
    return null;
  }

  function firstChoice(entries){
    for(const entry of entries||[]){
      if(entry?.type==="choice")return entry;
      if(entry?.type==="choice"){
        const nested=firstChoice(entry.options?.flatMap(o=>o.entries||[])||[]);
        if(nested)return nested;
      }
    }
    return null;
  }

  function patchOption(source,kind,ownerId,label,prefix,flow,extraEffects=[]){
    const owner=kind==="ask"
      ? (source.asks||[]).find(row=>row.id===ownerId)
      : (source.events||[]).find(row=>row.id===ownerId);
    if(!owner)return false;
    const opt=findOption(owner.entries,label);
    if(!opt)return false;
    const before=JSON.stringify(opt);
    opt.entries=(opt.entries||[]).filter(entry=>!String(entry?.id||"").startsWith(prefix+"-"));
    opt.entries.push(...flow);
    if(extraEffects.length){
      const keep=(opt.effects||[]).filter(effect=>!String(effect?.id||"").startsWith(prefix+"-fx"));
      opt.effects=[...keep,...extraEffects];
    }
    return before!==JSON.stringify(opt);
  }

  function addRootOption(source,eventId,opt){
    const event=(source.events||[]).find(row=>row.id===eventId);
    if(!event)return false;
    const root=(event.entries||[]).find(entry=>entry.type==="choice");
    if(!root)return false;
    const before=JSON.stringify(root.options||[]);
    root.options=(root.options||[]).filter(row=>row.id!==opt.id);
    root.options.push(opt);
    return before!==JSON.stringify(root.options||[]);
  }

  function ensureVariable(source,id,name){
    const existing=(source.variables||[]).find(v=>v.id===id);
    if(existing)return false;
    source.variables.push({id,name,type:"boolean",defaultValue:"false"});
    return true;
  }

  function applyImportantItemSettings(source){
    let changed=false;
    for(const [itemId,settings] of Object.entries(important)){
      const item=(source.items||[]).find(row=>row.id===itemId);
      if(!item)continue;
      if(String(item.acquisitionHint||"")!==settings.hint){item.acquisitionHint=settings.hint;changed=true}
      for(const key of ["secret","gachaEnabled","acquisitionMode"]){
        if(settings[key]!==undefined&&item[key]!==settings[key]){item[key]=settings[key];changed=true}
      }
    }
    return changed;
  }

  function simpleDuckEvent(source,itemId,id,title,intro,first,owned){
    if(!itemExists(source,itemId))return null;
    return dedicatedEvent(id,title,itemId,[
      baseEntry(id+"-intro","narration",intro),
      ...acquisitionFlow(id,itemId,first,owned)
    ]);
  }

  window.HV_APPLY_DIALOGUE_PRESETS=(source,helpers={})=>{
    let prior={state:source,changed:false};
    if(typeof previous==="function"){
      try{prior=previous(source,helpers)||prior}catch{prior={state:source,changed:false}}
    }
    source=prior?.state||source;
    let changed=Boolean(prior?.changed);
    if(!source||!Array.isArray(source.items))return{...prior,state:source,changed};

    const normalizeEntry=typeof helpers.normalizeEntry==="function"?helpers.normalizeEntry:value=>value;
    const normalizeEvent=typeof helpers.normalizeEvent==="function"?helpers.normalizeEvent:value=>value;

    changed=applyImportantItemSettings(source)||changed;
    changed=ensureVariable(source,"luc_acq_letter_boundary","Lucifer · 편지를 읽지 않고 물러남")||changed;

    const events=[
      simpleDuckEvent(
        source,I.BACKFLIP_DUCK,
        "lucifer-acq-talk-backflip-duck","백플립 기록",
        "작업대 위에서 작은 오리 하나가 연속으로 뒤집기를 하고 있다.",
        [
          ["dialogue","여덟, 아홉, 열—"],
          ["narration","오리가 책상 끝까지 굴러가자 루시퍼가 손을 뻗는다."],
          ["dialogue","어어, 잡아!"],
          ["narration","네 손에 가까스로 멈춘다. 루시퍼는 오리를 돌려받는 대신 작업대 아래에서 똑같은 모델 하나를 더 꺼낸다."],
          ["dialogue","됐어. 그건 네가 가져. 난 얘로 다시 하면 돼."]
        ],
        [
          ["narration","오리를 받아낸 루시퍼의 시선이 네가 이미 가지고 있던 같은 모델에 멈춘다."],
          ["dialogue","잠깐. 너 이미 있잖아."],
          ["narration","두 오리의 태엽을 동시에 감는다. 네 것은 세 번, 새 시험작은 다섯 번 뒤집힌다."],
          ["dialogue","봐! 다르잖아. 이건 업그레이드야."],
          ["narration","그는 새 버전까지 네 손에 얹고 기존 오리도 돌려준다."],
          ["dialogue","둘 다 가져."]
        ]
      ),
      simpleDuckEvent(
        source,I.SMILE_DUCK,
        "lucifer-acq-talk-smile-duck","정리 상자",
        "호텔로 가져갈 물건을 고르던 루시퍼가 작은 상자를 연다. 안에는 똑같이 활짝 웃는 오리들이 줄지어 있다.",
        [
          ["dialogue","아, 얘들 여기 있었구나."],
          ["narration","하나씩 세던 루시퍼가 여섯 번째에서 네 쪽을 본다."],
          ["dialogue","하나 가져갈래? 여섯 개나 있는데."],
          ["narration","가장 표정이 반듯한 하나를 골라 네 앞으로 세워둔다."],
          ["dialogue","이걸로 해. 얘가 제일 덜 바보같이 웃어."]
        ],
        [
          ["narration","루시퍼가 네 소지품 쪽에 이미 웃는 오리가 있는 걸 발견한다."],
          ["dialogue","너도 하나 있었어?"],
          ["narration","네 것과 상자 속 오리를 나란히 놓고 한동안 얼굴을 비교한다."],
          ["dialogue","네 건 입꼬리가 조금 낮네. 이쪽이 더 잘 웃어."],
          ["narration","그는 새 오리를 하나 더 네 쪽에 붙여놓는다."],
          ["dialogue","둘이 같이 있으면 덜 심심하겠지."]
        ]
      ),
      simpleDuckEvent(
        source,I.APPLE_DUCK,
        "lucifer-acq-talk-apple-duck","사과 장식",
        "선반을 정리하던 루시퍼가 사과 장식이 달린 오리 하나를 떨어뜨린다. 주우려는 순간 바로 옆에도 같은 오리가 있다는 게 보인다.",
        [
          ["dialogue","…내가 왜 두 개 만들었지?"],
          ["narration","둘을 번갈아 보다가 하나는 선반 중앙에 다시 세우고 다른 하나는 네 쪽으로 민다."],
          ["dialogue","됐어. 하나 가져."]
        ],
        [
          ["narration","루시퍼가 네가 가진 사과 오리를 보고 자기 손의 오리와 나란히 세운다."],
          ["dialogue","아, 이 버전도 가지고 있었네."],
          ["narration","부리와 사과 장식의 각도를 아주 진지하게 비교한다."],
          ["dialogue","이쪽은 사과가 덜 기울었어. 그러니까 중복 아니야."],
          ["narration","새 오리를 네 쪽으로 밀어놓는다."]
        ]
      ),
      simpleDuckEvent(
        source,I.SWAN_DUCK,
        "lucifer-acq-talk-swan-duck","오리의 정체성",
        "유난히 우아한 흰 오리 하나가 작업대 한가운데 놓여 있다. 네가 가까이 가자 루시퍼가 먼저 입을 연다.",
        [
          ["dialogue","오리야."],
          ["narration","아직 아무 말도 하지 않았는데 루시퍼가 눈을 가늘게 뜬다."],
          ["dialogue","왜 그런 얼굴이야. 백조 아니고 오리."],
          ["narration","아래 상자를 열자 같은 흰 오리가 세 마리 더 있다. 하나를 꺼내 네 손에 놓는다."],
          ["dialogue","가져가서 매일 오리라고 불러줘. 정체성 교육이 필요해."]
        ],
        [
          ["narration","루시퍼가 네 흰 오리를 발견하고 아주 만족스럽게 고개를 끄덕인다."],
          ["dialogue","좋아. 이미 한 마리 교육 중이네."],
          ["narration","상자에서 또 하나를 꺼내 옆에 붙인다."],
          ["dialogue","얘도 부탁해. 둘이면 서로 배우겠지."]
        ]
      ),
      simpleDuckEvent(
        source,I.MINI_THRONE,
        "lucifer-acq-talk-mini-throne","왕좌 돌리기",
        "서류 더미 사이에서 루시퍼가 손바닥만 한 왕좌를 손가락으로 빙글 돌리고 있다. 서류는 전혀 줄지 않았다.",
        [
          ["dialogue","봐. 이건 계속 돌아가."],
          ["narration","왕좌가 오래 버티다가 네 쪽으로 쓰러진다. 루시퍼는 서랍에서 같은 미니어처를 하나 더 꺼낸다."],
          ["dialogue","네가 마지막으로 건드렸으니까 그건 네 거."],
          ["narration","새 미니 왕좌를 다시 돌리기 시작한다."],
          ["dialogue","왕좌를 양도한 건 아니야. 장난감만."]
        ],
        [
          ["narration","네가 이미 같은 미니 왕좌를 가지고 있다는 걸 본 루시퍼가 둘을 동시에 돌려본다."],
          ["dialogue","오, 경쟁전."],
          ["narration","네 것이 먼저 쓰러지자 새 왕좌 하나를 추가로 내민다."],
          ["dialogue","패자 보충용. 이제 다시 해."]
        ]
      ),
      simpleDuckEvent(
        source,I.GOLD_APPLE_PIN,
        "lucifer-acq-talk-gold-apple-pin","뭔가 부족해",
        "루시퍼가 네 옷차림을 보다가 갑자기 손가락을 든다.",
        [
          ["dialogue","잠깐. 뭔가 부족해."],
          ["narration","작은 상자에서 금색 사과 핀 여러 개가 나온다. 그중 하나를 골라 네 옷깃 가까이에 대본다."],
          ["dialogue","응. 이게 낫네."],
          ["narration","핀을 직접 달아주고 한 걸음 물러나 확인한다."],
          ["dialogue","그건 여분이니까 그냥 하고 다녀."]
        ],
        [
          ["narration","루시퍼가 네가 이미 비슷한 사과 핀을 가지고 있다는 걸 보고 잠깐 멈춘다."],
          ["dialogue","오. 하나 있었네."],
          ["narration","자기 상자에서 더 작은 버전을 골라 기존 핀 옆에 대본다."],
          ["dialogue","그래도 이건 크기가 다르잖아."],
          ["narration","결국 두 번째 핀까지 네게 달아준다."],
          ["dialogue","과한 건 아니야. 아직."]
        ]
      )
    ].filter(Boolean);

    for(const raw of events){
      changed=upsertEventById(source.events,raw,normalizeEvent)||changed;
    }

    const firstDuckAsk=makeAsk(
      "lucifer-acq-ask-first-duck","처음 만든 오리도 아직 있어요?",25,
      acquisitionFlow(
        "luc-acq-first-duck",I.FIRST_DUCK,
        [
          ["dialogue","당연하지."],
          ["narration","진열대 가장 안쪽에서 삐뚤어진 오리 하나를 꺼낸다. 바로 뒤에는 비슷하지만 조금 덜 삐뚤어진 두 번째 시제품도 있다."],
          ["dialogue","첫 번째는 이거. 그리고 이쪽은 바로 다음에 다시 만든 거."],
          ["narration","원본은 자기 쪽에 남기고 두 번째 시제품을 네 손에 올려놓는다."],
          ["dialogue","원본은 못 줘. 이건 내 거야. 대신 얘는 가져."]
        ],
        [
          ["narration","루시퍼가 네가 이미 비슷한 초기형 오리를 가진 걸 보고 눈썹을 올린다."],
          ["dialogue","너 이 버전을 어디서 구했어?"],
          ["narration","가챠에서 나왔다는 설명을 들은 듯 한동안 납득하지 못한 얼굴이다."],
          ["dialogue","…내가 만든 게 왜 거기서 나와."],
          ["narration","결국 진열대에서 다른 초기 시제품 하나를 꺼낸다."],
          ["dialogue","됐어. 이건 내가 직접 주는 거니까 따로 쳐."]
        ],
        [
          ["dialogue","첫 번째 건 아직도 내 진열대에 있어."],
          ["narration","루시퍼가 네 쪽을 힐끗 본다."],
          ["dialogue","너한테 준 것도 있잖아. 그걸로 충분해."]
        ]
      )
    );

    const charlieDuckAsk=makeAsk(
      "lucifer-acq-ask-charlie-duck","찰리를 닮은 오리도 만들었어요?",20,
      acquisitionFlow(
        "luc-acq-charlie-duck",I.CHARLIE_DUCK,
        [
          ["dialogue","당연하지."],
          ["narration","대답이 지나치게 빠르다. 작업대 아래 상자를 열자 찰리를 닮은 오리가 여러 개 나온다."],
          ["dialogue","이건 초기형, 이건 리본이 좀 이상했고, 이쪽은 머리가—"],
          ["narration","네 표정을 발견한 루시퍼가 말을 멈춘다."],
          ["dialogue","왜."],
          ["narration","가장 정교한 하나는 자기 앞으로 당기고, 옆의 여분 하나를 네게 건넨다."],
          ["dialogue","이건 가져. 저건 내 거야."]
        ],
        [
          ["narration","루시퍼가 네 찰리 오리를 발견하고 자기 작업대의 것과 번갈아 본다."],
          ["dialogue","잠깐. 너 그건 어디서 났어?"],
          ["narration","가챠라는 말을 들은 뒤에도 납득은 못 한 표정이다. 그래도 다른 버전 하나를 꺼낸다."],
          ["dialogue","네 건 예전 버전이네. 이건 부리 각도가 달라."],
          ["narration","새 버전을 네 손에 더 얹는다."],
          ["dialogue","이미 하나 있다고 두 개 가지면 안 된다는 법은 없잖아."]
        ],
        [
          ["dialogue","찰리 오리? 줬잖아."],
          ["narration","자기 선반의 원본을 한번 확인한다."],
          ["dialogue","내 것도 있고 네 것도 있고. 좋아."]
        ]
      )
    );

    const selfDuckAsk=makeAsk(
      "lucifer-acq-ask-self-duck","본인을 닮은 오리도 만들었어요?",15,
      acquisitionFlow(
        "luc-acq-self-duck",I.LUCIFER_DUCK,
        [
          ["narration","루시퍼가 몇 초 동안 아무 말이 없다."],
          ["dialogue","그걸 왜 안 만들었을 거라고 생각해?"],
          ["narration","작은 모자와 지팡이를 든 오리를 하나, 둘, 셋 꺼낸다."],
          ["dialogue","디자인 테스트를 많이 했어."],
          ["narration","모자가 조금 삐뚤어진 버전을 골라 네게 준다."],
          ["dialogue","이건 네 거. 제일 반듯한 건 찰리 오리 옆에 둘 거고."]
        ],
        [
          ["narration","네가 이미 자기 모양 오리를 가진 걸 본 루시퍼가 묘한 표정을 짓는다."],
          ["dialogue","너 왜 나를 두 명이나 필요로 해?"],
          ["narration","말은 그렇게 하면서도 다른 버전을 하나 꺼내 모자를 바로잡는다."],
          ["dialogue","…뭐, 버전이 다르면 괜찮지."],
          ["narration","두 번째 루시퍼 오리를 네게 넘긴다."]
        ],
        [
          ["dialogue","내 오리 하나 줬잖아."],
          ["narration","찰리 오리 옆 자기 원본을 슬쩍 바로 세운다."],
          ["dialogue","내 건 여기 있고. 됐어."]
        ]
      )
    );

    const alastorDuckAsk=makeAsk(
      "lucifer-acq-ask-alastor-duck","싫어하는 사람도 오리로 만들어요?",20,
      acquisitionFlow(
        "luc-acq-alastor-duck",I.ALASTOR_DUCK,
        [
          ["dialogue","아니."],
          ["narration","즉답한 뒤 잠깐 침묵이 흐른다."],
          ["dialogue","…가끔."],
          ["narration","서랍에서 사슴뿔이 달린 빨간 오리 세 개가 나온다. 하나는 아예 뒤집혀 있다."],
          ["dialogue","스트레스 해소용이야."],
          ["narration","그중 하나를 네 쪽으로 던진다."],
          ["dialogue","가져. 저 얼굴을 세 개씩 볼 필요는 없으니까."]
        ],
        [
          ["narration","네 빨간 사슴 오리를 본 루시퍼가 못마땅한 얼굴로 집어 자기 것과 비교한다."],
          ["dialogue","네 건 예전 버전이네."],
          ["narration","새 버전의 뿔을 한번 만져본다."],
          ["dialogue","이쪽이 더 재수 없게 생겼어. 그러니까 더 정확하지."],
          ["narration","새 버전까지 네게 준다."]
        ],
        [
          ["dialogue","사슴 대가리 오리는 이미 줬어."],
          ["dialogue","굳이 그 얘기를 또 해야 해?"]
        ]
      )
    );

    const emilyDuckAsk=makeAsk(
      "lucifer-acq-ask-emily-duck","천사를 닮은 오리도 있어요?",35,
      acquisitionFlow(
        "luc-acq-emily-duck",I.EMILY_DUCK,
        [
          ["narration","루시퍼가 조금 고민하다 금색 날개가 달린 푸른 오리를 꺼낸다."],
          ["dialogue","얘는 날개가 너무 커서 계속 뒤로 넘어갔어."],
          ["narration","뒤에서 날개가 조금 작아진 수정 버전도 나온다."],
          ["dialogue","그래서 고쳤지."],
          ["narration","첫 번째 버전을 네게 건넨다."],
          ["dialogue","초기형은 네가 가져. 에밀리한텐 계속 넘어졌다는 말 하지 마."]
        ],
        [
          ["narration","네가 가진 천사 오리를 본 루시퍼가 날개부터 확인한다."],
          ["dialogue","아, 큰 날개 버전이네."],
          ["narration","작은 날개 버전 하나를 더 꺼내 옆에 놓는다."],
          ["dialogue","그럼 수정형도 있어야 비교가 되지."],
          ["narration","두 번째 버전까지 네게 준다."]
        ],
        [
          ["dialogue","에밀리 오리는 줬잖아."],
          ["narration","자기 상자에 남은 수정형 하나를 확인한다."],
          ["dialogue","나도 하나 있고. 됐어."]
        ]
      )
    );

    const hotelDuckAsk=makeAsk(
      "lucifer-acq-ask-hotel-ducks","호텔 사람들도 오리로 만들어요?",25,
      [
        baseEntry("luc-hotel-ducks-intro","dialogue","몇 명은. 왜, 보고 싶어?"),
        choice("luc-hotel-ducks-choice","어느 오리가 눈에 들어오나요?",[
          itemExists(source,I.VAGGIE_DUCK)?option(
            "luc-hotel-ducks-vaggie","찰리 여자친구 오리",
            acquisitionFlow("luc-acq-vaggie-duck",I.VAGGIE_DUCK,
              [
                ["narration","루시퍼가 오리 밑면에 적힌 이름을 가리려다 포기한다. 지웠다 다시 쓴 흔적이 몇 겹이다."],
                ["dialogue","그… 배기. 아니, Vaggie. 맞아. 이번엔 맞았어."],
                ["narration","완성본 하나는 자기 선반에 두고 이름을 여러 번 고친 시험작을 네게 준다."],
                ["dialogue","여분이니까 가져. 밑면은 보지 말고."]
              ],
              [
                ["narration","루시퍼가 네 배기 오리의 밑면부터 확인하고 자기 여분과 비교한다."],
                ["dialogue","네 건 이름 세 번 틀린 버전이네."],
                ["narration","이번엔 제대로 적힌 버전 하나를 골라 건넨다."],
                ["dialogue","이걸로 업데이트해. 예전 것도 버리진 말고."]
              ],
              [["dialogue","찰리 여자친구 오리는 이미 줬지. 이름도 이제 알아. Vaggie. 봐, 기억해."]]
            )
          ):null,
          itemExists(source,I.ANGEL_DUCK)?option(
            "luc-hotel-ducks-angel","긴 거미 오리",
            acquisitionFlow("luc-acq-angel-duck",I.ANGEL_DUCK,
              [
                ["narration","유난히 팔다리가 긴 오리 둘이 벽에 기대어 있다. 하나는 혼자 서지 못하고 자꾸 쓰러진다."],
                ["dialogue","귀엽게 만들려고 했는데 구조적으로 말이 안 돼."],
                ["narration","그나마 잘 서는 버전은 남겨두고 자꾸 넘어지는 쪽을 네게 건넨다."],
                ["dialogue","얘는 네가 균형 좀 잡아줘."]
              ],
              [
                ["narration","네가 가진 긴 거미 오리를 보더니 루시퍼가 새 버전의 다리를 조금 더 벌려 세워본다."],
                ["dialogue","아, 네 건 계속 넘어지는 버전이지."],
                ["narration","이번 버전은 혼자 선다."],
                ["dialogue","개선됐어. 이것도 가져."]
              ],
              [["dialogue","그 긴 거미 오리도 이미 줬어. 더 길게 만들 생각은 없어."]]
            )
          ):null,
          itemExists(source,I.HUSK_DUCK)?option(
            "luc-hotel-ducks-husk","바텐더 고양이 오리",
            acquisitionFlow("luc-acq-husk-duck",I.HUSK_DUCK,
              [
                ["narration","작은 술잔을 든 고양이 오리 여러 개가 놓여 있다. 루시퍼가 술잔을 떼었다가 다시 붙인다."],
                ["dialogue","너무 뻔한가."],
                ["narration","잠깐 생각한 뒤 고개를 젓는다."],
                ["dialogue","아니. 맞긴 맞잖아."],
                ["narration","여분 하나를 네게 건넨다."],
                ["dialogue","그 고양이한테 보여줄 거면 내가 만들었다는 말은— 됐어. 마음대로 해."]
              ],
              [
                ["narration","네 허스크 오리를 보고 루시퍼가 자기 버전의 작은 술잔을 확인한다."],
                ["dialogue","네 것도 잔이 있네."],
                ["narration","이번 여분에서는 술잔을 빼고 네게 준다."],
                ["dialogue","좋아. 얘는 술 없는 버전. 이것도 있어야 공평하지."]
              ],
              [["dialogue","그 바텐더 고양이 오리는 줬잖아. 내 선반에도 아직 하나 있어."]]
            )
          ):null,
          itemExists(source,I.NIFFTY_DUCK)?option(
            "luc-hotel-ducks-niffty","조그만 청소광 오리",
            acquisitionFlow("luc-acq-niffty-duck",I.NIFFTY_DUCK,
              [
                ["narration","손가락 두 마디만 한 작은 오리가 작업대 위를 빠르게 미끄러진다."],
                ["dialogue","작아! 빨라! 무서워! 귀여워!"],
                ["narration","청소도구가 달린 여분 하나를 잡아 네 손에 올린다."],
                ["dialogue","거의 완벽하게 재현했지? 그 조그만 애한테 직접 보여줄지는 네가 정해."]
              ],
              [
                ["narration","네 작은 청소 오리를 보자 루시퍼가 작업대 밑에서 더 작은 버전을 꺼낸다."],
                ["dialogue","네 것도 작다고 생각했지?"],
                ["narration","둘을 나란히 놓자 새 버전이 훨씬 작다."],
                ["dialogue","미니 버전. 이제 이게 더 위험해 보여."]
              ],
              [["dialogue","그 조그만 청소광 오리는 이미 줬어. 너무 많이 늘리면 작업대에서 잃어버려."]]
            )
          ):null,
          itemExists(source,I.PENTIOUS_DUCK)?option(
            "luc-hotel-ducks-pentious","발명가 뱀 오리",
            acquisitionFlow("luc-acq-pentious-duck",I.PENTIOUS_DUCK,
              [
                ["narration","작은 톱햇과 기어가 달린 뱀 모양 오리를 루시퍼가 돌려본다."],
                ["dialogue","발명가라면 하나 만들어줄 만하잖아."],
                ["narration","완성본은 남겨두고 기어가 한 번씩 걸리는 시험작을 네게 준다."],
                ["dialogue","이건 네가 테스트해. 멈추면 한 번 흔들어."]
              ],
              [
                ["narration","네 뱀 오리를 본 루시퍼가 기어 소리를 듣는다."],
                ["dialogue","아직도 걸리네."],
                ["narration","더 매끄럽게 움직이는 수정형을 하나 꺼낸다."],
                ["dialogue","좋아. 이번엔 개선판으로 가져."]
              ],
              [["dialogue","뱀 발명가 오리도 줬잖아. 그 정도면 연구 자료 충분해."]]
            )
          ):null,
          itemExists(source,I.CHERRI_DUCK)?option(
            "luc-hotel-ducks-cherri","폭탄 오리",
            acquisitionFlow("luc-acq-cherri-duck",I.CHERRI_DUCK,
              [
                ["narration","폭탄 장식이 달린 오리를 네게 내밀던 루시퍼가 버튼을 발견하고 갑자기 손을 멈춘다."],
                ["dialogue","폭발 안 해. …아마."],
                ["narration","직접 몇 번 눌러본 뒤 아무 일도 없자 여분 하나를 골라 네게 준다."],
                ["dialogue","좋아. 이쪽은 안전해. 빨간 버튼 말고 검은 버튼만 눌러."]
              ],
              [
                ["narration","네 폭탄 오리를 본 루시퍼가 잠시 거리를 둔다."],
                ["dialogue","너 그거 아직 안 터졌지? 좋아."],
                ["narration","버튼이 없는 안전 버전을 하나 더 꺼낸다."],
                ["dialogue","이번엔 버튼 자체를 뺐어. 이게 훨씬 낫네."]
              ],
              [["dialogue","폭탄 오리는 이미 줬어. 더 이상 안전성 시험에 널 쓰진 않을게. 아마."]]
            )
          ):null
        ].filter(Boolean))
      ]
    );

    const sinsAsk=makeAsk(
      "lucifer-acq-ask-sins-ducks","칠죄종도 오리로 만들었어요?",30,
      [
        baseEntry("luc-sins-ducks-intro","dialogue","몇 개는 있어. 전부 보여달라고 하진 마."),
        choice("luc-sins-ducks-choice","어느 오리를 볼까?",[
          itemExists(source,I.BEE_DUCK)?option("luc-sins-bee","비",acquisitionFlow(
            "luc-acq-bee-duck",I.BEE_DUCK,
            [
              ["narration","꿀과 파티 장식이 붙은 오리를 집자 손가락에 살짝 달라붙는다."],
              ["dialogue","이건 만들면서부터 잘못됐어. 향을 너무 세게 넣었거든."],
              ["narration","같은 오리 중 덜 끈적이는 여분을 골라 네게 준다."],
              ["dialogue","이쪽이 그나마 안전해. 햇빛엔 두지 마."]
            ],
            [
              ["narration","네 비 오리 냄새를 맡은 루시퍼가 바로 자기 상자를 확인한다."],
              ["dialogue","네 건 향이 거의 빠졌네."],
              ["narration","새 여분 하나를 꺼낸다."],
              ["dialogue","리필 버전. 둘 다 같이 두진 마. 머리 아파."]
            ],
            [["dialogue","비 오리는 이미 하나 줬어. 내 것도 아직 끈적거리고."]]
          )):null,
          itemExists(source,I.OZZIE_DUCK)?option("luc-sins-ozzie","오지",acquisitionFlow(
            "luc-acq-ozzie-duck",I.OZZIE_DUCK,
            [
              ["narration","하트와 깃털 장식이 달린 오리 여러 개가 작은 무대처럼 늘어서 있다."],
              ["dialogue","공연하는 놈은 자세가 중요하잖아."],
              ["narration","포즈가 가장 안정적인 하나는 남겨두고 다른 여분을 네게 준다."],
              ["dialogue","이쪽도 괜찮아. 조금 과한 건 오지니까 정상이고."]
            ],
            [
              ["narration","네 오지 오리를 본 루시퍼가 자기 것과 포즈를 비교한다."],
              ["dialogue","네 건 예전 자세네."],
              ["narration","더 과장된 포즈의 새 버전을 꺼낸다."],
              ["dialogue","업데이트. 오지는 이쪽이 더 맞아."]
            ],
            [["dialogue","오지 오리도 줬잖아. 무대 하나 차릴 만큼 모으진 마."]]
          )):null,
          itemExists(source,I.MAMMON_DUCK)?option("luc-sins-mammon","마몬",acquisitionFlow(
            "luc-acq-mammon-duck",I.MAMMON_DUCK,
            [
              ["narration","금빛 장식이 달린 오리 목에 작은 가격표가 붙어 있다."],
              ["dialogue","봐. 값은 터무니없이 비싸고 내용물은 오리. 완벽하지."],
              ["narration","가격표가 조금 구겨진 여분 하나를 네게 던진다."],
              ["dialogue","공짜로 줄게. 걔한테는 말하지 마."]
            ],
            [
              ["narration","네 마몬 오리를 본 루시퍼가 가격표부터 확인한다."],
              ["dialogue","네 건 할인 전 가격이네."],
              ["narration","더 터무니없는 가격이 적힌 새 버전을 건넨다."],
              ["dialogue","인플레이션 반영했어."]
            ],
            [["dialogue","마몬 오리? 하나 줬어. 그 이상은 재고 관리 같아서 싫어."]]
          )):null,
          itemExists(source,I.SATAN_DUCK)?option("luc-sins-satan","사탄",acquisitionFlow(
            "luc-acq-satan-duck",I.SATAN_DUCK,
            [
              ["narration","근육과 화난 표정을 과장한 오리 여러 개를 본 루시퍼가 혼자 웃음을 참는다."],
              ["dialogue","이거 걔한테 보여주면 화내겠지."],
              ["narration","잠깐 더 고민하다 하나를 네게 건넨다."],
              ["dialogue","그러니까 네가 가져."]
            ],
            [
              ["narration","네 사탄 오리를 보고 루시퍼가 자기 버전의 표정을 더 찡그리게 고친다."],
              ["dialogue","네 건 덜 화났네."],
              ["narration","수정형 하나를 더 건넨다."],
              ["dialogue","이게 더 정확해."]
            ],
            [["dialogue","사탄 오리도 줬어. 걔한테 보여주고 무슨 일 생겨도 난 모른다."]]
          )):null
        ].filter(Boolean))
      ]
    );

    const veesAsk=makeAsk(
      "lucifer-acq-ask-vees-ducks","Vees도 오리로 만들었어요?",35,
      [
        baseEntry("luc-vees-ducks-intro","dialogue","왜 내가 걔들 셋을 세트로 만들었을 것 같아? …있긴 있어."),
        choice("luc-vees-ducks-choice","어느 오리를 볼까?",[
          itemExists(source,I.VOX_DUCK)?option("luc-vees-vox","TV 대가리",acquisitionFlow(
            "luc-acq-vox-duck",I.VOX_DUCK,
            [
              ["narration","금 간 화면 얼굴의 오리에서 짧은 노이즈가 튄다."],
              ["dialogue","하하! 이것 봐. 성격까지 똑같아."],
              ["narration","멀쩡한 버전은 선반에 남기고 유난히 노이즈가 심한 여분을 네게 준다."],
              ["dialogue","얘가 더 닮았으니까 네가 가져."]
            ],
            [
              ["narration","네 Vox 오리와 자기 여분에서 동시에 노이즈가 튄다."],
              ["dialogue","세상에. 둘이 있으니까 두 배로 짜증 나네."],
              ["narration","조용한 수정형 하나를 추가로 네게 민다."],
              ["dialogue","이것까지 가져. 내 작업대엔 하나만 남으면 돼."]
            ],
            [["dialogue","TV 대가리 오리는 이미 줬어. 화면 깨진 버전까지 두 개면 충분해."]]
          )):null,
          itemExists(source,I.VALENTINO_DUCK)?option("luc-vees-valentino","나방",acquisitionFlow(
            "luc-acq-valentino-duck",I.VALENTINO_DUCK,
            [
              ["narration","화려한 장식을 붙이다 만 오리들이 한쪽에 몰려 있다."],
              ["dialogue","하나 붙이면 또 하나가 필요해 보여. 피곤해."],
              ["narration","완성본은 하나 남겨두고 장식이 조금 덜한 여분을 네게 준다."],
              ["dialogue","이 정도면 충분해. 더 붙이지 마."]
            ],
            [
              ["narration","네 나방 오리를 본 루시퍼가 장식 수를 세어본다."],
              ["dialogue","네 건 좀 덜 과하네."],
              ["narration","더 과한 버전을 하나 꺼내 한숨을 쉰다."],
              ["dialogue","이게 더 정확하긴 해. 가져."]
            ],
            [["dialogue","그 나방 오리도 줬잖아. 장식 더 달 생각 없어."]]
          )):null,
          itemExists(source,I.VELVETTE_DUCK)?option("luc-vees-velvette","휴대폰 오리",acquisitionFlow(
            "luc-acq-velvette-duck",I.VELVETTE_DUCK,
            [
              ["narration","옆면의 버튼을 누르자 작은 홀로그램이 떠오른다."],
              ["dialogue","이건 화면이 자꾸 바뀌어. 한 디자인으로 두면 금방 낡았다고 할 것 같아서."],
              ["narration","프로토타입 중 하나를 네게 건넨다."],
              ["dialogue","네가 알아서 업데이트해."]
            ],
            [
              ["narration","네 휴대폰 오리를 본 루시퍼가 홀로그램 버전을 확인한다."],
              ["dialogue","네 건 첫 UI네."],
              ["narration","조금 다른 화면의 새 버전을 네게 준다."],
              ["dialogue","이쪽이 최신. 아마 오늘까진."]
            ],
            [["dialogue","그 휴대폰 오리도 이미 줬어. 내일 유행 바뀌면 또 만들 생각은 없고."]]
          )):null
        ].filter(Boolean))
      ]
    );

    const otherDuckAsk=makeAsk(
      "lucifer-acq-ask-other-ducks","호텔 밖 사람들 것도 만들어요?",35,
      [
        baseEntry("luc-other-ducks-intro","dialogue","가끔. 특징이 눈에 들어오면 손이 먼저 움직일 때가 있거든."),
        choice("luc-other-ducks-choice","어느 오리를 볼까?",[
          itemExists(source,I.ROSIE_DUCK)?option("luc-other-rosie","장미향 오리",acquisitionFlow(
            "luc-acq-rosie-duck",I.ROSIE_DUCK,
            [
              ["narration","장미 장식이 달린 오리를 들자 은은한 향이 난다."],
              ["dialogue","로지는 꽤 우아하잖아. 그래서 장미향도 넣었어."],
              ["narration","향이 덜 강한 여분을 네게 건넨다."],
              ["dialogue","너무 오래 맡진 마. 머리 아파."]
            ],
            [
              ["narration","네 장미향 오리를 확인한 루시퍼가 향이 거의 빠진 걸 알아챈다."],
              ["dialogue","이건 이제 거의 무향이네."],
              ["narration","새 여분을 건넨다."],
              ["dialogue","리필. 이번 것도 너무 오래 맡진 말고."]
            ],
            [["dialogue","로지 오리는 줬어. 장미향까지 아직 기억날걸."]]
          )):null,
          itemExists(source,I.CARMILLA_DUCK)?option("luc-other-carmilla","발레 오리",acquisitionFlow(
            "luc-acq-carmilla-duck",I.CARMILLA_DUCK,
            [
              ["narration","발끝으로 서 있는 오리 하나가 균형을 잃지 않고 버틴다."],
              ["dialogue","이건 자세 맞추는 게 생각보다 어려웠어."],
              ["narration","같은 자세의 여분 하나를 골라 네게 준다."],
              ["dialogue","건드릴 땐 발부터 잡아. 자꾸 넘어져."]
            ],
            [
              ["narration","네 발레 오리를 본 루시퍼가 새 버전과 균형을 비교한다."],
              ["dialogue","네 건 중심이 조금 앞으로 갔네."],
              ["narration","수정형 하나를 더 건넨다."],
              ["dialogue","이쪽이 더 오래 서 있어."]
            ],
            [["dialogue","발레 오리도 이미 하나 줬어. 내 선반에도 여분 있어."]]
          )):null
        ].filter(Boolean))
      ]
    );

    const lilithDuckAsk=makeAsk(
      "lucifer-acq-ask-lilith-duck","릴리스 오리도 있어요?",70,
      acquisitionFlow(
        "luc-acq-lilith-duck",I.LILITH_DUCK,
        [
          ["narration","루시퍼의 손이 상자 위에서 잠깐 멈춘다."],
          ["dialogue","…있어."],
          ["narration","깊숙한 곳에서 같은 사람을 본뜬 오리가 여러 버전 나온다. 머리와 장식이 조금씩 다르다."],
          ["dialogue","첫 번째, 두 번째… 머리 스타일 바뀌었을 때 만든 것도 있고."],
          ["narration","말끝이 흐려진다. 한동안 고르다가 비교적 최근 버전의 여분 하나를 네게 건넨다."],
          ["dialogue","이건 여분이야. 나한테도 남아 있어."],
          ["narration","상자는 바로 닫지 않는다."]
        ],
        [
          ["narration","네가 이미 릴리스 오리를 가지고 있다는 걸 본 순간 루시퍼가 꽤 오래 그것을 바라본다."],
          ["dialogue","…그 버전도 가지고 있었네."],
          ["narration","상자 안의 다른 버전들과 천천히 비교하다 하나를 더 꺼낸다."],
          ["dialogue","이쪽은 머리가 달라. 그러니까 같은 건 아니야."],
          ["narration","조심스럽게 네 쪽에 놓는다."]
        ],
        [
          ["dialogue","릴리스 오리는 이미 하나 줬어."],
          ["narration","루시퍼가 상자 쪽을 한번 보고는 더 열지 않는다."],
          ["dialogue","오늘은 그걸로 하자."]
        ],
        {minAffection:70}
      ),
      {
        startLocked:true,
        unlockMinAffection:70,
        unlockAskCondition:{askId:"lucifer-ask-lilith",status:"asked"},
        unlockHint:"릴리스 이야기를 먼저 나눈 뒤에 물어볼 수 있을 것 같다."
      }
    );

    const secretHaloAsk=makeAsk(
      "lucifer-acq-secret-halo","아직 남겨둔 천국 물건이 더 있어요?",90,
      acquisitionFlow(
        "luc-acq-secret-halo",I.BROKEN_HALO,
        [
          ["narration","한참 뒤, 루시퍼가 먼저 작은 상자를 네 앞에 내려놓는다."],
          ["dialogue","아까부터 자꾸 이쪽 얘기했잖아."],
          ["narration","상자 안에는 희미하게 빛나는 오래된 조각이 있다. 루시퍼의 표정에서 농담기가 사라진다."],
          ["dialogue","대답 대신 이걸 보여주는 거야."],
          ["narration","상자를 네 쪽으로 조금 더 밀어놓는다."],
          ["dialogue","잠깐 가지고 있어. 돌려달라고 할 수도 있고… 아닐 수도 있고."]
        ],
        [
          ["narration","네가 이미 비슷한 조각을 가지고 있다는 걸 본 순간 루시퍼가 그대로 굳는다."],
          ["dialogue","…그거 어디서 났어."],
          ["narration","긴 침묵 끝에 자기 상자에서 형태가 조금 다른 조각 하나를 꺼낸다."],
          ["dialogue","이미 하나 가지고 있다면 이것도 네가 가지고 있는 편이 낫겠네."],
          ["narration","이번에도 선물이라는 말은 하지 않는다."]
        ],
        [
          ["dialogue","그건 아직 네가 가지고 있어."],
          ["narration","루시퍼가 더 설명하지 않고 상자에서 시선을 뗀다."]
        ],
        {minAffection:90}
      ),
      {
        startLocked:true,
        unlockMinAffection:90,
        unlockCondition:{variableId:"luc_t66_heaven_boundary_respected",operator:"==",value:true},
        unlockAskCondition:{askId:"topic-ask-lucifer-morningstar-03",status:"asked"},
        unlockHint:"천국 이야기에 대한 경계를 지키며 충분히 가까워져야 할 것 같다."
      }
    );

    const secretLetterAsk=makeAsk(
      "lucifer-acq-secret-letter","사과 연습 때 숨긴 게 더 있었어요?",85,
      acquisitionFlow(
        "luc-acq-secret-letter",I.LETTER_TO_CHARLIE,
        [
          ["narration","루시퍼가 책 사이에서 접힌 봉투 하나를 꺼낸다."],
          ["dialogue","이건 찰리한테 보내려고 했다가… 안 보낸 거야."],
          ["narration","네가 봉투 쪽으로 손을 뻗지 않자 한동안 말이 없다."],
          ["dialogue","다시 숨기면 또 안 보낼 것 같으니까."],
          ["narration","봉투를 네 쪽으로 밀어놓지만 손끝은 잠시 떨어지지 않는다."],
          ["dialogue","내가 다시 달라고 할 때까지만 가지고 있어. 읽으라는 뜻은 아니야."]
        ],
        [
          ["narration","네가 이미 같은 봉투를 가지고 있는 걸 본 루시퍼가 눈을 크게 뜬다."],
          ["dialogue","…왜 그게 네한테 있어?"],
          ["narration","한참 확인하다 자기 서랍에서 초안이 한 장 더 나온다."],
          ["dialogue","그럼 이건 초안이야. 이것도 맡아."],
          ["narration","원본인지 복사본인지 설명은 끝까지 하지 않는다."]
        ],
        [
          ["dialogue","편지는 아직 네가 맡고 있어."],
          ["dialogue","읽지 않았다는 것도 알고 있고. 그걸로 됐어."]
        ],
        {minAffection:85}
      ),
      {
        startLocked:true,
        unlockMinAffection:85,
        unlockCondition:{variableId:"luc_acq_letter_boundary",operator:"==",value:true},
        unlockAskCondition:{askId:"lucifer-ask-family-boundary",status:"asked"},
        unlockHint:"사적인 글을 보지 않는 선택이 언젠가 돌아올지도 모른다."
      }
    );

    const asks=[
      firstDuckAsk,charlieDuckAsk,selfDuckAsk,alastorDuckAsk,emilyDuckAsk,
      hotelDuckAsk,sinsAsk,veesAsk,otherDuckAsk,lilithDuckAsk,secretHaloAsk,secretLetterAsk
    ].filter(ask=>ask&&(
      !ask.entries?.length ||
      ask.entries.some(entry=>entry.type!=="choice"||(entry.options||[]).length)
    ));

    for(const ask of asks){
      changed=upsertAskById(source.asks,ask,normalizeEntry)||changed;
    }

    // 61 · 설계도: 원본 대신 개인용 복사본.
    if(itemExists(source,I.PRIVATE_BLUEPRINT)){
      changed=patchOption(source,"event","solo-talk-lucifer-morningstar-01","설계도를 봐도 되는지 묻는다","luc-acq-t61-blueprint",
        acquisitionFlow(
          "luc-acq-t61-blueprint",I.PRIVATE_BLUEPRINT,
          [
            ["narration","네가 손을 대지 않고 기다리자 루시퍼가 설계도 묶음 맨 아래에서 작은 복사본 한 장을 빼낸다."],
            ["dialogue","원본은 안 돼. 대신 이건 가져도 돼."],
            ["narration","낙서와 수정선이 잔뜩 남은 복사본을 네 쪽으로 밀어놓는다."],
            ["dialogue","완성 설계도 아니니까 틀린 부분 찾아도 말하지 마."]
          ],
          [
            ["narration","네가 이미 비슷한 설계도를 가지고 있는 걸 본 루시퍼가 한쪽 눈썹을 올린다."],
            ["dialogue","너 복사본 있었어?"],
            ["narration","다른 수정 단계의 설계도를 한 장 더 골라준다."],
            ["dialogue","그럼 이건 다음 버전. 둘을 비교하면 뭐가 바뀌었는지 보일 거야."]
          ],
          [["dialogue","복사본은 이미 줬잖아. 원본은 여전히 안 돼."]]
        )
      )||changed;
    }

    // 61 · 완성되면 보여달라는 말: 다음 시험작인 태엽 오리를 넘김.
    if(itemExists(source,I.CLOCKWORK_DUCK)){
      changed=patchOption(source,"event","solo-talk-lucifer-morningstar-01","완성되면 첫 번째로 보여달라고 한다","luc-acq-t61-clockwork",
        acquisitionFlow(
          "luc-acq-t61-clockwork",I.CLOCKWORK_DUCK,
          [
            ["narration","잠시 뒤 루시퍼가 서랍에서 태엽 오리 시험작 하나를 꺼낸다."],
            ["dialogue","완성품은 아니고 테스트 버전."],
            ["narration","오리는 책상 위를 몇 걸음 걷다가 네 손에 부딪힌다."],
            ["dialogue","네가 먼저 보여달라고 했으니까 첫 시험작은 네가 가져."]
          ],
          [
            ["narration","네가 이미 태엽 오리를 가지고 있다는 걸 본 루시퍼가 바로 작동 소리부터 듣는다."],
            ["dialogue","그건 구형이네."],
            ["narration","더 조용하게 움직이는 새 시험작을 네게 건넨다."],
            ["dialogue","이쪽이 최신. 구형도 버리진 마. 비교용으로 좋아."]
          ],
          [["dialogue","태엽 오리는 이미 줬어. 다음 버전 완성되면 그때 다시 보여줄게."]]
        )
      )||changed;
    }

    // 63 · 연주를 부탁했을 때 직접 연주 대신 음악 오리.
    if(itemExists(source,I.MUSIC_DUCK)){
      changed=patchOption(source,"event","solo-talk-lucifer-morningstar-03","한번 연주해달라고 한다","luc-acq-t63-music",
        acquisitionFlow(
          "luc-acq-t63-music",I.MUSIC_DUCK,
          [
            ["narration","악보를 바라보던 루시퍼가 피아노 대신 선반에서 작은 오리를 하나 꺼낸다."],
            ["dialogue","오늘 연주는 이걸로 대신해."],
            ["narration","버튼을 누르자 짧은 멜로디가 흐르고, 루시퍼가 무심코 몇 음을 따라 흥얼거린다."],
            ["dialogue","…응. 오늘은 이 정도만 들어."],
            ["narration","음악이 멈춘 오리를 네 앞에 그대로 남겨둔다."]
          ],
          [
            ["narration","네가 이미 같은 음악 오리를 가진 걸 보자 루시퍼가 두 개를 동시에 눌러본다."],
            ["dialogue","아, 박자가 조금 다르네."],
            ["narration","자기 여분 중 다른 녹음 버전을 골라 네게 준다."],
            ["dialogue","이건 후반이 달라. 둘 다 들어봐."]
          ],
          [["dialogue","음악 오리는 줬어. 그걸로 오늘 연주도 대신한 걸로 하자."]]
        )
      )||changed;
    }

    // 64 · 가족사진은 주지 않고 빈 액자를 건넴.
    if(itemExists(source,I.EMPTY_FRAME)){
      changed=patchOption(source,"event","solo-talk-lucifer-morningstar-04","호텔에 가져다놓을 생각은 없는지 묻는다","luc-acq-t64-frame",
        acquisitionFlow(
          "luc-acq-t64-frame",I.EMPTY_FRAME,
          [
            ["dialogue","사진은 안 가져갈 거야."],
            ["narration","옆에 세워져 있던 빈 액자 하나가 같이 넘어지자 루시퍼가 집어 든다."],
            ["dialogue","이건 필요 없는데."],
            ["narration","잠깐 보다가 네게 건넨다."],
            ["dialogue","가져. 꼭 가족사진 넣으라는 뜻은 아니고."]
          ],
          [
            ["narration","네가 이미 빈 액자를 가지고 있다는 걸 본 루시퍼가 서랍에서 조금 다른 크기의 액자를 꺼낸다."],
            ["dialogue","그건 작은 거네."],
            ["narration","새 액자를 네 쪽에 세운다."],
            ["dialogue","큰 것도 하나 있으면 되지."]
          ],
          [["dialogue","액자는 이미 줬잖아. 뭘 넣을지는 네가 정해."]]
        )
      )||changed;
    }

    // 66 · 경계를 지킨 뒤 오래된 장식핀.
    if(itemExists(source,I.HEAVEN_PIN)){
      changed=patchOption(source,"event","solo-talk-lucifer-morningstar-06","더 묻지 않는다","luc-acq-t66-pin",
        acquisitionFlow(
          "luc-acq-t66-pin",I.HEAVEN_PIN,
          [
            ["narration","네가 더 묻지 않자 루시퍼가 상자 뚜껑을 바로 닫지 않는다."],
            ["narration","깃털 옆에서 오래된 금빛 장식핀 하나가 굴러 나온다."],
            ["dialogue","…이것도 아직 있었네."],
            ["narration","버리려는 듯 들었다가 손을 멈추고 네 앞에 내려놓는다."],
            ["dialogue","네가 가지고 있어. 내가 보는 것보단 낫겠다."]
          ],
          [
            ["narration","네가 이미 비슷한 장식핀을 가지고 있다는 걸 본 루시퍼가 잠깐 손을 멈춘다."],
            ["dialogue","그것도 남아 있었어?"],
            ["narration","상자에서 다른 모양의 핀 하나를 꺼내 나란히 놓는다."],
            ["dialogue","그럼 이것도 같이 둬. 세트는 아니지만… 비슷하니까."]
          ],
          [["dialogue","그 장식핀은 이미 네가 가지고 있잖아. 오늘은 깃털 얘기만 하자."]]
        )
      )||changed;
    }

    // 68 · 기한이 지난 초대장.
    if(itemExists(source,I.OVERLORD_INVITE)){
      changed=patchOption(source,"event","topic-talk-lucifer-morningstar-01","밀린 서류를 가리킨다","luc-acq-t68-invite",
        acquisitionFlow(
          "luc-acq-t68-invite",I.OVERLORD_INVITE,
          [
            ["narration","서류 더미를 뒤적이던 루시퍼가 초대장 하나를 발견한다. 제일 먼저 날짜를 확인한다."],
            ["dialogue","오! 끝났네."],
            ["narration","회의 날짜는 이미 며칠 전이다. 루시퍼의 표정이 믿을 수 없을 정도로 밝아진다."],
            ["dialogue","내가 아무것도 안 했는데 문제가 해결됐어. 완벽해."],
            ["narration","기념품이라도 되는 것처럼 네 쪽으로 초대장을 넘긴다."]
          ],
          [
            ["narration","네가 이미 같은 회의 초대장을 가지고 있는 걸 본 루시퍼가 두 날짜를 비교한다."],
            ["dialogue","잠깐. 이것도 놓쳤네."],
            ["narration","이번 것도 이미 날짜가 지났다."],
            ["dialogue","하하! 두 번이나 해결됐어. 이것도 가져."]
          ],
          [["dialogue","기한 지난 초대장은 이미 줬어. 더 찾으면 내가 너무 일을 안 한 것 같잖아."]]
        )
      )||changed;
    }

    // 68 · 사탄의 독촉장은 선물이 아니라 잠깐 떠넘김.
    if(itemExists(source,I.SATAN_NOTICE)){
      changed=patchOption(source,"event","topic-talk-lucifer-morningstar-01","중요한 것만 먼저 보라고 한다","luc-acq-t68-satan",
        acquisitionFlow(
          "luc-acq-t68-satan",I.SATAN_NOTICE,
          [
            ["narration","루시퍼가 몇 장을 골라내다가 붉은 봉투 하나에서 손을 멈춘다."],
            ["dialogue","이게 제일 급한 것 같네."],
            ["narration","그대로 한참 바라보다가 봉투를 뒤집어 제목을 가리고 네 쪽으로 민다."],
            ["dialogue","잠깐 가지고 있어."],
            ["narration","네가 반응하기도 전에 손을 뗀다."],
            ["dialogue","버리진 마! 그냥 내 눈앞에서 치워."]
          ],
          [
            ["narration","네가 이미 비슷한 붉은 독촉장을 가지고 있다는 걸 본 루시퍼가 표정을 구긴다."],
            ["dialogue","사탄이 너한테도 보냈어?"],
            ["narration","잠깐 확인하고 자기 이름이 적혀 있다는 걸 깨닫는다."],
            ["dialogue","…왜 네가 가지고 있지. 됐어, 그럼 이것도 같이 보관해."],
            ["narration","새 독촉장까지 네 쪽으로 밀어버린다."]
          ],
          [["dialogue","독촉장은 네가 맡고 있잖아. 아주 잘하고 있어. 계속 그렇게 해."]]
        )
      )||changed;
    }

    // 사과 ASK · 오래된 씨앗.
    if(itemExists(source,I.APPLE_SEED)){
      changed=patchOption(source,"ask","lucifer-ask-food","역시 사과군요.","luc-acq-ask-food-seed",
        acquisitionFlow(
          "luc-acq-ask-food-seed",I.APPLE_SEED,
          [
            ["narration","루시퍼가 작은 상자를 열다가 오래된 씨앗 하나를 발견한다."],
            ["dialogue","이거 이제 안 날 것 같은데."],
            ["narration","버리려다 네 쪽을 보고 손을 멈춘다."],
            ["dialogue","심어볼 거면 가져. 자라면 말해."]
          ],
          [
            ["narration","네가 이미 같은 씨앗을 가지고 있다는 걸 본 루시퍼가 자기 손의 씨앗과 번갈아 본다."],
            ["dialogue","너 이미 심을 후보 하나 있네."],
            ["narration","그래도 새 씨앗을 네 손바닥에 하나 더 떨어뜨린다."],
            ["dialogue","두 개면 성공 확률도 두 배겠지. 아마."]
          ],
          [["dialogue","사과 씨앗은 줬잖아. 자라면 그때 알려줘."]]
        )
      )||changed;
    }

    // 천국 과거 ASK · 말 대신 오래된 별 지도.
    if(itemExists(source,I.STAR_MAP)){
      changed=patchOption(source,"ask","lucifer-ask-heaven-past","오늘은 여기까지만 해도 돼요.","luc-acq-ask-heaven-map",
        acquisitionFlow(
          "luc-acq-ask-heaven-map",I.STAR_MAP,
          [
            ["narration","네가 더 묻지 않자 루시퍼가 서랍을 열어 오래 접혀 있던 지도를 꺼낸다."],
            ["dialogue","말로 설명하는 것보다 이게 빠르겠네."],
            ["narration","지도를 펼치지는 않은 채 네게 건넨다."],
            ["dialogue","아주 오래된 거야. 지금은 없는 것도 많고."],
            ["narration","네가 돌려주려 하자 손을 뻗지 않는다."],
            ["dialogue","그냥 가지고 있어. 요즘엔 저걸 보고 갈 데도 없잖아."]
          ],
          [
            ["narration","네가 이미 오래된 별 지도를 가지고 있다는 걸 본 루시퍼가 조용히 펼쳐본다."],
            ["dialogue","이건 다른 판본이네."],
            ["narration","자기 서랍에서 더 낡은 지도를 하나 꺼내 겹쳐본다."],
            ["dialogue","몇 군데 표시가 달라. 그것도 가지고 있어."]
          ],
          [["dialogue","별 지도는 이미 네가 가지고 있어. 오늘은 말로 설명 안 할래."]]
        )
      )||changed;
    }

    // 외로움 ASK · 슬픈 오리는 바로 주지 않고 다음에 맡기는 느낌.
    if(itemExists(source,I.SAD_DUCK)){
      changed=patchOption(source,"ask","lucifer-ask-lonely","혼자 있고 싶을 때랑 외로운 건 다르죠.","luc-acq-ask-lonely-sad",
        acquisitionFlow(
          "luc-acq-ask-lonely-sad",I.SAD_DUCK,
          [
            ["narration","대화가 끝난 뒤에도 루시퍼는 바로 다른 말을 하지 않는다."],
            ["narration","한참 뒤 작업대에서 축 처진 오리 하나를 가져와 네 앞에 내려놓는다."],
            ["dialogue","얘 좀 보고 있어."],
            ["narration","자기 선반에는 같은 오리가 하나 더 남아 있다."],
            ["dialogue","오늘은 내가 보기 싫어. …어제 얘기랑 연결 짓지는 말고."]
          ],
          [
            ["narration","네가 이미 축 처진 오리를 가지고 있다는 걸 본 루시퍼가 자기 선반의 여분도 내려놓는다."],
            ["dialogue","너도 하나 있었네."],
            ["narration","잠시 둘을 나란히 놓고 보다가 새 여분을 네 쪽으로 민다."],
            ["dialogue","그럼 둘이 같이 있게 해. 오늘은 내 선반에서 치우고 싶어."]
          ],
          [["dialogue","그 우울한 오리는 아직 네가 보고 있어줘. 난 내 거 하나면 충분해."]]
        )
      )||changed;
    }

    // 플레이어 인상 ASK · 다음에 꺼내준 손글씨 카드.
    if(itemExists(source,I.HANDWRITTEN_CARD)){
      changed=patchOption(source,"ask","lucifer-ask-player-impression","저도 당신이 편해요.","luc-acq-ask-player-card",
        acquisitionFlow(
          "luc-acq-ask-player-card",I.HANDWRITTEN_CARD,
          [
            ["narration","다음번 책상 위에 짧은 손글씨 카드 한 장이 뒤집힌 채 놓여 있다."],
            ["dialogue","그거 네 거야."],
            ["narration","카드를 뒤집으려는 네 손을 보자 루시퍼가 바로 다른 오리를 집어 든다."],
            ["dialogue","읽어도 되는데 내 앞에서 소리 내서 읽지는 마."]
          ],
          [
            ["narration","네가 이미 비슷한 카드를 가지고 있다는 걸 본 루시퍼가 잠시 굳는다."],
            ["dialogue","…그 카드도 가지고 있었어?"],
            ["narration","잠깐 고민하다 이번엔 더 짧은 문장이 적힌 새 카드를 내민다."],
            ["dialogue","그럼 이건 두 번째. 둘이 내용은 달라."]
          ],
          [["dialogue","카드는 이미 줬어. 내용 확인하려고 나한테 다시 읽어주진 마."]]
        )
      )||changed;
    }

    // 최애 오리 ASK · 미니 버전.
    if(itemExists(source,I.MINI_DUCK)){
      changed=patchOption(source,"ask","banter-ask-lucifer-morningstar-02","제일 좋아하는 걸 저한테 만들어줘요.","luc-acq-ask-favorite-mini",
        acquisitionFlow(
          "luc-acq-ask-favorite-mini",I.MINI_DUCK,
          [
            ["narration","루시퍼가 한동안 못마땅한 척하다가 주머니에서 아주 작은 오리 하나를 꺼낸다."],
            ["dialogue","최애랑 똑같은 건 아니야. 그러면 최애가 둘이 되잖아."],
            ["narration","미니 버전을 네 손에 올려놓는다."],
            ["dialogue","대신 이건 네 거."]
          ],
          [
            ["narration","네가 이미 미니 오리를 가지고 있다는 걸 본 루시퍼가 눈을 가늘게 뜬다."],
            ["dialogue","너 그 작은 것도 있었어?"],
            ["narration","이번엔 모자가 조금 다른 미니 버전을 하나 더 꺼낸다."],
            ["dialogue","이건 변형판. 둘이 같은 건 아니야."]
          ],
          [["dialogue","미니 오리는 이미 줬어. 더 작게 만들면 이제 내가 잃어버려."]]
        )
      )||changed;
    }

    // 65 · 플레이어가 사과 연습을 캐묻지 않고 물러나는 선택지를 추가.
    changed=addRootOption(source,"solo-talk-lucifer-morningstar-05",{
      id:"luc-acq-t65-boundary-option",
      label:"못 본 걸로 하고 연습을 계속하게 둔다",
      tone:"supportive",
      entries:[
        normalizeEntry(baseEntry("luc-acq-t65-boundary-n1","narration","네가 메모에서 시선을 떼자 루시퍼가 손바닥으로 가리고 있던 종이를 천천히 다시 펼친다.")),
        normalizeEntry(baseEntry("luc-acq-t65-boundary-d1","dialogue","…그래. 그렇게 해.")),
        normalizeEntry(baseEntry("luc-acq-t65-boundary-n2","narration","펜을 다시 들기 전, 네가 정말 보지 않는지 한번 확인한다.")),
        normalizeEntry(baseEntry("luc-acq-t65-boundary-d2","dialogue","그리고 아무한테도 말하지 마."))
      ],
      condition:null,
      effects:[{id:"luc-acq-t65-boundary-fx",variableId:"luc_acq_letter_boundary",operation:"set",value:true}],
      itemEffects:[],itemCondition:null,itemEffectClaimCondition:null,askCondition:null,
      affectionCondition:null,affectionEffects:[{id:"luc-acq-t65-boundary-aff",characterId:C,amount:2,silent:false,once:true}],
      emotionCondition:null,emotionEffects:[],exitMode:"continue",targetEventId:""
    })||changed;

    window.HV_LUCIFER_DIALOGUE_ACQUISITION_VERSION=VERSION;
    return{...prior,state:source,changed,luciferDialogueAcquisitionVersion:VERSION};
  };
})();