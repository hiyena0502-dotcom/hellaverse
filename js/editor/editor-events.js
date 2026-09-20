"use strict";
function renderValidationReport(){
  if(!editorDraft)return;
  $$(".editor-nav").forEach(b=>b.classList.remove("active"));
  const issues=validateDraft(editorDraft);
  const counts={
    error:issues.filter(x=>x.level==="error").length,
    warning:issues.filter(x=>x.level==="warning").length,
    info:issues.filter(x=>x.level==="info").length
  };
  editorBody.innerHTML=editorHead("CHECK","프로젝트 검사","삭제된 참조와 비어 있는 콘텐츠, 설정 충돌을 저장 전에 확인합니다.",'<button class="small-button" data-action="run-validation">다시 검사</button>')+
    '<div class="validation-summary"><div><b>'+counts.error+'</b><span>ERROR</span></div><div><b>'+counts.warning+'</b><span>WARNING</span></div><div><b>'+counts.info+'</b><span>INFO</span></div></div>'+
    (issues.length?'<div class="validation-list">'+issues.map(x=>'<article class="validation-row '+x.level+'"><span>'+esc(x.level.toUpperCase())+'</span><div><strong>'+esc(x.area)+'</strong><p>'+esc(x.text)+'</p></div></article>').join("")+'</div>':'<div class="validation-clean"><strong>문제를 찾지 못했습니다.</strong><p>현재 편집 중인 프로젝트 구조가 정상입니다.</p></div>');
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
$("#changeProfileButton").addEventListener("click",renderStart);
$("#brandButton").addEventListener("click",()=>setPage("home"));
$("#dataButton").addEventListener("click",showDataManager);
$("#editorButton").addEventListener("click",openEditor);
document.querySelectorAll(".nav-button").forEach(b=>b.addEventListener("click",()=>setPage(b.dataset.page)));
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
    if(activeInteractionReaction||interactionContext?.followupActive)return;
    roomMode=b.dataset.mode||"talk";
    roomToolsOpen=false;
    autoMode=false;clearAuto();
    renderRoom();
  }
  else if(a==="ask-topic")startAsk(b.dataset.id);
  else if(a==="inventory-item")useInventoryItem(b.dataset.id);
  else if(a==="finish-interaction")finishInteractionReaction();
  else if(a==="back-home"){activeInteractionReaction=null;interactionContext=null;setPage("home")}
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
  else if(a==="collection-filter"){collectionFilter=b.dataset.id;renderCollection()}
  else if(a==="collection-view"){
    state.collectionSettings.view=b.dataset.view==="all"?"all":"grouped";
    saveProgressState();
    renderCollection();
  }
  else if(a==="collection-detail")collectionDetail(b.dataset.id);
});
pageRoot.addEventListener("input",e=>{
  const t=e.target;
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
  if(currentPage!=="room"||roomMode!=="talk"||!prefs.stageClick)return;
  if(e.target.closest("button,input,select,textarea"))return;
  const frame=playback?.frames?.at(-1),entry=frame?frameEntries(frame)[frame.index]:null;
  if(entry&&entry.type!=="choice")advanceDialogue(false);
});

editorBody.addEventListener("click",e=>{
  const b=e.target.closest("[data-action]");if(!b)return;
  const a=b.dataset.action;
  if(a==="run-validation"){renderValidationReport();return}
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
    const ev=normalizeEvent({id:uid("event"),name:"새 이벤트",characterId:selectedEditorCharacterId||editorDraft.characters[0]?.id||""});
    editorDraft.events.push(ev);
    selectedEditorEventId=ev.id;
    selectedEntryId="";
    editorEventQuery="";
    editorEventPage=Math.max(0,Math.ceil(editorDraft.events.length/EDITOR_EVENT_PAGE_SIZE)-1);
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
    editorDraft.events.forEach(x=>{
      x.continuationEventIds=(x.continuationEventIds||[]).filter(nextId=>nextId!==id);
    });
    editorDraft.asks.forEach(a=>{if(a.eventId===id)a.eventId=""});
    editorDraft.items.forEach(i=>{if(i.inventoryEventId===id)i.inventoryEventId=""});
    sanitizeOptionTargets(editorDraft.events,id);
    selectedEditorEventId=editorDraft.events[0]?.id||"";selectedEntryId="";renderEventManager();return;
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
    if(a==="add-itemfx"){owner.itemEffects ||= [];owner.itemEffects.push({id:uid("itemfx"),itemId:editorDraft.items[0]?.id||"",amount:1})}
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
    const ask=normalizeAsk({id:uid("ask"),characterId:editorDraft.characters[0]?.id||""});
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
    const item=normalizeItem({id:uid("item"),collectionCharacterId:editorDraft.characters[0]?.id||""});
    editorDraft.items.push(item);
    selectedItemId=item.id;
    editorItemQuery="";
    editorItemCharacterFilter="ALL";
    editorItemRarityFilter="ALL";
    editorItemCategoryFilter="ALL";
    editorItemPage=Math.max(0,Math.ceil(editorDraft.items.length/EDITOR_ITEM_PAGE_SIZE)-1);
    renderItemEditor();return;
  }
  if(a==="select-item"){selectedItemId=b.dataset.id;renderItemEditor();return}
  if(a==="new-item-reaction"){
    const item=editorDraft.items.find(i=>i.id===b.dataset.itemId);if(!item)return;
    item.reactions.push(normalizeItemReaction({
      id:uid("item-reaction"),
      characterId:editorDraft.characters[0]?.id||"",
      preference:"NEUTRAL",
      affectionDelta:1,
      entries:[]
    }));
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
    editorDraft.giftInteractionCounts=Object.fromEntries(Object.entries(editorDraft.giftInteractionCounts||{}).filter(([k])=>!k.startsWith(id+"::")));
    editorDraft.interactionHistory=(editorDraft.interactionHistory||[]).filter(h=>h.itemId!==id);
    selectedItemId=editorDraft.items[0]?.id||"";
    renderItemEditor();return;
  }
  if(a==="new-thought"){
    const t=normalizeThought({id:uid("thought"),category:editorDraft.thoughtSettings.categories[0]||"일상"});
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
    !e.target.hasAttribute("data-continuation-search")
  ){
    e.target.dataset.undoStart=serializeEditorDraft();
  }
});
editorBody.addEventListener("input",e=>{
  if(!e.target.dataset.itemEditorFilter&&!e.target.dataset.editorSearch&&!e.target.hasAttribute("data-continuation-search"))markEditorDirty();
  handleEditorField(e);
});
editorBody.addEventListener("change",e=>{
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
  if(!e.target.dataset.itemEditorFilter&&!e.target.dataset.editorSearch&&!e.target.hasAttribute("data-continuation-search"))markEditorDirty();
  handleEditorField(e);
});
function handleEditorField(e){
  const t=e.target;

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
      "char-name":"name","char-origin":"origin","char-role":"role","char-image":"image","char-quote":"quote",
      "char-affection":"affectionStart","char-emotion":"emotionDefault","char-intensity":"emotionIntensity","char-enabled":"enabled"
    };
    const k=m[t.dataset.bind];if(k){ch[k]=t.type==="checkbox"?t.checked:(["affectionStart","emotionIntensity"].includes(k)?clamp(t.value,0,100,0):t.value);return}
  }
  if(t.dataset.bind&&ev){
    if(t.dataset.bind==="event-name"){ev.name=t.value;return}
    if(t.dataset.bind==="event-character"){ev.characterId=t.value;return}
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
      owner.affectionCondition[t.dataset.affcondField]=t.dataset.affcondField==="value"?clamp(t.value,0,100,0):t.value;return;
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
      const fx=owner.affectionEffects.find(x=>x.id===afr.dataset.afffxId);if(fx)fx[t.dataset.afffxField]=t.dataset.afffxField==="amount"?clamp(t.value,-100,100,0):t.value;return;
    }
    if(emr){
      const fx=owner.emotionEffects.find(x=>x.id===emr.dataset.emofxId);if(fx)fx[t.dataset.emofxField]=t.dataset.emofxField==="intensity"?clamp(t.value,0,100,0):t.value;return;
    }
    if(ifr){
      const fx=(owner.itemEffects||[]).find(x=>x.id===ifr.dataset.itemfxId);
      if(fx)fx[t.dataset.itemfxField]=t.dataset.itemfxField==="amount"?Math.max(1,Number(t.value)||1):t.value;
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
      else if(k==="affectionDelta")ask[k]=clamp(t.value,-100,100,0);
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
  if(e.key==="Escape"){
    if(modalRoot.innerHTML){closeModal();return}
    if(!editorOverlay.hidden){closeEditor();return}
  }
  if(currentPage==="room"&&roomMode==="talk"&&editorOverlay.hidden&&modalRoot.innerHTML===""){
    if((e.key===" "||e.key==="Enter")&&!e.target.matches("input,textarea,select,button")){
      const frame=playback?.frames?.at(-1),entry=frame?frameEntries(frame)[frame.index]:null;
      if(entry&&entry.type!=="choice"){e.preventDefault();advanceDialogue(false)}
    }
  }
});

bootstrapStorage()
  .then(info=>{
    console.info("Hellaverse storage ready",info);
    renderStart();
  })
  .catch(error=>{
    console.error("HELLAVERSE BOOTSTRAP FAILED",error);
    storageMode="localStorage-fallback";
    state=readState();
    session=createSession();
    pendingOrigin=state.profile.origin||"";
    renderStart();
    showToast("저장소 초기화에 실패해 호환 모드로 시작했습니다.");
  });