"use strict";

(() => {
  const WORLD_STORAGE_KEY = "hellaverse-world-settings-v1";
  const WORLD_SCENE_STORAGE_KEY = "hellaverse-world-scene-placement-v1";
  const WORLD_CONFIG = window.HV_WORLD_CONFIG || {regions:[]};
  let focusedHotelFloor = "lobby";
  let worldThoughtTimer = null;
  let worldActivityTimer = null;
  let worldActorDrag = null;

  function hotelRegion(){
    return WORLD_CONFIG.regions.find(r=>r.id==="hotel") || {
      id:"hotel",
      name:"HAZBIN HOTEL",
      subtitle:"PRIDE RING",
      floors:[]
    };
  }



  function hotelActivities(){
    return Array.isArray(hotelRegion().activities)?hotelRegion().activities:[];
  }

  function hotelActivityById(id){
    return hotelActivities().find(task=>task.id===id)||null;
  }

  function hotelActivitiesForFloor(floorId){
    return hotelActivities().filter(task=>task.floor===floorId);
  }

  function hotelWorkDayKey(){
    const d=new Date();
    return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
  }

  function defaultWorkStats(){
    return {dayKey:hotelWorkDayKey(),dayEarned:0,totalEarned:0,completed:0};
  }

  function normalizeWorkStats(raw){
    const s=raw&&typeof raw==="object"?raw:{};
    const today=hotelWorkDayKey();
    return {
      dayKey:today,
      dayEarned:s.dayKey===today?Math.max(0,Number(s.dayEarned)||0):0,
      totalEarned:Math.max(0,Number(s.totalEarned)||0),
      completed:Math.max(0,Math.floor(Number(s.completed)||0))
    };
  }

  function normalizeWorkSlot(raw,floorId){
    if(!raw||typeof raw!=="object")return null;
    const task=hotelActivityById(raw.taskId);
    if(!task||task.floor!==floorId)return null;
    const status=["ready","working","complete"].includes(raw.status)?raw.status:"ready";
    return {
      taskId:task.id,
      status,
      startedAt:Math.max(0,Number(raw.startedAt)||0),
      endAt:Math.max(0,Number(raw.endAt)||0),
      reward:Math.max(0,Math.round(Number(raw.reward)||task.reward||0)),
      workerId:String(raw.workerId||""),
      paidAt:Math.max(0,Number(raw.paidAt)||0)
    };
  }

  function rollHotelTask(floorId,previousId=""){
    const tasks=hotelActivitiesForFloor(floorId);
    if(!tasks.length)return null;
    const pool=tasks.length>1?tasks.filter(task=>task.id!==previousId):tasks;
    return pool[Math.floor(Math.random()*pool.length)]||tasks[0];
  }

  function ensureHotelActivities(settings){
    settings.activities ||= {};
    const workFloors=[...new Set(hotelActivities().map(task=>task.floor))];
    workFloors.forEach(floorId=>{
      const normalized=normalizeWorkSlot(settings.activities[floorId],floorId);
      if(normalized){
        settings.activities[floorId]=normalized;
        return;
      }
      const tasks=hotelActivitiesForFloor(floorId);
      const task=tasks.length?tasks[stableNumber(hotelWorkDayKey()+"|"+floorId)%tasks.length]:null;
      if(task){
        settings.activities[floorId]={
          taskId:task.id,status:"ready",startedAt:0,endAt:0,
          reward:Math.max(0,Math.round(task.reward||0)),workerId:"",paidAt:0
        };
      }
    });
    settings.workStats=normalizeWorkStats(settings.workStats);
    return settings;
  }

  function activitySlotForFloor(settings,floorId){
    return normalizeWorkSlot(settings.activities?.[floorId],floorId);
  }

  function actorBaseLeft(character,settings){
    const cfg=characterWorldSettings(character,settings);
    if(cfg.placement)return cfg.placement.left;
    return 8+(stableNumber(character.id)%72);
  }

  function chooseActivityWorker(floorId,anchor,settings){
    const floors=hotelRegion().floors;
    const floorIndex=floors.findIndex(f=>f.id===floorId);
    if(floorIndex<0)return "";
    const candidates=currentHotelResidents(settings).filter(character=>actorFloorIndex(character,settings)===floorIndex);
    if(!candidates.length)return "";
    candidates.sort((a,b)=>Math.abs(actorBaseLeft(a,settings)-anchor)-Math.abs(actorBaseLeft(b,settings)-anchor));
    return candidates[0]?.id||"";
  }

  function formatWorkTime(ms){
    const seconds=Math.max(0,Math.ceil(ms/1000));
    const min=Math.floor(seconds/60);
    const sec=seconds%60;
    return String(min).padStart(2,"0")+":"+String(sec).padStart(2,"0");
  }

  function characterWorldDefaults(){
    return {
      visible:true,
      regionIds:WORLD_CONFIG.regions.map(region=>region.id),
      image:"",
      floor:"auto",
      movement:"wander",
      speed:1,
      scale:1,
      placement:null,
      thoughts:true,
      thoughtFrequency:"normal"
    };
  }

  function worldRegionDefaults(){
    return {
      brightness:1,
      saturation:1,
      motion:true,
      showBadge:true,
      showCharacters:true,
      showWork:true,
      maxActors:8,
      actorLabels:"hover"
    };
  }

  function normalizeWorldRegion(raw){
    const d=worldRegionDefaults();
    const s=raw&&typeof raw==="object"?raw:{};
    return {
      brightness:Math.max(.72,Math.min(1.28,Number(s.brightness)||d.brightness)),
      saturation:Math.max(.55,Math.min(1.45,Number(s.saturation)||d.saturation)),
      motion:s.motion!==false,
      showBadge:s.showBadge!==false,
      showCharacters:s.showCharacters!==false,
      showWork:s.showWork!==false,
      maxActors:Math.max(1,Math.min(12,Number(s.maxActors)||d.maxActors)),
      actorLabels:["hover","always","hidden"].includes(s.actorLabels)?s.actorLabels:d.actorLabels
    };
  }

  function worldRegionSettings(settings,regionId){
    const source=settings?.regionSettings?.[regionId];
    if(source)return normalizeWorldRegion(source);
    if(regionId==="hotel"){
      return normalizeWorldRegion({
        brightness:settings?.sceneBrightness,
        motion:settings?.animation,
        showCharacters:true,
        showWork:settings?.showWorkDock,
        maxActors:settings?.maxActors,
        actorLabels:settings?.actorLabels
      });
    }
    return worldRegionDefaults();
  }

  function normalizeCharacterWorld(raw){
    const d=characterWorldDefaults();
    const s=raw&&typeof raw==="object"?raw:{};
    const floorIds=hotelRegion().floors.map(f=>f.id);
    const validRegionIds=WORLD_CONFIG.regions.map(region=>region.id);
    const regionIds=Array.isArray(s.regionIds)
      ? [...new Set(s.regionIds.map(String).filter(id=>validRegionIds.includes(id)))]
      : [...d.regionIds];
    let placement=null;
    if(s.placement&&typeof s.placement==="object"&&floorIds.includes(s.placement.floor)){
      placement={
        floor:s.placement.floor,
        left:Math.max(2,Math.min(92,Number(s.placement.left)||2))
      };
    }
    return {
      visible:s.visible!==false,
      regionIds,
      image:String(s.image||"").trim(),
      floor:s.floor==="auto"||floorIds.includes(s.floor)?s.floor:"auto",
      movement:["still","calm","wander","active"].includes(s.movement)?s.movement:d.movement,
      speed:Math.max(.45,Math.min(1.8,Number(s.speed)||d.speed)),
      scale:Math.max(.6,Math.min(1.55,Number(s.scale)||d.scale)),
      placement,
      thoughts:s.thoughts!==false,
      thoughtFrequency:["rare","normal","often"].includes(s.thoughtFrequency)?s.thoughtFrequency:d.thoughtFrequency
    };
  }

  function hotelDefaults(){
    const regionSettings={};
    WORLD_CONFIG.regions.forEach(region=>{regionSettings[region.id]=worldRegionDefaults()});
    return {
      animation:true,
      neon:true,
      particles:true,
      decorativeGuests:true,
      showFloorLabels:true,
      sceneBrightness:1,
      autoResidents:true,
      maxActors:8,
      motionSpeed:1,
      actorLabels:"hover",
      globalThoughts:true,
      thoughtRate:1,
      showWorkDock:true,
      compactWorkDock:false,
      workRewardMultiplier:1,
      workDurationMultiplier:1,
      activities:{},
      workStats:defaultWorkStats(),
      residentIds:[],
      floorNames:{},
      characterWorld:{},
      regionSettings
    };
  }

  function normalizeHotelSettings(raw){
    const d=hotelDefaults();
    const s=raw && typeof raw==="object" ? raw : {};
    const characterWorld={};
    if(s.characterWorld&&typeof s.characterWorld==="object"){
      Object.entries(s.characterWorld).forEach(([id,value])=>{
        characterWorld[id]=normalizeCharacterWorld(value);
      });
    }
    const regionSettings={};
    WORLD_CONFIG.regions.forEach(region=>{
      const legacy=region.id==="hotel"?{
        brightness:s.sceneBrightness,
        motion:s.animation,
        showWork:s.showWorkDock,
        maxActors:s.maxActors,
        actorLabels:s.actorLabels
      }:{};
      regionSettings[region.id]=normalizeWorldRegion(s.regionSettings?.[region.id]||legacy);
    });
    return {
      animation:s.animation!==false,
      neon:s.neon!==false,
      particles:s.particles!==false,
      decorativeGuests:s.decorativeGuests!==false,
      showFloorLabels:s.showFloorLabels!==false,
      sceneBrightness:Math.max(.72,Math.min(1.28,Number(s.sceneBrightness)||d.sceneBrightness)),
      autoResidents:s.autoResidents!==false,
      maxActors:Math.max(1,Math.min(12,Number(s.maxActors)||d.maxActors)),
      motionSpeed:Math.max(.5,Math.min(1.8,Number(s.motionSpeed)||d.motionSpeed)),
      actorLabels:["hover","always","hidden"].includes(s.actorLabels)?s.actorLabels:d.actorLabels,
      globalThoughts:s.globalThoughts!==false,
      thoughtRate:Math.max(.5,Math.min(2,Number(s.thoughtRate)||d.thoughtRate)),
      showWorkDock:s.showWorkDock!==false,
      compactWorkDock:s.compactWorkDock===true,
      workRewardMultiplier:Math.max(.25,Math.min(5,Number(s.workRewardMultiplier)||1)),
      workDurationMultiplier:Math.max(.25,Math.min(3,Number(s.workDurationMultiplier)||1)),
      activities:s.activities&&typeof s.activities==="object"?{...s.activities}:{},
      workStats:normalizeWorkStats(s.workStats),
      residentIds:Array.isArray(s.residentIds)?[...new Set(s.residentIds.map(String))]:[],
      floorNames:s.floorNames&&typeof s.floorNames==="object"?{...s.floorNames}:{},
      characterWorld,
      regionSettings
    };
  }

  function characterWorldSettings(character,settings){
    return normalizeCharacterWorld(settings.characterWorld?.[character.id]);
  }

  function characterAllowedInRegion(character,settings,regionId){
    const cfg=characterWorldSettings(character,settings);
    return cfg.visible&&cfg.regionIds.includes(regionId);
  }
  function readHotelSettings(){
    try{
      return ensureHotelActivities(normalizeHotelSettings(JSON.parse(localStorage.getItem(WORLD_STORAGE_KEY)||"{}")));
    }catch{
      return ensureHotelActivities(hotelDefaults());
    }
  }

  function saveHotelSettings(settings){
    localStorage.setItem(WORLD_STORAGE_KEY,JSON.stringify(normalizeHotelSettings(settings)));
  }

  function readScenePlacements(){
    try{
      const value=JSON.parse(localStorage.getItem(WORLD_SCENE_STORAGE_KEY)||"{}");
      return value&&typeof value==="object"?value:{};
    }catch{
      return {};
    }
  }

  function saveScenePlacements(value){
    localStorage.setItem(WORLD_SCENE_STORAGE_KEY,JSON.stringify(value&&typeof value==="object"?value:{}));
  }

  function stableNumber(value){
    const text=String(value||"");
    let n=0;
    for(let i=0;i<text.length;i++)n=(n*31+text.charCodeAt(i))>>>0;
    return n;
  }

  function currentHotelResidents(settings){
    const regionSettings=worldRegionSettings(settings,"hotel");
    if(!regionSettings.showCharacters)return [];
    const chars=enabledCharacters().filter(c=>characterAllowedInRegion(c,settings,"hotel"));
    const chosen=settings.autoResidents
      ? chars
      : chars.filter(c=>settings.residentIds.includes(c.id));
    return chosen.slice(0,regionSettings.maxActors);
  }

  function actorFloorIndex(character,settings){
    const cfg=characterWorldSettings(character,settings);
    const floors=hotelRegion().floors;
    if(cfg.placement){
      const index=floors.findIndex(f=>f.id===cfg.placement.floor);
      if(index>=0)return index;
    }
    if(cfg.floor!=="auto"){
      const index=floors.findIndex(f=>f.id===cfg.floor);
      if(index>=0)return index;
    }
    return stableNumber(character.id)%Math.max(1,floors.length);
  }

  function worldThoughtPool(characterId){
    return state.thoughts.filter(t=>t.enabled&&t.characterId===characterId&&String(t.text||"").trim());
  }

  function floorDisplayName(floor,settings){
    return String(settings.floorNames[floor.id]||floor.name||floor.id).trim() || floor.name;
  }

  function hotelPropMarkup(id){
    if(id==="lobby"){
      return '<div class="hotel-props lobby-props" aria-hidden="true">'+
        '<span class="hotel-chandelier">♥</span><span class="hotel-frontdesk"></span><span class="hotel-luggage"></span><span class="hotel-door"></span>'+
        '<span class="hotel-piano"></span><span class="hotel-piano-seat"></span>'+
        '<span class="hotel-lobby-column one"></span><span class="hotel-lobby-column two"></span>'+
      '</div>';
    }
    if(id==="bar"){
      return '<div class="hotel-props bar-props" aria-hidden="true">'+
        '<span class="hotel-curtain left"></span><span class="hotel-curtain right"></span><span class="hotel-stage"></span><span class="hotel-mic"></span>'+
        '<span class="hotel-bar"></span><span class="hotel-bottles">◆ ◆ ◆</span><span class="hotel-stool one"></span><span class="hotel-stool two"></span>'+
        '<span class="hotel-jukebox">♪</span>'+
      '</div>';
    }
    if(id==="lounge"){
      return '<div class="hotel-props lounge-props" aria-hidden="true">'+
        '<span class="hotel-lounge-fireplace"><i></i><b>◉</b></span>'+
        '<span class="hotel-sofa"></span><span class="hotel-sidechair"></span><span class="hotel-table"></span><span class="hotel-lamp"></span>'+
        '<span class="hotel-frame">♡</span><span class="hotel-rug"></span><span class="hotel-plant"></span>'+
      '</div>';
    }
    if(id==="suites"){
      return '<div class="hotel-props suites-props hotel-corridor-scene" aria-hidden="true">'+
        '<span class="corridor-runner"></span>'+
        '<span class="corridor-door d1"><i></i></span><span class="corridor-door d2"><i></i></span><span class="corridor-door d3"><i></i></span><span class="corridor-door d4"><i></i></span>'+
        '<span class="corridor-sconce s1"></span><span class="corridor-sconce s2"></span><span class="corridor-sconce s3"></span><span class="corridor-sconce s4"></span>'+
        '<span class="corridor-chandelier c1"><i></i><i></i><i></i></span><span class="corridor-chandelier c2"><i></i><i></i><i></i></span>'+
        '<span class="corridor-end-window"><i></i><i></i></span>'+
      '</div>';
    }
    return '<div class="hotel-props penthouse-props penthouse-room-pair" aria-hidden="true">'+
      '<section class="character-room lucifer-room">'+
        '<span class="room-nameplate">LUCIFER</span>'+
        '<span class="lucifer-bookcase"><i></i><i></i><i></i><i></i><i></i></span>'+
        '<span class="lucifer-fireplace"><i></i><b>◉</b><em></em></span>'+
        '<span class="lucifer-sofa"><i></i></span><span class="lucifer-table"><b>◆</b></span>'+
        '<span class="lucifer-bed"><i></i><i></i><b>♛</b></span>'+
        '<span class="lucifer-wall-lamp one"></span><span class="lucifer-wall-lamp two"></span>'+
        '<span class="lucifer-rug"></span>'+
      '</section>'+
      '<span class="private-room-door lucifer-private-door"><i></i><b>♛</b><em></em></span>'+
      '<span class="private-room-door alastor-private-door"><i></i><b>◉</b><em></em></span>'+
      '<section class="character-room alastor-room">'+
        '<span class="room-nameplate">ALASTOR</span>'+
        '<span class="alastor-fireplace"><i></i><b>◉</b><em></em></span>'+
        '<span class="alastor-chair"></span><span class="alastor-radio"><i></i><b>♪</b></span>'+
        '<span class="alastor-eye-wall e1"><i></i></span><span class="alastor-eye-wall e2"><i></i></span>'+
        '<span class="alastor-antler a1"></span><span class="alastor-antler a2"></span>'+
        '<span class="alastor-side-table"><b>◆</b></span><span class="alastor-rug"></span>'+
      '</section>'+
    '</div>';
  }
  function actorMarkup(character,index,floorIndex,settings){
    const key=stableNumber(character.id||character.name||index);
    const cfg=characterWorldSettings(character,settings);
    const floor=hotelRegion().floors[floorIndex];
    const placement=cfg.placement&&floor&&cfg.placement.floor===floor.id?cfg.placement:null;
    const activity=floor?activitySlotForFloor(settings,floor.id):null;
    const task=activity?.status==="working"?hotelActivityById(activity.taskId):null;
    const isWorker=Boolean(task&&activity.workerId===character.id);
    const left=isWorker?Math.max(5,Math.min(90,Number(task.anchor)||50)):(placement?placement.left:8+(key%72));
    const travel=isWorker?6:18+(key%16);
    const duration=(12+(key%7)*1.35)/(settings.motionSpeed*cfg.speed);
    const delay=-((key%90)/10);
    const initials=(character.name||"?").slice(0,2).toUpperCase();
    const image=cfg.image||character.image||"";
    const art=image
      ? '<img src="'+esc(image)+'" alt="" draggable="false" />'
      : '<span class="hotel-actor-fallback">'+esc(initials)+'</span>';
    return '<div class="hotel-actor move-'+esc(isWorker?"calm":cfg.movement)+(placement?" is-manually-placed":"")+(isWorker?" is-working-character":"")+' actor-'+(index%4)+'" '+
      'title="'+esc(character.name+(isWorker?" · "+task.title:" · 드래그해서 옮기기"))+'" '+
      'style="--actor-left:'+left+'%;--actor-bottom:8px;--actor-travel:'+travel+'px;--actor-duration:'+duration+'s;--actor-delay:'+delay+'s;--actor-scale:'+cfg.scale+'" '+
      'data-character-id="'+esc(character.id)+'">'+
      art+'<small>'+esc(character.name)+'</small></div>';
  }
  function decorativeActorMarkup(index,settings){
    const duration=(12+index*1.8)/settings.motionSpeed;
    return '<div class="hotel-actor hotel-guest guest-'+index+'" aria-hidden="true" style="--actor-left:'+(14+index*23)+'%;--actor-duration:'+duration+'s;--actor-delay:-'+(index*2.4)+'s"><span class="hotel-actor-fallback">◆</span></div>';
  }

  function hotelActivityMarkup(floorId,settings){
    const slot=activitySlotForFloor(settings,floorId);
    if(!slot)return "";
    const task=hotelActivityById(slot.taskId);
    if(!task)return "";
    const currency=esc(state.gacha.currencyName||"SOUL");
    if(slot.status==="working"){
      const now=Date.now();
      const total=Math.max(1,slot.endAt-slot.startedAt);
      const elapsed=Math.max(0,Math.min(total,now-slot.startedAt));
      const percent=Math.round(elapsed/total*100);
      return '<div class="hotel-job-card is-working" data-hotel-job-card data-floor="'+esc(floorId)+'" data-start-at="'+slot.startedAt+'" data-end-at="'+slot.endAt+'">'+
        '<span class="hotel-job-icon">'+esc(task.icon||"◆")+'</span>'+
        '<div class="hotel-job-copy"><small>WORKING · '+currency+'</small><strong>'+esc(task.title)+'</strong><em data-hotel-job-time>'+formatWorkTime(slot.endAt-now)+'</em></div>'+
        '<div class="hotel-job-progress"><i data-hotel-job-progress style="width:'+percent+'%"></i></div>'+
      '</div>';
    }
    if(slot.status==="complete"){
      return '<button class="hotel-job-card is-complete" type="button" data-action="hotel-job-next" data-floor="'+esc(floorId)+'">'+
        '<span class="hotel-job-icon">✓</span>'+
        '<div class="hotel-job-copy"><small>PAID · '+currency+'</small><strong>'+esc(task.title)+'</strong><em>+'+slot.reward+' · NEW JOB</em></div>'+
      '</button>';
    }
    return '<button class="hotel-job-card is-ready" type="button" data-action="hotel-job-start" data-floor="'+esc(floorId)+'">'+
      '<span class="hotel-job-icon">'+esc(task.icon||"◆")+'</span>'+
      '<div class="hotel-job-copy"><small>READY · '+currency+' +'+Math.round((task.reward||0)*settings.workRewardMultiplier)+'</small><strong>'+esc(task.title)+'</strong><em>'+esc(task.detail||"업무")+' · '+formatWorkTime((task.duration||60)*1000*settings.workDurationMultiplier)+'</em></div>'+
    '</button>';
  }

  function hotelWorkDock(settings){
    if(!worldRegionSettings(settings,"hotel").showWork)return "";
    const workFloors=hotelRegion().floors.slice().reverse().filter(floor=>hotelActivitiesForFloor(floor.id).length);
    const cards=workFloors.map(floor=>{
      return '<div class="hotel-work-slot" data-work-floor="'+esc(floor.id)+'">'+
        '<div class="hotel-work-slot-head"><span>'+esc(floor.number)+'</span><strong>'+esc(floorDisplayName(floor,settings))+'</strong></div>'+
        hotelActivityMarkup(floor.id,settings)+
      '</div>';
    }).join("");
    return '<section class="hotel-work-dock" aria-label="HOTEL WORK">'+
      '<div class="hotel-work-dock-title"><span>HOTEL WORK</span><small>누르고 기다리면 자동으로 SOUL을 획득합니다.</small></div>'+
      '<div class="hotel-work-grid">'+cards+'</div>'+
    '</section>';
  }

  function settleHotelActivities(settings){
    const completed=[];
    const now=Date.now();
    Object.entries(settings.activities||{}).forEach(([floorId,raw])=>{
      const slot=normalizeWorkSlot(raw,floorId);
      if(!slot||slot.status!=="working"||!slot.endAt||slot.endAt>now)return;
      slot.status="complete";
      slot.paidAt=now;
      settings.activities[floorId]=slot;
      state.gacha.balance=Math.max(0,Number(state.gacha.balance)||0)+slot.reward;
      settings.workStats=normalizeWorkStats(settings.workStats);
      settings.workStats.dayEarned+=slot.reward;
      settings.workStats.totalEarned+=slot.reward;
      settings.workStats.completed+=1;
      completed.push({floorId,reward:slot.reward,task:hotelActivityById(slot.taskId)});
    });
    if(completed.length){
      saveHotelSettings(settings);
      saveProgressState();
    }
    return completed;
  }

  function updateHotelActivityClock(){
    const now=Date.now();
    $$("[data-hotel-job-card].is-working",pageRoot).forEach(card=>{
      const start=Number(card.dataset.startAt)||now;
      const end=Number(card.dataset.endAt)||now;
      const total=Math.max(1,end-start);
      const elapsed=Math.max(0,Math.min(total,now-start));
      const time=$("[data-hotel-job-time]",card);
      const bar=$("[data-hotel-job-progress]",card);
      if(time)time.textContent=formatWorkTime(end-now);
      if(bar)bar.style.width=Math.round(elapsed/total*100)+"%";
    });
  }

  function scheduleHotelActivityTicker(){
    clearTimeout(worldActivityTimer);
    if(currentPage!=="world")return;
    worldActivityTimer=setTimeout(()=>{
      if(currentPage!=="world"||!pageRoot.querySelector(".world-hotel-page"))return;
      const settings=readHotelSettings();
      const completed=settleHotelActivities(settings);
      if(completed.length){
        const total=completed.reduce((sum,item)=>sum+item.reward,0);
        renderWorld();
        showToast("SHIFT COMPLETE · +"+total+" "+(state.gacha.currencyName||"SOUL"));
        return;
      }
      updateHotelActivityClock();
      scheduleHotelActivityTicker();
    },750);
  }

  function renderHotelFloor(floor,index,residents,settings){
    const assigned=residents.filter(c=>actorFloorIndex(c,settings)===index);
    let actors=assigned.map((c,i)=>actorMarkup(c,i,index,settings)).join("");
    if(!actors && settings.decorativeGuests && index<4){
      actors=decorativeActorMarkup(index,settings);
    }
    const active=focusedHotelFloor===floor.id?" is-focused":"";
    return '<section class="hotel-floor floor-'+esc(floor.id)+active+'" data-floor="'+esc(floor.id)+'">'+
      '<button class="hotel-floor-label" type="button" data-action="hotel-floor-info" data-floor="'+esc(floor.id)+'">'+
        '<span>'+esc(floor.number)+'</span><strong>'+esc(floorDisplayName(floor,settings))+'</strong>'+
      '</button>'+
      '<div class="hotel-floor-interior">'+
        '<div class="hotel-ceiling-trim"><i></i><i></i><i></i><i></i><i></i></div>'+
        '<div class="hotel-ceiling-medallions"><i></i><i></i><i></i><i></i></div>'+
        '<div class="hotel-wall-filigree left"></div><div class="hotel-wall-filigree right"></div>'+
        '<div class="hotel-wall-panels"><i></i><i></i><i></i><i></i><i></i><i></i></div>'+
        '<div class="hotel-arch-set"><i></i><i></i><i></i><i></i></div>'+
        '<div class="hotel-room room-left"></div><div class="hotel-room room-center"></div><div class="hotel-room room-right"></div>'+
        '<div class="hotel-column-set"><i></i><i></i><i></i><i></i></div>'+
        '<div class="hotel-balcony-rail"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>'+
        '<div class="hotel-floor-bulbs"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>'+
        hotelPropMarkup(floor.id)+
        '<div class="hotel-actors">'+actors+'</div>'+
      '</div>'+
    '</section>';
  }

  function hotelCrown(){
    return '<div class="hotel-crown" aria-hidden="true">'+
      '<div class="hotel-rays"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>'+
      '<div class="hotel-crown-wing left"><i></i><i></i><i></i></div><div class="hotel-crown-wing right"><i></i><i></i><i></i></div>'+
      '<div class="hotel-sign-backplate"><i></i><i></i><i></i><i></i></div>'+
      '<div class="hotel-sign"><b>HAZBIN</b><span>HOTEL</span><em></em></div>'+
      '<div class="hotel-eye-feathers left"><i></i><i></i><i></i><i></i></div><div class="hotel-eye-feathers right"><i></i><i></i><i></i><i></i></div>'+
      '<div class="hotel-eye"><i></i></div>'+
      '<div class="hotel-horns left"><i></i><i></i><i></i></div><div class="hotel-horns right"><i></i><i></i><i></i></div>'+
      '<div class="hotel-marquee-bulbs"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>'+
    '</div>';
  }

  function hotelFacadeDecor(){
    return ''+
      '<div class="hotel-wing-shell wing-left" aria-hidden="true">'+
        '<div class="hotel-wing-roof"><i></i><i></i><i></i><i></i><i></i></div>'+
        '<div class="hotel-wing-windowwall"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>'+
        '<div class="hotel-wing-music"><i></i><i></i><i></i><i></i><i></i><span>♪</span><span>♫</span><span>♪</span></div>'+
        '<div class="hotel-wing-cards"><b>♦</b><b>♥</b><b>♣</b></div>'+
        '<div class="hotel-wing-bulbs"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>'+
      '</div>'+
      '<div class="hotel-wing-shell wing-right" aria-hidden="true">'+
        '<div class="hotel-ship-hull"><div class="hotel-ship-creamline"></div><div class="hotel-ship-oval-windows"><i></i><i></i><i></i><i></i></div><span></span></div>'+
        '<div class="hotel-ship-bridge"><i></i><i></i><i></i><b>♥</b></div>'+
        '<div class="hotel-ship-deck deck-one"><i></i><i></i><i></i><i></i></div>'+
        '<div class="hotel-ship-deck deck-two"><i></i><i></i><i></i></div>'+
        '<div class="hotel-ship-portholes"><i></i><i></i><i></i><i></i><i></i></div>'+
        '<div class="hotel-ship-neon"><i></i><i></i><i></i><i></i><i></i></div>'+
        '<div class="hotel-ship-heart">♡</div>'+
      '</div>'+
      '<div class="hotel-side-decor left" aria-hidden="true"><i>♥</i><i>♦</i><i>♣</i></div>'+
      '<div class="hotel-side-decor right" aria-hidden="true"><i></i><i></i><i></i></div>'+
      '<div class="hotel-outer-tower left" aria-hidden="true"><b>♥</b><i></i><i></i><i></i><span></span></div>'+
      '<div class="hotel-outer-tower right" aria-hidden="true"><b>♥</b><i></i><i></i><i></i><span></span></div>'+
      '<div class="hotel-roof-fin left" aria-hidden="true"></div><div class="hotel-roof-fin right" aria-hidden="true"></div>'+
      '<div class="hotel-corner-spire left" aria-hidden="true"><i></i><b>◆</b></div><div class="hotel-corner-spire right" aria-hidden="true"><i></i><b>◆</b></div>'+
      '<div class="hotel-center-rib" aria-hidden="true"><i></i><i></i><i></i><i></i><span>♥</span><span>♥</span><span>♥</span></div>'+
      '<div class="hotel-facade-eye eye-left" aria-hidden="true"><i></i></div><div class="hotel-facade-eye eye-right" aria-hidden="true"><i></i></div>'+
      '<div class="hotel-vertical-sign" aria-hidden="true"><span>H</span><span>O</span><span>T</span><span>E</span><span>L</span></div>'+
      '<div class="hotel-entrance-crown" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><b>♥</b></div>'+
      '<div class="hotel-entrance-marquee" aria-hidden="true"><i></i><b>♥</b><i></i></div>'+
      '<div class="hotel-foundation-lights" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>';
  }
  window.renderWorld=function renderWorld(){
    const region=hotelRegion();
    const settings=readHotelSettings();
    const sceneSettings=worldRegionSettings(settings,"hotel");
    settleHotelActivities(settings);
    const residents=currentHotelResidents(settings);
    const classes=[
      "world-hotel-page",
      sceneSettings.motion?"":"motion-off",
      settings.neon?"":"neon-off",
      settings.particles?"":"particles-off",
      settings.showFloorLabels?"":"floor-labels-off",
      "actor-labels-"+sceneSettings.actorLabels,
      sceneSettings.showBadge?"":"world-badge-off",
      settings.compactWorkDock?"work-dock-compact":""
    ].join(" ");
    const floors=region.floors.map((floor,index)=>renderHotelFloor(floor,index,residents,settings)).join("");
    const residentsText=settings.autoResidents
      ? "AUTO · "+residents.length+" VISIBLE"
      : "SELECTED · "+residents.length+" VISIBLE";

    pageRoot.innerHTML=
      '<section class="'+classes+'" style="--hotel-ambient-duration:'+(7/settings.motionSpeed)+'s;--hotel-scene-brightness:'+sceneSettings.brightness+';--hotel-scene-saturation:'+sceneSettings.saturation+'">'+
        '<header class="world-hotel-head world-page-head">'+
          '<div><p class="page-kicker">WORLD · 01</p><h1>'+esc(region.name)+'</h1><p>'+esc(region.subtitle)+'</p></div>'+
          '<div class="world-hotel-actions">'+
            '<div class="hotel-economy"><small>'+esc(state.gacha.currencyName||"SOUL")+'</small><strong>'+state.gacha.balance+'</strong><span>TODAY +'+settings.workStats.dayEarned+'</span></div>'+
            '<div class="hotel-status"><i></i><span>HOTEL OPEN</span><small>'+esc(residentsText)+'</small></div>'+
            '<button class="ghost-button" type="button" data-action="world-settings">WORLD SETTINGS</button>'+
          '</div>'+
        '</header>'+
        hotelWorkDock(settings)+
        '<div class="world-map-viewport world-map-viewport-hotel" tabindex="0" aria-label="HAZBIN HOTEL 인터랙티브 지도 · 좌우로 이동 가능">'+
          '<div class="hotel-scene-shell">'+
            '<div class="world-map-badge"><span>INTERACTIVE MAP</span><strong>'+esc(region.name)+'</strong></div>'+
            '<div class="hotel-sky" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span><span></span></div>'+
            '<div class="hotel-city-silhouette" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>'+
            '<div class="hotel-ground-glow" aria-hidden="true"></div>'+
            '<div class="hotel-street-foreground" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>'+
            '<div class="hotel-building">'+
              hotelCrown()+hotelFacadeDecor()+
              '<div class="hotel-cutaway">'+
                '<div class="hotel-lift-shaft" aria-hidden="true">'+
                  '<span class="lift-rail left"></span><span class="lift-rail right"></span><span class="lift-cable"></span>'+
                  '<div class="lift-car"><i></i><b>♥</b><em></em></div>'+
                '</div>'+
                floors+
              '</div>'+
            '</div>'+
          '</div>'+
        '</div>'+
        '<p class="world-map-mobile-hint"><span aria-hidden="true">↔</span> 지도를 좌우로 밀어 둘러보세요</p>'+
        '<aside class="hotel-scene-note hotel-guide-strip hotel-guide-below">'+
          '<span>CUTAWAY VIEW</span>'+
          '<strong>층을 눌러 공간을 확인하고 캐릭터를 드래그해서 직접 배치하세요.</strong>'+
          '<small>캐릭터는 다른 층으로도 끌어 옮길 수 있고 위치가 자동 저장됩니다.</small>'+
        '</aside>'+
      '</section>';
    scheduleWorldThoughts();
    scheduleHotelActivityTicker();
  };

  function showWorldThought(actor,thought,wasDiscovered){
    if(!actor||actor.querySelector(".hotel-thought-bubble"))return;
    const bubble=document.createElement("div");
    bubble.className="hotel-thought-bubble"+(wasDiscovered?"":" is-new");
    const raw=String(thought.text||"").trim();
    const short=raw.length>96?raw.slice(0,93)+"…":raw;
    bubble.innerHTML='<span>THOUGHT'+(wasDiscovered?"":" · NEW")+'</span><p>'+esc(short)+'</p>';
    actor.appendChild(bubble);
    requestAnimationFrame(()=>bubble.classList.add("show"));
    setTimeout(()=>bubble.classList.remove("show"),3900);
    setTimeout(()=>bubble.remove(),4300);
  }

  function scheduleWorldThoughts(){
    clearTimeout(worldThoughtTimer);
    if(currentPage!=="world")return;
    const currentSettings=readHotelSettings();
    if(!currentSettings.globalThoughts)return;
    worldThoughtTimer=setTimeout(()=>{
      if(currentPage!=="world"||!pageRoot.querySelector(".world-hotel-page"))return;
      const settings=readHotelSettings();
      const candidates=$$(".hotel-actor[data-character-id]",pageRoot).map(actor=>{
        const character=getCharacter(actor.dataset.characterId);
        if(!character)return null;
        const cfg=characterWorldSettings(character,settings);
        const pool=cfg.thoughts?worldThoughtPool(character.id):[];
        return pool.length?{actor,character,cfg,pool}:null;
      }).filter(Boolean).filter(x=>!x.actor.querySelector(".hotel-thought-bubble"));
      if(candidates.length){
        const selected=candidates[Math.floor(Math.random()*candidates.length)];
        const chance={rare:.26,normal:.58,often:.9}[selected.cfg.thoughtFrequency]||.58;
        if(Math.random()<chance){
          const thought=selected.pool[Math.floor(Math.random()*selected.pool.length)];
          const discovered=state.discoveredThoughtIds.includes(thought.id);
          if(!discovered){
            state.discoveredThoughtIds.push(thought.id);
            state.discoveredThoughtIds=[...new Set(state.discoveredThoughtIds)];
            saveProgressState();
          }
          showWorldThought(selected.actor,thought,discovered);
        }
      }
      scheduleWorldThoughts();
    },(6500+Math.random()*4500)/currentSettings.thoughtRate);
  }

  function openHotelFloorInfo(floorId){
    const settings=readHotelSettings();
    const floor=hotelRegion().floors.find(x=>x.id===floorId);
    if(!floor)return;
    focusedHotelFloor=floor.id;
    const residents=currentHotelResidents(settings).filter(c=>actorFloorIndex(c,settings)===hotelRegion().floors.indexOf(floor));
    openModal(
      floorDisplayName(floor,settings),
      '<div class="hotel-floor-modal"><p>'+esc(floor.description)+'</p>'+
      '<div><span>현재 표시 캐릭터</span><strong>'+(residents.length?residents.map(c=>esc(c.name)).join(" · "):"없음")+'</strong></div>'+
      '<p class="muted">업무가 있는 층은 화면 위 HOTEL WORK에서 시작할 수 있습니다. 캐릭터 배치는 호텔 화면에서 직접 드래그해 변경합니다.</p></div>'
    );
    renderWorld();
  }

  function characterWorldEditor(character,settings){
    const cfg=characterWorldSettings(character,settings);
    const baseImage=character.image||"";
    const preview=cfg.image||baseImage;
    const uploaded=/^data:image\//i.test(cfg.image);
    const imageFieldValue=uploaded?"":cfg.image;
    const imageStatus=uploaded
      ?"사진 파일 사용 중 · URL을 입력하면 교체됩니다."
      :cfg.image
        ?"URL 이미지 사용 중 · 사진 파일로 교체할 수 있습니다."
        :"PNG / JPG / WEBP · 비어 있으면 기존 캐릭터 이미지를 사용합니다.";
    const initials=(character.name||"?").slice(0,2).toUpperCase();
    const thoughts=worldThoughtPool(character.id);
    const allowedRegions=WORLD_CONFIG.regions.filter(region=>cfg.regionIds.includes(region.id));
    const regionAccess=WORLD_CONFIG.regions.map(region=>
      '<label><input type="checkbox" data-world-character-region="'+esc(region.id)+'" '+(cfg.regionIds.includes(region.id)?"checked":"")+' /><span>'+esc(region.name)+'</span></label>'
    ).join("");
    const locationState=allowedRegions.length===WORLD_CONFIG.regions.length?"ALL "+allowedRegions.length:""+allowedRegions.length+" LOCATIONS";
    const floorOptions=['<option value="auto" '+(cfg.floor==="auto"?"selected":"")+'>AUTO · 자동 배치</option>']
      .concat(hotelRegion().floors.map(f=>'<option value="'+esc(f.id)+'" '+(cfg.floor===f.id?"selected":"")+'>'+esc(f.number+" · "+f.name)+'</option>')).join("");
    return '<details class="hotel-character-world-card" data-world-character-card="'+esc(character.id)+'">'+
      '<summary>'+
        '<div class="hotel-world-char-thumb">'+
          '<img '+(preview?'src="'+esc(preview)+'"':'')+' alt="" data-world-summary-image '+(preview?'':'hidden')+' />'+
          '<span data-world-summary-fallback '+(preview?'hidden':'')+'>'+esc(initials)+'</span>'+
        '</div>'+
        '<div class="hotel-world-char-title"><strong>'+esc(character.name)+'</strong><small>'+esc(originLabel(character.origin))+' · '+thoughts.length+' THOUGHTS</small></div>'+
        '<span class="hotel-world-char-state">'+(cfg.visible?locationState:"HIDDEN")+'</span>'+
      '</summary>'+
      '<div class="hotel-world-char-body">'+
        '<div class="hotel-world-preview">'+
          '<div class="hotel-world-preview-stage">'+
            '<img '+(preview?'src="'+esc(preview)+'"':'')+' alt="" data-world-preview-img '+(preview?'':'hidden')+' />'+
            '<span data-world-preview-fallback '+(preview?'hidden':'')+'>'+esc(initials)+'</span>'+
          '</div>'+
          '<small>WORLD 전용 이미지. 비어 있으면 기존 캐릭터 이미지를 사용합니다.</small>'+
        '</div>'+
        '<div class="hotel-world-fields">'+
          '<label class="checkline"><input type="checkbox" data-world-field="visible" '+(cfg.visible?"checked":"")+' /> WORLD에 표시</label>'+
          '<label class="checkline"><input type="checkbox" data-hotel-resident="'+esc(character.id)+'" '+(settings.residentIds.includes(character.id)?"checked":"")+' /> AUTO OFF일 때 수동 목록에 포함</label>'+
          '<section class="world-character-region-access full" data-world-region-access>'+
            '<div class="world-character-region-head"><span><strong>출현 가능 지역</strong><small>체크한 배경에서만 이 캐릭터가 나타납니다.</small></span><div>'+
              '<button type="button" data-action="world-character-region-preset" data-preset="all">전체</button>'+
              '<button type="button" data-action="world-character-region-preset" data-preset="hotel">호텔만</button>'+
              '<button type="button" data-action="world-character-region-preset" data-preset="imp-office">I.M.P만</button>'+
              '<button type="button" data-action="world-character-region-preset" data-preset="none">없음</button>'+
            '</div></div>'+
            '<div class="world-character-region-grid">'+regionAccess+'</div>'+
          '</section>'+
          '<label class="field full"><span>WORLD 전용 이미지 URL</span><input type="url" data-world-field="image" data-world-image value="'+esc(imageFieldValue)+'" placeholder="https://.../character.png" /></label>'+
          '<div class="full" style="grid-column:1/-1;display:flex;gap:8px;align-items:center;flex-wrap:wrap">'+
            '<label class="small-button character-image-file-button">사진 파일 선택<input type="file" accept="image/png,image/jpeg,image/webp" data-world-image-file hidden /></label>'+
            '<button type="button" class="small-button" data-action="clear-world-image">WORLD 이미지 제거</button>'+
            '<small data-world-image-status style="flex:1 1 240px">'+esc(imageStatus)+'</small>'+
          '</div>'+
          '<label class="field"><span>기본 층</span><select data-world-field="floor">'+floorOptions+'</select></label>'+
          '<label class="field"><span>움직임</span><select data-world-field="movement">'+
            '<option value="still" '+(cfg.movement==="still"?"selected":"")+'>STILL · 거의 움직이지 않음</option>'+
            '<option value="calm" '+(cfg.movement==="calm"?"selected":"")+'>CALM · 짧게 이동</option>'+
            '<option value="wander" '+(cfg.movement==="wander"?"selected":"")+'>WANDER · 보통</option>'+
            '<option value="active" '+(cfg.movement==="active"?"selected":"")+'>ACTIVE · 많이 돌아다님</option>'+
          '</select></label>'+
          '<label class="field"><span>이동 속도 · 0.45 ~ 1.8</span><input type="number" min=".45" max="1.8" step=".05" data-world-field="speed" value="'+cfg.speed+'" /></label>'+
          '<label class="field"><span>캐릭터 크기 · 0.6 ~ 1.55</span><input type="number" min=".6" max="1.55" step=".05" data-world-field="scale" value="'+cfg.scale+'" /></label>'+
          '<label class="checkline"><input type="checkbox" data-world-field="thoughts" '+(cfg.thoughts?"checked":"")+' /> 기존 THOUGHT가 가끔 떠오름</label>'+
          '<label class="field"><span>THOUGHT 빈도</span><select data-world-field="thoughtFrequency">'+
            '<option value="rare" '+(cfg.thoughtFrequency==="rare"?"selected":"")+'>RARE · 드물게</option>'+
            '<option value="normal" '+(cfg.thoughtFrequency==="normal"?"selected":"")+'>NORMAL · 보통</option>'+
            '<option value="often" '+(cfg.thoughtFrequency==="often"?"selected":"")+'>OFTEN · 자주</option>'+
          '</select></label>'+
        '</div>'+
      '</div>'+
    '</details>';
  }

  const WORLD_IMAGE_MAX_INPUT_BYTES=12*1024*1024;
  const WORLD_IMAGE_MAX_STORED_CHARS=1_750_000;

  function readWorldImageFile(file){
    return new Promise((resolve,reject)=>{
      const reader=new FileReader();
      reader.onload=()=>resolve(String(reader.result||""));
      reader.onerror=()=>reject(new Error("이미지 파일을 읽지 못했습니다."));
      reader.readAsDataURL(file);
    });
  }

  async function optimizeWorldImageFile(file){
    if(!file||!String(file.type||"").startsWith("image/"))throw new Error("이미지 파일만 선택할 수 있습니다.");
    if(file.size>WORLD_IMAGE_MAX_INPUT_BYTES)throw new Error("이미지가 너무 큽니다. 12MB 이하 파일을 선택해주세요.");
    const raw=await readWorldImageFile(file);
    const optimized=await new Promise((resolve,reject)=>{
      const image=new Image();
      image.onload=()=>{
        try{
          const longest=Math.max(image.naturalWidth||1,image.naturalHeight||1);
          const scale=Math.min(1,1200/longest);
          const width=Math.max(1,Math.round((image.naturalWidth||1)*scale));
          const height=Math.max(1,Math.round((image.naturalHeight||1)*scale));
          const canvas=document.createElement("canvas");
          canvas.width=width;
          canvas.height=height;
          const context=canvas.getContext("2d");
          if(!context)throw new Error("이미지 변환을 시작할 수 없습니다.");
          context.drawImage(image,0,0,width,height);
          resolve(canvas.toDataURL("image/webp",.84));
        }catch(error){reject(error)}
      };
      image.onerror=()=>reject(new Error("이미지를 해석하지 못했습니다."));
      image.src=raw;
    });
    if(!String(optimized).startsWith("data:image/"))throw new Error("이미지 변환에 실패했습니다.");
    if(String(optimized).length>WORLD_IMAGE_MAX_STORED_CHARS)throw new Error("압축 후에도 이미지가 너무 큽니다. 더 작은 이미지를 사용해주세요.");
    return String(optimized);
  }

  function syncWorldImagePreview(card,worldImage){
    if(!card)return;
    const character=getCharacter(card.dataset.worldCharacterCard);
    const fallback=character?.image||"";
    const own=String(worldImage||"").trim();
    const src=own||fallback;
    const preview=$("[data-world-preview-img]",card);
    const previewFallback=$("[data-world-preview-fallback]",card);
    const summary=$("[data-world-summary-image]",card);
    const summaryFallback=$("[data-world-summary-fallback]",card);
    [preview,summary].forEach(img=>{
      if(!img)return;
      if(src){img.src=src;img.hidden=false}
      else{img.removeAttribute("src");img.hidden=true}
    });
    [previewFallback,summaryFallback].forEach(node=>{if(node)node.hidden=Boolean(src)});
    const status=$("[data-world-image-status]",card);
    if(status){
      status.textContent=/^data:image\//i.test(own)
        ?"사진 파일 사용 중 · URL을 입력하면 교체됩니다."
        :own
          ?"URL 이미지 사용 중 · 사진 파일로 교체할 수 있습니다."
          :"WORLD 전용 이미지 없음 · 기존 캐릭터 이미지를 사용합니다.";
    }
  }

  async function handleWorldImageFile(input){
    const file=input?.files?.[0];
    const card=input?.closest("[data-world-character-card]");
    if(!file||!card)return;
    try{
      const image=await optimizeWorldImageFile(file);
      card.__worldImageValue=image;
      const urlInput=$("[data-world-image]",card);
      if(urlInput)urlInput.value="";
      syncWorldImagePreview(card,image);
    }catch(error){
      alert(error?.message||"이미지를 불러오지 못했습니다.");
    }finally{
      input.value="";
    }
  }

  function hotelSettingValue(name,value){
    if(name==="maxActors")return Math.round(value)+"명";
    if(name==="sceneBrightness")return Math.round(value*100)+"%";
    return Number(value).toFixed(value%1?2:1)+"×";
  }

  function hotelToggle(name,label,description,checked){
    return '<label class="hotel-setting-toggle">'+
      '<input type="checkbox" name="'+esc(name)+'" '+(checked?"checked":"")+' />'+
      '<span class="hotel-toggle-ui" aria-hidden="true"><i></i></span>'+
      '<span class="hotel-toggle-copy"><strong>'+esc(label)+'</strong><small>'+esc(description)+'</small></span>'+
    '</label>';
  }

  function hotelRange(name,label,description,min,max,step,value){
    return '<label class="hotel-setting-range">'+
      '<span class="hotel-range-head"><strong>'+esc(label)+'</strong><output data-hotel-output="'+esc(name)+'">'+esc(hotelSettingValue(name,value))+'</output></span>'+
      '<small>'+esc(description)+'</small>'+
      '<input type="range" name="'+esc(name)+'" min="'+min+'" max="'+max+'" step="'+step+'" value="'+value+'" data-hotel-range />'+
      '<span class="hotel-range-scale"><b>'+esc(hotelSettingValue(name,Number(min)))+'</b><b>'+esc(hotelSettingValue(name,Number(max)))+'</b></span>'+
    '</label>';
  }

  function worldRegionEditor(region,settings,focusedRegion){
    const cfg=worldRegionSettings(settings,region.id);
    const toggle=(field,label,checked)=>'<label class="world-region-mini-toggle"><input type="checkbox" data-world-region-field="'+field+'" '+(checked?"checked":"")+' /><span></span><b>'+esc(label)+'</b></label>';
    return '<details class="world-region-setting-card" data-world-region-settings="'+esc(region.id)+'" '+(region.id===focusedRegion?'open':'')+'>'+
      '<summary><div><span>'+String(WORLD_CONFIG.regions.indexOf(region)+1).padStart(2,"0")+'</span><strong>'+esc(region.name)+'</strong><small>'+esc(region.subtitle||"")+'</small></div><em>'+Math.round(cfg.brightness*100)+'% · '+cfg.maxActors+'명</em></summary>'+
      '<div class="world-region-setting-body">'+
        '<div class="world-region-toggle-row">'+
          toggle("motion","배경 움직임",cfg.motion)+toggle("showBadge","지도 배지",cfg.showBadge)+toggle("showCharacters","캐릭터",cfg.showCharacters)+toggle("showWork","업무 패널",cfg.showWork)+
        '</div>'+
        '<div class="world-region-control-grid">'+
          '<label><span><b>밝기</b><output data-world-region-output="brightness">'+Math.round(cfg.brightness*100)+'%</output></span><input type="range" min=".72" max="1.28" step=".02" value="'+cfg.brightness+'" data-world-region-field="brightness" /></label>'+
          '<label><span><b>채도</b><output data-world-region-output="saturation">'+Math.round(cfg.saturation*100)+'%</output></span><input type="range" min=".55" max="1.45" step=".05" value="'+cfg.saturation+'" data-world-region-field="saturation" /></label>'+
          '<label><span><b>최대 등장 인원</b><output data-world-region-output="maxActors">'+cfg.maxActors+'명</output></span><input type="range" min="1" max="12" step="1" value="'+cfg.maxActors+'" data-world-region-field="maxActors" /></label>'+
          '<label><span><b>이름표</b></span><select data-world-region-field="actorLabels"><option value="hover" '+(cfg.actorLabels==="hover"?"selected":"")+'>가리킬 때만</option><option value="always" '+(cfg.actorLabels==="always"?"selected":"")+'>항상 표시</option><option value="hidden" '+(cfg.actorLabels==="hidden"?"selected":"")+'>표시 안 함</option></select></label>'+
        '</div>'+
      '</div>'+
    '</details>';
  }

  function defaultWorldPosition(regionId,character,index){
    if(regionId==="hotel"){
      const floors=hotelRegion().floors;
      return {floor:floors[stableNumber(character.id)%Math.max(1,floors.length)]?.id||"lobby",x:8+(stableNumber(character.id)%72)};
    }
    const seed=stableNumber(regionId+"|"+character.id);
    return {x:10+((seed+index*17)%76),y:7+((seed>>4)%10)};
  }

  function worldPositionCard(region,character,index,settings,placements){
    const defaults=defaultWorldPosition(region.id,character,index);
    const cfg=characterWorldSettings(character,settings);
    const saved=region.id==="hotel"?cfg.placement:placements[region.id]?.[character.id];
    const x=Math.max(4,Math.min(92,Number(saved?.left??saved?.x??defaults.x)));
    const y=Math.max(5,Math.min(38,Number(saved?.y??defaults.y??7)));
    const initials=(character.name||"?").slice(0,2).toUpperCase();
    const image=cfg.image||character.image||"";
    const thumb=image?'<img src="'+esc(image)+'" alt="" />':'<span>'+esc(initials)+'</span>';
    const controls=region.id==="hotel"
      ? '<label><span>층</span><select data-world-position-floor>'+hotelRegion().floors.map(f=>'<option value="'+esc(f.id)+'" '+((saved?.floor||defaults.floor)===f.id?'selected':'')+'>'+esc(f.number+' · '+floorDisplayName(f,settings))+'</option>').join("")+'</select></label>'+
        '<label><span>가로 <output data-world-position-output="x">'+Math.round(x)+'%</output></span><input type="range" min="2" max="92" step="1" value="'+x+'" data-world-position-axis="x" /></label>'
      : '<label><span>가로 <output data-world-position-output="x">'+Math.round(x)+'%</output></span><input type="range" min="4" max="92" step="1" value="'+x+'" data-world-position-axis="x" /></label>'+
        '<label><span>높이 <output data-world-position-output="y">'+Math.round(y)+'%</output></span><input type="range" min="5" max="38" step="1" value="'+y+'" data-world-position-axis="y" /></label>';
    const allowed=characterAllowedInRegion(character,settings,region.id);
    return '<article class="world-position-card" data-world-position-card="'+esc(character.id)+'" data-world-position-region="'+esc(region.id)+'" data-default-x="'+defaults.x+'" data-default-y="'+(defaults.y||"")+'" data-default-floor="'+esc(defaults.floor||"")+'" '+(allowed?'':'hidden')+'>'+
      '<div class="world-position-character">'+thumb+'<span><strong>'+esc(character.name)+'</strong><small>'+esc(originLabel(character.origin))+'</small></span></div>'+
      '<div class="world-position-controls">'+controls+'</div>'+
      '<button type="button" class="ghost-button" data-action="world-position-reset-character" aria-label="'+esc(character.name)+' 위치 기본값">초기화</button>'+
    '</article>';
  }

  function worldPositionPanels(chars,settings,focusedRegion){
    const placements=readScenePlacements();
    if(!chars.length)return '<p class="editor-note">캐릭터를 등록하면 지역별 위치를 여기서 조절할 수 있습니다.</p>';
    return '<nav class="world-position-region-nav" aria-label="위치를 설정할 지역">'+WORLD_CONFIG.regions.map(region=>
      '<button type="button" class="'+(region.id===focusedRegion?'active':'')+'" data-world-position-region-button="'+esc(region.id)+'">'+esc(region.name)+' <span data-world-position-region-count="'+esc(region.id)+'">'+chars.filter(character=>characterAllowedInRegion(character,settings,region.id)).length+'</span></button>'
    ).join("")+'</nav>'+
    WORLD_CONFIG.regions.map(region=>{
      const allowedCount=chars.filter(character=>characterAllowedInRegion(character,settings,region.id)).length;
      return '<section class="world-position-panel" data-world-position-panel="'+esc(region.id)+'" '+(region.id===focusedRegion?'':'hidden')+'>'+
        '<div class="world-position-panel-head"><p><strong>'+esc(region.name)+'</strong><span>'+(region.id==="hotel"?'층과 가로 위치를 지정합니다.':'지도 안의 가로·높이 위치를 지정합니다.')+'</span></p><button type="button" class="ghost-button" data-action="world-position-reset-region" data-region="'+esc(region.id)+'">이 지역 모두 초기화</button></div>'+
        '<div class="world-position-list">'+chars.map((character,index)=>worldPositionCard(region,character,index,settings,placements)).join("")+'</div>'+
        '<p class="world-position-empty" data-world-position-empty="'+esc(region.id)+'" '+(allowedCount?'hidden':'')+'>이 지역에 출현하도록 지정된 캐릭터가 없습니다. 캐릭터 탭에서 출현 지역을 선택하세요.</p>'+
      '</section>';
    }
    ).join("");
  }

  function openLegacyHotelSettings(draftSettings=null,notice=""){
    const settings=draftSettings?normalizeHotelSettings(draftSettings):readHotelSettings();
    const chars=enabledCharacters();
    const visibleCount=currentHotelResidents(settings).length;
    const floorInputs=hotelRegion().floors.map(f=>
      '<label class="hotel-floor-name-card"><span><b>'+esc(f.number)+'</b>'+esc(f.name)+'</span><input type="text" data-hotel-floor-name="'+esc(f.id)+'" value="'+esc(floorDisplayName(f,settings))+'" maxlength="28" /></label>'
    ).join("");
    const characterEditors=chars.length
      ? '<div class="hotel-world-character-list">'+chars.map(c=>characterWorldEditor(c,settings)).join("")+'</div>'
      : '<p class="editor-note">아직 등록된 캐릭터가 없습니다. 캐릭터를 추가하면 이 탭에서 WORLD 전용 모습과 행동을 설정할 수 있습니다.</p>';

    modalRoot.innerHTML=
      '<div class="modal-backdrop hotel-settings-backdrop" data-close-modal><section class="modal-card hotel-settings-modal" role="dialog" aria-modal="true" aria-labelledby="hotelSettingsTitle" tabindex="-1">'+
        '<button class="modal-close" type="button" data-close-modal aria-label="닫기" title="닫기">×</button>'+
        '<header class="hotel-settings-hero">'+
          '<div><p class="label">WORLD MANAGEMENT</p><h2 id="hotelSettingsTitle">HOTEL SETTINGS</h2><p>호텔의 분위기, 등장 인원, 업무와 층 구성을 한곳에서 조절합니다.</p></div>'+
          '<div class="hotel-settings-summary"><span><b>'+visibleCount+'</b>현재 표시</span><span><b>'+chars.length+'</b>등록 캐릭터</span><span><b>'+hotelRegion().floors.length+'</b>호텔 층</span></div>'+
        '</header>'+
        '<form id="hotelSettingsForm">'+
          '<div class="hotel-settings-workspace">'+
            '<nav class="hotel-settings-tabs" role="tablist" aria-label="HOTEL SETTINGS 항목">'+
              '<button type="button" class="active" role="tab" aria-selected="true" aria-controls="hotelSettingsScene" data-hotel-settings-tab="scene"><span>01</span><strong>연출</strong><small>조명 · 움직임</small></button>'+
              '<button type="button" role="tab" aria-selected="false" aria-controls="hotelSettingsCast" data-hotel-settings-tab="cast"><span>02</span><strong>캐릭터</strong><small>인원 · THOUGHT</small></button>'+
              '<button type="button" role="tab" aria-selected="false" aria-controls="hotelSettingsWork" data-hotel-settings-tab="work"><span>03</span><strong>업무</strong><small>패널 · 밸런스</small></button>'+
              '<button type="button" role="tab" aria-selected="false" aria-controls="hotelSettingsFloors" data-hotel-settings-tab="floors"><span>04</span><strong>층 관리</strong><small>이름 · 배치</small></button>'+
            '</nav>'+
            '<div class="hotel-settings-content">'+
              (notice?'<div class="hotel-settings-notice" role="status">'+esc(notice)+'</div>':"")+
              '<section class="hotel-settings-panel active" id="hotelSettingsScene" role="tabpanel" data-hotel-settings-panel="scene">'+
                '<div class="hotel-settings-panel-head"><div><span>SCENE & EFFECTS</span><h3>호텔 연출</h3></div><p>기기 성능이나 취향에 맞춰 빠르게 조절할 수 있습니다.</p></div>'+
                '<div class="hotel-preset-grid">'+
                  '<button type="button" data-hotel-preset="cinematic"><span>◆</span><strong>시네마틱</strong><small>조명과 효과를 풍부하게</small></button>'+
                  '<button type="button" data-hotel-preset="balanced"><span>◇</span><strong>기본</strong><small>연출과 성능의 균형</small></button>'+
                  '<button type="button" data-hotel-preset="performance"><span>○</span><strong>가벼움</strong><small>움직임과 장식을 최소화</small></button>'+
                '</div>'+
                '<div class="hotel-setting-card-grid">'+
                  hotelToggle("animation","캐릭터와 배경 움직임","걷기와 배경 애니메이션을 재생합니다.",settings.animation)+
                  hotelToggle("neon","네온 조명","간판과 조명의 빛 번짐을 표시합니다.",settings.neon)+
                  hotelToggle("particles","공기 입자와 불빛","하늘의 반짝임과 주변 효과를 표시합니다.",settings.particles)+
                  hotelToggle("decorativeGuests","빈 층 장식 인물","캐릭터가 없는 층을 실루엣으로 채웁니다.",settings.decorativeGuests)+
                  hotelToggle("showFloorLabels","층 이름표","호텔 안에서 층 번호와 이름을 표시합니다.",settings.showFloorLabels)+
                '</div>'+
                '<div class="hotel-range-grid">'+
                  hotelRange("sceneBrightness","호텔 밝기","배경과 실내 전체 밝기",.72,1.28,.02,settings.sceneBrightness)+
                  hotelRange("motionSpeed","전체 움직임 속도","캐릭터와 배경 애니메이션 속도",.5,1.8,.05,settings.motionSpeed)+
                '</div>'+
              '</section>'+
              '<section class="hotel-settings-panel" id="hotelSettingsCast" role="tabpanel" data-hotel-settings-panel="cast" hidden>'+
                '<div class="hotel-settings-panel-head"><div><span>RESIDENTS & THOUGHTS</span><h3>등장 캐릭터</h3></div><p>호텔에 보이는 인원과 이름표, 말풍선 빈도를 정합니다.</p></div>'+
                '<div class="hotel-setting-card-grid">'+
                  hotelToggle("autoResidents","등록 캐릭터 자동 표시","켜면 표시 가능한 캐릭터를 순서대로 배치합니다.",settings.autoResidents)+
                  hotelToggle("globalThoughts","THOUGHT 말풍선","캐릭터별 설정과 함께 적용되는 전체 스위치입니다.",settings.globalThoughts)+
                '</div>'+
                '<div class="hotel-range-grid">'+
                  hotelRange("maxActors","최대 표시 인원","호텔 한 화면에 동시에 나타나는 캐릭터 수",1,12,1,settings.maxActors)+
                  hotelRange("thoughtRate","전체 THOUGHT 빈도","캐릭터 말풍선이 나타나는 전체 간격",.5,2,.1,settings.thoughtRate)+
                  '<label class="hotel-setting-select"><span><strong>캐릭터 이름표</strong><small>호텔 화면의 이름 표시 방식</small></span><select name="actorLabels">'+
                    '<option value="hover" '+(settings.actorLabels==="hover"?"selected":"")+'>가리킬 때만</option>'+
                    '<option value="always" '+(settings.actorLabels==="always"?"selected":"")+'>항상 표시</option>'+
                    '<option value="hidden" '+(settings.actorLabels==="hidden"?"selected":"")+'>표시 안 함</option>'+
                  '</select></label>'+
                '</div>'+
                '<div class="hotel-settings-subhead"><div><span>CHARACTER WORLD SETTINGS</span><strong>캐릭터별 설정</strong></div><small>이미지 · 기본 층 · 움직임 · THOUGHT</small></div>'+
                '<p class="hotel-settings-help">캐릭터를 눌러 WORLD 전용 모습을 설정하세요. HOME과 대화 화면의 원본 이미지는 바뀌지 않습니다.</p>'+
                characterEditors+
              '</section>'+
              '<section class="hotel-settings-panel" id="hotelSettingsWork" role="tabpanel" data-hotel-settings-panel="work" hidden>'+
                '<div class="hotel-settings-panel-head"><div><span>HOTEL WORK</span><h3>업무와 보상</h3></div><p>업무 패널의 표시 방식과 진행 밸런스를 조절합니다.</p></div>'+
                '<div class="hotel-setting-card-grid">'+
                  hotelToggle("showWorkDock","업무 패널 표시","WORLD 상단에 HOTEL WORK 카드를 표시합니다.",settings.showWorkDock)+
                  hotelToggle("compactWorkDock","간단한 업무 카드","업무 카드 높이와 부가 정보를 줄입니다.",settings.compactWorkDock)+
                '</div>'+
                '<div class="hotel-range-grid">'+
                  hotelRange("workRewardMultiplier","보상 배율","업무를 마쳤을 때 받는 SOUL",.25,5,.05,settings.workRewardMultiplier)+
                  hotelRange("workDurationMultiplier","소요 시간 배율","낮을수록 업무가 더 빨리 끝납니다.",.25,3,.05,settings.workDurationMultiplier)+
                '</div>'+
                '<div class="hotel-settings-info"><span>✓</span><p><strong>업무는 실패하지 않습니다.</strong> WORLD를 나가거나 창을 닫아도 종료 시각은 저장되고, 호텔에 돌아오면 보상이 정산됩니다.</p></div>'+
              '</section>'+
              '<section class="hotel-settings-panel" id="hotelSettingsFloors" role="tabpanel" data-hotel-settings-panel="floors" hidden>'+
                '<div class="hotel-settings-panel-head"><div><span>FLOOR MANAGEMENT</span><h3>층 이름과 배치</h3></div><p>각 층의 표시명을 바꾸거나 저장된 캐릭터 위치를 정리합니다.</p></div>'+
                '<div class="hotel-floor-name-grid">'+floorInputs+'</div>'+
                '<div class="hotel-placement-reset-card"><div><strong>캐릭터 배치 초기화</strong><p>드래그해서 저장한 위치만 지우고 캐릭터별 이미지와 행동 설정은 유지합니다.</p><small data-hotel-placement-state>현재 저장된 위치를 유지합니다.</small></div><button class="ghost-button" type="button" data-action="hotel-placement-reset">배치 초기화 예약</button></div>'+
              '</section>'+
            '</div>'+
          '</div>'+
          '<footer class="hotel-settings-actions"><button class="ghost-button" type="button" data-action="hotel-settings-defaults">기본값 불러오기</button><span>저장을 눌러야 WORLD에 적용됩니다.</span><button class="ghost-button" type="button" data-close-modal>취소</button><button class="gold-button" type="button" data-action="hotel-settings-save">설정 저장</button></footer>'+
        '</form>'+
      '</section></div>';
    requestAnimationFrame(()=>$(".hotel-settings-modal",modalRoot)?.focus());
  }

  function openWorldSettings(draftSettings=null,notice="",focusedRegion="hotel"){
    const settings=draftSettings?normalizeHotelSettings(draftSettings):readHotelSettings();
    const chars=enabledCharacters();
    const selectedRegion=WORLD_CONFIG.regions.some(region=>region.id===focusedRegion)?focusedRegion:"hotel";
    const floorInputs=hotelRegion().floors.map(f=>
      '<label class="hotel-floor-name-card"><span><b>'+esc(f.number)+'</b>'+esc(f.name)+'</span><input type="text" data-hotel-floor-name="'+esc(f.id)+'" value="'+esc(floorDisplayName(f,settings))+'" maxlength="28" /></label>'
    ).join("");
    const characterEditors=chars.length
      ? '<div class="hotel-world-character-list">'+chars.map(c=>characterWorldEditor(c,settings)).join("")+'</div>'
      : '<p class="editor-note">아직 등록된 캐릭터가 없습니다. 캐릭터를 추가하면 WORLD 전용 모습과 행동을 설정할 수 있습니다.</p>';
    const regionEditors=WORLD_CONFIG.regions.map(region=>worldRegionEditor(region,settings,selectedRegion)).join("");

    modalRoot.innerHTML=
      '<div class="modal-backdrop hotel-settings-backdrop" data-close-modal><section class="modal-card hotel-settings-modal" role="dialog" aria-modal="true" aria-labelledby="hotelSettingsTitle" tabindex="-1">'+
        '<button class="modal-close" type="button" data-close-modal aria-label="닫기" title="닫기">×</button>'+
        '<header class="hotel-settings-hero">'+
          '<div><p class="label">WORLD MANAGEMENT</p><h2 id="hotelSettingsTitle">WORLD MAP SETTINGS</h2><p>모든 배경의 연출과 캐릭터 위치를 한곳에서 관리합니다.</p></div>'+
          '<div class="hotel-settings-summary"><span><b>'+WORLD_CONFIG.regions.length+'</b>배경</span><span><b>'+chars.length+'</b>캐릭터</span><span><b>'+hotelRegion().floors.length+'</b>호텔 층</span></div>'+
        '</header>'+
        '<form id="hotelSettingsForm" data-focused-region="'+esc(selectedRegion)+'">'+
          '<div class="hotel-settings-workspace">'+
            '<nav class="hotel-settings-tabs" role="tablist" aria-label="WORLD MAP SETTINGS 항목">'+
              '<button type="button" class="active" role="tab" aria-selected="true" aria-controls="worldSettingsBackground" data-hotel-settings-tab="background"><span>01</span><strong>배경</strong><small>지역별 연출</small></button>'+
              '<button type="button" role="tab" aria-selected="false" aria-controls="worldSettingsCharacters" data-hotel-settings-tab="characters"><span>02</span><strong>캐릭터</strong><small>모습 · 행동</small></button>'+
              '<button type="button" role="tab" aria-selected="false" aria-controls="worldSettingsPositions" data-hotel-settings-tab="positions"><span>03</span><strong>위치</strong><small>지역별 배치</small></button>'+
              '<button type="button" role="tab" aria-selected="false" aria-controls="worldSettingsHotel" data-hotel-settings-tab="hotel"><span>04</span><strong>호텔</strong><small>전용 기능</small></button>'+
            '</nav>'+
            '<div class="hotel-settings-content">'+
              (notice?'<div class="hotel-settings-notice" role="status">'+esc(notice)+'</div>':"")+
              '<section class="hotel-settings-panel active" id="worldSettingsBackground" role="tabpanel" data-hotel-settings-panel="background">'+
                '<div class="hotel-settings-panel-head"><div><span>REGION APPEARANCE</span><h3>배경별 설정</h3></div><p>지역마다 밝기, 채도, 움직임과 등장 인원을 따로 저장합니다.</p></div>'+
                '<div class="world-region-settings-list">'+regionEditors+'</div>'+
              '</section>'+
              '<section class="hotel-settings-panel" id="worldSettingsCharacters" role="tabpanel" data-hotel-settings-panel="characters" hidden>'+
                '<div class="hotel-settings-panel-head"><div><span>CHARACTERS & THOUGHTS</span><h3>캐릭터 공통 설정</h3></div><p>WORLD 전체에서 사용할 모습과 움직임, 말풍선을 설정합니다.</p></div>'+
                '<div class="hotel-setting-card-grid">'+
                  hotelToggle("autoResidents","등록 캐릭터 자동 표시","켜면 표시 가능한 캐릭터를 지역별 최대 인원까지 배치합니다.",settings.autoResidents)+
                  hotelToggle("globalThoughts","THOUGHT 말풍선","캐릭터별 설정과 함께 적용되는 전체 스위치입니다.",settings.globalThoughts)+
                '</div>'+
                '<div class="hotel-range-grid">'+
                  hotelRange("motionSpeed","전체 움직임 속도","캐릭터와 호텔 배경 애니메이션 속도",.5,1.8,.05,settings.motionSpeed)+
                  hotelRange("thoughtRate","전체 THOUGHT 빈도","캐릭터 말풍선이 나타나는 전체 간격",.5,2,.1,settings.thoughtRate)+
                '</div>'+
                '<div class="hotel-settings-subhead"><div><span>CHARACTER WORLD SETTINGS</span><strong>캐릭터별 모습과 행동</strong></div><small>출현 지역 · 이미지 · 움직임 · THOUGHT</small></div>'+
                '<p class="hotel-settings-help">각 캐릭터가 나타날 배경을 고를 수 있습니다. WORLD 전용 설정만 바뀌며 HOME과 대화 화면의 원본 이미지는 유지됩니다.</p>'+
                characterEditors+
              '</section>'+
              '<section class="hotel-settings-panel" id="worldSettingsPositions" role="tabpanel" data-hotel-settings-panel="positions" hidden>'+
                '<div class="hotel-settings-panel-head"><div><span>CHARACTER PLACEMENT</span><h3>지역별 캐릭터 위치</h3></div><p>해당 지역에 출현하도록 지정한 캐릭터만 표시되며 위치를 정확하게 조절할 수 있습니다.</p></div>'+
                worldPositionPanels(chars,settings,selectedRegion)+
              '</section>'+
              '<section class="hotel-settings-panel" id="worldSettingsHotel" role="tabpanel" data-hotel-settings-panel="hotel" hidden>'+
                '<div class="hotel-settings-panel-head"><div><span>HOTEL EXTRAS</span><h3>호텔 전용 설정</h3></div><p>호텔에만 있는 장식, 업무 밸런스와 층 이름을 관리합니다.</p></div>'+
                '<div class="hotel-setting-card-grid">'+
                  hotelToggle("neon","네온 조명","간판과 조명의 빛 번짐을 표시합니다.",settings.neon)+
                  hotelToggle("particles","공기 입자와 불빛","하늘의 반짝임과 주변 효과를 표시합니다.",settings.particles)+
                  hotelToggle("decorativeGuests","빈 층 장식 인물","캐릭터가 없는 층을 실루엣으로 채웁니다.",settings.decorativeGuests)+
                  hotelToggle("showFloorLabels","층 이름표","호텔 안에서 층 번호와 이름을 표시합니다.",settings.showFloorLabels)+
                  hotelToggle("compactWorkDock","간단한 업무 카드","업무 카드 높이와 부가 정보를 줄입니다.",settings.compactWorkDock)+
                '</div>'+
                '<div class="hotel-range-grid">'+
                  hotelRange("workRewardMultiplier","보상 배율","호텔 업무를 마쳤을 때 받는 SOUL",.25,5,.05,settings.workRewardMultiplier)+
                  hotelRange("workDurationMultiplier","소요 시간 배율","낮을수록 호텔 업무가 더 빨리 끝납니다.",.25,3,.05,settings.workDurationMultiplier)+
                '</div>'+
                '<div class="hotel-settings-subhead"><div><span>FLOOR MANAGEMENT</span><strong>호텔 층 이름</strong></div><small>지도와 배치 설정에 함께 표시됩니다.</small></div>'+
                '<div class="hotel-floor-name-grid">'+floorInputs+'</div>'+
                '<div class="hotel-settings-info"><span>✓</span><p><strong>지역별 업무 표시도 배경 탭에서 조절합니다.</strong> 진행 중인 업무는 패널을 숨겨도 계속 저장되고 완료됩니다.</p></div>'+
              '</section>'+
            '</div>'+
          '</div>'+
          '<footer class="hotel-settings-actions"><button class="ghost-button" type="button" data-action="world-settings-defaults">기본값 불러오기</button><span>저장을 눌러야 WORLD에 적용됩니다.</span><button class="ghost-button" type="button" data-close-modal>취소</button><button class="gold-button" type="button" data-action="world-settings-save">설정 저장</button></footer>'+
        '</form>'+
      '</section></div>';
    $("[data-world-character-card]",modalRoot).forEach(card=>{
      const character=getCharacter(card.dataset.worldCharacterCard);
      card.__worldImageValue=character?characterWorldSettings(character,settings).image:"";
    });
    requestAnimationFrame(()=>$(".hotel-settings-modal",modalRoot)?.focus());
  }
  function collectHotelSettings(){
    const form=$("#hotelSettingsForm",modalRoot);
    if(!form)return readHotelSettings();
    const saved=readHotelSettings();
    const next=hotelDefaults();
    next.neon=form.elements.neon.checked;
    next.particles=form.elements.particles.checked;
    next.decorativeGuests=form.elements.decorativeGuests.checked;
    next.showFloorLabels=form.elements.showFloorLabels.checked;
    next.autoResidents=form.elements.autoResidents.checked;
    next.motionSpeed=Number(form.elements.motionSpeed.value);
    next.globalThoughts=form.elements.globalThoughts.checked;
    next.thoughtRate=Number(form.elements.thoughtRate.value);
    next.compactWorkDock=form.elements.compactWorkDock.checked;
    next.workRewardMultiplier=Number(form.elements.workRewardMultiplier.value);
    next.workDurationMultiplier=Number(form.elements.workDurationMultiplier.value);
    next.activities={...saved.activities};
    next.workStats={...saved.workStats};
    next.residentIds=$$("[data-hotel-resident]:checked",form).map(x=>x.dataset.hotelResident);
    next.floorNames={};
    $$("[data-hotel-floor-name]",form).forEach(input=>{
      next.floorNames[input.dataset.hotelFloorName]=input.value.trim();
    });
    next.characterWorld={};
    $$("[data-world-character-card]",form).forEach(card=>{
      const id=card.dataset.worldCharacterCard;
      const field=name=>$('[data-world-field="'+name+'"]',card);
      const regionIds=$$("[data-world-character-region]:checked",card).map(input=>input.dataset.worldCharacterRegion);
      const previous=normalizeCharacterWorld(saved.characterWorld?.[id]);
      const floor=field("floor")?.value||"auto";
      next.characterWorld[id]=normalizeCharacterWorld({
        visible:field("visible")?.checked,
        regionIds,
        image:typeof card.__worldImageValue==="string"?card.__worldImageValue:(field("image")?.value||""),
        floor,
        movement:field("movement")?.value||"wander",
        speed:field("speed")?.value,
        scale:field("scale")?.value,
        placement:floor===previous.floor?previous.placement:null,
        thoughts:field("thoughts")?.checked,
        thoughtFrequency:field("thoughtFrequency")?.value||"normal"
      });
    });
    next.regionSettings={};
    $$("[data-world-region-settings]",form).forEach(card=>{
      const field=name=>card.querySelector('[data-world-region-field="'+name+'"]');
      next.regionSettings[card.dataset.worldRegionSettings]=normalizeWorldRegion({
        brightness:field("brightness")?.value,
        saturation:field("saturation")?.value,
        motion:field("motion")?.checked,
        showBadge:field("showBadge")?.checked,
        showCharacters:field("showCharacters")?.checked,
        showWork:field("showWork")?.checked,
        maxActors:field("maxActors")?.value,
        actorLabels:field("actorLabels")?.value
      });
    });
    $$("[data-world-position-card][data-world-position-region=\"hotel\"]",form).forEach(card=>{
      const id=card.dataset.worldPositionCard;
      if(!next.characterWorld[id])return;
      next.characterWorld[id].placement={
        floor:card.querySelector("[data-world-position-floor]")?.value||card.dataset.defaultFloor,
        left:Number(card.querySelector('[data-world-position-axis="x"]')?.value)||Number(card.dataset.defaultX)
      };
    });
    const hotelScene=next.regionSettings.hotel||worldRegionDefaults();
    next.animation=hotelScene.motion;
    next.sceneBrightness=hotelScene.brightness;
    next.maxActors=hotelScene.maxActors;
    next.actorLabels=hotelScene.actorLabels;
    next.showWorkDock=hotelScene.showWork;
    return normalizeHotelSettings(next);
  }

  function collectScenePlacements(){
    const form=$("#hotelSettingsForm",modalRoot);
    const placements=readScenePlacements();
    if(!form)return placements;
    WORLD_CONFIG.regions.filter(region=>region.id!=="hotel").forEach(region=>{
      placements[region.id]={};
      $$("[data-world-position-card][data-world-position-region=\""+region.id+"\"]",form).forEach(card=>{
        placements[region.id][card.dataset.worldPositionCard]={
          x:Number(card.querySelector('[data-world-position-axis="x"]')?.value)||Number(card.dataset.defaultX),
          y:Number(card.querySelector('[data-world-position-axis="y"]')?.value)||Number(card.dataset.defaultY)
        };
      });
    });
    return placements;
  }

  function activateHotelSettingsTab(tabId){
    $$("[data-hotel-settings-tab]",modalRoot).forEach(button=>{
      const active=button.dataset.hotelSettingsTab===tabId;
      button.classList.toggle("active",active);
      button.setAttribute("aria-selected",String(active));
      button.tabIndex=active?0:-1;
    });
    $$("[data-hotel-settings-panel]",modalRoot).forEach(panel=>{
      const active=panel.dataset.hotelSettingsPanel===tabId;
      panel.hidden=!active;
      panel.classList.toggle("active",active);
    });
    $(".hotel-settings-content",modalRoot)?.scrollTo({top:0,behavior:"smooth"});
  }

  function syncHotelRange(input){
    if(!input?.name)return;
    const output=$("[data-hotel-output=\""+input.name+"\"]",modalRoot);
    if(output)output.textContent=hotelSettingValue(input.name,Number(input.value));
  }

  function syncWorldRegionRange(input){
    const card=input?.closest("[data-world-region-settings]");
    const field=input?.dataset.worldRegionField;
    if(!card||!field)return;
    const output=card.querySelector('[data-world-region-output="'+field+'"]');
    if(output)output.textContent=field==="maxActors"?Math.round(Number(input.value))+"명":Math.round(Number(input.value)*100)+"%";
    const summary=card.querySelector("summary em");
    const brightness=card.querySelector('[data-world-region-field="brightness"]');
    const maxActors=card.querySelector('[data-world-region-field="maxActors"]');
    if(summary&&brightness&&maxActors)summary.textContent=Math.round(Number(brightness.value)*100)+"% · "+Math.round(Number(maxActors.value))+"명";
  }

  function syncWorldPositionRange(input){
    const card=input?.closest("[data-world-position-card]");
    const axis=input?.dataset.worldPositionAxis;
    if(!card||!axis)return;
    const output=card.querySelector('[data-world-position-output="'+axis+'"]');
    if(output)output.textContent=Math.round(Number(input.value))+"%";
  }

  function activateWorldPositionRegion(regionId){
    $$("[data-world-position-region-button]",modalRoot).forEach(button=>button.classList.toggle("active",button.dataset.worldPositionRegionButton===regionId));
    $$("[data-world-position-panel]",modalRoot).forEach(panel=>{panel.hidden=panel.dataset.worldPositionPanel!==regionId});
  }

  function resetWorldPositionCard(card){
    const x=card.querySelector('[data-world-position-axis="x"]');
    const y=card.querySelector('[data-world-position-axis="y"]');
    const floor=card.querySelector("[data-world-position-floor]");
    if(x){x.value=card.dataset.defaultX;syncWorldPositionRange(x)}
    if(y){y.value=card.dataset.defaultY;syncWorldPositionRange(y)}
    if(floor)floor.value=card.dataset.defaultFloor;
  }

  function syncCharacterRegionAccess(card){
    if(!card)return;
    const characterId=card.dataset.worldCharacterCard;
    const visible=card.querySelector('[data-world-field="visible"]')?.checked!==false;
    const selected=new Set($$("[data-world-character-region]:checked",card).map(input=>input.dataset.worldCharacterRegion));
    const stateLabel=card.querySelector(".hotel-world-char-state");
    if(stateLabel){
      stateLabel.textContent=visible
        ? (selected.size===WORLD_CONFIG.regions.length?"ALL "+selected.size:selected.size+" LOCATIONS")
        : "HIDDEN";
    }
    WORLD_CONFIG.regions.forEach(region=>{
      const positionCard=$('[data-world-position-card="'+characterId+'"][data-world-position-region="'+region.id+'"]',modalRoot);
      if(positionCard)positionCard.hidden=!visible||!selected.has(region.id);
      const panel=$('[data-world-position-panel="'+region.id+'"]',modalRoot);
      const visibleCards=panel?$$('[data-world-position-card]:not([hidden])',panel).length:0;
      const count=$('[data-world-position-region-count="'+region.id+'"]',modalRoot);
      if(count)count.textContent=String(visibleCards);
      const empty=$('[data-world-position-empty="'+region.id+'"]',modalRoot);
      if(empty)empty.hidden=visibleCards>0;
    });
  }

  function applyHotelPreset(name){
    const form=$("#hotelSettingsForm",modalRoot);
    if(!form)return;
    const preset={
      cinematic:{animation:true,neon:true,particles:true,decorativeGuests:true,showFloorLabels:true,sceneBrightness:1.12,motionSpeed:1},
      balanced:{animation:true,neon:true,particles:true,decorativeGuests:true,showFloorLabels:true,sceneBrightness:1,motionSpeed:1},
      performance:{animation:false,neon:false,particles:false,decorativeGuests:false,showFloorLabels:true,sceneBrightness:.92,motionSpeed:.7}
    }[name];
    if(!preset)return;
    Object.entries(preset).forEach(([key,value])=>{
      const input=form.elements[key];
      if(!input)return;
      if(input.type==="checkbox")input.checked=value;
      else input.value=value;
      if(input.matches("[data-hotel-range]"))syncHotelRange(input);
    });
    $$("[data-hotel-preset]",modalRoot).forEach(button=>button.classList.toggle("active",button.dataset.hotelPreset===name));
  }

  function startHotelJob(floorId){
    const settings=readHotelSettings();
    const slot=activitySlotForFloor(settings,floorId);
    const task=slot?hotelActivityById(slot.taskId):null;
    if(!slot||!task||slot.status!=="ready")return;
    const now=Date.now();
    const duration=Math.max(5000,Math.round((task.duration||60)*1000*settings.workDurationMultiplier));
    const reward=Math.max(1,Math.round((task.reward||0)*settings.workRewardMultiplier));
    settings.activities[floorId]={
      taskId:task.id,
      status:"working",
      startedAt:now,
      endAt:now+duration,
      reward,
      workerId:chooseActivityWorker(floorId,Number(task.anchor)||50,settings),
      paidAt:0
    };
    saveHotelSettings(settings);
    renderWorld();
    showToast(task.title+" · STARTED");
  }

  function nextHotelJob(floorId){
    const settings=readHotelSettings();
    const slot=activitySlotForFloor(settings,floorId);
    if(!slot||slot.status!=="complete")return;
    const task=rollHotelTask(floorId,slot.taskId);
    if(!task)return;
    settings.activities[floorId]={
      taskId:task.id,status:"ready",startedAt:0,endAt:0,
      reward:Math.max(0,Math.round(task.reward||0)),workerId:"",paidAt:0
    };
    saveHotelSettings(settings);
    renderWorld();
  }

  function dragFloorAt(clientX,clientY){
    const floors=$$(".hotel-floor",pageRoot);
    let nearest=null;
    let nearestDistance=Infinity;
    floors.forEach(floor=>{
      const rect=floor.getBoundingClientRect();
      const withinY=clientY>=rect.top&&clientY<=rect.bottom;
      const withinX=clientX>=rect.left&&clientX<=rect.right;
      if(withinX&&withinY){
        nearest=floor;
        nearestDistance=0;
        return;
      }
      const centerY=rect.top+rect.height/2;
      const distance=Math.abs(clientY-centerY);
      if(distance<nearestDistance&&clientX>=rect.left-80&&clientX<=rect.right+80){
        nearest=floor;
        nearestDistance=distance;
      }
    });
    return nearestDistance<90?nearest:null;
  }

  function clearDragFloorHighlight(){
    $$(".hotel-floor.is-drop-target",pageRoot).forEach(floor=>floor.classList.remove("is-drop-target"));
  }

  function moveWorldActorDrag(event){
    if(!worldActorDrag||event.pointerId!==worldActorDrag.pointerId)return;
    event.preventDefault();
    const {ghost,offsetX,offsetY}=worldActorDrag;
    ghost.style.left=(event.clientX-offsetX)+"px";
    ghost.style.top=(event.clientY-offsetY)+"px";
    clearDragFloorHighlight();
    const floor=dragFloorAt(event.clientX,event.clientY);
    if(floor)floor.classList.add("is-drop-target");
    worldActorDrag.targetFloor=floor;
  }

  function finishWorldActorDrag(event){
    if(!worldActorDrag||event.pointerId!==worldActorDrag.pointerId)return;
    event.preventDefault();
    const drag=worldActorDrag;
    worldActorDrag=null;
    window.removeEventListener("pointermove",moveWorldActorDrag);
    window.removeEventListener("pointerup",finishWorldActorDrag);
    window.removeEventListener("pointercancel",finishWorldActorDrag);
    document.body.classList.remove("hotel-character-drag-active");
    clearDragFloorHighlight();
    drag.ghost.remove();

    const targetFloor=drag.targetFloor||dragFloorAt(event.clientX,event.clientY);
    if(!targetFloor){
      drag.source.style.visibility="";
      return;
    }
    const interior=$(".hotel-floor-interior",targetFloor);
    if(!interior){
      drag.source.style.visibility="";
      return;
    }
    const rect=interior.getBoundingClientRect();
    const actorWidth=Math.min(60,drag.sourceRect.width||40);
    const left=((event.clientX-rect.left-actorWidth/2)/Math.max(1,rect.width))*100;
    const placement={
      floor:targetFloor.dataset.floor,
      left:Math.round(Math.max(2,Math.min(92,left))*10)/10
    };
    const settings=readHotelSettings();
    const current=normalizeCharacterWorld(settings.characterWorld?.[drag.characterId]);
    settings.characterWorld[drag.characterId]={...current,placement};
    saveHotelSettings(settings);
    const character=getCharacter(drag.characterId);
    renderWorld();
    showToast((character?.name||"CHARACTER")+" POSITION SAVED");
  }

  function startWorldActorDrag(actor,event){
    if(worldActorDrag||currentPage!=="world")return;
    const id=actor.dataset.characterId;
    if(!id)return;
    event.preventDefault();
    event.stopPropagation();
    const rect=actor.getBoundingClientRect();
    const ghost=actor.cloneNode(true);
    ghost.classList.add("hotel-drag-ghost","is-dragging");
    ghost.style.width=rect.width+"px";
    ghost.style.height=rect.height+"px";
    ghost.style.left=rect.left+"px";
    ghost.style.top=rect.top+"px";
    ghost.style.setProperty("--actor-scale","1");
    document.body.appendChild(ghost);
    actor.style.visibility="hidden";
    document.body.classList.add("hotel-character-drag-active");
    worldActorDrag={
      pointerId:event.pointerId,
      characterId:id,
      source:actor,
      sourceRect:rect,
      ghost,
      offsetX:event.clientX-rect.left,
      offsetY:event.clientY-rect.top,
      targetFloor:actor.closest(".hotel-floor")
    };
    window.addEventListener("pointermove",moveWorldActorDrag,{passive:false});
    window.addEventListener("pointerup",finishWorldActorDrag,{passive:false});
    window.addEventListener("pointercancel",finishWorldActorDrag,{passive:false});
  }

  pageRoot.addEventListener("pointerdown",event=>{
    const actor=event.target.closest(".hotel-actor[data-character-id]:not(.hotel-guest):not(.is-working-character)");
    if(!actor)return;
    startWorldActorDrag(actor,event);
  });

  pageRoot.addEventListener("click",event=>{
    const button=event.target.closest("[data-action]");
    if(!button)return;
    const action=button.dataset.action;
    if(action==="world-settings"||action==="hotel-settings"){
      openWorldSettings(null,"",button.dataset.worldSettingsRegion||"hotel");
    }else if(action==="hotel-floor-info"){
      openHotelFloorInfo(button.dataset.floor);
    }else if(action==="hotel-job-start"){
      startHotelJob(button.dataset.floor);
    }else if(action==="hotel-job-next"){
      nextHotelJob(button.dataset.floor);
    }
  });

  modalRoot.addEventListener("input",event=>{
    const range=event.target.closest("[data-hotel-range]");
    if(range)syncHotelRange(range);
    const regionRange=event.target.closest('[data-world-region-field][type="range"]');
    if(regionRange)syncWorldRegionRange(regionRange);
    const positionRange=event.target.closest("[data-world-position-axis]");
    if(positionRange)syncWorldPositionRange(positionRange);
    const accessInput=event.target.closest('[data-world-character-region],[data-world-field="visible"]');
    if(accessInput)syncCharacterRegionAccess(accessInput.closest("[data-world-character-card]"));
    const input=event.target.closest("[data-world-image]");
    if(!input)return;
    const card=input.closest("[data-world-character-card]");
    if(!card)return;
    card.__worldImageValue=input.value.trim();
    syncWorldImagePreview(card,card.__worldImageValue);
  });

  modalRoot.addEventListener("change",event=>{
    const input=event.target.closest("[data-world-image-file]");
    if(input)handleWorldImageFile(input);
  });

  modalRoot.addEventListener("click",event=>{
    const tab=event.target.closest("[data-hotel-settings-tab]");
    if(tab){
      activateHotelSettingsTab(tab.dataset.hotelSettingsTab);
      return;
    }
    const regionButton=event.target.closest("[data-world-position-region-button]");
    if(regionButton){
      activateWorldPositionRegion(regionButton.dataset.worldPositionRegionButton);
      return;
    }
    const button=event.target.closest("[data-action]");
    if(!button)return;
    if(button.dataset.action==="clear-world-image"){
      const card=button.closest("[data-world-character-card]");
      if(!card)return;
      card.__worldImageValue="";
      const urlInput=$("[data-world-image]",card);
      if(urlInput)urlInput.value="";
      syncWorldImagePreview(card,"");
    }else if(button.dataset.action==="world-character-region-preset"){
      const card=button.closest("[data-world-character-card]");
      if(!card)return;
      const preset=button.dataset.preset;
      $$('[data-world-character-region]',card).forEach(input=>{
        input.checked=preset==="all"||input.dataset.worldCharacterRegion===preset;
      });
      syncCharacterRegionAccess(card);
    }else if(button.dataset.action==="world-settings-save"){
      try{
        saveHotelSettings(collectHotelSettings());
        saveScenePlacements(collectScenePlacements());
      }catch(error){
        alert("WORLD 이미지를 저장하지 못했습니다. 이미지 파일이 너무 크거나 브라우저 저장 공간이 부족할 수 있습니다.");
        return;
      }
      closeModal();
      renderWorld();
      showToast("WORLD MAP SETTINGS SAVED");
    }else if(button.dataset.action==="world-settings-defaults"){
      const form=$("#hotelSettingsForm",modalRoot);
      openWorldSettings(hotelDefaults(),"배경과 캐릭터 설정의 기본값을 불러왔습니다. 위치는 그대로 유지됩니다.",form?.dataset.focusedRegion||"hotel");
    }else if(button.dataset.action==="world-position-reset-character"){
      const card=button.closest("[data-world-position-card]");
      if(card)resetWorldPositionCard(card);
    }else if(button.dataset.action==="world-position-reset-region"){
      const panel=button.closest("[data-world-position-panel]");
      $$("[data-world-position-card]",panel).forEach(resetWorldPositionCard);
    }
  });

  window.HV_WORLD_SETTINGS={
    read:readHotelSettings,
    region:(settings,regionId)=>worldRegionSettings(settings,regionId),
    character:(character,settings)=>characterWorldSettings(character,settings),
    allows:(character,settings,regionId)=>characterAllowedInRegion(character,settings,regionId),
    open:openWorldSettings
  };
})();
