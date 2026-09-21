import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";

const root=new URL("../",import.meta.url);
const read=path=>fs.readFileSync(new URL(path,root),"utf8");

const jsFiles=[
  "data/story-packs.js",
  "data/character-events.js",
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
assert.match(stateCode,/function installStoryPacks\(/,"one-time story pack installer missing");
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
assert.match(dialogueCode,/!isEntryEvent\(ev\)/,"ENTRY events must stay out of continuous TALK");
assert.match(characterEventCode,/voice-events-baxter/,"Baxter voice event pack missing");
assert.match(characterEventCode,/voice-events-emily/,"Emily voice event pack missing");
assert.match(characterEventCode,/voice-events-lute/,"Lute voice event pack missing");
assert.match(characterEventCode,/voice-events-adam/,"Adam voice event pack missing");
assert.match(characterEventCode,/voice-events-vox/,"Vox voice event pack missing");
assert.match(characterEventCode,/voice-events-pentious/,"Sir Pentious voice event pack missing");
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
assert.equal(storyPackInstall.variableCount,11,"story pack variable count changed");
assert.equal(storyPackInstall.packVersion,3,"story pack version marker missing");
assert.equal(storyPackInstall.openingVisible,true,"opening event must be visible");
assert.equal(storyPackInstall.hiddenVisible,false,"continuation event must be hidden");
assert.equal(storyPackInstall.speakerCharacterId,"lucifer-morningstar","speaker image id must survive compaction");
assert.equal(storyPackInstall.secondChanged,false,"story pack must install only once");

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
function showToast(text){lastToast=text}
`,context);
vm.runInContext(dialogueCode,context,{filename:"js/game/dialogue.js"});
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
