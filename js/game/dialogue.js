"use strict";
let roomExitActive=false;
let roomExitTargetPage="home";
let interactionCompleteMenu=null;
let selectedInventoryItemId="";
let inventoryQuery="";
let inventoryCategory="ALL";
let inventoryPreference="ALL";
let inventoryUnknownOnly=false;
function buildOriginIntroEvent(character){
  if(!character)return null;
  const text=originIntroTextForCharacter(character.id);
  if(!text)return null;
  const origin=String(state.profile?.origin||"").toUpperCase();
  const eventId="__origin-intro__"+character.id;
  return {
    id:eventId,
    name:"FIRST INTRO · "+origin,
    characterId:character.id,
    eventRole:"entry",
    menuVisible:false,
    continuationEventIds:[],
    emotionExitMode:"keep",
    entries:[normalizeEntry({
      id:eventId+"-line",
      type:"dialogue",
      speakerCharacterId:character.id,
      speaker:character.name,
      text
    })]
  };
}
function startDialogue(characterId,eventId){
  const ch=getCharacter(characterId);if(!ch)return;
  const enteringRoom=currentPage!=="room";
  selectedCharacterId=ch.id;
  roomToolsOpen=false;
  roomMode="talk";
  activeInteractionReaction=null;
  activeInteractionEvent=null;
  interactionContext=null;
  interactionCompleteMenu=null;
  activeRoomIntroEvent=null;
  const hasCustomOriginIntro=Boolean(window.HV_ORIGIN_INTROS?.[ch.id]);
  const intro=enteringRoom&&!eventId&&hasCustomOriginIntro&&!hasSeenOriginIntro(ch.id)?buildOriginIntroEvent(ch):null;
  if(intro){
    activeRoomIntroEvent=intro;
    if(markOriginIntroSeen(ch.id))saveProgressState();
  }
  const entry=enteringRoom&&!eventId&&!hasCustomOriginIntro?randomTalkEvent(playableEntryEventsForCharacter(ch.id)):null;
  const ev=eventId?getEvent(eventId):(intro||entry||randomTalkForCharacter(ch.id));
  const entryActive=Boolean(ev&&isEntryEvent(ev));
  const actionActive=Boolean(ev&&isActionEvent(ev));
  const wasNew=Boolean(ev&&!entryActive&&!isTalkDiscovered(ev.id));
  if(ev&&!entryActive){
    if(!actionActive)rememberRecentTalk(ch.id,ev.id);
    markTalkDiscovered(ev.id);
  }
  playback=ev?{
    characterId:ch.id,
    roomCharacterId:ch.id,
    eventId:ev.id,
    continuationQueue:entryActive?[]:[...(ev.continuationEventIds||[])],
    continuationTotal:entryActive?0:(ev.continuationEventIds||[]).length,
    autoVisitedEventIds:entryActive?[]:[ev.id],
    newTalkEventId:wasNew?ev.id:"",
    rootEventRole:eventRoleOf(ev),
    itemEffectClaimSnapshot:[...(state.claimedItemEffectIds||[])],
    inventoryCountSnapshot:{...(state.inventoryCounts||{})},
    frames:[{sourceType:"event",sourceId:ev.id,index:0,label:entryActive?"ENTRY":"본편",exitMode:"continue",targetEventId:""}],
    ended:false
  }:null;
  typing.token="";
  autoMode=false;clearTimeout(autoTimer);
  if(ev)saveProgressState();
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
function hasChosenOption(optionId){
  return Boolean(optionId&&(session.selectedOptionIds||[]).includes(optionId));
}
function markOptionChosen(optionId){
  if(!optionId)return false;
  session.selectedOptionIds=Array.isArray(session.selectedOptionIds)?session.selectedOptionIds:[];
  if(session.selectedOptionIds.includes(optionId))return false;
  session.selectedOptionIds.push(optionId);
  if(session.selectedOptionIds.length>5000)session.selectedOptionIds=session.selectedOptionIds.slice(-5000);
  return true;
}
function jumpEvent(id,{preserveContinuation=false,label="본편"}={}){
  const departing=currentEvent();const ev=getEvent(id);
  if(!ev){if(playback)playback.ended=true;return false}
  resetEventEmotion(departing);
  if(activeRoomIntroEvent&&departing?.id===activeRoomIntroEvent.id)activeRoomIntroEvent=null;
  playback.eventId=ev.id;
  playback.characterId=ev.characterId||playback.characterId;
  if(!preserveContinuation){
    playback.continuationQueue=[...(ev.continuationEventIds||[])];
    playback.continuationTotal=playback.continuationQueue.length;
  }
  playback.frames=[{sourceType:"event",sourceId:ev.id,index:0,label,exitMode:"continue",targetEventId:""}];
  rememberContinuousEvent(ev.id);
  const isTalkRoot=(state.events||[]).some(event=>event.id===ev.id)&&ev.menuVisible!==false&&eventRoleOf(ev)==="talk";
  if(isTalkRoot){
    const wasNew=!isTalkDiscovered(ev.id);
    if(markTalkDiscovered(ev.id))saveProgressState();
    playback.newTalkEventId=wasNew?ev.id:"";
  }
  playback.ended=false;typing.token="";
  return true;
}
function nextQueuedEvent(){
  if(!playback)return null;
  playback.continuationQueue=Array.isArray(playback.continuationQueue)?playback.continuationQueue:[];
  while(playback.continuationQueue.length){
    const id=playback.continuationQueue.shift();
    if(id&&getEvent(id))return id;
  }
  return null;
}
function continuationStatusLabel(){
  const total=Math.max(0,Number(playback?.continuationTotal)||0);
  if(!total)return"";
  const remaining=Array.isArray(playback?.continuationQueue)?playback.continuationQueue.length:0;
  const current=Math.max(1,total+1-remaining);
  return "SERIES "+current+" / "+(total+1);
}
function rememberContinuousEvent(id){
  if(!playback||!id)return;
  playback.autoVisitedEventIds=Array.isArray(playback.autoVisitedEventIds)?playback.autoVisitedEventIds:[];
  if(!playback.autoVisitedEventIds.includes(id))playback.autoVisitedEventIds.push(id);
}
function eventAllowedForPlayerOrigin(ev){
  if(!ev)return false;
  const origin=String(state.profile?.origin||"").toLowerCase();
  const explicit=Array.isArray(ev.playerOrigins)?ev.playerOrigins.map(String).map(x=>x.toLowerCase()).filter(Boolean):[];
  if(explicit.length&&!explicit.includes(origin))return false;

  // Legacy origin-specific TALK authored before event-level origin restrictions existed.
  // Keep the dialogue intact, but only offer it to WINNER players.
  const name=String(ev.name||"").replace(/^\s*TALK\s*[·:|\-]\s*/i,"").trim();
  if(ev.characterId==="lucifer-morningstar"&&name==="위너가 여기까지 왔네"){
    return origin==="winner";
  }
  return true;
}
function eventHasPlayableStart(ev){
  if(!ev||!eventAllowedForPlayerOrigin(ev)||!Array.isArray(ev.entries)||!ev.entries.length)return false;
  return ev.entries.some(entry=>{
    if(!ownerPasses(entry))return false;
    if(entry.type==="choice")return visibleOptions(entry).length>0;
    return true;
  });
}
function playableTalkEventsForCharacter(characterId){
  return talkEventsForCharacter(characterId).filter(ev=>ev.randomEligible!==false).filter(eventHasPlayableStart);
}
function playableEntryEventsForCharacter(characterId){
  return entryEventsForCharacter(characterId).filter(eventHasPlayableStart);
}
function continuousTalkEvents(){
  const enabledIds=new Set((state.characters||[]).filter(character=>character.enabled!==false).map(character=>character.id));
  return (state.events||[]).filter(ev=>
    eventRoleOf(ev)==="talk"&&ev.menuVisible!==false&&ev.randomEligible!==false&&enabledIds.has(ev.characterId)&&eventHasPlayableStart(ev)
  );
}
function randomTalkEvent(events,excludeId=""){
  const available=(events||[]).filter(ev=>ev&&ev.id!==excludeId);
  const pool=available.length?available:(events||[]).filter(Boolean);
  if(!pool.length)return null;
  const index=Math.min(pool.length-1,Math.floor(Math.random()*pool.length));
  return pool[index]||pool[0]||null;
}
function isTalkDiscovered(eventId){
  return (state.discoveredTalkIds||[]).includes(eventId);
}
function markTalkDiscovered(eventId){
  if(!eventId)return false;
  state.discoveredTalkIds ||= [];
  if(state.discoveredTalkIds.includes(eventId))return false;
  state.discoveredTalkIds.push(eventId);
  return true;
}
function recentTalkIds(characterId){
  session.recentTalks ||= {};
  return Array.isArray(session.recentTalks[characterId])?session.recentTalks[characterId]:[];
}
function rememberRecentTalk(characterId,eventId){
  if(!characterId||!eventId)return;
  session.recentTalks ||= {};
  const next=[...recentTalkIds(characterId).filter(id=>id!==eventId),eventId].slice(-3);
  session.recentTalks[characterId]=next;
  state.playState.recentTalks=clone(session.recentTalks);
}
function recentTalkFamilies(characterId){
  const ids=new Set(recentTalkIds(characterId));
  return new Set((state.events||[])
    .filter(event=>ids.has(event.id)&&event.topicFamily)
    .map(event=>event.topicFamily));
}
function randomTalkForCharacter(characterId,excludeId=""){
  const candidates=playableTalkEventsForCharacter(characterId);
  if(!candidates.length)return null;
  const recent=new Set(recentTalkIds(characterId));
  const recentFamilies=recentTalkFamilies(characterId);
  let pool=candidates.filter(ev=>ev.id!==excludeId&&!recent.has(ev.id)&&(!ev.topicFamily||!recentFamilies.has(ev.topicFamily)));
  if(!pool.length)pool=candidates.filter(ev=>ev.id!==excludeId);
  return randomTalkEvent(pool.length?pool:candidates,excludeId);
}
function nextContinuousEvent(){
  if(!playback)return null;
  const current=currentEvent();
  const currentId=current?.id||"";
  const roomCharacterId=playback.roomCharacterId||selectedCharacterId||playback.characterId||current?.characterId||"";
  const candidates=playableTalkEventsForCharacter(roomCharacterId);
  if(!candidates.length)return null;

  const visited=new Set(Array.isArray(playback.autoVisitedEventIds)?playback.autoVisitedEventIds:[]);
  const recent=new Set(recentTalkIds(roomCharacterId));
  const recentFamilies=recentTalkFamilies(roomCharacterId);
  let pool=candidates.filter(ev=>ev.id!==currentId&&!visited.has(ev.id)&&!recent.has(ev.id)&&(!ev.topicFamily||!recentFamilies.has(ev.topicFamily)));

  if(!pool.length)pool=candidates.filter(ev=>ev.id!==currentId&&!visited.has(ev.id));
  if(!pool.length){
    playback.autoVisitedEventIds=currentId?[currentId]:[];
    pool=candidates.filter(ev=>ev.id!==currentId&&!recent.has(ev.id));
  }
  if(!pool.length)pool=candidates.filter(ev=>ev.id!==currentId);

  const next=randomTalkEvent(pool.length?pool:candidates,currentId);
  if(next)rememberRecentTalk(roomCharacterId,next.id);
  return next?.id||null;
}
function shuffleTalk(){
  if(!playback||activeInteractionEvent||interactionContext?.followupActive)return false;
  if(Number(playback.continuationTotal)||0){
    showToast("연속 이야기 중에는 다음 TALK로 건너뛸 수 없습니다.");
    return false;
  }
  const characterId=playback.roomCharacterId||selectedCharacterId;
  const currentId=currentEvent()?.id||"";
  const next=randomTalkForCharacter(characterId,currentId);
  if(!next||next.id===currentId){
    showToast("지금 볼 수 있는 다른 TALK가 없습니다.");
    return false;
  }
  startDialogue(characterId,next.id);
  return true;
}
function relationshipProgress(characterId){
  const talkIds=talkEventsForCharacter(characterId).filter(eventAllowedForPlayerOrigin).map(event=>event.id);
  const talkSeen=talkIds.filter(id=>(state.discoveredTalkIds||[]).includes(id)).length;
  const asks=asksForCharacter(characterId);
  const askSeen=asks.filter(ask=>(state.askedAskIds||[]).includes(ask.id)).length;
  const character=getCharacter(characterId);
  const giftItems=character
    ? state.items.filter(item=>item.enabled&&item.giftable!==false&&Boolean(giftReactionFor(item,character)))
    : [];
  const giftSeen=giftItems.filter(item=>isGiftPreferenceDiscovered(item.id,characterId)).length;
  const specialItems=giftItems.filter(item=>giftReactionFor(item,character)?.specialEntries?.length);
  const specialTotal=specialItems.length;
  const specialKeys=new Set(specialItems.map(item=>giftReactionKey(item.id,characterId)));
  const specialSeen=(state.discoveredSpecialGiftKeys||[]).filter(key=>specialKeys.has(String(key))).length;
  return{talkSeen,talkTotal:talkIds.length,askSeen,askTotal:asks.length,giftSeen,giftTotal:giftItems.length,specialSeen,specialTotal};
}
function relationshipProgressMarkup(characterId){
  const p=relationshipProgress(characterId);
  return '<div class="relationship-progress"><span>TALK '+p.talkSeen+'/'+p.talkTotal+'</span><span>ASK '+p.askSeen+'/'+p.askTotal+'</span><span>GIFT '+p.giftSeen+'/'+p.giftTotal+'</span><span>SPECIAL '+p.specialSeen+'/'+p.specialTotal+'</span></div>';
}
function playableExitEventsForCharacter(characterId){
  return exitEventsForCharacter(characterId).filter(eventHasPlayableStart);
}
const FALLBACK_EXIT_LINES={
  "lucifer-morningstar":["벌써 가는 거야? 뭐, 다음엔 좀 더 재미있는 걸 준비해 두지.","그래, 다녀와. 너무 오래 비우진 말고.","다음에 올 땐 오리 하나쯤 가져와도 환영이야."],
  "charlie-morningstar":["조심히 가! 다음에 오면 또 얘기하자!","와줘서 고마워. 다음에도 꼭 들러 줘!","좋은 하루 보내! 여기선 그게 조금 어려울 수도 있지만!"],
  "vaggie":["그래. 조심해서 가.","다음에 올 땐 미리 말해 줘.","볼일 끝났으면 가도 돼. 또 보자."],
  "alastor":["벌써 가시는 겁니까? 다음 방문도 기대하지요.","그럼 다음 방송까지, 좋은 밤 되시길.","떠나는 타이밍도 제법 훌륭하군요. 또 뵙지요."],
  "angel-dust":["벌써 가게? 다음엔 좀 더 오래 놀다 가.","그래, 잘 가. 재밌는 거 생기면 다시 와.","다음에 올 땐 간식도 챙겨 와, 알겠지?"],
  "husk":["그래, 또 봐.","문 닫고 가. 다음에 보자.","잘 가. 난 여기 있을 테니까."],
  "niffty":["다음에 또 와! 그땐 더 깨끗해져 있을 거야! 아마도!","잘 가! 돌아오기 전에 어지르면 안 돼!","또 와! 다음엔 내가 먼저 찾아낼 거야!"],
  "baxter":["그래. 다음엔 실험 중이 아닐 때 와.","조심히 가. 장비는 건드리지 말고.","다음 방문 전엔 노크부터 해."]
};
function fallbackExitLines(character){
  if(!character)return["다음에 또 보자."];
  const id=String(character.id||"").toLowerCase();
  if(FALLBACK_EXIT_LINES[id])return FALLBACK_EXIT_LINES[id];
  const name=String(character.name||"").toLowerCase();
  const match=Object.keys(FALLBACK_EXIT_LINES).find(key=>name.includes(key.split("-")[0]));
  return match?FALLBACK_EXIT_LINES[match]:["조심히 가. 다음에 또 보자.","그래, 또 보자.","다음에 다시 들러."];
}
function fallbackExitEvent(character){
  if(!character)return null;
  const lines=fallbackExitLines(character);
  const text=lines[Math.floor(Math.random()*lines.length)]||lines[0];
  return {
    id:"__room-exit-fallback__"+character.id,
    name:"EXIT",
    characterId:character.id,
    eventRole:"exit",
    menuVisible:false,
    continuationEventIds:[],
    emotionExitMode:"keep",
    entries:[normalizeEntry({
      id:"__room-exit-line__"+character.id,
      type:"dialogue",
      speaker:character.name,
      speakerCharacterId:character.id,
      text
    })]
  };
}
function completeRoomExit(){
  const target=roomExitTargetPage||"home";
  const fallbackId=String(playback?.eventId||"");
  if(fallbackId.startsWith("__room-exit-fallback__")){
    state.events=state.events.filter(event=>event.id!==fallbackId);
  }
  roomExitActive=false;
  roomExitTargetPage="home";
  interactionCompleteMenu=null;
  activeInteractionReaction=null;
  activeInteractionEvent=null;
  activeRoomIntroEvent=null;
  interactionContext=null;
  playback=null;
  typing.token="";
  clearTyping();
  clearAuto();
  autoMode=false;
  if(target==="profile"){
    currentPage="home";
    renderStart();
  }else setPage(target);
}
function beginRoomExit(targetPage="home"){
  if(currentPage!=="room"){
    if(targetPage==="profile"){renderStart();return false}
    setPage(targetPage);return false
  }
  if(roomExitActive)return true;
  if(activeInteractionReaction||interactionContext?.followupActive){
    showToast("ASK/선물 반응을 끝까지 본 뒤 이동할 수 있습니다.");
    return false;
  }
  const ch=getCharacter(selectedCharacterId);
  const exits=playableExitEventsForCharacter(ch?.id||"");
  const ev=randomTalkEvent(exits)||fallbackExitEvent(ch);
  roomExitTargetPage=targetPage||"home";
  interactionCompleteMenu=null;
  activeInteractionReaction=null;
  activeInteractionEvent=null;
  interactionContext=null;
  roomToolsOpen=false;
  roomMode="talk";
  autoMode=false;
  clearAuto();
  clearTyping();

  if(!ev){
    completeRoomExit();
    return false;
  }

  roomExitActive=true;
  if(!getEvent(ev.id))state.events.push(ev);
  playback={
    characterId:ch.id,
    roomCharacterId:ch.id,
    eventId:ev.id,
    continuationQueue:[],
    continuationTotal:0,
    autoVisitedEventIds:[],
    itemEffectClaimSnapshot:[...(state.claimedItemEffectIds||[])],
    inventoryCountSnapshot:{...(state.inventoryCounts||{})},
    frames:[{sourceType:"event",sourceId:ev.id,index:0,label:"EXIT",exitMode:"continue",targetEventId:""}],
    ended:false
  };
  typing.token="";
  renderRoom();
  return true;
}
function finishEvent(){
  const ev=currentEvent();
  if(roomExitActive){
    resetEventEmotion(ev);
    completeRoomExit();
    return false;
  }
  if(activeInteractionEvent&&ev?.id===activeInteractionEvent.id){
    const meta=activeInteractionEvent.interactionMeta||interactionContext?.completionMeta||{};
    const result=completeInteraction(meta);
    restoreInterruptedDialogue();
    interactionCompleteMenu={...meta,...result};
    return false;
  }
  const nextId=nextQueuedEvent();
  if(nextId&&jumpEvent(nextId,{preserveContinuation:true,label:"연속"}))return true;
  if(interactionContext?.followupActive){
    const meta=interactionContext.completionMeta||{};
    resetEventEmotion(ev);
    const result=completeInteraction(meta);
    restoreInterruptedDialogue();
    interactionCompleteMenu={...meta,...result};
    return false;
  }
  if(playback?.rootEventRole==="action"){
    resetEventEmotion(ev);
    playback.ended=true;
    return false;
  }
  const continuousId=nextContinuousEvent();
  if(continuousId&&jumpEvent(continuousId,{label:"랜덤 TALK"}))return true;
  resetEventEmotion(ev);
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
function dialogueTextNeedsScroll(target=$("#dialogueText")){
  return Boolean(target&&target.scrollHeight>target.clientHeight+2);
}
function scheduleAuto(){
  clearAuto();
  if(!autoMode||!typing.done||!playback||playback.ended)return;
  const frame=playback.frames.at(-1),entry=frameEntries(frame)[frame?.index];
  if(!entry||entry.type==="choice")return;
  if(dialogueTextNeedsScroll())return;
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
function roomCharacterArt(character){
  if(!character)return'<div class="silhouette">??</div>';
  const imageScale=Math.max(.5,Math.min(2,Number(character.imageScale)||1));
  return character.image
    ? '<img src="'+esc(character.image)+'" alt="'+esc(character.name)+'" style="--character-image-scale:'+imageScale+'" />'
    : '<div class="silhouette">'+esc(character.name.slice(0,2).toUpperCase())+'</div>';
}
function entrySpeakerCharacter(entry){
  if(entry?.type!=="dialogue")return null;
  if(entry.speakerCharacterId)return getCharacter(entry.speakerCharacterId);
  const speaker=String(entry.speaker||"").trim().toLowerCase();
  if(!speaker)return getCharacter(playback?.characterId||selectedCharacterId);
  return state.characters.find(character=>character.name.trim().toLowerCase()===speaker)||null;
}
function updateRoomSpeakerVisual(entry){
  if(entry?.type!=="dialogue")return null;
  const character=entrySpeakerCharacter(entry);
  if(!character)return null;
  const art=$("#roomArt");
  if(!art||art.dataset.characterId===character.id)return character;
  art.dataset.characterId=character.id;
  art.innerHTML=roomCharacterArt(character);
  art.classList.remove("speaker-shift");
  void art.offsetWidth;
  art.classList.add("speaker-shift");
  return character;
}
function renderRoom(){
  if(typeof gameShell!=="undefined")gameShell.classList.add("room-active");
  const ch=getCharacter(selectedCharacterId);
  if(!ch){setPage("home");return}
  const ev=currentEvent();
  const art=roomCharacterArt(ch);
  const eventOptions=eventsForCharacter(ch.id);
  const interactionLocked=Boolean(activeInteractionReaction||interactionContext?.followupActive||interactionCompleteMenu);
  const eventPickerVisible=!ev||ev.menuVisible!==false;
  const eventPicker=roomMode==="talk"&&eventOptions.length&&eventPickerVisible&&!interactionLocked
    ? '<details class="room-event-details"><summary>TALK 선택</summary><select id="roomEventSelect">'+eventOptions.map(e=>'<option value="'+esc(e.id)+'" '+(ev?.id===e.id?"selected":"")+'>'+esc(e.name)+'</option>').join("")+'</select></details>'
    : '';

  pageRoot.innerHTML=
    '<section class="room-page"><div class="room-hud"><button class="text-link" type="button" data-action="back-home">← HOME</button><strong id="roomSpeakerName">'+esc(ch.name)+'</strong>'+
    '<div class="room-mode-bar"><button class="room-mode-button '+(roomMode==="talk"?"active":"")+'" type="button" data-action="room-mode" data-mode="talk" '+(interactionLocked?"disabled":"")+'>TALK</button>'+
    '<button class="room-mode-button '+(roomMode==="ask"?"active":"")+'" type="button" data-action="room-mode" data-mode="ask" '+(interactionLocked?"disabled":"")+'>ASK</button>'+
    '<button class="room-mode-button '+(roomMode==="inventory"?"active":"")+'" type="button" data-action="room-mode" data-mode="inventory" '+(interactionLocked?"disabled":"")+'>INVENTORY</button></div>'+
    '<button class="room-more-button" type="button" data-action="toggle-room-tools" aria-label="추가 메뉴">•••</button><div class="room-actions '+(roomToolsOpen?"open":"")+'">'+eventPicker+'<button class="text-link" type="button" data-action="show-log">LOG</button><button class="text-link" type="button" data-action="show-history">HISTORY</button><button class="text-link mobile-set" type="button" data-action="open-play-settings">SET</button></div></div>'+
    '<div class="room-stage"><div id="roomArt" class="room-art" data-character-id="'+esc(ch.id)+'">'+art+'</div>'+
    characterStatusMetersMarkup(ch,"room")+
    '<div id="roomDynamic"></div>'+
    (roomMode==="talk"&&!activeInteractionReaction&&!interactionCompleteMenu?'<div class="room-control-bar"><button type="button" data-action="shuffle-talk">NEW TALK</button><button type="button" data-action="toggle-auto" class="'+(autoMode?"active":"")+'">AUTO</button><button type="button" data-action="open-play-settings">SET</button></div>':'')+
    '</div></section>';

  if(interactionCompleteMenu)renderInteractionCompleteMenu();
  else if(activeInteractionReaction)renderInteractionReaction();
  else if(roomMode==="ask")renderAskPanel();
  else if(roomMode==="inventory")renderInventoryPanel();
  else renderRoomBeat();
}
function renderRoomBeat(){
  if(roomMode!=="talk")return;
  const roomCharacterId=playback?.roomCharacterId||playback?.characterId||selectedCharacterId;
  if(roomCharacterId && roomCharacterId!==selectedCharacterId){
    selectedCharacterId=roomCharacterId;
    renderRoom();
    return;
  }
  const dynamic=$("#roomDynamic");if(!dynamic)return;
  if(!playback){
    dynamic.innerHTML='<div class="room-empty"><h2>등록된 이벤트가 없습니다.</h2><p>편집기에서 이 캐릭터의 이벤트를 추가하세요.</p></div>';return;
  }
  if(!settlePlayback()){
    if(interactionCompleteMenu){renderInteractionCompleteMenu();return}
    if(playback?.rootEventRole==="action"){
      dynamic.innerHTML='<div class="room-empty"><h2>대화가 끝났습니다.</h2><p>위의 TALK 선택에서 다른 이벤트를 고르거나 NEW TALK를 이용할 수 있습니다.</p></div>';
    }else{
      dynamic.innerHTML='<div class="room-empty"><h2>이어갈 TALK를 찾지 못했습니다.</h2><p>현재 조건에서 재생 가능한 TALK가 없습니다. TALK 선택이나 ASK / INVENTORY를 이용할 수 있습니다.</p></div>';
    }
    clearTyping();clearAuto();return;
  }
  const select=$("#roomEventSelect");
  const current=currentEvent();
  if(select&&current&&[...select.options].some(option=>option.value===current.id))select.value=current.id;
  const frame=playback.frames.at(-1),entry=frameEntries(frame)[frame.index];
  if(entry.type==="choice"){
    clearTyping();clearAuto();
    const opts=visibleOptions(entry);
    dynamic.innerHTML='<div class="choice-box"><p class="page-kicker">CHOICE</p><h2>'+esc(entry.prompt||"무엇을 선택할까?")+'</h2><div class="choice-list">'+opts.map(o=>{
      const chosen=hasChosenOption(o.id);
      return '<button class="choice-option'+(chosen?' is-chosen':'')+'" type="button" data-action="choose-option" data-id="'+esc(o.id)+'">'+
        '<span class="choice-option-label">'+esc(o.label||"이름 없는 선택지")+'</span>'+
        (chosen?'<span class="choice-option-status">✓ 선택함</span>':'')+
      '</button>';
    }).join("")+'</div></div>';
    return;
  }
  const speakerCharacter=updateRoomSpeakerVisual(entry);
  const token=playback.eventId+"|"+playback.frames.map(f=>f.sourceId+":"+f.index).join("|")+"|"+entry.id;
  const speaker=entry.type==="narration"?"":(entry.speaker||speakerCharacter?.name||chName(playback.characterId));
  const isPlayer=entry.type==="dialogue"&&String(entry.speaker||"").trim().toUpperCase()==="PLAYER";
  const dialogueSurfaceClass=entry.type==="narration"?" narration-dialogue":isPlayer?" player-dialogue":" character-dialogue";
  const displaySpeaker=entry.type==="narration"?"NARRATION":isPlayer?"YOU":speaker;
  const series=continuationStatusLabel();
  const length=String(entry.text||"").length;
  const density=length>210?" is-very-compact":length>130?" is-compact":"";
  const newTalk=current?.id===playback.newTalkEventId&&frame.index===0;
  const newBadge=newTalk?"NEW TALK":"";
  const progressLabel=series||("SCENE "+(frame.index+1)+" / "+frameEntries(frame).length);
  dynamic.innerHTML='<div class="dialogue-box'+dialogueSurfaceClass+'">'+(newBadge?'<span class="new-talk-badge">'+newBadge+'</span>':'')+'<p class="speaker">'+esc(displaySpeaker)+'</p><p id="dialogueText" class="dialogue-text'+density+'"></p><div class="dialogue-meta"><span>'+esc(progressLabel)+'</span><button type="button" data-action="advance-dialogue">NEXT</button></div></div>';
  if(typing.token!==token){
    session.log.push({kind:entry.type,speaker,text:entry.text||"",eventName:currentEvent()?.name||""});
    if(session.log.length>200)session.log.splice(0,session.log.length-200);
    saveProgressState();
    startTyping(entry.text||"",token);
  }else{
    $("#dialogueText").textContent=typing.done?typing.full:typing.full.slice(0,typing.index);
    scheduleAuto();
  }
}

function renderInteractionCompleteMenu(){
  const dynamic=$("#roomDynamic");if(!dynamic||!interactionCompleteMenu)return;
  const meta=interactionCompleteMenu;
  const isGift=meta.kind==="gift";
  const discoveries=[
    meta.newGiftPreference?'<span>NEW GIFT REACTION</span>':"",
    meta.newSpecialGift?'<span>NEW SPECIAL</span>':""
  ].filter(Boolean).join("");
  dynamic.innerHTML='<section class="interaction-complete-panel"><p class="page-kicker">'+(isGift?'GIFT COMPLETE':'ASK COMPLETE')+'</p><h2>'+esc(meta.label||"반응을 확인했습니다.")+'</h2>'+
    (discoveries?'<div class="interaction-discovery">'+discoveries+'</div>':'')+
    '<div class="interaction-next-actions">'+
      '<button class="gold-button" type="button" data-action="interaction-after" data-mode="'+(isGift?'inventory':'ask')+'">'+(isGift?'선물 더 주기':'다른 질문')+'</button>'+
      '<button class="ghost-button" type="button" data-action="interaction-after" data-mode="talk">TALK로 돌아가기</button>'+
    '</div></section>';
}
function finishInteractionChoice(mode){
  interactionCompleteMenu=null;
  roomMode=mode==="inventory"?"inventory":mode==="ask"?"ask":"talk";
  renderRoom();
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
  const asks=asksForCharacter(ch.id);
  dynamic.innerHTML='<section class="ask-panel"><div class="inventory-character-head"><div><p class="page-kicker">ASK</p><h2>무엇을 물어볼까?</h2></div><p>잠긴 질문은 조건을 만족하면 열립니다.</p></div>'+
    relationshipProgressMarkup(ch.id)+'<div class="ask-list">'+
    (asks.length?asks.map(a=>{
      const unlocked=isAskUnlocked(a);
      const asked=(state.askedAskIds||[]).includes(a.id);
      const affinityPass=askAffectionRequirementPasses(a);
      const available=unlocked&&affinityPass&&(!asked||a.repeatable);
      const status=!unlocked?"LOCKED":asked?"ASKED":"NEW";
      const label=unlocked?a.label:"???";
      let detail=status;
      if(!unlocked&&a.unlockHint)detail+=' · '+a.unlockHint;
      else if(unlocked&&!affinityPass)detail+=' · 호감도 '+a.minAffection;
      else if(asked&&a.repeatable)detail+=' · 다시 묻기 가능';
      else if(asked&&!a.repeatable)detail+=' · 완료';
      return '<button class="ask-entry '+status.toLowerCase()+'" type="button" data-action="ask-topic" data-id="'+esc(a.id)+'" '+(!available?"disabled":"")+'><span>'+esc(label)+'</span><small>'+esc(detail)+'</small></button>';
    }).join(""):'<div class="editor-note">등록된 질문이 없습니다.</div>')+
    '</div></section>';
}
function startAsk(id){
  const ask=state.asks.find(a=>a.id===id&&a.enabled);if(!ask)return;
  const ch=getCharacter(ask.characterId);if(!ch||selectedCharacterId!==ch.id)return;
  syncAskUnlocks(ch.id);
  if(!isAskUnlocked(ask)){showToast(ask.unlockHint||"아직 해금되지 않은 질문입니다.");return}
  const alreadyAsked=(state.askedAskIds||[]).includes(ask.id);
  if(alreadyAsked&&!ask.repeatable){showToast("이미 확인한 질문입니다.");return}
  const affection=Number(session.affection[ch.id]??ch.affectionStart);
  if(!askAffectionRequirementPasses(ask)){showToast("아직 물어볼 수 없습니다.");return}
  const askPhase=alreadyAsked?"repeat":"first";
  const askDelta=alreadyAsked?ask.repeatAffectionDelta:ask.affectionDelta;
  applyInteractionEffects({
    characterId:ch.id,
    affectionDelta:clamp(askDelta,-100,100,0),
    emotionState:ask.emotionState||"",
    emotionIntensity:clamp(ask.emotionIntensity,0,100,0),
    once:!alreadyAsked&&ask.applyAskDeltaOnce===true,
    claimId:!alreadyAsked?ask.id+":ask:first":""
  });
  beginInteractionReaction("ask",ask,ask.entries,ask.label,{
    askId:ask.id,
    affectionSnapshot:affection,
    itemEffectClaimSnapshot:[...(state.claimedItemEffectIds||[])],
    interactionEffects:null
  });
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
  const owned=state.items.filter(i=>i.enabled&&i.giftable!==false&&itemCount(i.id)>0&&Boolean(giftReactionFor(i,ch)));
  if(selectedInventoryItemId&&!owned.some(item=>item.id===selectedInventoryItemId))selectedInventoryItemId="";
  const filtered=owned.filter(item=>{
    const reaction=giftReactionFor(item,ch);
    const discovered=isGiftPreferenceDiscovered(item.id,ch.id);
    const pref=discovered?(reaction?.preference||"NEUTRAL"):"UNKNOWN";
    if(inventoryQuery&&![item.name,item.category,item.rarity,item.description,itemGachaLine(item),itemEmoji(item)].join(" ").toLowerCase().includes(inventoryQuery.toLowerCase()))return false;
    if(inventoryCategory!=="ALL"&&item.category!==inventoryCategory)return false;
    if(inventoryPreference!=="ALL"&&pref!==inventoryPreference)return false;
    if(inventoryUnknownOnly&&discovered)return false;
    return true;
  });
  const selected=itemById(selectedInventoryItemId);
  const selectedReaction=selected?giftReactionFor(selected,ch):null;
  const selectedDiscovered=selected?isGiftPreferenceDiscovered(selected.id,ch.id):false;
  const selectedPreference=selectedDiscovered?(selectedReaction?.preference||"NO SPECIAL REACTION"):"???";
  const categories=[...new Set(owned.map(item=>item.category))].sort();
  const preview=selected&&itemCount(selected.id)>0
    ? '<article class="inventory-preview-card"><div><p class="page-kicker">SELECTED GIFT</p><h3>'+esc(itemEmoji(selected))+' '+esc(selected.name)+'</h3><p>'+esc(selected.description||"설명 없음")+'</p>'+(itemGachaLine(selected)?'<p class="inventory-gacha-line"><b>GACHA REVEAL</b>'+esc(itemGachaLine(selected))+'</p>':'')+'</div>'+
      '<div class="inventory-preview-meta"><span>'+esc(selected.rarity)+'</span><span>'+esc(selected.category)+'</span><span>반응 '+esc(selectedPreference)+'</span><span>'+(selected.giftUseMode==="consume"?"소모형":"보존형")+'</span><span>×'+itemCount(selected.id)+'</span></div>'+
      '<button class="gold-button" type="button" data-action="give-item" data-id="'+esc(selected.id)+'">'+esc(ch.name)+'에게 선물하기</button></article>'
    : "";
  dynamic.innerHTML='<section class="inventory-panel"><div class="inventory-character-head"><div><p class="page-kicker">INVENTORY</p><h2>GIVE ITEM</h2></div><p>아이템을 먼저 확인한 뒤 선물합니다.</p></div>'+
    relationshipProgressMarkup(ch.id)+
    '<div class="inventory-filter-bar"><input data-inventory-control="query" value="'+esc(inventoryQuery)+'" placeholder="선물 검색">'+
      '<select data-inventory-control="category"><option value="ALL">모든 카테고리</option>'+categories.map(cat=>'<option value="'+esc(cat)+'" '+(inventoryCategory===cat?"selected":"")+'>'+esc(cat)+'</option>').join("")+'</select>'+
      '<select data-inventory-control="preference"><option value="ALL">모든 반응</option><option value="UNKNOWN" '+(inventoryPreference==="UNKNOWN"?"selected":"")+'>미확인</option>'+
      ["LOVED","LIKED","NEUTRAL","DISLIKED","HATED"].map(pref=>'<option value="'+pref+'" '+(inventoryPreference===pref?"selected":"")+'>'+pref+'</option>').join("")+'</select>'+
      '<button class="filter-chip '+(inventoryUnknownOnly?"active":"")+'" type="button" data-action="inventory-unknown">미확인만</button></div>'+
    preview+'<div class="inventory-list">'+
    (filtered.length?filtered.map(i=>{
      const reaction=giftReactionFor(i,ch);
      const discovered=isGiftPreferenceDiscovered(i.id,ch.id);
      const reactionLabel=discovered?(reaction?reaction.preference:"NO SPECIAL REACTION"):"???";
      const times=giftInteractionCount(i.id,ch.id);
      return '<button class="inventory-entry '+(i.id===selectedInventoryItemId?"selected":"")+'" type="button" data-action="inventory-preview" data-id="'+esc(i.id)+'"><span><b>'+esc(itemEmoji(i))+' '+esc(i.name)+'</b><small>'+esc(i.rarity)+' · '+esc(i.category)+' · '+esc(reactionLabel)+(times?' · '+times+'회 선물':'')+'</small></span><span class="count">×'+itemCount(i.id)+'</span></button>';
    }).join(""):'<div class="editor-note">조건에 맞는 선물이 없습니다.</div>')+
    '</div></section>';
}
function giftNeedsConfirmation(item){
  if(!item||item.giftUseMode!=="consume")return false;
  return itemCount(item.id)<=1||["RARE","EPIC","LEGENDARY","MISTIC"].includes(item.rarity);
}
function useInventoryItem(id){
  const item=itemById(id);if(!item||itemCount(id)<=0)return;
  const ch=getCharacter(selectedCharacterId);if(!ch)return;
  const reaction=giftReactionFor(item,ch);
  if(!reaction){
    showToast(ch.name+"의 이 아이템 반응은 아직 설정되지 않았습니다.");
    return;
  }
  if(giftNeedsConfirmation(item)&&!confirm(item.name+"을(를) "+ch.name+"에게 선물할까요?\n소모형 아이템이며 현재 "+itemCount(id)+"개 보유 중입니다."))return;
  const key=giftReactionKey(item.id,ch.id);

  const currentCount=giftInteractionCount(item.id,ch.id);
  const emotion=session.emotions[ch.id]||{state:ch.emotionDefault,intensity:ch.emotionIntensity};
  const affection=Number(session.affection[ch.id]??ch.affectionStart);
  const specialAlreadySeen=(state.discoveredSpecialGiftKeys||[]).includes(key);
  const hasSpecialRule=Number(reaction.specialMinAffection)>0||Boolean(reaction.specialEmotionState);
  const specialPass=!specialAlreadySeen&&hasSpecialRule
    && affection>=Number(reaction.specialMinAffection||0)
    && (!reaction.specialEmotionState||(emotion.state===reaction.specialEmotionState&&emotion.intensity>=Number(reaction.specialEmotionIntensity||0)))
    && reaction.specialEntries.length>0;

  const flowType=specialPass?"SPECIAL":currentCount===0?"FIRST":"REPEAT";
  let entries=specialPass?reaction.specialEntries:(currentCount===0?reaction.firstEntries:reaction.repeatEntries);
  if(!entries?.length)entries=reaction.firstEntries?.length?reaction.firstEntries:reaction.repeatEntries;

  beginInteractionReaction("gift",reaction,entries,item.name,{
    itemId:item.id,
    preference:reaction.preference,
    flowType,
    consume:item.giftUseMode==="consume"
  });
}
function chName(id){return getCharacter(id)?.name||"UNKNOWN"}
function advanceDialogue(fromAuto=false){
  if(!playback||playback.ended)return;
  const frame=playback.frames.at(-1),entry=frameEntries(frame)[frame.index];
  if(!entry||entry.type==="choice")return;
  const textTarget=$("#dialogueText");
  if(!typing.done&&!fromAuto){
    typing.index=typing.full.length;typing.done=true;clearTyping();
    if(textTarget)textTarget.textContent=typing.full;
    scheduleAuto();return
  }
  if(!fromAuto&&dialogueTextNeedsScroll(textTarget)&&textTarget.scrollTop+textTarget.clientHeight<textTarget.scrollHeight-3){
    textTarget.scrollBy({top:Math.max(48,textTarget.clientHeight*.78),behavior:"smooth"});
    return;
  }
  clearAuto();applyOwnerEffects(entry);frame.index++;typing.token="";renderRoomBeat();
}
function chooseOption(id){
  if(!playback)return;
  const frame=playback.frames.at(-1),entry=frameEntries(frame)[frame.index];
  if(!entry||entry.type!=="choice")return;
  const option=entry.options.find(o=>o.id===id);if(!option||!ownerPasses(option))return;
  applyOwnerEffects(entry);applyOwnerEffects(option);
  markOptionChosen(option.id);
  session.log.push({kind:"choice",speaker:"CHOICE",text:(entry.prompt||"선택")+" → "+(option.label||""),eventName:currentEvent()?.name||""});
  if(session.log.length>200)session.log.splice(0,session.log.length-200);
  saveProgressState();
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
function showAllStatus(){
  const chars=enabledCharacters();
  openModal("ALL CHARACTER STATUS",
    '<div class="all-status-list">'+
      (chars.length?chars.map(c=>{
        const affection=Math.round(clamp(session.affection[c.id]??c.affectionStart,0,100,0));
        const emotion=session.emotions[c.id]||{state:c.emotionDefault,intensity:c.emotionIntensity};
        const intensity=Math.round(clamp(emotion.intensity,0,100,0));
        return '<article class="all-status-card">'+
          '<div class="all-status-card-head"><strong>'+esc(c.name)+'</strong><small>'+esc(originLabel(c.origin))+'</small></div>'+
          '<div class="all-status-row"><div class="all-status-row-head"><span>AFFECTION</span><b>'+affection+' / 100</b></div>'+
            '<div class="status-track"><div class="status-fill" style="width:'+affection+'%"></div></div></div>'+
          '<div class="all-status-row"><div class="all-status-row-head"><span>EMOTION</span><b>'+esc(emotionLabel(emotion.state))+' · '+intensity+'</b></div>'+
            '<div class="status-track"><div class="status-fill" style="width:'+intensity+'%"></div></div></div>'+
        '</article>';
      }).join(""):'<p class="muted">등록된 캐릭터가 없습니다.</p>')+
    '</div>'
  );
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
let thoughtNoticeTimer=null;
let thoughtNoticeRemoveTimer=null;
function showThoughtNotice(ch,thought){
  clearTimeout(thoughtNoticeTimer);
  clearTimeout(thoughtNoticeRemoveTimer);
  document.querySelector(".thought-notice")?.remove();

  const notice=document.createElement("aside");
  notice.className="thought-notice";
  notice.setAttribute("role","status");
  notice.setAttribute("aria-live","polite");
  notice.innerHTML=
    '<div class="thought-notice-head"><span>THOUGHT</span><small>'+esc(ch.name)+'</small></div>'+
    '<div class="thought-notice-category">'+esc(thought.category)+'</div>'+
    '<p>'+esc(thought.text)+'</p>'+
    '<i class="thought-notice-timer" aria-hidden="true"></i>';
  document.body.appendChild(notice);

  const anchor=document.querySelector('[data-action="random-thought"]');
  if(anchor){
    const rect=anchor.getBoundingClientRect();
    const noticeWidth=Math.min(notice.offsetWidth||520,Math.max(180,window.innerWidth-20));
    const half=noticeWidth/2;
    const preferredCenter=rect.left+rect.width/2;
    const center=Math.max(10+half,Math.min(window.innerWidth-10-half,preferredCenter));
    notice.classList.add("thought-notice-anchored");
    notice.style.left=center+"px";
    notice.style.right="auto";
    notice.style.top="auto";
    notice.style.bottom=Math.max(10,window.innerHeight-rect.top+12)+"px";
  }

  requestAnimationFrame(()=>notice.classList.add("show"));
  const duration=Math.max(4600,Math.min(9000,3600+String(thought.text||"").length*48));
  notice.style.setProperty("--thought-notice-duration",duration+"ms");

  thoughtNoticeTimer=setTimeout(()=>{
    notice.classList.remove("show");
    notice.classList.add("hide");
    thoughtNoticeRemoveTimer=setTimeout(()=>notice.remove(),420);
  },duration);
}
function randomThought(){
  const ch=getCharacter(selectedCharacterId);if(!ch)return;
  const affection=Math.round(session.affection[ch.id]??ch.affectionStart);
  const candidates=state.thoughts.filter(t=>
    t.enabled&&
    t.characterId===ch.id&&
    affection>=Number(t.minAffection||0)&&
    affection<=Number(t.maxAffection??100)
  );
  if(!candidates.length){
    showToast("현재 호감도에서 떠오를 Thought가 없습니다.");
    return;
  }
  const weight={common:8,normal:4,rare:1};
  const total=candidates.reduce((s,t)=>s+(weight[t.frequency]||1),0);
  let roll=Math.random()*total,chosen=candidates[0];
  for(const t of candidates){roll-=weight[t.frequency]||1;if(roll<=0){chosen=t;break}}
  if(!state.discoveredThoughtIds.includes(chosen.id))state.discoveredThoughtIds.push(chosen.id);
  saveProgressState();
  showThoughtNotice(ch,chosen);
}
function chooseWeighted(items,getWeight){
  const total=items.reduce((s,x)=>s+Math.max(0,Number(getWeight(x))||0),0);
  if(total<=0)return items[Math.floor(Math.random()*items.length)];
  let roll=Math.random()*total;
  for(const item of items){roll-=Math.max(0,Number(getWeight(item))||0);if(roll<=0)return item}
  return items.at(-1);
}
function spawnGachaParticles(stage,mode="burst",amount=30){
  if(!stage)return;
  const layer=document.createElement("div");
  layer.className="gacha-particle-burst gacha-particle-burst-"+mode;
  layer.setAttribute("aria-hidden","true");
  const total=Math.max(8,Math.min(72,Number(amount)||30));
  for(let index=0;index<total;index++){
    const particle=document.createElement("span");
    const angle=Math.random()*Math.PI*2;
    const distance=(mode==="reveal"?120:170)+Math.random()*(mode==="reveal"?240:360);
    const dx=Math.cos(angle)*distance;
    const dy=Math.sin(angle)*distance;
    const star=index%5===0;
    const wine=!star&&index%4===0;
    particle.className="gacha-burst-particle"+(star?" is-star":wine?" is-wine":"");
    particle.textContent=star?"✦":"";
    particle.style.setProperty("--dx",dx.toFixed(1)+"px");
    particle.style.setProperty("--dy",dy.toFixed(1)+"px");
    particle.style.setProperty("--rot",(Math.random()*220-110).toFixed(1)+"deg");
    particle.style.setProperty("--size",(star?14+Math.random()*12:5+Math.random()*8).toFixed(1)+"px");
    particle.style.setProperty("--delay",(Math.random()*(mode==="reveal"?.16:.10)).toFixed(3)+"s");
    particle.style.setProperty("--duration",(mode==="reveal"?.75:1.05+Math.random()*.35).toFixed(3)+"s");
    layer.appendChild(particle);
  }
  const ring=document.createElement("span");
  ring.className="gacha-particle-ring";
  layer.appendChild(ring);
  stage.appendChild(layer);
  setTimeout(()=>layer.remove(),mode==="reveal"?1200:1700);
}
function spawnGachaStarRain(stage,mode="draw",amount=32){
  if(!stage)return;
  const layer=document.createElement("div");
  layer.className="gacha-star-rain gacha-star-rain-"+mode;
  layer.setAttribute("aria-hidden","true");
  const total=Math.max(12,Math.min(72,Number(amount)||32));
  for(let index=0;index<total;index++){
    const particle=document.createElement("span");
    const glyph=index%6===0;
    const wine=!glyph&&index%5===0;
    particle.className="gacha-star-rain-particle"+(glyph?" is-glyph":wine?" is-wine":"");
    particle.textContent=glyph?"✦":"";
    particle.style.setProperty("--rain-x",(2+Math.random()*96).toFixed(2)+"%");
    particle.style.setProperty("--rain-drift",(Math.random()*180-90).toFixed(1)+"px");
    particle.style.setProperty("--rain-size",(glyph?12+Math.random()*14:2+Math.random()*4).toFixed(1)+"px");
    particle.style.setProperty("--rain-length",(28+Math.random()*72).toFixed(1)+"px");
    particle.style.setProperty("--rain-delay",(Math.random()*(mode==="reveal"?.38:.55)).toFixed(3)+"s");
    particle.style.setProperty("--rain-duration",((mode==="reveal"?.52:.68)+Math.random()*(mode==="reveal"?.5:.72)).toFixed(3)+"s");
    particle.style.setProperty("--rain-rot",(Math.random()*22-11).toFixed(1)+"deg");
    layer.appendChild(particle);
  }
  stage.appendChild(layer);
  setTimeout(()=>layer.remove(),mode==="reveal"?1800:2200);
}
function playGachaAnimation(results){
  const stage=$(".gacha-stage",pageRoot);
  const box=$("#gachaResult");
  if(!stage||!box){gachaAnimating=false;return}
  stage.classList.add("is-drawing");
  spawnGachaParticles(stage,"burst",58);
  spawnGachaStarRain(stage,"draw",results.length===10?46:30);
  box.className="gacha-result-grid gacha-result-grid-summon";
  box.innerHTML='<div class="gacha-summon"><span class="gacha-sigil">✦</span><b>SUMMONING</b><small>ARCHIVE LINK</small></div>';
  setTimeout(()=>{
    stage.classList.add("is-reveal");
    spawnGachaParticles(stage,"reveal",Math.min(68,30+results.length*4));
    spawnGachaStarRain(stage,"reveal",results.length===10?60:38);
    box.className="gacha-result-grid gacha-result-grid-reveal "+(results.length===10?"gacha-ten-draw":results.length===1?"gacha-single-draw":"gacha-multi-draw");
    box.innerHTML=results.map((result,index)=>{
      const i=result.item;
      const line=itemGachaLine(i);
      const delay=results.length===10?index*58:index*76;
      return '<div class="gacha-result-card gacha-reveal-card rarity-'+esc(i.rarity)+' '+(result.isNew?"is-new":"")+'" style="animation-delay:'+delay+'ms">'+
        (result.isNew?'<span class="gacha-new-badge">NEW</span>':'')+
        '<div class="gacha-result-icon">'+esc(itemEmoji(i))+'</div>'+
        '<span>'+esc(i.rarity)+'</span><strong>'+esc(i.name)+'</strong>'+
        '<small>'+esc(getCharacter(i.collectionCharacterId)?.name||"UNASSIGNED")+' · ×'+result.count+'</small>'+
        (line?'<p class="gacha-reveal-line"><b>REVEAL LINE</b>'+esc(line)+'</p>':'')+
        '</div>';
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
  saveProgressState();
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
  saveProgressState();
  if(!results.length){showToast("획득 가능한 아이템이 없습니다.");renderGacha();return}
  gachaAnimating=true;
  renderGacha();
  playGachaAnimation(results);
}
function collectionDetail(id){
  const i=itemById(id);if(!i)return;
  const count=itemCount(i.id),unlocked=hasEverAcquired(i.id);
  const wasNew=state.newItemIds.includes(i.id);
  if(wasNew){
    markItemSeen(i.id,state);
    saveProgressState();
    if(currentPage==="collection")renderCollection();
  }
  const sources=itemSourceTypes(i).join(" + ");
  const recent=state.itemHistory.filter(h=>h.itemId===i.id).slice(-5).reverse();
  const reveal=itemGachaLine(i);
  const giftArchive=enabledCharacters().map(ch=>{
    const reaction=giftReactionFor(i,ch);
    const discovered=isGiftPreferenceDiscovered(i.id,ch.id);
    const label=discovered?(reaction?.preference||"NO SPECIAL REACTION"):"???";
    const times=giftInteractionCount(i.id,ch.id);
    return '<div class="gift-archive-row"><span>'+esc(ch.name)+'</span><b>'+esc(label)+'</b><small>'+(times?times+' GIFTS':'UNTRIED')+'</small></div>';
  }).join("");
  openModal(unlocked?itemEmoji(i)+" "+i.name:"LOCKED",unlocked?
    '<p class="label">'+esc(i.rarity)+' · '+esc(i.category)+(i.secret?' · SECRET':'')+'</p>'+
    '<p style="line-height:1.7">'+esc(i.description||"설명 없음")+'</p>'+
    (reveal?'<section class="collection-gacha-reveal"><small>GACHA REVEAL</small><p>'+esc(reveal)+'</p></section>':'')+
    '<div class="collection-detail-meta"><span>COLLECTION · '+esc(getCharacter(i.collectionCharacterId)?.name||"미지정")+'</span><span>'+esc(sources)+'</span><span>'+esc(i.acquisitionMode.toUpperCase())+'</span><span>'+esc(i.giftUseMode.toUpperCase())+'</span>'+(state.collectionSettings.showOwnedCount?'<span>INVENTORY ×'+count+'</span>':'')+'</div>'+
    '<section class="gift-archive"><h3>GIFT REACTIONS</h3>'+giftArchive+'</section>'+
    (recent.length?'<div class="collection-history-mini">'+recent.map(h=>'<div><span>'+esc(h.source)+'</span><b>+'+h.amount+'</b></div>').join("")+'</div>':'')
    :'<p class="muted">아직 획득하지 않은 아이템입니다.</p>'+(i.acquisitionHint?'<section class="collection-gacha-reveal"><small>HINT</small><p>'+esc(i.acquisitionHint)+'</p></section>':''));
}
