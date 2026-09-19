"use strict";

(() => {
  const WORLD_STORAGE_KEY = "hellaverse-world-settings-v1";
  const WORLD_CONFIG = window.HV_WORLD_CONFIG || {regions:[]};
  let focusedHotelFloor = "lobby";
  let worldThoughtTimer = null;

  function hotelRegion(){
    return WORLD_CONFIG.regions.find(r=>r.id==="hotel") || {
      id:"hotel",
      name:"HAZBIN HOTEL",
      subtitle:"PRIDE RING",
      floors:[]
    };
  }

  function characterWorldDefaults(){
    return {
      visible:true,
      image:"",
      floor:"auto",
      movement:"wander",
      speed:1,
      scale:1,
      thoughts:true,
      thoughtFrequency:"normal"
    };
  }

  function normalizeCharacterWorld(raw){
    const d=characterWorldDefaults();
    const s=raw&&typeof raw==="object"?raw:{};
    const floorIds=hotelRegion().floors.map(f=>f.id);
    return {
      visible:s.visible!==false,
      image:String(s.image||"").trim(),
      floor:s.floor==="auto"||floorIds.includes(s.floor)?s.floor:"auto",
      movement:["still","calm","wander","active"].includes(s.movement)?s.movement:d.movement,
      speed:Math.max(.45,Math.min(1.8,Number(s.speed)||d.speed)),
      scale:Math.max(.6,Math.min(1.55,Number(s.scale)||d.scale)),
      thoughts:s.thoughts!==false,
      thoughtFrequency:["rare","normal","often"].includes(s.thoughtFrequency)?s.thoughtFrequency:d.thoughtFrequency
    };
  }

  function hotelDefaults(){
    return {
      animation:true,
      neon:true,
      particles:true,
      decorativeGuests:true,
      autoResidents:true,
      maxActors:8,
      motionSpeed:1,
      residentIds:[],
      floorNames:{},
      characterWorld:{}
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
    return {
      animation:s.animation!==false,
      neon:s.neon!==false,
      particles:s.particles!==false,
      decorativeGuests:s.decorativeGuests!==false,
      autoResidents:s.autoResidents!==false,
      maxActors:Math.max(1,Math.min(12,Number(s.maxActors)||d.maxActors)),
      motionSpeed:Math.max(.5,Math.min(1.8,Number(s.motionSpeed)||d.motionSpeed)),
      residentIds:Array.isArray(s.residentIds)?[...new Set(s.residentIds.map(String))]:[],
      floorNames:s.floorNames&&typeof s.floorNames==="object"?{...s.floorNames}:{},
      characterWorld
    };
  }

  function characterWorldSettings(character,settings){
    return normalizeCharacterWorld(settings.characterWorld?.[character.id]);
  }
  function readHotelSettings(){
    try{
      return normalizeHotelSettings(JSON.parse(localStorage.getItem(WORLD_STORAGE_KEY)||"{}"));
    }catch{
      return hotelDefaults();
    }
  }

  function saveHotelSettings(settings){
    localStorage.setItem(WORLD_STORAGE_KEY,JSON.stringify(normalizeHotelSettings(settings)));
  }

  function stableNumber(value){
    const text=String(value||"");
    let n=0;
    for(let i=0;i<text.length;i++)n=(n*31+text.charCodeAt(i))>>>0;
    return n;
  }

  function currentHotelResidents(settings){
    const chars=enabledCharacters().filter(c=>characterWorldSettings(c,settings).visible);
    const chosen=settings.autoResidents
      ? chars
      : chars.filter(c=>settings.residentIds.includes(c.id));
    return chosen.slice(0,settings.maxActors);
  }

  function actorFloorIndex(character,settings){
    const cfg=characterWorldSettings(character,settings);
    const floors=hotelRegion().floors;
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
        '<span class="hotel-staircase"></span><span class="hotel-piano"></span><span class="hotel-piano-seat"></span>'+
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
    const left=8+(key%72);
    const duration=(11+(key%7)*1.25)/(settings.motionSpeed*cfg.speed);
    const delay=-((key%90)/10);
    const initials=(character.name||"?").slice(0,2).toUpperCase();
    const image=cfg.image||character.image||"";
    const art=image
      ? '<img src="'+esc(image)+'" alt="" />'
      : '<span class="hotel-actor-fallback">'+esc(initials)+'</span>';
    return '<div class="hotel-actor move-'+esc(cfg.movement)+' actor-'+(index%4)+'" title="'+esc(character.name)+'" '+
      'style="--actor-left:'+left+'%;--actor-duration:'+duration+'s;--actor-delay:'+delay+'s;--actor-scale:'+cfg.scale+'" '+
      'data-character-id="'+esc(character.id)+'">'+
      art+'<small>'+esc(character.name)+'</small></div>';
  }
  function decorativeActorMarkup(index,settings){
    const duration=(12+index*1.8)/settings.motionSpeed;
    return '<div class="hotel-actor hotel-guest guest-'+index+'" aria-hidden="true" style="--actor-left:'+(14+index*23)+'%;--actor-duration:'+duration+'s;--actor-delay:-'+(index*2.4)+'s"><span class="hotel-actor-fallback">◆</span></div>';
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
        '<span>'+esc(floor.number)+'</span><strong>'+esc(floorDisplayName(floor,settings))+'</strong><small>VIEW</small>'+
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
        '<div class="hotel-elevator"><span></span><span></span><b></b><em></em></div>'+
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
      '<div class="hotel-arrow-sign left" aria-hidden="true"><i></i><b>➜</b></div><div class="hotel-arrow-sign right" aria-hidden="true"><i></i><b>➜</b></div>'+
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
    const residents=currentHotelResidents(settings);
    const classes=[
      "world-hotel-page",
      settings.animation?"":"motion-off",
      settings.neon?"":"neon-off",
      settings.particles?"":"particles-off"
    ].join(" ");
    const floors=region.floors.map((floor,index)=>renderHotelFloor(floor,index,residents,settings)).join("");
    const residentsText=settings.autoResidents
      ? "AUTO · "+residents.length+" VISIBLE"
      : "SELECTED · "+residents.length+" VISIBLE";

    pageRoot.innerHTML=
      '<section class="'+classes+'" style="--hotel-ambient-duration:'+(7/settings.motionSpeed)+'s">'+
        '<header class="world-hotel-head">'+
          '<div><p class="page-kicker">WORLD · 01</p><h1>'+esc(region.name)+'</h1><p>'+esc(region.subtitle)+'</p></div>'+
          '<div class="world-hotel-actions"><div class="hotel-status"><i></i><span>HOTEL OPEN</span><small>'+esc(residentsText)+'</small></div>'+
          '<button class="ghost-button" type="button" data-action="hotel-settings">HOTEL SETTINGS</button></div>'+
        '</header>'+
        '<div class="hotel-scene-shell">'+
          '<div class="hotel-sky" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span><span></span></div>'+
          '<div class="hotel-city-silhouette" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>'+
          '<div class="hotel-ground-glow" aria-hidden="true"></div>'+
          '<div class="hotel-street-foreground" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>'+
          '<div class="hotel-building">'+
            hotelCrown()+hotelFacadeDecor()+
            '<div class="hotel-cutaway">'+floors+'</div>'+
          '</div>'+
          '<aside class="hotel-scene-note"><span>CUTAWAY VIEW</span><strong>층을 눌러 공간을 확인하세요.</strong><small>현재는 호텔만 구현되어 있으며 다른 지역은 같은 WORLD 구조에 추가됩니다.</small></aside>'+
        '</div>'+
      '</section>';
    scheduleWorldThoughts();
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
            saveState();
          }
          showWorldThought(selected.actor,thought,discovered);
        }
      }
      scheduleWorldThoughts();
    },6500+Math.random()*4500);
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
      '<p class="muted">이 층의 실제 업무/재화 기능은 다음 단계에서 붙일 수 있도록 화면과 데이터 구조만 분리해 두었습니다.</p></div>'
    );
    renderWorld();
  }

  function characterWorldEditor(character,settings){
    const cfg=characterWorldSettings(character,settings);
    const baseImage=character.image||"";
    const preview=cfg.image||baseImage;
    const initials=(character.name||"?").slice(0,2).toUpperCase();
    const thoughts=worldThoughtPool(character.id);
    const floorOptions=['<option value="auto" '+(cfg.floor==="auto"?"selected":"")+'>AUTO · 자동 배치</option>']
      .concat(hotelRegion().floors.map(f=>'<option value="'+esc(f.id)+'" '+(cfg.floor===f.id?"selected":"")+'>'+esc(f.number+" · "+f.name)+'</option>')).join("");
    return '<details class="hotel-character-world-card" data-world-character-card="'+esc(character.id)+'">'+
      '<summary>'+
        '<div class="hotel-world-char-thumb">'+
          (preview?'<img src="'+esc(preview)+'" alt="" data-world-summary-image />':'<span>'+esc(initials)+'</span>')+
        '</div>'+
        '<div class="hotel-world-char-title"><strong>'+esc(character.name)+'</strong><small>'+esc(originLabel(character.origin))+' · '+thoughts.length+' THOUGHTS</small></div>'+
        '<span class="hotel-world-char-state">'+(cfg.visible?"VISIBLE":"HIDDEN")+'</span>'+
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
          '<label class="checkline"><input type="checkbox" data-world-field="visible" '+(cfg.visible?"checked":"")+' /> 호텔에서 표시</label>'+
          '<label class="checkline"><input type="checkbox" data-hotel-resident="'+esc(character.id)+'" '+(settings.residentIds.includes(character.id)?"checked":"")+' /> AUTO OFF일 때 수동 목록에 포함</label>'+
          '<label class="field full"><span>WORLD 전용 이미지 URL</span><input type="url" data-world-field="image" data-world-image value="'+esc(cfg.image)+'" placeholder="https://.../character.png" /></label>'+
          '<label class="field"><span>선호 층</span><select data-world-field="floor">'+floorOptions+'</select></label>'+
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

  function openHotelSettings(){
    const settings=readHotelSettings();
    const chars=enabledCharacters();
    const floorInputs=hotelRegion().floors.map(f=>
      '<label class="field"><span>'+esc(f.number)+' · '+esc(f.name)+'</span><input type="text" data-hotel-floor-name="'+esc(f.id)+'" value="'+esc(floorDisplayName(f,settings))+'" /></label>'
    ).join("");
    const characterEditors=chars.length
      ? '<div class="hotel-world-character-list">'+chars.map(c=>characterWorldEditor(c,settings)).join("")+'</div>'
      : '<p class="editor-note">아직 등록된 캐릭터가 없습니다. 캐릭터를 추가하면 여기에서 WORLD 전용 모습을 따로 설정할 수 있습니다.</p>';

    modalRoot.innerHTML=
      '<div class="modal-backdrop" data-close-modal><section class="modal-card hotel-settings-modal" role="dialog" aria-modal="true">'+
        '<button class="modal-close" type="button" data-close-modal>×</button>'+
        '<p class="label">WORLD MANAGEMENT</p><h2>HOTEL SETTINGS</h2>'+
        '<form id="hotelSettingsForm">'+
          '<div class="hotel-setting-grid">'+
            '<label class="checkline"><input type="checkbox" name="animation" '+(settings.animation?"checked":"")+' /> 캐릭터/배경 애니메이션</label>'+
            '<label class="checkline"><input type="checkbox" name="neon" '+(settings.neon?"checked":"")+' /> 네온 조명 효과</label>'+
            '<label class="checkline"><input type="checkbox" name="particles" '+(settings.particles?"checked":"")+' /> 공기 입자/불빛 효과</label>'+
            '<label class="checkline"><input type="checkbox" name="decorativeGuests" '+(settings.decorativeGuests?"checked":"")+' /> 빈 층에 장식 실루엣 표시</label>'+
            '<label class="checkline full"><input type="checkbox" name="autoResidents" '+(settings.autoResidents?"checked":"")+' /> 등록 캐릭터를 자동으로 호텔에 표시</label>'+
            '<label class="field"><span>한 화면 최대 캐릭터</span><input type="number" name="maxActors" min="1" max="12" value="'+settings.maxActors+'" /></label>'+
            '<label class="field"><span>전체 움직임 속도 · 0.5 ~ 1.8</span><input type="number" name="motionSpeed" min=".5" max="1.8" step=".1" value="'+settings.motionSpeed+'" /></label>'+
          '</div>'+
          '<section class="hotel-settings-block hotel-character-world-settings">'+
            '<div class="hotel-settings-block-head"><div><span>CHARACTER WORLD SETTINGS</span><strong>캐릭터별 호텔 표시</strong></div><small>기존 캐릭터 설정과 별도로 저장</small></div>'+
            '<p class="hotel-settings-help">캐릭터를 눌러 WORLD 전용 이미지, 위치, 움직임과 THOUGHT 연출을 설정하세요. 여기서 넣은 이미지는 HOME/대화 화면의 캐릭터 이미지를 바꾸지 않습니다.</p>'+
            characterEditors+
          '</section>'+
          '<section class="hotel-settings-block"><div class="hotel-settings-block-head"><div><span>FLOORS</span><strong>층 이름</strong></div><small>표시명만 변경</small></div><div class="hotel-floor-name-grid">'+floorInputs+'</div></section>'+
          '<div class="hotel-settings-actions"><button class="danger-button" type="button" data-action="hotel-settings-reset">RESET</button><span></span><button class="ghost-button" type="button" data-close-modal>취소</button><button class="gold-button" type="button" data-action="hotel-settings-save">저장</button></div>'+
        '</form>'+
      '</section></div>';
  }
  function collectHotelSettings(){
    const form=$("#hotelSettingsForm",modalRoot);
    if(!form)return readHotelSettings();
    const next=hotelDefaults();
    next.animation=form.elements.animation.checked;
    next.neon=form.elements.neon.checked;
    next.particles=form.elements.particles.checked;
    next.decorativeGuests=form.elements.decorativeGuests.checked;
    next.autoResidents=form.elements.autoResidents.checked;
    next.maxActors=Number(form.elements.maxActors.value);
    next.motionSpeed=Number(form.elements.motionSpeed.value);
    next.residentIds=$$("[data-hotel-resident]:checked",form).map(x=>x.dataset.hotelResident);
    next.floorNames={};
    $$("[data-hotel-floor-name]",form).forEach(input=>{
      next.floorNames[input.dataset.hotelFloorName]=input.value.trim();
    });
    next.characterWorld={};
    $$("[data-world-character-card]",form).forEach(card=>{
      const id=card.dataset.worldCharacterCard;
      const field=name=>$('[data-world-field="'+name+'"]',card);
      next.characterWorld[id]=normalizeCharacterWorld({
        visible:field("visible")?.checked,
        image:field("image")?.value||"",
        floor:field("floor")?.value||"auto",
        movement:field("movement")?.value||"wander",
        speed:field("speed")?.value,
        scale:field("scale")?.value,
        thoughts:field("thoughts")?.checked,
        thoughtFrequency:field("thoughtFrequency")?.value||"normal"
      });
    });
    return normalizeHotelSettings(next);
  }
  pageRoot.addEventListener("click",event=>{
    const button=event.target.closest("[data-action]");
    if(!button)return;
    const action=button.dataset.action;
    if(action==="hotel-settings"){
      openHotelSettings();
    }else if(action==="hotel-floor-info"){
      openHotelFloorInfo(button.dataset.floor);
    }
  });

  modalRoot.addEventListener("input",event=>{
    const input=event.target.closest("[data-world-image]");
    if(!input)return;
    const card=input.closest("[data-world-character-card]");
    if(!card)return;
    const character=getCharacter(card.dataset.worldCharacterCard);
    const fallback=character?.image||"";
    const src=input.value.trim()||fallback;
    const img=$("[data-world-preview-img]",card);
    const empty=$("[data-world-preview-fallback]",card);
    if(img){
      if(src){img.src=src;img.hidden=false}else{img.removeAttribute("src");img.hidden=true}
    }
    if(empty)empty.hidden=Boolean(src);
  });

  modalRoot.addEventListener("click",event=>{
    const button=event.target.closest("[data-action]");
    if(!button)return;
    if(button.dataset.action==="hotel-settings-save"){
      saveHotelSettings(collectHotelSettings());
      closeModal();
      renderWorld();
      showToast("HOTEL SETTINGS SAVED");
    }else if(button.dataset.action==="hotel-settings-reset"){
      localStorage.removeItem(WORLD_STORAGE_KEY);
      closeModal();
      renderWorld();
      showToast("HOTEL SETTINGS RESET");
    }
  });
})();
