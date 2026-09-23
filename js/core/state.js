"use strict";

const STATE_KEY = "hellaverse-studio-state-v2";
const PREFS_KEY = "hellaverse-studio-prefs-v2";
const DATA_BACKUP_KEY = "hellaverse-studio-backups-v2";
const EDITOR_SNAPSHOT_KEY = "hellaverse-studio-editor-snapshot-v2";
const STORAGE_META_KEY = "hellaverse-storage-meta-v1";
const STORAGE_DB_NAME = "hellaverse-studio-db";
const STORAGE_DB_VERSION = 1;
const STORAGE_DB_STORE = "kv";
const CURRENT_SCHEMA_VERSION = 4;
const AUX_STORAGE_KEYS = [
  "hellaverse-world-settings-v1",
  "hellaverse-world-region-v1",
  "hellaverse-world-scene-placement-v1",
  "hellaverse-world-scene-work-v1"
];
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
const RETIRED_CHARACTER_IDS = new Set(["belphegor","leviathan"]);
const RETIRED_CHARACTER_LABELS = ["belphegor","leviathan","벨페고르","레비아탄"];
const isRetiredCharacterId = value => RETIRED_CHARACTER_IDS.has(String(value||"").toLowerCase());
const hasRetiredCharacterReference = value => {
  const text=String(value??"").toLowerCase();
  return RETIRED_CHARACTER_LABELS.some(label=>text.includes(label.toLowerCase()));
};

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
const STORY_PACKS = Array.isArray(window.HV_STORY_PACKS) ? window.HV_STORY_PACKS : [];
const defaultContentList = key => clone(Array.isArray(DEFAULT_CONTENT[key]) ? DEFAULT_CONTENT[key] : []);

function defaultState(){
  return {
    schemaVersion:CURRENT_SCHEMA_VERSION,
    storyPackVersions:{},
    itemPresetVersion:0,
    dialoguePresetVersion:0,
    profile:{name:"",origin:""},
    favoriteCharacterIds:[],
    playState:{variables:{},affection:{},emotions:{},log:[],recentTalks:{},selectedOptionIds:[]},
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
    discoveredSpecialGiftKeys:[],
    giftInteractionCounts:{},
    discoveredTalkIds:[],
    seenOriginIntroCharacterIds:[],
    askedAskIds:[],
    unlockedAskIds:[],
    interactionHistory:[],
    claimedItemEffectIds:[],
    collectionSettings:{showLocked:true,showOwnedCount:true,view:"grouped",sort:"recent",expandedCharacterIds:[]},
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

function normalizeEmotionImages(raw={}){
  const source=raw&&typeof raw==="object"?raw:{};
  return Object.fromEntries(EMOTIONS.map(([id])=>{
    const row=source[id]&&typeof source[id]==="object"?source[id]:{};
    return [id,{
      image:String(row.image||""),
      scale:Math.max(.5,Math.min(2,Number(row.scale)||1))
    }];
  }));
}
function normalizeCharacter(c={}){
  return {
    id:c.id || uid("char"),
    name:c.name || "새 캐릭터",
    origin:normalizeOrigin(c.origin),
    role:c.role || "",
    quote:c.quote || "",
    image:c.image || "",
    imageScale:Math.max(.5,Math.min(2,Number(c.imageScale)||1)),
    emotionImages:normalizeEmotionImages(c.emotionImages),
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
    amount:Math.max(1,Number(x.amount)||1),
    once:Boolean(x.once)
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
const AFFECTION_BANDS=["COLD","DISTANT","NEUTRAL","WARM","CLOSE"];
function normalizeAffectionCondition(c){
  if(!c || typeof c!=="object") return null;
  const band=AFFECTION_BANDS.includes(c.band)?c.band:"";
  return {characterId:c.characterId||c.targetId||"",band,operator:c.operator||">=",value:clamp(c.value,0,100,0)};
}
function normalizeAffectionEffects(arr){
  return Array.isArray(arr) ? arr.map(x=>({
    id:x.id||uid("afx"),characterId:x.characterId||x.targetId||"",amount:clamp(x.amount,-100,100,0),silent:Boolean(x.silent)
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
  if(base.type==="narration"){
    const narrationRole=["intro","reaction","situation","transition","action","closing","background-dialogue"].includes(entry.narrationRole)?entry.narrationRole:"";
    return {...base,text:entry.text||"",narrationRole};
  }
  if(base.type==="choice"){
    return {
      ...base,
      prompt:entry.prompt||"",
      options:Array.isArray(entry.options)?entry.options.map(o=>({
        id:o.id||uid("option"),
        label:o.label||"",
        entries:normalizeEntries(o.entries),
        condition:normalizeCondition(o.condition),
        effects:normalizeEffects(o.effects),
        itemEffects:normalizeItemEffects(o.itemEffects),
        itemCondition:normalizeItemCondition(o.itemCondition),
        askCondition:normalizeAskCondition(o.askCondition),
        affectionCondition:normalizeAffectionCondition(o.affectionCondition),
        affectionEffects:normalizeAffectionEffects(o.affectionEffects),
        tone:["neutral","supportive","light","sensitive","confrontational"].includes(o.tone)?o.tone:"neutral",
        emotionCondition:normalizeEmotionCondition(o.emotionCondition),
        emotionEffects:normalizeEmotionEffects(o.emotionEffects),
        exitMode:o.exitMode==="end"?"end":"continue",
        targetEventId:o.targetEventId||""
      })):[]
    };
  }
  return {...base,speaker:entry.speaker||"",speakerCharacterId:entry.speakerCharacterId||"",text:entry.text||""};
}

function splitNormalizedDialogue(entry){
  if(!entry||entry.type!=="dialogue")return[entry];
  const text=String(entry.text||"").trim();
  if(text.length<=150)return[entry];
  const sentences=text.match(/[^.!?。！？]+[.!?。！？]+|[^.!?。！？]+$/g)?.map(x=>x.trim()).filter(Boolean)||[text];
  if(sentences.length<2)return[entry];

  let best=1,bestDiff=Infinity;
  for(let i=1;i<sentences.length;i++){
    const left=sentences.slice(0,i).join(" ");
    const right=sentences.slice(i).join(" ");
    if(left.length<55||right.length<35)continue;
    const diff=Math.abs(left.length-right.length);
    if(diff<bestDiff){best=i;bestDiff=diff}
  }
  if(bestDiff===Infinity)return[entry];

  const firstText=sentences.slice(0,best).join(" ").trim();
  const secondText=sentences.slice(best).join(" ").trim();
  if(!firstText||!secondText)return[entry];

  const first={
    ...entry,
    id:entry.id+"-part1",
    text:firstText,
    effects:[],
    itemEffects:[],
    affectionEffects:[],
    emotionEffects:[]
  };
  const second={
    ...entry,
    id:entry.id+"-part2",
    text:secondText
  };
  return[first,second];
}

function expandNormalizedEntry(entry){
  return splitNormalizedDialogue(entry);
}

function normalizeEntries(arr){
  return Array.isArray(arr)?arr.flatMap(x=>expandNormalizedEntry(normalizeEntry(x))):[];
}

function eventRoleOf(event={}){
  const explicit=String(event.eventRole||event.role||"").trim().toLowerCase();
  const id=String(event.id||"");
  const name=String(event.name||"");
  const legacyActionId=/(?:^|-)act(?:-|\d|$)/i.test(id)||/(?:^|-)action(?:-|\d|$)/i.test(id);
  if(explicit==="exit")return"exit";
  if(explicit==="entry")return"entry";
  if(explicit==="story")return"story";
  if(explicit==="action")return"action";
  if(/^\s*EXIT(?:\s*[·:|\-]|\s|$)/i.test(name))return"exit";
  if(/^\s*ENTRY(?:\s*[·:|\-]|\s|$)/i.test(name))return"entry";
  if(/^\s*ACTION(?:\s*[·:|\-]|\s|$)/i.test(name))return"action";
  if(explicit==="talk"&&legacyActionId)return"action";
  if(!explicit&&legacyActionId)return"action";
  if(event.menuVisible===false)return"story";
  return"talk";
}
function isExitEvent(event){return eventRoleOf(event)==="exit"}
function isEntryEvent(event){return eventRoleOf(event)==="entry"}
function isStoryEvent(event){return eventRoleOf(event)==="story"}
function isActionEvent(event){return eventRoleOf(event)==="action"}
function normalizeEvent(e={}){
  const id=e.id||uid("event");
  const rawContinuation=Array.isArray(e.continuationEventIds)
    ? e.continuationEventIds
    : e.nextEventId ? [e.nextEventId] : [];
  const continuationEventIds=[...new Set(rawContinuation.map(String).filter(Boolean))].filter(x=>x!==id);
  const eventRole=eventRoleOf(e);
  return {
    id,
    name:e.name||"새 이벤트",
    characterId:e.characterId||"",
    eventRole,
    menuVisible:["talk","action"].includes(eventRole)?e.menuVisible!==false:false,
    randomEligible:e.randomEligible!==false,
    startMode:["PLAYER_ASK","CHARACTER_OPEN","EVENT"].includes(e.startMode)?e.startMode:"",
    sensitivity:["light","medium","high"].includes(e.sensitivity)?e.sensitivity:"",
    topicFamily:String(e.topicFamily||"").trim().slice(0,80),
    playerOrigins:Array.isArray(e.playerOrigins)
      ? [...new Set(e.playerOrigins.map(normalizeOrigin).filter(origin=>["sinner","hellborn","angel","winner"].includes(origin)))]
      : [],
    continuationEventIds,
    emotionExitMode:e.emotionExitMode==="reset"?"reset":"keep",
    entries:normalizeEntries(e.entries)
  };
}
function normalizeVariable(v={}){
  const type=["number","boolean","string"].includes(v.type)?v.type:"number";
  const out={id:v.id||uid("var"),name:v.name||"새 변수",type,defaultValue:v.defaultValue??(type==="boolean"?"false":"0")};
  if(type==="number"){
    if(Number.isFinite(Number(v.minValue)))out.minValue=Number(v.minValue);
    if(Number.isFinite(Number(v.maxValue)))out.maxValue=Number(v.maxValue);
  }
  return out;
}
function legacyInteractionEntries(type,text){
  if(!text)return[];
  return normalizeEntries([{
    type:type==="narration"?"narration":"dialogue",
    speaker:"",
    text:String(text),
    condition:null,
    effects:[],
    affectionCondition:null,
    affectionEffects:[],
    emotionCondition:null,
    emotionEffects:[]
  }]);
}
function normalizeAsk(a={}){
  let entries=normalizeEntries(a.entries);
  if(!entries.length&&a.reactionText){
    const legacy=legacyInteractionEntries(a.reactionType,a.reactionText);
    if(legacy.length)entries=legacy;
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
    unlockHint:String(a.unlockHint||""),
    repeatable:Boolean(a.repeatable),
    affectionDelta:clamp(a.affectionDelta ?? a.reactionAffectionDelta,-100,100,0),
    emotionState:EMOTIONS.some(x=>x[0]===a.emotionState) ? a.emotionState : "",
    emotionIntensity:clamp(a.emotionIntensity ?? a.reactionEmotionIntensity,0,100,0),
    entries,
    enabled:a.enabled!==false
  };
}
function normalizeItemReaction(r={},fallbackCharacterId=""){
  let entries=normalizeEntries(r.entries);
  if(!entries.length&&r.reactionText){
    const legacy=legacyInteractionEntries(r.reactionType,r.reactionText);
    if(legacy.length)entries=legacy;
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
    firstEntries:Array.isArray(r.firstEntries)?normalizeEntries(r.firstEntries):entries.map(x=>({...x})),
    repeatEntries:Array.isArray(r.repeatEntries)?normalizeEntries(r.repeatEntries):entries.map(x=>({...x})),
    specialEntries:Array.isArray(r.specialEntries)?normalizeEntries(r.specialEntries):[],
    specialMinAffection:clamp(r.specialMinAffection,0,100,0),
    specialEmotionState:EMOTIONS.some(x=>x[0]===r.specialEmotionState)?r.specialEmotionState:"",
    specialEmotionIntensity:clamp(r.specialEmotionIntensity,0,100,0)
  };
}
function normalizeItem(i={}){
  const collectionCharacterId=i.collectionCharacterId||i.ownerCharacterId||i.characterId||"";
  const archiveMeta=(typeof window!=="undefined"&&window.HV_ITEM_ARCHIVE_META?.[String(i.id||"")])||{};
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
    symbol:String(i.symbol||i.icon||archiveMeta.symbol||"🎁"),
    gachaLine:String(i.gachaLine||i.revealLine||archiveMeta.gachaLine||""),
    inventoryEventId:String(i.inventoryEventId||""),
    acquisitionMode:i.acquisitionMode==="unique"?"unique":"repeatable",
    giftUseMode:i.giftUseMode==="consume"?"consume":"keep",
    giftable:i.giftable!==false,
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

function isLegacyFullBackup(raw){
  return Boolean(
    raw&&typeof raw==="object"&&!raw.state&&
    Array.isArray(raw.characters)&&Array.isArray(raw.dialogues)&&
    (String(raw.backupFormat||"").startsWith("hellaverse-")||Number(raw.version)>=20)
  );
}
function legacySplitList(value){
  if(Array.isArray(value))return value.map(String).map(x=>x.trim()).filter(Boolean);
  return String(value||"").split(/[,;\n|]+/).map(x=>x.trim()).filter(Boolean);
}
function legacyEmotion(value){
  const key=String(value||"NORMAL").toUpperCase();
  const map={
    NORMAL:["calm",10],GOOD:["joy",35],EXCITED:["joy",60],ANNOYED:["angry",35],
    ANGRY:["angry",65],SAD:["sad",45],ANXIOUS:["anxious",45],CURIOUS:["curious",35],
    GUARDED:["guarded",40],EMBARRASSED:["embarrassed",40]
  };
  return map[key]||["calm",10];
}
function legacyOrigin(c){
  const group=String(c?.group||"").toUpperCase();
  const affiliations=Array.isArray(c?.affiliations)?c.affiliations.map(x=>String(x).toUpperCase()):[];
  if(group==="HEAVEN")return"angel";
  if(group==="HOTEL"&&affiliations.includes("HEAVEN"))return"angel";
  if(affiliations.includes("HEAVEN")&&!affiliations.includes("HELL"))return"angel";
  return"hellborn";
}
function legacyMarkupEntries(text){
  const value=String(text||"").trim();
  if(!value)return[];
  const re=/\[\[(CHARACTER|NARRATION)\]\]/g;
  const matches=[...value.matchAll(re)];
  if(!matches.length)return[{type:"dialogue",speaker:"",text:value}];
  const entries=[];
  const first=matches[0];
  if(first.index>0){
    const lead=value.slice(0,first.index).trim();
    if(lead)entries.push({type:"narration",text:lead});
  }
  matches.forEach((m,index)=>{
    const start=(m.index||0)+m[0].length;
    const end=index+1<matches.length?(matches[index+1].index||value.length):value.length;
    const chunk=value.slice(start,end).trim();
    if(!chunk)return;
    entries.push(m[1]==="NARRATION"
      ?{type:"narration",text:chunk}
      :{type:"dialogue",speaker:"",text:chunk});
  });
  return entries;
}
function legacyFlagEffects(setFlags,removeFlags){
  return [
    ...legacySplitList(setFlags).map(variableId=>({variableId,operation:"set",value:"true"})),
    ...legacySplitList(removeFlags).map(variableId=>({variableId,operation:"set",value:"false"}))
  ];
}
function legacyPreference(delta){
  const n=Number(delta)||0;
  if(n>=5)return"LOVED";
  if(n>=2)return"LIKED";
  if(n<=-4)return"HATED";
  if(n<0)return"DISLIKED";
  return"NEUTRAL";
}
function legacyChoiceOption(choice,characterId,nodeMap,tail,visited){
  let entries=legacyMarkupEntries(choice?.response);
  const fx=legacyFlagEffects(choice?.setFlags,choice?.removeFlags);
  if(fx.length){
    if(!entries.length)entries=[{type:"narration",text:"선택 결과가 적용되었다."}];
    entries[0].effects=fx;
  }
  const nextId=String(choice?.nextNodeId||"");
  if(nextId&&nodeMap.has(nextId)&&!visited.has(nextId)){
    const nextVisited=new Set(visited);nextVisited.add(nextId);
    entries.push(...legacyNodeEntries(nextId,characterId,nodeMap,tail,nextVisited));
  }else if(choice?.endConversation){
    entries.push(...clone(tail));
  }
  const option={
    id:String(choice?.id||uid("option")),
    label:String(choice?.text||choice?.playerLine||"선택"),
    entries,
    exitMode:choice?.endConversation&&!nextId?"end":"continue",
    targetEventId:""
  };
  const affectionDelta=Number(choice?.affectionDelta)||0;
  if(affectionDelta)option.affectionEffects=[{characterId,amount:affectionDelta}];
  if(choice?.moodChange){
    const [state,intensity]=legacyEmotion(choice.moodChange);
    option.emotionEffects=[{characterId,state,intensity}];
  }
  const min=Number(choice?.requiredAffection)||0;
  if(min>0)option.affectionCondition={characterId,operator:">=",value:min};
  const mood=String(choice?.requiredMood||"ANY").toUpperCase();
  if(mood!=="ANY"){
    const [state]=legacyEmotion(mood);
    option.emotionCondition={characterId,state,intensityOperator:">=",intensityValue:0};
  }
  const required=legacySplitList(choice?.requiredFlags);
  const blocked=legacySplitList(choice?.blockedFlags);
  if(required.length===1)option.condition={variableId:required[0],operator:"==",value:"true"};
  else if(!required.length&&blocked.length===1)option.condition={variableId:blocked[0],operator:"!=",value:"true"};
  return option;
}
function legacyNodeEntries(nodeId,characterId,nodeMap,tail,visited=new Set()){
  const node=nodeMap.get(nodeId);if(!node)return[];
  const entries=legacyMarkupEntries(node.text);
  const choices=Array.isArray(node.choices)?node.choices:[];
  if(choices.length){
    entries.push({
      type:"choice",
      prompt:"어떻게 반응할까?",
      options:choices.map(choice=>legacyChoiceOption(choice,characterId,nodeMap,tail,visited))
    });
  }
  return entries;
}
function legacyDialogueEntries(dialogue){
  const characterId=String(dialogue?.characterId||"");
  const tail=[
    ...legacyMarkupEntries(dialogue?.exitLine),
    ...legacyMarkupEntries(dialogue?.after)
  ];
  let entries=legacyMarkupEntries(dialogue?.opening);
  const nodes=Array.isArray(dialogue?.nodes)?dialogue.nodes:[];
  const nodeMap=new Map(nodes.filter(n=>n?.id).map(n=>[String(n.id),n]));
  const startId=String(dialogue?.openingNodeId||nodes[0]?.id||"");
  if(startId&&nodeMap.has(startId)){
    entries.push(...legacyNodeEntries(startId,characterId,nodeMap,tail,new Set([startId])));
  }else{
    entries.push(...tail);
  }
  if(!entries.some(e=>e.type==="choice"))entries.push(...tail);
  if(!entries.length)entries=[{type:"narration",text:String(dialogue?.title||"대화")}];

  const min=Number(dialogue?.requiredAffection)||0;
  const max=Number(dialogue?.maxAffection??100);
  const mood=String(dialogue?.requiredMood||"ANY").toUpperCase();
  const required=legacySplitList(dialogue?.requiredFlags);
  const blocked=legacySplitList(dialogue?.blockedFlags);
  entries.forEach(entry=>{
    if(min>0)entry.affectionCondition={characterId,operator:">=",value:min};
    else if(max<100)entry.affectionCondition={characterId,operator:"<=",value:max};
    if(mood!=="ANY"){
      const [state]=legacyEmotion(mood);
      entry.emotionCondition={characterId,state,intensityOperator:">=",intensityValue:0};
    }
    if(required.length===1)entry.condition={variableId:required[0],operator:"==",value:"true"};
    else if(!required.length&&blocked.length===1)entry.condition={variableId:blocked[0],operator:"!=",value:"true"};
  });
  return entries;
}
function legacyGiftFlow(gift,characterId){
  const entries=[
    ...legacyMarkupEntries(gift?.opening),
    ...legacyMarkupEntries(gift?.response)
  ];
  const fx=legacyFlagEffects(gift?.setFlags,gift?.removeFlags);
  if(fx.length){
    if(!entries.length)entries.push({type:"narration",text:"선물 반응"});
    entries[0].effects=fx;
  }
  const options=[];
  ["A","B"].forEach(key=>{
    const label=String(gift?.["choice"+key]||"").trim();
    if(!label)return;
    const option={
      label,
      entries:legacyMarkupEntries(gift?.["choice"+key+"Response"]),
      exitMode:"end",
      targetEventId:""
    };
    const delta=Number(gift?.["choice"+key+"Delta"])||0;
    if(delta)option.affectionEffects=[{characterId,amount:delta}];
    const optionFx=legacyFlagEffects(gift?.["choice"+key+"SetFlags"],gift?.["choice"+key+"RemoveFlags"]);
    if(optionFx.length)option.effects=optionFx;
    options.push(option);
  });
  if(options.length)entries.push({type:"choice",prompt:"어떻게 건넬까?",options});
  return entries.length?entries:[{type:"narration",text:String(gift?.name||"선물")}];
}
function migrateLegacyBackup(raw){
  if(!isLegacyFullBackup(raw))return null;
  const charactersRaw=Array.isArray(raw.characters)?raw.characters:[];
  const characterIds=new Set(charactersRaw.map(c=>String(c?.id||"")).filter(Boolean));
  const eventCatalog=new Map((Array.isArray(raw.events)?raw.events:[])
    .filter(e=>e?.id).map(e=>[String(e.id),e]));
  const variableIds=new Set([
    ...Object.keys(raw.flags&&typeof raw.flags==="object"?raw.flags:{}),
    ...eventCatalog.keys()
  ]);
  const rememberRefs=value=>legacySplitList(value).forEach(id=>variableIds.add(id));
  (Array.isArray(raw.dialogues)?raw.dialogues:[]).forEach(dialogue=>{
    rememberRefs(dialogue.requiredFlags);rememberRefs(dialogue.blockedFlags);
    (Array.isArray(dialogue.nodes)?dialogue.nodes:[]).forEach(node=>
      (Array.isArray(node.choices)?node.choices:[]).forEach(choice=>{
        rememberRefs(choice.requiredFlags);rememberRefs(choice.blockedFlags);
        rememberRefs(choice.setFlags);rememberRefs(choice.removeFlags);
      })
    );
  });
  (Array.isArray(raw.gifts)?raw.gifts:[]).forEach(gift=>{
    rememberRefs(gift.requiredFlags);rememberRefs(gift.blockedFlags);
    rememberRefs(gift.setFlags);rememberRefs(gift.removeFlags);
  });

  const variables=[...variableIds].sort().map(id=>({
    id,
    name:String(eventCatalog.get(id)?.name||id),
    type:"boolean",
    defaultValue:"false"
  }));
  const playVariables=Object.fromEntries([...variableIds].map(id=>[
    id,Boolean(raw.flags&&typeof raw.flags==="object"?raw.flags[id]:false)
  ]));

  const affectionRaw=raw.affection&&typeof raw.affection==="object"?raw.affection:{};
  const moodsRaw=raw.moods&&typeof raw.moods==="object"?raw.moods:{};
  const affection={};
  const emotions={};
  const characters=charactersRaw.filter(c=>c?.id).map(c=>{
    const id=String(c.id);
    const affectionSource=affectionRaw[id];
    const affectionValue=typeof affectionSource==="object"?affectionSource?.value:affectionSource;
    affection[id]=clamp(affectionValue,0,100,0);
    const [emotionState,emotionIntensity]=legacyEmotion(moodsRaw[id]||"NORMAL");
    emotions[id]={state:emotionState,intensity:emotionIntensity};
    return{
      id,
      name:String(c.name||id),
      origin:legacyOrigin(c),
      role:String(c.label||c.description||""),
      quote:String(c.status||c.description||""),
      image:String(c.image||""),
      imageScale:1,
      enabled:c.hidden!==true,
      affectionStart:0,
      emotionDefault:emotionState,
      emotionIntensity
    };
  });

  const events=[];
  const asks=[];
  const dialogues=Array.isArray(raw.dialogues)?raw.dialogues:[];
  dialogues.filter(d=>d?.id&&characterIds.has(String(d.characterId||""))).forEach(dialogue=>{
    const entries=legacyDialogueEntries(dialogue);
    if(String(dialogue.kind||"").toUpperCase()==="ASK"){
      const required=legacySplitList(dialogue.requiredFlags);
      const blocked=legacySplitList(dialogue.blockedFlags);
      const ask={
        id:String(dialogue.id),
        characterId:String(dialogue.characterId),
        label:String(dialogue.title||"질문"),
        minAffection:clamp(dialogue.requiredAffection,0,100,0),
        startLocked:false,
        affectionDelta:0,
        entries,
        enabled:true
      };
      if(required.length===1){
        ask.startLocked=true;
        ask.unlockCondition={variableId:required[0],operator:"==",value:"true"};
      }else if(!required.length&&blocked.length===1){
        ask.startLocked=true;
        ask.unlockCondition={variableId:blocked[0],operator:"!=",value:"true"};
      }
      const mood=String(dialogue.requiredMood||"ANY").toUpperCase();
      if(mood!=="ANY"){
        const [state]=legacyEmotion(mood);
        ask.startLocked=true;
        ask.unlockEmotionCondition={
          characterId:String(dialogue.characterId),
          state,
          intensityOperator:">=",
          intensityValue:0
        };
      }
      asks.push(ask);
    }else{
      const legacyKind=String(dialogue.kind||"TALK").toUpperCase();
      const legacySceneRole=String(dialogue.sceneRole||"").toUpperCase();
      const legacyEventRole=legacyKind==="EXIT"?"exit":legacyKind==="ENTRY"?"entry":legacySceneRole==="ACTION"?"action":"talk";
      events.push({
        id:String(dialogue.id),
        name:String((legacySceneRole==="ACTION"?"TALK":(dialogue.kind||"TALK"))+" · "+(dialogue.title||dialogue.id)),
        characterId:String(dialogue.characterId),
        eventRole:legacyEventRole,
        menuVisible:["talk","action"].includes(legacyEventRole),
        continuationEventIds:[],
        emotionExitMode:"keep",
        entries
      });
    }
  });

  const categoryMap=new Map((Array.isArray(raw.thoughtCategoryCatalog)?raw.thoughtCategoryCatalog:[])
    .filter(x=>x?.id).map(x=>[String(x.id),String(x.label||x.id)]));
  const thoughts=(Array.isArray(raw.thoughts)?raw.thoughts:[])
    .filter(t=>t?.id&&characterIds.has(String(t.characterId||"")))
    .map(t=>({
      id:String(t.id),
      characterId:String(t.characterId),
      category:categoryMap.get(String(t.category||""))||String(t.category||"일상"),
      rarity:RARITIES.includes(t.rarity)?t.rarity:"COMMON",
      frequency:["common","normal","rare"].includes(t.frequency)?t.frequency:"common",
      text:String(t.text||""),
      enabled:t.enabled!==false
    }));

  const itemsById=new Map();
  const addLegacyItem=(item,category="기념품",giftable=false)=>{
    if(!item?.id)return;
    const id=String(item.id);
    if(itemsById.has(id))return;
    itemsById.set(id,{
      id,
      name:String(item.name||"아이템"),
      category,
      rarity:RARITIES.includes(item.rarity)?item.rarity:"COMMON",
      collectionCharacterId:characterIds.has(String(item.characterId||""))?String(item.characterId):"",
      description:String(item.desc||item.description||item.gachaDescription||""),
      symbol:String(item.symbol||item.icon||""),
      gachaLine:String(item.gachaLine||item.revealLine||""),
      acquisitionMode:"repeatable",
      giftUseMode:giftable?"consume":"keep",
      giftable,
      secret:false,
      gachaEnabled:item.gachaEnabled!==false,
      enabled:item.enabled!==false,
      weight:Math.max(.01,Number(item.weight)||1),
      reactions:[]
    });
  };
  (Array.isArray(raw.items)?raw.items:[]).forEach(item=>addLegacyItem(item,"기념품",false));
  const inventoryV2=raw.inventoryV2&&typeof raw.inventoryV2==="object"?raw.inventoryV2:{};
  (Array.isArray(inventoryV2.basicItems)?inventoryV2.basicItems:[])
    .forEach(item=>addLegacyItem(item,"선물",true));

  (Array.isArray(raw.gifts)?raw.gifts:[]).forEach(gift=>{
    if(!gift?.id||!characterIds.has(String(gift.characterId||"")))return;
    const itemId="gift-item-"+String(gift.id);
    if(!itemsById.has(itemId)){
      addLegacyItem({
        id:itemId,
        name:gift.name,
        characterId:gift.characterId,
        desc:gift.shortDescription,
        rarity:"COMMON",
        gachaEnabled:false
      },"선물",true);
    }
    const item=itemsById.get(itemId);if(!item)return;
    const characterId=String(gift.characterId);
    const flow=legacyGiftFlow(gift,characterId);
    const [emotionState,emotionIntensity]=gift.moodChange?legacyEmotion(gift.moodChange):["",0];
    const reaction={
      id:"reaction-"+String(gift.id),
      characterId,
      preference:legacyPreference(gift.affectionDelta),
      affectionDelta:clamp(gift.affectionDelta,-100,100,0),
      emotionState,
      emotionIntensity,
      firstEntries:clone(flow),
      repeatEntries:clone(flow),
      specialEntries:[],
      specialMinAffection:0,
      specialEmotionState:"",
      specialEmotionIntensity:0
    };
    item.reactions=(item.reactions||[]).filter(r=>r.characterId!==characterId);
    item.reactions.push(reaction);
    item.giftable=true;
    item.giftUseMode="consume";
    if(item.category==="기념품"&&!item.gachaEnabled)item.category="선물";
  });

  const giftRules=inventoryV2.giftRules&&typeof inventoryV2.giftRules==="object"?inventoryV2.giftRules:{};
  Object.entries(giftRules).forEach(([itemId,targets])=>{
    const item=itemsById.get(itemId);
    if(!item||!targets||typeof targets!=="object")return;
    Object.entries(targets).forEach(([characterId,rule])=>{
      if(!characterIds.has(characterId)||!rule||typeof rule!=="object")return;
      const entries=[
        ...legacyMarkupEntries(rule.opening),
        ...legacyMarkupEntries(rule.response)
      ];
      const approaches=Array.isArray(rule.approaches)?rule.approaches:[];
      if(approaches.length){
        entries.push({
          type:"choice",
          prompt:"어떻게 건넬까?",
          options:approaches.map(approach=>{
            const option={
              label:String(approach.label||approach.playerLine||"선택"),
              entries:legacyMarkupEntries(approach.response),
              exitMode:"end",
              targetEventId:""
            };
            const delta=Number(approach.affectionDelta)||0;
            if(delta)option.affectionEffects=[{characterId,amount:delta}];
            return option;
          })
        });
      }
      const fx=legacyFlagEffects(rule.setFlags,rule.removeFlags);
      if(fx.length){
        if(!entries.length)entries.push({type:"narration",text:"선물 반응"});
        entries[0].effects=fx;
      }
      const [emotionState,emotionIntensity]=rule.moodChange?legacyEmotion(rule.moodChange):["",0];
      const reaction={
        id:"reaction-v2-"+itemId+"-"+characterId,
        characterId,
        preference:GIFT_PREFERENCES.some(x=>x[0]===rule.preference)?rule.preference:legacyPreference(rule.affectionDelta),
        affectionDelta:clamp(rule.affectionDelta,-100,100,0),
        emotionState,
        emotionIntensity,
        firstEntries:clone(entries.length?entries:[{type:"narration",text:"선물 반응"}]),
        repeatEntries:clone(entries.length?entries:[{type:"narration",text:"선물 반응"}]),
        specialEntries:[],
        specialMinAffection:0,
        specialEmotionState:"",
        specialEmotionIntensity:0
      };
      item.reactions=(item.reactions||[]).filter(r=>r.characterId!==characterId);
      item.reactions.push(reaction);
      item.giftable=true;
      item.giftUseMode="consume";
    });
  });

  const inventoryCounts={};
  const mergeCounts=source=>{
    if(!source||typeof source!=="object")return;
    Object.entries(source).forEach(([id,value])=>{
      inventoryCounts[id]=Math.max(Number(inventoryCounts[id])||0,Math.max(0,Number(value)||0));
    });
  };
  mergeCounts(raw.inventoryV1?.counts);
  mergeCounts(inventoryV2.counts);
  mergeCounts(raw.giftInventory?.ownedCounts);

  const itemHistory=[];
  const boxHistory=Array.isArray(raw.box?.history)?raw.box.history:[];
  boxHistory.forEach(row=>{
    if(!row?.itemId)return;
    inventoryCounts[row.itemId]=Math.max(Number(inventoryCounts[row.itemId])||0,1);
    itemHistory.push({itemId:String(row.itemId),source:"GACHA",amount:1,at:0});
  });
  if(inventoryV2.dialogueAcquired&&typeof inventoryV2.dialogueAcquired==="object"){
    Object.entries(inventoryV2.dialogueAcquired).forEach(([key,value])=>{
      const itemId=String(key).split(":")[0];
      inventoryCounts[itemId]=Math.max(Number(inventoryCounts[itemId])||0,1);
      const parsed=Date.parse(value);
      itemHistory.push({itemId,source:"DIALOGUE",amount:1,at:Number.isFinite(parsed)?parsed:0});
    });
  }

  const discoveredGiftReactionKeys=[];
  const giftInteractionCounts={};
  const interactionHistory=[];
  (Array.isArray(raw.giftUseHistory)?raw.giftUseHistory:[]).forEach((row,index)=>{
    const itemId="gift-item-"+String(row?.giftId||"");
    const characterId=String(row?.characterId||"");
    if(!itemsById.has(itemId)||!characterIds.has(characterId))return;
    const key=itemId+"::"+characterId;
    if(!discoveredGiftReactionKeys.includes(key))discoveredGiftReactionKeys.push(key);
    giftInteractionCounts[key]=(Number(giftInteractionCounts[key])||0)+1;
    const parsed=Date.parse(row.at);
    interactionHistory.push({
      id:String(row.id||"legacy-gift-"+index),
      at:Number.isFinite(parsed)?parsed:0,
      kind:"gift",
      characterId,
      itemId,
      label:String(itemsById.get(itemId)?.name||itemId),
      preference:String(row.preference||""),
      flowType:"legacy"
    });
  });

  const log=[];
  (Array.isArray(raw.conversationHistory)?raw.conversationHistory:[]).forEach(conversation=>{
    (Array.isArray(conversation?.messages)?conversation.messages:[]).forEach(message=>{
      log.push({
        kind:message?.type==="narration"?"narration":"dialogue",
        speaker:String(message?.speaker||""),
        text:String(message?.text||"").replace(/\[\[(CHARACTER|NARRATION)\]\]\s*/g,""),
        eventName:String(conversation?.sceneTitle||"")
      });
    });
  });

  const seenSceneIds=new Set();
  const progressCharacters=raw.conversationProgress?.characters;
  if(progressCharacters&&typeof progressCharacters==="object"){
    Object.values(progressCharacters).forEach(info=>{
      if(!info||typeof info!=="object")return;
      (Array.isArray(info.seenSceneIds)?info.seenSceneIds:[]).forEach(id=>seenSceneIds.add(String(id)));
    });
  }
  const askIdSet=new Set(asks.map(a=>a.id));
  const askedAskIds=[...seenSceneIds].filter(id=>askIdSet.has(id));

  const thoughtCategories=[];
  (Array.isArray(raw.thoughtCategoryCatalog)?raw.thoughtCategoryCatalog:[]).forEach(row=>{
    const label=String(row?.label||"").trim();
    if(label&&!thoughtCategories.includes(label))thoughtCategories.push(label);
  });
  (Array.isArray(raw.thoughtCategories)?raw.thoughtCategories:[]).forEach(row=>{
    const label=String(row||"").trim();
    if(label&&!thoughtCategories.includes(label))thoughtCategories.push(label);
  });

  const originMap={ANGEL:"angel",WINNER:"winner",HELLBORN:"hellborn",SINNER:"sinner"};
  const playerOrigin=String(raw.player?.origin||"").toUpperCase();
  const migrated={
    profile:{
      name:String(raw.player?.name||""),
      origin:originMap[playerOrigin]||""
    },
    favoriteCharacterIds:[],
    playState:{
      variables:playVariables,
      affection,
      emotions,
      log:log.slice(-200)
    },
    characters,
    events,
    variables,
    asks,
    items:[...itemsById.values()],
    itemCategories:["기념품","선물","기타"],
    inventoryCounts,
    newItemIds:(Array.isArray(raw.newCollectionItems)?raw.newCollectionItems:[]).map(String),
    itemHistory:itemHistory.slice(-500),
    discoveredGiftReactionKeys,
    giftInteractionCounts,
    askedAskIds,
    unlockedAskIds:[],
    interactionHistory:interactionHistory.slice(-500),
    collectionSettings:{showLocked:true,showOwnedCount:true,view:"grouped",sort:"recent",expandedCharacterIds:[]},
    thoughts,
    thoughtSettings:{categories:thoughtCategories.length?thoughtCategories:["일상","관계","과거","천국","지옥","비밀"]},
    gacha:{
      enabled:true,
      currencyName:"SOUL",
      balance:Math.max(0,Number(raw.points)||0),
      singleCost:10,
      tenCost:90,
      rarityWeights:{COMMON:50,UNCOMMON:28,RARE:14,EPIC:7,LEGENDARY:3,MISTIC:1},
      history:[]
    },
    discoveredThoughtIds:(Array.isArray(raw.seenThoughtIds)?raw.seenThoughtIds:[]).map(String)
  };
  const state=normalizeState(migrated);
  return{
    state,
    report:{
      legacyVersion:Number(raw.version)||0,
      backupFormat:String(raw.backupFormat||"legacy"),
      characters:state.characters.length,
      dialogueEvents:state.events.length,
      asks:state.asks.length,
      items:state.items.length,
      thoughts:state.thoughts.length,
      variables:state.variables.length,
      sourceDialogues:dialogues.length,
      ignoredLegacyEventCatalog:Array.isArray(raw.events)?raw.events.length:0
    }
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
    })):[],
    recentTalks:p.recentTalks&&typeof p.recentTalks==="object"
      ? Object.fromEntries(Object.entries(p.recentTalks).map(([characterId,ids])=>[
          String(characterId),
          Array.isArray(ids)?[...new Set(ids.map(String).filter(Boolean))].slice(-3):[]
        ]).filter(([,ids])=>ids.length))
      : {},
    selectedOptionIds:Array.isArray(p.selectedOptionIds)?[...new Set(p.selectedOptionIds.map(String).filter(Boolean))].slice(-5000):[]
  };
}
function migrateStateV1ToV2(source){
  const s={...source};
  s.playState=s.playState&&typeof s.playState==="object"?s.playState:{variables:{},affection:{},emotions:{},log:[]};
  s.favoriteCharacterIds=Array.isArray(s.favoriteCharacterIds)?s.favoriteCharacterIds:[];
  s.collectionSettings=s.collectionSettings&&typeof s.collectionSettings==="object"
    ? s.collectionSettings
    : {showLocked:true,showOwnedCount:true,view:"grouped",sort:"recent"};
  s.schemaVersion=2;
  return s;
}
function migrateStateV2ToV3(source){
  const s={...source};
  if(Array.isArray(s.items)){
    s.items=s.items.map(item=>({
      ...item,
      giftable:item?.giftable!==false
    }));
  }
  s.schemaVersion=3;
  return s;
}
function migrateStateV3ToV4(source){
  const s={...source};
  if(Array.isArray(s.events)){
    s.events=s.events.map(event=>{
      const next=event&&typeof event==="object"?event:{};
      const continuationEventIds=Array.isArray(next.continuationEventIds)
        ? next.continuationEventIds
        : next.nextEventId ? [next.nextEventId] : [];
      const migrated={...next,continuationEventIds};
      delete migrated.nextEventId;
      return migrated;
    });
  }
  s.schemaVersion=4;
  return s;
}
function migrateStateSchema(raw){
  let s=raw&&typeof raw==="object"?raw:{};
  let version=Math.max(1,Number(s.schemaVersion)||1);
  if(version<2){s=migrateStateV1ToV2(s);version=2}
  if(version<3){s=migrateStateV2ToV3(s);version=3}
  if(version<4){s=migrateStateV3ToV4(s);version=4}
  if(version>CURRENT_SCHEMA_VERSION){
    console.warn("Hellaverse data schema is newer than this build",{version,current:CURRENT_SCHEMA_VERSION});
  }
  return {...s,schemaVersion:CURRENT_SCHEMA_VERSION};
}

function purgeRetiredCharacterContent(source){
  if(!source||typeof source!=="object")return source;

  const removedEventIds=new Set((source.events||[])
    .filter(event=>isRetiredCharacterId(event?.characterId)||hasRetiredCharacterReference(event?.id))
    .map(event=>String(event.id||"")).filter(Boolean));
  const removedAskIds=new Set((source.asks||[])
    .filter(ask=>isRetiredCharacterId(ask?.characterId)||hasRetiredCharacterReference(ask?.id))
    .map(ask=>String(ask.id||"")).filter(Boolean));
  const removedThoughtIds=new Set((source.thoughts||[])
    .filter(thought=>isRetiredCharacterId(thought?.characterId)||hasRetiredCharacterReference(thought?.id))
    .map(thought=>String(thought.id||"")).filter(Boolean));
  const removedItemIds=new Set((source.items||[])
    .filter(item=>isRetiredCharacterId(item?.collectionCharacterId)||hasRetiredCharacterReference(item?.id)||hasRetiredCharacterReference(item?.name))
    .map(item=>String(item.id||"")).filter(Boolean));
  const removedItemList=[...removedItemIds];
  const referencesRemovedItem=value=>{
    const text=String(value||"");
    return removedItemList.some(id=>text===id||text.startsWith(id+"::")||text.includes(id));
  };
  const keepCharacterId=id=>!isRetiredCharacterId(id);
  const keepRetiredRef=value=>!hasRetiredCharacterReference(value);
  const cleanRecord=record=>Object.fromEntries(Object.entries(record&&typeof record==="object"?record:{}).filter(([key])=>keepCharacterId(key)&&keepRetiredRef(key)));

  source.characters=(source.characters||[]).filter(character=>keepCharacterId(character?.id));
  source.events=(source.events||[]).filter(event=>!removedEventIds.has(String(event?.id||""))&&keepCharacterId(event?.characterId));
  source.asks=(source.asks||[]).filter(ask=>!removedAskIds.has(String(ask?.id||""))&&keepCharacterId(ask?.characterId));
  source.thoughts=(source.thoughts||[]).filter(thought=>!removedThoughtIds.has(String(thought?.id||""))&&keepCharacterId(thought?.characterId));
  source.variables=(source.variables||[]).filter(variable=>keepRetiredRef(variable?.id));
  source.items=(source.items||[])
    .filter(item=>!removedItemIds.has(String(item?.id||""))&&keepCharacterId(item?.collectionCharacterId))
    .map(item=>({...item,reactions:(item.reactions||[]).filter(reaction=>keepCharacterId(reaction?.characterId)&&keepRetiredRef(reaction?.id))}));

  source.storyPackVersions=Object.fromEntries(Object.entries(source.storyPackVersions||{}).filter(([id])=>keepRetiredRef(id)));
  source.favoriteCharacterIds=(source.favoriteCharacterIds||[]).filter(keepCharacterId);
  source.seenOriginIntroCharacterIds=(source.seenOriginIntroCharacterIds||[]).filter(keepCharacterId);
  source.discoveredTalkIds=(source.discoveredTalkIds||[]).filter(id=>!removedEventIds.has(String(id))&&keepRetiredRef(id));
  source.askedAskIds=(source.askedAskIds||[]).filter(id=>!removedAskIds.has(String(id))&&keepRetiredRef(id));
  source.unlockedAskIds=(source.unlockedAskIds||[]).filter(id=>!removedAskIds.has(String(id))&&keepRetiredRef(id));
  source.discoveredThoughtIds=(source.discoveredThoughtIds||[]).filter(id=>!removedThoughtIds.has(String(id))&&keepRetiredRef(id));

  source.inventoryCounts=Object.fromEntries(Object.entries(source.inventoryCounts||{}).filter(([id])=>!removedItemIds.has(id)&&keepRetiredRef(id)));
  source.newItemIds=(source.newItemIds||[]).filter(id=>!removedItemIds.has(String(id))&&keepRetiredRef(id));
  source.itemHistory=(source.itemHistory||[]).filter(row=>!removedItemIds.has(String(row?.itemId||""))&&!referencesRemovedItem(row?.itemId)&&keepRetiredRef(row?.itemId));
  source.discoveredGiftReactionKeys=(source.discoveredGiftReactionKeys||[]).filter(key=>!referencesRemovedItem(key)&&keepRetiredRef(key));
  source.discoveredSpecialGiftKeys=(source.discoveredSpecialGiftKeys||[]).filter(key=>!referencesRemovedItem(key)&&keepRetiredRef(key));
  source.giftInteractionCounts=Object.fromEntries(Object.entries(source.giftInteractionCounts||{}).filter(([key])=>!referencesRemovedItem(key)&&keepRetiredRef(key)));
  source.claimedItemEffectIds=(source.claimedItemEffectIds||[]).filter(id=>!referencesRemovedItem(id)&&keepRetiredRef(id));
  source.interactionHistory=(source.interactionHistory||[]).filter(row=>
    keepCharacterId(row?.characterId)&&
    !removedItemIds.has(String(row?.itemId||""))&&
    !removedAskIds.has(String(row?.askId||""))&&
    keepRetiredRef(row?.itemId)&&keepRetiredRef(row?.askId)
  );

  source.collectionSettings ||= {};
  source.collectionSettings.expandedCharacterIds=(source.collectionSettings.expandedCharacterIds||[]).filter(keepCharacterId);

  source.playState ||= {variables:{},affection:{},emotions:{},log:[],recentTalks:{}};
  source.playState.variables=Object.fromEntries(Object.entries(source.playState.variables||{}).filter(([id])=>keepRetiredRef(id)));
  source.playState.affection=cleanRecord(source.playState.affection);
  source.playState.emotions=cleanRecord(source.playState.emotions);
  source.playState.recentTalks=Object.fromEntries(Object.entries(source.playState.recentTalks||{})
    .filter(([characterId])=>keepCharacterId(characterId))
    .map(([characterId,ids])=>[characterId,(Array.isArray(ids)?ids:[]).filter(id=>!removedEventIds.has(String(id))&&keepRetiredRef(id))]));
  source.playState.log=(source.playState.log||[]).filter(row=>
    keepRetiredRef(row?.speaker)&&keepRetiredRef(row?.text)&&keepRetiredRef(row?.eventName)
  );

  source.gacha ||= {};
  source.gacha.history=(source.gacha.history||[]).filter(row=>
    !removedItemIds.has(String(row?.itemId||""))&&
    !referencesRemovedItem(row?.itemId)&&
    keepRetiredRef(row?.itemId)&&
    keepRetiredRef(row?.name)
  );

  return source;
}

function normalizeState(raw){
  const d=defaultState();
  const s=migrateStateSchema(raw);
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
  const normalized={
    schemaVersion:CURRENT_SCHEMA_VERSION,
    storyPackVersions:s.storyPackVersions&&typeof s.storyPackVersions==="object"
      ? Object.fromEntries(Object.entries(s.storyPackVersions).map(([id,version])=>[String(id),Math.max(0,Number(version)||0)]))
      : {},
    itemPresetVersion:Math.max(0,Number(s.itemPresetVersion)||0),
    dialoguePresetVersion:Math.max(0,Number(s.dialoguePresetVersion)||0),
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
    discoveredSpecialGiftKeys:Array.isArray(s.discoveredSpecialGiftKeys)?[...new Set(s.discoveredSpecialGiftKeys.map(String))]:[],
    giftInteractionCounts:s.giftInteractionCounts&&typeof s.giftInteractionCounts==="object"
      ? Object.fromEntries(Object.entries(s.giftInteractionCounts).map(([k,v])=>[k,Math.max(0,Number(v)||0)]))
      : {},
    discoveredTalkIds:Array.isArray(s.discoveredTalkIds)?[...new Set(s.discoveredTalkIds.map(String))]:[],
    seenOriginIntroCharacterIds:Array.isArray(s.seenOriginIntroCharacterIds)?[...new Set(s.seenOriginIntroCharacterIds.map(String))]:[],
    askedAskIds:Array.isArray(s.askedAskIds)?[...new Set(s.askedAskIds.map(String))]:[],
    unlockedAskIds:Array.isArray(s.unlockedAskIds)?[...new Set(s.unlockedAskIds.map(String))]:[],
    interactionHistory:Array.isArray(s.interactionHistory)?s.interactionHistory.slice(-500):[],
    claimedItemEffectIds:Array.isArray(s.claimedItemEffectIds)?[...new Set(s.claimedItemEffectIds.map(String))]:[],
    collectionSettings:{
      showLocked:s.collectionSettings?.showLocked!==false,
      showOwnedCount:s.collectionSettings?.showOwnedCount!==false,
      view:s.collectionSettings?.view==="all"?"all":"grouped",
      sort:["recent","rarity","name","count"].includes(s.collectionSettings?.sort)?s.collectionSettings.sort:"recent",
      expandedCharacterIds:Array.isArray(s.collectionSettings?.expandedCharacterIds)?[...new Set(s.collectionSettings.expandedCharacterIds.map(String))]:[]
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
  return purgeRetiredCharacterContent(normalized);
}
function storyPackCharacterKey(value){
  return String(value||"").trim().toLowerCase().replace(/[^a-z0-9가-힣]+/g,"");
}
function resolveStoryPackCharacterRefs(pack,source){
  const resolved={};
  const refs=pack?.characterRefs&&typeof pack.characterRefs==="object"?pack.characterRefs:{};
  for(const [token,aliases] of Object.entries(refs)){
    const candidates=[token,...(Array.isArray(aliases)?aliases:[aliases])].filter(Boolean);
    const keys=new Set(candidates.map(storyPackCharacterKey));
    const match=(source.characters||[]).find(character=>
      keys.has(storyPackCharacterKey(character.id))||
      keys.has(storyPackCharacterKey(character.name))
    );
    if(match)resolved[token]=match.id;
  }
  return resolved;
}
function remapStoryPackRefs(value,refs){
  if(typeof value==="string")return refs[value]||value;
  if(Array.isArray(value))return value.map(item=>remapStoryPackRefs(item,refs));
  if(value&&typeof value==="object"){
    return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,remapStoryPackRefs(item,refs)]));
  }
  return value;
}
function installStoryPacks(source){
  const installed=[];
  let changed=false;
  source.storyPackVersions ||= {};
  STORY_PACKS.forEach(rawPack=>{
    if(!rawPack?.id)return;
    const version=Math.max(1,Number(rawPack.version)||1);
    const previousVersion=Math.max(0,Number(source.storyPackVersions[rawPack.id])||0);
    const isPoolTalkPack=String(rawPack.id||"").startsWith("pooltalk-52-");

    const staleTalkPattern=/(?:오늘은 가볍게요|딱 한마디만요|답게 한마디|직접 보면 생각이 좀 달라질까요|한마디 의견 정도면 충분|우연히 나온 한마디가 .*대화의 시작|네가 .*에 대한 이야기를 꺼내자|그 반응이면 .*상황에서 괜히 더 물으면)/;
    const entryHasStaleTalk=entries=>{
      for(const entry of entries||[]){
        if(staleTalkPattern.test(String(entry?.text||"")))return true;
        if(entry?.type==="choice"){
          for(const option of entry.options||[]){
            if(staleTalkPattern.test(String(option?.label||"")))return true;
            if(entryHasStaleTalk(option?.entries))return true;
          }
        }
      }
      return false;
    };
    const rawPoolTalkNames=new Set((rawPack.events||[]).map(event=>String(event?.name||"")).filter(Boolean));
    const rawPoolTalkCharacterIds=new Set((rawPack.requiredCharacterIds||[]).map(String).filter(Boolean));
    const poolTalkNeedsRepair=isPoolTalkPack&&(source.events||[]).some(event=>{
      const id=String(event?.id||"");
      const name=String(event?.name||"");
      const characterId=String(event?.characterId||"");
      const belongsToPack=rawPoolTalkNames.has(name)||
        (id.startsWith("pooltalk-")&&(!rawPoolTalkCharacterIds.size||rawPoolTalkCharacterIds.has(characterId)));
      if(!belongsToPack)return false;
      return entryHasStaleTalk(event?.entries)||
        (event?.entries||[]).some(entry=>entry?.type==="dialogue"&&entry?.speaker==="PLAYER");
    });

    if(previousVersion>=version&&!poolTalkNeedsRepair&&!isPoolTalkPack)return;
    const isUpgrade=previousVersion>0||poolTalkNeedsRepair;

    const refs=resolveStoryPackCharacterRefs(rawPack,source);
    const requiredRefs=Array.isArray(rawPack.requiredCharacterRefs)?rawPack.requiredCharacterRefs:[];
    if(requiredRefs.some(token=>!refs[token]))return;
    const pack=remapStoryPackRefs(rawPack,refs);

    const characterIds=new Set((source.characters||[]).map(character=>character.id));
    const required=Array.isArray(pack.requiredCharacterIds)?pack.requiredCharacterIds:[];
    if(required.some(isRetiredCharacterId))return;
    if(required.some(id=>!characterIds.has(id)))return;

    if(isPoolTalkPack){
      const currentEvents=Array.isArray(pack.events)?pack.events:[];
      const currentIds=new Set(currentEvents.map(event=>String(event?.id||"")).filter(Boolean));
      const managedCharacters=new Set(required.map(String));
      const normalizedCurrent=currentEvents.map(normalizeEvent);
      const normalizedById=new Map(normalizedCurrent.map(event=>[String(event.id||""),event]));

      const kept=[];
      let poolChanged=false;
      for(const event of source.events||[]){
        const id=String(event?.id||"");
        const characterId=String(event?.characterId||"");
        const currentManaged=currentIds.has(id)&&managedCharacters.has(characterId);
        const retiredGenerated=managedCharacters.has(characterId)&&id.startsWith("pooltalk-")&&!currentIds.has(id);

        if(currentManaged){
          const fresh=normalizedById.get(id);
          if(JSON.stringify(event)!==JSON.stringify(fresh))poolChanged=true;
          kept.push(fresh);
          normalizedById.delete(id);
          continue;
        }
        if(retiredGenerated){
          poolChanged=true;
          continue;
        }
        kept.push(event);
      }
      for(const fresh of normalizedById.values()){
        kept.push(fresh);
        poolChanged=true;
      }
      source.events=kept;
      if(poolChanged)changed=true;

      // Pool TALK packs can define state variables used by choice effects.
      // Install/sync them before returning so editor validation and runtime
      // can resolve every variableId referenced by the TALK branches.
      for(const variable of pack.variables||[]){
        const normalizedVariable=normalizeVariable(variable);
        const variableIndex=(source.variables||[]).findIndex(row=>row?.id===normalizedVariable.id);
        if(variableIndex<0){
          source.variables.push(normalizedVariable);
          changed=true;
        }else if(JSON.stringify(source.variables[variableIndex])!==JSON.stringify(normalizedVariable)){
          source.variables[variableIndex]=normalizedVariable;
          changed=true;
        }
      }

      source.storyPackVersions[pack.id]=version;
      installed.push(pack.id);
      if(previousVersion!==version)changed=true;
      return;
    }

    const upsertById=(list,item,normalizer)=>{
      const index=(list||[]).findIndex(row=>row?.id===item?.id);
      if(index<0){
        list.push(normalizer(item));
        changed=true;
        return;
      }
      if(isUpgrade){
        list[index]=normalizer(item);
        changed=true;
      }
    };



    (pack.variables||[]).forEach(variable=>upsertById(source.variables,variable,normalizeVariable));
    (pack.events||[]).forEach(event=>upsertById(source.events,event,normalizeEvent));
    (pack.asks||[]).forEach(ask=>upsertById(source.asks,ask,normalizeAsk));

    source.storyPackVersions[pack.id]=version;
    installed.push(pack.id);
    changed=true;
  });
  // One-time migration for obsolete generated TALK content.
  // It must NOT keep deleting events on every refresh; that made event counts drift downward.
  source.maintenanceVersions ||= {};
  const legacyTalkCleanupVersion=1;
  if((Number(source.maintenanceVersions.legacyGeneratedTalkCleanup)||0)<legacyTalkCleanupVersion){
    const managedEventIds=new Set();
    const managedEventNames=new Set();
    for(const pack of STORY_PACKS){
      for(const event of pack?.events||[]){
        if(event?.id)managedEventIds.add(String(event.id));
        if(event?.name)managedEventNames.add(String(event.name));
      }
    }
    const legacyGeneratedTalkPattern=/(?:괜찮으면 조금 더 얘기해주세요|괜찮으면 조금 더|웃기게 들려도,\s*그건 내가 꽤 진지하게 신경 쓰는 부분이야|오늘은 가볍게요|딱 한마디만요|답게 한마디|직접 보면 생각이 좀 달라질까요|한마디 의견 정도면 충분|우연히 나온 한마디가 .*대화의 시작|네가 .*에 대한 이야기를 꺼내자|그 반응이면 .*상황에서 괜히 더 물으면)/;
    const inspectLegacyTalk=(entries,info={texts:[],hasChoice:false,legacy:false})=>{
      for(const entry of entries||[]){
        const text=String(entry?.text||"");
        if(legacyGeneratedTalkPattern.test(text))info.legacy=true;
        if(entry?.type==="dialogue"&&entry?.speaker!=="PLAYER"&&text)info.texts.push(text);
        if(entry?.type==="choice"){
          info.hasChoice=true;
          if(legacyGeneratedTalkPattern.test(String(entry?.prompt||"")))info.legacy=true;
          for(const option of entry.options||[]){
            if(legacyGeneratedTalkPattern.test(String(option?.label||"")))info.legacy=true;
            inspectLegacyTalk(option?.entries,info);
          }
        }
      }
      return info;
    };
    const beforeLegacyTalkCleanup=(source.events||[]).length;
    source.events=(source.events||[]).filter(event=>{
      const id=String(event?.id||"");
      const name=String(event?.name||"");
      if(!name.startsWith("TALK · "))return true;
      if(managedEventIds.has(id)||managedEventNames.has(name))return true;
      const info=inspectLegacyTalk(event?.entries);
      const counts=new Map();
      for(const line of info.texts)counts.set(line,(counts.get(line)||0)+1);
      const repeatedCharacterLine=[...counts.values()].some(count=>count>1);
      return !(info.legacy||(info.hasChoice&&repeatedCharacterLine));
    });
    if(source.events.length!==beforeLegacyTalkCleanup)changed=true;
    source.maintenanceVersions.legacyGeneratedTalkCleanup=legacyTalkCleanupVersion;
    changed=true;
  }

  if(typeof window.HV_APPLY_ITEM_PRESETS==="function"){
    const presetResult=window.HV_APPLY_ITEM_PRESETS(source,{normalizeItemReaction,normalizeEntry});
    if(presetResult?.state)source=presetResult.state;
    if(presetResult?.changed)changed=true;
  }
  if(typeof window.HV_APPLY_DIALOGUE_PRESETS==="function"){
    const presetResult=window.HV_APPLY_DIALOGUE_PRESETS(source,{
      normalizeEntry,normalizeEvent,normalizeVariable,normalizeItemEffects
    });
    if(presetResult?.state)source=presetResult.state;
    if(presetResult?.changed)changed=true;
  }
  return{state:source,changed,installed};
}
function compactOwnerForStorage(source,target){
  for(const key of ["condition","itemCondition","askCondition","affectionCondition","emotionCondition"]){
    if(source?.[key])target[key]=source[key];
  }
  for(const key of ["effects","itemEffects","affectionEffects","emotionEffects"]){
    if(Array.isArray(source?.[key])&&source[key].length)target[key]=source[key];
  }
  return target;
}
function compactEntryForStorage(entry={}){
  const out={id:entry.id,type:entry.type};
  if(entry.type==="dialogue"){
    if(entry.speaker)out.speaker=entry.speaker;
    if(entry.speakerCharacterId)out.speakerCharacterId=entry.speakerCharacterId;
    if(entry.text)out.text=entry.text;
  }else if(entry.type==="narration"){
    if(entry.text)out.text=entry.text;
    if(entry.narrationRole)out.narrationRole=entry.narrationRole;
  }else if(entry.type==="choice"){
    if(entry.prompt)out.prompt=entry.prompt;
    out.options=(entry.options||[]).map(compactOptionForStorage);
  }
  return compactOwnerForStorage(entry,out);
}
function compactOptionForStorage(option={}){
  const out={id:option.id,label:option.label||""};
  if(option.tone&&option.tone!=="neutral")out.tone=option.tone;
  if(Array.isArray(option.entries)&&option.entries.length)out.entries=option.entries.map(compactEntryForStorage);
  if(option.exitMode==="end")out.exitMode="end";
  if(option.targetEventId)out.targetEventId=option.targetEventId;
  return compactOwnerForStorage(option,out);
}
function compactEventForStorage(event={}){
  const out={
    id:event.id,
    name:event.name,
    characterId:event.characterId,
    entries:(event.entries||[]).map(compactEntryForStorage)
  };
  if(Array.isArray(event.continuationEventIds)&&event.continuationEventIds.length){
    out.continuationEventIds=[...event.continuationEventIds];
  }
  if(["exit","entry","story","action"].includes(event.eventRole))out.eventRole=event.eventRole;
  if(event.menuVisible===false)out.menuVisible=false;
  if(event.randomEligible===false)out.randomEligible=false;
  if(event.startMode)out.startMode=event.startMode;
  if(event.sensitivity)out.sensitivity=event.sensitivity;
  if(event.topicFamily)out.topicFamily=event.topicFamily;
  if(event.emotionExitMode==="reset")out.emotionExitMode="reset";
  return out;
}
function compactAskForStorage(ask={}){
  const out={
    id:ask.id,
    characterId:ask.characterId,
    label:ask.label||"",
    entries:(ask.entries||[]).map(compactEntryForStorage)
  };
  if(ask.minAffection)out.minAffection=ask.minAffection;
  if(ask.startLocked)out.startLocked=true;
  if(ask.unlockMinAffection)out.unlockMinAffection=ask.unlockMinAffection;
  if(ask.unlockCondition)out.unlockCondition=ask.unlockCondition;
  if(ask.unlockItemCondition)out.unlockItemCondition=ask.unlockItemCondition;
  if(ask.unlockAskCondition)out.unlockAskCondition=ask.unlockAskCondition;
  if(ask.unlockEmotionCondition)out.unlockEmotionCondition=ask.unlockEmotionCondition;
  if(ask.unlockHint)out.unlockHint=ask.unlockHint;
  if(ask.repeatable)out.repeatable=true;
  if(ask.affectionDelta)out.affectionDelta=ask.affectionDelta;
  if(ask.emotionState)out.emotionState=ask.emotionState;
  if(ask.emotionIntensity)out.emotionIntensity=ask.emotionIntensity;
  if(ask.enabled===false)out.enabled=false;
  return out;
}
function compactReactionForStorage(reaction={}){
  const out={
    id:reaction.id,
    characterId:reaction.characterId,
    preference:reaction.preference||"NEUTRAL"
  };
  if(reaction.affectionDelta)out.affectionDelta=reaction.affectionDelta;
  if(reaction.emotionState)out.emotionState=reaction.emotionState;
  if(reaction.emotionIntensity)out.emotionIntensity=reaction.emotionIntensity;
  if(Array.isArray(reaction.firstEntries)&&reaction.firstEntries.length)out.firstEntries=reaction.firstEntries.map(compactEntryForStorage);
  if(Array.isArray(reaction.repeatEntries)&&reaction.repeatEntries.length)out.repeatEntries=reaction.repeatEntries.map(compactEntryForStorage);
  if(Array.isArray(reaction.specialEntries)&&reaction.specialEntries.length)out.specialEntries=reaction.specialEntries.map(compactEntryForStorage);
  if(reaction.specialMinAffection)out.specialMinAffection=reaction.specialMinAffection;
  if(reaction.specialEmotionState)out.specialEmotionState=reaction.specialEmotionState;
  if(reaction.specialEmotionIntensity)out.specialEmotionIntensity=reaction.specialEmotionIntensity;
  return out;
}
function compactItemForStorage(item={}){
  const out={...item};
  out.reactions=(item.reactions||[]).map(compactReactionForStorage);
  return out;
}
function compactStateForStorage(source){
  const out={...source};
  out.events=(source.events||[]).map(compactEventForStorage);
  out.asks=(source.asks||[]).map(compactAskForStorage);
  out.items=(source.items||[]).map(compactItemForStorage);
  return out;
}
function storageSizeChars(value){
  try{return JSON.stringify(value).length}catch{return 0}
}
function normalizeBackupStore(raw){
  const source=raw&&typeof raw==="object"?raw:{};
  return{
    slots:Array.from({length:3},(_,i)=>Array.isArray(source.slots)?source.slots[i]||null:null),
    safety:source.safety&&typeof source.safety==="object"?source.safety:null
  };
}
function legacyLocalState(){
  try{
    const raw=localStorage.getItem(STATE_KEY);
    return raw?JSON.parse(raw):null;
  }catch{return null}
}
function legacyLocalBackups(){
  try{
    const raw=localStorage.getItem(DATA_BACKUP_KEY);
    return raw?normalizeBackupStore(JSON.parse(raw)):null;
  }catch{return null}
}
function legacyLocalEditorSnapshot(){
  try{
    const raw=localStorage.getItem(EDITOR_SNAPSHOT_KEY);
    return raw?JSON.parse(raw):null;
  }catch{return null}
}
function openStorageDb(){
  return new Promise((resolve,reject)=>{
    if(!("indexedDB" in window)){reject(new Error("IndexedDB unavailable"));return}
    const request=indexedDB.open(STORAGE_DB_NAME,STORAGE_DB_VERSION);
    request.onupgradeneeded=()=>{
      const db=request.result;
      if(!db.objectStoreNames.contains(STORAGE_DB_STORE))db.createObjectStore(STORAGE_DB_STORE);
    };
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error||new Error("IndexedDB open failed"));
    request.onblocked=()=>console.warn("Hellaverse IndexedDB upgrade blocked");
  });
}
let storageDbPromise=null;
function getStorageDb(){
  storageDbPromise ||= openStorageDb();
  return storageDbPromise;
}
async function idbGet(key){
  const db=await getStorageDb();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(STORAGE_DB_STORE,"readonly");
    const req=tx.objectStore(STORAGE_DB_STORE).get(key);
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error||new Error("IndexedDB read failed"));
  });
}
async function idbSet(key,value){
  const db=await getStorageDb();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(STORAGE_DB_STORE,"readwrite");
    tx.objectStore(STORAGE_DB_STORE).put(value,key);
    tx.oncomplete=()=>resolve(true);
    tx.onerror=()=>reject(tx.error||new Error("IndexedDB write failed"));
    tx.onabort=()=>reject(tx.error||new Error("IndexedDB write aborted"));
  });
}
async function idbDelete(key){
  const db=await getStorageDb();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(STORAGE_DB_STORE,"readwrite");
    tx.objectStore(STORAGE_DB_STORE).delete(key);
    tx.oncomplete=()=>resolve(true);
    tx.onerror=()=>reject(tx.error||new Error("IndexedDB delete failed"));
    tx.onabort=()=>reject(tx.error||new Error("IndexedDB delete aborted"));
  });
}

let storageMode="booting";
let storageWriteChain=Promise.resolve();
let storageLastError=null;
let storagePendingWrites=0;
let storageBatchError=null;
let backupStoreCache=normalizeBackupStore(null);
let editorSnapshotCache=null;

function setStorageUiStatus(status="saved",text=""){
  const el=typeof document!=="undefined"?document.querySelector("#saveStatus"):null;
  if(!el)return;
  el.dataset.status=status;
  el.textContent=text||(status==="saving"?"SAVING":status==="failed"?"SAVE FAILED":"SAVED");
}
function queueStorageWrite(key,value){
  if(storageMode!=="indexedDB")return false;
  if(storagePendingWrites===0){
    storageBatchError=null;
    storageLastError=null;
  }
  storagePendingWrites+=1;
  setStorageUiStatus("saving");
  const snapshot=clone(value);
  storageWriteChain=storageWriteChain
    .catch(()=>{})
    .then(()=>idbSet(key,snapshot))
    .then(()=>{
      try{
        localStorage.setItem(STORAGE_META_KEY,JSON.stringify({
          mode:"indexedDB",
          schemaVersion:CURRENT_SCHEMA_VERSION,
          updatedAt:Date.now()
        }));
      }catch{}
    })
    .catch(error=>{
      storageLastError=error;
      storageBatchError ||= error;
      console.error("HELLAVERSE INDEXEDDB WRITE FAILED",key,error);
    })
    .finally(()=>{
      storagePendingWrites=Math.max(0,storagePendingWrites-1);
      if(storagePendingWrites===0)setStorageUiStatus(storageBatchError?"failed":"saved");
    });
  return true;
}
async function flushStorageWrites(){
  try{await storageWriteChain}catch{}
  return !storageBatchError;
}
function readState(){
  const legacy=legacyLocalState();
  return installStoryPacks(normalizeState(legacy||null)).state;
}
function syncPlayStateFromSession(){
  if(typeof session==="undefined"||!session)return;
  state.playState={
    variables:clone(session.variables||{}),
    affection:clone(session.affection||{}),
    emotions:clone(session.emotions||{}),
    log:Array.isArray(session.log)?session.log.slice(-200):[],
    recentTalks:clone(session.recentTalks||{}),
    selectedOptionIds:Array.isArray(session.selectedOptionIds)?[...new Set(session.selectedOptionIds.map(String).filter(Boolean))].slice(-5000):[]
  };
}
function progressStateFrom(source=state){
  return{
    profile:clone(source.profile||{name:"",origin:""}),
    favoriteCharacterIds:[...(source.favoriteCharacterIds||[])],
    playState:clone(source.playState||{}),
    inventoryCounts:clone(source.inventoryCounts||{}),
    newItemIds:[...(source.newItemIds||[])],
    itemHistory:clone(source.itemHistory||[]),
    discoveredGiftReactionKeys:[...(source.discoveredGiftReactionKeys||[])],
    discoveredSpecialGiftKeys:[...(source.discoveredSpecialGiftKeys||[])],
    giftInteractionCounts:clone(source.giftInteractionCounts||{}),
    discoveredTalkIds:[...(source.discoveredTalkIds||[])],
    seenOriginIntroCharacterIds:[...(source.seenOriginIntroCharacterIds||[])],
    askedAskIds:[...(source.askedAskIds||[])],
    unlockedAskIds:[...(source.unlockedAskIds||[])],
    interactionHistory:clone(source.interactionHistory||[]),
    claimedItemEffectIds:[...(source.claimedItemEffectIds||[])],
    collectionSettings:clone(source.collectionSettings||{}),
    discoveredThoughtIds:[...(source.discoveredThoughtIds||[])],
    gacha:{
      balance:Math.max(0,Number(source.gacha?.balance)||0),
      history:clone(source.gacha?.history||[])
    }
  };
}
function mergeProgressState(base,progress){
  if(!progress||typeof progress!=="object")return base;
  const merged={...base};
  for(const key of [
    "profile","favoriteCharacterIds","playState","inventoryCounts","newItemIds",
    "itemHistory","discoveredGiftReactionKeys","discoveredSpecialGiftKeys","giftInteractionCounts","discoveredTalkIds","seenOriginIntroCharacterIds","askedAskIds",
    "unlockedAskIds","interactionHistory","claimedItemEffectIds","collectionSettings","discoveredThoughtIds"
  ]){
    if(progress[key]!==undefined)merged[key]=clone(progress[key]);
  }
  if(progress.gacha&&typeof progress.gacha==="object"){
    merged.gacha={
      ...merged.gacha,
      balance:Math.max(0,Number(progress.gacha.balance ?? merged.gacha?.balance)||0),
      history:Array.isArray(progress.gacha.history)?clone(progress.gacha.history):merged.gacha?.history||[]
    };
  }
  return merged;
}
function walkStateEntries(entries,visit){
  for(const entry of entries||[]){
    visit(entry);
    if(entry.type==="choice")for(const option of entry.options||[]){
      visit(option);
      walkStateEntries(option.entries,visit);
    }
  }
}
function sanitizeProgressReferences(source){
  const result=normalizeState(source);
  const characterIds=new Set(result.characters.map(item=>item.id));
  const variableIds=new Set(result.variables.map(item=>item.id));
  const itemIds=new Set(result.items.map(item=>item.id));
  const askIds=new Set(result.asks.map(item=>item.id));
  const thoughtIds=new Set(result.thoughts.map(item=>item.id));
  const itemEffectIds=new Set();
  const rememberItemEffects=entries=>walkStateEntries(entries,owner=>{
    (owner.itemEffects||[]).forEach(effect=>itemEffectIds.add(effect.id));
  });
  result.events.forEach(event=>rememberItemEffects(event.entries));
  result.asks.forEach(ask=>rememberItemEffects(ask.entries));
  result.items.forEach(item=>(item.reactions||[]).forEach(reaction=>{
    rememberItemEffects(reaction.firstEntries);
    rememberItemEffects(reaction.repeatEntries);
    rememberItemEffects(reaction.specialEntries);
  }));
  result.favoriteCharacterIds=result.favoriteCharacterIds.filter(id=>characterIds.has(id));
  result.collectionSettings.expandedCharacterIds=(result.collectionSettings.expandedCharacterIds||[]).filter(id=>characterIds.has(id));
  result.playState.affection=Object.fromEntries(Object.entries(result.playState.affection||{}).filter(([id])=>characterIds.has(id)));
  result.playState.emotions=Object.fromEntries(Object.entries(result.playState.emotions||{}).filter(([id])=>characterIds.has(id)));
  result.playState.variables=Object.fromEntries(Object.entries(result.playState.variables||{}).filter(([id])=>variableIds.has(id)));
  const eventIds=new Set(result.events.filter(event=>event.menuVisible!==false&&!isExitEvent(event)).map(event=>event.id));
  result.playState.recentTalks=Object.fromEntries(Object.entries(result.playState.recentTalks||{})
    .filter(([characterId])=>characterIds.has(characterId))
    .map(([characterId,ids])=>[characterId,(ids||[]).filter(id=>eventIds.has(id)).slice(-3)])
    .filter(([,ids])=>ids.length));
  result.inventoryCounts=Object.fromEntries(Object.entries(result.inventoryCounts||{}).filter(([id])=>itemIds.has(id)));
  result.newItemIds=result.newItemIds.filter(id=>itemIds.has(id));
  result.itemHistory=result.itemHistory.filter(row=>!row?.itemId||itemIds.has(row.itemId));
  result.discoveredGiftReactionKeys=result.discoveredGiftReactionKeys.filter(key=>{
    const [itemId,characterId]=String(key).split("::");
    return itemIds.has(itemId)&&characterIds.has(characterId);
  });
  result.discoveredSpecialGiftKeys=result.discoveredSpecialGiftKeys.filter(key=>{
    const [itemId,characterId]=String(key).split("::");
    return itemIds.has(itemId)&&characterIds.has(characterId);
  });
  result.discoveredTalkIds=result.discoveredTalkIds.filter(id=>eventIds.has(id));
  result.seenOriginIntroCharacterIds=(result.seenOriginIntroCharacterIds||[]).filter(id=>characterIds.has(id));
  result.giftInteractionCounts=Object.fromEntries(Object.entries(result.giftInteractionCounts||{}).filter(([key])=>{
    const [itemId,characterId]=String(key).split("::");
    return itemIds.has(itemId)&&characterIds.has(characterId);
  }));
  result.askedAskIds=result.askedAskIds.filter(id=>askIds.has(id));
  result.unlockedAskIds=result.unlockedAskIds.filter(id=>askIds.has(id));
  result.discoveredThoughtIds=result.discoveredThoughtIds.filter(id=>thoughtIds.has(id));
  result.interactionHistory=result.interactionHistory.filter(row=>(!row?.characterId||characterIds.has(row.characterId))&&(!row?.itemId||itemIds.has(row.itemId))&&(!row?.askId||askIds.has(row.askId)));
  result.claimedItemEffectIds=result.claimedItemEffectIds.filter(id=>itemEffectIds.has(id));
  result.items.forEach(item=>{
    if(item.inventoryEventId&&!result.events.some(event=>event.id===item.inventoryEventId))item.inventoryEventId="";
  });
  result.gacha.history=result.gacha.history.filter(row=>!row?.itemId||itemIds.has(row.itemId));
  return result;
}
function mergeEditorDraftIntoLiveState(live,draft,baseline){
  const liveProgress=progressStateFrom(live);
  const merged=clone(draft);
  for(const key of [
    "profile","favoriteCharacterIds","playState","inventoryCounts","newItemIds",
    "itemHistory","discoveredGiftReactionKeys","discoveredSpecialGiftKeys","giftInteractionCounts","discoveredTalkIds","seenOriginIntroCharacterIds","askedAskIds",
    "unlockedAskIds","interactionHistory","claimedItemEffectIds","discoveredThoughtIds"
  ])merged[key]=clone(liveProgress[key]);
  merged.collectionSettings={
    ...merged.collectionSettings,
    view:liveProgress.collectionSettings?.view||"grouped",
    sort:liveProgress.collectionSettings?.sort||"recent",
    expandedCharacterIds:[...(liveProgress.collectionSettings?.expandedCharacterIds||[])]
  };
  const draftBalance=Math.max(0,Number(draft.gacha?.balance)||0);
  const baselineBalance=Math.max(0,Number(baseline?.gacha?.balance)||0);
  merged.gacha={
    ...merged.gacha,
    balance:draftBalance!==baselineBalance?draftBalance:liveProgress.gacha.balance,
    history:clone(liveProgress.gacha.history||[])
  };
  return sanitizeProgressReferences(merged);
}
function saveProgressState(){
  syncPlayStateFromSession();
  const progress=progressStateFrom(state);
  if(storageMode==="indexedDB"){
    queueStorageWrite("progress",progress);
    return true;
  }
  if(storageMode==="booting")return true;
  try{
    setStorageUiStatus("saving");
    localStorage.setItem(STATE_KEY,JSON.stringify(compactStateForStorage(state)));
    storageLastError=null;
    setStorageUiStatus("saved");
    return true;
  }catch(error){
    storageLastError=error;
    setStorageUiStatus("failed");
    console.warn("HELLAVERSE PROGRESS FALLBACK SAVE FAILED",error);
    return false;
  }
}
function saveState(){
  syncPlayStateFromSession();
  const packed=compactStateForStorage(state);
  packed.schemaVersion=CURRENT_SCHEMA_VERSION;
  if(storageMode==="indexedDB"){
    queueStorageWrite("state",packed);
    queueStorageWrite("progress",progressStateFrom(state));
    return true;
  }
  if(storageMode==="booting"){
    return true;
  }
  try{
    setStorageUiStatus("saving");
    localStorage.setItem(STATE_KEY,JSON.stringify(packed));
    storageLastError=null;
    setStorageUiStatus("saved");
    return true;
  }catch(error){
    storageLastError=error;
    setStorageUiStatus("failed");
    console.error("HELLAVERSE FALLBACK SAVE FAILED",error);
    return false;
  }
}
function readBackupStore(){
  return clone(backupStoreCache);
}
function writeBackupStore(store){
  backupStoreCache=normalizeBackupStore(store);
  if(storageMode==="indexedDB"){
    queueStorageWrite("backups",backupStoreCache);
    return true;
  }
  try{
    setStorageUiStatus("saving");
    localStorage.setItem(DATA_BACKUP_KEY,JSON.stringify(backupStoreCache));
    storageLastError=null;
    setStorageUiStatus("saved");
    return true;
  }catch(error){
    storageLastError=error;
    setStorageUiStatus("failed");
    console.warn("HELLAVERSE FALLBACK BACKUP SAVE FAILED",error);
    return false;
  }
}
function readEditorSnapshot(){
  return editorSnapshotCache?clone(editorSnapshotCache):null;
}
function hasEditorSnapshot(){return Boolean(editorSnapshotCache)}
function writeEditorSnapshot(snapshot){
  editorSnapshotCache=snapshot?clone(snapshot):null;
  if(storageMode==="indexedDB"){
    if(editorSnapshotCache)queueStorageWrite("editorSnapshot",editorSnapshotCache);
    else{
      if(storagePendingWrites===0){storageBatchError=null;storageLastError=null}
      storagePendingWrites+=1;
      setStorageUiStatus("saving");
      storageWriteChain=storageWriteChain.catch(()=>{}).then(()=>idbDelete("editorSnapshot")).catch(error=>{
        storageLastError=error;
        storageBatchError ||= error;
        console.error("HELLAVERSE EDITOR SNAPSHOT DELETE FAILED",error);
      }).finally(()=>{
        storagePendingWrites=Math.max(0,storagePendingWrites-1);
        if(storagePendingWrites===0)setStorageUiStatus(storageBatchError?"failed":"saved");
      });
    }
    return true;
  }
  try{
    setStorageUiStatus("saving");
    if(editorSnapshotCache)localStorage.setItem(EDITOR_SNAPSHOT_KEY,JSON.stringify(editorSnapshotCache));
    else localStorage.removeItem(EDITOR_SNAPSHOT_KEY);
    storageLastError=null;
    setStorageUiStatus("saved");
    return true;
  }catch(error){
    storageLastError=error;
    setStorageUiStatus("failed");
    return false;
  }
}
function makeDataSnapshot(label="BACKUP"){
  saveState();
  return {
    version:3,
    schemaVersion:CURRENT_SCHEMA_VERSION,
    label:String(label),
    at:Date.now(),
    state:compactStateForStorage(state),
    prefs:clone(prefs),
    extraStorage:Object.fromEntries(AUX_STORAGE_KEYS.map(key=>[key,localStorage.getItem(key)]))
  };
}
function captureSafetySnapshot(label="자동 안전 백업"){
  const store=readBackupStore();
  store.safety=makeDataSnapshot(label);
  return writeBackupStore(store);
}
async function bootstrapStorage(){
  const legacyState=legacyLocalState();
  const legacyBackups=legacyLocalBackups();
  const legacyEditor=legacyLocalEditorSnapshot();

  try{
    await getStorageDb();
    const [dbState,dbBackups,dbEditor,dbProgress]=await Promise.all([
      idbGet("state"),
      idbGet("backups"),
      idbGet("editorSnapshot"),
      idbGet("progress")
    ]);

    const chosenState=dbState||legacyState||defaultState();
    const storyInstall=installStoryPacks(normalizeState(mergeProgressState(chosenState,dbProgress)));
    state=storyInstall.state;
    backupStoreCache=normalizeBackupStore(dbBackups||legacyBackups);
    editorSnapshotCache=dbEditor||legacyEditor||null;
    storageMode="indexedDB";

    if(!dbState||storyInstall.changed)await idbSet("state",compactStateForStorage(state));
    if(!dbProgress)await idbSet("progress",progressStateFrom(state));
    if(!dbBackups&&legacyBackups)await idbSet("backups",backupStoreCache);
    if(!dbEditor&&legacyEditor)await idbSet("editorSnapshot",editorSnapshotCache);

    try{
      localStorage.removeItem(STATE_KEY);
      localStorage.removeItem(DATA_BACKUP_KEY);
      localStorage.removeItem(EDITOR_SNAPSHOT_KEY);
      localStorage.setItem(STORAGE_META_KEY,JSON.stringify({
        mode:"indexedDB",
        schemaVersion:CURRENT_SCHEMA_VERSION,
        migratedAt:Date.now()
      }));
    }catch{}
  }catch(error){
    console.warn("IndexedDB unavailable; using localStorage fallback",error);
    storageMode="localStorage-fallback";
    const storyInstall=installStoryPacks(normalizeState(legacyState||defaultState()));
    state=storyInstall.state;
    backupStoreCache=normalizeBackupStore(legacyBackups);
    editorSnapshotCache=legacyEditor||null;
    if(storyInstall.changed){
      try{localStorage.setItem(STATE_KEY,JSON.stringify(compactStateForStorage(state)))}catch{}
    }
  }

  pendingOrigin=state.profile.origin||"";
  if(typeof createSession==="function")session=createSession();
  return{
    mode:storageMode,
    schemaVersion:CURRENT_SCHEMA_VERSION,
    stateChars:storageSizeChars(compactStateForStorage(state))
  };
}
function storageStatus(){
  return{
    mode:storageMode,
    schemaVersion:CURRENT_SCHEMA_VERSION,
    lastError:storageLastError?String(storageLastError.message||storageLastError):"",
    stateChars:storageSizeChars(compactStateForStorage(state))
  };
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
let gachaProfileCharacterId="";
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
let activeRoomIntroEvent=null;
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
let editorCharacterScope="ALL";

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
