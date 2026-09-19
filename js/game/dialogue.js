"use strict";
function startDialogue(characterId,eventId){
  const ch=getCharacter(characterId);if(!ch)return;
  selectedCharacterId=ch.id;
  roomToolsOpen=false;
  roomMode="talk";
  activeInteractionReaction=null;
  activeInteractionEvent=null;
  interactionContext=null;
  const ev=eventId?getEvent(eventId):eventsForCharacter(ch.id)[0];
  playback=ev?{
    characterId:ch.id,eventId:ev.id,
    frames:[{sourceType:"event",sourceId:ev.id,index:0,label:"본편",exitMode:"continue",targetEventId:""}],
    ended:false
  }:null;
  typing.token="";
  autoMode=false;clearTimeout(autoTimer);
  currentPage="room";renderNav();renderRoom();
}
function currentEvent(){return playback?getEvent(playback.eventId):null}
function findOptionGlobal(optionId){
  function scan(entries){
    for(const e of entries){
      if(e.type!=="choice")continue;
      for(const o of e.options){
        if(o.id===optionId)return o;
        const n=scan(o.entries);if(n)return n;
      }
    }
    return null;
  }
  if(activeInteractionEvent){
    const f=scan(activeInteractionEvent.entries);
    if(f)return f;
  }
  for(const ev of state.events){const f=scan(ev.entries);if(f)return f}
  return null;
}
function frameEntries(frame){
  if(!frame)return[];
  if(frame.sourceType==="option")return findOptionGlobal(frame.sourceId)?.entries||[];
  return getEvent(frame.sourceId)?.entries||[];
}
function visibleOptions(entry){return entry.options.filter(ownerPasses)}
function jumpEvent(id){
  const departing=currentEvent();const ev=getEvent(id);
  if(!ev){if(playback)playback.ended=true;return}
  resetEventEmotion(departing);
  playback.eventId=ev.id;playback.characterId=ev.characterId||playback.characterId;
  playback.frames=[{sourceType:"event",sourceId:ev.id,index:0,label:"본편",exitMode:"continue",targetEventId:""}];
  playback.ended=false;typing.token="";
}
function finishEvent(){
  const ev=currentEvent();
  if(activeInteractionEvent&&ev?.id===activeInteractionEvent.id){
    completeInteraction(activeInteractionEvent.interactionMeta);
    restoreInterruptedDialogue();
    return true;
  }
  if(ev?.nextEventId&&getEvent(ev.nextEventId)){jumpEvent(ev.nextEventId);return true}
  resetEventEmotion(ev);
  if(interactionContext?.followupActive){
    restoreInterruptedDialogue();
    return true;
  }
  if(playback)playback.ended=true;
  return false;
}
function settlePlayback(){
  if(!playback||playback.ended)return false;
  let guard=0;
  while(guard++<1000){
    const frame=playback.frames.at(-1);if(!frame){playback.ended=true;return false}
    const entries=frameEntries(frame);
    if(frame.index>=entries.length){
      if(frame.sourceType==="option"){
        playback.frames.pop();
        if(frame.targetEventId){jumpEvent(frame.targetEventId);continue}
        if(frame.exitMode==="end"){finishEvent();continue}
        continue;
      }
      if(finishEvent())continue;
      return false;
    }
    const entry=entries[frame.index];
    if(!ownerPasses(entry)){frame.index++;continue}
    if(entry.type==="choice"&&!visibleOptions(entry).length){frame.index++;continue}
    return true;
  }
  playback.ended=true;return false;
}
function clearTyping(){if(typing.timer)clearInterval(typing.timer);typing.timer=null}
function clearAuto(){clearTimeout(autoTimer);autoTimer=null}
function scheduleAuto(){
  clearAuto();
  if(!autoMode||!typing.done||!playback||playback.ended)return;
  const frame=playback.frames.at(-1),entry=frameEntries(frame)[frame?.index];
  if(!entry||entry.type==="choice")return;
  autoTimer=setTimeout(()=>advanceDialogue(true),prefs.autoDelay);
}
function startTyping(text,token){
  clearTyping();clearAuto();
  typing={token,full:text||"",index:0,done:false,timer:null};
  const target=$("#dialogueText");
  if(!target)return;
  if(prefs.textSpeed===0||!text){typing.done=true;target.textContent=text||"";scheduleAuto();return}
  target.textContent="";
  typing.timer=setInterval(()=>{
    typing.index++;target.textContent=typing.full.slice(0,typing.index);
    if(typing.index>=typing.full.length){clearTyping();typing.done=true;scheduleAuto()}
  },prefs.textSpeed);
}
function renderRoom(){
  const ch=getCharacter(selectedCharacterId);
  if(!ch){setPage("home");return}
  const ev=currentEvent();
  const art=ch.image?'<img src="'+esc(ch.image)+'" alt="'+esc(ch.name)+'" />':'<div class="silhouette">'+esc(ch.name.slice(0,2).toUpperCase())+'</div>';
  const eventOptions=eventsForCharacter(ch.id);
  const interactionLocked=Boolean(activeInteractionReaction||interactionContext?.followupActive);

  pageRoot.innerHTML=
    '<section class="room-page"><div class="room-hud"><button class="text-link" type="button" data-action="back-home">← HOME</button><strong>'+esc(ch.name)+'</strong>'+
    '<div class="room-mode-bar"><button class="room-mode-button '+(roomMode==="talk"?"active":"")+'" type="button" data-action="room-mode" data-mode="talk" '+(interactionLocked?"disabled":"")+'>TALK</button>'+
    '<button class="room-mode-button '+(roomMode==="ask"?"active":"")+'" type="button" data-action="room-mode" data-mode="ask" '+(interactionLocked?"disabled":"")+'>ASK</button>'+
    '<button class="room-mode-button '+(roomMode==="inventory"?"active":"")+'" type="button" data-action="room-mode" data-mode="inventory" '+(interactionLocked?"disabled":"")+'>INVENTORY</button></div>'+
    (roomMode==="talk"&&eventOptions.length&&!interactionLocked?'<select id="roomEventSelect" style="width:auto;min-width:190px">'+eventOptions.map(e=>'<option value="'+esc(e.id)+'" '+(ev?.id===e.id?"selected":"")+'>'+esc(e.name)+'</option>').join("")+'</select>':'')+
    '<button class="room-more-button" type="button" data-action="toggle-room-tools" aria-label="추가 메뉴">•••</button><div class="room-actions '+(roomToolsOpen?"open":"")+'"><button class="text-link" type="button" data-action="show-log">LOG</button><button class="text-link" type="button" data-action="show-history">HISTORY</button><button class="text-link" type="button" data-action="show-affection">AFFECTION</button><button class="text-link" type="button" data-action="show-emotion">EMOTION</button><button class="text-link mobile-set" type="button" data-action="open-play-settings">SET</button></div></div>'+
    '<div class="room-stage"><div class="room-art">'+art+'</div><div id="roomDynamic"></div>'+
    (roomMode==="talk"&&!activeInteractionReaction?'<div class="room-control-bar"><button type="button" data-action="toggle-auto" class="'+(autoMode?"active":"")+'">AUTO</button><button type="button" data-action="open-play-settings">SET</button></div>':'')+
    '</div></section>';

  if(activeInteractionReaction)renderInteractionReaction();
  else if(roomMode==="ask")renderAskPanel();
  else if(roomMode==="inventory")renderInventoryPanel();
  else renderRoomBeat();
}
function renderRoomBeat(){
  if(roomMode!=="talk")return;
  if(playback?.characterId && playback.characterId!==selectedCharacterId){
    selectedCharacterId=playback.characterId;
    renderRoom();
    return;
  }
  const dynamic=$("#roomDynamic");if(!dynamic)return;
  if(!playback){
    dynamic.innerHTML='<div class="room-empty"><h2>등록된 이벤트가 없습니다.</h2><p>편집기에서 이 캐릭터의 이벤트를 추가하세요.</p></div>';return;
  }
  if(!settlePlayback()){
    dynamic.innerHTML='<div class="room-empty"><h2>이벤트가 끝났습니다.</h2><p>다른 이벤트를 선택하거나 ASK / INVENTORY를 이용할 수 있습니다.</p></div>';clearTyping();clearAuto();return;
  }
  const frame=playback.frames.at(-1),entry=frameEntries(frame)[frame.index];
  if(entry.type==="choice"){
    clearTyping();clearAuto();
    const opts=visibleOptions(entry);
    dynamic.innerHTML='<div class="choice-box"><p class="page-kicker">CHOICE</p><h2>'+esc(entry.prompt||"무엇을 선택할까?")+'</h2><div class="choice-list">'+opts.map(o=>'<button class="choice-option" type="button" data-action="choose-option" data-id="'+esc(o.id)+'">'+esc(o.label||"이름 없는 선택지")+'</button>').join("")+'</div></div>';
    return;
  }
  const token=playback.eventId+"|"+playback.frames.map(f=>f.sourceId+":"+f.index).join("|")+"|"+entry.id;
  const speaker=entry.type==="narration"?"":(entry.speaker||chName(playback.characterId));
  dynamic.innerHTML='<div class="dialogue-box"><p class="speaker">'+esc(entry.type==="narration"?"NARRATION":speaker)+'</p><p id="dialogueText" class="dialogue-text"></p><div class="dialogue-meta"><span>'+esc(frame.label)+' · '+(frame.index+1)+' / '+frameEntries(frame).length+'</span><button type="button" data-action="advance-dialogue">NEXT</button></div></div>';
  if(typing.token!==token){
    session.log.push({kind:entry.type,speaker,text:entry.text||"",eventName:currentEvent()?.name||""});
    if(session.log.length>200)session.log.splice(0,session.log.length-200);
    saveState();
    startTyping(entry.text||"",token);
  }else{
    $("#dialogueText").textContent=typing.done?typing.full:typing.full.slice(0,typing.index);
    scheduleAuto();
  }
}

function renderAskPanel(){
  if(!typing.done){
    clearTyping();
    typing.index=typing.full.length;
    typing.done=true;
  }
  clearAuto();
  const dynamic=$("#roomDynamic");if(!dynamic)return;
  const ch=getCharacter(selectedCharacterId);if(!ch)return;
  syncAskUnlocks(ch.id);
  const affection=Number(session.affection[ch.id]??ch.affectionStart);
  const asks=asksForCharacter(ch.id);
  dynamic.innerHTML='<section class="ask-panel"><div class="inventory-character-head"><div><p class="page-kicker">ASK</p><h2>대화 중 무엇을 물어볼까?</h2></div><p>LOCKED → NEW → ASKED</p></div><div class="ask-list">'+
    (asks.length?asks.map(a=>{
      const unlocked=isAskUnlocked(a);
      const asked=(state.askedAskIds||[]).includes(a.id);
      const available=unlocked&&affection>=a.minAffection;
      const status=!unlocked?"LOCKED":asked?"ASKED":"NEW";
      const label=unlocked?a.label:"???";
      return '<button class="ask-entry '+status.toLowerCase()+'" type="button" data-action="ask-topic" data-id="'+esc(a.id)+'" '+(!available?"disabled":"")+'><span>'+esc(label)+'</span><small>'+status+(unlocked&&!available?' · 호감도 '+a.minAffection:'')+'</small></button>';
    }).join(""):'<div class="editor-note">등록된 질문이 없습니다.</div>')+
    '</div></section>';
}
function startAsk(id){
  const ask=state.asks.find(a=>a.id===id&&a.enabled);if(!ask)return;
  const ch=getCharacter(ask.characterId);if(!ch||selectedCharacterId!==ch.id)return;
  syncAskUnlocks(ch.id);
  if(!isAskUnlocked(ask)){showToast("아직 해금되지 않은 질문입니다.");return}
  const affection=Number(session.affection[ch.id]??ch.affectionStart);
  if(affection<ask.minAffection){showToast("아직 물어볼 수 없습니다.");return}
  beginInteractionReaction("ask",ask,ask.entries,ask.label,{askId:ask.id});
}
function renderInventoryPanel(){
  if(!typing.done){
    clearTyping();
    typing.index=typing.full.length;
    typing.done=true;
  }
  clearAuto();
  const dynamic=$("#roomDynamic");if(!dynamic)return;
  const ch=getCharacter(selectedCharacterId);if(!ch)return;
  const items=state.items.filter(i=>i.enabled&&i.giftable!==false&&itemCount(i.id)>0);
  dynamic.innerHTML='<section class="inventory-panel"><div class="inventory-character-head"><div><p class="page-kicker">INVENTORY</p><h2>GIVE ITEM</h2></div><p>'+esc(ch.name)+'에게 보유 아이템을 건넬 수 있습니다.</p></div><div class="inventory-list">'+
    (items.length?items.map(i=>{
      const reaction=i.reactions.find(r=>r.characterId===ch.id);
      const discovered=isGiftPreferenceDiscovered(i.id,ch.id);
      const reactionLabel=discovered?(reaction?reaction.preference:"NO SPECIAL REACTION"):"???";
      return '<button class="inventory-entry" type="button" data-action="inventory-item" data-id="'+esc(i.id)+'"><span><b>'+esc(i.name)+'</b><small>'+esc(i.rarity)+' · '+esc(i.category)+' · '+esc(reactionLabel)+' · '+esc(i.giftUseMode.toUpperCase())+'</small></span><span class="count">GIVE · ×'+itemCount(i.id)+'</span></button>';
    }).join(""):'<div class="editor-note">보유 아이템이 없습니다.</div>')+
    '</div></section>';
}
function useInventoryItem(id){
  const item=itemById(id);if(!item||itemCount(id)<=0)return;
  const ch=getCharacter(selectedCharacterId);if(!ch)return;
  const key=giftReactionKey(item.id,ch.id);
  const reaction=item.reactions.find(r=>r.characterId===ch.id) || normalizeItemReaction({
    characterId:ch.id,
    preference:"NEUTRAL",
    affectionDelta:0,
    firstEntries:[normalizeEntry({type:"narration",text:"상대는 아이템을 받아 들였지만 특별한 반응은 보이지 않았다."})],
    repeatEntries:[normalizeEntry({type:"narration",text:"상대는 익숙한 듯 아이템을 받아 들었다."})]
  },ch.id);

  const currentCount=giftInteractionCount(item.id,ch.id);
  const emotion=session.emotions[ch.id]||{state:ch.emotionDefault,intensity:ch.emotionIntensity};
  const affection=Number(session.affection[ch.id]??ch.affectionStart);
  const hasSpecialRule=Number(reaction.specialMinAffection)>0||Boolean(reaction.specialEmotionState);
  const specialPass=hasSpecialRule
    && affection>=Number(reaction.specialMinAffection||0)
    && (!reaction.specialEmotionState||(emotion.state===reaction.specialEmotionState&&emotion.intensity>=Number(reaction.specialEmotionIntensity||0)))
    && reaction.specialEntries.length>0;

  let flowType=specialPass?"SPECIAL":currentCount===0?"FIRST":"REPEAT";
  let entries=specialPass?reaction.specialEntries:(currentCount===0?reaction.firstEntries:reaction.repeatEntries);
  if(!entries?.length)entries=reaction.firstEntries?.length?reaction.firstEntries:reaction.repeatEntries;

  discoverGiftPreference(item.id,ch.id);
  state.giftInteractionCounts ||= {};
  state.giftInteractionCounts[key]=currentCount+1;
  if(item.giftUseMode==="consume")consumeInventoryItem(item.id,1,state);
  recordInteraction({kind:"gift",characterId:ch.id,itemId:item.id,label:item.name,preference:reaction.preference,flowType});
  saveState();

  beginInteractionReaction("item",reaction,entries,item.name,{itemId:item.id,preference:reaction.preference,flowType});
}
function chName(id){return getCharacter(id)?.name||"UNKNOWN"}
function advanceDialogue(fromAuto=false){
  if(!playback||playback.ended)return;
  const frame=playback.frames.at(-1),entry=frameEntries(frame)[frame.index];
  if(!entry||entry.type==="choice")return;
  if(!typing.done&&!fromAuto){typing.index=typing.full.length;typing.done=true;clearTyping();$("#dialogueText").textContent=typing.full;scheduleAuto();return}
  clearAuto();applyOwnerEffects(entry);frame.index++;typing.token="";renderRoomBeat();
}
function chooseOption(id){
  if(!playback)return;
  const frame=playback.frames.at(-1),entry=frameEntries(frame)[frame.index];
  if(!entry||entry.type!=="choice")return;
  const option=entry.options.find(o=>o.id===id);if(!option||!ownerPasses(option))return;
  applyOwnerEffects(entry);applyOwnerEffects(option);
  session.log.push({kind:"choice",speaker:"CHOICE",text:(entry.prompt||"선택")+" → "+(option.label||""),eventName:currentEvent()?.name||""});
  if(session.log.length>200)session.log.splice(0,session.log.length-200);
  saveState();
  frame.index++;
  if(option.entries.length){
    playback.frames.push({sourceType:"option",sourceId:option.id,index:0,label:option.label||"분기",exitMode:option.exitMode,targetEventId:option.targetEventId||""});
  }else if(option.targetEventId)jumpEvent(option.targetEventId);
  else if(option.exitMode==="end")finishEvent();
  typing.token="";renderRoomBeat();
}

function showAffection(){
  const chars=enabledCharacters();
  openModal("AFFECTION",'<div class="status-list">'+(chars.length?chars.map(c=>{
    const v=clamp(session.affection[c.id]??c.affectionStart,0,100,0);
    return '<div class="status-card"><div class="status-head"><strong>'+esc(c.name)+'</strong><span>'+v+' / 100</span></div><div class="status-track"><div class="status-fill" style="width:'+v+'%"></div></div></div>';
  }).join(""):'<p class="muted">등록된 캐릭터가 없습니다.</p>')+'</div>');
}
function showEmotion(){
  const chars=enabledCharacters();
  openModal("EMOTION",'<div class="status-list">'+(chars.length?chars.map(c=>{
    const v=session.emotions[c.id]||{state:c.emotionDefault,intensity:c.emotionIntensity};
    return '<div class="status-card"><div class="status-head"><strong>'+esc(c.name)+'</strong><span>'+esc(emotionLabel(v.state))+'</span></div><div class="status-track"><div class="status-fill" style="width:'+v.intensity+'%"></div></div><small class="muted">강도 '+v.intensity+' / 100</small></div>';
  }).join(""):'<p class="muted">등록된 캐릭터가 없습니다.</p>')+'</div>');
}
function showLog(){
  openModal("DIALOGUE LOG",'<div class="log-list">'+(session.log.length?session.log.slice().reverse().map(x=>'<article class="log-row"><small>'+esc(x.eventName)+(x.speaker?' · '+esc(x.speaker):'')+'</small><p>'+esc(x.text)+'</p></article>').join(""):'<p class="muted">아직 기록이 없습니다.</p>')+'</div>');
}
function showInteractionHistory(){
  const rows=(state.interactionHistory||[]).slice().reverse();
  openModal("INTERACTION HISTORY",'<div class="interaction-history-list">'+(rows.length?rows.map(h=>{
    const ch=getCharacter(h.characterId);
    const title=h.kind==="gift"?"GIFT · "+(h.label||itemById(h.itemId)?.name||"ITEM"):"ASK · "+(h.label||state.asks.find(a=>a.id===h.askId)?.label||"QUESTION");
    const detail=h.kind==="gift"?(h.preference||"")+" · "+(h.flowType||""):"ASKED";
    return '<article class="interaction-history-row"><div><small>'+esc(new Date(h.at).toLocaleString("ko-KR"))+'</small><strong>'+esc(title)+'</strong></div><div><span>'+esc(ch?.name||"UNKNOWN")+'</span><b>'+esc(detail)+'</b></div></article>';
  }).join(""):'<p class="muted">아직 ASK나 선물 기록이 없습니다.</p>')+'</div>');
}

function showPlaySettings(){
  openModal("PLAY SETTINGS",'<div class="settings-grid"><label class="field"><span>텍스트 속도</span><input id="prefTextSpeed" type="range" min="0" max="80" step="1" value="'+prefs.textSpeed+'"></label><label class="field"><span>AUTO 대기</span><input id="prefAutoDelay" type="range" min="250" max="3000" step="50" value="'+prefs.autoDelay+'"></label><label class="checkline"><input id="prefStageClick" type="checkbox" '+(prefs.stageClick?"checked":"")+'> 대화 영역 클릭으로 진행</label></div>');
}
function randomThought(){
  const ch=getCharacter(selectedCharacterId);if(!ch)return;
  const candidates=state.thoughts.filter(t=>t.enabled&&t.characterId===ch.id);
  if(!candidates.length){showToast("등록된 Thought가 없습니다.");return}
  const weight={common:8,normal:4,rare:1};
  const total=candidates.reduce((s,t)=>s+(weight[t.frequency]||1),0);
  let roll=Math.random()*total,chosen=candidates[0];
  for(const t of candidates){roll-=weight[t.frequency]||1;if(roll<=0){chosen=t;break}}
  if(!state.discoveredThoughtIds.includes(chosen.id))state.discoveredThoughtIds.push(chosen.id);
  saveState();
  openModal(ch.name+" · THOUGHT",'<p class="label">'+esc(chosen.category)+' · '+esc(chosen.frequency.toUpperCase())+'</p><p style="white-space:pre-wrap;line-height:1.8;font-family:Georgia,serif;font-size:1.2rem">'+esc(chosen.text)+'</p>');
}
function chooseWeighted(items,getWeight){
  const total=items.reduce((s,x)=>s+Math.max(0,Number(getWeight(x))||0),0);
  if(total<=0)return items[Math.floor(Math.random()*items.length)];
  let roll=Math.random()*total;
  for(const item of items){roll-=Math.max(0,Number(getWeight(item))||0);if(roll<=0)return item}
  return items.at(-1);
}
function playGachaAnimation(results){
  const stage=$(".gacha-stage",pageRoot);
  const box=$("#gachaResult");
  if(!stage||!box){gachaAnimating=false;return}
  stage.classList.add("is-drawing");
  box.innerHTML='<div class="gacha-summon"><span class="gacha-sigil">✦</span><b>SUMMONING</b><small>ARCHIVE LINK</small></div>';
  setTimeout(()=>{
    stage.classList.add("is-reveal");
    box.innerHTML=results.map((result,index)=>{
      const i=result.item;
      return '<div class="gacha-result-card gacha-reveal-card rarity-'+esc(i.rarity)+' '+(result.isNew?"is-new":"")+'" style="animation-delay:'+(index*80)+'ms">'+
        (result.isNew?'<span class="gacha-new-badge">NEW</span>':'')+
        '<span>'+esc(i.rarity)+'</span><strong>'+esc(i.name)+'</strong>'+
        '<small>'+esc(getCharacter(i.collectionCharacterId)?.name||"UNASSIGNED")+' · ×'+result.count+'</small></div>';
    }).join("");
    setTimeout(()=>{
      gachaAnimating=false;
      stage.classList.remove("is-drawing","is-reveal");
      $$(".draw-actions button",pageRoot).forEach(button=>button.disabled=false);
    },Math.max(900,results.length*80+600));
  },650);
}
function clearGachaHistory(){
  state.gacha.history=[];
  saveState();
  renderGacha();
  showToast("가챠 RECENT 기록을 비웠습니다.");
}
function drawGacha(count){
  if(gachaAnimating)return;
  const initialPool=state.items.filter(i=>i.enabled&&i.gachaEnabled&&(i.acquisitionMode!=="unique"||!hasEverAcquired(i.id)));
  if(!initialPool.length){showToast("현재 뽑을 수 있는 가챠 아이템이 없습니다.");return}
  if(count===10&&!initialPool.some(i=>i.acquisitionMode==="repeatable")&&initialPool.length<10){
    showToast("10회 뽑기에 필요한 획득 가능 아이템이 부족합니다.");
    return;
  }
  const cost=count===10?state.gacha.tenCost:state.gacha.singleCost;
  if(state.gacha.balance<cost){showToast(state.gacha.currencyName+"이 부족합니다.");return}
  state.gacha.balance-=cost;
  const results=[];

  for(let n=0;n<count;n++){
    const pool=state.items.filter(i=>i.enabled&&i.gachaEnabled&&(i.acquisitionMode!=="unique"||!hasEverAcquired(i.id)));
    if(!pool.length)break;
    const represented=RARITIES.filter(r=>pool.some(x=>x.rarity===r));
    const weighted=represented.filter(r=>Number(state.gacha.rarityWeights[r]||0)>0);
    const rarities=weighted.length?weighted:represented;
    const rarity=chooseWeighted(rarities,r=>weighted.length?state.gacha.rarityWeights[r]:1)||rarities[0];
    const candidates=pool.filter(x=>x.rarity===rarity);
    const item=chooseWeighted(candidates,x=>x.weight);
    if(!item)continue;
    const acquired=acquireItem(item.id,1,"GACHA",state,{notify:false});
    if(!acquired.gained)continue;
    results.push({item,isNew:acquired.isNew,count:acquired.count});
    state.gacha.history.push({name:item.name,rarity:item.rarity,itemId:item.id,at:Date.now()});
  }

  state.gacha.history=state.gacha.history.slice(-50);
  saveState();
  if(!results.length){showToast("획득 가능한 아이템이 없습니다.");renderGacha();return}
  gachaAnimating=true;
  renderGacha();
  playGachaAnimation(results);
}
function collectionDetail(id){
  const i=itemById(id);if(!i)return;
  const count=itemCount(i.id),unlocked=hasEverAcquired(i.id);
  if(i.secret&&!unlocked)return;
  const wasNew=state.newItemIds.includes(i.id);
  if(wasNew){
    markItemSeen(i.id,state);
    saveState();
    if(currentPage==="collection")renderCollection();
  }
  const sources=itemSourceTypes(i).join(" + ");
  const recent=state.itemHistory.filter(h=>h.itemId===i.id).slice(-5).reverse();
  const giftArchive=enabledCharacters().map(ch=>{
    const reaction=i.reactions.find(r=>r.characterId===ch.id);
    const discovered=isGiftPreferenceDiscovered(i.id,ch.id);
    const label=discovered?(reaction?.preference||"NO SPECIAL REACTION"):"???";
    const times=giftInteractionCount(i.id,ch.id);
    return '<div class="gift-archive-row"><span>'+esc(ch.name)+'</span><b>'+esc(label)+'</b><small>'+(times?times+' GIFTS':'UNTRIED')+'</small></div>';
  }).join("");
  openModal(unlocked?i.name:"LOCKED",unlocked?
    '<p class="label">'+esc(i.rarity)+' · '+esc(i.category)+(i.secret?' · SECRET':'')+'</p>'+
    '<p style="line-height:1.7">'+esc(i.description||"설명 없음")+'</p>'+
    '<div class="collection-detail-meta"><span>COLLECTION · '+esc(getCharacter(i.collectionCharacterId)?.name||"미지정")+'</span><span>'+esc(sources)+'</span><span>'+esc(i.acquisitionMode.toUpperCase())+'</span><span>'+esc(i.giftUseMode.toUpperCase())+'</span>'+(state.collectionSettings.showOwnedCount?'<span>INVENTORY ×'+count+'</span>':'')+'</div>'+
    '<section class="gift-archive"><h3>GIFT REACTIONS</h3>'+giftArchive+'</section>'+
    (recent.length?'<div class="collection-history-mini">'+recent.map(h=>'<div><span>'+esc(h.source)+'</span><b>+'+h.amount+'</b></div>').join("")+'</div>':'')
    :'<p class="muted">아직 획득하지 않은 아이템입니다.</p>');
}
