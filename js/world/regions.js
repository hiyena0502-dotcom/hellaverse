"use strict";

(() => {
  const WORLD_CONFIG = window.HV_WORLD_CONFIG || {regions:[]};
  const REGION_KEY = "hellaverse-world-region-v1";
  const SCENE_KEY = "hellaverse-world-scene-placement-v1";
  const HOTEL_SETTINGS_KEY = "hellaverse-world-settings-v1";
  const hotelRender = window.renderWorld;
  let activeRegion = readActiveRegion();
  let sceneDrag = null;

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
      '<div class="heaven-back-clouds" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>'+
      '<div class="heaven-skyline back" aria-hidden="true">'+Array.from({length:11},(_,i)=>'<i class="t'+(i+1)+'"><b></b></i>').join("")+'</div>'+
      '<div class="heaven-skyline front" aria-hidden="true">'+Array.from({length:8},(_,i)=>'<i class="t'+(i+1)+'"><b></b></i>').join("")+'</div>'+
      '<div class="heaven-main-spire" aria-hidden="true"><span></span><i></i><b></b></div>'+
      '<div class="heaven-gate" aria-hidden="true"><div class="heaven-gate-eye"><i></i></div><span class="left"></span><span class="right"></span><b class="left"></b><b class="right"></b></div>'+
      '<div class="heaven-bridge" aria-hidden="true"></div>'+
      '<div class="heaven-front-clouds" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div>';
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
    const residents=sceneResidents();
    const actors=residents.map((character,index)=>sceneActorMarkup(region.id,character,index)).join("");
    pageRoot.innerHTML=
      '<section class="world-scene-page region-'+esc(region.id)+'">'+
        '<header class="world-scene-head">'+
          '<div><p class="page-kicker">WORLD · '+esc(String(regions().indexOf(region)+1).padStart(2,"0"))+'</p><h1>'+esc(region.name)+'</h1><p>'+esc(region.subtitle||"")+'</p></div>'+
          '<div class="world-scene-status"><i></i><span>'+esc(region.status||"OPEN")+'</span><small>'+residents.length+' CHARACTERS</small></div>'+
        '</header>'+
        regionNavMarkup()+
        '<div class="world-scene-shell scene-'+esc(region.id)+'" data-scene-region="'+esc(region.id)+'">'+
          '<div class="scene-artwork">'+sceneArtwork(region.id)+'</div>'+
          '<div class="world-scene-actors">'+actors+'</div>'+
        '</div>'+
        '<aside class="world-scene-guide"><span>FREE PLACEMENT</span><strong>캐릭터를 드래그해서 원하는 위치에 놓을 수 있습니다.</strong><small>지역별 위치는 따로 저장됩니다.</small></aside>'+
      '</section>';
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
