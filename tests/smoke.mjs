import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";

const root=new URL("../",import.meta.url);
const read=path=>fs.readFileSync(new URL(path,root),"utf8");

const jsFiles=[
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
for(const id of ["brandButton","dataButton","editorButton","changeProfileButton","editorOverlay","editorBody"]){
  assert.match(index,new RegExp('id="'+id+'"'),"missing #"+id);
}
assert.match(index,/class="nav-button[^"]*"[^>]*data-page="home"/,"HOME nav missing");
assert.match(index,/js\/core\/state\.js\?v=16/,"v16 state asset cache bust missing");
assert.match(index,/js\/editor\/editor-events\.js\?v=16/,"v16 editor asset cache bust missing");

const editorEvents=read("js/editor/editor-events.js");
const stateCode=read("js/core/state.js");
const appShell=read("js/ui/app-shell.js");
const editorUi=read("js/editor/editor-ui.js");

assert.ok(!editorEvents.includes('$(".nav-button").forEach'),"nav must use querySelectorAll/$$, not single $ helper");
assert.match(editorEvents,/document\.querySelectorAll\("\.nav-button"\)\.forEach/,"nav click delegation missing");
assert.match(stateCode,/STORAGE_DB_NAME/,"IndexedDB storage constants missing");
assert.match(stateCode,/function bootstrapStorage\(/,"IndexedDB bootstrap missing");
assert.match(stateCode,/function saveProgressState\(/,"progress-only persistence missing");
assert.match(appShell,/function showImportPreview\(/,"import preview missing");
assert.match(appShell,/function recoverUiFromError\(/,"UI recovery boundary missing");
assert.match(editorUi,/function renderSelectedItemEditor\(/,"single-detail ITEM editor missing");
assert.match(editorUi,/data-action="select-ask"/,"single-detail ASK selection missing");
assert.match(editorUi,/data-action="select-thought"/,"single-detail THOUGHT selection missing");

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
vm.runInContext(stateCode,context,{filename:"js/core/state.js"});

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
  return{
    schema:normalized.schemaVersion,
    counts:[normalized.events.length,normalized.asks.length,normalized.items.length,normalized.thoughts.length],
    fullChars:JSON.stringify(compact).length,
    progressChars:JSON.stringify(progress).length,
    migratedGiftable:migrated.items[0].giftable
  };
})()
`,context);

assert.equal(result.schema,3,"current schema must be 3");
assert.deepEqual([...result.counts],[1000,500,300,500],"large fixture counts changed during normalization");
assert.equal(result.migratedGiftable,true,"v2 -> v3 item migration must default giftable=true");
assert.ok(result.progressChars<result.fullChars*0.1,
  `progress payload should be <10% of project payload (full=${result.fullChars}, progress=${result.progressChars})`);

console.log("Hellaverse smoke OK",result);
