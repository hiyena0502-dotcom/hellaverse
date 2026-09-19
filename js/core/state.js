"use strict";

const STATE_KEY = "hellaverse-studio-state-v2";
const PREFS_KEY = "hellaverse-studio-prefs-v2";
const DATA_BACKUP_KEY = "hellaverse-studio-backups-v2";
const EDITOR_SNAPSHOT_KEY = "hellaverse-studio-editor-snapshot-v2";
const RARITIES = ["COMMON","UNCOMMON","RARE","EPIC","LEGENDARY","MISTIC"];
const ORIGINS = [
  ["sinner","죄인 · SINNER","hell"],
  ["hellborn","헬본 · HELLBORN","hell"],
  ["angel","천사 · ANGEL","heaven"],
  ["winner","위너 · WINNER","heaven"]
];
const EMOTIONS = [
  ["calm","평온"],["joy","기쁨"],["embarrassed","당황"],["sad","슬픔"],
  ["angry","화남"],["anxious","불안"],["curious","호기심"],["guarded","경계"]
];
const FREQUENCIES = [["common","Common"],["normal","Normal"],["rare","Rare"]];
const DEFAULT_CATEGORIES = ["일상","관계","과거","천국","지옥","비밀"];
const DEFAULT_ITEM_CATEGORIES = ["개인 소지품","음식","장신구","편지·문서","장난감","수제품","기념품","열쇠·도구","기타"];
const GIFT_PREFERENCES = [
  ["LOVED",5],["LIKED",3],["NEUTRAL",1],["DISLIKED",-2],["HATED",-4]
];
const RARITY_ORDER = {COMMON:0,UNCOMMON:1,RARE:2,EPIC:3,LEGENDARY:4,MISTIC:5};

const $ = (q, root=document) => root.querySelector(q);
const $$ = (q, root=document) => [...root.querySelectorAll(q)];
const uid = p => p + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2,7);
const clone = v => typeof structuredClone === "function" ? structuredClone(v) : JSON.parse(JSON.stringify(v));
const esc = v => String(v ?? "").replace(/[&<>"']/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const clamp = (v,min,max,fallback=0) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max,Math.max(min,n)) : fallback;
};
const emotionLabel = id => EMOTIONS.find(x=>x[0]===id)?.[1] || "평온";
const originLabel = id => ORIGINS.find(x=>x[0]===id)?.[1] || "헬본 · HELLBORN";
const originRealm = id => ORIGINS.find(x=>x[0]===id)?.[2] || "hell";
const validOrigin = id => ORIGINS.some(x=>x[0]===id);
const normalizeOrigin = id => id==="heaven" ? "angel" : validOrigin(id) ? id : "hellborn";
const DEFAULT_CONTENT = window.HV_DEFAULT_CONTENT || {};
const defaultContentList = key => clone(Array.isArray(DEFAULT_CONTENT[key]) ? DEFAULT_CONTENT[key] : []);

function defaultState(){
  return {
    profile:{name:"",origin:""},
    favoriteCharacterIds:[],
    playState:{variables:{},affection:{},emotions:{},log:[]},
    characters:defaultContentList("characters"),
    events:defaultContentList("events"),
    variables:defaultContentList("variables"),
    asks:defaultContentList("asks"),
    items:defaultContentList("items"),
    itemCategories:[...DEFAULT_ITEM_CATEGORIES],
    inventoryCounts:{},
    newItemIds:[],
    itemHistory:[],
    discoveredGiftReactionKeys:[],
    giftInteractionCounts:{},
    askedAskIds:[],
    unlockedAskIds:[],
    interactionHistory:[],
    collectionSettings:{showLocked:true,showOwnedCount:true,view:"grouped",sort:"recent"},
    thoughts:defaultContentList("thoughts"),
    thoughtSettings:{categories:[...DEFAULT_CATEGORIES]},
    gacha:{
      enabled:true,
      currencyName:"SOUL",
      balance:100,
      singleCost:10,
      tenCost:90,
      rarityWeights:{COMMON:50,UNCOMMON:28,RARE:14,EPIC:7,LEGENDARY:3,MISTIC:1},
      history:[]
    },
    discoveredThoughtIds:[]
  };
}

function normalizeCharacter(c={}){
  return {
    id:c.id || uid("char"),
    name:c.name || "새 캐릭터",
    origin:normalizeOrigin(c.origin),
    role:c.role || "",
    quote:c.quote || "",
    image:c.image || "",
    enabled:c.enabled !== false,
    affectionStart:clamp(c.affectionStart,0,100,0),
    emotionDefault:EMOTIONS.some(x=>x[0]===c.emotionDefault) ? c.emotionDefault : "calm",
    emotionIntensity:clamp(c.emotionIntensity,0,100,10)
  };
}

function normalizeCondition(c){
  if(!c || typeof c!=="object") return null;
  return {variableId:c.variableId||"",operator:c.operator||"==",value:c.value??""};
}
function normalizeEffects(arr){
  return Array.isArray(arr) ? arr.map(x=>({
    id:x.id||uid("fx"),variableId:x.variableId||"",operation:x.operation||"set",value:x.value??""
  })) : [];
}
function normalizeItemEffects(arr){
  return Array.isArray(arr) ? arr.map(x=>({
    id:x.id||uid("itemfx"),
    itemId:x.itemId||"",
    amount:Math.max(1,Number(x.amount)||1)
  })) : [];
}
function normalizeItemCondition(c){
  if(!c || typeof c!=="object")return null;
  return {itemId:c.itemId||"",operator:c.operator||">=",value:Math.max(0,Number(c.value)||0)};
}
function normalizeAskCondition(c){
  if(!c || typeof c!=="object")return null;
  return {askId:c.askId||"",status:["asked","not-asked","unlocked","locked"].includes(c.status)?c.status:"asked"};
}
function normalizeAffectionCondition(c){
  if(!c || typeof c!=="object") return null;
  return {characterId:c.characterId||c.targetId||"",operator:c.operator||">=",value:clamp(c.value,0,100,0)};
}
function normalizeAffectionEffects(arr){
  return Array.isArray(arr) ? arr.map(x=>({
    id:x.id||uid("afx"),characterId:x.characterId||x.targetId||"",amount:clamp(x.amount,-100,100,0)
  })) : [];
}
function normalizeEmotionCondition(c){
  if(!c || typeof c!=="object") return null;
  return {
    characterId:c.characterId||c.targetId||"",
    state:EMOTIONS.some(x=>x[0]===c.state)?c.state:"",
    intensityOperator:c.intensityOperator||">=",
    intensityValue:clamp(c.intensityValue,0,100,0)
  };
}
function normalizeEmotionEffects(arr){
  return Array.isArray(arr) ? arr.map(x=>({
    id:x.id||uid("efx"),
    characterId:x.characterId||x.targetId||"",
    state:EMOTIONS.some(y=>y[0]===x.state)?x.state:"calm",
    intensity:clamp(x.intensity,0,100,0)
  })) : [];
}

function normalizeEntry(entry={}){
  const base={
    id:entry.id||uid("entry"),
    type:["dialogue","narration","choice"].includes(entry.type)?entry.type:"dialogue",
    condition:normalizeCondition(entry.condition),
    effects:normalizeEffects(entry.effects),
    itemEffects:normalizeItemEffects(entry.itemEffects),
    itemCondition:normalizeItemCondition(entry.itemCondition),
    askCondition:normalizeAskCondition(entry.askCondition),
    affectionCondition:normalizeAffectionCondition(entry.affectionCondition),
    affectionEffects:normalizeAffectionEffects(entry.affectionEffects),
    emotionCondition:normalizeEmotionCondition(entry.emotionCondition),
    emotionEffects:normalizeEmotionEffects(entry.emotionEffects)
  };
  if(base.type==="narration") return {...base,text:entry.text||""};
  if(base.type==="choice"){
    return {
      ...base,
      prompt:entry.prompt||"",
      options:Array.isArray(entry.options)?entry.options.map(o=>({
        id:o.id||uid("option"),
        label:o.label||"",
        entries:Array.isArray(o.entries)?o.entries.map(normalizeEntry):[],
        condition:normalizeCondition(o.condition),
        effects:normalizeEffects(o.effects),
        itemEffects:normalizeItemEffects(o.itemEffects),
        itemCondition:normalizeItemCondition(o.itemCondition),
        askCondition:normalizeAskCondition(o.askCondition),
        affectionCondition:normalizeAffectionCondition(o.affectionCondition),
        affectionEffects:normalizeAffectionEffects(o.affectionEffects),
        emotionCondition:normalizeEmotionCondition(o.emotionCondition),
        emotionEffects:normalizeEmotionEffects(o.emotionEffects),
        exitMode:o.exitMode==="end"?"end":"continue",
        targetEventId:o.targetEventId||""
      })):[]
    };
  }
  return {...base,speaker:entry.speaker||"",text:entry.text||""};
}

function normalizeEvent(e={}){
  return {
    id:e.id||uid("event"),
    name:e.name||"새 이벤트",
    characterId:e.characterId||"",
    nextEventId:e.nextEventId||"",
    emotionExitMode:e.emotionExitMode==="reset"?"reset":"keep",
    entries:Array.isArray(e.entries)?e.entries.map(normalizeEntry):[]
  };
}
function normalizeVariable(v={}){
  const type=["number","boolean","string"].includes(v.type)?v.type:"number";
  return {id:v.id||uid("var"),name:v.name||"새 변수",type,defaultValue:v.defaultValue??(type==="boolean"?"false":"0")};
}
function legacyInteractionEntry(type,text){
  if(!text)return null;
  return normalizeEntry({
    type:type==="narration"?"narration":"dialogue",
    speaker:"",
    text:String(text),
    condition:null,
    effects:[],
    affectionCondition:null,
    affectionEffects:[],
    emotionCondition:null,
    emotionEffects:[]
  });
}
function normalizeAsk(a={}){
  let entries=Array.isArray(a.entries)?a.entries.map(normalizeEntry):[];
  if(!entries.length&&a.reactionText){
    const legacy=legacyInteractionEntry(a.reactionType,a.reactionText);
    if(legacy)entries=[legacy];
  }
  return {
    id:a.id||uid("ask"),
    characterId:a.characterId||"",
    label:a.label||a.question||"새 질문",
    minAffection:clamp(a.minAffection,0,100,0),
    startLocked:Boolean(a.startLocked),
    unlockMinAffection:clamp(a.unlockMinAffection,0,100,0),
    unlockCondition:normalizeCondition(a.unlockCondition),
    unlockItemCondition:normalizeItemCondition(a.unlockItemCondition),
    unlockAskCondition:normalizeAskCondition(a.unlockAskCondition),
    unlockEmotionCondition:normalizeEmotionCondition(a.unlockEmotionCondition),
    affectionDelta:clamp(a.affectionDelta ?? a.reactionAffectionDelta,-100,100,0),
    emotionState:EMOTIONS.some(x=>x[0]===a.emotionState) ? a.emotionState : "",
    emotionIntensity:clamp(a.emotionIntensity ?? a.reactionEmotionIntensity,0,100,0),
    entries,
    enabled:a.enabled!==false
  };
}
function normalizeItemReaction(r={},fallbackCharacterId=""){
  let entries=Array.isArray(r.entries)?r.entries.map(normalizeEntry):[];
  if(!entries.length&&r.reactionText){
    const legacy=legacyInteractionEntry(r.reactionType,r.reactionText);
    if(legacy)entries=[legacy];
  }
  return {
    id:r.id||uid("item-reaction"),
    characterId:r.characterId||fallbackCharacterId||"",
    preference:GIFT_PREFERENCES.some(x=>x[0]===r.preference)?r.preference:
      ((Number(r.affectionDelta??r.giftAffectionDelta)||0)>=5?"LOVED":
       (Number(r.affectionDelta??r.giftAffectionDelta)||0)>=3?"LIKED":
       (Number(r.affectionDelta??r.giftAffectionDelta)||0)<-2?"HATED":
       (Number(r.affectionDelta??r.giftAffectionDelta)||0)<0?"DISLIKED":"NEUTRAL"),
    affectionDelta:clamp(r.affectionDelta ?? r.giftAffectionDelta,-100,100,0),
    emotionState:EMOTIONS.some(x=>x[0]===r.emotionState) ? r.emotionState : "",
    emotionIntensity:clamp(r.emotionIntensity ?? r.giftEmotionIntensity,0,100,0),
    firstEntries:Array.isArray(r.firstEntries)?r.firstEntries.map(normalizeEntry):entries.map(normalizeEntry),
    repeatEntries:Array.isArray(r.repeatEntries)?r.repeatEntries.map(normalizeEntry):entries.map(normalizeEntry),
    specialEntries:Array.isArray(r.specialEntries)?r.specialEntries.map(normalizeEntry):[],
    specialMinAffection:clamp(r.specialMinAffection,0,100,0),
    specialEmotionState:EMOTIONS.some(x=>x[0]===r.specialEmotionState)?r.specialEmotionState:"",
    specialEmotionIntensity:clamp(r.specialEmotionIntensity,0,100,0)
  };
}
function normalizeItem(i={}){
  const collectionCharacterId=i.collectionCharacterId||i.ownerCharacterId||i.characterId||"";
  let reactions=Array.isArray(i.reactions)?i.reactions.map(r=>normalizeItemReaction(r)):[];
  if(!reactions.length&&(i.reactionText||i.affectionDelta||i.emotionState)){
    reactions=[normalizeItemReaction({
      characterId:i.characterId||collectionCharacterId,
      affectionDelta:i.affectionDelta,
      emotionState:i.emotionState,
      emotionIntensity:i.emotionIntensity,
      reactionType:i.reactionType,
      reactionText:i.reactionText
    },i.characterId||collectionCharacterId)];
  }
  return {
    id:i.id||uid("item"),
    name:i.name||"새 아이템",
    category:i.category||"기타",
    rarity:RARITIES.includes(i.rarity)?i.rarity:"COMMON",
    collectionCharacterId,
    description:i.description||"",
    acquisitionMode:i.acquisitionMode==="unique"?"unique":"repeatable",
    giftUseMode:i.giftUseMode==="consume"?"consume":"keep",
    secret:Boolean(i.secret),
    gachaEnabled:i.gachaEnabled!==false,
    enabled:i.enabled!==false,
    weight:Math.max(.01,Number(i.weight)||1),
    reactions,
    legacyOwned:Math.max(0,Number(i.owned)||0),
    legacyUnlocked:Boolean(i.unlocked)
  };
}
function normalizeThought(t={}){
  return {
    id:t.id||uid("thought"),
    characterId:t.characterId||"",
    category:t.category||"일상",
    rarity:RARITIES.includes(t.rarity)?t.rarity:"COMMON",
    frequency:["common","normal","rare"].includes(t.frequency)?t.frequency:"common",
    text:t.text||"",
    enabled:t.enabled!==false
  };
}
function normalizePlayState(p={}){
  return {
    variables:p.variables&&typeof p.variables==="object"?{...p.variables}:{},
    affection:p.affection&&typeof p.affection==="object"
      ? Object.fromEntries(Object.entries(p.affection).map(([id,v])=>[id,clamp(v,0,100,0)]))
      : {},
    emotions:p.emotions&&typeof p.emotions==="object"
      ? Object.fromEntries(Object.entries(p.emotions).map(([id,v])=>[id,{
          state:EMOTIONS.some(x=>x[0]===v?.state)?v.state:"calm",
          intensity:clamp(v?.intensity,0,100,0)
        }]))
      : {},
    log:Array.isArray(p.log)?p.log.slice(-200).map(x=>({
      kind:String(x?.kind||"dialogue"),
      speaker:String(x?.speaker||""),
      text:String(x?.text||""),
      eventName:String(x?.eventName||"")
    })):[]
  };
}
function normalizeState(raw){
  const d=defaultState();
  const s=raw&&typeof raw==="object"?raw:{};
  const rawItems=Array.isArray(s.items) ? s.items : Array.isArray(s.collection) ? s.collection : d.items;
  const items=rawItems.map(normalizeItem);
  const inventoryCounts={...(s.inventoryCounts&&typeof s.inventoryCounts==="object"?s.inventoryCounts:{})};
  items.forEach(item=>{
    if(inventoryCounts[item.id]===undefined && (item.legacyOwned>0 || item.legacyUnlocked)){
      inventoryCounts[item.id]=Math.max(1,item.legacyOwned||0);
    }
    delete item.legacyOwned;
    delete item.legacyUnlocked;
  });
  const rawOrigin=s.profile?.origin;
  return {
    profile:{
      name:String(s.profile?.name||""),
      origin:rawOrigin ? normalizeOrigin(rawOrigin) : ""
    },
    favoriteCharacterIds:Array.isArray(s.favoriteCharacterIds)?[...new Set(s.favoriteCharacterIds.map(String))]:[],
    playState:normalizePlayState(s.playState),
    characters:(Array.isArray(s.characters)?s.characters:d.characters).map(normalizeCharacter),
    events:(Array.isArray(s.events)?s.events:d.events).map(normalizeEvent),
    variables:(Array.isArray(s.variables)?s.variables:d.variables).map(normalizeVariable),
    asks:(Array.isArray(s.asks)?s.asks:d.asks).map(normalizeAsk),
    items,
    itemCategories:[...new Set([
      ...(Array.isArray(s.itemCategories)&&s.itemCategories.length?s.itemCategories:d.itemCategories),
      ...items.map(i=>i.category),
      "기타"
    ].map(String).map(x=>x.trim()).filter(Boolean))],
    inventoryCounts:Object.fromEntries(Object.entries(inventoryCounts).map(([id,n])=>[id,Math.max(0,Number(n)||0)])),
    newItemIds:Array.isArray(s.newItemIds)?[...new Set(s.newItemIds.map(String))]:[],
    itemHistory:Array.isArray(s.itemHistory)?s.itemHistory.slice(-500):[],
    discoveredGiftReactionKeys:Array.isArray(s.discoveredGiftReactionKeys)?[...new Set(s.discoveredGiftReactionKeys.map(String))]:[],
    giftInteractionCounts:s.giftInteractionCounts&&typeof s.giftInteractionCounts==="object"
      ? Object.fromEntries(Object.entries(s.giftInteractionCounts).map(([k,v])=>[k,Math.max(0,Number(v)||0)]))
      : {},
    askedAskIds:Array.isArray(s.askedAskIds)?[...new Set(s.askedAskIds.map(String))]:[],
    unlockedAskIds:Array.isArray(s.unlockedAskIds)?[...new Set(s.unlockedAskIds.map(String))]:[],
    interactionHistory:Array.isArray(s.interactionHistory)?s.interactionHistory.slice(-500):[],
    collectionSettings:{
      showLocked:s.collectionSettings?.showLocked!==false,
      showOwnedCount:s.collectionSettings?.showOwnedCount!==false,
      view:s.collectionSettings?.view==="all"?"all":"grouped",
      sort:["recent","rarity","name","count"].includes(s.collectionSettings?.sort)?s.collectionSettings.sort:"recent"
    },
    thoughts:(Array.isArray(s.thoughts)?s.thoughts:d.thoughts).map(normalizeThought),
    thoughtSettings:{
      categories:Array.isArray(s.thoughtSettings?.categories)&&s.thoughtSettings.categories.length
        ? [...new Set(s.thoughtSettings.categories.map(String).filter(Boolean))]
        : d.thoughtSettings.categories
    },
    gacha:{
      enabled:s.gacha?.enabled!==false,
      currencyName:String(s.gacha?.currencyName||"SOUL"),
      balance:Math.max(0,Number(s.gacha?.balance ?? d.gacha.balance) || 0),
      singleCost:Math.max(0,Number(s.gacha?.singleCost ?? d.gacha.singleCost) || 0),
      tenCost:Math.max(0,Number(s.gacha?.tenCost ?? d.gacha.tenCost) || 0),
      rarityWeights:Object.fromEntries(RARITIES.map(r=>[r,Math.max(0,Number(s.gacha?.rarityWeights?.[r] ?? d.gacha.rarityWeights[r]) || 0)])),
      history:Array.isArray(s.gacha?.history)?s.gacha.history.slice(-50):[]
    },
    discoveredThoughtIds:Array.isArray(s.discoveredThoughtIds)?[...new Set(s.discoveredThoughtIds)]:[]
  };
}
function readState(){
  try{return normalizeState(JSON.parse(localStorage.getItem(STATE_KEY)))}catch{return normalizeState(null)}
}
function syncPlayStateFromSession(){
  if(typeof session==="undefined"||!session)return;
  state.playState={
    variables:clone(session.variables||{}),
    affection:clone(session.affection||{}),
    emotions:clone(session.emotions||{}),
    log:Array.isArray(session.log)?session.log.slice(-200):[]
  };
}
function saveState(){
  syncPlayStateFromSession();
  localStorage.setItem(STATE_KEY,JSON.stringify(state));
}
function readBackupStore(){
  try{
    const raw=JSON.parse(localStorage.getItem(DATA_BACKUP_KEY)||"{}");
    return {
      slots:Array.from({length:3},(_,i)=>Array.isArray(raw.slots)?raw.slots[i]||null:null),
      safety:raw.safety&&typeof raw.safety==="object"?raw.safety:null
    };
  }catch{return{slots:[null,null,null],safety:null}}
}
function writeBackupStore(store){localStorage.setItem(DATA_BACKUP_KEY,JSON.stringify(store))}
function makeDataSnapshot(label="BACKUP"){
  saveState();
  return {version:2,label:String(label),at:Date.now(),state:clone(state),prefs:clone(prefs)};
}
function captureSafetySnapshot(label="자동 안전 백업"){
  const store=readBackupStore();
  store.safety=makeDataSnapshot(label);
  writeBackupStore(store);
}
function readPrefs(){
  try{
    const p=JSON.parse(localStorage.getItem(PREFS_KEY)||"{}");
    return {textSpeed:clamp(p.textSpeed,0,80,24),autoDelay:clamp(p.autoDelay,250,3000,900),stageClick:p.stageClick!==false};
  }catch{return{textSpeed:24,autoDelay:900,stageClick:true}}
}
function savePrefs(){localStorage.setItem(PREFS_KEY,JSON.stringify(prefs))}

let state=readState();
let prefs=readPrefs();
let currentPage="home";
let selectedCharacterId="";
let homeIndex=0;
let characterQuery="";
let characterRealmFilter="ALL";
let characterFavoritesOnly=false;
let roomToolsOpen=false;
let thoughtFilter="ALL";
let collectionFilter="ALL";
let collectionRarity="ALL";
let collectionCategory="ALL";
let collectionStatus="ALL";
let collectionSource="ALL";
let collectionQuery="";
let pendingOrigin=state.profile.origin || "";
let roomMode="talk";
let activeInteractionReaction=null;
let activeInteractionEvent=null;
let interactionContext=null;
let editorDraft=null;
let editorUndoStack=[];
let editorRedoStack=[];
let editorInitialSnapshot="";
let editorTab="dialogue";
let dialogueSubtab="characters";
let selectedEditorCharacterId="";
let selectedEditorEventId="";
let selectedEntryId="";
let selectedThoughtId="";
let selectedAskId="";
let selectedItemId="";
let editorItemQuery="";
let editorItemCharacterFilter="ALL";
let editorItemRarityFilter="ALL";
let editorItemCategoryFilter="ALL";

let session=null;
let playback=null;
let typing={token:"",full:"",index:0,done:true,timer:null};
let autoMode=false;
let autoTimer=null;
let toastTimer=null;
let gachaAnimating=false;

const startScreen=$("#startScreen");
const gameShell=$("#gameShell");
const startForm=$("#startForm");
const playerNameInput=$("#playerNameInput");
const originChoice=$("#originChoice");
const enterGameButton=$("#enterGameButton");
const startHint=$("#startHint");
const playerBadge=$("#playerBadge");
const pageRoot=$("#pageRoot");
const modalRoot=$("#modalRoot");
const toastEl=$("#toast");
const editorOverlay=$("#editorOverlay");
const editorBody=$("#editorBody");
