"use strict";
function showToast(text){
  clearTimeout(toastTimer);
  toastEl.textContent=text;toastEl.hidden=false;
  toastTimer=setTimeout(()=>toastEl.hidden=true,1500);
}
function openModal(title,body){
  modalRoot.innerHTML='<div class="modal-backdrop" data-close-modal><section class="modal-card" role="dialog"><button class="modal-close" type="button" data-close-modal>×</button><p class="label">HELLAVERSE</p><h2>'+esc(title)+'</h2>'+body+'</section></div>';
}
function closeModal(){modalRoot.innerHTML=""}
function backupDate(snapshot){return snapshot?.at?new Date(snapshot.at).toLocaleString("ko-KR"):"EMPTY"}
function showDataManager(){
  const store=readBackupStore();
  const slots=store.slots.map((snap,i)=>
    '<article class="save-slot"><div><small>SLOT '+(i+1)+'</small><strong>'+(snap?esc(snap.label):"EMPTY")+'</strong><span>'+esc(backupDate(snap))+'</span></div>'+
    '<div class="save-slot-actions"><button class="small-button" type="button" data-data-action="save-slot" data-slot="'+i+'">SAVE</button>'+
    '<button class="small-button" type="button" data-data-action="load-slot" data-slot="'+i+'" '+(!snap?"disabled":"")+'>LOAD</button></div></article>'
  ).join("");
  openModal("DATA & SAVE",
    '<div class="data-manager"><p class="muted">플레이와 편집 데이터는 이 브라우저에 자동 저장됩니다. 중요한 변경 전에는 슬롯이나 JSON 백업도 함께 사용하세요.</p>'+
    '<div class="save-slot-list">'+slots+'</div>'+
    '<section class="safety-snapshot"><div><small>AUTO SAFETY</small><strong>'+(store.safety?esc(store.safety.label):"아직 없음")+'</strong><span>'+esc(backupDate(store.safety))+'</span></div>'+
    '<button class="small-button" type="button" data-data-action="restore-safety" '+(!store.safety?"disabled":"")+'>RESTORE</button></section>'+
    '<div class="data-actions"><button class="ghost-button" type="button" data-data-action="export">EXPORT JSON</button>'+
    '<label class="ghost-button file-button">IMPORT JSON<input id="dataImportFile" type="file" accept="application/json,.json"></label>'+
    '<button class="danger-button" type="button" data-data-action="reset-progress">RESET PLAY PROGRESS</button></div></div>'
  );
}
function saveBackupSlot(index){
  const store=readBackupStore();
  store.slots[index]=makeDataSnapshot("SLOT "+(index+1));
  writeBackupStore(store);
  showToast("세이브 슬롯 "+(index+1)+"에 저장했습니다.");
  showDataManager();
}
function applyDataSnapshot(snapshot,label="백업",confirmMessage=""){
  if(!snapshot?.state)return;
  const message=confirmMessage||label+"을(를) 불러올까요? 현재 상태는 자동 안전 백업으로 보관됩니다.";
  if(!confirm(message))return;
  captureSafetySnapshot("복원 전 자동 백업");
  state=normalizeState(snapshot.state);
  if(snapshot.extraStorage&&typeof snapshot.extraStorage==="object"){
    AUX_STORAGE_KEYS.forEach(key=>{
      const value=snapshot.extraStorage[key];
      if(value===null||value===undefined)localStorage.removeItem(key);
      else localStorage.setItem(key,String(value));
    });
  }
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
  saveState();
  closeModal();
  if(gameShell.hidden)renderStart();
  else{updatePlayerBadge();renderPage()}
  showToast(label+"을(를) 불러왔습니다.");
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
  const snap=makeDataSnapshot("JSON EXPORT");
  const blob=new Blob([JSON.stringify(snap,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;a.download="hellaverse-backup.json";
  document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
}
function importDataFile(file){
  if(!file)return;
  const reader=new FileReader();
  reader.onload=()=>{
    try{
      const raw=JSON.parse(String(reader.result||"{}"));
      const legacy=migrateLegacyBackup(raw);
      if(legacy){
        const r=legacy.report;
        const snapshot={
          version:2,
          label:"MIGRATED LEGACY BACKUP",
          at:Date.now(),
          state:legacy.state,
          prefs:{}
        };
        const message=
          "구형 Hellaverse 백업을 새 형식으로 변환해 불러옵니다.\n\n"+
          "캐릭터 "+r.characters+"명\n"+
          "대화 EVENT "+r.dialogueEvents+"개\n"+
          "ASK "+r.asks+"개\n"+
          "아이템 "+r.items+"개\n"+
          "THOUGHT "+r.thoughts+"개\n\n"+
          "기존 브라우저 상태는 자동 안전 백업으로 보관됩니다. 계속할까요?";
        applyDataSnapshot(snapshot,"구형 백업 변환본",message);
        return;
      }
      const snapshot=raw?.state?raw:{version:2,label:"IMPORTED",at:Date.now(),state:raw,prefs:{}};
      applyDataSnapshot(snapshot,"가져온 JSON");
    }catch(error){
      console.error("DATA IMPORT FAILED",error);
      alert("백업 JSON을 불러오는 중 오류가 발생했습니다. 파일은 변경되지 않았습니다.");
    }
  };
  reader.readAsText(file);
}
function resetPlayProgress(){
  if(!confirm("대화 진행도, 호감도·감정·변수, ASK/선물 기록과 아이템 획득 진행도를 초기화할까요? 편집한 콘텐츠 자체는 유지됩니다."))return;
  captureSafetySnapshot("진행도 초기화 전 자동 백업");
  state.playState=normalizePlayState({});
  state.inventoryCounts={};
  state.newItemIds=[];
  state.itemHistory=[];
  state.discoveredGiftReactionKeys=[];
  state.giftInteractionCounts={};
  state.askedAskIds=[];
  state.unlockedAskIds=[];
  state.interactionHistory=[];
  state.discoveredThoughtIds=[];
  state.gacha.history=[];
  session=createSession();
  playback=null;
  saveState();
  closeModal();
  renderPage();
  showToast("플레이 진행도를 초기화했습니다.");
}

function renderStart(){
  playerNameInput.value=state.profile.name||"";
  pendingOrigin=validOrigin(state.profile.origin)?state.profile.origin:(validOrigin(pendingOrigin)?pendingOrigin:"");
  $$("[data-origin]",originChoice).forEach(b=>b.classList.toggle("active",b.dataset.origin===pendingOrigin));
  startHint.textContent="";
  startScreen.hidden=false;gameShell.hidden=true;
}
function enterGame(){
  const name=playerNameInput.value.trim();
  if(!name||!validOrigin(pendingOrigin)){startHint.textContent="이름과 출신을 모두 선택하세요.";return false}
  state.profile={name,origin:pendingOrigin};saveState();
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
  if(currentPage==="home")renderHome();
  else if(currentPage==="world")renderWorld();
  else if(currentPage==="characters")renderCharacters();
  else if(currentPage==="gacha")renderGacha();
  else if(currentPage==="thought")renderThought();
  else if(currentPage==="collection")renderCollection();
  else if(currentPage==="room")renderRoom();
}
function renderHome(){
  const chars=enabledCharacters();
  if(!chars.length){
    pageRoot.innerHTML='<section class="empty-panel"><div><p class="page-kicker">HOME</p><h2>대화할 캐릭터가 없습니다.</h2><p>EDITOR → 대화 이벤트 → 캐릭터에서 첫 캐릭터를 추가하세요.</p><button class="gold-button" type="button" data-action="open-editor">편집기 열기</button></div></section>';
    return;
  }
  homeIndex=Math.max(0,Math.min(homeIndex,chars.length-1));
  const ch=chars[homeIndex];
  selectedCharacterId=ch.id;
  const aff=Math.round(session.affection[ch.id]??ch.affectionStart);
  const emo=session.emotions[ch.id]||{state:ch.emotionDefault,intensity:ch.emotionIntensity};
  const art=ch.image?'<img src="'+esc(ch.image)+'" alt="'+esc(ch.name)+'" />':'<div class="silhouette">'+esc(ch.name.slice(0,2).toUpperCase())+'</div>';
  pageRoot.innerHTML=
    '<section class="home-lobby">'+
      '<div class="lobby-character">'+
        '<div class="home-character"><div class="character-art">'+art+'</div></div>'+
        (chars.length>1?'<button class="lobby-arrow left" type="button" data-action="home-prev">‹</button><button class="lobby-arrow right" type="button" data-action="home-next">›</button>':'')+
        '<div class="lobby-copy"><p class="page-kicker">'+esc(originLabel(ch.origin))+'</p><h1>'+esc(ch.name)+'</h1>'+
          '<p class="role-line">'+esc(ch.role||"ROLE NOT SET")+'</p><p class="origin-line">AFFECTION '+aff+' · '+esc(emotionLabel(emo.state))+' '+emo.intensity+'</p>'+
          '<p class="quote-line">'+esc(ch.quote||"편집기에서 캐릭터 소개 문구를 설정할 수 있습니다.")+'</p></div>'+
        '<div class="character-counter">'+String(homeIndex+1).padStart(2,"0")+' / '+String(chars.length).padStart(2,"0")+'</div>'+
      '</div>'+
      '<div class="lobby-dashboard">'+
        '<button type="button" data-action="talk"><span>01 · ROOM</span><strong>TALK</strong><small>'+eventsForCharacter(ch.id).length+' EVENTS</small></button>'+
        '<button type="button" data-action="random-thought"><span>02 · INNER VOICE</span><strong>THOUGHT</strong><small>'+state.thoughts.filter(t=>t.characterId===ch.id&&t.enabled).length+' LINES</small></button>'+
        '<button type="button" data-action="show-affection"><span>03 · RELATION</span><strong>AFFECTION</strong><small>'+aff+' / 100</small></button>'+
        '<button type="button" data-action="show-emotion"><span>04 · STATUS</span><strong>EMOTION</strong><small>'+esc(emotionLabel(emo.state))+'</small></button>'+
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
      const art=ch.image?'<img src="'+esc(ch.image)+'" alt="'+esc(ch.name)+'">':'<span class="directory-silhouette">'+esc(ch.name.slice(0,2).toUpperCase())+'</span>';
      return '<article class="character-directory-card '+(favorite?"favorite":"")+'">'+
        '<button class="character-favorite" type="button" data-action="character-favorite" data-id="'+esc(ch.id)+'" aria-label="즐겨찾기">'+(favorite?"★":"☆")+'</button>'+
        '<button class="character-open" type="button" data-action="character-open" data-id="'+esc(ch.id)+'"><span class="directory-art">'+art+'</span>'+
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
    '<section><div class="page-head"><div><p class="page-kicker">GACHA</p><h1>ARCHIVE DRAW</h1></div><p>아이템 설정에서 가챠 포함으로 지정한 아이템을 추첨합니다. UNIQUE는 한 번 획득하면 풀에서 빠집니다.</p></div>'+
    '<div class="gacha-layout">'+
      '<div class="gacha-stage '+(gachaAnimating?'is-drawing':'')+'"><div class="gacha-core"><p class="gacha-balance">'+esc(state.gacha.currencyName)+' · '+state.gacha.balance+'</p><h2>DRAW THE ARCHIVE</h2>'+
      '<p>'+availablePool.length+'개의 현재 획득 가능한 아이템이 있습니다.</p><div id="gachaResult" class="gacha-result-grid"></div>'+
      '<div class="draw-actions"><button class="gold-button" type="button" data-action="draw-gacha" data-count="1" '+(drawDisabled?"disabled":"")+'>1 DRAW · '+state.gacha.singleCost+'</button>'+
      '<button class="gold-button" type="button" data-action="draw-gacha" data-count="10" '+(drawDisabled||!canTen?"disabled":"")+'>10 DRAW · '+state.gacha.tenCost+'</button></div>'+
      (!canTen&&availablePool.length?'<p class="gacha-pool-note">REPEATABLE이 없고 UNIQUE 풀이 10개 미만이라 10회 뽑기가 잠겨 있습니다.</p>':'')+
      '</div><div class="gacha-aura" aria-hidden="true"></div></div>'+
      '<aside class="gacha-side"><div class="info-card"><h3>RATES</h3>'+RARITIES.map(r=>'<div class="rate-row '+(activeRarities.includes(r)?"":"inactive")+'"><span>'+r+'</span><b>'+(activeRarities.includes(r)?(((useEqualRates?1:Number(state.gacha.rarityWeights[r]||0))/total)*100).toFixed(1):"0.0")+'%</b></div>').join("")+
      '<p class="gacha-rate-note">'+(useEqualRates?"설정 가중치가 모두 0이라 현재 존재하는 희귀도에 균등 분배합니다.":"현재 획득 가능한 희귀도만 기준으로 실제 확률을 재분배합니다.")+'</p></div>'+
      '<div class="info-card"><div class="info-card-head"><h3>RECENT</h3><button class="small-button history-clear" type="button" data-action="clear-gacha-history" '+(!history.length||gachaAnimating?"disabled":"")+'>CLEAR</button></div>'+
      (history.length?history.map(h=>'<div class="history-row"><span>'+esc(h.rarity)+'</span><b>'+esc(h.name)+'</b></div>').join(""):'<p class="muted">아직 기록이 없습니다.</p>')+'</div></aside>'+
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
    (Object.keys(groups).length?'<div class="thought-groups">'+Object.entries(groups).map(([cat,list])=>'<section class="thought-group"><h2>'+esc(cat)+'</h2>'+list.map(t=>'<article class="thought-card"><small>'+esc(getCharacter(t.characterId)?.name||"UNKNOWN")+' · '+esc(t.frequency.toUpperCase())+'</small><p>'+esc(t.text)+'</p></article>').join("")+'</section>').join("")+'</div>':
    '<div class="empty-panel"><div><h2>아직 발견한 Thought가 없습니다.</h2><p>HOME에서 캐릭터를 선택한 뒤 THOUGHT를 눌러보세요.</p></div></div>')+
    '</section>';
}
function renderCollection(){
  const chars=enabledCharacters();
  const categories=[...new Set(state.items.map(i=>i.category).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"ko"));
  const query=collectionQuery.trim().toLowerCase();
  const visibleCatalog=state.items.filter(i=>i.enabled&&(!i.secret||hasEverAcquired(i.id)));
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
      const text=[i.name,i.description,i.category,i.rarity,source,getCharacter(i.collectionCharacterId)?.name].join(" ").toLowerCase();
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
      '<strong>'+(acquired?esc(i.name):"LOCKED")+'</strong>'+
      '<div class="collection-card-meta"><span>'+esc(source)+'</span><span>'+esc(i.acquisitionMode.toUpperCase())+'</span>'+(i.secret?'<span>SECRET</span>':'')+'</div>'+
      '<p>'+(acquired?esc(i.description||"설명 없음"):"아직 획득하지 않은 아이템입니다.")+'</p>'+
      (acquired&&state.collectionSettings.showOwnedCount?'<small>ARCHIVED · INVENTORY ×'+count+'</small>':'')+
    '</button>';
  };

  let body="";
  if(!items.length){
    body='<div class="empty-panel"><div><h2>조건에 맞는 아이템이 없습니다.</h2><p>필터를 바꾸거나 아이템을 획득해보세요.</p></div></div>';
  }else if(state.collectionSettings.view==="all"){
    body='<div class="collection-grid">'+items.map(card).join("")+'</div>';
  }else{
    const groups=chars
      .filter(ch=>collectionFilter==="ALL"||ch.id===collectionFilter)
      .map(ch=>({character:ch,items:items.filter(i=>i.collectionCharacterId===ch.id),progress:collectionProgressForCharacter(ch.id)}))
      .filter(g=>g.items.length||g.progress.total);
    const unassigned=items.filter(i=>!getCharacter(i.collectionCharacterId));
    body=groups.map(g=>'<section class="collection-preview-group"><div class="collection-group-head"><h3>'+esc(g.character.name)+'</h3><span>'+g.progress.acquired+' / '+g.progress.total+' · '+g.progress.percent+'%</span></div><div class="collection-progress-track"><div style="width:'+g.progress.percent+'%"></div></div><div class="collection-grid">'+g.items.map(card).join("")+'</div></section>').join("");
    if(unassigned.length)body+='<section class="collection-preview-group"><h3>UNASSIGNED</h3><div class="collection-grid">'+unassigned.map(card).join("")+'</div></section>';
  }

  const overall=collectionOverallProgress();
  const charProgress=chars.map(ch=>({ch,p:collectionProgressForCharacter(ch.id)}));
  pageRoot.innerHTML=
    '<section><div class="page-head"><div><p class="page-kicker">COLLECTION</p><h1>CHARACTER ARCHIVE</h1></div><p>획득 기록은 아이템을 사용해도 유지됩니다. SECRET은 발견 전까지 아카이브에 나타나지 않습니다.</p></div>'+
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
