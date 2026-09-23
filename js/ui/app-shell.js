"use strict";
let pendingImportPreview=null;
let uiRecoveryActive=false;
let modalReturnFocus=null;
let modalSequence=0;
let updateCheckTimer=null;

function projectImportStats(source){
  const s=normalizeState(source);
  const issues=typeof validateDraft==="function"?validateDraft(s):[];
  return{
    state:s,
    characters:s.characters.length,
    events:s.events.length,
    asks:s.asks.length,
    items:s.items.length,
    thoughts:s.thoughts.length,
    variables:s.variables.length,
    errors:issues.filter(x=>x.level==="error").length,
    warnings:issues.filter(x=>x.level==="warning").length,
    infos:issues.filter(x=>x.level==="info").length,
    issues
  };
}
function recoverUiFromError(error,source="UI"){
  if(uiRecoveryActive)return;
  uiRecoveryActive=true;
  console.error("HELLAVERSE UI RECOVERY",source,error);
  try{
    if(typeof editorOverlay!=="undefined"&&!editorOverlay.hidden){
      editorOverlay.hidden=true;
      document.body.style.overflow="";
      editorDraft=null;
    }
    if(typeof modalRoot!=="undefined")closeModal();
    if(typeof gameShell!=="undefined"&&!gameShell.hidden){
      currentPage="home";
      renderNav();
      renderPage();
    }
    openModal("RECOVERY",
      '<div class="data-manager"><p class="muted">일부 화면에서 오류가 발생해 안전하게 빠져나왔습니다. 저장된 데이터는 그대로 유지됩니다.</p>'+
      '<div class="status-card"><strong>'+esc(source)+'</strong><p>'+esc(error?.message||String(error||"알 수 없는 오류"))+'</p></div>'+
      '<div class="data-actions"><button class="gold-button" type="button" data-close-modal>계속 사용</button></div></div>'
    );
  }catch(recoveryError){
    console.error("HELLAVERSE UI RECOVERY FAILED",recoveryError);
  }finally{
    setTimeout(()=>{uiRecoveryActive=false},0);
  }
}
window.addEventListener("error",event=>recoverUiFromError(event.error||new Error(event.message||"Script error"),"SCRIPT"));
window.addEventListener("unhandledrejection",event=>recoverUiFromError(event.reason instanceof Error?event.reason:new Error(String(event.reason||"Promise error")),"PROMISE"));
function showToast(text){
  clearTimeout(toastTimer);
  toastEl.textContent=text;toastEl.hidden=false;
  toastTimer=setTimeout(()=>toastEl.hidden=true,1500);
}
function openModal(title,body){
  if(!modalRoot.innerHTML)modalReturnFocus=document.activeElement;
  const titleId="modalTitle"+(++modalSequence);
  modalRoot.innerHTML='<div class="modal-backdrop" data-close-modal><section class="modal-card" role="dialog" aria-modal="true" aria-labelledby="'+titleId+'" tabindex="-1"><button class="modal-close" type="button" data-close-modal aria-label="닫기" title="닫기">×</button><p class="label">HELLAVERSE</p><h2 id="'+titleId+'">'+esc(title)+'</h2>'+body+'</section></div>';
  requestAnimationFrame(()=>$(".modal-card",modalRoot)?.focus());
}
function closeModal(){
  if(!modalRoot.innerHTML)return;
  modalRoot.innerHTML="";
  const target=modalReturnFocus;
  modalReturnFocus=null;
  if(target&&document.contains(target))requestAnimationFrame(()=>target.focus());
}
function backupDate(snapshot){return snapshot?.at?new Date(snapshot.at).toLocaleString("ko-KR"):"EMPTY"}
function showDataManager(){
  const store=readBackupStore();
  const ss=storageStatus();
  const slots=store.slots.map((snap,i)=>
    '<article class="save-slot"><div><small>SLOT '+(i+1)+'</small><strong>'+(snap?esc(snap.label):"EMPTY")+'</strong><span>'+esc(backupDate(snap))+'</span></div>'+
    '<div class="save-slot-actions"><button class="small-button" type="button" data-data-action="save-slot" data-slot="'+i+'">SAVE</button>'+
    '<button class="small-button" type="button" data-data-action="load-slot" data-slot="'+i+'" '+(!snap?"disabled":"")+'>LOAD</button></div></article>'
  ).join("");
  openModal("DATA & SAVE",
    '<div class="data-manager"><p class="muted">플레이와 편집 데이터는 이 브라우저에 자동 저장됩니다. 중요한 변경 전에는 슬롯이나 JSON 백업도 함께 사용하세요.</p>'+
    '<div class="data-storage-status"><span>STORAGE</span><strong>'+esc(ss.mode==="indexedDB"?"INDEXEDDB":ss.mode.toUpperCase())+'</strong><small>SCHEMA '+ss.schemaVersion+' · '+Math.round(ss.stateChars/1024).toLocaleString()+' KB</small></div>'+
    '<div class="save-slot-list">'+slots+'</div>'+
    '<section class="safety-snapshot"><div><small>AUTO SAFETY</small><strong>'+(store.safety?esc(store.safety.label):"아직 없음")+'</strong><span>'+esc(backupDate(store.safety))+'</span></div>'+
    '<button class="small-button" type="button" data-data-action="restore-safety" '+(!store.safety?"disabled":"")+'>RESTORE</button></section>'+
    '<div class="data-actions"><button class="ghost-button" type="button" data-data-action="export">EXPORT JSON</button>'+
    '<label class="ghost-button file-button">IMPORT JSON<input id="dataImportFile" type="file" accept="application/json,.json"></label>'+
    '<button class="danger-button" type="button" data-data-action="reset-progress">RESET PLAY PROGRESS</button></div></div>'
  );
}
async function saveBackupSlot(index){
  const previousStore=readBackupStore();
  try{
    const store=clone(previousStore);
    store.slots[index]=makeDataSnapshot("SLOT "+(index+1));
    if(!writeBackupStore(store)||!await flushStorageWrites())throw storageLastError||new Error("Save slot flush failed");
    showToast("세이브 슬롯 "+(index+1)+"에 저장했습니다.");
    showDataManager();
  }catch(error){
    backupStoreCache=normalizeBackupStore(previousStore);
    console.error("SAVE SLOT FAILED",error);
    closeModal();
    alert("브라우저 저장 공간이 부족해 저장 슬롯을 만들지 못했습니다. JSON EXPORT를 사용해 백업해 주세요.");
  }
}
async function applyDataSnapshot(snapshot,label="백업",confirmMessage="",skipConfirm=false){
  if(!snapshot?.state)return;
  const message=confirmMessage||label+"을(를) 불러올까요? 현재 상태는 자동 안전 백업으로 보관됩니다.";
  if(!skipConfirm&&!confirm(message))return;

  const previousState=clone(state);
  const previousPrefs=clone(prefs);
  const previousExtra=Object.fromEntries(AUX_STORAGE_KEYS.map(key=>[key,localStorage.getItem(key)]));
  let safetySaved=false;

  try{
    safetySaved=captureSafetySnapshot("복원 전 자동 백업");
    if(safetySaved)safetySaved=await flushStorageWrites();
  }catch(error){
    console.warn("AUTO SAFETY SNAPSHOT FAILED",error);
  }
  if(!safetySaved){
    const proceed=confirm("현재 데이터가 커서 자동 안전 백업을 브라우저에 저장하지 못했습니다.\n\n그래도 가져오기를 계속할까요? 가능하면 먼저 JSON EXPORT를 권장합니다.");
    if(!proceed)return;
  }

  try{
    state=installStoryPacks(normalizeState(snapshot.state)).state;
    prefs={
      textSpeed:clamp(snapshot.prefs?.textSpeed,0,80,24),
      autoDelay:clamp(snapshot.prefs?.autoDelay,250,3000,900),
      stageClick:snapshot.prefs?.stageClick!==false
    };
    session=createSession();
    playback=null;
    autoMode=false;
    clearAuto();
    pendingOrigin=state.profile.origin||"";

    savePrefs();
    if(!saveState()||!await flushStorageWrites())throw storageLastError||new Error("Imported state flush failed");

    if(snapshot.extraStorage&&typeof snapshot.extraStorage==="object"){
      AUX_STORAGE_KEYS.forEach(key=>{
        const value=snapshot.extraStorage[key];
        if(value===null||value===undefined)localStorage.removeItem(key);
        else localStorage.setItem(key,String(value));
      });
    }

    closeModal();
    if(gameShell.hidden)renderStart();
    else{updatePlayerBadge();renderPage()}
    showToast(label+"을(를) 불러왔습니다.");
  }catch(error){
    console.error("APPLY DATA SNAPSHOT FAILED",error);
    state=installStoryPacks(normalizeState(previousState)).state;
    prefs=previousPrefs;
    session=createSession();
    playback=null;
    autoMode=false;
    clearAuto();
    pendingOrigin=state.profile.origin||"";

    try{
      savePrefs();
      saveState();
      await flushStorageWrites();
      AUX_STORAGE_KEYS.forEach(key=>{
        const value=previousExtra[key];
        if(value===null||value===undefined)localStorage.removeItem(key);
        else localStorage.setItem(key,String(value));
      });
    }catch(rollbackError){
      console.error("DATA ROLLBACK FAILED",rollbackError);
    }

    closeModal();
    if(gameShell.hidden)renderStart();
    else{updatePlayerBadge();renderPage()}
    alert("백업을 저장할 브라우저 공간이 부족해서 가져오기를 취소했습니다. 화면은 이전 상태로 되돌렸습니다.\n\nJSON 파일 자체는 손상되지 않았습니다.");
  }
}
function loadBackupSlot(index){
  const snap=readBackupStore().slots[index];
  if(!snap){showToast("비어 있는 세이브 슬롯입니다.");return}
  applyDataSnapshot(snap,"세이브 슬롯 "+(index+1));
}
function restoreSafetySnapshot(){
  const snap=readBackupStore().safety;
  if(!snap){showToast("복원할 자동 안전 백업이 없습니다.");return}
  applyDataSnapshot(snap,"자동 안전 백업");
}
function exportData(){
  try{
    const snap=makeDataSnapshot("JSON EXPORT");
    const blob=new Blob([JSON.stringify(snap,null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;a.download="hellaverse-backup.json";
    document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
  }catch(error){
    console.error("EXPORT FAILED",error);
    closeModal();
    alert("브라우저 저장 공간 문제로 현재 상태를 먼저 정리하지 못했습니다. 페이지를 새로고침한 뒤 다시 시도해 주세요.");
  }
}
function showImportPreview(prepared){
  pendingImportPreview=prepared;
  const r=prepared.stats;
  const canImport=r.errors===0;
  const sourceLabel=prepared.legacy
    ? "LEGACY · "+esc(String(prepared.sourceVersion||"UNKNOWN"))
    : "SCHEMA · "+esc(String(prepared.sourceVersion||"UNKNOWN"));
  const issuePreview=r.issues.slice(0,8).map(issue=>
    '<div class="import-issue '+esc(issue.level)+'"><b>'+esc(issue.level.toUpperCase())+'</b><span>'+esc(issue.area)+'</span><p>'+esc(issue.text)+'</p></div>'
  ).join("");
  openModal("IMPORT PREVIEW",
    '<div class="import-preview">'+
      '<div class="import-preview-head"><div><small>'+sourceLabel+'</small><strong>'+esc(prepared.label)+'</strong></div>'+
      '<div class="import-health '+(canImport?"ok":"bad")+'"><b>'+r.errors+'</b><span>ERROR</span><b>'+r.warnings+'</b><span>WARNING</span></div></div>'+
      '<div class="import-count-grid">'+
        '<div><b>'+r.characters+'</b><span>CHARACTER</span></div>'+
        '<div><b>'+r.events+'</b><span>EVENT</span></div>'+
        '<div><b>'+r.asks+'</b><span>ASK</span></div>'+
        '<div><b>'+r.items+'</b><span>ITEM</span></div>'+
        '<div><b>'+r.thoughts+'</b><span>THOUGHT</span></div>'+
        '<div><b>'+r.variables+'</b><span>VARIABLE</span></div>'+
      '</div>'+
      (r.issues.length?'<div class="import-issue-list">'+issuePreview+(r.issues.length>8?'<p class="muted">외 '+(r.issues.length-8)+'개 검사 항목</p>':'')+'</div>':'<div class="validation-clean"><strong>구조 검사 통과</strong><p>삭제된 참조나 비어 있는 필수 연결을 찾지 못했습니다.</p></div>')+
      (!canImport?'<p class="import-block-note">ERROR가 있는 백업은 현재 데이터에 바로 적용하지 않습니다. 원본 파일은 변경되지 않았습니다.</p>':'')+
      '<div class="data-actions"><button class="ghost-button" type="button" data-close-modal>취소</button>'+
      '<button class="gold-button" type="button" data-data-action="confirm-import" '+(!canImport?"disabled":"")+'>검사 통과본 IMPORT</button></div>'+
    '</div>'
  );
}
async function confirmPendingImport(){
  const prepared=pendingImportPreview;
  if(!prepared||prepared.stats.errors)return;
  pendingImportPreview=null;
  closeModal();
  await applyDataSnapshot(
    prepared.snapshot,
    prepared.label,
    "",
    true
  );
}
function prepareImportPreview(raw){
  const legacy=migrateLegacyBackup(raw);
  if(legacy){
    const snapshot={
      version:3,
      schemaVersion:CURRENT_SCHEMA_VERSION,
      label:"MIGRATED LEGACY BACKUP",
      at:Date.now(),
      state:legacy.state,
      prefs:{}
    };
    return{
      snapshot,
      stats:projectImportStats(snapshot.state),
      legacy:true,
      sourceVersion:raw?.version||raw?.backupFormat||"legacy",
      label:"구형 백업 자동 변환본"
    };
  }
  const snapshot=raw?.state
    ? {...raw,state:normalizeState(raw.state)}
    : {version:3,schemaVersion:CURRENT_SCHEMA_VERSION,label:"IMPORTED",at:Date.now(),state:normalizeState(raw),prefs:{}};
  return{
    snapshot,
    stats:projectImportStats(snapshot.state),
    legacy:false,
    sourceVersion:raw?.schemaVersion||raw?.state?.schemaVersion||raw?.version||1,
    label:"가져온 JSON"
  };
}
function importDataFile(file){
  if(!file)return;
  const reader=new FileReader();
  reader.onload=()=>{
    try{
      const raw=JSON.parse(String(reader.result||"{}"));
      showImportPreview(prepareImportPreview(raw));
    }catch(error){
      console.error("DATA IMPORT FAILED",error);
      alert("백업 JSON을 읽거나 검사하는 중 오류가 발생했습니다. 현재 데이터는 변경되지 않았습니다.");
    }
  };
  reader.readAsText(file);
}
async function resetPlayProgress(){
  if(!confirm("대화 진행도, 호감도·감정·변수, ASK/선물 기록과 아이템 획득 진행도를 초기화할까요? 편집한 콘텐츠 자체는 유지됩니다."))return;
  let safetySaved=false;
  try{
    safetySaved=captureSafetySnapshot("진행도 초기화 전 자동 백업");
    if(safetySaved)safetySaved=await flushStorageWrites();
  }catch(error){
    console.error("RESET SAFETY SNAPSHOT FAILED",error);
  }
  if(!safetySaved){
    showToast("안전 백업을 만들지 못해 초기화를 취소했습니다.");
    return;
  }
  const previousState=clone(state);
  state.playState=normalizePlayState({});
  state.inventoryCounts={};
  state.newItemIds=[];
  state.itemHistory=[];
  state.discoveredGiftReactionKeys=[];
  state.discoveredSpecialGiftKeys=[];
  state.giftInteractionCounts={};
  state.discoveredTalkIds=[];
  state.seenOriginIntroCharacterIds=[];
  state.askedAskIds=[];
  state.unlockedAskIds=[];
  state.interactionHistory=[];
  state.discoveredThoughtIds=[];
  state.gacha.history=[];
  session=createSession();
  playback=null;
  if(!saveProgressState()||!await flushStorageWrites()){
    state=previousState;
    session=createSession();
    showToast("진행도 초기화 저장에 실패했습니다.");
    return;
  }
  closeModal();
  renderPage();
  showToast("플레이 진행도를 초기화했습니다.");
}

function renderStart(){
  if(typeof gameShell!=="undefined")gameShell.classList.remove("room-active");
  playerNameInput.value=state.profile.name||"";
  pendingOrigin=validOrigin(state.profile.origin)?state.profile.origin:(validOrigin(pendingOrigin)?pendingOrigin:"");
  $$("[data-origin]",originChoice).forEach(b=>b.classList.toggle("active",b.dataset.origin===pendingOrigin));
  startHint.textContent="";
  const importButton=$("#startImportButton");
  if(importButton)importButton.hidden=state.characters.length>0;
  startScreen.hidden=false;gameShell.hidden=true;
}
function openImportPicker(){
  showDataManager();
  $("#dataImportFile",modalRoot)?.click();
}

async function checkForAppUpdate(){
  if(location.protocol==="file:")return;
  const current=document.querySelector('meta[name="hellaverse-build"]')?.content||"";
  if(!current)return;
  try{
    const url=new URL("index.html",location.href);
    url.searchParams.set("build-check",String(Date.now()));
    const html=await fetch(url,{cache:"no-store"}).then(response=>{
      if(!response.ok)throw new Error("Update check HTTP "+response.status);
      return response.text();
    });
    const latest=new DOMParser().parseFromString(html,"text/html").querySelector('meta[name="hellaverse-build"]')?.content||"";
    const banner=$("#updateBanner");
    if(banner&&latest&&latest!==current)banner.hidden=false;
  }catch(error){
    console.debug("HELLAVERSE UPDATE CHECK SKIPPED",error);
  }
}
function installUpdateCheck(){
  clearTimeout(updateCheckTimer);
  clearInterval(updateCheckTimer);
  checkForAppUpdate();
  updateCheckTimer=setInterval(checkForAppUpdate,20000);
  document.addEventListener("visibilitychange",()=>{
    if(document.visibilityState==="visible")checkForAppUpdate();
  },{passive:true});
}
function enterGame(){
  const name=playerNameInput.value.trim();
  if(!name||!validOrigin(pendingOrigin)){startHint.textContent="이름과 출신을 모두 선택하세요.";return false}
  state.profile={name,origin:pendingOrigin};saveProgressState();
  startScreen.hidden=true;gameShell.hidden=false;
  updatePlayerBadge();
  const chars=enabledCharacters();
  if(chars.length&&!getCharacter(selectedCharacterId))selectedCharacterId=chars[0].id;
  currentPage="home";renderNav();renderPage();
  return true;
}
function updatePlayerBadge(){playerBadge.textContent=(state.profile.name||"PLAYER")+" · "+originLabel(state.profile.origin)}
function renderNav(){
  $$(".nav-button").forEach(b=>b.classList.toggle("active",b.dataset.page===currentPage));
}
function setPage(page){
  if(page!=="room"){
    activeInteractionReaction=null;
    interactionContext=null;
  }
  currentPage=page;
  renderNav();
  renderPage();
}
function renderPage(){
  if(typeof gameShell!=="undefined")gameShell.classList.toggle("room-active",currentPage==="room");
  if(currentPage==="home")renderHome();
  else if(currentPage==="world")renderWorld();
  else if(currentPage==="characters")renderCharacters();
  else if(currentPage==="gacha")renderGacha();
  else if(currentPage==="thought")renderThought();
  else if(currentPage==="collection")renderCollection();
  else if(currentPage==="room")renderRoom();
}
function characterStatusMetersMarkup(ch,variant="home"){
  if(!ch)return"";
  const affection=Math.round(clamp(session.affection[ch.id]??ch.affectionStart,0,100,0));
  const emotion=session.emotions[ch.id]||{state:ch.emotionDefault,intensity:ch.emotionIntensity};
  const intensity=Math.round(clamp(emotion.intensity,0,100,0));
  const emotionText=emotionLabel(emotion.state);
  const allButton=variant==="home"
    ? '<button class="character-status-all" type="button" data-action="show-all-status" aria-label="전체 캐릭터 상태 보기" title="전체 캐릭터 상태 보기">ALL CHARACTER STATUS</button>'
    : '';
  return '<aside class="character-status-widget '+esc(variant)+'">'+
    '<div class="character-status-meters '+esc(variant)+'" data-character-status="'+esc(ch.id)+'">'+
      '<div class="character-status-meter affection-meter">'+
        '<div class="character-status-head"><span>AFFECTION</span><strong data-status-value="affection">'+affection+'</strong></div>'+
        '<div class="character-status-track" role="progressbar" aria-label="Affection" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+affection+'" data-status-track="affection"><i data-status-fill="affection" style="width:'+affection+'%"></i></div>'+
      '</div>'+
      '<div class="character-status-meter emotion-meter">'+
        '<div class="character-status-head"><span>EMOTION</span><strong><b data-status-emotion-label>'+esc(emotionText)+'</b> <em data-status-value="emotion">'+intensity+'</em></strong></div>'+
        '<div class="character-status-track" role="progressbar" aria-label="Emotion intensity" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+intensity+'" data-status-track="emotion"><i data-status-fill="emotion" style="width:'+intensity+'%"></i></div>'+
      '</div>'+
      allButton+
    '</div>'+
  '</aside>';
}
function updateCharacterStatusMeters(characterId){
  const ch=getCharacter(characterId);
  if(!ch||typeof document==="undefined")return;
  const affection=Math.round(clamp(session.affection[ch.id]??ch.affectionStart,0,100,0));
  const emotion=session.emotions[ch.id]||{state:ch.emotionDefault,intensity:ch.emotionIntensity};
  const intensity=Math.round(clamp(emotion.intensity,0,100,0));
  document.querySelectorAll(".character-status-meters").forEach(root=>{
    if(root.dataset.characterStatus!==ch.id)return;
    const affectionValue=root.querySelector('[data-status-value="affection"]');
    const affectionFill=root.querySelector('[data-status-fill="affection"]');
    const affectionTrack=root.querySelector('[data-status-track="affection"]');
    const emotionValue=root.querySelector('[data-status-value="emotion"]');
    const emotionLabelNode=root.querySelector("[data-status-emotion-label]");
    const emotionFill=root.querySelector('[data-status-fill="emotion"]');
    const emotionTrack=root.querySelector('[data-status-track="emotion"]');
    if(affectionValue)affectionValue.textContent=String(affection);
    if(affectionFill)affectionFill.style.width=affection+"%";
    if(affectionTrack)affectionTrack.setAttribute("aria-valuenow",String(affection));
    if(emotionValue)emotionValue.textContent=String(intensity);
    if(emotionLabelNode)emotionLabelNode.textContent=emotionLabel(emotion.state);
    if(emotionFill)emotionFill.style.width=intensity+"%";
    if(emotionTrack)emotionTrack.setAttribute("aria-valuenow",String(intensity));
  });
}

function renderHome(){
  const chars=enabledCharacters();
  if(!chars.length){
    pageRoot.innerHTML='<section class="empty-panel"><div><p class="page-kicker">HOME</p><h2>첫 이야기를 준비해 볼까요?</h2><p>EDITOR에서 캐릭터를 만들거나, 기존 프로젝트 JSON을 불러오면 바로 시작할 수 있습니다.</p><div class="empty-actions"><button class="gold-button" type="button" data-action="open-editor">캐릭터 만들기</button><button class="ghost-button" type="button" data-action="open-import">JSON 불러오기</button></div></div></section>';
    return;
  }
  homeIndex=Math.max(0,Math.min(homeIndex,chars.length-1));
  const ch=chars[homeIndex];
  selectedCharacterId=ch.id;
  const aff=Math.round(session.affection[ch.id]??ch.affectionStart);
  const emo=session.emotions[ch.id]||{state:ch.emotionDefault,intensity:ch.emotionIntensity};
  const imageScale=Math.max(.5,Math.min(2,Number(ch.imageScale)||1));
  const art=ch.image?'<img src="'+esc(ch.image)+'" alt="'+esc(ch.name)+'" />':'<div class="silhouette">'+esc(ch.name.slice(0,2).toUpperCase())+'</div>';
  pageRoot.innerHTML=
    '<section class="home-lobby">'+
      '<div class="lobby-character">'+
        '<div class="home-character"><div class="character-art" style="--character-image-scale:'+imageScale+'">'+art+'</div></div>'+
        (chars.length>1?'<button class="lobby-arrow left" type="button" data-action="home-prev">‹</button><button class="lobby-arrow right" type="button" data-action="home-next">›</button>':'')+
        '<div class="lobby-copy"><p class="page-kicker">'+esc(originLabel(ch.origin))+'</p><h1>'+esc(ch.name)+'</h1>'+
          '<p class="role-line">'+esc(ch.role||"ROLE NOT SET")+'</p>'+
          '<p class="quote-line">'+esc(ch.quote||"편집기에서 캐릭터 소개 문구를 설정할 수 있습니다.")+'</p></div>'+
        characterStatusMetersMarkup(ch,"home")+
        '<div class="character-counter">'+String(homeIndex+1).padStart(2,"0")+' / '+String(chars.length).padStart(2,"0")+'</div>'+
      '</div>'+
      '<div class="lobby-dashboard">'+
        '<button type="button" data-action="talk"><span>01 · ROOM</span><strong>TALK</strong><small>'+eventsForCharacter(ch.id).length+' EVENTS</small></button>'+
        '<button type="button" data-action="random-thought"><span>02 · INNER VOICE</span><strong>THOUGHT</strong><small>'+state.thoughts.filter(t=>t.characterId===ch.id&&t.enabled).length+' LINES</small></button>'+
      '</div>'+
    '</section>';
}
function renderCharacters(){
  const chars=enabledCharacters();
  const favorites=new Set(state.favoriteCharacterIds||[]);
  const query=characterQuery.trim().toLowerCase();
  const visible=chars.filter(ch=>{
    if(characterFavoritesOnly&&!favorites.has(ch.id))return false;
    if(characterRealmFilter!=="ALL"&&originRealm(ch.origin)!==characterRealmFilter)return false;
    if(query&&![ch.name,ch.role,ch.quote,originLabel(ch.origin)].join(" ").toLowerCase().includes(query))return false;
    return true;
  });
  pageRoot.innerHTML=
    '<section class="characters-page"><div class="page-head"><div><p class="page-kicker">CHARACTERS</p><h1>CAST DIRECTORY</h1></div><p>이름 검색, 출신 필터와 즐겨찾기로 원하는 캐릭터의 ROOM에 바로 들어갑니다.</p></div>'+
    '<div class="character-browser-toolbar">'+
      '<input data-character-control="query" value="'+esc(characterQuery)+'" placeholder="캐릭터 검색">'+
      '<select data-character-control="realm"><option value="ALL">모든 출신</option><option value="hell" '+(characterRealmFilter==="hell"?"selected":"")+'>HELL</option><option value="heaven" '+(characterRealmFilter==="heaven"?"selected":"")+'>HEAVEN</option></select>'+
      '<button class="filter-chip '+(characterFavoritesOnly?"active":"")+'" type="button" data-action="character-favorites">★ FAVORITES</button>'+
      '<span>'+visible.length+' / '+chars.length+'</span>'+
    '</div>'+
    (visible.length?'<div class="character-directory-grid">'+visible.map(ch=>{
      const favorite=favorites.has(ch.id);
      const imageScale=Math.max(.5,Math.min(2,Number(ch.imageScale)||1));
      const art=ch.image?'<img src="'+esc(ch.image)+'" alt="'+esc(ch.name)+'">':'<span class="directory-silhouette">'+esc(ch.name.slice(0,2).toUpperCase())+'</span>';
      return '<article class="character-directory-card '+(favorite?"favorite":"")+'">'+
        '<button class="character-favorite" type="button" data-action="character-favorite" data-id="'+esc(ch.id)+'" aria-label="즐겨찾기">'+(favorite?"★":"☆")+'</button>'+
        '<button class="character-open" type="button" data-action="character-open" data-id="'+esc(ch.id)+'"><span class="directory-art" style="--character-image-scale:'+imageScale+'">'+art+'</span>'+
        '<span class="directory-copy"><small>'+esc(originLabel(ch.origin))+'</small><strong>'+esc(ch.name)+'</strong><p>'+esc(ch.role||ch.quote||"")+'</p><b>ROOM →</b></span></button></article>';
    }).join("")+'</div>':'<div class="empty-panel"><div><h2>조건에 맞는 캐릭터가 없습니다.</h2><p>검색어나 필터를 바꿔보세요.</p></div></div>')+
    '</section>';
}
function renderGacha(){
  const availablePool=state.items.filter(i=>i.enabled&&i.gachaEnabled&&(i.acquisitionMode!=="unique"||!hasEverAcquired(i.id)));
  const hasRepeatable=availablePool.some(i=>i.acquisitionMode==="repeatable");
  const canTen=hasRepeatable||availablePool.length>=10;
  const representedRarities=RARITIES.filter(r=>availablePool.some(i=>i.rarity===r));
  const weightedRarities=representedRarities.filter(r=>Number(state.gacha.rarityWeights[r]||0)>0);
  const activeRarities=weightedRarities.length?weightedRarities:representedRarities;
  const useEqualRates=!weightedRarities.length&&representedRarities.length>0;
  const total=useEqualRates?activeRarities.length:(activeRarities.reduce((s,r)=>s+Number(state.gacha.rarityWeights[r]||0),0)||1);
  const history=state.gacha.history.slice(-8).reverse();
  const drawDisabled=gachaAnimating||!state.gacha.enabled||!availablePool.length;

  pageRoot.innerHTML=
    '<section><div class="page-head"><div><p class="page-kicker">GACHA</p><h1>ARCHIVE DRAW</h1></div><p>아이템 설정에서 가챠 포함으로 지정한 아이템을 추첨합니다. REVEAL LINE은 뽑힌 아이템의 가챠 등장 대사를 그대로 사용합니다.</p></div>'+
    '<div class="gacha-layout">'+
      '<div class="gacha-stage '+(gachaAnimating?'is-drawing':'')+'"><div class="gacha-core"><p class="gacha-balance">'+esc(state.gacha.currencyName)+' · '+state.gacha.balance+'</p><h2>DRAW THE ARCHIVE</h2>'+
      '<p>'+availablePool.length+'개의 현재 획득 가능한 아이템이 있습니다.</p><div id="gachaResult" class="gacha-result-grid"></div>'+
      '<div class="draw-actions"><button class="gold-button" type="button" data-action="draw-gacha" data-count="1" '+(drawDisabled?"disabled":"")+'>1 DRAW · '+state.gacha.singleCost+'</button>'+
      '<button class="gold-button" type="button" data-action="draw-gacha" data-count="10" '+(drawDisabled||!canTen?"disabled":"")+'>10 DRAW · '+state.gacha.tenCost+'</button></div>'+
      (!canTen&&availablePool.length?'<p class="gacha-pool-note">REPEATABLE이 없고 UNIQUE 풀이 10개 미만이라 10회 뽑기가 잠겨 있습니다.</p>':'')+
      '</div><div class="gacha-aura" aria-hidden="true"></div></div>'+
      '<aside class="gacha-side">'+
      '<div class="info-card"><h3>RATES</h3>'+RARITIES.map(r=>'<div class="rate-row '+(activeRarities.includes(r)?"":"inactive")+'"><span>'+r+'</span><b>'+(activeRarities.includes(r)?(((useEqualRates?1:Number(state.gacha.rarityWeights[r]||0))/total)*100).toFixed(1):"0.0")+'%</b></div>').join("")+
      '<p class="gacha-rate-note">'+(useEqualRates?"설정 가중치가 모두 0이라 현재 존재하는 희귀도에 균등 분배합니다.":"현재 획득 가능한 희귀도만 기준으로 실제 확률을 재분배합니다.")+'</p></div>'+
      '<div class="info-card"><div class="info-card-head"><h3>RECENT</h3><button class="small-button history-clear" type="button" data-action="clear-gacha-history" '+(!history.length||gachaAnimating?"disabled":"")+'>CLEAR</button></div>'+
      (history.length?history.map(h=>{const item=itemById(h.itemId);return '<div class="history-row"><span>'+esc(item?itemEmoji(item):"🎁")+' '+esc(h.rarity)+'</span><b>'+esc(h.name)+'</b></div>';}).join(""):'<p class="muted">아직 기록이 없습니다.</p>')+'</div></aside>'+
    '</div></section>';
}
function renderThought(){
  const discovered=new Set(state.discoveredThoughtIds);
  const chars=enabledCharacters();
  const visible=state.thoughts.filter(t=>discovered.has(t.id)&&(thoughtFilter==="ALL"||t.characterId===thoughtFilter));
  const groups={};
  visible.forEach(t=>(groups[t.category] ||= []).push(t));
  pageRoot.innerHTML=
    '<section><div class="page-head"><div><p class="page-kicker">THOUGHT</p><h1>INNER ARCHIVE</h1></div><p>HOME에서 발견한 생각이 이곳에 기록됩니다.</p></div>'+
    '<div class="thought-toolbar"><button class="filter-chip '+(thoughtFilter==="ALL"?"active":"")+'" data-action="thought-filter" data-id="ALL">ALL</button>'+
      chars.map(c=>'<button class="filter-chip '+(thoughtFilter===c.id?"active":"")+'" data-action="thought-filter" data-id="'+esc(c.id)+'">'+esc(c.name)+'</button>').join("")+'</div>'+
    (Object.keys(groups).length?'<div class="thought-groups">'+Object.entries(groups).map(([cat,list])=>'<section class="thought-group"><h2>'+esc(cat)+'</h2>'+list.map(t=>'<article class="thought-card"><small>'+esc(getCharacter(t.characterId)?.name||"UNKNOWN")+'</small><p>'+esc(t.text)+'</p></article>').join("")+'</section>').join("")+'</div>':
    '<div class="empty-panel"><div><h2>아직 발견한 Thought가 없습니다.</h2><p>HOME에서 캐릭터를 선택한 뒤 THOUGHT를 눌러보세요.</p></div></div>')+
    '</section>';
}
function renderCollection(){
  const chars=enabledCharacters();
  const categories=[...new Set(state.items.map(i=>i.category).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"ko"));
  const query=collectionQuery.trim().toLowerCase();
  const visibleCatalog=state.items.filter(i=>i.enabled&&(!i.secret||hasEverAcquired(i.id)||Boolean(i.acquisitionHint)));
  let items=visibleCatalog.filter(i=>{
    const acquired=hasEverAcquired(i.id),isNew=state.newItemIds.includes(i.id),source=itemSourceLabel(i);
    if(!state.collectionSettings.showLocked&&!acquired)return false;
    if(collectionFilter!=="ALL"&&i.collectionCharacterId!==collectionFilter)return false;
    if(collectionRarity!=="ALL"&&i.rarity!==collectionRarity)return false;
    if(collectionCategory!=="ALL"&&i.category!==collectionCategory)return false;
    if(collectionSource!=="ALL"&&source!==collectionSource)return false;
    if(collectionStatus==="NEW"&&!isNew)return false;
    if(collectionStatus==="OWNED"&&!acquired)return false;
    if(collectionStatus==="LOCKED"&&acquired)return false;
    if(query){
      const text=[i.name,i.description,itemGachaLine(i),itemEmoji(i),i.category,i.rarity,source,getCharacter(i.collectionCharacterId)?.name].join(" ").toLowerCase();
      if(!text.includes(query))return false;
    }
    return true;
  });

  const sort=state.collectionSettings.sort||"recent";
  items.sort((a,b)=>{
    if(sort==="rarity")return (RARITY_ORDER[b.rarity]||0)-(RARITY_ORDER[a.rarity]||0)||a.name.localeCompare(b.name,"ko");
    if(sort==="name")return a.name.localeCompare(b.name,"ko");
    if(sort==="count")return itemCount(b.id)-itemCount(a.id)||a.name.localeCompare(b.name,"ko");
    return itemLastAcquiredAt(b.id)-itemLastAcquiredAt(a.id)||a.name.localeCompare(b.name,"ko");
  });

  const card=i=>{
    const count=itemCount(i.id),acquired=hasEverAcquired(i.id),isNew=state.newItemIds.includes(i.id),source=itemSourceLabel(i);
    return '<button class="collection-card rarity-'+esc(i.rarity)+' '+(acquired?"":"locked")+' '+(isNew?"is-new":"")+'" type="button" data-action="collection-detail" data-id="'+esc(i.id)+'">'+
      (isNew?'<span class="collection-new-badge">NEW</span>':'')+
      '<em>'+esc(i.category)+'</em><span class="rarity">'+esc(i.rarity)+'</span>'+
      '<span class="collection-item-icon">'+(acquired?esc(itemEmoji(i)):"❔")+'</span>'+
      '<strong>'+(acquired?esc(i.name):"LOCKED")+'</strong>'+
      '<div class="collection-card-meta"><span>'+esc(source)+'</span><span>'+esc(i.acquisitionMode.toUpperCase())+'</span>'+(i.secret?'<span>SECRET</span>':'')+'</div>'+
      '<p>'+(acquired?esc(i.description||"설명 없음"):(i.acquisitionHint?'<b class="collection-hint-label">HINT</b> '+esc(i.acquisitionHint):"아직 획득하지 않은 아이템입니다."))+'</p>'+
      (acquired&&itemGachaLine(i)?'<p class="collection-gacha-line"><span>GACHA REVEAL</span>'+esc(itemGachaLine(i))+'</p>':'')+
      (acquired&&state.collectionSettings.showOwnedCount?'<small>ARCHIVED · INVENTORY ×'+count+'</small>':'')+
    '</button>';
  };

  let body="";
  if(!items.length){
    body='<div class="empty-panel"><div><h2>조건에 맞는 아이템이 없습니다.</h2><p>필터를 바꾸거나 아이템을 획득해보세요.</p></div></div>';
  }else if(state.collectionSettings.view==="all"){
    body='<div class="collection-grid">'+items.map(card).join("")+'</div>';
  }else{
    const expanded=new Set(state.collectionSettings.expandedCharacterIds||[]);
    const groups=chars
      .filter(ch=>collectionFilter==="ALL"||ch.id===collectionFilter)
      .map(ch=>({character:ch,items:items.filter(i=>i.collectionCharacterId===ch.id),progress:collectionProgressForCharacter(ch.id)}))
      .filter(g=>g.items.length||g.progress.total);
    const unassigned=items.filter(i=>!getCharacter(i.collectionCharacterId));
    body=groups.map(g=>{
      const open=expanded.has(g.character.id);
      const profile=gachaProfileForCharacter(g.character.id);
      const poolItems=state.items.filter(i=>i.enabled&&i.gachaEnabled&&i.collectionCharacterId===g.character.id);
      const available=poolItems.filter(i=>i.acquisitionMode!=="unique"||!hasEverAcquired(i.id));
      return '<section class="collection-preview-group '+(open?"is-open":"is-collapsed")+'">'+
        '<button class="collection-group-toggle" type="button" data-action="collection-group-toggle" data-id="'+esc(g.character.id)+'" aria-expanded="'+(open?"true":"false")+'">'+
          '<span class="collection-group-profile-icon">'+esc(profile?.icon||"🎴")+'</span>'+
          '<span class="collection-group-title"><small>CHARACTER ARCHIVE</small><strong>'+esc(g.character.name)+'</strong></span>'+
          '<span class="collection-group-progress">'+g.progress.acquired+' / '+g.progress.total+' · '+g.progress.percent+'%</span>'+
          '<span class="collection-group-chevron" aria-hidden="true">'+(open?"−":"＋")+'</span>'+
        '</button>'+
        (open?'<div class="collection-group-body">'+
          (profile?'<div class="collection-gacha-profile"><div class="collection-gacha-profile-head"><span class="gacha-profile-icon">'+esc(profile.icon)+'</span><div><small>CHARACTER GACHA · PROFILE</small><strong>'+esc(profile.title)+'</strong><p>'+esc(profile.description||"설명 없음")+'</p></div></div>'+
            '<div class="gacha-profile-meta"><span>POOL '+poolItems.length+'</span><span>AVAILABLE '+available.length+'</span></div>'+
            '<p class="gacha-profile-note">REVEAL LINE · 아이템별 가챠 등장 대사</p></div>':'')+
          '<div class="collection-progress-track"><div style="width:'+g.progress.percent+'%"></div></div>'+
          (g.items.length?'<div class="collection-grid">'+g.items.map(card).join("")+'</div>':'<div class="collection-group-empty">현재 필터 조건에 표시할 아이템이 없습니다.</div>')+
        '</div>':'')+
      '</section>';
    }).join("");
    if(unassigned.length)body+='<section class="collection-preview-group is-open"><div class="collection-group-static"><h3>UNASSIGNED</h3><span>'+unassigned.length+' ITEMS</span></div><div class="collection-grid">'+unassigned.map(card).join("")+'</div></section>';
  }

  const overall=collectionOverallProgress();
  const charProgress=chars.map(ch=>({ch,p:collectionProgressForCharacter(ch.id)}));
  pageRoot.innerHTML=
    '<section><div class="page-head"><div><p class="page-kicker">COLLECTION</p><h1>CHARACTER ARCHIVE</h1></div><p>획득 기록은 아이템을 사용해도 유지됩니다. 일부 SECRET은 이름 대신 획득 힌트만 표시됩니다.</p></div>'+
    '<div class="collection-completion"><div class="collection-completion-main"><strong>'+overall.percent+'%</strong><span>'+overall.acquired+' / '+overall.total+' ARCHIVED</span></div><div class="collection-progress-track"><div style="width:'+overall.percent+'%"></div></div><div class="collection-character-progress">'+charProgress.map(x=>'<span>'+esc(x.ch.name)+' · '+x.p.acquired+'/'+x.p.total+' · '+x.p.percent+'%</span>').join("")+'</div></div>'+
    '<div class="collection-viewbar"><div class="collection-view-buttons"><button class="filter-chip '+(state.collectionSettings.view==="grouped"?"active":"")+'" data-action="collection-view" data-view="grouped">캐릭터별</button><button class="filter-chip '+(state.collectionSettings.view==="all"?"active":"")+'" data-action="collection-view" data-view="all">전체</button></div>'+
      '<input data-collection-control="query" value="'+esc(collectionQuery)+'" placeholder="컬렉션 검색">'+
      '<select data-collection-control="rarity"><option value="ALL">모든 희귀도</option>'+RARITIES.map(r=>'<option value="'+r+'" '+(collectionRarity===r?"selected":"")+'>'+r+'</option>').join("")+'</select>'+
      '<select data-collection-control="category"><option value="ALL">모든 카테고리</option>'+categories.map(cat=>'<option value="'+esc(cat)+'" '+(collectionCategory===cat?"selected":"")+'>'+esc(cat)+'</option>').join("")+'</select>'+
      '<select data-collection-control="status"><option value="ALL" '+(collectionStatus==="ALL"?"selected":"")+'>전체 상태</option><option value="NEW" '+(collectionStatus==="NEW"?"selected":"")+'>NEW</option><option value="OWNED" '+(collectionStatus==="OWNED"?"selected":"")+'>OWNED</option><option value="LOCKED" '+(collectionStatus==="LOCKED"?"selected":"")+'>LOCKED</option></select>'+
      '<select data-collection-control="source"><option value="ALL">모든 획득처</option>'+["GACHA","DIALOGUE","BOTH","BASIC"].map(s=>'<option value="'+s+'" '+(collectionSource===s?"selected":"")+'>'+s+'</option>').join("")+'</select>'+
      '<select data-collection-control="sort"><option value="recent" '+(sort==="recent"?"selected":"")+'>최근 획득</option><option value="rarity" '+(sort==="rarity"?"selected":"")+'>희귀도</option><option value="name" '+(sort==="name"?"selected":"")+'>이름</option><option value="count" '+(sort==="count"?"selected":"")+'>보유 수</option></select>'+
    '</div>'+
    '<div class="collection-toolbar"><button class="filter-chip '+(collectionFilter==="ALL"?"active":"")+'" data-action="collection-filter" data-id="ALL">ALL</button>'+chars.map(ch=>'<button class="filter-chip '+(collectionFilter===ch.id?"active":"")+'" data-action="collection-filter" data-id="'+esc(ch.id)+'">'+esc(ch.name)+'</button>').join("")+'</div>'+
    '<div class="collection-summary">'+items.length+' VISIBLE · '+state.newItemIds.filter(id=>hasEverAcquired(id)).length+' NEW · '+visibleCatalog.filter(i=>hasEverAcquired(i.id)).length+' ARCHIVED</div>'+
    body+'</section>';
}
