"use strict";
function createSession(){
  const saved=normalizePlayState(state.playState);
  const variables={};
  state.variables.forEach(v=>{
    variables[v.id]=v.id in saved.variables
      ? parseVariable(v,saved.variables[v.id])
      : parseVariable(v,v.defaultValue);
  });
  const affection={};
  const emotions={};
  state.characters.forEach(c=>{
    affection[c.id]=c.id in saved.affection
      ? clamp(saved.affection[c.id],0,100,c.affectionStart)
      : c.affectionStart;
    const emo=saved.emotions[c.id];
    emotions[c.id]=emo
      ? {state:emo.state,intensity:emo.intensity}
      : {state:c.emotionDefault,intensity:c.emotionIntensity};
  });
  return {variables,affection,emotions,log:saved.log.slice(-200),recentTalks:clone(saved.recentTalks||{}),selectedOptionIds:[...(saved.selectedOptionIds||[])]};
}
function syncSessionDefinitions(){
  state.variables.forEach(v=>{
    if(!(v.id in session.variables))session.variables[v.id]=parseVariable(v,v.defaultValue);
  });
  state.characters.forEach(c=>{
    if(!(c.id in session.affection))session.affection[c.id]=c.affectionStart;
    if(!(c.id in session.emotions))session.emotions[c.id]={state:c.emotionDefault,intensity:c.emotionIntensity};
  });
}
function parseVariable(v,value){
  if(!v)return value;
  if(v.type==="number"){const n=Number(value);return Number.isFinite(n)?n:0}
  if(v.type==="boolean")return value===true||String(value).toLowerCase()==="true";
  return String(value??"");
}
function getCharacter(id, source=state){return source.characters.find(c=>c.id===id)||null}
function enabledCharacters(source=state){return source.characters.filter(c=>c.enabled)}
function getEvent(id, source=state){
  if(activeInteractionEvent&&activeInteractionEvent.id===id)return activeInteractionEvent;
  if(activeRoomIntroEvent&&activeRoomIntroEvent.id===id)return activeRoomIntroEvent;
  return source.events.find(e=>e.id===id)||null;
}
function dialogueAcquisitionEventComplete(event,source=state){
  const effectId=String(event?.dialogueAcquisitionEffectId||"");
  return Boolean(effectId&&(source.claimedItemEffectIds||[]).includes(effectId));
}
function eventsForCharacter(charId, source=state){return source.events.filter(e=>e.characterId===charId&&e.menuVisible!==false&&!dialogueAcquisitionEventComplete(e,source)&&!isExitEvent(e)&&!isEntryEvent(e)&&!isStoryEvent(e))}
function talkEventsForCharacter(charId, source=state){return source.events.filter(e=>e.characterId===charId&&e.menuVisible!==false&&!dialogueAcquisitionEventComplete(e,source)&&eventRoleOf(e)==="talk")}
function actionEventsForCharacter(charId, source=state){return source.events.filter(e=>e.characterId===charId&&e.menuVisible!==false&&!dialogueAcquisitionEventComplete(e,source)&&isActionEvent(e))}
function entryEventsForCharacter(charId, source=state){return source.events.filter(e=>e.characterId===charId&&!dialogueAcquisitionEventComplete(e,source)&&isEntryEvent(e))}
function exitEventsForCharacter(charId, source=state){return source.events.filter(e=>e.characterId===charId&&!dialogueAcquisitionEventComplete(e,source)&&isExitEvent(e))}
function originIntroTextForCharacter(characterId,source=state){
  const origin=String(source.profile?.origin||"");
  if(!["sinner","hellborn","angel","winner"].includes(origin))return"";
  const direct=window.HV_ORIGIN_INTROS?.[characterId];
  if(direct?.[origin])return String(direct[origin]);
  const character=getCharacter(characterId,source);
  if(!character)return"";
  const wanted=String(character.name||"").toLowerCase().replace(/[^a-z0-9가-힣]+/g,"");
  const key=Object.keys(window.HV_ORIGIN_INTROS||{}).find(id=>{
    const known=getCharacter(id,source);
    return known&&String(known.name||"").toLowerCase().replace(/[^a-z0-9가-힣]+/g,"")===wanted;
  });
  return key&&window.HV_ORIGIN_INTROS[key]?.[origin]?String(window.HV_ORIGIN_INTROS[key][origin]):"";
}
function hasSeenOriginIntro(characterId,source=state){
  return (source.seenOriginIntroCharacterIds||[]).includes(characterId);
}
function markOriginIntroSeen(characterId,source=state){
  if(!characterId)return false;
  source.seenOriginIntroCharacterIds ||= [];
  if(source.seenOriginIntroCharacterIds.includes(characterId))return false;
  source.seenOriginIntroCharacterIds.push(characterId);
  return true;
}
function variableById(id,source=state){return source.variables.find(v=>v.id===id)||null}
function itemById(id,source=state){return source.items.find(i=>i.id===id)||null}
function itemEmoji(item){
  if(!item)return "🎁";
  return String(item.symbol||window.HV_ITEM_ARCHIVE_META?.[item.id]?.symbol||"🎁");
}
function itemGachaLine(item){
  if(!item)return "";
  return String(item.gachaLine||window.HV_ITEM_ARCHIVE_META?.[item.id]?.gachaLine||"");
}
function gachaProfileForCharacter(characterId,source=state){
  const character=getCharacter(characterId,source);
  const saved=source?.gacha?.profiles?.[characterId];
  const fallback=window.HV_GACHA_PROFILES?.[characterId];
  const profile=saved||fallback;
  if(profile)return{
    icon:String(profile.icon||fallback?.icon||"🎴"),
    title:String(profile.title||fallback?.title||(character?.name||"CHARACTER")+" GACHA"),
    description:String(profile.description||fallback?.description||"")
  };
  return character?{icon:"🎴",title:character.name+" GACHA",description:character.name+"의 컬렉션 아카이브."}:null;
}
function itemCount(id,source=state){return Math.max(0,Number(source.inventoryCounts?.[id])||0)}
function hasEverAcquired(id,source=state){
  return itemCount(id,source)>0 || (source.itemHistory||[]).some(h=>h?.itemId===id&&Number(h.amount)>0);
}
function giftReactionKey(itemId,characterId){return itemId+"::"+characterId}
function giftInteractionCount(itemId,characterId,source=state){
  return Math.max(0,Number(source.giftInteractionCounts?.[giftReactionKey(itemId,characterId)])||0);
}
function isGiftPreferenceDiscovered(itemId,characterId,source=state){
  return (source.discoveredGiftReactionKeys||[]).includes(giftReactionKey(itemId,characterId));
}
function discoverGiftPreference(itemId,characterId,source=state){
  source.discoveredGiftReactionKeys ||= [];
  const key=giftReactionKey(itemId,characterId);
  if(!source.discoveredGiftReactionKeys.includes(key))source.discoveredGiftReactionKeys.push(key);
}
function consumeInventoryItem(id,count=1,source=state){
  source.inventoryCounts ||= {};
  const current=itemCount(id,source);
  const next=Math.max(0,current-Math.max(1,Number(count)||1));
  source.inventoryCounts[id]=next;
  return next;
}
function itemLastAcquiredAt(id,source=state){
  for(let i=source.itemHistory.length-1;i>=0;i--){
    if(source.itemHistory[i]?.itemId===id)return Number(source.itemHistory[i].at)||0;
  }
  return 0;
}
function markItemSeen(id,source=state){
  source.newItemIds=(source.newItemIds||[]).filter(x=>x!==id);
}
function showItemAcquired(item,count,sourceType,isNew){
  const host=document.createElement("div");
  host.className="item-acquire-toast";
  host.innerHTML='<span class="item-acquire-kicker">'+esc(isNew?"NEW ITEM":"ITEM ACQUIRED")+'</span>'+
    '<strong>'+esc(itemEmoji(item))+' '+esc(item.name)+'</strong>'+
    '<small>'+esc(item.rarity)+' · '+esc(sourceType)+' · ×'+count+'</small>';
  document.body.appendChild(host);
  setTimeout(()=>host.classList.add("show"),20);
  setTimeout(()=>{host.classList.remove("show");setTimeout(()=>host.remove(),250)},2200);
}
function acquireItem(id,count=1,sourceType="BASIC",source=state,{notify=true}={}){
  const item=itemById(id,source);if(!item)return{count:itemCount(id,source),gained:0,isNew:false};
  source.inventoryCounts ||= {};
  source.newItemIds ||= [];
  source.itemHistory ||= [];
  const before=itemCount(id,source);
  const everBefore=hasEverAcquired(id,source);
  let gain=Math.max(0,Number(count)||0);
  if(item.acquisitionMode==="unique"){
    gain=everBefore?0:Math.min(1,gain);
  }
  const after=before+gain;
  source.inventoryCounts[id]=after;
  const isNew=!everBefore&&gain>0;
  if(isNew&&!source.newItemIds.includes(id))source.newItemIds.push(id);
  if(gain>0){
    source.itemHistory.push({
      id:uid("item-history"),itemId:id,source:String(sourceType||"BASIC").toUpperCase(),
      amount:gain,at:Date.now()
    });
    source.itemHistory=source.itemHistory.slice(-500);
    if(source===state){
      saveProgressState();
      if(notify)showItemAcquired(item,after,String(sourceType||"BASIC").toUpperCase(),isNew);
    }
  }
  return{count:after,gained:gain,isNew};
}
function addItem(id,count=1,source=state){
  return acquireItem(id,count,"BASIC",source,{notify:false}).count;
}
function asksForCharacter(charId,source=state){
  return source.asks.filter(a=>a.characterId===charId&&a.enabled);
}
function itemsForCharacter(charId,source=state){
  return source.items.filter(i=>i.enabled&&(i.collectionCharacterId===charId||i.reactions.some(r=>r.characterId===charId)));
}
function giftReactionFor(item,character){
  if(!item||!character)return null;
  const explicit=(item.reactions||[]).find(reaction=>reaction.characterId===character.id);
  if(explicit)return explicit;
  if(typeof window.HV_BUILD_ITEM_REACTION==="function"){
    return normalizeItemReaction(window.HV_BUILD_ITEM_REACTION(item,character),character.id);
  }
  return normalizeItemReaction({
    characterId:character.id,
    preference:"NEUTRAL",
    affectionDelta:0,
    firstEntries:[{type:"narration",text:character.name+"가 선물을 받아 든다."},{type:"dialogue",speakerCharacterId:character.id,speaker:character.name,text:"고마워. 잘 받아둘게."}],
    repeatEntries:[{type:"dialogue",speakerCharacterId:character.id,speaker:character.name,text:"또 챙겨왔네. 고마워."}]
  },character.id);
}
function flowHasItemGrant(entries,itemId){
  for(const entry of entries||[]){
    if((entry.itemEffects||[]).some(f=>f.itemId===itemId))return true;
    if(entry.type==="choice"){
      for(const option of entry.options||[]){
        if((option.itemEffects||[]).some(f=>f.itemId===itemId))return true;
        if(flowHasItemGrant(option.entries,itemId))return true;
      }
    }
  }
  return false;
}
function itemSourceTypes(item,source=state){
  const sources=[];
  if(item.gachaEnabled)sources.push("GACHA");
  let dialogue=Boolean(item.inventoryEventId&&source.events?.some(event=>event.id===item.inventoryEventId));
  for(const event of source.events||[])if(flowHasItemGrant(event.entries,item.id)){dialogue=true;break}
  if(!dialogue)for(const ask of source.asks||[])if(flowHasItemGrant(ask.entries,item.id)){dialogue=true;break}
  if(!dialogue){
    for(const it of source.items||[]){
      for(const reaction of it.reactions||[]){
        if(flowHasItemGrant(reaction.firstEntries,item.id)||flowHasItemGrant(reaction.repeatEntries,item.id)||flowHasItemGrant(reaction.specialEntries,item.id)){dialogue=true;break}
      }
      if(dialogue)break;
    }
  }
  if(dialogue)sources.push("DIALOGUE");
  return sources.length?sources:["BASIC"];
}
function itemSourceLabel(item,source=state){
  const s=itemSourceTypes(item,source);
  return s.includes("GACHA")&&s.includes("DIALOGUE")?"BOTH":s[0];
}
function collectionProgressForCharacter(characterId,source=state){
  const eligible=source.items.filter(i=>i.enabled&&i.collectionCharacterId===characterId&&(!i.secret||hasEverAcquired(i.id,source)));
  const acquired=eligible.filter(i=>hasEverAcquired(i.id,source)).length;
  const total=eligible.length;
  return {acquired,total,percent:total?Math.round(acquired/total*100):0};
}
function collectionOverallProgress(source=state){
  const eligible=source.items.filter(i=>i.enabled&&(!i.secret||hasEverAcquired(i.id,source)));
  const acquired=eligible.filter(i=>hasEverAcquired(i.id,source)).length;
  const total=eligible.length;
  return {acquired,total,percent:total?Math.round(acquired/total*100):0};
}



function conditionPasses(c){
  if(!c?.variableId)return true;
  const v=variableById(c.variableId); if(!v)return true;
  const cur=session.variables[v.id]??parseVariable(v,v.defaultValue);
  const exp=parseVariable(v,c.value);
  switch(c.operator){
    case"!=":return cur!==exp;case">":return Number(cur)>Number(exp);case">=":return Number(cur)>=Number(exp);
    case"<":return Number(cur)<Number(exp);case"<=":return Number(cur)<=Number(exp);
    case"truthy":return Boolean(cur);case"falsy":return !cur;default:return cur===exp;
  }
}
function itemConditionPasses(c){
  if(!c?.itemId)return true;
  const playbackSnapshot=playback?.inventoryCountSnapshot;
  const interactionSnapshot=activeInteractionEvent?.interactionMeta?.inventoryCountSnapshot;
  const snapshot=c.snapshot
    ? (playbackSnapshot&&typeof playbackSnapshot==="object"?playbackSnapshot:interactionSnapshot)
    : null;
  const x=snapshot&&typeof snapshot==="object"
    ? Math.max(0,Number(snapshot[c.itemId])||0)
    : itemCount(c.itemId);
  const y=Math.max(0,Number(c.value)||0);
  switch(c.operator){case">":return x>y;case"<":return x<y;case"<=":return x<=y;case"==":return x===y;case"!=":return x!==y;default:return x>=y}
}
function isAskUnlocked(ask,source=state){
  if(!ask)return false;
  return !ask.startLocked || (source.unlockedAskIds||[]).includes(ask.id);
}
function askAffectionRequirementPasses(ask,source=state){
  if(!ask)return false;
  if(ask.startLocked)return isAskUnlocked(ask,source);
  const ch=getCharacter(ask.characterId,source);if(!ch)return false;
  const affection=Number(session?.affection?.[ch.id]??ch.affectionStart);
  return affection>=Number(ask.minAffection||0);
}
function itemEffectClaimConditionPasses(c){
  if(!c?.effectId)return true;
  const effectId=String(c.effectId);
  const playbackSnapshot=playback?.itemEffectClaimSnapshot;
  const interactionSnapshot=activeInteractionEvent?.interactionMeta?.itemEffectClaimSnapshot;
  const snapshot=Array.isArray(playbackSnapshot)?playbackSnapshot:interactionSnapshot;
  const claimed=Array.isArray(snapshot)
    ? snapshot.includes(effectId)
    : (state.claimedItemEffectIds||[]).includes(effectId);
  return c.status==="claimed"?claimed:!claimed;
}
function askConditionPasses(c){
  if(!c?.askId)return true;
  const ask=state.asks.find(a=>a.id===c.askId);
  if(!ask)return true;
  const asked=(state.askedAskIds||[]).includes(ask.id);
  const unlocked=isAskUnlocked(ask);
  if(c.status==="not-asked")return !asked;
  if(c.status==="unlocked")return unlocked;
  if(c.status==="locked")return !unlocked;
  return asked;
}
function askUnlockPasses(ask){
  const ch=getCharacter(ask.characterId);
  const affection=ch?Number(session.affection[ch.id]??ch.affectionStart):0;
  return conditionPasses(ask.unlockCondition)
    && affection>=Number(ask.unlockMinAffection||0)
    && itemConditionPasses(ask.unlockItemCondition)
    && askConditionPasses(ask.unlockAskCondition)
    && emotionConditionPasses(ask.unlockEmotionCondition);
}
function syncAskUnlocks(characterId){
  state.unlockedAskIds ||= [];
  const newly=[];
  state.asks.filter(a=>a.enabled&&a.characterId===characterId&&a.startLocked).forEach(ask=>{
    if(!state.unlockedAskIds.includes(ask.id)&&askUnlockPasses(ask)){
      state.unlockedAskIds.push(ask.id);newly.push(ask);
    }
  });
  if(newly.length){
    saveProgressState();
    showToast(newly.length===1?"새 ASK가 해금되었습니다.":"새 ASK "+newly.length+"개가 해금되었습니다.");
  }
  return newly;
}
function recordInteraction(entry){
  state.interactionHistory ||= [];
  state.interactionHistory.push({id:uid("interaction"),at:Date.now(),...entry});
  state.interactionHistory=state.interactionHistory.slice(-500);
}
function completeInteraction(meta){
  if(!meta)return{};
  if(meta.interactionEffects)applyInteractionEffects(meta.interactionEffects);
  const result={newGiftPreference:false,newSpecialGift:false};
  if(meta.kind==="gift"&&meta.itemId&&meta.characterId){
    const key=giftReactionKey(meta.itemId,meta.characterId);
    const wasDiscovered=isGiftPreferenceDiscovered(meta.itemId,meta.characterId);
    state.discoveredSpecialGiftKeys ||= [];
    const wasSpecial=state.discoveredSpecialGiftKeys.includes(key);
    discoverGiftPreference(meta.itemId,meta.characterId);
    state.giftInteractionCounts ||= {};
    state.giftInteractionCounts[key]=giftInteractionCount(meta.itemId,meta.characterId)+1;
    if(meta.consume)consumeInventoryItem(meta.itemId,1,state);
    if(meta.flowType==="SPECIAL"&&!wasSpecial)state.discoveredSpecialGiftKeys.push(key);
    recordInteraction({
      kind:"gift",characterId:meta.characterId,itemId:meta.itemId,label:meta.label||"",
      preference:meta.preference||"NEUTRAL",flowType:meta.flowType||"REPEAT"
    });
    result.newGiftPreference=!wasDiscovered;
    result.newSpecialGift=meta.flowType==="SPECIAL"&&!wasSpecial;
  }
  if(meta.kind==="ask"&&meta.askId){
    state.askedAskIds ||= [];
    if(!state.askedAskIds.includes(meta.askId))state.askedAskIds.push(meta.askId);
    recordInteraction({kind:"ask",characterId:meta.characterId||"",askId:meta.askId,label:meta.label||""});
    syncAskUnlocks(meta.characterId);
  }
  saveProgressState();
  return result;
}
function affectionBandForValue(value){
  const n=clamp(value,0,100,0);
  if(n<20)return"COLD";
  if(n<40)return"DISTANT";
  if(n<60)return"NEUTRAL";
  if(n<80)return"WARM";
  return"CLOSE";
}
function affectionConditionPasses(c){
  if(!c?.characterId)return true;
  const ch=getCharacter(c.characterId);if(!ch)return true;
  const interactionMeta=activeInteractionEvent?.interactionMeta;
  const snapshot=interactionMeta?.kind==="ask"&&interactionMeta.characterId===ch.id
    ? Number(interactionMeta.affectionSnapshot)
    : NaN;
  const cur=Number.isFinite(snapshot)?snapshot:Number(session.affection[ch.id]??ch.affectionStart);
  if(c.band)return affectionBandForValue(cur)===c.band;
  if(Number.isFinite(Number(c.minValue))||Number.isFinite(Number(c.maxValue))){
    const min=Number.isFinite(Number(c.minValue))?Number(c.minValue):0;
    const max=Number.isFinite(Number(c.maxValue))?Number(c.maxValue):100;
    return cur>=min&&cur<=max;
  }
  const exp=Number(c.value)||0;
  switch(c.operator){case">":return cur>exp;case"<":return cur<exp;case"<=":return cur<=exp;case"==":return cur===exp;case"!=":return cur!==exp;default:return cur>=exp}
}
function emotionConditionPasses(c){
  if(!c?.characterId)return true;
  const ch=getCharacter(c.characterId);if(!ch)return true;
  const cur=session.emotions[ch.id]||{state:ch.emotionDefault,intensity:ch.emotionIntensity};
  if(c.state&&cur.state!==c.state)return false;
  const x=Number(cur.intensity)||0,y=Number(c.intensityValue)||0;
  switch(c.intensityOperator){case">":return x>y;case"<":return x<y;case"<=":return x<=y;case"==":return x===y;case"!=":return x!==y;default:return x>=y}
}
function ownerPasses(o){
  return conditionPasses(o?.condition)
    && itemConditionPasses(o?.itemCondition)
    && itemEffectClaimConditionPasses(o?.itemEffectClaimCondition)
    && askConditionPasses(o?.askCondition)
    && affectionConditionPasses(o?.affectionCondition)
    && emotionConditionPasses(o?.emotionCondition);
}
function applyEffects(arr){
  normalizeEffects(arr).forEach(f=>{
    const v=variableById(f.variableId);if(!v)return;
    const cur=session.variables[v.id]??parseVariable(v,v.defaultValue);
    const val=parseVariable(v,f.value);
    let next;
    if(f.operation==="add")next=Number(cur)+Number(val);
    else if(f.operation==="subtract")next=Number(cur)-Number(val);
    else if(f.operation==="toggle")next=!Boolean(cur);
    else next=val;
    if(v.type==="number"){
      if(Number.isFinite(Number(v.minValue)))next=Math.max(Number(v.minValue),Number(next));
      if(Number.isFinite(Number(v.maxValue)))next=Math.min(Number(v.maxValue),Number(next));
    }
    session.variables[v.id]=next;
  });
}
function applyAffectionEffects(arr){
  const messages=[];
  normalizeAffectionEffects(arr).forEach(f=>{
    const ch=getCharacter(f.characterId);if(!ch||!f.amount)return;
    state.claimedInteractionEffectIds ||= [];
    if(f.once&&state.claimedInteractionEffectIds.includes(f.id))return;
    const cur=Number(session.affection[ch.id]??ch.affectionStart);
    const next=clamp(cur+Number(f.amount),0,100,cur);
    const delta=next-cur;session.affection[ch.id]=next;
    if(delta&&!f.silent)messages.push(ch.name+" 호감도 "+(delta>0?"+":"")+delta);
    if(f.once)state.claimedInteractionEffectIds.push(f.id);
  });
  if(messages.length)showToast(messages.join(" · "));
}
function applyEmotionEffects(arr){
  const messages=[];
  normalizeEmotionEffects(arr).forEach(f=>{
    const ch=getCharacter(f.characterId);if(!ch)return;
    session.emotions[ch.id]={state:f.state,intensity:f.intensity};
    messages.push(ch.name+" 감정 → "+emotionLabel(f.state)+" "+f.intensity);
  });
  if(messages.length)showToast(messages.join(" · "));
}
function applyItemEffects(arr){
  normalizeItemEffects(arr).forEach(f=>{
    if(!f.itemId)return;
    state.claimedItemEffectIds ||= [];
    if(f.once&&state.claimedItemEffectIds.includes(f.id))return;
    const result=acquireItem(f.itemId,f.amount,"DIALOGUE",state,{notify:true});
    if(f.once&&(result.gained>0||itemById(f.itemId)?.acquisitionMode==="unique")){
      state.claimedItemEffectIds.push(f.id);
    }
  });
}
function applyOwnerEffects(o){
  applyEffects(o.effects);
  applyItemEffects(o.itemEffects);
  applyAffectionEffects(o.affectionEffects);
  applyEmotionEffects(o.emotionEffects);
  saveProgressState();
}
function applyInteractionEffects(source){
  const ch=getCharacter(source.characterId);if(!ch)return;
  const claimId=String(source.claimId||"");
  state.claimedInteractionEffectIds ||= [];
  if(source.once&&claimId&&state.claimedInteractionEffectIds.includes(claimId))return;
  const messages=[];
  const delta=clamp(source.affectionDelta,-100,100,0);
  if(delta){
    const current=Number(session.affection[ch.id]??ch.affectionStart);
    const next=clamp(current+delta,0,100,current);
    const applied=next-current;
    session.affection[ch.id]=next;
    if(applied)messages.push(ch.name+" 호감도 "+(applied>0?"+":"")+applied);
  }
  if(source.emotionState){
    const intensity=clamp(source.emotionIntensity,0,100,0);
    session.emotions[ch.id]={state:source.emotionState,intensity};
    messages.push(ch.name+" 감정 → "+emotionLabel(source.emotionState)+" "+intensity);
  }
  if(source.once&&claimId)state.claimedInteractionEffectIds.push(claimId);
  if(messages.length)showToast(messages.join(" · "));
  saveProgressState();
}
function beginInteractionReaction(kind,source,entries,label="",meta={}){
  const ch=getCharacter(source.characterId);if(!ch)return;
  const interactionMeta={
    kind,characterId:ch.id,label:label||"",
    itemEffectClaimSnapshot:[...(state.claimedItemEffectIds||[])],
    inventoryCountSnapshot:{...(state.inventoryCounts||{})},
    interactionEffects:{
      characterId:ch.id,
      affectionDelta:clamp(source.affectionDelta,-100,100,0),
      emotionState:source.emotionState||"",
      emotionIntensity:clamp(source.emotionIntensity,0,100,0),
      once:false,
      claimId:""
    },
    ...meta
  };
  if(!interactionContext){
    interactionContext={
      playback:playback ? clone(playback) : null,
      selectedCharacterId,
      typing:{token:typing.token||"",full:typing.full||"",index:(typing.full||"").length,done:true,timer:null},
      followupActive:true,
      completionMeta:interactionMeta
    };
  }else interactionContext.completionMeta=interactionMeta;
  clearTyping();clearAuto();autoMode=false;
  activeInteractionReaction=null;
  activeInteractionEvent={
    id:"__interaction__"+uid("flow"),
    name:(kind==="ask"?"ASK · ":"ITEM · ")+(label||"INTERACTION"),
    interactionMeta,
    characterId:ch.id,
    continuationEventIds:[],
    emotionExitMode:"keep",
    entries:Array.isArray(entries)&&entries.length?entries:[normalizeEntry({
      type:"narration",
      text:"별다른 반응은 없었다.",
      condition:null,effects:[],affectionCondition:null,affectionEffects:[],emotionCondition:null,emotionEffects:[]
    })]
  };
  selectedCharacterId=ch.id;
  roomMode="talk";
  playback={
    characterId:ch.id,
    roomCharacterId:ch.id,
    eventId:activeInteractionEvent.id,
    itemEffectClaimSnapshot:[...(interactionMeta.itemEffectClaimSnapshot||state.claimedItemEffectIds||[])],
    inventoryCountSnapshot:{...(interactionMeta.inventoryCountSnapshot||state.inventoryCounts||{})},
    frames:[{sourceType:"event",sourceId:activeInteractionEvent.id,index:0,label:kind.toUpperCase(),exitMode:"continue",targetEventId:""}],
    ended:false
  };
  typing={token:"",full:"",index:0,done:true,timer:null};
  renderRoom();
}
function renderInteractionReaction(){
  const dynamic=$("#roomDynamic");if(!dynamic||!activeInteractionReaction)return;
  const ch=getCharacter(activeInteractionReaction.characterId);
  const speaker=activeInteractionReaction.type==="narration"?"NARRATION":(ch?.name||"UNKNOWN");
  const text=activeInteractionReaction.text || (activeInteractionReaction.type==="narration"?"아무 일도 일어나지 않았다.":"...");
  dynamic.innerHTML='<div class="dialogue-box interaction-reaction"><p class="speaker">'+esc(speaker)+'</p><p class="dialogue-text">'+esc(text)+'</p><div class="dialogue-meta"><span>INTERRUPT · '+esc(activeInteractionReaction.kind.toUpperCase())+' · '+esc(activeInteractionReaction.label)+'</span><button type="button" data-action="finish-interaction">NEXT</button></div></div>';
}
function finishInteractionReaction(){
  const reaction=activeInteractionReaction;if(!reaction)return;
  activeInteractionReaction=null;
  if(reaction.followEventId&&getEvent(reaction.followEventId)){
    startInteractionFollowEvent(reaction.followEventId);
    return;
  }
  restoreInterruptedDialogue();
  renderRoom();
}
function startInteractionFollowEvent(eventId){
  const ev=getEvent(eventId);
  if(!ev){restoreInterruptedDialogue();renderRoom();return}
  interactionContext ||= {
    playback:playback ? clone(playback) : null,
    selectedCharacterId,
    typing:{token:"",full:"",index:0,done:true,timer:null},
    followupActive:false
  };
  interactionContext.followupActive=true;
  selectedCharacterId=ev.characterId||selectedCharacterId;
  roomMode="talk";
  playback={
    characterId:selectedCharacterId,
    eventId:ev.id,
    itemEffectClaimSnapshot:[...(interactionContext?.completionMeta?.itemEffectClaimSnapshot||state.claimedItemEffectIds||[])],
    inventoryCountSnapshot:{...(interactionContext?.completionMeta?.inventoryCountSnapshot||state.inventoryCounts||{})},
    continuationQueue:[...(ev.continuationEventIds||[])],
    continuationTotal:(ev.continuationEventIds||[]).length,
    frames:[{sourceType:"event",sourceId:ev.id,index:0,label:"상호작용",exitMode:"continue",targetEventId:""}],
    ended:false
  };
  typing={token:"",full:"",index:0,done:true,timer:null};
  renderRoom();
}
function restoreInterruptedDialogue(){
  if(!interactionContext)return false;
  clearTyping();clearAuto();
  const saved=interactionContext;
  interactionContext=null;
  activeInteractionReaction=null;
  activeInteractionEvent=null;
  selectedCharacterId=saved.selectedCharacterId||selectedCharacterId;
  playback=saved.playback ? clone(saved.playback) : null;
  typing={
    token:saved.typing?.token||"",
    full:saved.typing?.full||"",
    index:(saved.typing?.full||"").length,
    done:true,
    timer:null
  };
  roomMode="talk";
  return true;
}
function resetEventEmotion(event){
  if(event?.emotionExitMode!=="reset")return;
  const ch=getCharacter(event.characterId);
  if(ch){
    session.emotions[ch.id]={state:ch.emotionDefault,intensity:ch.emotionIntensity};
    saveProgressState();
  }
}

function makeEntry(type){
  const common={id:uid("entry"),condition:null,effects:[],itemCondition:null,itemEffectClaimCondition:null,askCondition:null,itemEffects:[],affectionCondition:null,affectionEffects:[],emotionCondition:null,emotionEffects:[]};
  if(type==="narration")return{...common,type,text:""};
  if(type==="choice")return{...common,type,prompt:"",options:[makeOption("선택지 1"),makeOption("선택지 2")]};
  return{...common,type:"dialogue",speaker:"",speakerCharacterId:"",text:""};
}
function makeOption(label){
  return{id:uid("option"),label,tone:"neutral",entries:[],condition:null,effects:[],itemCondition:null,itemEffectClaimCondition:null,askCondition:null,itemEffects:[],affectionCondition:null,affectionEffects:[],emotionCondition:null,emotionEffects:[],exitMode:"continue",targetEventId:""};
}
function regenerateIds(entry){
  entry.id=uid("entry");
  entry.effects=normalizeEffects(entry.effects).map(x=>({...x,id:uid("fx")}));
  entry.itemEffects=normalizeItemEffects(entry.itemEffects).map(x=>({...x,id:uid("itemfx")}));
  entry.affectionEffects=normalizeAffectionEffects(entry.affectionEffects).map(x=>({...x,id:uid("afx")}));
  entry.emotionEffects=normalizeEmotionEffects(entry.emotionEffects).map(x=>({...x,id:uid("efx")}));
  if(entry.type==="choice")entry.options.forEach(o=>{
    o.id=uid("option");
    o.effects=normalizeEffects(o.effects).map(x=>({...x,id:uid("fx")}));
    o.itemEffects=normalizeItemEffects(o.itemEffects).map(x=>({...x,id:uid("itemfx")}));
    o.affectionEffects=normalizeAffectionEffects(o.affectionEffects).map(x=>({...x,id:uid("afx")}));
    o.emotionEffects=normalizeEmotionEffects(o.emotionEffects).map(x=>({...x,id:uid("efx")}));
    o.entries.forEach(regenerateIds);
  });
}


session=createSession();
