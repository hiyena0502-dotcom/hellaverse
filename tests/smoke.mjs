import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";

const root=new URL("../",import.meta.url);
const read=path=>fs.readFileSync(new URL(path,root),"utf8");

const jsFiles=[
  "data/story-packs.js",
  "data/character-events.js",
  "data/relationship-content.js",
  "data/solo-talks.js",
  "data/item-presets.js",
  "data/dialogue-presets.js",
  "js/core/state.js",
  "js/core/game-state.js",
  "js/ui/app-shell.js",
  "js/world/hotel.js",
  "js/world/regions.js",
  "js/game/dialogue.js",
  "js/editor/editor-ui.js",
  "js/editor/editor-events.js"
];

for(const path of jsFiles){
  const code=read(path);
  assert.doesNotThrow(()=>new Function(code),path+" must parse");
}

const index=read("index.html");
for(const id of ["brandButton","dataButton","editorButton","changeProfileButton","editorOverlay","editorBody","startImportButton","saveStatus","updateBanner"]){
  assert.match(index,new RegExp('id="'+id+'"'),"missing #"+id);
}
assert.match(index,/class="nav-button[^"]*"[^>]*data-page="home"/,"HOME nav missing");
const build=index.match(/<meta name="hellaverse-build" content="([^"]+)"/i)?.[1];
assert.ok(build,"build metadata missing");
const assetRefs=[...index.matchAll(/(?:href|src)="((?:css|js|data)\/[^"]+)"/g)].map(match=>match[1]);
assert.ok(assetRefs.length>=10,"versioned local assets missing");
assetRefs.forEach(asset=>assert.equal(new URL(asset,"https://example.test/").searchParams.get("v"),build,asset+" cache version must match build "+build));

const editorEvents=read("js/editor/editor-events.js");
const stateCode=read("js/core/state.js");
const appShell=read("js/ui/app-shell.js");
const editorUi=read("js/editor/editor-ui.js");
const dialogueCode=read("js/game/dialogue.js");
const gameStateCode=read("js/core/game-state.js");
const storyPackCode=read("data/story-packs.js");
const characterEventCode=read("data/character-events.js");
const relationshipCode=read("data/relationship-content.js");
const soloTalkCode=read("data/solo-talks.js");
const itemPresetCode=read("data/item-presets.js");
const dialoguePresetCode=read("data/dialogue-presets.js");
const dialogueCss=read("css/dialogue.css");
const featuresCss=read("css/features.css");

assert.ok(!editorEvents.includes('$(".nav-button").forEach'),"nav must use querySelectorAll/$$, not single $ helper");
assert.match(editorEvents,/document\.querySelectorAll\("\.nav-button"\)\.forEach/,"nav click delegation missing");
assert.match(stateCode,/STORAGE_DB_NAME/,"IndexedDB storage constants missing");
assert.match(stateCode,/function bootstrapStorage\(/,"IndexedDB bootstrap missing");
assert.match(stateCode,/function saveProgressState\(/,"progress-only persistence missing");
assert.match(stateCode,/function mergeEditorDraftIntoLiveState\(/,"editor/live progress merge missing");
assert.match(stateCode,/function flushStorageWrites\(/,"durable write flush missing");
assert.match(appShell,/function showImportPreview\(/,"import preview missing");
assert.match(appShell,/function recoverUiFromError\(/,"UI recovery boundary missing");
assert.match(appShell,/function checkForAppUpdate\(/,"update detection missing");
assert.match(editorUi,/function renderSelectedItemEditor\(/,"single-detail ITEM editor missing");
assert.match(editorUi,/data-action="select-ask"/,"single-detail ASK selection missing");
assert.match(editorUi,/data-action="select-thought"/,"single-detail THOUGHT selection missing");
assert.match(editorUi,/CONTINUATION/,"continuation editor missing");
assert.match(editorUi,/data-action="add-continuation"/,"continuation add action missing");
assert.match(editorUi,/data-action="move-continuation"/,"continuation move action missing");
assert.match(editorEvents,/a==="remove-continuation"/,"continuation remove action missing");
assert.match(stateCode,/function migrateStateV3ToV4\(/,"schema v4 continuation migration missing");
assert.match(editorEvents,/data-action="validation-jump"/,"validation issue navigation missing");
assert.match(read("js/world/regions.js"),/currentPage!=="world"\|\|activeRegion!==regionId/,"WORLD timer must stop outside WORLD");
assert.match(stateCode,/function installStoryPacks\(/,"one-time story pack installer missing");
assert.match(itemPresetCode,/HV_APPLY_ITEM_PRESETS/,"item preset installer missing");
assert.match(itemPresetCode,/FIRST|firstEntries/,"gift FIRST preset flow missing");
assert.match(itemPresetCode,/repeatEntries/,"gift REPEAT preset flow missing");
assert.match(itemPresetCode,/specialEntries/,"gift SPECIAL preset flow missing");
assert.match(itemPresetCode,/HV_BUILD_ITEM_REACTION/,"runtime gift reaction builder missing");
assert.match(itemPresetCode,/RELATION_TASTES/,"relationship-aware gift preferences missing");
assert.match(dialoguePresetCode,/HV_APPLY_DIALOGUE_PRESETS/,"dialogue detail preset installer missing");
assert.match(dialoguePresetCode,/hasItemGrant/,"reward TALK migration missing");
assert.match(dialoguePresetCode,/seenTalkSignatures/,"duplicate TALK rotation guard missing");
assert.match(stateCode,/randomEligible:e\.randomEligible!==false/,"random TALK eligibility persistence missing");
assert.match(dialogueCode,/ev\.randomEligible!==false/,"random TALK eligibility filter missing");
assert.match(editorUi,/event-random-eligible/,"random TALK eligibility editor control missing");
assert.match(index,/data\/relationship-content\.js/,"relationship content script missing from build");
assert.match(index,/data\/solo-talks\.js/,"solo TALK content script missing from build");

const soloTalkContext={window:{HV_STORY_PACKS:[]}};
vm.runInNewContext(soloTalkCode,soloTalkContext);
const soloTalkPacks=soloTalkContext.window.HV_STORY_PACKS||[];
assert.equal(soloTalkPacks.length,35,"solo TALK packs must cover all 35 characters");
assert.equal(soloTalkPacks.reduce((sum,pack)=>sum+(pack.events||[]).length,0),1820,"solo TALK must add 52 events per character");
const soloEventIds=new Set();
for(const pack of soloTalkPacks){
  const characterId=pack.requiredCharacterIds?.[0]||"";
  assert.equal((pack.events||[]).length,52,pack.id+" must provide more than 50 solo TALK events");
  for(const event of pack.events||[]){
    assert.equal(event.characterId,characterId,event.id+" must stay in its selected character room");
    assert.ok(!soloEventIds.has(event.id),event.id+" must be globally unique");
    soloEventIds.add(event.id);
    for(const entry of event.entries||[]){
      if(entry.type!=="dialogue"||!entry.speakerCharacterId)continue;
      assert.equal(entry.speakerCharacterId,characterId,event.id+" must not switch to another character speaker");
    }
  }
}

const relationshipContext={window:{}};
vm.runInNewContext(relationshipCode,relationshipContext);
const relationshipPacks=relationshipContext.window.HV_STORY_PACKS||[];
assert.equal(relationshipPacks.length,35,"relationship packs must cover all 35 characters");
assert.equal(relationshipPacks.reduce((sum,pack)=>sum+(pack.asks||[]).length,0),70,"relationship ASK must add two tiers per character");
assert.equal(relationshipPacks.reduce((sum,pack)=>sum+(pack.events||[]).length,0),66,"relationship TALK must add three scenes for 22 under-served characters");
for(const pack of relationshipPacks){
  assert.equal((pack.asks||[]).length,2,pack.id+" must have mid/deep relationship ASK");
  assert.equal(pack.version,3,pack.id+" relationship voice pack must be on tuning version 3");
  const [mid,deep]=pack.asks;
  assert.equal(mid.unlockMinAffection,35,pack.id+" mid ASK affection gate mismatch");
  assert.equal(deep.unlockMinAffection,70,pack.id+" deep ASK affection gate mismatch");
  assert.equal(deep.unlockAskCondition?.askId,mid.id,pack.id+" deep ASK must require the mid ASK");
}
const relationPack=id=>relationshipPacks.find(pack=>pack.id==="relationship-"+id);
const dialogueTexts=event=>(event?.entries||[]).filter(entry=>entry.type==="dialogue").map(entry=>entry.text||"");
assert.ok(dialogueTexts(relationPack("velvette")?.events?.[0]).some(text=>/알고리즘|피드/.test(text)),"Velvette needs influencer/SNS queen diction");
assert.ok(dialogueTexts(relationPack("valentino")?.events?.[0]).some(text=>/플로리다|병신|씨발/.test(text)),"Valentino needs rough Florida-rooted diction");
assert.ok(dialogueTexts(relationPack("cherri-bomb")?.events?.[2]).some(text=>/엔젤|숨기고 싶지/.test(text)),"Cherri high-affection TALK must reveal personal feelings");
assert.ok(dialogueTexts(relationPack("fizzarolli")?.events?.[2]).some(text=>/쓸모없|조용히/.test(text)),"Fizz high-affection TALK must drop the performer mask");
assert.ok(dialogueTexts(relationPack("stolas")?.events?.[2]).some(text=>/옥타비아|블리츠/.test(text)),"Stolas high-affection TALK must reveal private worries");
assert.ok(dialogueTexts(relationPack("octavia")?.events?.[2]).some(text=>/부모님|싸우/.test(text)),"Octavia high-affection TALK must reveal family worries");
assert.ok(dialogueTexts(relationPack("blitzo")?.events?.[0]).some(text=>/씨발|야한/.test(text)),"Blitzo TALK needs rude, crude humor");
assert.ok((relationPack("angel-dust")?.asks||[]).some(ask=>(ask.entries||[]).some(entry=>/야한 농담|그냥 나/.test(entry.text||""))),"Angel ASK needs flirt-mask vulnerability");
assert.ok((relationPack("adam")?.asks||[]).some(ask=>(ask.entries||[]).some(entry=>/씨발|좆같/.test(entry.text||""))),"Adam ASK needs crude ego-driven diction");
const octaviaAdultGuard=[
  ...(relationPack("octavia")?.events||[]).flatMap(dialogueTexts),
  ...(relationPack("octavia")?.asks||[]).flatMap(ask=>(ask.entries||[]).map(entry=>entry.text||""))
].join(" ");
assert.ok(!/섹스|키스|침대|야한|흥분|꼬시/.test(octaviaAdultGuard),"Octavia dialogue must remain non-sexual");

const itemPresetContext={window:{}};
vm.runInNewContext(itemPresetCode,itemPresetContext);
for(const pack of relationshipPacks){
  const characterId=pack.requiredCharacterIds?.[0]||"";
  const reaction=itemPresetContext.window.HV_BUILD_ITEM_REACTION(
    {id:"smoke-gift",name:"테스트 선물",rarity:"RARE",collectionCharacterId:characterId},
    {id:characterId,name:characterId}
  );
  assert.ok(reaction.firstEntries?.length,characterId+" gift FIRST flow missing");
  assert.ok(reaction.repeatEntries?.length,characterId+" gift REPEAT flow missing");
  assert.ok(reaction.specialEntries?.length,characterId+" gift SPECIAL flow missing");
}
assert.match(editorUi,/DIALOGUE_EVENT_GROUPS/,"dialogue event taxonomy missing");
for(const role of ["talk","entry","exit","story"])assert.match(editorUi,new RegExp('id:"'+role+'"'),role.toUpperCase()+" dialogue category missing");
assert.match(editorUi,/AUTO REACTIONS/,"automatic gift reaction preview missing");
assert.match(editorUi,/data-item-bind="inventoryEventId"/,"dialogue item acquisition selector missing");
assert.match(editorUi,/data-itemfx-field="once"/,"one-time item effect control missing");
assert.match(gameStateCode,/e\.menuVisible!==false/,"hidden continuation events must stay out of TALK menus");
assert.match(dialogueCode,/function updateRoomSpeakerVisual\(/,"per-line speaker art switching missing");
assert.match(dialogueCode,/function nextContinuousEvent\(/,"continuous TALK fallback missing");
assert.match(dialogueCode,/function randomTalkEvent\(/,"random TALK picker missing");
assert.match(dialogueCode,/randomTalkForCharacter\(ch\.id\)/,"room entry must use character-scoped recent-aware random TALK");
assert.match(dialogueCode,/const candidates=playableTalkEventsForCharacter\(roomCharacterId\)/,"continuous random TALK must stay inside the selected character room");
assert.match(dialogueCode,/function rememberRecentTalk\(/,"recent TALK memory missing");
assert.match(dialogueCode,/function markTalkDiscovered\(/,"TALK discovery tracker missing");
assert.match(dialogueCode,/function shuffleTalk\(/,"NEW TALK shuffle action missing");
assert.match(dialogueCode,/function relationshipProgress\(/,"relationship discovery progress missing");
assert.match(dialogueCode,/data-action="inventory-preview"/,"gift list must preview before giving");
assert.match(dialogueCode,/data-action="give-item"/,"gift preview confirmation action missing");
assert.match(dialogueCode,/function giftNeedsConfirmation\(/,"rare or last consumable confirmation missing");
assert.match(dialogueCode,/function renderInteractionCompleteMenu\(/,"post-interaction next-action panel missing");
assert.ok(!/roomSpeakerName[^\n]*textContent=character\.name/.test(dialogueCode),"room owner title must not change with guest speakers");
assert.match(gameStateCode,/if\(meta\.consume\)consumeInventoryItem/,"gift consumption must commit only after reaction completion");
assert.ok(!/function beginInteractionReaction[\s\S]*?applyInteractionEffects\(source\)/.test(gameStateCode),"interaction rewards must not commit before reaction completion");
assert.match(stateCode,/discoveredTalkIds/,"TALK discovery persistence missing");
assert.match(stateCode,/discoveredSpecialGiftKeys/,"special gift discovery persistence missing");
assert.match(editorUi,/data-ask-bind="repeatable"/,"ASK repeatable editor control missing");
assert.match(editorUi,/data-ask-bind="unlockHint"/,"ASK unlock hint editor control missing");
assert.match(editorEvents,/a==="interaction-after"/,"post-interaction action handler missing");
assert.match(editorEvents,/a==="inventory-preview"/,"gift preview click handler missing");
assert.match(featuresCss,/\.ask-list,.inventory-list\{[\s\S]*?overflow:auto/,"ASK and inventory lists must scroll inside the room");
assert.match(featuresCss,/\.inventory-filter-bar\{/,"gift search and filter toolbar missing");
assert.match(featuresCss,/\.inventory-preview-card\{/,"gift preview card styling missing");
assert.match(dialogueCode,/function dialogueTextNeedsScroll\(/,"long dialogue overflow guard missing");
assert.match(dialogueCode,/ASK\/선물 반응을 끝까지 본 뒤 이동할 수 있습니다/,"interaction exit guard missing");
assert.match(dialogueCode,/FALLBACK_EXIT_LINES/,"character-specific fallback EXIT lines missing");
assert.match(dialogueCode,/class="room-event-details"/,"TALK picker must be tucked into a collapsible control");
assert.match(appShell,/classList\.toggle\("room-active",currentPage==="room"\)/,"room viewport lock class missing");
assert.match(editorEvents,/beginRoomExit\("profile"\)/,"PROFILE must leave through EXIT dialogue");
assert.match(dialogueCode,/function beginRoomExit\(/,"room EXIT flow missing");
assert.match(editorEvents,/a==="back-home"\)\{beginRoomExit\("home"\)\}/,"HOME exit must play room EXIT dialogue");
assert.match(gameStateCode,/function exitEventsForCharacter\(/,"EXIT events must be separated from TALK menus");
assert.match(stateCode,/function isExitEvent\(/,"EXIT event role compatibility missing");
assert.match(stateCode,/function isEntryEvent\(/,"ENTRY event role compatibility missing");
assert.match(gameStateCode,/function entryEventsForCharacter\(/,"ENTRY event helper missing");
assert.match(dialogueCode,/playableEntryEventsForCharacter\(ch\.id\)/,"room entry must prefer ENTRY events once");
assert.match(dialogueCode,/eventRoleOf\(ev\)===["']talk["']/,"ENTRY/ACTION/STORY events must stay out of continuous TALK");
assert.match(characterEventCode,/id:"baxter"/,"Baxter voice event pack missing");
assert.match(characterEventCode,/id:"emily"/,"Emily voice event pack missing");
assert.match(characterEventCode,/id:"lute"/,"Lute voice event pack missing");
assert.match(characterEventCode,/id:"adam"/,"Adam voice event pack missing");
assert.match(characterEventCode,/id:"vox"/,"Vox voice event pack missing");
assert.match(characterEventCode,/id:"pentious"/,"Sir Pentious voice event pack missing");
assert.ok(!dialogueCode.includes("이벤트가 끝났습니다."),"terminal event-ended screen must be removed");
assert.match(editorUi,/data-entry-field="speakerCharacterId"/,"speaker image selector missing from event editor");
assert.match(editorEvents,/data-action="validation-jump"/,"validation issue navigation missing");
assert.match(read("js/world/regions.js"),/currentPage!=="world"\|\|activeRegion!==regionId/,"WORLD timer must stop outside WORLD");
assert.match(read("js/world/hotel.js"),/actorLabels:\["hover","always","hidden"\]/,"hotel actor label modes missing");
assert.match(read("js/world/hotel.js"),/worldRegionSettings\(settings,"hotel"\)\.showWork/,"hotel work dock must use shared region visibility settings");
assert.match(read("js/world/hotel.js"),/if\(!currentSettings\.globalThoughts\)return/,"global hotel THOUGHT switch missing");
assert.match(read("js/world/hotel.js"),/WORLD MAP SETTINGS/,"shared WORLD MAP SETTINGS title missing");
assert.match(read("js/world/hotel.js"),/data-hotel-settings-tab="background"/,"WORLD background settings tab missing");
assert.match(read("js/world/hotel.js"),/data-hotel-settings-tab="positions"/,"WORLD character position tab missing");
assert.match(read("js/world/hotel.js"),/data-world-region-settings/,"per-region background settings missing");
assert.match(read("js/world/hotel.js"),/data-world-position-axis/,"per-region character coordinates missing");
assert.match(read("js/world/hotel.js"),/regionIds:WORLD_CONFIG\.regions\.map/,"character WORLD regions must default to every region");
assert.match(read("js/world/hotel.js"),/function characterAllowedInRegion\(/,"character region access helper missing");
assert.match(read("js/world/hotel.js"),/data-world-character-region=/,"character region checklist missing");
assert.match(read("js/world/hotel.js"),/data-preset="hotel"/,"hotel-only character shortcut missing");
assert.match(read("js/world/hotel.js"),/data-preset="imp-office"/,"I.M.P-only character shortcut missing");
assert.match(read("js/world/regions.js"),/cfg\.regionIds\.includes\(regionId\)/,"scene residents must respect character region access");
assert.match(read("js/world/regions.js"),/data-action="world-settings"/,"WORLD settings must be available outside the hotel");
assert.ok(!read("js/world/hotel.js").includes('data-action="hotel-settings-reset"'),"hotel settings must not expose immediate destructive reset");
assert.match(read("css/world.css"),/\.hotel-settings-workspace\{[\s\S]*?grid-template-columns:205px minmax\(0,1fr\)/,"desktop hotel settings workspace missing");
assert.match(read("css/world.css"),/@media\(max-width:820px\)[\s\S]*?\.hotel-settings-tabs\{[\s\S]*?flex-direction:row/ ,"mobile hotel settings tabs missing");
assert.match(read("js/world/regions.js"),/data-world-step="-1"/,"WORLD previous-region control missing");
assert.match(read("js/world/regions.js"),/aria-current="page"/,"active WORLD region must expose its current state");
assert.match(read("js/world/regions.js"),/class="world-map-viewport"/,"WORLD scenes need an isolated horizontal viewport");
assert.match(read("js/world/hotel.js"),/world-map-viewport-hotel/,"hotel needs the shared mobile map viewport");
assert.match(read("css/world-regions.css"),/\.world-region-switcher\{/,"shared WORLD region switcher styling missing");
assert.match(read("css/world-regions.css"),/scroll-snap-type:x proximity/,"mobile WORLD rails need touch scroll snapping");
assert.match(read("css/world-regions.css"),/@media\(max-width:700px\)[\s\S]*?\.world-map-mobile-hint\{display:flex\}/,"mobile WORLD pan guidance missing");
assert.match(dialogueCss,/#roomDynamic\{[\s\S]*?position:absolute;[\s\S]*?left:50%;[\s\S]*?bottom:54px;/,"room dialogue anchor must stay pinned to lower center");
assert.match(dialogueCss,/\.dialogue-box\{[\s\S]*?height:190px;[\s\S]*?grid-template-rows:/,"desktop dialogue box height must stay stable");
assert.match(dialogueCss,/\.site-shell\.room-active\{[\s\S]*?height:100dvh;[\s\S]*?overflow:hidden/,"room shell must stay inside the viewport");
assert.match(dialogueCss,/\.site-shell\.room-active>\.game-hud\{grid-row:1\}/,"room header grid row must be explicit");
assert.match(dialogueCss,/\.site-shell\.room-active>\.update-banner\{grid-row:2\}/,"room update banner grid row must be explicit");
assert.match(dialogueCss,/\.site-shell\.room-active>\.page-root\{[\s\S]*?grid-row:3;/,"room page root must stay in the flexible third grid row even when update banner is hidden");
assert.match(dialogueCss,/\.dialogue-text\.is-compact/,"long dialogue compact typography missing");
assert.match(dialogueCss,/\.room-event-details select\{[\s\S]*?position:absolute/,"desktop TALK picker should not shift the HUD");

const worldAccessStorage=new Map();
const worldAccessContext={
  console,
  Date,
  Math,
  JSON,
  Set,
  setTimeout,
  clearTimeout,
  requestAnimationFrame(){},
  window:{HV_WORLD_CONFIG:{regions:[
    {id:"hotel",name:"HAZBIN HOTEL",floors:[{id:"lobby",name:"LOBBY"}],activities:[]},
    {id:"heaven",name:"HEAVEN"},
    {id:"imp-office",name:"I.M.P OFFICE"}
  ]}},
  pageRoot:{addEventListener(){}},
  modalRoot:{addEventListener(){}},
  document:{body:{classList:{add(){},remove(){}}}},
  localStorage:{
    getItem(key){return worldAccessStorage.get(key)||null},
    setItem(key,value){worldAccessStorage.set(key,String(value))}
  }
};
worldAccessContext.window.window=worldAccessContext.window;
vm.createContext(worldAccessContext);
vm.runInContext(read("js/world/hotel.js"),worldAccessContext,{filename:"js/world/hotel.js"});
const worldAccess=vm.runInContext(`
(()=>{
  const character={id:"char-a",name:"A"};
  const legacy={characterWorld:{"char-a":{visible:true}}};
  const hotelOnly={characterWorld:{"char-a":{visible:true,regionIds:["hotel"]}}};
  const hidden={characterWorld:{"char-a":{visible:false,regionIds:["hotel","imp-office"]}}};
  return {
    legacyHotel:window.HV_WORLD_SETTINGS.allows(character,legacy,"hotel"),
    legacyOffice:window.HV_WORLD_SETTINGS.allows(character,legacy,"imp-office"),
    hotelOnlyHotel:window.HV_WORLD_SETTINGS.allows(character,hotelOnly,"hotel"),
    hotelOnlyOffice:window.HV_WORLD_SETTINGS.allows(character,hotelOnly,"imp-office"),
    hiddenHotel:window.HV_WORLD_SETTINGS.allows(character,hidden,"hotel")
  };
})()
`,worldAccessContext);
assert.deepEqual({...worldAccess},{
  legacyHotel:true,
  legacyOffice:true,
  hotelOnlyHotel:true,
  hotelOnlyOffice:false,
  hiddenHotel:false
},"character WORLD region access or legacy migration is incorrect");

const storage=new Map();
const dummy=()=>({
  hidden:false,
  style:{},
  classList:{toggle(){},add(){},remove(){}},
  addEventListener(){},
  querySelector(){return null},
  querySelectorAll(){return[]}
});
const context={
  console,
  Date,
  Math,
  JSON,
  Map,
  Set,
  Blob,
  structuredClone,
  setTimeout,
  clearTimeout,
  window:{HV_DEFAULT_CONTENT:{}},
  document:{
    querySelector(){return dummy()},
    querySelectorAll(){return[]},
    createElement(){return dummy()},
    body:dummy()
  },
  localStorage:{
    getItem(key){return storage.has(key)?storage.get(key):null},
    setItem(key,value){storage.set(key,String(value))},
    removeItem(key){storage.delete(key)}
  }
};
context.window.window=context.window;
vm.createContext(context);
vm.runInContext(storyPackCode,context,{filename:"data/story-packs.js"});
vm.runInContext(characterEventCode,context,{filename:"data/character-events.js"});
vm.runInContext(itemPresetCode,context,{filename:"data/item-presets.js"});
vm.runInContext(dialoguePresetCode,context,{filename:"data/dialogue-presets.js"});
vm.runInContext(stateCode,context,{filename:"js/core/state.js"});

const storyPackInstall=vm.runInContext(`
(()=>{
  const required=["lucifer-morningstar","charlie-morningstar","vaggie","alastor","angel-dust","husk","niffty","baxter"];
  const source=normalizeState({
    schemaVersion:4,
    characters:required.map(id=>({id,name:id,origin:"hellborn",image:"https://example.test/"+id+".png"}))
  });
  const first=installStoryPacks(source);
  const compact=compactStateForStorage(first.state);
  const second=installStoryPacks(first.state);
  const opening=first.state.events.find(event=>event.id==="hotel-welcome-01-emergency-meeting");
  const hidden=first.state.events.find(event=>event.id==="hotel-welcome-02-duck-choir");
  const luciferLine=hidden.entries.find(entry=>entry.speakerCharacterId==="lucifer-morningstar");
  const packedLine=compact.events.find(event=>event.id===hidden.id).entries.find(entry=>entry.id===luciferLine.id);
  return{
    changed:first.changed,
    eventCount:first.state.events.length,
    variableCount:first.state.variables.length,
    packVersion:first.state.storyPackVersions["hotel-ensemble-comedy"],
    openingVisible:opening.menuVisible,
    hiddenVisible:hidden.menuVisible,
    speakerCharacterId:packedLine.speakerCharacterId,
    secondChanged:second.changed
  };
})()
`,context);
assert.equal(storyPackInstall.changed,true,"eligible project must receive story pack");
assert.equal(storyPackInstall.eventCount,51,"hotel pack plus seven matching character packs should install 51 events");
assert.equal(storyPackInstall.variableCount,39,"story and character event variables must install together");
assert.equal(storyPackInstall.packVersion,3,"story pack version marker missing");
assert.equal(storyPackInstall.openingVisible,true,"opening event must be visible");
assert.equal(storyPackInstall.hiddenVisible,false,"continuation event must be hidden");
assert.equal(storyPackInstall.speakerCharacterId,"lucifer-morningstar","speaker image id must survive compaction");
assert.equal(storyPackInstall.secondChanged,false,"story pack must install only once");

const itemPresetCheck=vm.runInContext(`
(()=>{
  const source=normalizeState({
    schemaVersion:4,
    characters:[{id:"lucifer-morningstar",name:"Lucifer Morningstar",origin:"hellborn"}],
    items:[{
      id:"lucifer-mug-test",
      name:"“최고의 아빠” 머그컵",
      rarity:"EPIC",
      collectionCharacterId:"lucifer-morningstar",
      giftable:true,
      gachaEnabled:true,
      weight:1,
      reactions:[{
        id:"placeholder",
        characterId:"lucifer-morningstar",
        preference:"NEUTRAL",
        affectionDelta:1,
        firstEntries:[],
        repeatEntries:[],
        specialEntries:[]
      }]
    }]
  });
  const installed=installStoryPacks(source);
  const item=installed.state.items[0];
  const reaction=item.reactions.find(r=>r.characterId==="lucifer-morningstar");
  return{
    weight:item.weight,
    preference:reaction.preference,
    affectionDelta:reaction.affectionDelta,
    emotionState:reaction.emotionState,
    first:reaction.firstEntries.map(e=>e.text),
    repeat:reaction.repeatEntries.map(e=>e.text),
    special:reaction.specialEntries.map(e=>e.text),
    specialMinAffection:reaction.specialMinAffection,
    itemPresetVersion:installed.state.itemPresetVersion
  };
})()
`,context);
assert.equal(itemPresetCheck.weight,.78,"explicit per-item gacha weight must be applied");
assert.equal(itemPresetCheck.preference,"LOVED","Lucifer mug preference must be populated in CHARACTER REACTIONS");
assert.equal(itemPresetCheck.affectionDelta,5,"gift preference affection value must be populated");
assert.equal(itemPresetCheck.emotionState,"embarrassed","gift emotion preset must be populated");
assert.ok(itemPresetCheck.first.some(line=>/최고의 아빠/.test(line)),"FIRST GIFT dialogue must be item-specific");
assert.ok(itemPresetCheck.repeat.length>0,"REPEAT GIFT flow must be populated");
assert.ok(itemPresetCheck.special.length>0,"SPECIAL gift flow must be populated");
assert.ok(itemPresetCheck.specialMinAffection>0,"SPECIAL affection rule must be populated");
assert.equal(itemPresetCheck.itemPresetVersion,6,"item preset version marker missing");

const itemPresetRepairCheck=vm.runInContext(`
(()=>{
  const source=normalizeState({
    schemaVersion:4,
    itemPresetVersion:3,
    characters:[{id:"lucifer-morningstar",name:"Lucifer Morningstar",origin:"hellborn"}],
    items:[{
      id:"lucifer-letter-test",
      name:"찰리에게 보내려다 만 편지",
      rarity:"EPIC",
      collectionCharacterId:"lucifer-morningstar",
      giftable:true,
      gachaEnabled:true,
      weight:.77,
      reactions:[{
        id:"blank-reaction",
        characterId:"lucifer-morningstar",
        preference:"LIKED",
        affectionDelta:3,
        firstEntries:[],
        repeatEntries:[],
        specialEntries:[]
      }]
    }]
  });
  const installed=installStoryPacks(source);
  const reaction=installed.state.items[0].reactions[0];
  return{
    changed:installed.changed,
    weight:installed.state.items[0].weight,
    first:reaction.firstEntries.length,
    repeat:reaction.repeatEntries.length,
    special:reaction.specialEntries.length
  };
})()
`,context);
assert.equal(itemPresetRepairCheck.changed,true,"blank CHARACTER REACTIONS must repair even when preset version is current");
assert.equal(itemPresetRepairCheck.weight,.77,"repair-only pass must preserve a user-edited current-version gacha weight");
assert.ok(itemPresetRepairCheck.first>0,"blank FIRST GIFT flow must repair");
assert.ok(itemPresetRepairCheck.repeat>0,"blank REPEAT GIFT flow must repair");
assert.ok(itemPresetRepairCheck.special>0,"blank SPECIAL flow must repair");

const generatedGiftReaction=vm.runInContext(`
(()=>{
  const item=normalizeItem({id:"gift-headphones",name:"검정 헤드폰",rarity:"RARE",collectionCharacterId:"charlie-morningstar",giftable:true});
  const character=normalizeCharacter({id:"loona",name:"Loona",origin:"hellborn"});
  const reaction=normalizeItemReaction(window.HV_BUILD_ITEM_REACTION(item,character),character.id);
  return{
    characterId:reaction.characterId,
    preference:reaction.preference,
    affectionDelta:reaction.affectionDelta,
    emotionState:reaction.emotionState,
    firstText:reaction.firstEntries.find(entry=>entry.type==="dialogue")?.text||"",
    repeatText:reaction.repeatEntries.find(entry=>entry.type==="dialogue")?.text||"",
    specialText:reaction.specialEntries.find(entry=>entry.type==="dialogue")?.text||""
  };
})()
`,context);
assert.equal(generatedGiftReaction.characterId,"loona","generated gift reaction must target the selected character");
assert.equal(generatedGiftReaction.preference,"LOVED","character taste must influence generated preference");
assert.ok(generatedGiftReaction.affectionDelta>0,"generated gift reaction must include affection");
assert.ok(generatedGiftReaction.emotionState,"generated gift reaction must include emotion");
assert.match(generatedGiftReaction.firstText,/헤드폰/,"generated FIRST gift line must name the item");
assert.ok(generatedGiftReaction.repeatText&&generatedGiftReaction.specialText,"generated repeat and special lines must exist");
const allCharacterGiftCoverage=vm.runInContext(`
(()=>{
  const ids=["lucifer-morningstar","charlie-morningstar","sera","lute","adam","vaggie","alastor","vox","niffty","angel-dust","husk","blitzo","paimon","satan","mammon","asmodeus","beelzebub","belphegor","leviathan","sir-pentious","cherri-bomb","velvette","valentino","carmilla-carmine","rosie","abel","emily","baxter","zestial","stolas","loona","moxxie","millie","fizzarolli","octavia"];
  const item=normalizeItem({id:"coverage-gift",name:"작은 별 장식",rarity:"COMMON",collectionCharacterId:"lucifer-morningstar",giftable:true});
  return ids.map(id=>{
    const reaction=normalizeItemReaction(window.HV_BUILD_ITEM_REACTION(item,{id,name:id}),id);
    return [id,reaction.firstEntries.some(entry=>entry.type==="dialogue"&&entry.text),reaction.repeatEntries.some(entry=>entry.type==="dialogue"&&entry.text),reaction.specialEntries.some(entry=>entry.type==="dialogue"&&entry.text)];
  });
})()
`,context);
assert.equal(allCharacterGiftCoverage.length,35,"gift reaction coverage must include all 35 existing characters");
assert.ok(allCharacterGiftCoverage.every(([,first,repeat,special])=>first&&repeat&&special),"every character needs FIRST, REPEAT, and SPECIAL gift dialogue");

const dialoguePresetCheck=vm.runInContext(`
(()=>{
  const source=normalizeState({
    schemaVersion:4,
    characters:[{id:"loona",name:"Loona",origin:"hellborn"}],
    events:[
      {id:"hidden-link",name:"연계 장면",characterId:"loona",menuVisible:false,entries:[{id:"hidden-line",type:"dialogue",text:"hidden"}]},
      {id:"voice-loona-test",name:"TALK · 이어폰",characterId:"loona",entries:[
        {id:"setup",type:"narration",text:"루나가 이어폰을 고쳐 쓴다."},
        {id:"player",type:"dialogue",speaker:"PLAYER",text:"새 음악 어때?"},
        {id:"reply",type:"dialogue",speakerCharacterId:"loona",speaker:"Loona",text:"나쁘지 않아."}
      ]}
    ],
    items:[{id:"loona-coffee",name:"진한 커피",rarity:"COMMON",collectionCharacterId:"loona",giftable:true}]
  });
  const installed=window.HV_APPLY_DIALOGUE_PRESETS(source,{normalizeEntry,normalizeEvent,normalizeVariable,normalizeItemEffects});
  const event=installed.state.events.find(candidate=>candidate.id==="voice-loona-test");
  const owners=[];walkStateEntries(event.entries,owner=>owners.push(owner));
  const reward=owners.flatMap(owner=>owner.itemEffects||[]).find(effect=>effect.itemId==="loona-coffee");
  return{
    hiddenRole:installed.state.events.find(candidate=>candidate.id==="hidden-link").eventRole,
    variableCount:installed.state.variables.length,
    variableEffect:owners.some(owner=>(owner.effects||[]).some(effect=>effect.variableId.startsWith("seen_voice_loona_test"))),
    affection:owners.some(owner=>(owner.affectionEffects||[]).some(effect=>effect.characterId==="loona"&&effect.amount===1)),
    emotion:owners.some(owner=>(owner.emotionEffects||[]).some(effect=>effect.characterId==="loona")),
    rewardOnce:reward?.once,
    linkedEvent:installed.state.items[0].inventoryEventId
  };
})()
`,context);
assert.equal(dialoguePresetCheck.hiddenRole,"story","hidden continuation events must migrate to STORY");
assert.ok(dialoguePresetCheck.variableCount>0&&dialoguePresetCheck.variableEffect,"voice event must gain a seen variable effect");
assert.equal(dialoguePresetCheck.affection,true,"voice event must gain an affection effect");
assert.equal(dialoguePresetCheck.emotion,true,"voice event must gain a closing emotion effect");
assert.equal(dialoguePresetCheck.rewardOnce,true,"dialogue item reward must be one-time");
assert.equal(dialoguePresetCheck.linkedEvent,"voice-loona-test","item must remember its acquisition event");

const legacyDialogueLocalizationCheck=vm.runInContext(`
(()=>{
  const source=normalizeState({
    schemaVersion:4,
    dialoguePresetVersion:4,
    characters:[
      {id:"lute",name:"Lute",origin:"angel"},
      {id:"charlie-morningstar",name:"Charlie Morningstar",origin:"hellborn"}
    ],
    events:[{
      id:"legacy-english-line",
      name:"TALK · grief",
      characterId:"lute",
      entries:[
        {id:"line-1",type:"dialogue",speakerCharacterId:"lute",text:"Adam is dead. 그 사실 이후로 내겐 이 싸움이 명령 이상의 것이 됐어."},
        {id:"line-2",type:"dialogue",speakerCharacterId:"charlie-morningstar",text:"Charlie. Stop. Breathe."}
      ]
    }],
    asks:[{
      id:"legacy-english-ask",
      characterId:"charlie-morningstar",
      label:"테스트",
      entries:[{id:"ask-line",type:"dialogue",speakerCharacterId:"charlie-morningstar",text:"ASK FIRST!"}]
    }],
    items:[{
      id:"legacy-gift",
      name:"카드",
      collectionCharacterId:"charlie-morningstar",
      giftable:true,
      reactions:[{
        characterId:"charlie-morningstar",
        preference:"NEUTRAL",
        firstEntries:[{id:"gift-line",type:"dialogue",speakerCharacterId:"charlie-morningstar",text:"YES! 그렇지!"}],
        repeatEntries:[],
        specialEntries:[]
      }]
    }],
    playState:{variables:{},affection:{},emotions:{},recentTalks:{},log:[
      {kind:"dialogue",speaker:"Lute",text:"Adam is dead.",eventName:""}
    ]}
  });
  const result=window.HV_APPLY_DIALOGUE_PRESETS(source,{normalizeEntry,normalizeEvent,normalizeVariable,normalizeItemEffects}).state;
  return{
    eventLines:result.events[0].entries.map(entry=>entry.text),
    askLine:result.asks[0].entries[0].text,
    giftLine:result.items[0].reactions[0].firstEntries[0].text,
    logLine:result.playState.log[0].text,
    version:result.dialoguePresetVersion
  };
})()
`,context);
assert.ok(legacyDialogueLocalizationCheck.eventLines[0].startsWith("아담은 죽었어."),"legacy English character dialogue must be localized");
assert.equal(legacyDialogueLocalizationCheck.eventLines[1],"찰리. 멈춰. 숨 쉬어.","mixed legacy English dialogue must be localized");
assert.equal(legacyDialogueLocalizationCheck.askLine,"먼저 물어봐!","legacy ASK English text must be localized");
assert.equal(legacyDialogueLocalizationCheck.giftLine,"좋아! 그렇지!","legacy gift English text must be localized");
assert.equal(legacyDialogueLocalizationCheck.logLine,"아담은 죽었어.","saved dialogue history must be localized");
assert.equal(legacyDialogueLocalizationCheck.version,7,"dialogue tuning migration version missing");

const storyPackCountBeforeTuning=context.window.HV_STORY_PACKS.length;
context.window.HV_STORY_PACKS.push(...structuredClone(relationshipPacks));
const tunedDialogueSyncCheck=vm.runInContext(`
(()=>{
  const fresh=(window.HV_STORY_PACKS||[]).find(pack=>pack.id==="relationship-velvette");
  const eventId=fresh.events[0].id;
  const askId=fresh.asks[0].id;
  const source=normalizeState({
    schemaVersion:4,
    dialoguePresetVersion:6,
    characters:[{id:"velvette",name:"Velvette",origin:"sinner"}],
    events:[{id:eventId,name:"OLD",characterId:"velvette",eventRole:"talk",menuVisible:true,entries:[{id:"old",type:"dialogue",speakerCharacterId:"velvette",text:"예전 대사"}]}],
    asks:[{id:askId,characterId:"velvette",label:"OLD",entries:[{id:"old-ask",type:"dialogue",speakerCharacterId:"velvette",text:"예전 질문"}],enabled:true}]
  });
  const result=window.HV_APPLY_DIALOGUE_PRESETS(source,{normalizeEntry,normalizeEvent,normalizeVariable,normalizeItemEffects}).state;
  return{
    eventText:result.events[0].entries.map(entry=>entry.text||"").join(" "),
    askText:result.asks[0].entries.map(entry=>entry.text||"").join(" "),
    version:result.dialoguePresetVersion
  };
})()
`,context);
assert.match(tunedDialogueSyncCheck.eventText,/알고리즘|피드/,"existing saves must receive tuned relationship TALK");
assert.ok(!/예전 질문/.test(tunedDialogueSyncCheck.askText),"existing saves must receive tuned relationship ASK");
assert.equal(tunedDialogueSyncCheck.version,7,"tuned dialogue sync must advance preset version");
context.window.HV_STORY_PACKS.length=storyPackCountBeforeTuning;

assert.match(characterEventCode,/id:"angel".*?threshold:60.*?유료 서비스/s,"Angel base TALK tuning missing");
assert.match(characterEventCode,/id:"adam".*?threshold:62.*?흥분만 시켜놓고 끝나는 밤/s,"Adam base TALK tuning missing");
assert.match(itemPresetCode,/플로리다 싸구려 모텔 자판기/,"Valentino gift voice tuning missing");
assert.match(itemPresetCode,/알고리즘이 나한테 개인적으로 사과/,"Velvette gift voice tuning missing");

vm.runInContext(gameStateCode,context,{filename:"js/core/game-state.js"});
const oneTimeReward=vm.runInContext(`
(()=>{
  state=normalizeState({
    schemaVersion:4,
    characters:[{id:"reward-char",name:"Reward",origin:"hellborn"}],
    items:[{id:"reward-item",name:"Token",rarity:"COMMON",collectionCharacterId:"reward-char",giftable:true}],
    claimedItemEffectIds:[]
  });
  session=createSession();
  showItemAcquired=()=>{};
  saveProgressState=()=>{};
  const effect={id:"reward-once",itemId:"reward-item",amount:1,once:true};
  applyItemEffects([effect]);
  applyItemEffects([effect]);
  return{count:itemCount("reward-item"),claims:[...state.claimedItemEffectIds]};
})()
`,context);
assert.equal(oneTimeReward.count,1,"one-time dialogue reward must not duplicate on replay");
assert.deepEqual([...oneTimeReward.claims],["reward-once"],"one-time reward claim must persist");

const aliasPackInstall=vm.runInContext(`
(()=>{
  const source=normalizeState({
    schemaVersion:4,
    characters:[{id:"custom-vox-id",name:"Vox",origin:"sinner"}]
  });
  const installed=installStoryPacks(source);
  const voxEvents=installed.state.events.filter(event=>event.id.startsWith("voice-vox-"));
  return{
    installed:installed.installed.includes("voice-events-vox"),
    count:voxEvents.length,
    characterIds:[...new Set(voxEvents.map(event=>event.characterId))]
  };
})()
`,context);
assert.equal(aliasPackInstall.installed,true,"character event packs must resolve aliases by character name");
assert.equal(aliasPackInstall.count,4,"Vox should receive four added TALK events");
assert.deepEqual([...aliasPackInstall.characterIds],["custom-vox-id"],"resolved character aliases must rewrite event character IDs");

const entryRoleCheck=vm.runInContext(`
(()=>{
  const normalized=normalizeState({
    schemaVersion:4,
    characters:[{id:"entry-char",name:"Entry Char",origin:"sinner"}],
    events:[
      {id:"entry-one",name:"ENTRY · Entry 1",characterId:"entry-char",entries:[{id:"e1",type:"dialogue",text:"hello"}]},
      {id:"talk-one",name:"TALK · Normal",characterId:"entry-char",entries:[{id:"t1",type:"dialogue",text:"talk"}]}
    ]
  });
  return{
    entryRole:normalized.events.find(event=>event.id==="entry-one").eventRole,
    entryVisible:normalized.events.find(event=>event.id==="entry-one").menuVisible,
    talkIds:normalized.events.filter(event=>event.characterId==="entry-char"&&event.menuVisible!==false&&!isExitEvent(event)&&!isEntryEvent(event)).map(event=>event.id)
  };
})()
`,context);
assert.equal(entryRoleCheck.entryRole,"entry","ENTRY name must normalize to entry role");
assert.equal(entryRoleCheck.entryVisible,false,"ENTRY must be hidden from TALK menus");
assert.deepEqual([...entryRoleCheck.talkIds],["talk-one"],"ENTRY must not remain in normal TALK candidates");



const result=vm.runInContext(`
(()=>{
  const source=defaultState();
  source.characters=Array.from({length:35},(_,i)=>({
    id:"char-"+i,name:"Character "+i,origin:"hellborn",enabled:true
  }));
  source.events=Array.from({length:1000},(_,i)=>({
    id:"event-"+i,name:"Event "+i,characterId:"char-"+(i%35),
    entries:[{id:"entry-"+i,type:"dialogue",speaker:"C",text:"line "+i}]
  }));
  source.asks=Array.from({length:500},(_,i)=>({
    id:"ask-"+i,characterId:"char-"+(i%35),label:"Ask "+i,
    entries:[{id:"ask-entry-"+i,type:"dialogue",speaker:"C",text:"answer "+i}]
  }));
  source.items=Array.from({length:300},(_,i)=>({
    id:"item-"+i,name:"Item "+i,collectionCharacterId:"char-"+(i%35),
    rarity:"COMMON",category:"기타",giftable:false,reactions:[]
  }));
  source.thoughts=Array.from({length:500},(_,i)=>({
    id:"thought-"+i,characterId:"char-"+(i%35),category:"일상",
    rarity:"COMMON",frequency:"normal",text:"Thought "+i,enabled:true
  }));
  source.playState={variables:{flag:true},affection:{"char-0":42},emotions:{},log:[]};
  source.discoveredTalkIds=["event-1","event-2"];
  source.discoveredSpecialGiftKeys=["item-1::char-1"];
  const normalized=normalizeState(source);
  const compact=compactStateForStorage(normalized);
  const progress=progressStateFrom(normalized);
  const migrated=normalizeState({schemaVersion:2,characters:source.characters,items:[{
    id:"old-item",name:"Old",collectionCharacterId:"char-0",rarity:"COMMON",category:"기타"
  }]});
  const askShape=normalizeAsk({
    id:"ask-repeat",characterId:"char-0",label:"Repeat?",repeatable:true,unlockHint:"친해지면 열릴 것 같다"
  });
  const packedAsk=compactAskForStorage(askShape);
  const legacyNext=normalizeState({
    schemaVersion:3,
    characters:[{id:"char-x",name:"X",origin:"hellborn"}],
    events:[
      {id:"event-a",name:"A",characterId:"char-x",nextEventId:"event-b",entries:[]},
      {id:"event-b",name:"B",characterId:"char-x",entries:[]}
    ]
  });
  return{
    schema:normalized.schemaVersion,
    counts:[normalized.events.length,normalized.asks.length,normalized.items.length,normalized.thoughts.length],
    fullChars:JSON.stringify(compact).length,
    progressChars:JSON.stringify(progress).length,
    migratedGiftable:migrated.items[0].giftable,
    migratedContinuation:legacyNext.events[0].continuationEventIds,
    askRepeatable:packedAsk.repeatable,
    askHint:packedAsk.unlockHint,
    talkDiscovery:[...progress.discoveredTalkIds],
    specialDiscovery:[...progress.discoveredSpecialGiftKeys]
  };
})()
`,context);

assert.equal(result.schema,4,"current schema must be 4");
assert.deepEqual([...result.counts],[1000,500,300,500],"large fixture counts changed during normalization");
assert.equal(result.migratedGiftable,true,"v2 -> v3 item migration must default giftable=true");
assert.deepEqual([...result.migratedContinuation],["event-b"],"v3 nextEventId must migrate to v4 continuationEventIds");
assert.equal(result.askRepeatable,true,"ASK repeatable flag must survive compaction");
assert.equal(result.askHint,"친해지면 열릴 것 같다","ASK unlock hint must survive compaction");
assert.deepEqual([...result.talkDiscovery],["event-1","event-2"],"TALK discovery must persist in progress payload");
assert.deepEqual([...result.specialDiscovery],["item-1::char-1"],"special gift discovery must persist in progress payload");
assert.ok(result.progressChars<result.fullChars*0.1,
  `progress payload should be <10% of project payload (full=${result.fullChars}, progress=${result.progressChars})`);

const editorMerge=vm.runInContext(`
(()=>{
  const opened=normalizeState({
    schemaVersion:4,
    profile:{name:"Player",origin:"hellborn"},
    characters:[{id:"char-a",name:"Before",origin:"hellborn"}],
    variables:[{id:"var-a",name:"Flag",type:"boolean",defaultValue:false}],
    items:[{id:"item-a",name:"Token",category:"기타",rarity:"COMMON",collectionCharacterId:"char-a"}],
    gacha:{balance:100}
  });
  const baseline=progressStateFrom(opened);
  const draft=clone(opened);
  draft.characters[0].name="Edited";
  const live=clone(opened);
  live.gacha.balance=148;
  live.inventoryCounts={"item-a":3};
  live.playState.affection={"char-a":27};
  const merged=mergeEditorDraftIntoLiveState(live,draft,baseline);
  const explicitDraft=clone(draft);
  explicitDraft.gacha.balance=777;
  const explicit=mergeEditorDraftIntoLiveState(live,explicitDraft,baseline);
  return{
    characterName:merged.characters[0].name,
    balance:merged.gacha.balance,
    itemCount:merged.inventoryCounts["item-a"],
    affection:merged.playState.affection["char-a"],
    explicitBalance:explicit.gacha.balance
  };
})()
`,context);
assert.equal(editorMerge.characterName,"Edited","editor content change must be applied");
assert.equal(editorMerge.balance,148,"live WORLD reward must survive editor save");
assert.equal(editorMerge.itemCount,3,"live inventory progress must survive editor save");
assert.equal(editorMerge.affection,27,"live affection progress must survive editor save");
assert.equal(editorMerge.explicitBalance,777,"explicit editor balance change must be applied");


vm.runInContext(`
function getEvent(id){return state.events.find(e=>e.id===id)||null}
function getCharacter(id){return state.characters.find(c=>c.id===id)||null}
function eventsForCharacter(charId,source=state){return source.events.filter(e=>e.characterId===charId&&e.menuVisible!==false&&!isExitEvent(e)&&!isEntryEvent(e))}
function entryEventsForCharacter(charId,source=state){return source.events.filter(e=>e.characterId===charId&&isEntryEvent(e))}
function exitEventsForCharacter(charId,source=state){return source.events.filter(e=>e.characterId===charId&&isExitEvent(e))}
function ownerPasses(){return true}
function resetEventEmotion(){}
function clearTyping(){}
function clearAuto(){}
function restoreInterruptedDialogue(){return false}
function completeInteraction(){}
function setPage(page){currentPage=page}
function renderStart(){currentPage="profile"}
function renderRoom(){}
function renderNav(){}
function showToast(text){lastToast=text}
`,context);
vm.runInContext(dialogueCode,context,{filename:"js/game/dialogue.js"});
vm.runInContext(`renderRoom=()=>{};renderNav=()=>{};`,context);
const entryFlowCheck=vm.runInContext(`
(()=>{
  state=normalizeState({
    schemaVersion:4,
    characters:[{id:"entry-room",name:"Entry Room",origin:"sinner"}],
    events:[
      {id:"entry-room-intro",name:"ENTRY · Hello",characterId:"entry-room",entries:[{id:"eri",type:"dialogue",text:"entry"}]},
      {id:"entry-room-talk-a",name:"TALK · A",characterId:"entry-room",entries:[{id:"erta",type:"dialogue",text:"a"}]},
      {id:"entry-room-talk-b",name:"TALK · B",characterId:"entry-room",entries:[{id:"ertb",type:"dialogue",text:"b"}]}
    ]
  });
  session={variables:{},affection:{},emotions:{},log:[],recentTalks:{}};
  currentPage="characters";
  selectedCharacterId="";
  startDialogue("entry-room");
  const first={id:playback.eventId,label:playback.frames[0].label};
  playback.frames[0].index=1;
  finishEvent();
  const second=playback.eventId;
  const nextIds=[];
  for(let i=0;i<4;i++){
    playback.frames[0].index=frameEntries(playback.frames[0]).length;
    finishEvent();
    nextIds.push(playback.eventId);
  }
  return{first,second,nextIds};
})()
`,context);
assert.equal(entryFlowCheck.first.id,"entry-room-intro","entering a room must start with ENTRY when available");
assert.equal(entryFlowCheck.first.label,"ENTRY","room ENTRY must be labeled ENTRY");
assert.ok(["entry-room-talk-a","entry-room-talk-b"].includes(entryFlowCheck.second),"ENTRY completion must continue into normal TALK");
assert.ok(entryFlowCheck.nextIds.every(id=>id!=="entry-room-intro"),"ENTRY must never reappear during the same room session");
const continuationOrder=vm.runInContext(`
(()=>{
  state=normalizeState({
    schemaVersion:4,
    characters:[{id:"char-series",name:"Series",origin:"hellborn"}],
    events:[
      {id:"A",name:"A",characterId:"char-series",continuationEventIds:["B","C","D"],entries:[]},
      {id:"B",name:"B",characterId:"char-series",entries:[]},
      {id:"C",name:"C",characterId:"char-series",entries:[]},
      {id:"D",name:"D",characterId:"char-series",entries:[]}
    ]
  });
  playback={
    characterId:"char-series",
    eventId:"A",
    continuationQueue:["B","C","D"],
    continuationTotal:3,
    frames:[{sourceType:"event",sourceId:"A",index:0,label:"본편",exitMode:"continue",targetEventId:""}],
    ended:false
  };
  activeInteractionEvent=null;
  interactionContext=null;
  typing={token:"",full:"",index:0,done:true,timer:null};
  const order=[playback.eventId];
  while(finishEvent()){
    order.push(playback.eventId);
    if(order.length>10)throw new Error("continuation loop");
  }
  return order;
})()
`,context);
assert.deepEqual([...continuationOrder],["A","B","C","D"],"continuation runtime order must be A -> B -> C -> D");

const continuousFlow=vm.runInContext(`
(()=>{
  state=normalizeState({
    schemaVersion:4,
    characters:[
      {id:"char-a",name:"A",origin:"hellborn"},
      {id:"char-b",name:"B",origin:"hellborn"}
    ],
    events:[
      {id:"talk-a1",name:"A1",characterId:"char-a",entries:[{id:"a1",type:"dialogue",text:"a1"}]},
      {id:"talk-a2",name:"A2",characterId:"char-a",entries:[{id:"a2",type:"dialogue",text:"a2"}]},
      {id:"hidden-a",name:"Hidden",characterId:"char-a",menuVisible:false,entries:[{id:"ha",type:"dialogue",text:"hidden"}]},
      {id:"talk-b1",name:"B1",characterId:"char-b",entries:[{id:"b1",type:"dialogue",text:"b1"}]}
    ]
  });
  selectedCharacterId="char-a";
  session={variables:{},affection:{},emotions:{},log:[],recentTalks:{"char-a":["talk-a1"]}};
  playback={
    characterId:"char-a",
    roomCharacterId:"char-a",
    eventId:"talk-a1",
    continuationQueue:[],
    continuationTotal:0,
    autoVisitedEventIds:["talk-a1"],
    frames:[{sourceType:"event",sourceId:"talk-a1",index:1,label:"본편",exitMode:"continue",targetEventId:""}],
    ended:false
  };
  activeInteractionEvent=null;
  interactionContext=null;
  typing={token:"",full:"",index:0,done:true,timer:null};
  const order=[playback.eventId];
  for(let i=0;i<3;i++){
    if(!finishEvent())throw new Error("continuous TALK stopped early");
    order.push(playback.eventId);
  }
  return order;
})()
`,context);
assert.equal(continuousFlow[0],"talk-a1","fixture must begin in char-a room");
assert.equal(continuousFlow[1],"talk-a2","the only unvisited char-a TALK must play next");
assert.ok(continuousFlow.every(id=>id.startsWith("talk-a")),
  "random TALK must never jump to another character");
assert.ok(!continuousFlow.includes("talk-b1"),"char-b TALK must never enter char-a room shuffle");
assert.ok(!continuousFlow.includes("hidden-a"),"hidden continuation events must not be auto-picked as TALK roots");
assert.notEqual(continuousFlow[0],continuousFlow[1],
  "same-character shuffle must avoid an immediate repeat when another TALK exists");

const recentTalkCheck=vm.runInContext(`
(()=>{
  state=normalizeState({
    schemaVersion:4,
    characters:[{id:"char-r",name:"R",origin:"hellborn"}],
    events:[
      {id:"r1",name:"R1",characterId:"char-r",entries:[{id:"r1e",type:"dialogue",text:"1"}]},
      {id:"r2",name:"R2",characterId:"char-r",entries:[{id:"r2e",type:"dialogue",text:"2"}]},
      {id:"r3",name:"R3",characterId:"char-r",entries:[{id:"r3e",type:"dialogue",text:"3"}]},
      {id:"r4",name:"R4",characterId:"char-r",entries:[{id:"r4e",type:"dialogue",text:"4"}]}
    ],
    playState:{recentTalks:{"char-r":["r1","r2","r3"]}}
  });
  session={variables:{},affection:{},emotions:{},log:[],recentTalks:clone(state.playState.recentTalks||{})};
  const picked=randomTalkForCharacter("char-r");
  rememberRecentTalk("char-r",picked.id);
  return {picked:picked.id,recent:[...session.recentTalks["char-r"]],saved:[...state.playState.recentTalks["char-r"]]};
})()
`,context);
assert.equal(recentTalkCheck.picked,"r4","room re-entry should avoid the three most recent TALK roots when another exists");
assert.equal(recentTalkCheck.recent.at(-1),"r4","new TALK must enter recent history");
assert.deepEqual([...recentTalkCheck.saved],[...recentTalkCheck.recent],"recent TALK history must persist into playState");

const exitRoleCheck=vm.runInContext(`
(()=>{
  const normalized=normalizeState({
    schemaVersion:4,
    characters:[{id:"char-exit",name:"Exit",origin:"hellborn"}],
    events:[
      {id:"talk",name:"Talk",characterId:"char-exit",entries:[{id:"t",type:"dialogue",text:"talk"}]},
      {id:"bye",name:"EXIT · Bye",characterId:"char-exit",entries:[{id:"b",type:"dialogue",text:"bye"}]}
    ]
  });
  const talk=normalized.events.find(e=>e.id==="talk");
  const bye=normalized.events.find(e=>e.id==="bye");
  const compact=compactStateForStorage(normalized);
  return{
    talkRole:talk.eventRole,
    exitRole:bye.eventRole,
    exitVisible:bye.menuVisible,
    packedRole:compact.events.find(e=>e.id==="bye").eventRole
  };
})()
`,context);
assert.equal(exitRoleCheck.talkRole,"talk","normal events must remain TALK");
assert.equal(exitRoleCheck.exitRole,"exit","legacy EXIT names must normalize to EXIT role");
assert.equal(exitRoleCheck.exitVisible,false,"EXIT events must be hidden from TALK menu");
assert.equal(exitRoleCheck.packedRole,"exit","EXIT role must survive compact storage");

const blockedExit=vm.runInContext(`
(()=>{
  state=normalizeState({schemaVersion:4,characters:[{id:"char-lock",name:"Lock",origin:"hellborn"}]});
  currentPage="room";
  selectedCharacterId="char-lock";
  activeInteractionReaction={kind:"gift"};
  interactionContext=null;
  roomExitActive=false;
  lastToast="";
  const result=beginRoomExit("home");
  return {result,page:currentPage,toast:lastToast};
})()
`,context);
assert.equal(blockedExit.result,false,"ASK/gift reaction must block room navigation");
assert.equal(blockedExit.page,"room","blocked room navigation must keep the player in the room");
assert.match(blockedExit.toast,/반응을 끝까지/,"blocked room navigation needs player feedback");

console.log("Hellaverse smoke OK",result,{editorMerge,continuationOrder,continuousFlow,recentTalkCheck,exitRoleCheck,blockedExit});
