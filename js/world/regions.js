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
    try{localStorage.setItem(REGION_KEY,id)}catch(error){
      console.warn("HELLAVERSE REGION SAVE FAILED",error);
      setStorageUiStatus("failed");
    }
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
    try{localStorage.setItem(SCENE_KEY,JSON.stringify(value));return true}catch(error){
      console.warn("HELLAVERSE SCENE SAVE FAILED",error);
      setStorageUiStatus("failed");
      return false;
    }
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
    try{localStorage.setItem(SCENE_WORK_KEY,JSON.stringify(value));return true}catch(error){
      console.warn("HELLAVERSE WORK SAVE FAILED",error);
      setStorageUiStatus("failed");
      return false;
    }
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
    const before=JSON.stringify(work[regionId]||null);
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
    if(before!==JSON.stringify(work[regionId]))saveSceneWork(work);
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
      saveProgressState();
    }
    return earned;
  }

  function sceneTaskCard(regionId,task,work){
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
    const work=ensureSceneTasks(region.id);
    const heading=region.id==="heaven"?["HEAVEN DUTIES","CITY ASSIGNMENTS"]:
      region.id==="wrath"?["WRATH CHORES","RANCH WORK"]:
      region.id==="lust"?["LUST NIGHT SHIFT","VENUE WORK"]:
      region.id==="mammon"?["GREED SHIFT","MONEY & SHOW WORK"]:
      region.id==="queen-bee"?["GLUTTONY PARTY SHIFT","PARTY & BAR WORK"]:
      region.id==="imp-office"?["I.M.P OFFICE SHIFT","OFFICE WORK"]:
      ["REGION DUTIES","ASSIGNMENTS"];
    return '<section class="scene-work-dock region-work-'+esc(region.id)+'">'+
      '<div class="scene-work-head"><div><span>'+esc(heading[0])+'</span><strong>'+esc(heading[1])+'</strong></div><small>실패 없음 · 자동 진행</small></div>'+
      '<div class="scene-work-grid">'+region.activities.map(task=>sceneTaskCard(region.id,task,work)).join("")+'</div>'+
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
    if(currentPage!=="world"||activeRegion!==regionId)return;
    sceneWorkTimer=setTimeout(()=>{
      if(currentPage!=="world"||activeRegion!==regionId)return;
      const earned=settleSceneTasks(regionId);
      if(earned){
        renderSceneRegion();
        const region=regionById(regionId);
        showToast((region?.name||"REGION")+" WORK COMPLETE · +"+earned+" "+(state.gacha.currencyName||"SOUL"));
        return;
      }
      updateSceneWorkClock();
      scheduleSceneWork(regionId);
    },800);
  }

  function readHotelCharacterSettings(){
    if(window.HV_WORLD_SETTINGS?.read)return window.HV_WORLD_SETTINGS.read();
    try{
      const raw=JSON.parse(localStorage.getItem(HOTEL_SETTINGS_KEY)||"{}");
      return raw&&typeof raw==="object"?raw:{};
    }catch{
      return {};
    }
  }

  function activeRegionSettings(regionId){
    const settings=readHotelCharacterSettings();
    if(window.HV_WORLD_SETTINGS?.region)return window.HV_WORLD_SETTINGS.region(settings,regionId);
    return {
      brightness:1,
      saturation:1,
      motion:true,
      showBadge:true,
      showCharacters:true,
      showWork:true,
      maxActors:Math.max(1,Math.min(12,Number(settings.maxActors)||8)),
      actorLabels:["hover","always","hidden"].includes(settings.actorLabels)?settings.actorLabels:"hover"
    };
  }

  function hash(value){
    const text=String(value||"");
    let n=0;
    for(let i=0;i<text.length;i++)n=(n*31+text.charCodeAt(i))>>>0;
    return n;
  }

  function regionNavMarkup(){
    const list=regions();
    const currentIndex=Math.max(0,list.findIndex(region=>region.id===activeRegion));
    const current=list[currentIndex]||list[0]||{name:"WORLD"};
    return '<section class="world-region-switcher" aria-label="WORLD 지도 탐색">'+
      '<div class="world-region-switcher-head">'+
        '<div><span>WORLD DIRECTORY</span><strong><b>'+(currentIndex+1)+' / '+list.length+'</b>'+esc(current.name)+'</strong></div>'+
        '<div class="world-region-stepper">'+
          '<button type="button" data-world-step="-1" aria-label="이전 지역">←</button>'+
          '<button type="button" data-world-step="1" aria-label="다음 지역">→</button>'+
        '</div>'+
      '</div>'+
      '<nav class="world-region-nav" aria-label="WORLD 지역 선택">'+
        list.map((region,index)=>
          '<button type="button" class="world-region-tab '+(activeRegion===region.id?"active":"")+'" data-world-region="'+esc(region.id)+'"'+(activeRegion===region.id?' aria-current="page"':"")+'>'+
            '<span>'+String(index+1).padStart(2,"0")+'</span><strong>'+esc(region.name)+'</strong>'+
          '</button>'
        ).join("")+
      '</nav>'+
    '</section>';
  }

  function revealActiveRegion(){
    requestAnimationFrame(()=>{
      const nav=$(".world-region-nav",pageRoot);
      if(nav){
        const active=$(".world-region-tab.active",nav);
        if(active){
          const left=active.offsetLeft-(nav.clientWidth-active.clientWidth)/2;
          nav.scrollTo({left:Math.max(0,left),behavior:"smooth"});
        }
      }
      const viewport=$(".world-map-viewport",pageRoot);
      if(viewport&&viewport.scrollWidth>viewport.clientWidth){
        viewport.scrollLeft=(viewport.scrollWidth-viewport.clientWidth)/2;
      }
    });
  }

  function installRegionNavIntoHotel(){
    const header=$(".world-hotel-head",pageRoot);
    if(!header || $(".world-region-nav",pageRoot))return;
    header.insertAdjacentHTML("afterend",regionNavMarkup());
    revealActiveRegion();
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

  function sceneResidents(regionId){
    const hotel=readHotelCharacterSettings();
    const scene=activeRegionSettings(regionId);
    if(!scene.showCharacters)return [];
    const manual=hotel.autoResidents===false;
    const residentIds=Array.isArray(hotel.residentIds)?hotel.residentIds:[];
    return enabledCharacters()
      .filter(character=>characterSceneConfig(character).visible)
      .filter(character=>!manual||residentIds.includes(character.id))
      .slice(0,scene.maxActors);
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
      '<div class="wrath-haze" aria-hidden="true"><i></i><i></i><i></i></div>'+
      '<div class="wrath-sun" aria-hidden="true"></div>'+
      '<div class="wrath-far-dunes" aria-hidden="true"><i></i><i></i><i></i></div>'+
      '<div class="wrath-volcano-new" aria-hidden="true"><i class="rim"></i><i class="smoke s1"></i><i class="smoke s2"></i><i class="smoke s3"></i></div>'+
      '<div class="wrath-mesas" aria-hidden="true"><i></i><i></i><i></i><i></i></div>'+
      '<div class="wrath-low-town" aria-hidden="true">'+
        '<span class="wrath-house h1"><i></i></span>'+
        '<span class="wrath-house h2"><i></i></span>'+
        '<span class="wrath-house h3"><i></i></span>'+
        '<span class="wrath-house h4"><i></i></span>'+
        '<span class="wrath-water-tower"><i></i></span>'+
      '</div>'+
      '<div class="wrath-ranch-strip" aria-hidden="true">'+
        '<div class="wrath-ranch-house"><i></i><b></b><span></span></div>'+
        '<div class="wrath-corral left"><i></i></div>'+
        '<div class="wrath-stable">'+
          '<i class="stable-roof"></i>'+
          '<b class="stable-door left"></b><b class="stable-door right"></b>'+
          '<span class="stable-window w1"></span><span class="stable-window w2"></span>'+
          '<span class="stable-loft"><i></i></span>'+
        '</div>'+
        '<div class="wrath-corral right"><i></i></div>'+
        '<div class="wrath-ranch-gate-new"><span class="post left"></span><span class="post right"></span><i class="gate-arch"></i><b>ROUGH &amp; TUMBLE RANCH</b><em></em></div>'+
        '<div class="wrath-hay bale h1"></div><div class="wrath-hay bale h2"></div><div class="wrath-hay bale h3"></div>'+
        '<div class="wrath-hay round h4"></div><div class="wrath-hay round h5"></div>'+
        '<div class="wrath-haystack"><i></i><i></i><i></i></div>'+
        '<div class="wrath-trough"><i></i></div>'+
      '</div>'+
      '<div class="wrath-cacti" aria-hidden="true"><i></i><i></i><i></i><i></i></div>'+
      '<div class="wrath-rocks" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>'+
      '<div class="wrath-fence left" aria-hidden="true"></div><div class="wrath-fence right" aria-hidden="true"></div>'+
      '<div class="wrath-ground" aria-hidden="true"></div>';
  }

  function lustMarkup(){
    return ''+
      '<div class="lust-stars" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>'+
      '<div class="lust-haze" aria-hidden="true"><i></i><i></i><i></i></div>'+
      '<div class="lust-skyline back" aria-hidden="true">'+Array.from({length:10},(_,i)=>'<i class="b'+(i+1)+'"></i>').join("")+'</div>'+
      '<div class="lust-skyline front" aria-hidden="true">'+Array.from({length:8},(_,i)=>'<i class="b'+(i+1)+'"><b></b></i>').join("")+'</div>'+
      '<div class="lust-side-building lust-boutique" aria-hidden="true">'+
        '<b>VELVET</b><span class="awning"></span><span class="door"></span>'+
        '<i class="window w1"></i><i class="window w2"></i>'+
      '</div>'+
      '<div class="lust-side-building lust-lounge" aria-hidden="true">'+
        '<b>LOUNGE</b><span class="roof-sign">♡</span><span class="door"></span>'+
        '<i class="window w1"></i><i class="window w2"></i><i class="window w3"></i>'+
      '</div>'+
      '<div class="lust-club" aria-hidden="true">'+
        '<div class="lust-crown"><i></i><i></i><i></i></div>'+
        '<div class="lust-marquee">OZZIE&apos;S</div>'+
        '<div class="lust-heart-door"><i></i></div>'+
        '<span class="lust-window w1"><i></i></span><span class="lust-window w2"><i></i></span>'+
        '<div class="lust-balcony"><i></i><i></i><i></i><i></i><i></i></div>'+
        '<div class="lust-bulbs">'+Array.from({length:14},()=>'<i></i>').join("")+'</div>'+
      '</div>'+
      '<div class="lust-entry-zone" aria-hidden="true">'+
        '<span class="lust-rope r1"></span><span class="lust-rope r2"></span><span class="lust-rope r3"></span>'+
        '<span class="lust-podium"><i></i></span>'+
      '</div>'+
      '<div class="lust-neon-arch" aria-hidden="true"><i></i><b>NIGHT DISTRICT</b></div>'+
      '<div class="lust-alley" aria-hidden="true"><i></i><b></b><span></span></div>'+
      '<div class="lust-neon-sign sign-one" aria-hidden="true">♡</div>'+
      '<div class="lust-neon-sign sign-two" aria-hidden="true">✦</div>'+
      '<div class="lust-lamps" aria-hidden="true"><i></i><i></i><i></i><i></i></div>'+
      '<div class="lust-curb" aria-hidden="true"></div>'+
      '<div class="lust-street" aria-hidden="true"><i></i><i></i><i></i><i></i></div>';
  }

  function mammonMarkup(){
    return ''+
      '<div class="mammon-sky-glow" aria-hidden="true"><i></i><i></i><i></i></div>'+
      '<div class="mammon-factory-back" aria-hidden="true"><i class="stack s1"></i><i class="stack s2"></i><i class="stack s3"></i><span class="smoke a"></span><span class="smoke b"></span></div>'+
      '<div class="mammon-back-buildings" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>'+
      '<div class="mammon-casino-tower" aria-hidden="true"><b>GREED</b><span class="coin"></span><i></i><i></i><i></i></div>'+
      '<div class="mammon-main-stage" aria-hidden="true">'+
        '<div class="mammon-crown"><i></i><i></i><i></i></div>'+
        '<b>MAMMON&apos;S</b><small>SHOW FLOOR</small><span class="stage-mouth"></span>'+
        '<i class="stage-light l1"></i><i class="stage-light l2"></i><i class="stage-light l3"></i><i class="stage-light l4"></i>'+
      '</div>'+
      '<div class="mammon-ticket-booth" aria-hidden="true"><b>TICKETS</b><span></span><i></i></div>'+
      '<div class="mammon-prize-booth" aria-hidden="true"><b>PRIZES</b><span class="shelf"></span><i></i><i></i><i></i></div>'+
      '<div class="mammon-merch" aria-hidden="true"><b>MERCH</b><span></span><i></i><i></i></div>'+
      '<div class="mammon-cash-kiosk" aria-hidden="true"><b>CASH</b><i></i></div>'+
      '<div class="mammon-vending" aria-hidden="true"><b>BUY</b><i></i><i></i></div>'+
      '<div class="mammon-sign sign1" aria-hidden="true">$</div><div class="mammon-sign sign2" aria-hidden="true">★</div>'+
      '<div class="mammon-coin-piles" aria-hidden="true"><i></i><i></i><i></i><i></i></div>'+
      '<div class="mammon-bollards" aria-hidden="true"><i></i><i></i><i></i><i></i></div>'+
      '<div class="mammon-ground" aria-hidden="true"></div>';
  }

  function queenBeeMarkup(){
    return ''+
      '<div class="bee-sky" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>'+
      '<div class="bee-string-lights" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>'+
      '<div class="bee-party-house" aria-hidden="true">'+
        '<div class="bee-roof"><i></i><i></i></div>'+
        '<b>PARTY HOUSE</b><small>GLUTTONY</small>'+
        '<span class="bee-main-door"></span>'+
        '<span class="bee-window w1"></span><span class="bee-window w2"></span><span class="bee-window w3"></span>'+
        '<span class="bee-balcony"><i></i><i></i><i></i><i></i></span>'+
      '</div>'+
      '<div class="bee-bar" aria-hidden="true"><b>HONEY BAR</b><span></span><i></i><i></i><i></i></div>'+
      '<div class="bee-dance" aria-hidden="true"><b>DANCE</b><span class="floor"></span><i></i><i></i></div>'+
      '<div class="bee-buffet" aria-hidden="true"><b>BITES</b><span></span><i></i><i></i><i></i></div>'+
      '<div class="bee-honey-fountain" aria-hidden="true"><b></b><span></span><i></i></div>'+
      '<div class="bee-lounge-cabana" aria-hidden="true"><b>LOUNGE</b><span></span><i></i><i></i></div>'+
      '<div class="bee-snack-cart" aria-hidden="true"><b>SNACKS</b><span></span><i></i></div>'+
      '<div class="bee-speaker left" aria-hidden="true"><i></i><b></b></div><div class="bee-speaker right" aria-hidden="true"><i></i><b></b></div>'+
      '<div class="bee-honey-tanks" aria-hidden="true"><i></i><i></i><i></i></div>'+
      '<div class="bee-lamps" aria-hidden="true"><i></i><i></i><i></i><i></i></div>'+
      '<div class="bee-deck" aria-hidden="true"></div>'+
      '<div class="bee-party-clutter" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>'+
      '<div class="bee-ground" aria-hidden="true"></div>';
  }

  function impOfficeMarkup(){
    return ''+
      '<div class="imp-back-wall" aria-hidden="true"></div>'+
      '<div class="imp-red-trim" aria-hidden="true"></div>'+
      '<div class="imp-ceiling" aria-hidden="true"><i></i><b></b></div>'+
      '<div class="imp-logo-plaque" aria-hidden="true"><b>I.M.P</b><span>IMMEDIATE MURDER PROFESSIONALS</span></div>'+

      '<div class="imp-poster horse" aria-hidden="true">'+
        '<span class="horse-head"><i></i></span><b>STALLION</b><em>RIDE HARD</em>'+
      '</div>'+
      '<div class="imp-poster pinup p1" aria-hidden="true">'+
        '<span class="pinup-body"><i></i><em></em></span><b>HELL&apos;S HOTTEST</b>'+
      '</div>'+
      '<div class="imp-poster pinup p2" aria-hidden="true">'+
        '<span class="pinup-body"><i></i><em></em></span><b>NIGHT SHIFT</b>'+
      '</div>'+

      '<div class="imp-whiteboard" aria-hidden="true"><b>TO-DO</b><span>CLIENTS · JOBS · TARGETS</span><i></i><em></em></div>'+
      '<div class="imp-bulletin" aria-hidden="true"><b>MISSIONS</b><i></i><i></i><i></i><i></i><span></span></div>'+
      '<div class="imp-file-cabinet" aria-hidden="true"><i></i><i></i><i></i></div>'+
      '<div class="imp-exit-door" aria-hidden="true"><b>EXIT</b><i></i><em></em></div>'+

      '<div class="imp-desk-zone" aria-hidden="true">'+
        '<div class="imp-desk">'+
          '<b>I.M.P</b><span class="monitor"></span><i class="papers"></i><em class="phone"></em><strong class="lamp"></strong>'+
          '<span class="mug"></span><span class="takeout"></span>'+
        '</div>'+
        '<div class="imp-chair boss"></div>'+
        '<div class="imp-side-shelf"><i></i><i></i><i></i><b></b></div>'+
      '</div>'+

      '<div class="imp-meeting-area" aria-hidden="true">'+
        '<div class="imp-meeting-table"><i></i><b></b><em></em><span></span></div>'+
        '<div class="imp-chair c1"></div><div class="imp-chair c2"></div><div class="imp-chair c3"></div>'+
        '<div class="imp-floor-box box1"><i></i></div><div class="imp-floor-box box2"><i></i></div>'+
      '</div>'+

      '<div class="imp-coat-rack" aria-hidden="true"><i></i><b></b></div>'+
      '<div class="imp-trash" aria-hidden="true"><i></i><i></i></div>'+
      '<div class="imp-floor-clutter" aria-hidden="true">'+
        '<span class="paper p1"></span><span class="paper p2"></span><span class="paper p3"></span>'+
        '<span class="cup c1"></span><span class="cup c2"></span>'+
        '<span class="box b1"><i></i></span><span class="box b2"><i></i></span>'+
        '<span class="cable"></span>'+
      '</div>'+
      '<div class="imp-floor" aria-hidden="true"></div>';
  }

  function sceneArtwork(regionId){
    if(regionId==="heaven")return heavenMarkup();
    if(regionId==="wrath")return wrathMarkup();
    if(regionId==="lust")return lustMarkup();
    if(regionId==="mammon")return mammonMarkup();
    if(regionId==="queen-bee")return queenBeeMarkup();
    return impOfficeMarkup();
  }

  function renderSceneRegion(){
    const region=regionById(activeRegion);
    const sceneSettings=activeRegionSettings(region.id);
    settleSceneTasks(region.id);
    const residents=sceneResidents(region.id);
    const actors=residents.map((character,index)=>sceneActorMarkup(region.id,character,index)).join("");
    const classes=[
      "world-scene-page",
      "region-"+region.id,
      sceneSettings.motion?"":"scene-motion-off",
      "scene-actor-labels-"+sceneSettings.actorLabels,
      sceneSettings.showBadge?"":"world-badge-off"
    ].join(" ");
    pageRoot.innerHTML=
      '<section class="'+esc(classes)+'" style="--scene-brightness:'+sceneSettings.brightness+';--scene-saturation:'+sceneSettings.saturation+'">'+
        '<header class="world-scene-head world-page-head">'+
          '<div><p class="page-kicker">WORLD · '+esc(String(regions().indexOf(region)+1).padStart(2,"0"))+'</p><h1>'+esc(region.name)+'</h1><p>'+esc(region.subtitle||"")+'</p></div>'+
          '<div class="world-scene-head-actions"><div class="world-scene-status"><i></i><span>'+esc(region.status||"OPEN")+'</span><small>'+residents.length+' CHARACTERS</small></div><button class="ghost-button" type="button" data-action="world-settings" data-world-settings-region="'+esc(region.id)+'">WORLD SETTINGS</button></div>'+
        '</header>'+
        regionNavMarkup()+
        (sceneSettings.showWork?sceneWorkDock(region):"")+
        '<div class="world-map-viewport" tabindex="0" aria-label="'+esc(region.name)+' 인터랙티브 지도 · 좌우로 이동 가능">'+
          '<div class="world-scene-shell scene-'+esc(region.id)+'" data-scene-region="'+esc(region.id)+'">'+
            '<div class="world-map-badge"><span>INTERACTIVE MAP</span><strong>'+esc(region.name)+'</strong></div>'+
            '<div class="scene-artwork">'+sceneArtwork(region.id)+'</div>'+
            '<div class="world-scene-actors">'+actors+'</div>'+
          '</div>'+
        '</div>'+
        '<p class="world-map-mobile-hint"><span aria-hidden="true">↔</span> 지도를 좌우로 밀어 둘러보세요</p>'+
        '<aside class="world-scene-guide"><span>FREE PLACEMENT</span><strong>캐릭터를 드래그해서 원하는 위치에 놓을 수 있습니다.</strong><small>지역별 위치는 따로 저장됩니다.</small></aside>'+
      '</section>';
    revealActiveRegion();
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
    const step=event.target.closest("[data-world-step]");
    if(step){
      const list=regions();
      const currentIndex=Math.max(0,list.findIndex(region=>region.id===activeRegion));
      const nextIndex=(currentIndex+Number(step.dataset.worldStep)+list.length)%list.length;
      saveActiveRegion(list[nextIndex].id);
      window.renderWorld();
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
