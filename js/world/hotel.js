"use strict";

(() => {
  const WORLD_STORAGE_KEY = "hellaverse-world-settings-v1";
  const WORLD_CONFIG = window.HV_WORLD_CONFIG || {regions:[]};
  let focusedHotelFloor = "lobby";

  function hotelRegion(){
    return WORLD_CONFIG.regions.find(r=>r.id==="hotel") || {
      id:"hotel",
      name:"HAZBIN HOTEL",
      subtitle:"PRIDE RING",
      floors:[]
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
      floorNames:{}
    };
  }

  function normalizeHotelSettings(raw){
    const d=hotelDefaults();
    const s=raw && typeof raw==="object" ? raw : {};
    return {
      animation:s.animation!==false,
      neon:s.neon!==false,
      particles:s.particles!==false,
      decorativeGuests:s.decorativeGuests!==false,
      autoResidents:s.autoResidents!==false,
      maxActors:Math.max(1,Math.min(12,Number(s.maxActors)||d.maxActors)),
      motionSpeed:Math.max(.5,Math.min(1.8,Number(s.motionSpeed)||d.motionSpeed)),
      residentIds:Array.isArray(s.residentIds)?[...new Set(s.residentIds.map(String))]:[],
      floorNames:s.floorNames&&typeof s.floorNames==="object"?{...s.floorNames}:{}
    };
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
    const chars=enabledCharacters();
    const chosen=settings.autoResidents
      ? chars
      : chars.filter(c=>settings.residentIds.includes(c.id));
    return chosen.slice(0,settings.maxActors);
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
        '<span class="hotel-sofa"></span><span class="hotel-sidechair"></span><span class="hotel-table"></span><span class="hotel-lamp"></span>'+
        '<span class="hotel-frame">♡</span><span class="hotel-rug"></span><span class="hotel-plant"></span>'+
      '</div>';
    }
    if(id==="suites"){
      return '<div class="hotel-props suites-props" aria-hidden="true">'+
        '<span class="hotel-roomdoor"></span><span class="hotel-roomdoor second"></span><span class="hotel-roomdoor third"></span>'+
        '<span class="hotel-runner"></span><span class="hotel-sconce one">♥</span><span class="hotel-sconce two">♥</span>'+
        '<span class="hotel-side-table"></span><span class="hotel-vase">◆</span>'+
      '</div>';
    }
    return '<div class="hotel-props penthouse-props" aria-hidden="true">'+
      '<span class="hotel-throne"></span><span class="hotel-window"></span><span class="hotel-desk"></span><span class="hotel-apple">◆</span>'+
      '<span class="hotel-books"></span><span class="hotel-telescope"></span><span class="hotel-penthouse-lamp"></span>'+
    '</div>';
  }

  function actorMarkup(character,index,floorIndex,settings){
    const key=stableNumber(character.id||character.name||index);
    const left=8+(key%72);
    const duration=(11+(key%7)*1.25)/settings.motionSpeed;
    const delay=-((key%90)/10);
    const initials=(character.name||"?").slice(0,2).toUpperCase();
    const art=character.image
      ? '<img src="'+esc(character.image)+'" alt="" />'
      : '<span class="hotel-actor-fallback">'+esc(initials)+'</span>';
    return '<div class="hotel-actor actor-'+(index%4)+'" title="'+esc(character.name)+'" style="--actor-left:'+left+'%;--actor-duration:'+duration+'s;--actor-delay:'+delay+'s" data-character-id="'+esc(character.id)+'">'+
      art+'<small>'+esc(character.name)+'</small></div>';
  }

  function decorativeActorMarkup(index,settings){
    const duration=(12+index*1.8)/settings.motionSpeed;
    return '<div class="hotel-actor hotel-guest guest-'+index+'" aria-hidden="true" style="--actor-left:'+(14+index*23)+'%;--actor-duration:'+duration+'s;--actor-delay:-'+(index*2.4)+'s"><span class="hotel-actor-fallback">◆</span></div>';
  }

  function renderHotelFloor(floor,index,residents,settings){
    const assigned=residents.filter(c=>(stableNumber(c.id)%hotelRegion().floors.length)===index);
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
        '<div class="hotel-wall-filigree left"></div><div class="hotel-wall-filigree right"></div>'+
        '<div class="hotel-room room-left"></div><div class="hotel-room room-center"></div><div class="hotel-room room-right"></div>'+
        '<div class="hotel-column-set"><i></i><i></i><i></i><i></i></div>'+
        '<div class="hotel-balcony-rail"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>'+
        '<div class="hotel-elevator"><span></span><span></span></div>'+
        hotelPropMarkup(floor.id)+
        '<div class="hotel-actors">'+actors+'</div>'+
      '</div>'+
    '</section>';
  }

  function hotelCrown(){
    return '<div class="hotel-crown" aria-hidden="true">'+
      '<div class="hotel-rays"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>'+
      '<div class="hotel-crown-wing left"><i></i><i></i><i></i></div><div class="hotel-crown-wing right"><i></i><i></i><i></i></div>'+
      '<div class="hotel-sign"><b>HAZBIN</b><span>HOTEL</span><em></em></div>'+
      '<div class="hotel-eye"><i></i></div>'+
      '<div class="hotel-horns left"></div><div class="hotel-horns right"></div>'+
      '<div class="hotel-marquee-bulbs"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>'+
    '</div>';
  }

  function hotelFacadeDecor(){
    return '<div class="hotel-side-decor left" aria-hidden="true"><i>♥</i><i>♦</i><i>♣</i></div>'+
      '<div class="hotel-side-decor right" aria-hidden="true"><i></i><i></i><i></i></div>'+
      '<div class="hotel-outer-tower left" aria-hidden="true"><b>♥</b><i></i><i></i><i></i></div>'+
      '<div class="hotel-outer-tower right" aria-hidden="true"><b>♥</b><i></i><i></i><i></i></div>'+
      '<div class="hotel-roof-fin left" aria-hidden="true"></div><div class="hotel-roof-fin right" aria-hidden="true"></div>'+
      '<div class="hotel-vertical-sign" aria-hidden="true"><span>H</span><span>O</span><span>T</span><span>E</span><span>L</span></div>'+
      '<div class="hotel-entrance-marquee" aria-hidden="true"><i></i><b>♥</b><i></i></div>'+
      '<div class="hotel-music-line" aria-hidden="true">♪ · ♫ · ♪ · ♫</div>';
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
  };

  function openHotelFloorInfo(floorId){
    const settings=readHotelSettings();
    const floor=hotelRegion().floors.find(x=>x.id===floorId);
    if(!floor)return;
    focusedHotelFloor=floor.id;
    const residents=currentHotelResidents(settings).filter(c=>(stableNumber(c.id)%hotelRegion().floors.length)===hotelRegion().floors.indexOf(floor));
    openModal(
      floorDisplayName(floor,settings),
      '<div class="hotel-floor-modal"><p>'+esc(floor.description)+'</p>'+
      '<div><span>현재 표시 캐릭터</span><strong>'+(residents.length?residents.map(c=>esc(c.name)).join(" · "):"없음")+'</strong></div>'+
      '<p class="muted">이 층의 실제 업무/재화 기능은 다음 단계에서 붙일 수 있도록 화면과 데이터 구조만 분리해 두었습니다.</p></div>'
    );
    renderWorld();
  }

  function openHotelSettings(){
    const settings=readHotelSettings();
    const chars=enabledCharacters();
    const floorInputs=hotelRegion().floors.map(f=>
      '<label class="field"><span>'+esc(f.number)+' · '+esc(f.name)+'</span><input type="text" data-hotel-floor-name="'+esc(f.id)+'" value="'+esc(floorDisplayName(f,settings))+'" /></label>'
    ).join("");
    const residents=chars.length
      ? '<div class="hotel-resident-grid">'+chars.map(c=>
          '<label class="hotel-resident-choice"><input type="checkbox" data-hotel-resident="'+esc(c.id)+'" '+(settings.residentIds.includes(c.id)?"checked":"")+' /><span>'+esc(c.name)+'</span><small>'+esc(originLabel(c.origin))+'</small></label>'
        ).join("")+'</div>'
      : '<p class="editor-note">아직 등록된 캐릭터가 없습니다. 캐릭터가 추가되면 여기서 호텔 등장 여부를 고를 수 있습니다.</p>';

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
            '<label class="field"><span>움직임 속도 · 0.5 ~ 1.8</span><input type="number" name="motionSpeed" min=".5" max="1.8" step=".1" value="'+settings.motionSpeed+'" /></label>'+
          '</div>'+
          '<section class="hotel-settings-block"><div class="hotel-settings-block-head"><div><span>RESIDENTS</span><strong>호텔 등장 캐릭터</strong></div><small>AUTO를 끄면 아래 선택만 사용</small></div>'+residents+'</section>'+
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
