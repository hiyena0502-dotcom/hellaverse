"use strict";
/* EDITOR */
const EDITOR_LARGE_PROJECT_THRESHOLD=700;
const EDITOR_EVENT_PAGE_SIZE=60;
const EDITOR_ASK_PAGE_SIZE=30;
const EDITOR_ITEM_PAGE_SIZE=30;
const EDITOR_THOUGHT_PAGE_SIZE=50;
let editorDirty=false;
let editorLargeProject=false;
let editorEventQuery="";
let editorContinuationQuery="";
let editorAskQuery="";
let editorThoughtQuery="";
let editorEventPage=0;
let editorAskPage=0;
let editorItemPage=0;
let editorThoughtPage=0;
let editorProgressBaseline=null;
let editorReturnFocus=null;

function editorProjectWeight(source=editorDraft){
  if(!source)return 0;
  return (source.events?.length||0)*4+(source.asks?.length||0)*3+(source.items?.length||0)*2+(source.thoughts?.length||0);
}
function markEditorDirty(){
  if(editorDraft)editorDirty=true;
}
function serializeEditorDraft(){return editorDraft?JSON.stringify(editorDraft):""}
function updateEditorHistoryButtons(){
  const undo=$("#editorUndoButton"),redo=$("#editorRedoButton"),restore=$("#editorRestoreButton");
  if(undo){
    undo.disabled=editorLargeProject||!editorUndoStack.length;
    undo.title=editorLargeProject?"대용량 프로젝트에서는 전체 스냅샷 UNDO를 비활성화합니다.":"";
  }
  if(redo){
    redo.disabled=editorLargeProject||!editorRedoStack.length;
    redo.title=editorLargeProject?"대용량 프로젝트에서는 전체 스냅샷 REDO를 비활성화합니다.":"";
  }
  if(restore)restore.disabled=!hasEditorSnapshot();
}
function checkpointEditor(){
  if(!editorDraft)return;
  markEditorDirty();
  if(editorLargeProject){
    editorRedoStack=[];
    updateEditorHistoryButtons();
    return;
  }
  const snap=serializeEditorDraft();
  if(editorUndoStack.at(-1)!==snap){
    editorUndoStack.push(snap);
    if(editorUndoStack.length>12)editorUndoStack.shift();
  }
  editorRedoStack=[];
  updateEditorHistoryButtons();
}
function editorUndo(){
  if(editorLargeProject){showToast("대용량 EDITOR에서는 UNDO 대신 저장 전 RESTORE를 사용하세요.");return}
  if(!editorDraft||!editorUndoStack.length)return;
  editorRedoStack.push(serializeEditorDraft());
  editorDraft=normalizeState(JSON.parse(editorUndoStack.pop()));
  markEditorDirty();
  renderEditor();
}
function editorRedo(){
  if(editorLargeProject){showToast("대용량 EDITOR에서는 REDO를 사용하지 않습니다.");return}
  if(!editorDraft||!editorRedoStack.length)return;
  editorUndoStack.push(serializeEditorDraft());
  editorDraft=normalizeState(JSON.parse(editorRedoStack.pop()));
  markEditorDirty();
  renderEditor();
}
async function storeEditorRestorePoint(){
  saveState();
  const snap=makeDataSnapshot("EDITOR 저장 전 복구 지점");
  if(!writeEditorSnapshot(snap))throw new Error("EDITOR restore snapshot save failed");
  try{
    if(!captureSafetySnapshot("EDITOR 저장 전 자동 백업"))throw new Error("EDITOR safety snapshot save failed");
  }catch(error){
    console.warn("EDITOR AUTO SAFETY SKIPPED",error);
  }
  if(!await flushStorageWrites())throw storageLastError||new Error("EDITOR restore point flush failed");
}
function restoreEditorSnapshot(){
  const snap=readEditorSnapshot();
  if(!snap){showToast("복구할 EDITOR 스냅샷이 없습니다.");return}
  if(!confirm("마지막 EDITOR 저장 전 상태를 현재 편집 화면으로 불러올까요?"))return;
  try{
    checkpointEditor();
    editorDraft=normalizeState(snap.state||snap);
    markEditorDirty();
    renderEditor();
    showToast("마지막 저장 전 상태를 불러왔습니다.");
  }catch(error){
    console.error("EDITOR RESTORE FAILED",error);
    showToast("EDITOR 스냅샷을 읽지 못했습니다.");
  }
}
function isEditorMutationAction(action){
  return /^(new-|delete-|remove-|add-|move-|duplicate-|mini-add-|mini-delete-)/.test(String(action||""));
}
function isEditorDeleteAction(action){
  return /^delete-/.test(String(action||""))||/^mini-delete-/.test(String(action||""));
}
function openEditor(){
  if(!editorOverlay.hidden)return;
  editorReturnFocus=document.activeElement;
  editorOverlay.hidden=false;
  document.body.style.overflow="hidden";
  editorBody.innerHTML='<div class="editor-loading"><strong>EDITOR</strong><span>데이터를 준비하는 중…</span></div>';
  editorUndoStack=[];
  editorRedoStack=[];
  editorInitialSnapshot="";
  editorDirty=false;
  editorEventQuery="";
  editorContinuationQuery="";
  editorAskQuery="";
  editorThoughtQuery="";
  editorEventPage=0;
  editorAskPage=0;
  editorItemPage=0;
  editorThoughtPage=0;
  requestAnimationFrame(()=>{
    if(editorOverlay.hidden)return;
    try{
      editorDraft=clone(state);
      editorProgressBaseline=progressStateFrom(state);
      editorLargeProject=editorProjectWeight(editorDraft)>=EDITOR_LARGE_PROJECT_THRESHOLD;
      editorTab="dialogue";
      dialogueSubtab="characters";
      selectedEditorCharacterId=editorDraft.characters[0]?.id||"";
      selectedEditorEventId=editorDraft.events[0]?.id||"";
      selectedEntryId="";
      selectedThoughtId=editorDraft.thoughts[0]?.id||"";
      selectedAskId=editorDraft.asks[0]?.id||"";
      selectedItemId=editorDraft.items[0]?.id||"";
      renderEditor();
      $("#editorCancelButton")?.focus();
      if(editorLargeProject)showToast("대용량 EDITOR 모드 · 목록을 나눠서 표시합니다.");
    }catch(error){
      console.error("EDITOR OPEN FAILED",error);
      editorDraft=null;
      editorProgressBaseline=null;
      editorOverlay.hidden=true;
      document.body.style.overflow="";
      alert("EDITOR를 여는 중 오류가 발생했습니다.");
    }
  });
}
function closeEditor(force=false){
  if(!force&&editorDraft&&editorDirty&&!confirm("저장하지 않은 EDITOR 변경사항이 있습니다. 닫을까요?"))return false;
  editorOverlay.hidden=true;document.body.style.overflow="";
  editorDraft=null;
  editorProgressBaseline=null;
  editorUndoStack=[];
  editorRedoStack=[];
  editorInitialSnapshot="";
  editorDirty=false;
  editorLargeProject=false;
  const focusTarget=editorReturnFocus;
  editorReturnFocus=null;
  if(focusTarget&&document.contains(focusTarget))requestAnimationFrame(()=>focusTarget.focus());
  return true;
}
async function saveEditor(){
  if(!editorDraft)return;
  const issues=validateDraft(editorDraft);
  const errorCount=issues.filter(issue=>issue.level==="error").length;
  if(errorCount){
    renderValidationReport();
    showToast("ERROR "+errorCount+"개를 먼저 수정해 주세요.");
    return;
  }
  syncPlayStateFromSession();
  const previousState=clone(state);
  const saveButton=$("#editorSaveButton");
  if(saveButton){saveButton.disabled=true;saveButton.textContent="저장 중…"}
  try{
    await storeEditorRestorePoint();
    state=mergeEditorDraftIntoLiveState(state,editorDraft,editorProgressBaseline);
    if(!saveState()||!await flushStorageWrites())throw storageLastError||new Error("EDITOR state flush failed");
    session=createSession();
    playback=null;
    autoMode=false;
    clearAuto();
    if(selectedCharacterId&&!getCharacter(selectedCharacterId))selectedCharacterId=enabledCharacters()[0]?.id||"";
    closeEditor(true);renderPage();
    showToast("EDITOR 저장 완료");
  }catch(error){
    console.error("EDITOR SAVE FAILED",error);
    state=previousState;
    try{
      session=createSession();
      saveState();
      await flushStorageWrites();
    }catch{}
    alert("EDITOR 저장 중 브라우저 저장 공간 문제가 발생했습니다. 편집 화면은 그대로 유지합니다.");
  }finally{
    if(saveButton){saveButton.disabled=false;saveButton.textContent="모두 저장"}
  }
}
function renderEditor(){
  updateEditorHistoryButtons();
  document.querySelectorAll(".editor-nav").forEach(b=>b.classList.toggle("active",b.dataset.editorTab===editorTab));
  if(editorTab==="dialogue")renderDialogueEditor();
  else if(editorTab==="ask")renderAskEditor();
  else if(editorTab==="item")renderItemEditor();
  else if(editorTab==="gacha")renderGachaEditor();
  else if(editorTab==="thought")renderThoughtEditor();
  else renderCollectionEditor();
}
function editorHead(kicker,title,desc,actions=""){
  return '<div class="editor-section-head"><div><p class="label">'+esc(kicker)+'</p><h2>'+esc(title)+'</h2></div><div><p>'+esc(desc)+'</p>'+actions+'</div></div>';
}
function editorPager(kind,page,total,pageSize,label="항목"){
  const pages=Math.max(1,Math.ceil(total/pageSize));
  const safe=Math.max(0,Math.min(page,pages-1));
  return '<div class="editor-pager"><span>'+esc(label)+' '+total+'개 · '+(safe+1)+' / '+pages+'</span><div><button class="small-button" type="button" data-action="editor-page" data-kind="'+kind+'" data-page="'+(safe-1)+'" '+(safe<=0?"disabled":"")+'>이전</button><button class="small-button" type="button" data-action="editor-page" data-kind="'+kind+'" data-page="'+(safe+1)+'" '+(safe>=pages-1?"disabled":"")+'>다음</button></div></div>';
}

function charOptions(selected="",blank="선택 안 함",source=editorDraft){
  return '<option value="">'+esc(blank)+'</option>'+source.characters.map(c=>'<option value="'+esc(c.id)+'" '+(c.id===selected?"selected":"")+'>'+esc(c.name)+'</option>').join("");
}
function eventOptions(selected="",blank="이벤트 종료",source=editorDraft,exclude=""){
  return '<option value="">'+esc(blank)+'</option>'+source.events.filter(e=>e.id!==exclude).map(e=>'<option value="'+esc(e.id)+'" '+(e.id===selected?"selected":"")+'>'+esc(e.name)+'</option>').join("");
}
const DIALOGUE_EVENT_GROUPS=[
  {id:"characters",number:"01",label:"캐릭터",hint:"프로필 · 이미지"},
  {id:"talk",number:"02",label:"TALK",hint:"일반 이벤트 대사"},
  {id:"entry",number:"03",label:"ENTRY",hint:"입장할 때"},
  {id:"exit",number:"04",label:"EXIT",hint:"퇴장할 때"},
  {id:"story",number:"05",label:"STORY",hint:"연계 · 자동 재생"},
  {id:"variables",number:"06",label:"변수",hint:"조건 · 상태"}
];
const DIALOGUE_EVENT_ROLES=new Set(["talk","entry","exit","story"]);
function editorEventRole(event){
  const role=String(event?.eventRole||"").toLowerCase();
  const id=String(event?.id||"");
  const name=String(event?.name||"");
  if(role==="action")return"talk";
  if(DIALOGUE_EVENT_ROLES.has(role))return role;
  if(/^\s*ENTRY(?:\s*[·:|\-]|\s|$)/i.test(name))return"entry";
  if(/^\s*EXIT(?:\s*[·:|\-]|\s|$)/i.test(name))return"exit";
  if(/^\s*ACTION(?:\s*[·:|\-]|\s|$)/i.test(name)||/(?:^|-)act(?:-|\d|$)/i.test(id)||/(?:^|-)action(?:-|\d|$)/i.test(id))return"talk";
  if(event?.menuVisible===false)return"story";
  return"talk";
}
function dialogueGroupCount(id){
  if(id==="characters")return editorDraft.characters.length;
  if(id==="variables")return editorDraft.variables.length;
  return editorDraft.events.filter(event=>editorEventRole(event)===id).length;
}
function renderDialogueEditor(){
  if(dialogueSubtab==="events")dialogueSubtab="talk";
  if(!DIALOGUE_EVENT_GROUPS.some(group=>group.id===dialogueSubtab))dialogueSubtab="characters";
  editorBody.innerHTML=editorHead("DIALOGUE","대화 이벤트 설정","대화가 실행되는 시점과 목적에 따라 종류를 나눠 관리합니다.")+
  '<nav class="dialogue-type-nav" aria-label="대화 이벤트 종류">'+DIALOGUE_EVENT_GROUPS.map(group=>
    '<button type="button" class="dialogue-type-button '+(dialogueSubtab===group.id?"active":"")+'" data-action="dialogue-subtab" data-id="'+group.id+'"><span>'+group.number+'</span><strong>'+group.label+'</strong><small>'+group.hint+'</small><b>'+dialogueGroupCount(group.id)+'</b></button>'
  ).join("")+'</nav>'+
  '<div id="dialogueEditorContent"></div>';
  if(dialogueSubtab==="characters")renderCharacterManager();
  else if(dialogueSubtab==="variables")renderVariableManager();
  else renderEventManager(dialogueSubtab);
}
function renderCharacterManager(){
  const root=$("#dialogueEditorContent",editorBody);
  const c=editorDraft.characters.find(x=>x.id===selectedEditorCharacterId)||null;
  root.innerHTML='<div class="manager-layout"><aside class="manager-list"><div class="manager-list-head"><strong>CHARACTERS</strong><button class="small-button" data-action="new-character">+ 추가</button></div><div class="manager-list-items">'+
    (editorDraft.characters.length?editorDraft.characters.map(x=>'<button class="manager-item '+(x.id===selectedEditorCharacterId?"active":"")+'" data-action="select-character" data-id="'+esc(x.id)+'"><strong>'+esc(x.name)+'</strong><small>'+esc(originLabel(x.origin))+(x.enabled?"":" · HIDDEN")+'</small></button>').join(""):'<div class="editor-note">캐릭터가 없습니다.</div>')+
    '</div></aside><section class="manager-detail">'+(c?characterForm(c):'<div class="inspector-empty">왼쪽에서 캐릭터를 추가하세요.</div>')+'</section></div>';
}
function characterForm(c){
  return '<div class="form-grid">'+
    '<label class="field"><span>이름</span><input data-bind="char-name" value="'+esc(c.name)+'"></label>'+
    '<label class="field"><span>출신 분류</span><select data-bind="char-origin">'+ORIGINS.map(o=>'<option value="'+o[0]+'" '+(c.origin===o[0]?"selected":"")+'>'+o[1]+'</option>').join("")+'</select></label>'+
    '<label class="field"><span>역할 / 설명</span><input data-bind="char-role" value="'+esc(c.role)+'" placeholder="예: 호텔 관리자"></label>'+
    '<label class="field"><span>이미지 URL</span><input data-bind="char-image" value="'+esc(c.image)+'" placeholder="https://..."></label>'+
    '<label class="field full"><span>HOME 소개 문구</span><textarea data-bind="char-quote">'+esc(c.quote)+'</textarea></label>'+
    '<label class="field"><span>초기 호감도</span><input type="number" min="0" max="100" data-bind="char-affection" value="'+c.affectionStart+'"></label>'+
    '<label class="field"><span>기본 감정</span><select data-bind="char-emotion">'+EMOTIONS.map(e=>'<option value="'+e[0]+'" '+(c.emotionDefault===e[0]?"selected":"")+'>'+e[1]+'</option>').join("")+'</select></label>'+
    '<label class="field"><span>기본 감정 강도</span><input type="number" min="0" max="100" data-bind="char-intensity" value="'+c.emotionIntensity+'"></label>'+
    '<label class="checkline"><input type="checkbox" data-bind="char-enabled" '+(c.enabled?"checked":"")+'> HOME에 표시</label>'+
    '<div class="full"><button class="danger-button" data-action="delete-character">현재 캐릭터 삭제</button></div>'+
  '</div>';
}
function renderVariableManager(){
  const root=$("#dialogueEditorContent",editorBody);
  root.innerHTML='<div class="settings-card"><div class="manager-list-head"><div><strong>VARIABLES</strong><p class="muted">조건과 선택 결과에 사용할 일반 변수입니다.</p></div><button class="small-button" data-action="new-variable">+ 변수</button></div><div class="table-editor">'+
  (editorDraft.variables.length?editorDraft.variables.map(v=>'<div class="table-row" data-var-id="'+esc(v.id)+'"><input data-bind="var-name" value="'+esc(v.name)+'"><select data-bind="var-type"><option value="number" '+(v.type==="number"?"selected":"")+'>숫자</option><option value="boolean" '+(v.type==="boolean"?"selected":"")+'>참/거짓</option><option value="string" '+(v.type==="string"?"selected":"")+'>문자</option></select><input data-bind="var-default" value="'+esc(v.defaultValue)+'"><span class="muted">'+esc(v.id)+'</span><button class="danger-button" data-action="delete-variable">×</button></div>').join(""):'<div class="editor-note">변수가 없습니다.</div>')+
  '</div></div>';
}
function renderEventManager(role=dialogueSubtab){
  const root=$("#dialogueEditorContent",editorBody);
  role=DIALOGUE_EVENT_ROLES.has(role)?role:"talk";
  const q=editorEventQuery.trim().toLowerCase();
  const grouped=editorDraft.events.filter(x=>editorEventRole(x)===role);
  const filtered=grouped.filter(x=>{
    if(!q)return true;
    const text=[x.name,getCharacterDraft(x.characterId)?.name,x.id].join(" ").toLowerCase();
    return text.includes(q);
  });
  if(!grouped.some(event=>event.id===selectedEditorEventId)){
    selectedEditorEventId=filtered[0]?.id||grouped[0]?.id||"";
    selectedEntryId="";
  }
  const ev=editorDraft.events.find(x=>x.id===selectedEditorEventId&&editorEventRole(x)===role)||null;
  const pages=Math.max(1,Math.ceil(filtered.length/EDITOR_EVENT_PAGE_SIZE));
  editorEventPage=Math.max(0,Math.min(editorEventPage,pages-1));
  const visible=filtered.slice(editorEventPage*EDITOR_EVENT_PAGE_SIZE,(editorEventPage+1)*EDITOR_EVENT_PAGE_SIZE);
  const roleHint={talk:"일반 이벤트 대사를 한 목록에서 관리합니다. 이전 ACTION 이벤트도 여기에 함께 표시됩니다.",entry:"캐릭터 공간에 들어갈 때 실행되는 대화",exit:"캐릭터 공간을 나갈 때 실행되는 대화",story:"다른 이벤트 뒤에 이어지는 연계·자동 대화"}[role];
  root.innerHTML='<div class="editor-note dialogue-role-note"><b>'+role.toUpperCase()+'</b> · '+roleHint+'</div><div class="dialogue-editor-layout"><aside class="manager-list"><div class="manager-list-head"><strong>'+role.toUpperCase()+' EVENTS</strong><button class="small-button" data-action="new-event">+ 추가</button></div>'+
    '<input class="editor-list-search" data-editor-search="event" value="'+esc(editorEventQuery)+'" placeholder="이벤트 / 캐릭터 검색">'+
    '<div class="manager-list-items">'+
    (visible.length?visible.map(x=>'<button class="manager-item '+(x.id===selectedEditorEventId?"active":"")+'" data-action="select-event" data-id="'+esc(x.id)+'"><strong>'+esc(x.name)+'</strong><small><span class="event-role-badge">'+role.toUpperCase()+'</span> '+esc(getCharacterDraft(x.characterId)?.name||"캐릭터 미지정")+' · '+x.entries.length+'개</small></button>').join(""):'<div class="editor-note">이 종류의 이벤트가 없습니다.</div>')+
    '</div>'+editorPager("event",editorEventPage,filtered.length,EDITOR_EVENT_PAGE_SIZE,"EVENT")+(ev?'<div style="margin-top:12px">'+eventProperties(ev)+'</div>':'')+'</aside><section class="flow-column"><div class="manager-list-head"><strong>FLOW</strong><span class="muted">'+(ev?ev.entries.length:0)+'개</span></div>'+
    (ev?'<div class="flow-adds"><button data-action="add-entry" data-type="dialogue">+ 대사</button><button data-action="add-entry" data-type="narration">+ 지문</button><button data-action="add-entry" data-type="choice">+ 선택지</button></div><div class="flow-list">'+renderFlowRows(ev.entries)+'</div>':'<div class="inspector-empty">이벤트를 추가하세요.</div>')+
    '</section><section class="inspector-column">'+renderInspector()+'</section></div>';
}
function getCharacterDraft(id){return editorDraft.characters.find(c=>c.id===id)||null}
function eventProperties(ev){
  const chain=Array.isArray(ev.continuationEventIds)?ev.continuationEventIds:[];
  const selected=new Set(chain);
  const q=editorContinuationQuery.trim().toLowerCase();
  const candidates=q?editorDraft.events.filter(x=>{
    if(x.id===ev.id||selected.has(x.id))return false;
    const text=[x.name,x.id,getCharacterDraft(x.characterId)?.name].join(" ").toLowerCase();
    return text.includes(q);
  }).slice(0,10):[];
  const chainRows=chain.map((id,index)=>{
    const target=editorDraft.events.find(x=>x.id===id);
    if(!target)return '<div class="continuation-row missing" data-continuation-id="'+esc(id)+'"><span class="continuation-index">'+String(index+1).padStart(2,"0")+'</span><div><strong>삭제된 EVENT</strong><small>'+esc(id)+'</small></div><div class="icon-actions"><button class="icon-button" data-action="remove-continuation" data-id="'+esc(id)+'">×</button></div></div>';
    return '<div class="continuation-row" data-continuation-id="'+esc(id)+'"><span class="continuation-index">'+String(index+1).padStart(2,"0")+'</span><div><strong>'+esc(target.name)+'</strong><small>'+editorEventRole(target).toUpperCase()+' · '+esc(getCharacterDraft(target.characterId)?.name||"캐릭터 미지정")+'</small></div><div class="icon-actions"><button class="icon-button" data-action="move-continuation" data-id="'+esc(id)+'" data-dir="-1" '+(index===0?"disabled":"")+'>↑</button><button class="icon-button" data-action="move-continuation" data-id="'+esc(id)+'" data-dir="1" '+(index===chain.length-1?"disabled":"")+'>↓</button><button class="icon-button" data-action="remove-continuation" data-id="'+esc(id)+'">×</button></div></div>';
  }).join("");
  const results=candidates.map(x=>'<button class="continuation-search-result" type="button" data-action="add-continuation" data-id="'+esc(x.id)+'"><span>+</span><div><strong>'+esc(x.name)+'</strong><small>'+editorEventRole(x).toUpperCase()+' · '+esc(getCharacterDraft(x.characterId)?.name||"캐릭터 미지정")+' · '+esc(x.id)+'</small></div></button>').join("");

  return '<label class="field"><span>이벤트 이름</span><input data-bind="event-name" value="'+esc(ev.name)+'"></label>'+
    '<label class="field" style="margin-top:9px"><span>캐릭터</span><select data-bind="event-character">'+charOptions(ev.characterId,"캐릭터 선택")+'</select></label>'+
    '<label class="field" style="margin-top:9px"><span>이벤트 종류</span><select data-bind="event-role"><option value="talk" '+(editorEventRole(ev)==="talk"?"selected":"")+'>TALK · 일반 이벤트 대사</option><option value="entry" '+(editorEventRole(ev)==="entry"?"selected":"")+'>ENTRY · 입장</option><option value="exit" '+(editorEventRole(ev)==="exit"?"selected":"")+'>EXIT · 퇴장</option><option value="story" '+(editorEventRole(ev)==="story"?"selected":"")+'>STORY · 연계/자동</option></select></label>'+
    (editorEventRole(ev)==="talk"?'<div class="inline-grid" style="margin-top:9px"><label class="field"><span>시작 방식</span><select data-bind="event-start-mode"><option value="">기본</option><option value="PLAYER_ASK" '+(ev.startMode==="PLAYER_ASK"?"selected":"")+'>PLAYER_ASK</option><option value="CHARACTER_OPEN" '+(ev.startMode==="CHARACTER_OPEN"?"selected":"")+'>CHARACTER_OPEN</option><option value="EVENT" '+(ev.startMode==="EVENT"?"selected":"")+'>EVENT</option></select></label><label class="field"><span>민감도</span><select data-bind="event-sensitivity"><option value="">기본</option><option value="light" '+(ev.sensitivity==="light"?"selected":"")+'>LIGHT</option><option value="medium" '+(ev.sensitivity==="medium"?"selected":"")+'>MEDIUM</option><option value="high" '+(ev.sensitivity==="high"?"selected":"")+'>HIGH</option></select></label></div>':"")+
    (editorEventRole(ev)==="talk"?'<label class="checkline" style="margin-top:9px"><input type="checkbox" data-bind="event-menu-visible" '+(ev.menuVisible!==false?"checked":"")+'> TALK 선택 목록에 표시</label><label class="checkline" style="margin-top:7px"><input type="checkbox" data-bind="event-random-eligible" '+(ev.randomEligible!==false?"checked":"")+'> NEW TALK / AUTO 랜덤에 포함</label>':'<p class="muted event-role-help">'+editorEventRole(ev).toUpperCase()+' 이벤트는 선택 목록에서 자동으로 숨겨집니다.</p>')+
    '<label class="field" style="margin-top:9px"><span>종료 시 감정</span><select data-bind="event-emotion-exit"><option value="keep" '+(ev.emotionExitMode==="keep"?"selected":"")+'>현재 감정 유지</option><option value="reset" '+(ev.emotionExitMode==="reset"?"selected":"")+'>기본 감정으로 초기화</option></select></label>'+
    '<section class="event-continuation-editor"><div class="continuation-head"><div><strong>CONTINUATION</strong><small>이 EVENT가 끝난 뒤 위에서부터 자동 재생</small></div><b>'+chain.length+'</b></div>'+
      '<div class="continuation-list">'+(chainRows||'<div class="editor-note">이어지는 대화가 없습니다. 아래에서 EVENT를 검색해 추가하세요.</div>')+'</div>'+
      '<div class="continuation-search"><input data-continuation-search value="'+esc(editorContinuationQuery)+'" placeholder="이어질 EVENT 검색 · 이름 / 캐릭터">'+
      '<div class="continuation-search-results">'+(q?(results||'<div class="editor-note">추가할 수 있는 EVENT가 없습니다.</div>'):'<div class="editor-note">검색어를 입력하면 최대 10개까지 표시됩니다.</div>')+'</div></div>'+
    '</section>'+
    '<button class="danger-button" style="width:100%;margin-top:10px" data-action="delete-event">이벤트 삭제</button>';
}
function entryLabel(e){
  if(e.type==="choice")return e.prompt||"선택지";
  if(e.type==="narration")return e.text||"빈 지문";
  return (e.speaker?e.speaker+": ":"")+(e.text||"빈 대사");
}
function renderFlowRows(entries){
  if(!entries.length)return'<div class="editor-note">위 버튼으로 첫 항목을 추가하세요.</div>';
  return entries.map((e,i)=>{
    const meta=[e.type.toUpperCase(),e.affectionCondition?.band||"",e.narrationRole?String(e.narrationRole).toUpperCase():""].filter(Boolean).join(" · ");
    return '<button class="flow-row '+(e.id===selectedEntryId?"active":"")+'" data-action="select-entry" data-id="'+esc(e.id)+'"><span>'+String(i+1).padStart(2,"0")+'</span><span><small>'+esc(meta)+'</small><b>'+esc(entryLabel(e))+'</b></span></button>';
  }).join("");
}
function findEntryContext(id,entries=(editorDraft.events.find(e=>e.id===selectedEditorEventId)?.entries||[]),anc=[]){
  for(let i=0;i<entries.length;i++){
    const e=entries[i];if(e.id===id)return{entry:e,list:entries,index:i,ancestors:anc};
    if(e.type==="choice")for(const o of e.options){const f=findEntryContext(id,o.entries,[...anc,{choice:e,option:o}]);if(f)return f}
  }
  return null;
}
function renderInspector(){
  const ctx=findEntryContext(selectedEntryId);
  if(!ctx)return'<div class="inspector-empty">FLOW에서 항목을 선택하세요.</div>';
  const e=ctx.entry;
  return '<div class="inspector-head"><div><p class="label">'+esc(e.type.toUpperCase())+'</p><h3>'+esc(e.type==="choice"?"선택지 편집":e.type==="narration"?"지문 편집":"대사 편집")+'</h3></div><div class="icon-actions"><button class="icon-button" data-action="move-entry" data-dir="-1" '+(ctx.index===0?"disabled":"")+'>↑</button><button class="icon-button" data-action="move-entry" data-dir="1" '+(ctx.index===ctx.list.length-1?"disabled":"")+'>↓</button><button class="icon-button" data-action="duplicate-entry">⧉</button><button class="icon-button" data-action="delete-entry">×</button></div></div><div class="inspector-content">'+
  (e.type==="dialogue"?'<label class="field"><span>화자 이미지</span><select data-entry-field="speakerCharacterId">'+charOptions(e.speakerCharacterId,"이벤트 캐릭터 / 이미지 유지")+'</select></label><label class="field"><span>표시할 화자 이름</span><input data-entry-field="speaker" value="'+esc(e.speaker)+'" placeholder="비우면 선택한 캐릭터 이름"></label><label class="field"><span>대사</span><textarea data-entry-field="text">'+esc(e.text)+'</textarea></label>':
   e.type==="narration"?'<label class="field"><span>지문</span><textarea data-entry-field="text">'+esc(e.text)+'</textarea></label><label class="field" style="margin-top:9px"><span>지문 역할</span><select data-entry-field="narrationRole"><option value="">미지정</option>'+["intro","reaction","situation","transition","action","closing","background-dialogue"].map(x=>'<option value="'+x+'" '+(e.narrationRole===x?"selected":"")+'>'+x.toUpperCase()+'</option>').join("")+'</select></label>':
   renderChoiceEditor(e))+
  renderAdvanced(e,"entry")+'</div>';
}
function renderChoiceEditor(e){
  return '<label class="field"><span>질문 / 상황</span><textarea data-entry-field="prompt">'+esc(e.prompt)+'</textarea></label><div class="editor-block"><div class="manager-list-head"><h4>OPTIONS</h4><button class="small-button" data-action="add-option">+ 선택지</button></div>'+
    (e.options.length?e.options.map((o,i)=>renderOptionCard(e,o,i)).join(""):'<div class="editor-note">선택지가 없습니다.</div>')+'</div>';
}
function renderOptionCard(choice,o,index){
  return '<article class="option-card" data-option-id="'+esc(o.id)+'"><div class="option-main"><div class="inline-grid"><label class="field"><span>문구</span><input data-option-field="label" value="'+esc(o.label)+'"></label><label class="field"><span>태도</span><select data-option-field="tone">'+[["neutral","NEUTRAL"],["supportive","SUPPORTIVE"],["light","LIGHT"],["sensitive","SENSITIVE"],["confrontational","CONFRONTATIONAL"]].map(x=>'<option value="'+x[0]+'" '+((o.tone||"neutral")===x[0]?"selected":"")+'>'+x[1]+'</option>').join("")+'</select></label><label class="field"><span>분기 종료 후</span><select data-option-field="exit"><option value="continue" '+(!o.targetEventId&&o.exitMode!=="end"?"selected":"")+'>상위 흐름 계속</option><option value="end" '+(!o.targetEventId&&o.exitMode==="end"?"selected":"")+'>현재 이벤트 종료</option>'+editorDraft.events.map(ev=>'<option value="event:'+esc(ev.id)+'" '+(o.targetEventId===ev.id?"selected":"")+'>이벤트 이동 · '+esc(ev.name)+'</option>').join("")+'</select></label><div class="icon-actions"><button class="icon-button" data-action="move-option" data-dir="-1" '+(index===0?"disabled":"")+'>↑</button><button class="icon-button" data-action="move-option" data-dir="1" '+(index===choice.options.length-1?"disabled":"")+'>↓</button><button class="icon-button" data-action="delete-option">×</button></div></div>'+
    '<div class="branch-list">'+(o.entries.length?o.entries.map((be,bi)=>'<div class="branch-row"><button data-action="select-entry" data-id="'+esc(be.id)+'">'+esc(be.type.toUpperCase())+' · '+esc(entryLabel(be))+'</button><span class="icon-actions"><button class="icon-button" data-action="move-branch" data-index="'+bi+'" data-dir="-1" '+(bi===0?"disabled":"")+'>↑</button><button class="icon-button" data-action="move-branch" data-index="'+bi+'" data-dir="1" '+(bi===o.entries.length-1?"disabled":"")+'>↓</button><button class="icon-button" data-action="delete-branch" data-index="'+bi+'">×</button></span></div>').join(""):'<div class="editor-note">분기 뒤에 바로 상위 흐름으로 돌아갑니다.</div>')+'</div>'+
    '<div class="flow-adds"><button data-action="add-branch" data-type="dialogue">+ 대사</button><button data-action="add-branch" data-type="narration">+ 지문</button><button data-action="add-branch" data-type="choice">+ 선택지</button></div></div>'+
    '<div class="option-effects">'+renderQuickEffects(o,"option")+'<details class="advanced"><summary>고급 조건 / 변수 / 아이템</summary>'+renderConditions(o,"option")+renderVariableEffects(o,"option")+renderItemEffects(o,"option")+'</details></div></article>';
}
function renderAdvanced(owner,kind){
  return '<details class="advanced"><summary>고급 · 조건 / 호감도 / 감정 / 변수 / 아이템</summary>'+renderConditions(owner,kind)+renderQuickEffects(owner,kind)+renderVariableEffects(owner,kind)+renderItemEffects(owner,kind)+'</details>';
}
function renderConditions(o,kind,attrs=""){
  const vc=o.condition||{variableId:"",operator:"==",value:""};
  const ic=o.itemCondition||{itemId:"",operator:">=",value:1};
  const qc=o.askCondition||{askId:"",status:"asked"};
  const ac=o.affectionCondition||{characterId:"",operator:">=",value:0};
  const ec=o.emotionCondition||{characterId:"",state:"",intensityOperator:">=",intensityValue:0};
  return '<div class="editor-block"><h4>표시 조건</h4>'+
  '<div class="condition-grid"><select '+attrs+' data-cond-kind="'+kind+'" data-cond-field="variableId">'+variableOptions(vc.variableId)+'</select><select '+attrs+' data-cond-kind="'+kind+'" data-cond-field="operator">'+conditionOperatorOptions(vc.operator)+'</select><input '+attrs+' data-cond-kind="'+kind+'" data-cond-field="value" value="'+esc(vc.value)+'"><span></span></div>'+
  '<div class="condition-grid"><select '+attrs+' data-itemcond-kind="'+kind+'" data-itemcond-field="itemId">'+itemOptions(ic.itemId)+'</select><select '+attrs+' data-itemcond-kind="'+kind+'" data-itemcond-field="operator">'+numberOperatorOptions(ic.operator)+'</select><input '+attrs+' type="number" min="0" data-itemcond-kind="'+kind+'" data-itemcond-field="value" value="'+ic.value+'"><span></span></div>'+
  '<div class="condition-grid"><select '+attrs+' data-askcond-kind="'+kind+'" data-askcond-field="askId">'+askOptions(qc.askId)+'</select><select '+attrs+' data-askcond-kind="'+kind+'" data-askcond-field="status"><option value="asked" '+(qc.status==="asked"?"selected":"")+'>ASKED</option><option value="not-asked" '+(qc.status==="not-asked"?"selected":"")+'>NOT ASKED</option><option value="unlocked" '+(qc.status==="unlocked"?"selected":"")+'>UNLOCKED</option><option value="locked" '+(qc.status==="locked"?"selected":"")+'>LOCKED</option></select><span></span><span></span></div>'+
  '<div class="condition-grid"><select '+attrs+' data-affcond-kind="'+kind+'" data-affcond-field="characterId">'+charOptions(cnv(ac.characterId),"호감도 무관")+'</select><select '+attrs+' data-affcond-kind="'+kind+'" data-affcond-field="band"><option value="">직접 수치</option>'+["COLD","DISTANT","NEUTRAL","WARM","CLOSE"].map(x=>'<option value="'+x+'" '+(ac.band===x?"selected":"")+'>'+x+'</option>').join("")+'</select><select '+attrs+' data-affcond-kind="'+kind+'" data-affcond-field="operator">'+numberOperatorOptions(ac.operator)+'</select><input '+attrs+' type="number" min="0" max="100" data-affcond-kind="'+kind+'" data-affcond-field="value" value="'+ac.value+'"></div>'+
  '<div class="condition-grid"><select '+attrs+' data-emocond-kind="'+kind+'" data-emocond-field="characterId">'+charOptions(cnv(ec.characterId),"감정 무관")+'</select><select '+attrs+' data-emocond-kind="'+kind+'" data-emocond-field="state"><option value="">감정 무관</option>'+EMOTIONS.map(x=>'<option value="'+x[0]+'" '+(ec.state===x[0]?"selected":"")+'>'+x[1]+'</option>').join("")+'</select><select '+attrs+' data-emocond-kind="'+kind+'" data-emocond-field="intensityOperator">'+numberOperatorOptions(ec.intensityOperator,true)+'</select><input '+attrs+' type="number" min="0" max="100" data-emocond-kind="'+kind+'" data-emocond-field="intensityValue" value="'+ec.intensityValue+'"></div></div>';
}
function cnv(v){return v||""}
function variableOptions(sel){return'<option value="">변수 무관</option>'+editorDraft.variables.map(v=>'<option value="'+esc(v.id)+'" '+(v.id===sel?"selected":"")+'>'+esc(v.name)+'</option>').join("")}
function askOptions(sel){return '<option value="">ASK 무관</option>'+editorDraft.asks.map(a=>'<option value="'+esc(a.id)+'" '+(a.id===sel?"selected":"")+'>'+esc(a.label)+'</option>').join("")}

function conditionOperatorOptions(sel){return[["==","="],["!=","≠"],[">",">"],[">=","≥"],["<","<"],["<=","≤"],["truthy","참"],["falsy","거짓"]].map(x=>'<option value="'+x[0]+'" '+(sel===x[0]?"selected":"")+'>'+x[1]+'</option>').join("")}
function numberOperatorOptions(sel,prefix=false){return[[">=","≥"],[">",">"],["==","="],["!=","≠"],["<=","≤"],["<","<"]].map(x=>'<option value="'+x[0]+'" '+(sel===x[0]?"selected":"")+'>'+(prefix?"강도 ":"")+x[1]+'</option>').join("")}
function renderQuickEffects(o,kind,attrs=""){
  const aff=o.affectionEffects||[],emo=o.emotionEffects||[];
  return '<div class="editor-block"><h4>호감도 변화</h4><div class="effect-stack">'+
    (aff.length?aff.map(x=>'<div class="effect-row" data-afffx-id="'+esc(x.id)+'"><select '+attrs+' data-afffx-kind="'+kind+'" data-afffx-field="characterId">'+charOptions(x.characterId,"대상 선택")+'</select><input '+attrs+' type="number" min="-100" max="100" data-afffx-kind="'+kind+'" data-afffx-field="amount" value="'+x.amount+'"><label class="checkline compact"><input '+attrs+' type="checkbox" data-afffx-kind="'+kind+'" data-afffx-field="silent" '+(x.silent?"checked":"")+'> 알림 숨김</label><button '+attrs+' class="icon-button" data-action="delete-afffx" data-kind="'+kind+'">×</button></div>').join(""):'<div class="editor-note">변화 없음</div>')+
    '<button '+attrs+' class="small-button" data-action="add-afffx" data-kind="'+kind+'">+ 호감도 변화</button></div></div>'+
    '<div class="editor-block"><h4>감정 변화</h4><div class="effect-stack">'+
    (emo.length?emo.map(x=>'<div class="effect-row" data-emofx-id="'+esc(x.id)+'"><select '+attrs+' data-emofx-kind="'+kind+'" data-emofx-field="characterId">'+charOptions(x.characterId,"대상 선택")+'</select><select '+attrs+' data-emofx-kind="'+kind+'" data-emofx-field="state">'+EMOTIONS.map(y=>'<option value="'+y[0]+'" '+(x.state===y[0]?"selected":"")+'> '+y[1]+'</option>').join("")+'</select><input '+attrs+' type="number" min="0" max="100" data-emofx-kind="'+kind+'" data-emofx-field="intensity" value="'+x.intensity+'"><button '+attrs+' class="icon-button" data-action="delete-emofx" data-kind="'+kind+'">×</button></div>').join(""):'<div class="editor-note">변화 없음</div>')+
    '<button '+attrs+' class="small-button" data-action="add-emofx" data-kind="'+kind+'">+ 감정 변화</button></div></div>';
}
function renderVariableEffects(o,kind,attrs=""){
  const list=o.effects||[];
  return '<div class="editor-block"><h4>변수 효과</h4><div class="effect-stack">'+
  (list.length?list.map(x=>'<div class="effect-row" data-fx-id="'+esc(x.id)+'"><select '+attrs+' data-fx-kind="'+kind+'" data-fx-field="variableId">'+variableOptions(x.variableId)+'</select><select '+attrs+' data-fx-kind="'+kind+'" data-fx-field="operation"><option value="set" '+(x.operation==="set"?"selected":"")+'>대입</option><option value="add" '+(x.operation==="add"?"selected":"")+'>더하기</option><option value="subtract" '+(x.operation==="subtract"?"selected":"")+'>빼기</option><option value="toggle" '+(x.operation==="toggle"?"selected":"")+'>토글</option></select><input '+attrs+' data-fx-kind="'+kind+'" data-fx-field="value" value="'+esc(x.value)+'"><button '+attrs+' class="icon-button" data-action="delete-fx" data-kind="'+kind+'">×</button></div>').join(""):'<div class="editor-note">효과 없음</div>')+
  '<button '+attrs+' class="small-button" data-action="add-fx" data-kind="'+kind+'">+ 변수 효과</button></div></div>';
}
function itemOptions(selected=""){
  return '<option value="">아이템 선택</option>'+editorDraft.items.map(i=>
    '<option value="'+esc(i.id)+'" '+(i.id===selected?"selected":"")+'>'+esc(i.name)+' · '+esc(i.rarity)+'</option>'
  ).join("");
}
function renderItemEffects(o,kind,attrs=""){
  const list=o.itemEffects||[];
  return '<div class="editor-block"><h4>아이템 지급</h4><div class="effect-stack">'+
    (list.length?list.map(x=>'<div class="effect-row item-effect-row" data-itemfx-id="'+esc(x.id)+'"><select '+attrs+' data-itemfx-kind="'+kind+'" data-itemfx-field="itemId">'+itemOptions(x.itemId)+'</select><input '+attrs+' type="number" min="1" step="1" data-itemfx-kind="'+kind+'" data-itemfx-field="amount" value="'+x.amount+'"><label class="checkline compact"><input '+attrs+' type="checkbox" data-itemfx-kind="'+kind+'" data-itemfx-field="once" '+(x.once?"checked":"")+'> 1회만</label><span class="muted">'+esc(itemById(x.itemId,editorDraft)?.acquisitionMode==="unique"?"UNIQUE":"REPEATABLE")+'</span><button '+attrs+' class="icon-button" data-action="delete-itemfx" data-kind="'+kind+'">×</button></div>').join(""):'<div class="editor-note">지급 없음</div>')+
    '<button '+attrs+' class="small-button" data-action="add-itemfx" data-kind="'+kind+'">+ 아이템 지급</button></div></div>';
}

function getSelectedOwner(kind,element){
  if(kind==="entry")return findEntryContext(selectedEntryId)?.entry||null;
  if(kind==="option"){
    const card=element.closest("[data-option-id]");if(!card)return null;
    const choice=findEntryContext(selectedEntryId)?.entry;
    return choice?.type==="choice"?choice.options.find(o=>o.id===card.dataset.optionId)||null:null;
  }
  if(kind==="mini-entry"||kind==="mini-option"){
    const list=getInteractionFlowList(element.dataset.flowScope,element.dataset.flowOwnerId,element.dataset.flowItemId,element.dataset.flowKey);
    if(!list)return null;
    return kind==="mini-entry"
      ? findFlowEntryContext(list,element.dataset.miniOwnerId)?.entry||null
      : findFlowOption(list,element.dataset.miniOwnerId)||null;
  }
  return null;
}


function getInteractionFlowOwner(scope,ownerId,itemId=""){
  if(scope==="ask")return editorDraft.asks.find(a=>a.id===ownerId)||null;
  if(scope==="item-reaction"){
    const item=editorDraft.items.find(i=>i.id===itemId);
    return item?.reactions.find(r=>r.id===ownerId)||null;
  }
  return null;
}
function getInteractionFlowList(scope,ownerId,itemId="",flowKey="entries"){
  const owner=getInteractionFlowOwner(scope,ownerId,itemId);
  if(!owner)return null;
  const key=scope==="ask"?"entries":(["firstEntries","repeatEntries","specialEntries"].includes(flowKey)?flowKey:"firstEntries");
  owner[key] ||= [];
  return owner[key];
}

function findFlowEntryContext(entries,id,ancestors=[]){
  for(let i=0;i<entries.length;i++){
    const entry=entries[i];
    if(entry.id===id)return{entry,list:entries,index:i,ancestors};
    if(entry.type==="choice"){
      for(const option of entry.options){
        const found=findFlowEntryContext(option.entries,id,[...ancestors,{entry,option}]);
        if(found)return found;
      }
    }
  }
  return null;
}
function findFlowOption(entries,id){
  for(const entry of entries){
    if(entry.type!=="choice")continue;
    for(const option of entry.options){
      if(option.id===id)return option;
      const nested=findFlowOption(option.entries,id);
      if(nested)return nested;
    }
  }
  return null;
}
function removeFlowOption(entries,id){
  for(const entry of entries){
    if(entry.type!=="choice")continue;
    const index=entry.options.findIndex(option=>option.id===id);
    if(index>=0){entry.options.splice(index,1);return true}
    for(const option of entry.options){
      if(removeFlowOption(option.entries,id))return true;
    }
  }
  return false;
}
function refreshInteractionEditor(scope){
  if(scope==="ask")renderAskEditor();
  else renderItemEditor();
}
function refreshOwnerEditor(kind,element){
  if(kind==="mini-entry"||kind==="mini-option")refreshInteractionEditor(element.dataset.flowScope);
  else renderEventManager();
}

function flowData(scope,ownerId,itemId="",flowKey="entries"){
  return ' data-flow-scope="'+esc(scope)+'" data-flow-owner-id="'+esc(ownerId)+'" data-flow-item-id="'+esc(itemId)+'" data-flow-key="'+esc(flowKey)+'"';
}
function renderMiniAdvanced(owner,scope,ownerId,itemId,flowKey,targetKind,targetId){
  const kind=targetKind==="option"?"mini-option":"mini-entry";
  const attrs=flowData(scope,ownerId,itemId,flowKey)+' data-mini-owner-id="'+esc(targetId)+'"';
  return '<details class="advanced mini-advanced"><summary>조건 / 효과</summary>'+
    renderConditions(owner,kind,attrs)+
    renderQuickEffects(owner,kind,attrs)+
    renderVariableEffects(owner,kind,attrs)+
    renderItemEffects(owner,kind,attrs)+
  '</details>';
}

function renderInteractionFlow(entries,scope,ownerId,itemId="",depth=0,flowKey="entries"){
  entries=Array.isArray(entries)?entries:[];
  const attrs=flowData(scope,ownerId,itemId,flowKey);
  const list=entries.length?entries.map((entry,index)=>{
    let body="";
    if(entry.type==="dialogue"){
      body='<div class="mini-flow-fields"><select '+attrs+' data-mini-entry-id="'+esc(entry.id)+'" data-mini-entry-field="speakerCharacterId">'+charOptions(entry.speakerCharacterId,"이미지 유지")+'</select><input '+attrs+' data-mini-entry-id="'+esc(entry.id)+'" data-mini-entry-field="speaker" value="'+esc(entry.speaker||"")+'" placeholder="화자 이름"><textarea '+attrs+' data-mini-entry-id="'+esc(entry.id)+'" data-mini-entry-field="text" placeholder="대사">'+esc(entry.text||"")+'</textarea></div>'+
        renderMiniAdvanced(entry,scope,ownerId,itemId,flowKey,"entry",entry.id);
    }else if(entry.type==="narration"){
      body='<div class="mini-flow-fields"><textarea '+attrs+' data-mini-entry-id="'+esc(entry.id)+'" data-mini-entry-field="text" placeholder="지문">'+esc(entry.text||"")+'</textarea></div>'+
        renderMiniAdvanced(entry,scope,ownerId,itemId,flowKey,"entry",entry.id);
    }else{
      body='<div class="mini-flow-fields"><textarea '+attrs+' data-mini-entry-id="'+esc(entry.id)+'" data-mini-entry-field="prompt" placeholder="선택지 질문 / 상황">'+esc(entry.prompt||"")+'</textarea>'+
        renderMiniAdvanced(entry,scope,ownerId,itemId,flowKey,"entry",entry.id)+
        '<div class="mini-options">'+entry.options.map(option=>
          '<article class="mini-option"><div class="mini-option-head"><input '+attrs+' data-mini-option-id="'+esc(option.id)+'" data-mini-option-field="label" value="'+esc(option.label||"")+'" placeholder="선택지 문구"><select '+attrs+' data-mini-option-id="'+esc(option.id)+'" data-mini-option-field="exit"><option value="continue" '+(option.exitMode!=="end"?"selected":"")+'>분기 뒤 계속</option><option value="end" '+(option.exitMode==="end"?"selected":"")+'>상호작용 종료</option></select><button class="icon-button" type="button" data-action="mini-delete-option" '+attrs+' data-mini-option-id="'+esc(option.id)+'">×</button></div>'+
          renderMiniAdvanced(option,scope,ownerId,itemId,flowKey,"option",option.id)+
          renderInteractionFlow(option.entries,scope,ownerId,itemId,depth+1,flowKey)+
          '<div class="mini-add-row"><button class="small-button" type="button" data-action="mini-add-branch" data-type="dialogue" '+attrs+' data-parent-option-id="'+esc(option.id)+'">+ 대사</button><button class="small-button" type="button" data-action="mini-add-branch" data-type="narration" '+attrs+' data-parent-option-id="'+esc(option.id)+'">+ 지문</button><button class="small-button" type="button" data-action="mini-add-branch" data-type="choice" '+attrs+' data-parent-option-id="'+esc(option.id)+'">+ 선택지</button></div></article>'
        ).join("")+'</div>'+
        '<button class="small-button" type="button" data-action="mini-add-option" '+attrs+' data-mini-entry-id="'+esc(entry.id)+'">+ 선택지 항목</button></div>';
    }
    return '<article class="mini-flow-entry depth-'+Math.min(depth,3)+'"><header><span>'+(index+1)+' · '+esc(entry.type.toUpperCase())+'</span><button class="icon-button" type="button" data-action="mini-delete-entry" '+attrs+' data-mini-entry-id="'+esc(entry.id)+'">×</button></header>'+body+'</article>';
  }).join(""):'<div class="editor-note">아직 흐름이 없습니다.</div>';
  return '<div class="mini-flow-list">'+list+'</div>';
}
function interactionFlowEditor(entries,scope,ownerId,itemId="",flowKey="entries",title="REACTION FLOW"){
  const attrs=flowData(scope,ownerId,itemId,flowKey);
  return '<section class="mini-flow-editor"><div class="mini-flow-title"><div><strong>'+esc(title)+'</strong><small>대사 · 지문 · 선택지를 원하는 순서로 구성합니다.</small></div><div class="mini-add-row"><button class="small-button" type="button" data-action="mini-add-entry" data-type="dialogue" '+attrs+'>+ 대사</button><button class="small-button" type="button" data-action="mini-add-entry" data-type="narration" '+attrs+'>+ 지문</button><button class="small-button" type="button" data-action="mini-add-entry" data-type="choice" '+attrs+'>+ 선택지</button></div></div>'+renderInteractionFlow(entries,scope,ownerId,itemId,0,flowKey)+'</section>';
}
function renderAskUnlockEditor(a){
  const vc=a.unlockCondition||{variableId:"",operator:"==",value:""};
  const ic=a.unlockItemCondition||{itemId:"",operator:">=",value:1};
  const qc=a.unlockAskCondition||{askId:"",status:"asked"};
  const ec=a.unlockEmotionCondition||{characterId:"",state:"",intensityOperator:">=",intensityValue:0};
  const asked=(editorDraft.askedAskIds||[]).includes(a.id);
  const unlocked=!a.startLocked||(editorDraft.unlockedAskIds||[]).includes(a.id);
  const status=asked?"ASKED":unlocked?"UNLOCKED":"LOCKED";
  return '<details class="ask-unlock-editor"><summary>해금 조건 · '+status+'</summary><div class="ask-unlock-grid">'+
    '<label class="checkline"><input type="checkbox" data-ask-bind="startLocked" '+(a.startLocked?"checked":"")+'> 처음에는 LOCKED</label>'+
    '<label class="field"><span>해금 힌트</span><input data-ask-bind="unlockHint" value="'+esc(a.unlockHint||"")+'" placeholder="예: 조금 더 친해져야 할 것 같다"></label>'+
    '<label class="field"><span>해금 최소 호감도</span><input type="number" min="0" max="100" data-ask-bind="unlockMinAffection" value="'+a.unlockMinAffection+'"></label>'+
    '<label class="field"><span>변수</span><select data-ask-unlock-var-field="variableId">'+variableOptions(vc.variableId)+'</select></label>'+
    '<label class="field"><span>변수 비교</span><select data-ask-unlock-var-field="operator">'+conditionOperatorOptions(vc.operator)+'</select></label>'+
    '<label class="field"><span>변수 값</span><input data-ask-unlock-var-field="value" value="'+esc(vc.value)+'"></label>'+
    '<label class="field"><span>필요 아이템</span><select data-ask-unlock-item-field="itemId">'+itemOptions(ic.itemId)+'</select></label>'+
    '<label class="field"><span>보유 비교</span><select data-ask-unlock-item-field="operator">'+numberOperatorOptions(ic.operator)+'</select></label>'+
    '<label class="field"><span>필요 개수</span><input type="number" min="0" data-ask-unlock-item-field="value" value="'+ic.value+'"></label>'+
    '<label class="field"><span>다른 ASK</span><select data-ask-unlock-ask-field="askId">'+askOptions(qc.askId)+'</select></label>'+
    '<label class="field"><span>ASK 상태</span><select data-ask-unlock-ask-field="status"><option value="asked" '+(qc.status==="asked"?"selected":"")+'>ASKED</option><option value="not-asked" '+(qc.status==="not-asked"?"selected":"")+'>NOT ASKED</option><option value="unlocked" '+(qc.status==="unlocked"?"selected":"")+'>UNLOCKED</option><option value="locked" '+(qc.status==="locked"?"selected":"")+'>LOCKED</option></select></label>'+
    '<label class="field"><span>감정 대상</span><select data-ask-unlock-emo-field="characterId">'+charOptions(ec.characterId,"감정 무관")+'</select></label>'+
    '<label class="field"><span>감정</span><select data-ask-unlock-emo-field="state"><option value="">감정 무관</option>'+EMOTIONS.map(x=>'<option value="'+x[0]+'" '+(ec.state===x[0]?"selected":"")+'>'+x[1]+'</option>').join("")+'</select></label>'+
    '<label class="field"><span>강도 비교</span><select data-ask-unlock-emo-field="intensityOperator">'+numberOperatorOptions(ec.intensityOperator,true)+'</select></label>'+
    '<label class="field"><span>최소 강도</span><input type="number" min="0" max="100" data-ask-unlock-emo-field="intensityValue" value="'+ec.intensityValue+'"></label>'+
  '</div></details>';
}
function renderAskEditor(){
  const q=editorAskQuery.trim().toLowerCase();
  const filtered=editorDraft.asks.filter(a=>{
    if(!q)return true;
    return [a.label,getCharacterDraft(a.characterId)?.name,a.id].join(" ").toLowerCase().includes(q);
  });
  const pages=Math.max(1,Math.ceil(filtered.length/EDITOR_ASK_PAGE_SIZE));
  editorAskPage=Math.max(0,Math.min(editorAskPage,pages-1));
  const visible=filtered.slice(editorAskPage*EDITOR_ASK_PAGE_SIZE,(editorAskPage+1)*EDITOR_ASK_PAGE_SIZE);
  if(!editorDraft.asks.some(a=>a.id===selectedAskId))selectedAskId=filtered[0]?.id||editorDraft.asks[0]?.id||"";
  if(filtered.length&&!filtered.some(a=>a.id===selectedAskId))selectedAskId=filtered[0].id;
  const a=editorDraft.asks.find(x=>x.id===selectedAskId)||null;

  editorBody.innerHTML=editorHead("ASK","ASK 설정","목록에서 질문 하나를 선택해 해당 FLOW만 편집합니다.",'<button class="small-button" data-action="new-ask">+ 질문</button>')+
    '<div class="editor-list-toolbar"><input data-editor-search="ask" value="'+esc(editorAskQuery)+'" placeholder="ASK / 캐릭터 검색"><span>'+filtered.length+' / '+editorDraft.asks.length+'</span></div>'+
    '<div class="manager-layout editor-select-layout"><aside class="manager-list"><div class="manager-list-items">'+
      (visible.length?visible.map(x=>'<button class="manager-item '+(x.id===selectedAskId?"active":"")+'" data-action="select-ask" data-id="'+esc(x.id)+'"><strong>'+esc(x.label)+'</strong><small>'+esc(getCharacterDraft(x.characterId)?.name||"캐릭터 미지정")+(x.enabled?"":" · HIDDEN")+'</small></button>').join(""):'<div class="editor-note">검색 결과가 없습니다.</div>')+
      '</div>'+editorPager("ask",editorAskPage,filtered.length,EDITOR_ASK_PAGE_SIZE,"ASK")+'</aside>'+
      '<section class="manager-detail">'+(a?
        '<div class="ask-row interaction-editor-row editor-single-detail" data-ask-id="'+esc(a.id)+'">'+
          '<select data-ask-bind="characterId">'+charOptions(a.characterId,"질문 대상")+'</select>'+
          '<input data-ask-bind="label" value="'+esc(a.label)+'" placeholder="질문 문구">'+
          '<label class="field"><span>사용 최소 호감도</span><input type="number" min="0" max="100" data-ask-bind="minAffection" value="'+a.minAffection+'"></label>'+
          '<label class="checkline"><input type="checkbox" data-ask-bind="enabled" '+(a.enabled?"checked":"")+'> 사용</label>'+
          '<button class="danger-button" data-action="delete-ask">현재 ASK 삭제</button>'+
          '<div class="full-row interaction-response-editor">'+
            renderAskUnlockEditor(a)+
            '<label class="checkline"><input type="checkbox" data-ask-bind="repeatable" '+(a.repeatable?"checked":"")+'> ASKED 이후에도 다시 물을 수 있게 허용</label>'+
            '<p class="editor-note">반복을 켜지 않으면 한 번 확인한 ASK는 플레이 화면에서 완료 처리됩니다.</p>'+
            '<div class="interaction-effect-grid">'+
              '<label class="field"><span>질문 실행 시 호감도 변화</span><input type="number" min="-100" max="100" data-ask-bind="affectionDelta" value="'+a.affectionDelta+'"></label>'+
              '<label class="field"><span>감정 변화</span><select data-ask-bind="emotionState"><option value="">변경 없음</option>'+EMOTIONS.map(x=>'<option value="'+x[0]+'" '+(a.emotionState===x[0]?"selected":"")+'> '+x[1]+'</option>').join("")+'</select></label>'+
              '<label class="field"><span>감정 강도</span><input type="number" min="0" max="100" data-ask-bind="emotionIntensity" value="'+a.emotionIntensity+'"></label>'+
            '</div>'+interactionFlowEditor(a.entries,"ask",a.id)+
          '</div>'+
        '</div>'
        :'<div class="inspector-empty">왼쪽에서 ASK를 선택하세요.</div>')+
      '</section></div>';
}
function renderItemEditor(){
  const q=editorItemQuery.trim().toLowerCase();
  const categories=editorDraft.itemCategories?.length?editorDraft.itemCategories:["기타"];
  const filtered=editorDraft.items.filter(i=>{
    if(editorItemCharacterFilter!=="ALL"&&i.collectionCharacterId!==editorItemCharacterFilter)return false;
    if(editorItemRarityFilter!=="ALL"&&i.rarity!==editorItemRarityFilter)return false;
    if(editorItemCategoryFilter!=="ALL"&&i.category!==editorItemCategoryFilter)return false;
    if(q){
      const linkedEvent=editorDraft.events.find(event=>event.id===i.inventoryEventId);
      const text=[i.name,i.description,i.category,i.rarity,itemSourceLabel(i,editorDraft),getCharacterDraft(i.collectionCharacterId)?.name,linkedEvent?.name]
        .join(" ").toLowerCase();
      if(!text.includes(q))return false;
    }
    return true;
  });
  const pages=Math.max(1,Math.ceil(filtered.length/EDITOR_ITEM_PAGE_SIZE));
  editorItemPage=Math.max(0,Math.min(editorItemPage,pages-1));
  const visible=filtered.slice(editorItemPage*EDITOR_ITEM_PAGE_SIZE,(editorItemPage+1)*EDITOR_ITEM_PAGE_SIZE);
  if(!editorDraft.items.some(i=>i.id===selectedItemId))selectedItemId=filtered[0]?.id||editorDraft.items[0]?.id||"";
  if(filtered.length&&!filtered.some(i=>i.id===selectedItemId))selectedItemId=filtered[0].id;
  const i=editorDraft.items.find(x=>x.id===selectedItemId)||null;

  editorBody.innerHTML=editorHead("ITEM","아이템 설정","목록에서 아이템 하나를 선택해 해당 반응만 편집합니다.",'<button class="small-button" data-action="new-item">+ 아이템</button>')+
    '<section class="settings-card item-category-manager"><div class="manager-list-head"><div><h3>CATEGORIES</h3><p class="muted">희귀도와 별개인 물건 종류입니다.</p></div></div>'+
      '<div class="category-list">'+categories.map(cat=>'<span class="category-tag">'+esc(cat)+(cat!=="기타"?'<button type="button" data-action="delete-item-category" data-id="'+esc(cat)+'">×</button>':'')+'</span>').join("")+'</div>'+
      '<div class="category-add-row"><input id="newItemCategoryInput" placeholder="새 아이템 카테고리"><button class="small-button" type="button" data-action="add-item-category">추가</button></div>'+
    '</section>'+
    '<div class="item-editor-toolbar">'+
      '<input data-item-editor-filter="query" value="'+esc(editorItemQuery)+'" placeholder="아이템 검색 · 이름 / 설명 / 캐릭터 / 획득처">'+
      '<select data-item-editor-filter="character"><option value="ALL">모든 캐릭터</option>'+editorDraft.characters.map(ch=>'<option value="'+esc(ch.id)+'" '+(editorItemCharacterFilter===ch.id?"selected":"")+'>'+esc(ch.name)+'</option>').join("")+'</select>'+
      '<select data-item-editor-filter="rarity"><option value="ALL">모든 희귀도</option>'+RARITIES.map(r=>'<option value="'+r+'" '+(editorItemRarityFilter===r?"selected":"")+'>'+r+'</option>').join("")+'</select>'+
      '<select data-item-editor-filter="category"><option value="ALL">모든 카테고리</option>'+categories.map(cat=>'<option value="'+esc(cat)+'" '+(editorItemCategoryFilter===cat?"selected":"")+'>'+esc(cat)+'</option>').join("")+'</select>'+
      '<span class="item-filter-count">'+filtered.length+' / '+editorDraft.items.length+'</span>'+
    '</div>'+
    '<div class="manager-layout editor-select-layout"><aside class="manager-list"><div class="manager-list-items">'+
      (visible.length?visible.map(x=>'<button class="manager-item '+(x.id===selectedItemId?"active":"")+'" data-action="select-item" data-id="'+esc(x.id)+'"><strong>'+esc(itemEmoji(x))+' '+esc(x.name)+'</strong><small>'+esc(x.rarity)+' · '+esc(getCharacterDraft(x.collectionCharacterId)?.name||"미지정")+'</small></button>').join(""):'<div class="editor-note">검색 결과가 없습니다.</div>')+
      '</div>'+editorPager("item",editorItemPage,filtered.length,EDITOR_ITEM_PAGE_SIZE,"ITEM")+'</aside>'+
      '<section class="manager-detail">'+(i?renderSelectedItemEditor(i,categories):'<div class="inspector-empty">왼쪽에서 아이템을 선택하세요.</div>')+'</section></div>';
}
function autoItemReactionForEditor(item,character){
  if(typeof window.HV_BUILD_ITEM_REACTION!=="function")return null;
  try{return normalizeItemReaction(window.HV_BUILD_ITEM_REACTION(item,character),character.id)}catch{return null}
}
function reactionPreviewText(reaction){
  const lists=[reaction?.firstEntries,reaction?.repeatEntries,reaction?.specialEntries];
  for(const list of lists){
    const entry=(list||[]).find(row=>row.type==="dialogue"&&row.text)||(list||[]).find(row=>row.text);
    if(entry?.text)return entry.text;
  }
  return"자동 대사를 만들 수 없습니다.";
}
function itemInventoryEventOptions(item){
  const order=["talk","entry","exit","story"];
  return '<option value="">대화에서 지급하지 않음</option>'+order.map(role=>{
    const events=editorDraft.events.filter(event=>editorEventRole(event)===role);
    if(!events.length)return"";
    return '<optgroup label="'+role.toUpperCase()+'">'+events.map(event=>'<option value="'+esc(event.id)+'" '+(item.inventoryEventId===event.id?"selected":"")+'>'+esc(event.name)+' · '+esc(getCharacterDraft(event.characterId)?.name||"캐릭터 미지정")+'</option>').join("")+'</optgroup>';
  }).join("");
}
function renderSelectedItemEditor(i,categories){
  const configured=new Set(i.reactions.map(r=>r.characterId).filter(id=>editorDraft.characters.some(ch=>ch.id===id))).size;
  const autoCharacters=i.giftable===false?[]:editorDraft.characters.filter(character=>!i.reactions.some(reaction=>reaction.characterId===character.id));
  const covered=configured+autoCharacters.length;
  const categoryOptions=[...new Set([...categories,i.category].filter(Boolean))];
  return '<div class="item-row interaction-editor-row editor-single-detail" data-item-id="'+esc(i.id)+'">'+
    '<select data-item-bind="collectionCharacterId">'+charOptions(i.collectionCharacterId,"컬렉션 소속")+'</select>'+
    '<input data-item-bind="name" value="'+esc(i.name)+'" placeholder="아이템 이름">'+
    '<input data-item-bind="symbol" value="'+esc(itemEmoji(i))+'" placeholder="이모티콘 · 예: 🦆" maxlength="8">'+
    '<select data-item-bind="rarity">'+RARITIES.map(r=>'<option '+(i.rarity===r?"selected":"")+'>'+r+'</option>').join("")+'</select>'+
    '<select data-item-bind="category">'+categoryOptions.map(cat=>'<option value="'+esc(cat)+'" '+(i.category===cat?"selected":"")+'>'+esc(cat)+'</option>').join("")+'</select>'+
    '<select data-item-bind="acquisitionMode"><option value="repeatable" '+(i.acquisitionMode==="repeatable"?"selected":"")+'>REPEATABLE</option><option value="unique" '+(i.acquisitionMode==="unique"?"selected":"")+'>UNIQUE</option></select>'+
    '<button class="danger-button" data-action="delete-item">현재 아이템 삭제</button>'+
    '<div class="full-row item-meta-strip"><span>'+esc(itemSourceLabel(i,editorDraft))+'</span><span>'+covered+' / '+editorDraft.characters.length+' REACTIONS · '+configured+' MANUAL + '+autoCharacters.length+' AUTO</span><span>OWNED ×'+itemCount(i.id,editorDraft)+'</span></div>'+
    '<div class="full-row interaction-response-editor">'+
      '<div class="inline-grid"><label class="checkline"><input type="checkbox" data-item-bind="gachaEnabled" '+(i.gachaEnabled?"checked":"")+'> 가챠 포함</label><label class="checkline"><input type="checkbox" data-item-bind="giftable" '+(i.giftable!==false?"checked":"")+'> 선물 가능</label><label class="checkline"><input type="checkbox" data-item-bind="enabled" '+(i.enabled?"checked":"")+'> 사용</label><label class="checkline"><input type="checkbox" data-item-bind="secret" '+(i.secret?"checked":"")+'> SECRET</label><label class="field"><span>선물 시 처리</span><select data-item-bind="giftUseMode"><option value="keep" '+(i.giftUseMode==="keep"?"selected":"")+'>KEEP · 유지</option><option value="consume" '+(i.giftUseMode==="consume"?"selected":"")+'>CONSUMABLE · 1개 소비</option></select></label><label class="field"><span>가챠 가중치</span><input type="number" min=".01" step=".01" data-item-bind="weight" value="'+i.weight+'"></label></div>'+
      '<label class="field full"><span>아이템 설명</span><textarea data-item-bind="description">'+esc(i.description)+'</textarea></label>'+
      '<label class="field full"><span>가챠 등장 대사 · REVEAL LINE</span><textarea data-item-bind="gachaLine" placeholder="가챠에서 이 아이템이 등장할 때 표시할 대사">'+esc(itemGachaLine(i))+'</textarea></label>'+
      '<section class="item-acquisition-editor"><div><strong>DIALOGUE ACQUISITION</strong><p>선택한 대화의 마지막에 1회성 아이템 지급 지문을 연결합니다.</p></div><label class="field"><span>획득 이벤트</span><select data-item-bind="inventoryEventId">'+itemInventoryEventOptions(i)+'</select></label>'+
        (i.inventoryEventId?'<small>'+esc(editorDraft.events.find(event=>event.id===i.inventoryEventId)?.name||"삭제된 이벤트")+' 완료 시 처음 한 번만 지급됩니다.</small>':'<small>가챠나 직접 지급만 사용합니다.</small>')+'</section>'+
      '<div class="reaction-manager"><div class="manager-list-head"><div><strong>CHARACTER REACTIONS</strong><p class="muted">현재 아이템의 캐릭터별 선물 반응만 표시합니다.</p></div><button class="small-button" type="button" data-action="new-item-reaction" data-item-id="'+esc(i.id)+'">+ 캐릭터 반응</button></div>'+
      (i.reactions.length?i.reactions.map(r=>'<article class="item-reaction-card" data-item-id="'+esc(i.id)+'" data-reaction-id="'+esc(r.id)+'"><div class="item-reaction-head">'+
        '<select data-reaction-bind="characterId">'+charOptions(r.characterId,"선물 대상")+'</select>'+
        '<label class="field"><span>취향</span><select data-reaction-bind="preference">'+GIFT_PREFERENCES.map(p=>'<option value="'+p[0]+'" '+(r.preference===p[0]?"selected":"")+'> '+p[0]+'</option>').join("")+'</select></label>'+
        '<label class="field"><span>호감도</span><input type="number" min="-100" max="100" data-reaction-bind="affectionDelta" value="'+r.affectionDelta+'"></label>'+
        '<label class="field"><span>감정</span><select data-reaction-bind="emotionState"><option value="">변경 없음</option>'+EMOTIONS.map(x=>'<option value="'+x[0]+'" '+(r.emotionState===x[0]?"selected":"")+'> '+x[1]+'</option>').join("")+'</select></label>'+
        '<label class="field"><span>강도</span><input type="number" min="0" max="100" data-reaction-bind="emotionIntensity" value="'+r.emotionIntensity+'"></label>'+
        '<button class="danger-button" type="button" data-action="delete-item-reaction">×</button></div>'+
        '<div class="special-reaction-rule"><label class="field"><span>SPECIAL 최소 호감도</span><input type="number" min="0" max="100" data-reaction-bind="specialMinAffection" value="'+r.specialMinAffection+'"></label><label class="field"><span>SPECIAL 감정</span><select data-reaction-bind="specialEmotionState"><option value="">감정 조건 없음</option>'+EMOTIONS.map(x=>'<option value="'+x[0]+'" '+(r.specialEmotionState===x[0]?"selected":"")+'> '+x[1]+'</option>').join("")+'</select></label><label class="field"><span>SPECIAL 최소 강도</span><input type="number" min="0" max="100" data-reaction-bind="specialEmotionIntensity" value="'+r.specialEmotionIntensity+'"></label></div>'+
        interactionFlowEditor(r.firstEntries,"item-reaction",r.id,i.id,"firstEntries","FIRST GIFT")+
        interactionFlowEditor(r.repeatEntries,"item-reaction",r.id,i.id,"repeatEntries","REPEAT GIFT")+
        interactionFlowEditor(r.specialEntries,"item-reaction",r.id,i.id,"specialEntries","SPECIAL")+
      '</article>').join(""):'<div class="editor-note">캐릭터별 반응이 없습니다.</div>')+
      '</div>'+
      (autoCharacters.length?'<details class="auto-reaction-browser" open><summary><span>AUTO REACTIONS</span><b>'+autoCharacters.length+'</b><small>자동 생성된 반응을 확인하고 필요한 것만 수동 편집으로 고정하세요.</small></summary><div class="auto-reaction-list">'+autoCharacters.map(character=>{
        const reaction=autoItemReactionForEditor(i,character);
        if(!reaction)return"";
        return '<article class="auto-reaction-row"><div><strong>'+esc(character.name)+'</strong><span class="reaction-preference '+reaction.preference.toLowerCase()+'">'+esc(reaction.preference)+'</span><small>호감도 '+(reaction.affectionDelta>=0?"+":"")+reaction.affectionDelta+' · '+esc(reaction.emotionState||"감정 유지")+' '+reaction.emotionIntensity+'</small></div><p>'+esc(reactionPreviewText(reaction))+'</p><button class="small-button" type="button" data-action="materialize-item-reaction" data-item-id="'+esc(i.id)+'" data-character-id="'+esc(character.id)+'">수동 편집으로 전환</button></article>';
      }).join("")+'</div></details>':'')+
    '</div>'+
  '</div>';
}
function renderGachaEditor(){
  const total=RARITIES.reduce((s,r)=>s+Number(editorDraft.gacha.rarityWeights[r]||0),0)||1;
  const pool=editorDraft.items.filter(i=>i.enabled&&i.gachaEnabled);
  const profiles=editorDraft.characters.map(ch=>{
    const profile=gachaProfileForCharacter(ch.id,editorDraft);
    const count=pool.filter(i=>i.collectionCharacterId===ch.id).length;
    return {ch,profile,count};
  });
  editorBody.innerHTML=editorHead("GACHA","가챠 설정","아이템 설정의 가챠 포함 항목을 대상으로 비용·확률을 관리합니다.")+
  '<div class="settings-grid"><section class="settings-card"><h3>BASIC</h3><div class="form-grid"><label class="checkline"><input type="checkbox" data-gacha-bind="enabled" '+(editorDraft.gacha.enabled?"checked":"")+'> 가챠 사용</label><label class="field"><span>재화 이름</span><input data-gacha-bind="currencyName" value="'+esc(editorDraft.gacha.currencyName)+'"></label><label class="field"><span>현재 재화</span><input type="number" min="0" data-gacha-bind="balance" value="'+editorDraft.gacha.balance+'"></label><label class="field"><span>1회 비용</span><input type="number" min="0" data-gacha-bind="singleCost" value="'+editorDraft.gacha.singleCost+'"></label><label class="field"><span>10회 비용</span><input type="number" min="0" data-gacha-bind="tenCost" value="'+editorDraft.gacha.tenCost+'"></label></div></section>'+
  '<section class="settings-card"><h3>RARITY WEIGHT</h3><div class="rarity-editor">'+RARITIES.map(r=>'<label class="rarity-edit-row"><span>'+r+' · '+((editorDraft.gacha.rarityWeights[r]/total)*100).toFixed(1)+'%</span><input type="number" min="0" step="1" data-rarity="'+r+'" value="'+editorDraft.gacha.rarityWeights[r]+'"></label>').join("")+'</div></section></div>'+
  '<div class="settings-card gacha-profile-editor" style="margin-top:14px"><div class="manager-list-head"><div><h3>CHARACTER GACHA PROFILES</h3><p class="muted">캐릭터별 아이콘·제목·설명입니다. REVEAL LINE은 공용 멘트가 아니라 각 아이템의 “가챠 등장 대사”를 사용합니다.</p></div><b>'+profiles.length+' PROFILES</b></div>'+
  '<div class="gacha-profile-editor-grid">'+profiles.map(({ch,profile,count})=>'<article class="gacha-profile-editor-card"><span>'+esc(profile?.icon||"🎴")+'</span><div><strong>'+esc(profile?.title||ch.name+" GACHA")+'</strong><small>'+esc(ch.name)+' · '+count+' ITEMS</small><p>'+esc(profile?.description||"설명 없음")+'</p></div></article>').join("")+'</div></div>'+
  '<div class="settings-card" style="margin-top:14px"><h3>ITEM POOL</h3><p class="muted">아이템 설정에서 “가챠 포함”을 켠 항목입니다.</p><div class="table-editor">'+
  (pool.length?pool.map(i=>'<div class="table-row"><span>'+esc(itemEmoji(i))+' '+esc(i.name)+'</span><span>'+esc(i.rarity)+'</span><span>WEIGHT '+i.weight+'</span><span>'+esc(getCharacterDraft(i.collectionCharacterId)?.name||"캐릭터 미지정")+'</span><span>'+(itemGachaLine(i)?'REVEAL ✓':'REVEAL —')+'</span></div>').join(""):'<div class="editor-note">현재 가챠 풀에 등록된 아이템이 없습니다.</div>')+'</div></div>';
}
function renderThoughtEditor(){
  const q=editorThoughtQuery.trim().toLowerCase();
  const filtered=editorDraft.thoughts.filter(t=>{
    if(!q)return true;
    return [t.text,t.category,getCharacterDraft(t.characterId)?.name,t.id].join(" ").toLowerCase().includes(q);
  });
  const pages=Math.max(1,Math.ceil(filtered.length/EDITOR_THOUGHT_PAGE_SIZE));
  editorThoughtPage=Math.max(0,Math.min(editorThoughtPage,pages-1));
  const visible=filtered.slice(editorThoughtPage*EDITOR_THOUGHT_PAGE_SIZE,(editorThoughtPage+1)*EDITOR_THOUGHT_PAGE_SIZE);
  if(!editorDraft.thoughts.some(t=>t.id===selectedThoughtId))selectedThoughtId=filtered[0]?.id||editorDraft.thoughts[0]?.id||"";
  if(filtered.length&&!filtered.some(t=>t.id===selectedThoughtId))selectedThoughtId=filtered[0].id;
  const t=editorDraft.thoughts.find(x=>x.id===selectedThoughtId)||null;

  editorBody.innerHTML=editorHead("THOUGHT","Thought 설정","목록에서 한 문장만 선택해 편집합니다.",'<button class="small-button" data-action="new-thought">+ Thought</button>')+
    '<section class="settings-card" style="margin-top:16px"><h3>CATEGORIES</h3><div class="category-list">'+editorDraft.thoughtSettings.categories.map(c=>'<span class="category-tag">'+esc(c)+'<button data-action="delete-category" data-id="'+esc(c)+'">×</button></span>').join("")+'</div><div style="display:flex;gap:7px;margin-top:10px"><input id="newCategoryInput" placeholder="새 카테고리"><button class="small-button" data-action="add-category">추가</button></div></section>'+
    '<div class="editor-list-toolbar"><input data-editor-search="thought" value="'+esc(editorThoughtQuery)+'" placeholder="THOUGHT / 캐릭터 / 카테고리 검색"><span>'+filtered.length+' / '+editorDraft.thoughts.length+'</span></div>'+
    '<div class="manager-layout editor-select-layout"><aside class="manager-list"><div class="manager-list-items">'+
      (visible.length?visible.map(x=>'<button class="manager-item '+(x.id===selectedThoughtId?"active":"")+'" data-action="select-thought" data-id="'+esc(x.id)+'"><strong>'+esc((x.text||"빈 문장").slice(0,52))+'</strong><small>'+esc(getCharacterDraft(x.characterId)?.name||"캐릭터 미지정")+' · '+esc(x.category)+'</small></button>').join(""):'<div class="editor-note">검색 결과가 없습니다.</div>')+
      '</div>'+editorPager("thought",editorThoughtPage,filtered.length,EDITOR_THOUGHT_PAGE_SIZE,"THOUGHT")+'</aside>'+
      '<section class="manager-detail">'+(t?
        '<div class="table-row thought-row editor-single-detail" data-thought-id="'+esc(t.id)+'">'+
          '<select data-thought-bind="characterId">'+charOptions(t.characterId,"캐릭터")+'</select>'+
          '<select data-thought-bind="category">'+editorDraft.thoughtSettings.categories.map(cat=>'<option '+(t.category===cat?"selected":"")+'>'+esc(cat)+'</option>').join("")+'</select>'+
          '<select data-thought-bind="frequency">'+FREQUENCIES.map(f=>'<option value="'+f[0]+'" '+(t.frequency===f[0]?"selected":"")+'> '+f[1]+'</option>').join("")+'</select>'+
          '<select data-thought-bind="rarity">'+RARITIES.map(r=>'<option '+(t.rarity===r?"selected":"")+'>'+r+'</option>').join("")+'</select>'+
          '<textarea data-thought-bind="text">'+esc(t.text)+'</textarea>'+
          '<span><label class="checkline"><input type="checkbox" data-thought-bind="enabled" '+(t.enabled?"checked":"")+'> 사용</label><button class="danger-button" data-action="delete-thought">현재 THOUGHT 삭제</button></span>'+
        '</div>'
        :'<div class="inspector-empty">왼쪽에서 THOUGHT를 선택하세요.</div>')+
      '</section></div>';
}
function renderCollectionEditor(){
  const chars=editorDraft.characters;
  const overall=collectionOverallProgress(editorDraft);
  const fresh=editorDraft.newItemIds.filter(id=>hasEverAcquired(id,editorDraft)).length;
  editorBody.innerHTML=editorHead("COLLECTION","컬렉션 설정","컬렉션은 현재 인벤토리가 아니라 한 번이라도 발견한 아이템을 기록하는 아카이브입니다.")+
    '<div class="settings-grid">'+
      '<section class="settings-card"><h3>DISPLAY</h3>'+
        '<label class="checkline"><input type="checkbox" data-collection-setting="showLocked" '+(editorDraft.collectionSettings.showLocked?"checked":"")+'> 미획득 일반 아이템도 LOCKED로 표시</label>'+
        '<label class="checkline"><input type="checkbox" data-collection-setting="showOwnedCount" '+(editorDraft.collectionSettings.showOwnedCount?"checked":"")+'> 현재 인벤토리 개수 표시</label>'+
        '<label class="field"><span>기본 보기</span><select data-collection-setting="view"><option value="grouped" '+(editorDraft.collectionSettings.view==="grouped"?"selected":"")+'>캐릭터별 묶기</option><option value="all" '+(editorDraft.collectionSettings.view==="all"?"selected":"")+'>전체 카드</option></select></label>'+
        '<label class="field"><span>기본 정렬</span><select data-collection-setting="sort"><option value="recent" '+(editorDraft.collectionSettings.sort==="recent"?"selected":"")+'>최근 획득</option><option value="rarity" '+(editorDraft.collectionSettings.sort==="rarity"?"selected":"")+'>희귀도</option><option value="name" '+(editorDraft.collectionSettings.sort==="name"?"selected":"")+'>이름</option><option value="count" '+(editorDraft.collectionSettings.sort==="count"?"selected":"")+'>보유 수</option></select></label>'+
      '</section>'+
      '<section class="settings-card"><h3>SUMMARY</h3><p class="muted">미발견 SECRET은 전체 개수와 완성도에 포함되지 않습니다.</p>'+
        '<div class="collection-editor-summary"><b>'+overall.total+'</b><span>VISIBLE</span><b>'+overall.acquired+'</b><span>ARCHIVED</span><b>'+fresh+'</b><span>NEW</span></div>'+
        '<div class="collection-progress-track"><div style="width:'+overall.percent+'%"></div></div><p class="muted">'+overall.percent+'% COMPLETE</p>'+
      '</section>'+
    '</div>'+
    (chars.length?chars.map(ch=>{
      const progress=collectionProgressForCharacter(ch.id,editorDraft);
      const items=editorDraft.items.filter(i=>i.collectionCharacterId===ch.id&&(!i.secret||hasEverAcquired(i.id,editorDraft)));
      return '<section class="collection-preview-group"><div class="collection-group-head"><h3>'+esc(ch.name)+'</h3><span>'+progress.acquired+' / '+progress.total+' · '+progress.percent+'%</span></div><div class="collection-progress-track"><div style="width:'+progress.percent+'%"></div></div><div class="collection-preview-items">'+
        (items.length?items.map(i=>{
          const count=itemCount(i.id,editorDraft),archived=hasEverAcquired(i.id,editorDraft),isNew=editorDraft.newItemIds.includes(i.id);
          return '<div class="collection-preview-item '+(isNew?"is-new":"")+'"><b>'+(archived?esc(i.name):"LOCKED")+(isNew?' · NEW':'')+(i.secret?' · SECRET':'')+'</b><small>'+esc(i.rarity)+' · '+esc(i.category)+' · '+esc(itemSourceLabel(i,editorDraft))+'</small><div>'+esc(i.acquisitionMode.toUpperCase())+' · INVENTORY '+count+' · '+new Set(i.reactions.map(r=>r.characterId).filter(Boolean)).size+' REACTIONS</div></div>';
        }).join(""):'<div class="editor-note">현재 표시되는 아이템이 없습니다.</div>')+
      '</div></section>';
    }).join(""):'<div class="editor-note">캐릭터가 없습니다.</div>');
}


function walkEntries(entries,visit){
  for(const entry of entries||[]){
    visit(entry,"entry");
    if(entry.type==="choice"){
      for(const option of entry.options||[]){
        visit(option,"option");
        walkEntries(option.entries,visit);
      }
    }
  }
}
function walkProjectOwners(source,visit){
  source.events.forEach(ev=>walkEntries(ev.entries,(owner,type)=>visit(owner,type,"EVENT · "+ev.name)));
  source.asks.forEach(ask=>walkEntries(ask.entries,(owner,type)=>visit(owner,type,"ASK · "+ask.label)));
  source.items.forEach(item=>item.reactions.forEach(r=>{
    const ch=source.characters.find(c=>c.id===r.characterId);
    walkEntries(r.firstEntries,(owner,type)=>visit(owner,type,"GIFT FIRST · "+item.name+" · "+(ch?.name||"미지정")));
    walkEntries(r.repeatEntries,(owner,type)=>visit(owner,type,"GIFT REPEAT · "+item.name+" · "+(ch?.name||"미지정")));
    walkEntries(r.specialEntries,(owner,type)=>visit(owner,type,"GIFT SPECIAL · "+item.name+" · "+(ch?.name||"미지정")));
  }));
}
function cleanVariableReference(id){
  walkProjectOwners(editorDraft,owner=>{
    if(owner.condition?.variableId===id)owner.condition=null;
    owner.effects=(owner.effects||[]).filter(f=>f.variableId!==id);
  });
  editorDraft.asks.forEach(a=>{if(a.unlockCondition?.variableId===id)a.unlockCondition=null});
}
function cleanItemReference(id){
  walkProjectOwners(editorDraft,owner=>{
    if(owner.itemCondition?.itemId===id)owner.itemCondition=null;
    owner.itemEffects=(owner.itemEffects||[]).filter(f=>f.itemId!==id);
  });
  editorDraft.asks.forEach(a=>{if(a.unlockItemCondition?.itemId===id)a.unlockItemCondition=null});
}
function cleanAskReference(id){
  walkProjectOwners(editorDraft,owner=>{if(owner.askCondition?.askId===id)owner.askCondition=null});
  editorDraft.asks.forEach(a=>{if(a.unlockAskCondition?.askId===id)a.unlockAskCondition=null});
  editorDraft.askedAskIds=(editorDraft.askedAskIds||[]).filter(x=>x!==id);
  editorDraft.unlockedAskIds=(editorDraft.unlockedAskIds||[]).filter(x=>x!==id);
  editorDraft.interactionHistory=(editorDraft.interactionHistory||[]).filter(h=>h.askId!==id);
}
function cleanCharacterReference(id){
  walkProjectOwners(editorDraft,owner=>{
    if(owner.affectionCondition?.characterId===id)owner.affectionCondition=null;
    if(owner.emotionCondition?.characterId===id)owner.emotionCondition=null;
    if(owner.type==="dialogue"&&owner.speakerCharacterId===id)owner.speakerCharacterId="";
    owner.affectionEffects=(owner.affectionEffects||[]).filter(f=>f.characterId!==id);
    owner.emotionEffects=(owner.emotionEffects||[]).filter(f=>f.characterId!==id);
  });
  editorDraft.asks.forEach(a=>{if(a.unlockEmotionCondition?.characterId===id)a.unlockEmotionCondition=null});
  editorDraft.discoveredGiftReactionKeys=(editorDraft.discoveredGiftReactionKeys||[]).filter(k=>!k.endsWith("::"+id));
  editorDraft.giftInteractionCounts=Object.fromEntries(Object.entries(editorDraft.giftInteractionCounts||{}).filter(([k])=>!k.endsWith("::"+id)));
  editorDraft.interactionHistory=(editorDraft.interactionHistory||[]).filter(h=>h.characterId!==id);
}
function validateDraft(source=editorDraft){
  const issues=[];
  const push=(level,area,text)=>issues.push({level,area,text});
  const charIds=new Set(source.characters.map(x=>x.id));
  const varIds=new Set(source.variables.map(x=>x.id));
  const itemIds=new Set(source.items.map(x=>x.id));
  const askIds=new Set(source.asks.map(x=>x.id));
  const eventIds=new Set(source.events.map(x=>x.id));

  if(!source.characters.length)push("error","CHARACTER","등록된 캐릭터가 없습니다.");
  source.events.forEach(ev=>{
    if(!charIds.has(ev.characterId))push("error","EVENT · "+ev.name,"캐릭터가 지정되지 않았습니다.");
    if(!ev.entries.length)push("warning","EVENT · "+ev.name,"FLOW가 비어 있습니다.");
    const continuationIds=Array.isArray(ev.continuationEventIds)?ev.continuationEventIds:[];
    const seenContinuation=new Set();
    continuationIds.forEach((id,index)=>{
      if(!eventIds.has(id))push("error","EVENT · "+ev.name,"CONTINUATION "+(index+1)+"의 EVENT가 존재하지 않습니다.");
      if(id===ev.id)push("error","EVENT · "+ev.name,"자기 자신을 CONTINUATION으로 연결할 수 없습니다.");
      if(seenContinuation.has(id))push("warning","EVENT · "+ev.name,"같은 EVENT가 CONTINUATION에 두 번 들어 있습니다.");
      seenContinuation.add(id);
    });
  });
  source.asks.forEach(a=>{
    if(!charIds.has(a.characterId))push("error","ASK · "+a.label,"질문 대상 캐릭터가 없습니다.");
    if(!a.entries.length)push("warning","ASK · "+a.label,"REACTION FLOW가 비어 있습니다.");
    if(a.startLocked&&!a.unlockMinAffection&&!a.unlockCondition&&!a.unlockItemCondition&&!a.unlockAskCondition&&!a.unlockEmotionCondition)
      push("warning","ASK · "+a.label,"LOCKED지만 해금 조건이 없어 ASK 화면을 열면 즉시 해금됩니다.");
    if(a.unlockCondition?.variableId&&!varIds.has(a.unlockCondition.variableId))push("error","ASK · "+a.label,"해금 변수 참조가 삭제되었습니다.");
    if(a.unlockItemCondition?.itemId&&!itemIds.has(a.unlockItemCondition.itemId))push("error","ASK · "+a.label,"해금 아이템 참조가 삭제되었습니다.");
    if(a.unlockAskCondition?.askId===a.id)push("error","ASK · "+a.label,"자기 자신을 해금 조건으로 참조하고 있습니다.");
    else if(a.unlockAskCondition?.askId&&!askIds.has(a.unlockAskCondition.askId))push("error","ASK · "+a.label,"해금 ASK 참조가 삭제되었습니다.");
    if(a.unlockEmotionCondition?.characterId&&!charIds.has(a.unlockEmotionCondition.characterId))push("error","ASK · "+a.label,"해금 감정 대상이 삭제되었습니다.");
  });
  source.items.forEach(item=>{
    if(item.collectionCharacterId&&!charIds.has(item.collectionCharacterId))push("error","ITEM · "+item.name,"컬렉션 소속 캐릭터가 삭제되었습니다.");
    if(!item.collectionCharacterId)push("warning","ITEM · "+item.name,"컬렉션 소속 캐릭터가 지정되지 않았습니다.");
    if(item.giftable!==false&&!item.reactions.length)push("info","ITEM · "+item.name,"선물 가능한 아이템이지만 캐릭터별 선물 반응이 없습니다.");
    const seen=new Set();
    item.reactions.forEach(r=>{
      if(!r.characterId||!charIds.has(r.characterId))push("error","ITEM · "+item.name,"선물 반응 대상 캐릭터가 비어 있거나 삭제되었습니다.");
      if(r.characterId&&seen.has(r.characterId))push("warning","ITEM · "+item.name,"같은 캐릭터의 선물 반응이 중복 등록되어 있습니다.");
      if(r.characterId)seen.add(r.characterId);
      if(!r.firstEntries.length)push("warning","ITEM · "+item.name,"FIRST GIFT FLOW가 비어 있습니다.");
      if(!r.repeatEntries.length)push("info","ITEM · "+item.name,"REPEAT GIFT FLOW가 비어 있어 FIRST FLOW로 대체됩니다.");
      if((r.specialMinAffection||r.specialEmotionState)&&!r.specialEntries.length)push("warning","ITEM · "+item.name,"SPECIAL 조건은 있지만 SPECIAL FLOW가 비어 있습니다.");
    });
  });
  source.thoughts.forEach(t=>{
    if(!charIds.has(t.characterId))push("error","THOUGHT","캐릭터가 지정되지 않았습니다.");
    if(!String(t.text||"").trim())push("warning","THOUGHT · "+(source.characters.find(c=>c.id===t.characterId)?.name||"미지정"),"문장이 비어 있습니다.");
  });
  if(source.gacha.enabled&&!source.items.some(i=>i.enabled&&i.gachaEnabled))push("warning","GACHA","가챠가 켜져 있지만 아이템 풀이 비어 있습니다.");

  walkProjectOwners(source,(owner,type,area)=>{
    if(owner.condition?.variableId&&!varIds.has(owner.condition.variableId))push("error",area,"삭제된 변수를 조건으로 참조합니다.");
    for(const fx of owner.effects||[])if(fx.variableId&&!varIds.has(fx.variableId))push("error",area,"삭제된 변수를 효과로 참조합니다.");
    if(owner.itemCondition?.itemId&&!itemIds.has(owner.itemCondition.itemId))push("error",area,"삭제된 아이템을 조건으로 참조합니다.");
    for(const fx of owner.itemEffects||[])if(fx.itemId&&!itemIds.has(fx.itemId))push("error",area,"삭제된 아이템을 지급 효과로 참조합니다.");
    if(owner.askCondition?.askId&&!askIds.has(owner.askCondition.askId))push("error",area,"삭제된 ASK를 조건으로 참조합니다.");
    if(owner.affectionCondition?.characterId&&!charIds.has(owner.affectionCondition.characterId))push("error",area,"삭제된 캐릭터를 호감도 조건으로 참조합니다.");
    if(owner.emotionCondition?.characterId&&!charIds.has(owner.emotionCondition.characterId))push("error",area,"삭제된 캐릭터를 감정 조건으로 참조합니다.");
    for(const fx of owner.affectionEffects||[])if(fx.characterId&&!charIds.has(fx.characterId))push("error",area,"삭제된 캐릭터를 호감도 효과로 참조합니다.");
    for(const fx of owner.emotionEffects||[])if(fx.characterId&&!charIds.has(fx.characterId))push("error",area,"삭제된 캐릭터를 감정 효과로 참조합니다.");
    if(type==="entry"){
      if(owner.type==="dialogue"&&owner.speakerCharacterId&&!charIds.has(owner.speakerCharacterId))push("error",area,"대사 화자 이미지 캐릭터가 삭제되었습니다.");
      if(owner.type==="choice"&&!owner.options.length)push("warning",area,"선택지 항목이 0개인 CHOICE가 있습니다.");
      if(owner.type==="dialogue"&&!String(owner.text||"").trim())push("info",area,"빈 대사가 있습니다.");
      if(owner.type==="narration"&&!String(owner.text||"").trim())push("info",area,"빈 지문이 있습니다.");
    }else{
      if(!String(owner.label||"").trim())push("warning",area,"선택지 문구가 비어 있습니다.");
      if(owner.targetEventId&&!eventIds.has(owner.targetEventId))push("error",area,"선택지가 삭제된 이벤트로 이동합니다.");
    }
  });
  return issues;
}
