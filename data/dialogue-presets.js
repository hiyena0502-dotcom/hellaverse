"use strict";

(()=>{
  const VERSION=12;
  const key=value=>String(value||"").normalize("NFKC").trim().toLowerCase().replace(/[^a-z0-9가-힣]+/g,"");
  const hash=value=>{
    let h=2166136261;
    for(const ch of String(value||"")){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}
    return h>>>0;
  };
  const tokens=value=>new Set(String(value||"").toLowerCase().match(/[a-z0-9가-힣]{2,}/g)||[]);
  const LEGACY_DIALOGUE_TRANSLATIONS=[
    ["Sorry I wasn't here sooner, sweetie.","더 일찍 곁에 있어주지 못해서 미안하구나, 얘야."],
    ["A smile is a valuable tool, my dear.","미소는 아주 유용한 도구랍니다, 친애하는 분."],
    ["Not a bad boy.","나쁜 남자는 아니었어."],
    ["Oh, hello.","오, 안녕하시오."],
    ["I decided... to stay.","나… 남기로 했어."],
    ["Tell Auntie Rosie what she can do for you.","로지 이모한테 뭘 도와주면 좋을지 말해보렴."],
    ["Adam is dead.","아담은 죽었어."],
    ["That was uncalled for, Adam.","그건 선을 넘었어, 아담."],
    ["Charlie!! Don't give up on this!","찰리!! 이걸 포기하면 안 돼!"],
    ["Ugh, we were partners.","으, 우린 동료였어."],
    ["Hi. Hello. Abel here, son of Adam.","안녕. 아벨이야. 아담의 아들이고."],
    ["Charlie. Stop. Breathe.","찰리. 멈춰. 숨 쉬어."],
    ["ASK FIRST!","먼저 물어봐!"],
    ["KING OF HELL","지옥의 왕"],
    ["DADDY","아빠"],
    ["YES!","좋아!"],
    ["Fine.","그래."],
    ["darling","얘야"],
    ["Wrath","분노의 링"],
    ["그리고 호텔을 돕는 방식이라는 말에 루시퍼의 표정이 잠깐 부드러워진다.","루시퍼가 호텔 업무 메모를 훑다가 한 줄에서 손을 멈춘다. 굳어 있던 표정이 조금 누그러진다."],
    ["호텔을 돕는 방식이라는 말에 루시퍼의 표정이 잠깐 부드러워진다.","루시퍼가 호텔 업무 메모를 읽다가 잠시 손을 멈춘다. 표정이 조금 누그러진다."]
  ];
  const localizeLegacyDialogue=value=>{
    let text=String(value??"");
    for(const [from,to] of LEGACY_DIALOGUE_TRANSLATIONS)text=text.split(from).join(to);
    text=text.replace(/\bNO\b/g,"안 돼");
    return text;
  };
  const localizeEntryTree=entries=>{
    let changed=false;
    walk(entries,owner=>{
      for(const field of ["text","prompt","label"]){
        if(typeof owner?.[field]!=="string")continue;
        const next=localizeLegacyDialogue(owner[field]);
        if(next!==owner[field]){owner[field]=next;changed=true}
      }
    });
    return changed;
  };
  const clonePlain=value=>JSON.parse(JSON.stringify(value));
  const repairLegacyCharacterRefs=source=>{
    const characters=source.characters||[];
    const valid=new Set(characters.map(character=>character.id));
    const lookup=new Map();
    for(const character of characters){
      lookup.set(key(character.id),character.id);
      lookup.set(key(character.name),character.id);
    }
    for(const pack of window.HV_STORY_PACKS||[]){
      const refs=pack?.characterRefs&&typeof pack.characterRefs==="object"?pack.characterRefs:{};
      for(const [token,aliases] of Object.entries(refs)){
        const candidates=[token,...(Array.isArray(aliases)?aliases:[aliases])].filter(Boolean);
        const resolved=candidates.map(candidate=>lookup.get(key(candidate))).find(Boolean);
        if(!resolved)continue;
        for(const candidate of candidates)lookup.set(key(candidate),resolved);
      }
    }
    const fix=value=>{
      const raw=String(value||"");
      if(!raw||valid.has(raw))return raw;
      return lookup.get(key(raw))||raw;
    };
    let changed=false;
    const applyOwner=owner=>{
      if(!owner||typeof owner!=="object")return;
      for(const field of ["characterId","speakerCharacterId"]){
        if(typeof owner[field]!=="string"||!owner[field])continue;
        const next=fix(owner[field]);
        if(next!==owner[field]){owner[field]=next;changed=true}
      }
      for(const field of ["affectionCondition","emotionCondition"]){
        if(!owner[field]?.characterId)continue;
        const next=fix(owner[field].characterId);
        if(next!==owner[field].characterId){owner[field].characterId=next;changed=true}
      }
      for(const field of ["affectionEffects","emotionEffects"]){
        for(const effect of owner[field]||[]){
          if(!effect.characterId)continue;
          const next=fix(effect.characterId);
          if(next!==effect.characterId){effect.characterId=next;changed=true}
        }
      }
    };
    for(const event of source.events||[]){
      applyOwner(event);
      walk(event.entries,applyOwner);
    }
    for(const ask of source.asks||[]){
      applyOwner(ask);
      if(ask.unlockEmotionCondition?.characterId){
        const next=fix(ask.unlockEmotionCondition.characterId);
        if(next!==ask.unlockEmotionCondition.characterId){ask.unlockEmotionCondition.characterId=next;changed=true}
      }
      walk(ask.entries,applyOwner);
    }
    for(const thought of source.thoughts||[]){
      if(!thought.characterId)continue;
      const next=fix(thought.characterId);
      if(next!==thought.characterId){thought.characterId=next;changed=true}
    }
    for(const item of source.items||[]){
      if(item.collectionCharacterId){
        const next=fix(item.collectionCharacterId);
        if(next!==item.collectionCharacterId){item.collectionCharacterId=next;changed=true}
      }
      for(const reaction of item.reactions||[]){
        applyOwner(reaction);
        for(const field of ["firstEntries","repeatEntries","specialEntries"])walk(reaction[field],applyOwner);
      }
    }
    return changed;
  };
  const pruneRetiredSoloTalk=source=>{
    const currentIds=new Set();
    for(const pack of window.HV_STORY_PACKS||[]){
      if(!String(pack?.id||"").startsWith("solo-talks-"))continue;
      for(const event of pack.events||[])currentIds.add(event.id);
    }
    if(!currentIds.size)return false;
    const before=(source.events||[]).length;
    source.events=(source.events||[]).filter(event=>!String(event.id||"").startsWith("solo-talk-")||currentIds.has(event.id));
    return source.events.length!==before;
  };
  const syncTunedStoryPacks=source=>{
    let changed=false;
    const tuned=(window.HV_STORY_PACKS||[]).filter(pack=>Number(pack?.version||0)>=2);
    if(!tuned.length)return false;
    const eventById=new Map((source.events||[]).map(event=>[event.id,event]));
    const askById=new Map((source.asks||[]).map(ask=>[ask.id,ask]));
    for(const pack of tuned){
      for(const fresh of pack.events||[]){
        const live=eventById.get(fresh.id);
        if(!live)continue;
        live.name=fresh.name;
        live.characterId=fresh.characterId;
        live.eventRole=fresh.eventRole||live.eventRole||"talk";
        live.menuVisible=fresh.menuVisible!==false;
        live.randomEligible=fresh.randomEligible!==false;
        live.continuationEventIds=clonePlain(fresh.continuationEventIds||[]);
        live.emotionExitMode=fresh.emotionExitMode||"keep";
        live.entries=clonePlain(fresh.entries||[]);
        changed=true;
      }
      for(const fresh of pack.asks||[]){
        const live=askById.get(fresh.id);
        if(!live)continue;
        for(const key of ["label","characterId","minAffection","startLocked","unlockMinAffection","unlockCondition","unlockItemCondition","unlockAskCondition","unlockEmotionCondition","unlockHint","repeatable","affectionDelta","emotionState","emotionIntensity","enabled"]){
          if(Object.prototype.hasOwnProperty.call(fresh,key))live[key]=clonePlain(fresh[key]);
          else delete live[key];
        }
        live.entries=clonePlain(fresh.entries||[]);
        changed=true;
      }
    }
    return changed;
  };
  const walk=(entries,visit)=>{
    for(const entry of entries||[]){
      visit(entry);
      if(entry.type==="choice")for(const option of entry.options||[]){visit(option);walk(option.entries,visit)}
    }
  };
  const hasItemGrant=entries=>{
    let found=false;
    walk(entries,owner=>{if((owner.itemEffects||[]).some(effect=>Number(effect.amount||0)>0))found=true});
    return found;
  };
  const talkSignature=event=>{
    const parts=[];
    walk(event.entries,entry=>{
      if(entry.type==="dialogue"||entry.type==="narration"){
        const text=String(entry.text||"").normalize("NFKC").toLowerCase().replace(/\s+/g," ").trim();
        if(text)parts.push(text);
      }else if(entry.type==="choice"){
        const prompt=String(entry.prompt||"").normalize("NFKC").toLowerCase().replace(/\s+/g," ").trim();
        if(prompt)parts.push(prompt);
      }
    });
    return parts.join(" | ");
  };
  const roleOf=event=>{
    const explicit=String(event.eventRole||"").toLowerCase();
    const id=String(event.id||"");
    const name=String(event.name||"");
    const legacyActionId=/(?:^|-)act(?:-|\d|$)/i.test(id)||/(?:^|-)action(?:-|\d|$)/i.test(id);
    if(["entry","exit","story","action"].includes(explicit))return explicit;
    if(/^\s*ENTRY(?:\s*[·:|\-]|\s|$)/i.test(name))return"entry";
    if(/^\s*EXIT(?:\s*[·:|\-]|\s|$)/i.test(name))return"exit";
    if(/^\s*ACTION(?:\s*[·:|\-]|\s|$)/i.test(name)||legacyActionId)return"action";
    if(event.menuVisible===false)return"story";
    return"talk";
  };
  const characterKey=character=>key(character?.id||character?.name||"");
  const closeByCharacter={
    charliemorningstar:"찰리는 방금 나눈 이야기를 잊지 않으려는 듯 체크리스트 귀퉁이에 작은 별표를 그린다.",
    vaggie:"배기는 주변을 한 번 더 확인한 뒤, 조금 누그러진 표정으로 고개를 끄덕인다.",
    alastor:"알래스터는 라디오 다이얼을 한 칸 돌린 뒤 의미를 알 수 없는 미소를 남긴다.",
    vox:"복스의 화면에 짧은 파형이 스쳤다가, 아무 일도 없었다는 듯 평소의 미소로 돌아온다.",
    niffty:"니프티는 대화가 끝나자마자 방금 발견한 새로운 할 일을 향해 쏜살같이 달려간다.",
    angeldust:"엔젤은 농담을 하나 더 던지려다 말고, 대신 가볍게 어깨를 맞댄다.",
    husk:"허스크는 빈 잔을 천천히 닦으며 방금 한 말이 충분했다는 듯 턱짓한다.",
    lute:"류트는 더 말할 필요가 없다는 듯 무기를 고쳐 쥐지만, 이번에는 먼저 자리를 뜨지 않는다.",
    adam:"아담은 마지막까지 자기가 이긴 대화였다고 우기며 만족스럽게 웃는다.",
    emily:"에밀리는 떠오른 생각을 놓칠세라 두 손을 모으고 한 번 더 힘차게 고개를 끄덕인다.",
    baxter:"백스터는 방금 얻은 반응까지 실험 기록에 적으며 혼자 만족스럽게 웃는다.",
    sirpentious:"펜셔스는 망토를 과장되게 펄럭였지만, 마지막 감사 인사만큼은 의외로 조용하다.",
    cherribomb:"체리는 다음엔 더 시끄러운 일을 하자며 웃고는 손바닥을 내민다.",
    stolas:"스톨라스는 창밖의 별빛을 한 번 올려다본 뒤 한결 부드러운 목소리로 작별한다.",
    loona:"루나는 휴대폰으로 시선을 돌리지만, 입꼬리가 아주 조금 올라간 건 숨기지 못한다.",
    moxxie:"목시는 방금 대화의 결론을 정리하듯 반듯하게 고개를 끄덕인다.",
    millie:"밀리는 기분 좋게 웃으며 다음에는 자신이 먼저 찾아가겠다고 말한다.",
    fizzarolli:"피자로리는 즉석에서 짧은 마무리 포즈를 만들고 네 반응을 확인한다.",
    octavia:"옥타비아는 다시 헤드폰을 쓰기 전, 작게나마 분명한 인사를 남긴다."
  };
  const emotionByCharacter={
    lute:["guarded",34],adam:["joy",38],vox:["curious",34],alastor:["curious",32],
    husk:["calm",30],vaggie:["calm",30],baxter:["curious",46],octavia:["calm",28]
  };

  function addLinkedReward(event,item,character,helpers){
    if(!event||!item)return false;
    let existing=false;
    walk(event.entries,owner=>{
      if((owner.itemEffects||[]).some(effect=>effect.itemId===item.id))existing=true;
    });
    if(existing)return false;
    const rewardId="dialogue-reward-"+String(event.id).replace(/[^a-zA-Z0-9_-]+/g,"-")+"-"+String(item.id).replace(/[^a-zA-Z0-9_-]+/g,"-");
    const reward={
      id:rewardId,
      type:"narration",
      text:`대화를 마치자 ${character?.name||"상대"}가 「${item.name}」을(를) 건넨다.`,
      itemEffects:[{id:rewardId+"-grant",itemId:item.id,amount:1,once:true}]
    };
    event.entries.push(typeof helpers.normalizeEntry==="function"?helpers.normalizeEntry(reward):reward);
    item.inventoryEventId=event.id;
    return true;
  }
  function itemScore(item,eventTokens,eventId){
    const itemTokens=tokens([item.name,item.description].join(" "));
    let score=0;
    itemTokens.forEach(token=>{if(eventTokens.has(token))score+=10});
    score+=Math.max(0,5-(hash(eventId+"::"+item.id)%6));
    return score;
  }
  function bestReward(source,event,used,granted){
    const eventTokens=tokens([event.name,...(event.entries||[]).map(entry=>entry.text||entry.prompt||"")].join(" "));
    return (source.items||[])
      .filter(item=>item.enabled!==false&&item.collectionCharacterId===event.characterId&&!used.has(item.id)&&!granted.has(item.id))
      .sort((a,b)=>itemScore(b,eventTokens,event.id)-itemScore(a,eventTokens,event.id)||hash(event.id+a.id)-hash(event.id+b.id))[0]||null;
  }
  function enrichVoiceEvent(source,event,character,helpers){
    let changed=false;
    const suffix=String(event.id).replace(/[^a-zA-Z0-9_-]+/g,"-");
    const variableId="seen_"+suffix.replace(/-/g,"_");
    if(!source.variables.some(variable=>variable.id===variableId)){
      source.variables.push(helpers.normalizeVariable({id:variableId,name:`확인 · ${event.name}`,type:"boolean",defaultValue:"false"}));
      changed=true;
    }
    const first=event.entries[0];
    if(first&&!((first.effects||[]).some(effect=>effect.variableId===variableId))){
      first.effects=[...(first.effects||[]),{id:suffix+"-seen",variableId,operation:"set",value:"true"}];
      changed=true;
    }
    const player=event.entries.find(entry=>entry.type==="dialogue"&&(entry.speaker==="PLAYER"||!entry.speakerCharacterId));
    if(player&&character&&!((player.affectionEffects||[]).some(effect=>effect.characterId===character.id))){
      player.affectionEffects=[...(player.affectionEffects||[]),{id:suffix+"-affection",characterId:character.id,amount:1}];
      changed=true;
    }
    const closeId=suffix+"-closing-narration";
    if(!event.entries.some(entry=>entry.id===closeId)){
      const identity=characterKey(character);
      const emotion=emotionByCharacter[identity]||["joy",30];
      const closing={
        id:closeId,type:"narration",
        text:closeByCharacter[identity]||`${character?.name||"상대"}가 방금 나눈 이야기를 되새기듯 잠시 머문 뒤 자리를 정리한다.`,
        emotionEffects:character?[{id:suffix+"-emotion",characterId:character.id,state:emotion[0],intensity:emotion[1]}]:[]
      };
      event.entries.push(typeof helpers.normalizeEntry==="function"?helpers.normalizeEntry(closing):closing);
      changed=true;
    }
    return changed;
  }

  window.HV_APPLY_DIALOGUE_PRESETS=(source,helpers={})=>{
    if(!source||!Array.isArray(source.events))return{state:source,changed:false};
    const current=Math.max(0,Number(source.dialoguePresetVersion)||0);
    let changed=false;
    const characters=new Map((source.characters||[]).map(character=>[character.id,character]));
    if(current<12&&repairLegacyCharacterRefs(source))changed=true;
    if(current<12&&pruneRetiredSoloTalk(source))changed=true;
    if(current<12&&syncTunedStoryPacks(source))changed=true;
    if(current<12){
      for(const event of source.events||[])if(localizeEntryTree(event.entries))changed=true;
      for(const ask of source.asks||[])if(localizeEntryTree(ask.entries))changed=true;
      for(const item of source.items||[]){
        for(const reaction of item.reactions||[]){
          for(const field of ["firstEntries","repeatEntries","specialEntries"]){
            if(localizeEntryTree(reaction[field]))changed=true;
          }
        }
      }
      for(const row of source.playState?.log||[]){
        if(typeof row?.text==="string"){
          const next=localizeLegacyDialogue(row.text);
          if(next!==row.text){row.text=next;changed=true}
        }
      }
    }
    const seenTalkSignatures=new Map();
    for(const event of source.events){
      const role=roleOf(event);
      if(event.eventRole!==role){event.eventRole=role;changed=true}
      if(role==="action"&&/^\s*ACTION\s*[·:|\-]/i.test(event.name||"")){
        event.name=String(event.name).replace(/^\s*ACTION\s*[·:|\-]\s*/i,"TALK · ");
        changed=true;
      }
      const visible=["talk","action"].includes(role)?event.menuVisible!==false:false;
      if(event.menuVisible!==visible){event.menuVisible=visible;changed=true}
      if(role==="talk"&&(hasItemGrant(event.entries)||/보관을 맡기다|아이템\s*(?:획득|지급)|수집품을?\s*건네/i.test(String(event.name||"")))){
        if(event.randomEligible!==false){event.randomEligible=false;changed=true}
      }
      if(role==="talk"){
        const signature=talkSignature(event);
        if(signature){
          const signatureKey=String(event.characterId||"")+"::"+signature;
          if(seenTalkSignatures.has(signatureKey)){
            if(event.randomEligible!==false){event.randomEligible=false;changed=true}
          }else seenTalkSignatures.set(signatureKey,event.id);
        }
      }
      if(current<3&&String(event.id).startsWith("voice-")){
        if(enrichVoiceEvent(source,event,characters.get(event.characterId),helpers))changed=true;
      }
    }

    if(current<3){
      const used=new Set();
      const granted=new Set();
      const collectGranted=entries=>walk(entries,owner=>{
        for(const effect of owner.itemEffects||[])if(effect.itemId)granted.add(effect.itemId);
      });
      for(const event of source.events||[])collectGranted(event.entries);
      for(const ask of source.asks||[])collectGranted(ask.entries);
      for(const item of source.items||[]){
        if(!item.inventoryEventId)continue;
        const event=source.events.find(candidate=>candidate.id===item.inventoryEventId);
        if(event&&addLinkedReward(event,item,characters.get(event.characterId),helpers)){changed=true;granted.add(item.id)}
        used.add(item.id);
      }
      for(const event of source.events.filter(candidate=>candidate.eventRole==="talk"&&String(candidate.id).startsWith("voice-"))){
        const item=bestReward(source,event,used,granted);
        if(!item)continue;
        if(addLinkedReward(event,item,characters.get(event.characterId),helpers)){used.add(item.id);granted.add(item.id);changed=true}
      }
    }
    if(current<VERSION){
      source.dialoguePresetVersion=VERSION;
      changed=true;
    }
    return{state:source,changed};
  };
  window.HV_DIALOGUE_PRESET_VERSION=VERSION;
})();
