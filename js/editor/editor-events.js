"use strict";
let lastValidationIssues=[];
function itemRewardSlug(value){return String(value||"").replace(/[^a-zA-Z0-9_-]+/g,"-")}
function linkedRewardEntryIds(item,eventId){
  const itemId=itemRewardSlug(item.id),safeEvent=itemRewardSlug(eventId);
  return new Set(["editor-item-reward-"+itemId,"dialogue-reward-"+safeEvent+"-"+itemId]);
}
function removeLinkedItemReward(item,eventId){
  const event=editorDraft.events.find(candidate=>candidate.id===eventId);
  if(!event)return;
  const ids=linkedRewardEntryIds(item,eventId);
  const removedEffectIds=[];
  event.entries=event.entries.filter(entry=>{
    if(!ids.has(entry.id))return true;
    for(const effect of entry.itemEffects||[])removedEffectIds.push(effect.id);
    return false;
  });
  if(removedEffectIds.length){
    const removed=new Set(removedEffectIds);
    editorDraft.claimedItemEffectIds=(editorDraft.claimedItemEffectIds||[]).filter(id=>!removed.has(id));
  }
}
function eventGrantsItem(event,itemId){
  let found=false;
  walkEntries(event?.entries||[],owner=>{
    if((owner.itemEffects||[]).some(effect=>effect.itemId===itemId))found=true;
  });
  return found;
}
function linkItemToInventoryEvent(item,eventId){
  const previous=item.inventoryEventId||"";
  if(previous)removeLinkedItemReward(item,previous);
  item.inventoryEventId=eventId||"";
  if(!eventId)return;
  const event=editorDraft.events.find(candidate=>candidate.id===eventId);
  if(!event)return;
  if(eventGrantsItem(event,item.id))return;
  const character=getCharacterDraft(event.characterId);
  const entryId="editor-item-reward-"+itemRewardSlug(item.id);
  event.entries.push(normalizeEntry({
    id:entryId,
    type:"narration",
    text:`대화를 마치자 ${character?.name||"상대"}가 「${item.name}」을(를) 건넨다.`,
    itemEffects:[{id:entryId+"-grant",itemId:item.id,amount:1,once:true}]
  }));
}
function renderValidationReport(){
  if(!editorDraft)return;
  $$(".editor-nav").forEach(b=>b.classList.remove("active"));
  const issues=validateDraft(editorDraft);
  lastValidationIssues=issues;
  const counts={
    error:issues.filter(x=>x.level==="error").length,
    warning:issues.filter(x=>x.level==="warning").length,
    info:issues.filter(x=>x.level==="info").length
  };
  editorBody.innerHTML=editorHead("CHECK","프로젝트 검사","삭제된 참조와 비어 있는 콘텐츠, 설정 충돌을 저장 전에 확인합니다.",'<button class="small-button" data-action="run-validation">다시 검사</button>')+
    '<div class="validation-summary"><div><b>'+counts.error+'</b><span>ERROR</span></div><div><b>'+counts.warning+'</b><span>WARNING</span></div><div><b>'+counts.info+'</b><span>INFO</span></div></div>'+
    (issues.length?'<div class="validation-list">'+issues.map((x,index)=>'<button type="button" class="validation-row '+x.level+'" data-action="validation-jump" data-index="'+index+'"><span>'+esc(x.level.toUpperCase())+'</span><div><strong>'+esc(x.area)+'</strong><p>'+esc(x.text)+'</p></div><em>수정 →</em></button>').join("")+'</div>':'<div class="validation-clean"><strong>문제를 찾지 못했습니다.</strong><p>현재 편집 중인 프로젝트 구조가 정상입니다.</p></div>');
}
function jumpToValidationIssue(issue){
  if(!issue||!editorDraft)return;
  const parts=String(issue.area||"").split(" · ");
  const area=parts[0];
  if(area==="EVENT"){
    selectedEditorEventId=editorDraft.events.find(item=>item.name===parts[1])?.id||editorDraft.events[0]?.id||"";
    editorTab="dialogue";dialogueSubtab=editorEventRole(editorDraft.events.find(item=>item.id===selectedEditorEventId));
    editorEventQuery="";
    editorEventPage=Math.max(0,Math.floor(Math.max(0,editorDraft.events.findIndex(item=>item.id===selectedEditorEventId))/EDITOR_EVENT_PAGE_SIZE));
  }else if(area==="ASK"){
    editorTab="ask";
    selectedAskId=editorDraft.asks.find(item=>item.label===parts[1])?.id||editorDraft.asks[0]?.id||"";
    editorAskQuery="";
    editorAskPage=Math.max(0,Math.floor(Math.max(0,editorDraft.asks.findIndex(item=>item.id===selectedAskId))/EDITOR_ASK_PAGE_SIZE));
  }else if(area==="ITEM"||area.startsWith("GIFT")){
    editorTab="item";
    selectedItemId=editorDraft.items.find(item=>item.name===parts[1])?.id||editorDraft.items[0]?.id||"";
    editorItemQuery="";editorItemCharacterFilter="ALL";editorItemRarityFilter="ALL";editorItemCategoryFilter="ALL";
    editorItemPage=Math.max(0,Math.floor(Math.max(0,editorDraft.items.findIndex(item=>item.id===selectedItemId))/EDITOR_ITEM_PAGE_SIZE));
  }else if(area==="THOUGHT"){
    editorTab="thought";
    const character=editorDraft.characters.find(item=>item.name===parts[1]);
    selectedThoughtId=editorDraft.thoughts.find(item=>!character||item.characterId===character.id)?.id||editorDraft.thoughts[0]?.id||"";
    editorThoughtQuery="";
    editorThoughtPage=Math.max(0,Math.floor(Math.max(0,editorDraft.thoughts.findIndex(item=>item.id===selectedThoughtId))/EDITOR_THOUGHT_PAGE_SIZE));
  }else if(area==="GACHA"){
    editorTab="gacha";
  }else{
    editorTab="dialogue";dialogueSubtab="characters";
  }
  renderEditor();
  requestAnimationFrame(()=>editorBody.scrollTo({top:0,behavior:"smooth"}));
}
const CHARACTER_IMAGE_MAX_INPUT_BYTES=12*1024*1024;
const CHARACTER_IMAGE_MAX_STORED_CHARS=4_000_000;
function readEditorImageFile(file){
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=()=>resolve(String(reader.result||""));
    reader.onerror=()=>reject(new Error("이미지 파일을 읽지 못했습니다."));
    reader.readAsDataURL(file);
  });
}
async function optimizeCharacterImageFile(file){
  if(!file||!String(file.type||"").startsWith("image/"))throw new Error("이미지 파일만 선택할 수 있습니다.");
  if(file.size>CHARACTER_IMAGE_MAX_INPUT_BYTES)throw new Error("이미지가 너무 큽니다. 12MB 이하 파일을 선택해주세요.");
  const raw=await readEditorImageFile(file);
  if(file.type==="image/gif"){
    if(raw.length>CHARACTER_IMAGE_MAX_STORED_CHARS)throw new Error("GIF가 너무 큽니다. 3MB 안팎의 더 작은 파일을 사용해주세요.");
    return raw;
  }
  const optimized=await new Promise((resolve,reject)=>{
    const image=new Image();
    image.onload=()=>{
      try{
        const longest=Math.max(image.naturalWidth||1,image.naturalHeight||1);
        const scale=Math.min(1,1400/longest);
        const width=Math.max(1,Math.round((image.naturalWidth||1)*scale));
        const height=Math.max(1,Math.round((image.naturalHeight||1)*scale));
        const canvas=document.createElement("canvas");
        canvas.width=width;canvas.height=height;
        const context=canvas.getContext("2d");
        if(!context)throw new Error("이미지 변환을 시작할 수 없습니다.");
        context.drawImage(image,0,0,width,height);
        resolve(canvas.toDataURL("image/webp",.86));
      }catch(error){reject(error)}
    };
    image.onerror=()=>reject(new Error("이미지를 해석하지 못했습니다."));
    image.src=raw;
  });
  if(!String(optimized).startsWith("data:image/"))throw new Error("이미지 변환에 실패했습니다.");
  if(String(optimized).length>CHARACTER_IMAGE_MAX_STORED_CHARS)throw new Error("압축 후에도 이미지가 너무 큽니다. 더 작은 이미지를 사용해주세요.");
  return String(optimized);
}
async function handleCharacterImageFile(input){
  const file=input?.files?.[0];
  if(!file)return;
  const character=editorDraft?.characters.find(row=>row.id===selectedEditorCharacterId);
  if(!character)return;
  const before=serializeEditorDraft();
  try{
    character.image=await optimizeCharacterImageFile(file);
    if(!editorLargeProject&&before!==serializeEditorDraft()){
      if(editorUndoStack.at(-1)!==before)editorUndoStack.push(before);
      if(editorUndoStack.length>12)editorUndoStack.shift();
      editorRedoStack=[];
      updateEditorHistoryButtons();
    }
    markEditorDirty();
    renderCharacterManager();
  }catch(error){
    input.value="";
    alert(error?.message||"이미지를 불러오지 못했습니다.");
  }
}
async function handleEmotionImageFile(input){
  const file=input?.files?.[0];
  const emotionId=input?.dataset.emotionImageFile;
  if(!file||!EMOTIONS.some(([id])=>id===emotionId))return;
  const character=editorDraft?.characters.find(row=>row.id===selectedEditorCharacterId);
  if(!character)return;
  const before=serializeEditorDraft();
  try{
    character.emotionImages=normalizeEmotionImages(character.emotionImages);
    character.emotionImages[emotionId].image=await optimizeCharacterImageFile(file);
    if(!editorLargeProject&&before!==serializeEditorDraft()){
      if(editorUndoStack.at(-1)!==before)editorUndoStack.push(before);
      if(editorUndoStack.length>12)editorUndoStack.shift();
      editorRedoStack=[];
      updateEditorHistoryButtons();
    }
    markEditorDirty();
    renderCharacterImageEditor();
  }catch(error){
    alert(error?.message||"이미지를 불러오지 못했습니다.");
  }finally{
    input.value="";
  }
}

/* APP EVENTS */
originChoice.addEventListener("click",e=>{
  const b=e.target.closest("[data-origin]");if(!b)return;
  pendingOrigin=b.dataset.origin;$$("[data-origin]",originChoice).forEach(x=>x.classList.toggle("active",x===b));startHint.textContent="";
});
startForm.addEventListener("submit",event=>{
  event.preventDefault();
  enterGame();
});
$("#changeProfileButton").addEventListener("click",()=>currentPage==="room"?beginRoomExit("profile"):renderStart());
$("#brandButton").addEventListener("click",()=>currentPage==="room"?beginRoomExit("home"):setPage("home"));
$("#dataButton").addEventListener("click",showDataManager);
$("#editorButton").addEventListener("click",openEditor);
$("#startImportButton").addEventListener("click",openImportPicker);
$("#updateBanner").addEventListener("click",()=>{
  const url=new URL(location.href);
  url.searchParams.set("updated",String(Date.now()));
  location.replace(url.href);
});
document.querySelectorAll(".nav-button").forEach(b=>b.addEventListener("click",()=>currentPage==="room"?beginRoomExit(b.dataset.page):setPage(b.dataset.page)));
$("#editorUndoButton").addEventListener("click",editorUndo);
$("#editorRedoButton").addEventListener("click",editorRedo);
$("#editorRestoreButton").addEventListener("click",restoreEditorSnapshot);
$("#editorCheckButton").addEventListener("click",renderValidationReport);
$("#editorCancelButton").addEventListener("click",()=>closeEditor());
$("#editorSaveButton").addEventListener("click",saveEditor);
$$(".editor-nav").forEach(b=>b.addEventListener("click",()=>{editorTab=b.dataset.editorTab;renderEditor()}));

modalRoot.addEventListener("click",e=>{
  if(e.target.matches("[data-close-modal]")){closeModal();return}
  const b=e.target.closest("[data-data-action]");if(!b)return;
  const a=b.dataset.dataAction;
  if(a==="save-slot")saveBackupSlot(Number(b.dataset.slot)||0);
  else if(a==="load-slot")loadBackupSlot(Number(b.dataset.slot)||0);
  else if(a==="restore-safety")restoreSafetySnapshot();
  else if(a==="export")exportData();
  else if(a==="confirm-import")confirmPendingImport();
  else if(a==="reset-progress")resetPlayProgress();
});
modalRoot.addEventListener("input",e=>{
  if(e.target.id==="prefTextSpeed"){prefs.textSpeed=Number(e.target.value);savePrefs()}
  if(e.target.id==="prefAutoDelay"){prefs.autoDelay=Number(e.target.value);savePrefs()}
});
modalRoot.addEventListener("change",e=>{
  if(e.target.id==="prefStageClick"){prefs.stageClick=e.target.checked;savePrefs()}
  if(e.target.id==="dataImportFile")importDataFile(e.target.files?.[0]);
});

pageRoot.addEventListener("click",e=>{
  const b=e.target.closest("[data-action]");if(!b)return;
  const a=b.dataset.action;
  if(a==="open-editor")openEditor();
  else if(a==="open-import")openImportPicker();
  else if(a==="character-open"){
    const id=b.dataset.id;
    const chars=enabledCharacters();
    const index=chars.findIndex(ch=>ch.id===id);
    if(index>=0)homeIndex=index;
    selectedCharacterId=id;
    startDialogue(id);
  }
  else if(a==="character-favorite"){
    const id=b.dataset.id;
    state.favoriteCharacterIds ||= [];
    state.favoriteCharacterIds=state.favoriteCharacterIds.includes(id)
      ? state.favoriteCharacterIds.filter(x=>x!==id)
      : [...state.favoriteCharacterIds,id];
    saveProgressState();renderCharacters();
  }
  else if(a==="character-favorites"){characterFavoritesOnly=!characterFavoritesOnly;renderCharacters()}
  else if(a==="toggle-room-tools"){roomToolsOpen=!roomToolsOpen;renderRoom()}
  else if(a==="home-prev"){const n=enabledCharacters().length;homeIndex=(homeIndex-1+n)%n;renderHome()}
  else if(a==="home-next"){const n=enabledCharacters().length;homeIndex=(homeIndex+1)%n;renderHome()}
  else if(a==="talk")startDialogue(selectedCharacterId);
  else if(a==="room-mode"){
    if(activeInteractionReaction||interactionContext?.followupActive||interactionCompleteMenu)return;
    roomMode=b.dataset.mode||"talk";
    roomToolsOpen=false;
    autoMode=false;clearAuto();
    renderRoom();
  }
  else if(a==="ask-topic")startAsk(b.dataset.id);
  else if(a==="inventory-preview"){selectedInventoryItemId=b.dataset.id;renderInventoryPanel()}
  else if(a==="give-item")useInventoryItem(b.dataset.id);
  else if(a==="inventory-unknown"){inventoryUnknownOnly=!inventoryUnknownOnly;renderInventoryPanel()}
  else if(a==="shuffle-talk")shuffleTalk();
  else if(a==="interaction-after")finishInteractionChoice(b.dataset.mode);
  else if(a==="finish-interaction")finishInteractionReaction();
  else if(a==="back-home"){beginRoomExit("home")}
  else if(a==="random-thought")randomThought();
  else if(a==="show-affection")showAffection();
  else if(a==="show-emotion")showEmotion();
  else if(a==="show-log")showLog();
  else if(a==="show-history")showInteractionHistory();
  else if(a==="open-play-settings")showPlaySettings();
  else if(a==="toggle-auto"){autoMode=!autoMode;b.classList.toggle("active",autoMode);if(autoMode)scheduleAuto();else clearAuto()}
  else if(a==="advance-dialogue")advanceDialogue(false);
  else if(a==="choose-option")chooseOption(b.dataset.id);
  else if(a==="draw-gacha")drawGacha(Number(b.dataset.count)||1);
  else if(a==="clear-gacha-history")clearGachaHistory();
  else if(a==="thought-filter"){thoughtFilter=b.dataset.id;renderThought()}
  else if(a==="collection-filter"){
    collectionFilter=b.dataset.id;
    if(collectionFilter!=="ALL"){
      state.collectionSettings.expandedCharacterIds ||= [];
      if(!state.collectionSettings.expandedCharacterIds.includes(collectionFilter)){
        state.collectionSettings.expandedCharacterIds.push(collectionFilter);
        saveProgressState();
      }
    }
    renderCollection();
  }
  else if(a==="collection-group-toggle"){
    const id=b.dataset.id;if(!id)return;
    state.collectionSettings.expandedCharacterIds ||= [];
    state.collectionSettings.expandedCharacterIds=state.collectionSettings.expandedCharacterIds.includes(id)
      ? state.collectionSettings.expandedCharacterIds.filter(x=>x!==id)
      : [...state.collectionSettings.expandedCharacterIds,id];
    saveProgressState();
    renderCollection();
  }
  else if(a==="collection-view"){
    state.collectionSettings.view=b.dataset.view==="all"?"all":"grouped";
    saveProgressState();
    renderCollection();
  }
  else if(a==="collection-detail")collectionDetail(b.dataset.id);
});
pageRoot.addEventListener("input",e=>{
  const t=e.target;
  if(t.dataset.inventoryControl==="query"){
    inventoryQuery=t.value;
    renderInventoryPanel();
    const input=$('[data-inventory-control="query"]',pageRoot);
    if(input){input.focus();try{input.setSelectionRange(input.value.length,input.value.length)}catch{}}
    return;
  }
  if(t.dataset.characterControl==="query"){
    characterQuery=t.value;
    renderCharacters();
    const input=$('[data-character-control="query"]',pageRoot);
    if(input){input.focus();try{input.setSelectionRange(input.value.length,input.value.length)}catch{}}
    return;
  }
  if(t.dataset.collectionControl==="query"){
    collectionQuery=t.value;
    const pos=window.scrollY;
    renderCollection();
    window.scrollTo(0,pos);
    const input=$('[data-collection-control="query"]',pageRoot);
    if(input){input.focus();try{input.setSelectionRange(input.value.length,input.value.length)}catch{}}
  }
});
pageRoot.addEventListener("change",e=>{
  const t=e.target;
  if(t.dataset.inventoryControl){
    if(t.dataset.inventoryControl==="category")inventoryCategory=t.value;
    if(t.dataset.inventoryControl==="preference")inventoryPreference=t.value;
    renderInventoryPanel();
    return;
  }
  if(t.dataset.characterControl){
    if(t.dataset.characterControl==="realm")characterRealmFilter=t.value;
    renderCharacters();
    return;
  }
  if(t.id==="roomEventSelect"){
    roomMode="talk";
    startDialogue(selectedCharacterId,t.value);
    return;
  }
  if(t.dataset.collectionControl){
    const k=t.dataset.collectionControl;
    if(k==="rarity")collectionRarity=t.value;
    if(k==="category")collectionCategory=t.value;
    if(k==="status")collectionStatus=t.value;
    if(k==="source")collectionSource=t.value;
    if(k==="sort"){state.collectionSettings.sort=t.value;saveState()}
    renderCollection();
  }
});
pageRoot.addEventListener("click",e=>{
  if(currentPage!=="room"||roomMode!=="talk"||!prefs.stageClick||interactionCompleteMenu)return;
  if(e.target.closest("button,input,select,textarea"))return;
  const frame=playback?.frames?.at(-1),entry=frame?frameEntries(frame)[frame.index]:null;
  if(entry&&entry.type!=="choice")advanceDialogue(false);
});

editorBody.addEventListener("click",e=>{
  const b=e.target.closest("[data-action]");if(!b)return;
  const a=b.dataset.action;
  if(a==="run-validation"){renderValidationReport();return}
  if(a==="validation-jump"){jumpToValidationIssue(lastValidationIssues[Number(b.dataset.index)]);return}
  if(a==="editor-page"){
    const kind=b.dataset.kind;
    const page=Math.max(0,Number(b.dataset.page)||0);
    if(kind==="event"){editorEventPage=page;renderEventManager()}
    else if(kind==="ask"){editorAskPage=page;renderAskEditor()}
    else if(kind==="item"){editorItemPage=page;renderItemEditor()}
    else if(kind==="thought"){editorThoughtPage=page;renderThoughtEditor()}
    return;
  }
  if(isEditorDeleteAction(a)&&!confirm("정말 삭제할까요? 연결된 참조는 가능한 범위에서 함께 정리됩니다."))return;
  if(isEditorMutationAction(a))checkpointEditor();

  if(a==="mini-add-entry"||a==="mini-add-branch"){
    const rootList=getInteractionFlowList(b.dataset.flowScope,b.dataset.flowOwnerId,b.dataset.flowItemId,b.dataset.flowKey);
    if(!rootList)return;
    const targetOption=b.dataset.parentOptionId?findFlowOption(rootList,b.dataset.parentOptionId):null;
    const list=targetOption?targetOption.entries:rootList;
    list.push(makeEntry(b.dataset.type||"dialogue"));
    refreshInteractionEditor(b.dataset.flowScope);return;
  }
  if(a==="mini-delete-entry"){
    const rootList=getInteractionFlowList(b.dataset.flowScope,b.dataset.flowOwnerId,b.dataset.flowItemId,b.dataset.flowKey);
    const ctx=rootList?findFlowEntryContext(rootList,b.dataset.miniEntryId):null;
    if(ctx)ctx.list.splice(ctx.index,1);
    refreshInteractionEditor(b.dataset.flowScope);return;
  }
  if(a==="mini-add-option"){
    const rootList=getInteractionFlowList(b.dataset.flowScope,b.dataset.flowOwnerId,b.dataset.flowItemId,b.dataset.flowKey);
    const ctx=rootList?findFlowEntryContext(rootList,b.dataset.miniEntryId):null;
    if(ctx?.entry.type==="choice")ctx.entry.options.push(makeOption("선택지 "+(ctx.entry.options.length+1)));
    refreshInteractionEditor(b.dataset.flowScope);return;
  }
  if(a==="mini-delete-option"){
    const rootList=getInteractionFlowList(b.dataset.flowScope,b.dataset.flowOwnerId,b.dataset.flowItemId,b.dataset.flowKey);
    if(rootList)removeFlowOption(rootList,b.dataset.miniOptionId);
    refreshInteractionEditor(b.dataset.flowScope);return;
  }
  if(a==="dialogue-subtab"){dialogueSubtab=b.dataset.id;renderDialogueEditor();return}
  if(a==="new-character"){
    const c=normalizeCharacter({id:uid("char"),name:"새 캐릭터"});editorDraft.characters.push(c);selectedEditorCharacterId=c.id;renderCharacterManager();return;
  }
  if(a==="select-character"){selectedEditorCharacterId=b.dataset.id;renderCharacterManager();return}
  if(a==="select-image-character"){selectedEditorCharacterId=b.dataset.id;renderCharacterImageEditor();return}
  if(a==="clear-emotion-image"){
    const character=editorDraft.characters.find(row=>row.id===selectedEditorCharacterId);
    const emotionId=b.dataset.emotion;
    if(!character||!EMOTIONS.some(([id])=>id===emotionId))return;
    checkpointEditor();
    character.emotionImages=normalizeEmotionImages(character.emotionImages);
    character.emotionImages[emotionId].image="";
    markEditorDirty();
    renderCharacterImageEditor();
    return;
  }
  if(a==="clear-character-image"){
    const character=editorDraft.characters.find(row=>row.id===selectedEditorCharacterId);
    if(!character||!character.image)return;
    checkpointEditor();
    character.image="";
    markEditorDirty();
    renderCharacterManager();
    return;
  }
  if(a==="delete-character"){
    const id=selectedEditorCharacterId;editorDraft.characters=editorDraft.characters.filter(c=>c.id!==id);
    editorDraft.favoriteCharacterIds=(editorDraft.favoriteCharacterIds||[]).filter(x=>x!==id);
    cleanCharacterReference(id);
    editorDraft.events.forEach(ev=>{if(ev.characterId===id)ev.characterId=""});
    editorDraft.thoughts.forEach(t=>{if(t.characterId===id)t.characterId=""});
    editorDraft.asks.forEach(a=>{if(a.characterId===id)a.characterId=""});
    editorDraft.items.forEach(i=>{
      if(i.collectionCharacterId===id)i.collectionCharacterId="";
      i.reactions.forEach(r=>{if(r.characterId===id)r.characterId=""});
    });
    selectedEditorCharacterId=editorDraft.characters[0]?.id||"";renderCharacterManager();return;
  }
  if(a==="new-variable"){editorDraft.variables.push(normalizeVariable({id:uid("var"),name:"새 변수"}));renderVariableManager();return}
  if(a==="delete-variable"){
    const row=b.closest("[data-var-id]");const id=row?.dataset.varId;if(!id)return;
    editorDraft.variables=editorDraft.variables.filter(v=>v.id!==id);
    cleanVariableReference(id);
    renderVariableManager();return;
  }
  if(a==="new-event"){
    const role=DIALOGUE_EVENT_ROLES.has(dialogueSubtab)?dialogueSubtab:"talk";
    const defaultCharacterId=editorCharacterScope!=="ALL"?editorCharacterScope:(selectedEditorCharacterId||editorDraft.characters[0]?.id||"");
    const ev=normalizeEvent({id:uid("event"),name:"새 "+role.toUpperCase()+" 이벤트",eventRole:role,menuVisible:["talk","action"].includes(role),characterId:defaultCharacterId});
    editorDraft.events.push(ev);
    selectedEditorEventId=ev.id;
    selectedEntryId="";
    editorEventQuery="";
    editorEventPage=Math.max(0,Math.ceil(editorDraft.events.filter(item=>editorEventRole(item)===role).length/EDITOR_EVENT_PAGE_SIZE)-1);
    renderEventManager();return;
  }
  if(a==="select-event"){
    selectedEditorEventId=b.dataset.id;
    selectedEntryId="";
    editorContinuationQuery="";
    renderEventManager();return
  }
  if(a==="delete-event"){
    const id=selectedEditorEventId;editorDraft.events=editorDraft.events.filter(x=>x.id!==id);
    editorDraft.discoveredTalkIds=(editorDraft.discoveredTalkIds||[]).filter(x=>x!==id);
    editorDraft.events.forEach(x=>{
      x.continuationEventIds=(x.continuationEventIds||[]).filter(nextId=>nextId!==id);
    });
    editorDraft.asks.forEach(a=>{if(a.eventId===id)a.eventId=""});
    editorDraft.items.forEach(i=>{if(i.inventoryEventId===id)i.inventoryEventId=""});
    sanitizeOptionTargets(editorDraft.events,id);
    selectedEditorEventId=editorDraft.events.find(item=>editorEventRole(item)===dialogueSubtab)?.id||"";selectedEntryId="";renderEventManager();return;
  }
  if(a==="add-continuation"){
    const ev=editorDraft.events.find(x=>x.id===selectedEditorEventId);
    const id=b.dataset.id;
    if(!ev||!id||id===ev.id||!editorDraft.events.some(x=>x.id===id))return;
    ev.continuationEventIds ||= [];
    if(!ev.continuationEventIds.includes(id))ev.continuationEventIds.push(id);
    editorContinuationQuery="";
    renderEventManager();return;
  }
  if(a==="move-continuation"){
    const ev=editorDraft.events.find(x=>x.id===selectedEditorEventId);if(!ev)return;
    const list=ev.continuationEventIds||[];
    const i=list.indexOf(b.dataset.id),ni=i+Number(b.dataset.dir);
    if(i<0||ni<0||ni>=list.length)return;
    [list[i],list[ni]]=[list[ni],list[i]];
    renderEventManager();return;
  }
  if(a==="remove-continuation"){
    const ev=editorDraft.events.find(x=>x.id===selectedEditorEventId);if(!ev)return;
    ev.continuationEventIds=(ev.continuationEventIds||[]).filter(id=>id!==b.dataset.id);
    renderEventManager();return;
  }
  if(a==="add-entry"){
    const ev=editorDraft.events.find(x=>x.id===selectedEditorEventId);if(!ev)return;
    const ne=makeEntry(b.dataset.type);ev.entries.push(ne);selectedEntryId=ne.id;renderEventManager();return;
  }
  if(a==="select-entry"){selectedEntryId=b.dataset.id;renderEventManager();return}
  if(a==="move-entry"){
    const ctx=findEntryContext(selectedEntryId);if(!ctx)return;const ni=ctx.index+Number(b.dataset.dir);
    if(ni<0||ni>=ctx.list.length)return;[ctx.list[ctx.index],ctx.list[ni]]=[ctx.list[ni],ctx.list[ctx.index]];renderEventManager();return;
  }
  if(a==="duplicate-entry"){
    const ctx=findEntryContext(selectedEntryId);if(!ctx)return;const cp=clone(ctx.entry);regenerateIds(cp);ctx.list.splice(ctx.index+1,0,cp);selectedEntryId=cp.id;renderEventManager();return;
  }
  if(a==="delete-entry"){
    const ctx=findEntryContext(selectedEntryId);if(!ctx)return;ctx.list.splice(ctx.index,1);selectedEntryId=ctx.list[Math.min(ctx.index,ctx.list.length-1)]?.id||ctx.ancestors.at(-1)?.choice?.id||"";renderEventManager();return;
  }
  if(a==="add-option"){
    const ctx=findEntryContext(selectedEntryId);if(ctx?.entry.type!=="choice")return;ctx.entry.options.push(makeOption("선택지 "+(ctx.entry.options.length+1)));renderEventManager();return;
  }
  const optionCard=b.closest("[data-option-id]");
  const choice=findEntryContext(selectedEntryId)?.entry;
  const option=choice?.type==="choice"&&optionCard?choice.options.find(o=>o.id===optionCard.dataset.optionId):null;
  if(a==="delete-option"&&option){choice.options=choice.options.filter(o=>o.id!==option.id);renderEventManager();return}
  if(a==="move-option"&&option){
    const i=choice.options.indexOf(option),ni=i+Number(b.dataset.dir);if(ni<0||ni>=choice.options.length)return;
    [choice.options[i],choice.options[ni]]=[choice.options[ni],choice.options[i]];renderEventManager();return;
  }
  if(a==="add-branch"&&option){
    const ne=makeEntry(b.dataset.type);option.entries.push(ne);selectedEntryId=ne.id;renderEventManager();return;
  }
  if(a==="move-branch"&&option){
    const i=Number(b.dataset.index),ni=i+Number(b.dataset.dir);if(ni<0||ni>=option.entries.length)return;
    [option.entries[i],option.entries[ni]]=[option.entries[ni],option.entries[i]];renderEventManager();return;
  }
  if(a==="delete-branch"&&option){option.entries.splice(Number(b.dataset.index),1);renderEventManager();return}
  if(["add-fx","add-afffx","add-emofx","add-itemfx"].includes(a)){
    const owner=getSelectedOwner(b.dataset.kind,b);if(!owner)return;
    if(a==="add-fx")owner.effects.push({id:uid("fx"),variableId:editorDraft.variables[0]?.id||"",operation:"set",value:"0"});
    if(a==="add-afffx")owner.affectionEffects.push({id:uid("afx"),characterId:editorDraft.characters[0]?.id||"",amount:1});
    if(a==="add-emofx"){const c=editorDraft.characters[0];owner.emotionEffects.push({id:uid("efx"),characterId:c?.id||"",state:c?.emotionDefault||"calm",intensity:c?.emotionIntensity||0})}
    if(a==="add-itemfx"){owner.itemEffects ||= [];owner.itemEffects.push({id:uid("itemfx"),itemId:editorDraft.items[0]?.id||"",amount:1,once:true})}
    refreshOwnerEditor(b.dataset.kind,b);return;
  }
  if(["delete-fx","delete-afffx","delete-emofx","delete-itemfx"].includes(a)){
    const kind=b.dataset.kind||b.closest("[data-fx-kind],[data-afffx-kind],[data-emofx-kind],[data-itemfx-kind]")?.dataset?.kind;
    const owner=getSelectedOwner(kind||"entry",b);if(!owner)return;
    const fr=b.closest("[data-fx-id]"),ar=b.closest("[data-afffx-id]"),er=b.closest("[data-emofx-id]"),ir=b.closest("[data-itemfx-id]");
    if(fr)owner.effects=owner.effects.filter(x=>x.id!==fr.dataset.fxId);
    if(ar)owner.affectionEffects=owner.affectionEffects.filter(x=>x.id!==ar.dataset.afffxId);
    if(er)owner.emotionEffects=owner.emotionEffects.filter(x=>x.id!==er.dataset.emofxId);
    if(ir)owner.itemEffects=(owner.itemEffects||[]).filter(x=>x.id!==ir.dataset.itemfxId);
    refreshOwnerEditor(kind||"entry",b);return;
  }
  if(a==="new-ask"){
    const ask=normalizeAsk({id:uid("ask"),characterId:editorCharacterScope!=="ALL"?editorCharacterScope:(editorDraft.characters[0]?.id||"")});
    editorDraft.asks.push(ask);
    selectedAskId=ask.id;
    editorAskQuery="";
    editorAskPage=Math.max(0,Math.ceil(editorDraft.asks.length/EDITOR_ASK_PAGE_SIZE)-1);
    renderAskEditor();return;
  }
  if(a==="select-ask"){selectedAskId=b.dataset.id;renderAskEditor();return}
  if(a==="delete-ask"){
    const row=b.closest("[data-ask-id]");const id=row?.dataset.askId;if(!id)return;
    editorDraft.asks=editorDraft.asks.filter(a=>a.id!==id);
    cleanAskReference(id);
    selectedAskId=editorDraft.asks[0]?.id||"";
    renderAskEditor();return;
  }
  if(a==="add-item-category"){
    const input=$("#newItemCategoryInput",editorBody);
    const value=input?.value.trim();
    if(value&&!editorDraft.itemCategories.includes(value)){
      editorDraft.itemCategories.push(value);
      renderItemEditor();
    }
    return;
  }
  if(a==="delete-item-category"){
    const value=b.dataset.id;
    if(value&&value!=="기타"){
      editorDraft.itemCategories=editorDraft.itemCategories.filter(cat=>cat!==value);
      editorDraft.items.forEach(item=>{if(item.category===value)item.category="기타"});
      if(editorItemCategoryFilter===value)editorItemCategoryFilter="ALL";
      renderItemEditor();
    }
    return;
  }
  if(a==="new-item"){
    const item=normalizeItem({id:uid("item"),collectionCharacterId:editorCharacterScope!=="ALL"?editorCharacterScope:(editorDraft.characters[0]?.id||"")});
    editorDraft.items.push(item);
    selectedItemId=item.id;
    editorItemQuery="";
    editorItemCharacterFilter=editorCharacterScope;
    editorItemRarityFilter="ALL";
    editorItemCategoryFilter="ALL";
    editorItemPage=Math.max(0,Math.ceil(editorDraft.items.length/EDITOR_ITEM_PAGE_SIZE)-1);
    renderItemEditor();return;
  }
  if(a==="select-item"){selectedItemId=b.dataset.id;renderItemEditor();return}
  if(a==="new-item-reaction"){
    const item=editorDraft.items.find(i=>i.id===b.dataset.itemId);if(!item)return;
    const character=editorDraft.characters.find(ch=>!item.reactions.some(reaction=>reaction.characterId===ch.id))||editorDraft.characters[0];
    const generated=character&&autoItemReactionForEditor(item,character);
    item.reactions.push(generated||normalizeItemReaction({id:uid("item-reaction"),characterId:character?.id||"",preference:"NEUTRAL",affectionDelta:1,entries:[]}));
    renderItemEditor();return;
  }
  if(a==="materialize-item-reaction"){
    const item=editorDraft.items.find(candidate=>candidate.id===b.dataset.itemId);
    const character=editorDraft.characters.find(candidate=>candidate.id===b.dataset.characterId);
    if(!item||!character||item.reactions.some(reaction=>reaction.characterId===character.id))return;
    const generated=autoItemReactionForEditor(item,character);
    if(generated)item.reactions.push(generated);
    renderItemEditor();return;
  }
  if(a==="delete-item-reaction"){
    const card=b.closest("[data-reaction-id]");
    const item=editorDraft.items.find(i=>i.id===card?.dataset.itemId);if(!item)return;
    item.reactions=item.reactions.filter(r=>r.id!==card.dataset.reactionId);
    renderItemEditor();return;
  }
  if(a==="delete-item"){
    const row=b.closest("[data-item-id]");const id=row?.dataset.itemId;if(!id)return;
    editorDraft.items=editorDraft.items.filter(i=>i.id!==id);
    cleanItemReference(id);
    delete editorDraft.inventoryCounts[id];
    editorDraft.newItemIds=(editorDraft.newItemIds||[]).filter(x=>x!==id);
    editorDraft.itemHistory=(editorDraft.itemHistory||[]).filter(h=>h.itemId!==id);
    editorDraft.discoveredGiftReactionKeys=(editorDraft.discoveredGiftReactionKeys||[]).filter(k=>!k.startsWith(id+"::"));
    editorDraft.discoveredSpecialGiftKeys=(editorDraft.discoveredSpecialGiftKeys||[]).filter(k=>!k.startsWith(id+"::"));
    editorDraft.giftInteractionCounts=Object.fromEntries(Object.entries(editorDraft.giftInteractionCounts||{}).filter(([k])=>!k.startsWith(id+"::")));
    editorDraft.interactionHistory=(editorDraft.interactionHistory||[]).filter(h=>h.itemId!==id);
    selectedItemId=editorDraft.items[0]?.id||"";
    renderItemEditor();return;
  }
  if(a==="new-thought"){
    const t=normalizeThought({id:uid("thought"),characterId:editorCharacterScope!=="ALL"?editorCharacterScope:(editorDraft.characters[0]?.id||""),category:editorDraft.thoughtSettings.categories[0]||"일상"});
    editorDraft.thoughts.push(t);
    selectedThoughtId=t.id;
    editorThoughtQuery="";
    editorThoughtPage=Math.max(0,Math.ceil(editorDraft.thoughts.length/EDITOR_THOUGHT_PAGE_SIZE)-1);
    renderThoughtEditor();return
  }
  if(a==="select-thought"){selectedThoughtId=b.dataset.id;renderThoughtEditor();return}
  if(a==="delete-thought"){
    const row=b.closest("[data-thought-id]");
    const id=row?.dataset.thoughtId;if(!id)return;
    editorDraft.thoughts=editorDraft.thoughts.filter(t=>t.id!==id);
    selectedThoughtId=editorDraft.thoughts[0]?.id||"";
    renderThoughtEditor();return
  }
  if(a==="add-category"){const inp=$("#newCategoryInput",editorBody);const v=inp?.value.trim();if(v&&!editorDraft.thoughtSettings.categories.includes(v)){editorDraft.thoughtSettings.categories.push(v);renderThoughtEditor()}return}
  if(a==="delete-category"){const v=b.dataset.id;editorDraft.thoughtSettings.categories=editorDraft.thoughtSettings.categories.filter(c=>c!==v);editorDraft.thoughts.forEach(t=>{if(t.category===v)t.category=editorDraft.thoughtSettings.categories[0]||"일상"});renderThoughtEditor();return}
});
function sanitizeOptionTargets(events,removedId){
  function scan(entries){entries.forEach(e=>{if(e.type==="choice")e.options.forEach(o=>{if(o.targetEventId===removedId)o.targetEventId="";scan(o.entries)})})}
  events.forEach(e=>scan(e.entries));
}

editorBody.addEventListener("focusin",e=>{
  if(
    !editorLargeProject&&
    e.target.matches("input,textarea,select")&&
    !e.target.dataset.itemEditorFilter&&
    !e.target.dataset.editorSearch&&
    !e.target.hasAttribute("data-editor-character-scope")&&
    !e.target.hasAttribute("data-continuation-search")
  ){
    e.target.dataset.undoStart=serializeEditorDraft();
  }
});
editorBody.addEventListener("input",e=>{
  if(!e.target.dataset.itemEditorFilter&&!e.target.dataset.editorSearch&&!e.target.hasAttribute("data-editor-character-scope")&&!e.target.hasAttribute("data-continuation-search"))markEditorDirty();
  handleEditorField(e);
});
editorBody.addEventListener("change",e=>{
  if(e.target.matches("[data-character-image-file]")){
    handleCharacterImageFile(e.target);
    return;
  }
  if(e.target.matches("[data-emotion-image-file]")){
    handleEmotionImageFile(e.target);
    return;
  }
  if(!editorLargeProject){
    const before=e.target.dataset.undoStart;
    if(before&&before!==serializeEditorDraft()){
      if(editorUndoStack.at(-1)!==before)editorUndoStack.push(before);
      if(editorUndoStack.length>12)editorUndoStack.shift();
      editorRedoStack=[];
      delete e.target.dataset.undoStart;
      updateEditorHistoryButtons();
    }
  }
  if(!e.target.dataset.itemEditorFilter&&!e.target.dataset.editorSearch&&!e.target.hasAttribute("data-editor-character-scope")&&!e.target.hasAttribute("data-continuation-search"))markEditorDirty();
  handleEditorField(e);
});
function handleEditorField(e){
  const t=e.target;

  if(t.dataset.emotionImageScale){
    const character=editorDraft?.characters.find(row=>row.id===selectedEditorCharacterId);
    const emotionId=t.dataset.emotionImageScale;
    if(!character||!EMOTIONS.some(([id])=>id===emotionId))return;
    character.emotionImages=normalizeEmotionImages(character.emotionImages);
    const scale=Math.max(.5,Math.min(2,Number(t.value)||1));
    character.emotionImages[emotionId].scale=scale;
    const card=t.closest("[data-emotion-image-card]");
    const preview=card?.querySelector(".emotion-image-preview");
    if(preview)preview.style.setProperty("--emotion-image-scale",scale);
    const output=card?.querySelector("[data-emotion-scale-output]");
    if(output)output.textContent=Math.round(scale*100)+"%";
    const label=card?.querySelector(".emotion-image-scale b");
    if(label)label.textContent=Math.round(scale*100)+"%";
    return;
  }

  if(t.hasAttribute("data-editor-character-scope")){
    editorCharacterScope=t.value||"ALL";
    editorItemCharacterFilter=editorCharacterScope;
    editorEventPage=0;
    editorAskPage=0;
    editorItemPage=0;
    editorThoughtPage=0;
    const pos=editorBody.scrollTop;
    if(editorTab==="dialogue"&&DIALOGUE_EVENT_ROLES.has(dialogueSubtab))renderEventManager();
    else if(editorTab==="ask")renderAskEditor();
    else if(editorTab==="item")renderItemEditor();
    else if(editorTab==="thought")renderThoughtEditor();
    else if(editorTab==="collection")renderCollectionEditor();
    else renderEditor();
    editorBody.scrollTop=pos;
    return;
  }

  if(t.hasAttribute("data-continuation-search")){
    editorContinuationQuery=t.value;
    const pos=editorBody.scrollTop;
    renderEventManager();
    editorBody.scrollTop=pos;
    const input=$("[data-continuation-search]",editorBody);
    if(input){input.focus();try{input.setSelectionRange(input.value.length,input.value.length)}catch{}}
    return;
  }

  if(t.dataset.editorSearch){
    const kind=t.dataset.editorSearch;
    if(kind==="event"){
      editorEventQuery=t.value;
      editorEventPage=0;
      renderEventManager();
    }else if(kind==="ask"){
      editorAskQuery=t.value;
      editorAskPage=0;
      renderAskEditor();
    }else if(kind==="thought"){
      editorThoughtQuery=t.value;
      editorThoughtPage=0;
      renderThoughtEditor();
    }
    const search=$('[data-editor-search="'+kind+'"]',editorBody);
    if(search){search.focus();try{search.setSelectionRange(search.value.length,search.value.length)}catch{}}
    return;
  }

  if(t.dataset.itemEditorFilter){
    const kind=t.dataset.itemEditorFilter;
    if(kind==="query")editorItemQuery=t.value;
    if(kind==="character")editorItemCharacterFilter=t.value;
    if(kind==="rarity")editorItemRarityFilter=t.value;
    if(kind==="category")editorItemCategoryFilter=t.value;
    editorItemPage=0;
    const pos=editorBody.scrollTop;
    renderItemEditor();
    editorBody.scrollTop=pos;
    const search=$('[data-item-editor-filter="query"]',editorBody);
    if(kind==="query"&&search){search.focus();try{search.setSelectionRange(search.value.length,search.value.length)}catch{}}
    return;
  }

  if(t.dataset.miniEntryField){
    const rootList=getInteractionFlowList(t.dataset.flowScope,t.dataset.flowOwnerId,t.dataset.flowItemId,t.dataset.flowKey);
    const ctx=rootList?findFlowEntryContext(rootList,t.dataset.miniEntryId):null;
    if(ctx)ctx.entry[t.dataset.miniEntryField]=t.value;
    return;
  }
  if(t.dataset.miniOptionField){
    const rootList=getInteractionFlowList(t.dataset.flowScope,t.dataset.flowOwnerId,t.dataset.flowItemId,t.dataset.flowKey);
    const option=rootList?findFlowOption(rootList,t.dataset.miniOptionId):null;
    if(option){
      if(t.dataset.miniOptionField==="exit")option.exitMode=t.value==="end"?"end":"continue";
      else option[t.dataset.miniOptionField]=t.value;
      option.targetEventId="";
    }
    return;
  }
  const reactionCard=t.closest("[data-reaction-id]");
  if(reactionCard&&t.dataset.reactionBind){
    const item=editorDraft.items.find(i=>i.id===reactionCard.dataset.itemId);
    const reaction=item?.reactions.find(r=>r.id===reactionCard.dataset.reactionId);
    if(!reaction)return;
    const k=t.dataset.reactionBind;
    if(k==="preference"){
      reaction.preference=t.value;
      reaction.affectionDelta=GIFT_PREFERENCES.find(p=>p[0]===t.value)?.[1]??reaction.affectionDelta;
      renderItemEditor();
      return;
    }
    if(k==="affectionDelta")reaction[k]=clamp(t.value,-100,100,0);
    else if(k==="emotionIntensity"||k==="specialMinAffection"||k==="specialEmotionIntensity")reaction[k]=clamp(t.value,0,100,0);
    else reaction[k]=t.value;
    return;
  }

  const ch=editorDraft?.characters.find(x=>x.id===selectedEditorCharacterId);
  const ev=editorDraft?.events.find(x=>x.id===selectedEditorEventId);
  if(t.dataset.bind&&ch){
    const m={
      "char-name":"name","char-origin":"origin","char-role":"role","char-image":"image","char-image-scale":"imageScale","char-quote":"quote",
      "char-affection":"affectionStart","char-emotion":"emotionDefault","char-intensity":"emotionIntensity","char-enabled":"enabled"
    };
    const k=m[t.dataset.bind];
    if(k){
      ch[k]=t.type==="checkbox"?t.checked:
        (["affectionStart","emotionIntensity"].includes(k)?clamp(t.value,0,100,0):
        k==="imageScale"?Math.max(.5,Math.min(2,Number(t.value)||1)):t.value);
      if(k==="imageScale"){
        const preview=$(".character-image-preview",editorBody);
        if(preview)preview.style.setProperty("--character-editor-image-scale",ch.imageScale);
        const label=$("[data-character-image-scale-label]",editorBody);
        if(label)label.textContent=Math.round(ch.imageScale*100)+"%";
      }
      return
    }
  }
  if(t.dataset.bind&&ev){
    if(t.dataset.bind==="event-name"){ev.name=t.value;return}
    if(t.dataset.bind==="event-character"){ev.characterId=t.value;return}
    if(t.dataset.bind==="event-role"){
      const role=DIALOGUE_EVENT_ROLES.has(t.value)?t.value:"talk";
      ev.eventRole=role;
      ev.menuVisible=["talk","action"].includes(role)?ev.menuVisible!==false:false;
      dialogueSubtab=role;
      editorEventPage=0;
      renderDialogueEditor();
      return;
    }
    if(t.dataset.bind==="event-menu-visible"){ev.menuVisible=["talk","action"].includes(editorEventRole(ev))&&t.checked;return}
    if(t.dataset.bind==="event-random-eligible"){ev.randomEligible=t.checked;return}
    if(t.dataset.bind==="event-start-mode"){ev.startMode=["PLAYER_ASK","CHARACTER_OPEN","EVENT"].includes(t.value)?t.value:"";return}
    if(t.dataset.bind==="event-sensitivity"){ev.sensitivity=["light","medium","high"].includes(t.value)?t.value:"";return}
    if(t.dataset.bind==="event-topic-family"){ev.topicFamily=String(t.value||"").trim().slice(0,80);return}
    if(t.dataset.bind==="event-emotion-exit"){ev.emotionExitMode=t.value==="reset"?"reset":"keep";return}
  }
  const vr=t.closest("[data-var-id]");
  if(vr){
    const v=editorDraft.variables.find(x=>x.id===vr.dataset.varId);if(!v)return;
    if(t.dataset.bind==="var-name")v.name=t.value;
    if(t.dataset.bind==="var-type")v.type=t.value;
    if(t.dataset.bind==="var-default")v.defaultValue=t.value;
    return;
  }
  const ctx=findEntryContext(selectedEntryId),entry=ctx?.entry;
  if(t.dataset.entryField&&entry){entry[t.dataset.entryField]=t.value;return}
  const optionCard=t.closest("[data-option-id]");
  const option=entry?.type==="choice"&&optionCard?entry.options.find(o=>o.id===optionCard.dataset.optionId):null;
  if(t.dataset.optionField&&option){
    if(t.dataset.optionField==="label")option.label=t.value;
    if(t.dataset.optionField==="tone")option.tone=["neutral","supportive","light","sensitive","confrontational"].includes(t.value)?t.value:"neutral";
    if(t.dataset.optionField==="exit"){
      if(t.value.startsWith("event:")){option.targetEventId=t.value.slice(6);option.exitMode="continue"}
      else{option.targetEventId="";option.exitMode=t.value==="end"?"end":"continue"}
    }
    return;
  }
  const kind=t.dataset.condKind||t.dataset.itemcondKind||t.dataset.askcondKind||t.dataset.affcondKind||t.dataset.emocondKind||t.dataset.fxKind||t.dataset.afffxKind||t.dataset.emofxKind||t.dataset.itemfxKind;
  if(kind){
    const owner=getSelectedOwner(kind,t);if(!owner)return;
    if(t.dataset.condField){
      if(t.dataset.condField==="variableId"&&!t.value){owner.condition=null;return}
      owner.condition ||= {variableId:"",operator:"==",value:""};
      owner.condition[t.dataset.condField]=t.value;return;
    }
    if(t.dataset.itemcondField){
      if(t.dataset.itemcondField==="itemId"&&!t.value){owner.itemCondition=null;return}
      owner.itemCondition ||= {itemId:"",operator:">=",value:1};
      owner.itemCondition[t.dataset.itemcondField]=t.dataset.itemcondField==="value"?Math.max(0,Number(t.value)||0):t.value;
      return;
    }
    if(t.dataset.askcondField){
      if(t.dataset.askcondField==="askId"&&!t.value){owner.askCondition=null;return}
      owner.askCondition ||= {askId:"",status:"asked"};
      owner.askCondition[t.dataset.askcondField]=t.value;
      return;
    }
    if(t.dataset.affcondField){
      if(t.dataset.affcondField==="characterId"&&!t.value){owner.affectionCondition=null;return}
      owner.affectionCondition ||= {characterId:"",operator:">=",value:0};
      const field=t.dataset.affcondField;
      if((field==="minValue"||field==="maxValue")&&t.value==="")delete owner.affectionCondition[field];
      else owner.affectionCondition[field]=["value","minValue","maxValue"].includes(field)?clamp(t.value,0,100,0):t.value;
      return;
    }
    if(t.dataset.emocondField){
      if(t.dataset.emocondField==="characterId"&&!t.value){owner.emotionCondition=null;return}
      owner.emotionCondition ||= {characterId:"",state:"",intensityOperator:">=",intensityValue:0};
      owner.emotionCondition[t.dataset.emocondField]=t.dataset.emocondField==="intensityValue"?clamp(t.value,0,100,0):t.value;return;
    }
    const fxr=t.closest("[data-fx-id]"),afr=t.closest("[data-afffx-id]"),emr=t.closest("[data-emofx-id]"),ifr=t.closest("[data-itemfx-id]");
    if(fxr){
      const fx=owner.effects.find(x=>x.id===fxr.dataset.fxId);if(fx)fx[t.dataset.fxField]=t.value;return;
    }
    if(afr){
      const fx=owner.affectionEffects.find(x=>x.id===afr.dataset.afffxId);
      if(fx)fx[t.dataset.afffxField]=t.dataset.afffxField==="amount"?clamp(t.value,-100,100,0):(t.dataset.afffxField==="silent"?t.checked:t.value);
      return;
    }
    if(emr){
      const fx=owner.emotionEffects.find(x=>x.id===emr.dataset.emofxId);if(fx)fx[t.dataset.emofxField]=t.dataset.emofxField==="intensity"?clamp(t.value,0,100,0):t.value;return;
    }
    if(ifr){
      const fx=(owner.itemEffects||[]).find(x=>x.id===ifr.dataset.itemfxId);
      if(fx)fx[t.dataset.itemfxField]=t.dataset.itemfxField==="amount"?Math.max(1,Number(t.value)||1):(t.dataset.itemfxField==="once"?t.checked:t.value);
      return;
    }
  }
  if(t.dataset.gachaBind){
    const k=t.dataset.gachaBind;editorDraft.gacha[k]=t.type==="checkbox"?t.checked:(["balance","singleCost","tenCost"].includes(k)?Math.max(0,Number(t.value)||0):t.value);return;
  }
  if(t.dataset.rarity){editorDraft.gacha.rarityWeights[t.dataset.rarity]=Math.max(0,Number(t.value)||0);return}
  const ar=t.closest("[data-ask-id]");
  if(ar){
    const ask=editorDraft.asks.find(x=>x.id===ar.dataset.askId);if(!ask)return;
    if(t.dataset.askUnlockVarField){
      if(t.dataset.askUnlockVarField==="variableId"&&!t.value){ask.unlockCondition=null;return}
      ask.unlockCondition ||= {variableId:"",operator:"==",value:""};
      ask.unlockCondition[t.dataset.askUnlockVarField]=t.value;return;
    }
    if(t.dataset.askUnlockItemField){
      if(t.dataset.askUnlockItemField==="itemId"&&!t.value){ask.unlockItemCondition=null;return}
      ask.unlockItemCondition ||= {itemId:"",operator:">=",value:1};
      ask.unlockItemCondition[t.dataset.askUnlockItemField]=t.dataset.askUnlockItemField==="value"?Math.max(0,Number(t.value)||0):t.value;return;
    }
    if(t.dataset.askUnlockAskField){
      if(t.dataset.askUnlockAskField==="askId"&&!t.value){ask.unlockAskCondition=null;return}
      ask.unlockAskCondition ||= {askId:"",status:"asked"};
      ask.unlockAskCondition[t.dataset.askUnlockAskField]=t.value;return;
    }
    if(t.dataset.askUnlockEmoField){
      if(t.dataset.askUnlockEmoField==="characterId"&&!t.value){ask.unlockEmotionCondition=null;return}
      ask.unlockEmotionCondition ||= {characterId:"",state:"",intensityOperator:">=",intensityValue:0};
      ask.unlockEmotionCondition[t.dataset.askUnlockEmoField]=t.dataset.askUnlockEmoField==="intensityValue"?clamp(t.value,0,100,0):t.value;return;
    }
    if(t.dataset.askBind){
      const k=t.dataset.askBind;
      if(t.type==="checkbox")ask[k]=t.checked;
      else if(k==="minAffection"||k==="unlockMinAffection"||k==="emotionIntensity")ask[k]=clamp(t.value,0,100,0);
      else if(k==="affectionDelta"||k==="repeatAffectionDelta")ask[k]=clamp(t.value,-100,100,0);
      else ask[k]=t.value;
      return;
    }
  }
  const tr=t.closest("[data-thought-id]");
  if(tr&&t.dataset.thoughtBind){
    const th=editorDraft.thoughts.find(x=>x.id===tr.dataset.thoughtId);if(!th)return;
    th[t.dataset.thoughtBind]=t.type==="checkbox"?t.checked:t.value;return;
  }
  const ir=t.closest("[data-item-id]");
  if(ir&&t.dataset.itemBind){
    const item=editorDraft.items.find(x=>x.id===ir.dataset.itemId);if(!item)return;
    const k=t.dataset.itemBind;
    if(k==="inventoryEventId"){
      linkItemToInventoryEvent(item,t.value);
      renderItemEditor();
      return;
    }
    if(t.type==="checkbox")item[k]=t.checked;
    else if(k==="weight")item[k]=Math.max(.01,Number(t.value)||1);
    else item[k]=t.value;
    return;
  }
  if(t.dataset.collectionSetting){
    const key=t.dataset.collectionSetting;
    editorDraft.collectionSettings[key]=t.type==="checkbox"?t.checked:t.value;
    return;
  }
}

document.addEventListener("keydown",e=>{
  if(e.key==="Tab"&&modalRoot.innerHTML){
    const focusable=$$("button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex='-1'])",modalRoot)
      .filter(item=>!item.hidden&&item.getClientRects().length);
    if(focusable.length){
      const first=focusable[0],last=focusable.at(-1);
      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
      else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
    }
  }
  if(e.key==="Escape"){
    if(modalRoot.innerHTML){closeModal();return}
    if(!editorOverlay.hidden){closeEditor();return}
  }
  if(currentPage==="room"&&roomMode==="talk"&&!interactionCompleteMenu&&editorOverlay.hidden&&modalRoot.innerHTML===""){
    if((e.key===" "||e.key==="Enter")&&!e.target.matches("input,textarea,select,button")){
      const frame=playback?.frames?.at(-1),entry=frame?frameEntries(frame)[frame.index]:null;
      if(entry&&entry.type!=="choice"){e.preventDefault();advanceDialogue(false)}
    }
  }
});

bootstrapStorage()
  .then(info=>{
    console.info("Hellaverse storage ready",info);
    setStorageUiStatus("saved");
    renderStart();
    installUpdateCheck();
  })
  .catch(error=>{
    console.error("HELLAVERSE BOOTSTRAP FAILED",error);
    storageMode="localStorage-fallback";
    state=readState();
    session=createSession();
    pendingOrigin=state.profile.origin||"";
    setStorageUiStatus("failed","COMPAT MODE");
    renderStart();
    installUpdateCheck();
    showToast("저장소 초기화에 실패해 호환 모드로 시작했습니다.");
  });
