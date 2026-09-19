"use strict";

(() => {
  const WORLD_CONFIG = window.HV_WORLD_CONFIG || {regions:[]};
  const REGION_KEY = "hellaverse-world-region-v1";
  const SCENE_KEY = "hellaverse-world-scene-placement-v1";
  const HOTEL_SETTINGS_KEY = "hellaverse-world-settings-v1";
  const SCENE_WORK_KEY = "hellaverse-world-scene-work-v1";
  const hotelRender = window.renderWorld;
  let activeRegion = readActiveRegion();
  let sceneDrag = null;
  let sceneWorkTimer = null;

  function regions(){
    return WORLD_CONFIG.regions || [];
  }

  function regionById(id){
    return regions().find(region=>region.id===id) || regions()[0];
  }

  function sceneRegions(){
    return regions().filter(region=>region.id!=="hotel");
  }

  function readActiveRegion(){
    const stored=localStorage.getItem(REGION_KEY)||WORLD_CONFIG.defaultRegion||"hotel";
    return regions().some(region=>region.id===stored)?stored:(WORLD_CONFIG.defaultRegion||"hotel");
  }

  function saveActiveRegion(id){
    activeRegion=id;
    localStorage.setItem(REGION_KEY,id);
  }

  function readSceneState(){
    try{
      const value=JSON.parse(localStorage.getItem(SCENE_KEY)||"{}");
      return value&&typeof value==="object"?value:{};
    }catch{
      return {};
    }
  }

  function saveSceneState(value){
    localStorage.setItem(SCENE_KEY,JSON.stringify(value));
  }

  function readSceneWork(){
    try{
      const value=JSON.parse(localStorage.getItem(SCENE_WORK_KEY)||"{}");
      return value&&typeof value==="object"?value:{};
    }catch{
      return {};
    }
  }

  function saveSceneWork(value){
    localStorage.setItem(SCENE_WORK_KEY,JSON.stringify(value));
  }

  function regionActivities(regionId){
    const region=regionById(regionId);
    return Array.isArray(region?.activities)?region.activities:[];
  }

  function regionActivity(regionId,taskId){
    return regionActivities(regionId).find(task=>task.id===taskId)||null;
  }

  function normalizeSceneTask(regionId,raw){
    if(!raw||typeof raw!=="object")return null;
    const task=regionActivity(regionId,raw.taskId);
    if(!task)return null;
    const status=["ready","working","complete"].includes(raw.status)?raw.status:"ready";
    return {
      taskId:task.id,
      status,
      startedAt:Math.max(0,Number(raw.startedAt)||0),
      endAt:Math.max(0,Number(raw.endAt)||0),
      reward:Math.max(0,Math.round(Number(raw.reward)||task.reward||0))
    };
  }

  function ensureSceneTasks(regionId){
    const work=readSceneWork();
    work[regionId] ||= {};
    regionActivities(regionId).forEach(task=>{
      const normalized=normalizeSceneTask(regionId,work[regionId][task.id]);
      work[regionId][task.id]=normalized||{
        taskId:task.id,
        status:"ready",
        startedAt:0,
        endAt:0,
        reward:Math.max(1,Math.round(task.reward||1))
      };
    });
    saveSceneWork(work);
    return work;
  }

  function formatSceneWorkTime(ms){
    const seconds=Math.max(0,Math.ceil(ms/1000));
    return String(Math.floor(seconds/60)).padStart(2,"0")+":"+String(seconds%60).padStart(2,"0");
  }

  function settleSceneTasks(regionId){
    const work=ensureSceneTasks(regionId);
    const now=Date.now();
    let earned=0;
    regionActivities(regionId).forEach(task=>{
      const slot=normalizeSceneTask(regionId,work[regionId]?.[task.id]);
      if(!slot||slot.status!=="working"||!slot.endAt||slot.endAt>now)return;
      slot.status="complete";
      work[regionId][task.id]=slot;
      state.gacha.balance=Math.max(0,Number(state.gacha.balance)||0)+slot.reward;
      earned+=slot.reward;
    });
    if(earned){
      saveSceneWork(work);
      saveState();
    }
    return earned;
  }

  function sceneTaskCard(regionId,task){
    const work=ensureSceneTasks(regionId);
    const slot=normalizeSceneTask(regionId,work[regionId]?.[task.id]);
    if(!slot)return "";
    const currency=esc(state.gacha.currencyName||"SOUL");
    if(slot.status==="working"){
      const now=Date.now();
      const total=Math.max(1,slot.endAt-slot.startedAt);
      const progress=Math.round(Math.max(0,Math.min(1,(now-slot.startedAt)/total))*100);
      return '<div class="scene-task-card is-working" data-scene-task-card data-region="'+esc(regionId)+'" data-task="'+esc(task.id)+'" data-start="'+slot.startedAt+'" data-end="'+slot.endAt+'">'+
        '<span class="scene-task-icon">'+esc(task.icon||"✦")+'</span>'+
        '<div><small>WORKING · '+currency+'</small><strong>'+esc(task.title)+'</strong><em data-scene-task-time>'+formatSceneWorkTime(slot.endAt-now)+'</em></div>'+
        '<i class="scene-task-progress"><b data-scene-task-progress style="width:'+progress+'%"></b></i>'+
      '</div>';
    }
    if(slot.status==="complete"){
      return '<button class="scene-task-card is-complete" type="button" data-scene-task-reset="'+esc(task.id)+'" data-region="'+esc(regionId)+'">'+
        '<span class="scene-task-icon">✓</span><div><small>PAID · '+currency+'</small><strong>'+esc(task.title)+'</strong><em>+'+slot.reward+' · AGAIN</em></div>'+
      '</button>';
    }
    return '<button class="scene-task-card is-ready" type="button" data-scene-task-start="'+esc(task.id)+'" data-region="'+esc(regionId)+'">'+
      '<span class="scene-task-icon">'+esc(task.icon||"✦")+'</span><div><small>'+esc((task.building||"DUTY").toUpperCase())+' · '+currency+' +'+task.reward+'</small><strong>'+esc(task.title)+'</strong><em>'+esc(task.detail||"")+' · '+formatSceneWorkTime((task.duration||60)*1000)+'</em></div>'+
    '</button>';
  }

  function sceneWorkDock(region){
    if(!Array.isArray(region.activities)||!region.activities.length)return "";
    return '<section class="scene-work-dock region-work-'+esc(region.id)+'">'+
      '<div class="scene-work-head"><div><span>'+esc(region.id==="heaven"?"HEAVEN DUTIES":"REGION DUTIES")+'</span><strong>'+esc(region.id==="heaven"?"CITY ASSIGNMENTS":"ASSIGNMENTS")+'</strong></div><small>실패 없음 · 자동 진행</small></div>'+
      '<div class="scene-work-grid">'+region.activities.map(task=>sceneTaskCard(region.id,task)).join("")+'</div>'+
    '</section>';
  }

  function updateSceneWorkClock(){
    const now=Date.now();
    $$("[data-scene-task-card].is-working",pageRoot).forEach(card=>{
      const start=Number(card.dataset.start)||now;
      const end=Number(card.dataset.end)||now;
      const total=Math.max(1,end-start);
      const progress=Math.round(Math.max(0,Math.min(1,(now-start)/total))*100);
      const time=$("[data-scene-task-time]",card);
      const bar=$("[data-scene-task-progress]",card);
      if(time)time.textContent=formatSceneWorkTime(end-now);
      if(bar)bar.style.width=progress+"%";
    });
  }

  function scheduleSceneWork(regionId){
    clearTimeout(sceneWorkTimer);
    if(activeRegion!==regionId)return;
    sceneWorkTimer=setTimeout(()=>{
      if(activeRegion!==regionId)return;
      const earned=settleSceneTasks(regionId);
      if(earned){
        renderSceneRegion();
        showToast("HEAVEN DUTY COMPLETE · +"+earned+" "+(state.gacha.currencyName||"SOUL"));
        return;
      }
      updateSceneWorkClock();
      scheduleSceneWork(regionId);
    },800);
  }

  function readHotelCharacterSettings(){
    try{
      const raw=JSON.parse(localStorage.getItem(HOTEL_SETTINGS_KEY)||"{}");
      return raw&&typeof raw==="object"?raw:{};
    }catch{
      return {};
    }
  }

  function hash(value){
    const text=String(value||"");
    let n=0;
    for(let i=0;i<text.length;i++)n=(n*31+text.charCodeAt(i))>>>0;
    return n;
  }

  function regionNavMarkup(){
    return '<nav class="world-region-nav" aria-label="WORLD 지역 선택">'+
      regions().map((region,index)=>
        '<button type="button" class="world-region-tab '+(activeRegion===region.id?"active":"")+'" data-world-region="'+esc(region.id)+'">'+
          '<span>'+String(index+1).padStart(2,"0")+'</span><strong>'+esc(region.name)+'</strong>'+
        '</button>'
      ).join("")+
    '</nav>';
  }

  function installRegionNavIntoHotel(){
    const header=$(".world-hotel-head",pageRoot);
    if(!header || $(".world-region-nav",pageRoot))return;
    header.insertAdjacentHTML("afterend",regionNavMarkup());
  }

  function characterSceneConfig(character){
    const hotel=readHotelCharacterSettings();
    const cfg=hotel.characterWorld?.[character.id] || {};
    return {
      visible:cfg.visible!==false,
      image:String(cfg.image||character.image||"").trim(),
      scale:Math.max(.6,Math.min(1.55,Number(cfg.scale)||1)),
      movement:["still","calm","wander","active"].includes(cfg.movement)?cfg.movement:"wander",
      speed:Math.max(.45,Math.min(1.8,Number(cfg.speed)||1))
    };
  }

  function sceneResidents(){
    const hotel=readHotelCharacterSettings();
    const max=Math.max(1,Math.min(12,Number(hotel.maxActors)||8));
    const manual=hotel.autoResidents===false;
    const residentIds=Array.isArray(hotel.residentIds)?hotel.residentIds:[];
    return enabledCharacters()
      .filter(character=>characterSceneConfig(character).visible)
      .filter(character=>!manual||residentIds.includes(character.id))
      .slice(0,max);
  }

  function placementFor(regionId,character,index){
    const saved=readSceneState();
    const stored=saved[regionId]?.[character.id];
    if(stored&&Number.isFinite(Number(stored.x))&&Number.isFinite(Number(stored.y))){
      return {
        x:Math.max(4,Math.min(92,Number(stored.x))),
        y:Math.max(5,Math.min(38,Number(stored.y)))
      };
    }
    const seed=hash(regionId+"|"+character.id);
    return {
      x:10+((seed+index*17)%76),
      y:7+((seed>>4)%10)
    };
  }

  function sceneActorMarkup(regionId,character,index){
    const cfg=characterSceneConfig(character);
    const pos=placementFor(regionId,character,index);
    const initials=(character.name||"?").slice(0,2).toUpperCase();
    const art=cfg.image
      ? '<img src="'+esc(cfg.image)+'" alt="" draggable="false" />'
      : '<span class="scene-actor-fallback">'+esc(initials)+'</span>';
    const travel={still:0,calm:8,wander:15,active:24}[cfg.movement]||15;
    const duration=(15+(hash(character.id)%6)*1.4)/cfg.speed;
    return '<div class="world-scene-actor scene-move-'+esc(cfg.movement)+'" '+
      'data-scene-character="'+esc(character.id)+'" title="'+esc(character.name)+' · 드래그해서 배치" '+
      'style="--scene-x:'+pos.x+'%;--scene-y:'+pos.y+'%;--scene-scale:'+cfg.scale+';--scene-travel:'+travel+'px;--scene-duration:'+duration+'s">'+
      art+'<small>'+esc(character.name)+'</small></div>';
  }

  function heavenMarkup(){
    return ''+
      '<div class="heaven-rays" aria-hidden="true"><i></i><i></i><i></i><i></i></div>'+
      '<div class="heaven-orbits" aria-hidden="true"><i></i><i></i><i></i></div>'+
      '<div class="heaven-cloud-wisps" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div>'+
      '<div class="heaven-back-clouds" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>'+
      '<div class="heaven-mid-clouds" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>'+
      '<div class="heaven-distant-gate" aria-hidden="true"><i></i><b></b><span></span></div>'+
      '<div class="heaven-city-back" aria-hidden="true">'+Array.from({length:10},(_,i)=>'<i class="h'+(i+1)+'"><b></b></i>').join("")+'</div>'+
      '<div class="heaven-plaza" aria-hidden="true"></div>'+
      '<div class="heaven-building heaven-welcome" aria-hidden="true">'+
        '<div class="heaven-building-halo"></div>'+
        '<div class="heaven-roof-crest"><i></i><i></i><i></i></div>'+
        '<b>WELCOME HALL</b>'+
        '<span class="welcome-window left"><i></i></span><span class="welcome-window right"><i></i></span>'+
        '<span class="door"><i></i></span>'+
        '<span class="welcome-column left"></span><span class="welcome-column right"></span>'+
        '<span class="welcome-step"></span>'+
        '<i class="wing left"></i><i class="wing right"></i>'+
      '</div>'+
      '<div class="heaven-building heaven-transit" aria-hidden="true">'+
        '<div class="heaven-building-halo"></div>'+
        '<div class="transit-cap"><i></i></div>'+
        '<b>CLOUD TRANSIT</b>'+
        '<span class="transit-ring r1"></span><span class="transit-ring r2"></span>'+
        '<span class="transit-window tw1"></span><span class="transit-window tw2"></span><span class="transit-window tw3"></span>'+
        '<span class="transit-door"><i></i></span>'+
        '<i class="transit-core"></i>'+
      '</div>'+
      '<div class="heaven-building heaven-court" aria-hidden="true">'+
        '<div class="heaven-building-halo"></div>'+
        '<div class="court-crown"><i></i><i></i><i></i><i></i><i></i></div>'+
        '<b>SERAPH COURT</b>'+
        '<span class="court-eye"><i></i></span>'+
        '<span class="court-rosette"><i></i></span>'+
        '<span class="court-balcony"></span>'+
        '<em class="court-door d1"><i></i></em><em class="court-door d2"><i></i></em><em class="court-door d3"><i></i></em>'+
        '<span class="court-side-tower left"><i></i></span><span class="court-side-tower right"><i></i></span>'+
      '</div>'+
      '<div class="heaven-building heaven-archive" aria-hidden="true">'+
        '<div class="heaven-building-halo"></div>'+
        '<div class="archive-crown"><i></i><i></i><i></i></div>'+
        '<b>CELESTIAL ARCHIVE</b>'+
        '<div class="archive-window-grid"><i></i><i></i><i></i><i></i><i></i><i></i></div>'+
        '<span class="archive-door"><i></i></span>'+
        '<span class="archive-pillar left"></span><span class="archive-pillar right"></span>'+
        '<span class="archive-base"></span>'+
      '</div>'+
      '<div class="heaven-building heaven-garden" aria-hidden="true">'+
        '<div class="heaven-building-halo"></div>'+
        '<b>SKY GARDEN</b>'+
        '<span class="garden-dome"><i class="rib r1"></i><i class="rib r2"></i><i class="rib r3"></i></span>'+
        '<span class="garden-terrace"></span>'+
        '<span class="garden-pot p1"><i></i></span><span class="garden-pot p2"><i></i></span><span class="garden-pot p3"><i></i></span>'+
        '<span class="garden-lamp left"></span><span class="garden-lamp right"></span>'+
      '</div>'+
      '<div class="heaven-plaza-lamps" aria-hidden="true"><i></i><i></i><i></i><i></i></div>'+
      '<div class="heaven-building-clouds" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>'+
      '<div class="heaven-front-clouds" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>';
  }

  function wrathMarkup(){
    return ''+
      '<div class="wrath-clouds" aria-hidden="true"><i></i><i></i><i></i><i></i></div>'+
      '<div class="wrath-moon" aria-hidden="true"></div>'+
      '<div class="wrath-mesas" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>'+
      '<div class="wrath-volcano" aria-hidden="true"><i></i></div>'+
      '<div class="wrath-ranch-gate" aria-hidden="true"><span></span><span></span><b>WRATH RANCH</b></div>'+
      '<div class="wrath-barn" aria-hidden="true"><i></i><b></b></div>'+
      '<div class="wrath-windmill" aria-hidden="true"><i></i><b></b></div>'+
      '<div class="wrath-fence left" aria-hidden="true"></div><div class="wrath-fence right" aria-hidden="true"></div>'+
      '<div class="wrath-cacti" aria-hidden="true"><i></i><i></i><i></i><i></i></div>'+
      '<div class="wrath-ground" aria-hidden="true"></div>';
  }

  function lustMarkup(){
    return ''+
      '<div class="lust-stars" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div>'+
      '<div class="lust-skyline back" aria-hidden="true">'+Array.from({length:10},(_,i)=>'<i class="b'+(i+1)+'"></i>').join("")+'</div>'+
      '<div class="lust-skyline front" aria-hidden="true">'+Array.from({length:8},(_,i)=>'<i class="b'+(i+1)+'"><b></b></i>').join("")+'</div>'+
      '<div class="lust-club" aria-hidden="true">'+
        '<div class="lust-marquee">OZZIE&apos;S</div>'+
        '<div class="lust-heart-door"><i></i></div>'+
        '<span class="lust-window w1"></span><span class="lust-window w2"></span><span class="lust-window w3"></span>'+
        '<div class="lust-bulbs">'+Array.from({length:12},()=>'<i></i>').join("")+'</div>'+
      '</div>'+
      '<div class="lust-neon-sign sign-one" aria-hidden="true">♡</div><div class="lust-neon-sign sign-two" aria-hidden="true">✦</div>'+
      '<div class="lust-street" aria-hidden="true"><i></i><i></i><i></i></div>';
  }

  function impOfficeMarkup(){
    return ''+
      '<div class="imp-wall" aria-hidden="true"></div>'+
      '<div class="imp-ceiling" aria-hidden="true"><i></i></div>'+
      '<div class="imp-exit-door" aria-hidden="true"><b>EXIT</b><i></i></div>'+
      '<div class="imp-bulletin" aria-hidden="true"><i></i><i></i><i></i><b>JOBS</b></div>'+
      '<div class="imp-file-cabinet" aria-hidden="true"><i></i><i></i><i></i></div>'+
      '<div class="imp-whiteboard" aria-hidden="true"><b>I.M.P</b><span>MISSION</span><i></i></div>'+
      '<div class="imp-portrait p1" aria-hidden="true"><i></i></div><div class="imp-portrait p2" aria-hidden="true"><i></i></div>'+
      '<div class="imp-desk" aria-hidden="true"><b>I.M.P</b><span></span><i></i></div>'+
      '<div class="imp-chair boss" aria-hidden="true"></div>'+
      '<div class="imp-meeting-table" aria-hidden="true"><i></i><b></b></div>'+
      '<div class="imp-chair c1" aria-hidden="true"></div><div class="imp-chair c2" aria-hidden="true"></div><div class="imp-chair c3" aria-hidden="true"></div>'+
      '<div class="imp-floor" aria-hidden="true"></div>';
  }

  function sceneArtwork(regionId){
    if(regionId==="heaven")return heavenMarkup();
    if(regionId==="wrath")return wrathMarkup();
    if(regionId==="lust")return lustMarkup();
    return impOfficeMarkup();
  }

  function renderSceneRegion(){
    const region=regionById(activeRegion);
    settleSceneTasks(region.id);
    const residents=sceneResidents();
    const actors=residents.map((character,index)=>sceneActorMarkup(region.id,character,index)).join("");
    pageRoot.innerHTML=
      '<section class="world-scene-page region-'+esc(region.id)+'">'+
        '<header class="world-scene-head">'+
          '<div><p class="page-kicker">WORLD · '+esc(String(regions().indexOf(region)+1).padStart(2,"0"))+'</p><h1>'+esc(region.name)+'</h1><p>'+esc(region.subtitle||"")+'</p></div>'+
          '<div class="world-scene-status"><i></i><span>'+esc(region.status||"OPEN")+'</span><small>'+residents.length+' CHARACTERS</small></div>'+
        '</header>'+
        regionNavMarkup()+
        sceneWorkDock(region)+
        '<div class="world-scene-shell scene-'+esc(region.id)+'" data-scene-region="'+esc(region.id)+'">'+
          '<div class="scene-artwork">'+sceneArtwork(region.id)+'</div>'+
          '<div class="world-scene-actors">'+actors+'</div>'+
        '</div>'+
        '<aside class="world-scene-guide"><span>FREE PLACEMENT</span><strong>캐릭터를 드래그해서 원하는 위치에 놓을 수 있습니다.</strong><small>지역별 위치는 따로 저장됩니다.</small></aside>'+
      '</section>';
    scheduleSceneWork(region.id);
  }

  window.renderWorld=function(){
    if(activeRegion==="hotel"){
      hotelRender();
      installRegionNavIntoHotel();
      return;
    }
    renderSceneRegion();
  };

  pageRoot.addEventListener("click",event=>{
    const taskStart=event.target.closest("[data-scene-task-start]");
    if(taskStart){
      const regionId=taskStart.dataset.region;
      const taskId=taskStart.dataset.sceneTaskStart;
      const task=regionActivity(regionId,taskId);
      if(!task)return;
      const work=ensureSceneTasks(regionId);
      const slot=normalizeSceneTask(regionId,work[regionId]?.[taskId]);
      if(!slot||slot.status!=="ready")return;
      const now=Date.now();
      work[regionId][taskId]={
        taskId,
        status:"working",
        startedAt:now,
        endAt:now+Math.max(5000,(task.duration||60)*1000),
        reward:Math.max(1,Math.round(task.reward||1))
      };
      saveSceneWork(work);
      renderSceneRegion();
      showToast(task.title+" · STARTED");
      return;
    }
    const taskReset=event.target.closest("[data-scene-task-reset]");
    if(taskReset){
      const regionId=taskReset.dataset.region;
      const taskId=taskReset.dataset.sceneTaskReset;
      const task=regionActivity(regionId,taskId);
      if(!task)return;
      const work=ensureSceneTasks(regionId);
      work[regionId][taskId]={
        taskId,
        status:"ready",
        startedAt:0,
        endAt:0,
        reward:Math.max(1,Math.round(task.reward||1))
      };
      saveSceneWork(work);
      renderSceneRegion();
      return;
    }
    const button=event.target.closest("[data-world-region]");
    if(!button)return;
    const id=button.dataset.worldRegion;
    if(!regions().some(region=>region.id===id))return;
    saveActiveRegion(id);
    window.renderWorld();
  });

  function startSceneDrag(actor,event){
    if(sceneDrag)return;
    const shell=actor.closest("[data-scene-region]");
    if(!shell)return;
    event.preventDefault();
    event.stopPropagation();
    const rect=actor.getBoundingClientRect();
    const ghost=actor.cloneNode(true);
    ghost.classList.add("world-scene-drag-ghost");
    ghost.style.left=rect.left+"px";
    ghost.style.top=rect.top+"px";
    ghost.style.width=rect.width+"px";
    ghost.style.height=rect.height+"px";
    document.body.appendChild(ghost);
    actor.style.visibility="hidden";
    sceneDrag={
      pointerId:event.pointerId,
      actor,
      ghost,
      shell,
      regionId:shell.dataset.sceneRegion,
      characterId:actor.dataset.sceneCharacter,
      offsetX:event.clientX-rect.left,
      offsetY:event.clientY-rect.top
    };
    window.addEventListener("pointermove",moveSceneDrag,{passive:false});
    window.addEventListener("pointerup",finishSceneDrag,{passive:false});
    window.addEventListener("pointercancel",finishSceneDrag,{passive:false});
  }

  function moveSceneDrag(event){
    if(!sceneDrag||event.pointerId!==sceneDrag.pointerId)return;
    event.preventDefault();
    sceneDrag.ghost.style.left=(event.clientX-sceneDrag.offsetX)+"px";
    sceneDrag.ghost.style.top=(event.clientY-sceneDrag.offsetY)+"px";
    sceneDrag.shell.classList.add("is-scene-drop-target");
  }

  function finishSceneDrag(event){
    if(!sceneDrag||event.pointerId!==sceneDrag.pointerId)return;
    event.preventDefault();
    const drag=sceneDrag;
    sceneDrag=null;
    window.removeEventListener("pointermove",moveSceneDrag);
    window.removeEventListener("pointerup",finishSceneDrag);
    window.removeEventListener("pointercancel",finishSceneDrag);
    drag.shell.classList.remove("is-scene-drop-target");
    drag.ghost.remove();
    const rect=drag.shell.getBoundingClientRect();
    const inside=event.clientX>=rect.left&&event.clientX<=rect.right&&event.clientY>=rect.top&&event.clientY<=rect.bottom;
    if(!inside){
      drag.actor.style.visibility="";
      return;
    }
    const x=((event.clientX-rect.left)/Math.max(1,rect.width))*100;
    const y=((rect.bottom-event.clientY)/Math.max(1,rect.height))*100;
    const sceneState=readSceneState();
    sceneState[drag.regionId] ||= {};
    sceneState[drag.regionId][drag.characterId]={
      x:Math.round(Math.max(4,Math.min(92,x))*10)/10,
      y:Math.round(Math.max(5,Math.min(38,y))*10)/10
    };
    saveSceneState(sceneState);
    renderSceneRegion();
    const character=getCharacter(drag.characterId);
    showToast((character?.name||"CHARACTER")+" POSITION SAVED");
  }

  pageRoot.addEventListener("pointerdown",event=>{
    const actor=event.target.closest(".world-scene-actor[data-scene-character]");
    if(actor)startSceneDrag(actor,event);
  });
})();
