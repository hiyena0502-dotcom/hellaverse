"use strict";

(()=>{
  const VERSION=4;
  const key=value=>String(value||"").normalize("NFKC").trim().toLowerCase().replace(/[^a-z0-9가-힣]+/g,"");
  const hash=value=>{
    let h=2166136261;
    for(const ch of String(value||"")){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}
    return h>>>0;
  };
  const tokens=value=>new Set(String(value||"").toLowerCase().match(/[a-z0-9가-힣]{2,}/g)||[]);
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
      if(current<VERSION&&String(event.id).startsWith("voice-")){
        if(enrichVoiceEvent(source,event,characters.get(event.characterId),helpers))changed=true;
      }
    }

    if(current<VERSION){
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
      source.dialoguePresetVersion=VERSION;
      changed=true;
    }
    return{state:source,changed};
  };
  window.HV_DIALOGUE_PRESET_VERSION=VERSION;
})();
