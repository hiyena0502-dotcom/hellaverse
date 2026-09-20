import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";

const root=new URL("../",import.meta.url);
const read=path=>fs.readFileSync(new URL(path,root),"utf8");

const jsFiles=[
  "data/story-packs.js",
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
assert.match(dialogueCode,/randomTalkEvent\(playableTalkEventsForCharacter\(ch\.id\)\)/,"room entry must start from a random TALK");
assert.match(dialogueCode,/const candidates=playableTalkEventsForCharacter\(roomCharacterId\)/,"continuous random TALK must stay inside the selected character room");
assert.match(dialogueCode,/function beginRoomExit\(/,"room EXIT flow missing");
assert.match(editorEvents,/a==="back-home"\)\{beginRoomExit\("home"\)\}/,"HOME exit must play room EXIT dialogue");
assert.match(gameStateCode,/function exitEventsForCharacter\(/,"EXIT events must be separated from TALK menus");
assert.match(stateCode,/function isExitEvent\(/,"EXIT event role compatibility missing");
assert.ok(!dialogueCode.includes("이벤트가 끝났습니다."),"terminal event-ended screen must be removed");
assert.match(editorUi,/data-entry-field="speakerCharacterId"/,"speaker image selector missing from event editor");
assert.match(editorEvents,/data-action="validation-jump"/,"validation issue navigation missing");
assert.match(read("js/world/regions.js"),/currentPage!=="world"\|\|activeRegion!==regionId/,"WORLD timer must stop outside WORLD");

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
assert.equal(storyPackInstall.eventCount,23,"story pack event count changed");
assert.equal(storyPackInstall.variableCount,11,"story pack variable count changed");
assert.equal(storyPackInstall.packVersion,3,"story pack version marker missing");
assert.equal(storyPackInstall.openingVisible,true,"opening event must be visible");
assert.equal(storyPackInstall.hiddenVisible,false,"continuation event must be hidden");
assert.equal(storyPackInstall.speakerCharacterId,"lucifer-morningstar","speaker image id must survive compaction");
assert.equal(storyPackInstall.secondChanged,false,"story pack must install only once");

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
  const normalized=normalizeState(source);
  const compact=compactStateForStorage(normalized);
  const progress=progressStateFrom(normalized);
  const migrated=normalizeState({schemaVersion:2,characters:source.characters,items:[{
    id:"old-item",name:"Old",collectionCharacterId:"char-0",rarity:"COMMON",category:"기타"
  }]});
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
    migratedContinuation:legacyNext.events[0].continuationEventIds
  };
})()
`,context);

assert.equal(result.schema,4,"current schema must be 4");
assert.deepEqual([...result.counts],[1000,500,300,500],"large fixture counts changed during normalization");
assert.equal(result.migratedGiftable,true,"v2 -> v3 item migration must default giftable=true");
assert.deepEqual([...result.migratedContinuation],["event-b"],"v3 nextEventId must migrate to v4 continuationEventIds");
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
function eventsForCharacter(charId,source=state){return source.events.filter(e=>e.characterId===charId&&e.menuVisible!==false&&!isExitEvent(e))}
function exitEventsForCharacter(charId,source=state){return source.events.filter(e=>e.characterId===charId&&isExitEvent(e))}
function ownerPasses(){return true}
function resetEventEmotion(){}
function clearTyping(){}
function clearAuto(){}
function restoreInterruptedDialogue(){return false}
function completeInteraction(){}
function setPage(page){currentPage=page}
function renderRoom(){}
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

console.log("Hellaverse smoke OK",result,{editorMerge,continuationOrder,continuousFlow,exitRoleCheck});
