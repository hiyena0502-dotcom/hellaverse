import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";

const root=new URL("../",import.meta.url);
const read=path=>fs.readFileSync(new URL(path,root),"utf8");

const jsFiles=[
  "data/story-packs.js",
  "data/character-events.js",
  "data/relationship-content.js",
  "data/lucifer-talk-13-30.js",
  "data/lucifer-talk-31-60.js",
  "data/lucifer-talk-61-64.js",
  "data/lucifer-talk-65-67.js",
  "data/lucifer-talk-68-70.js",
  "data/unified-character-content.js",
  "data/lucifer-ask-integrated.js",
  "data/solo-talks.js",
  "data/character-banter.js",
  "data/item-presets.js",
  "data/origin-intros.js",
  "data/dialogue-presets.js",
  "data/lucifer-dialogue-acquisitions.js",
  "data/lucifer-thoughts.js",
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
const banterCode=read("data/character-banter.js");
const itemPresetCode=read("data/item-presets.js");
const originIntroCode=read("data/origin-intros.js");
const dialoguePresetCode=read("data/dialogue-presets.js");
const luciferAcquisitionCode=read("data/lucifer-dialogue-acquisitions.js");
const luciferThoughtCode=read("data/lucifer-thoughts.js");
const dialogueCss=read("css/dialogue.css");
const featuresCss=read("css/features.css");
const hotelThemeCss=read("css/hotel-theme.css");
const luciferAskIntegratedCode=read("data/lucifer-ask-integrated.js");

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
assert.match(editorUi,/collapsible-reaction-card/,"collapsible item character reaction cards missing");
assert.match(editorUi,/collapse-all-item-reactions/,"collapse-all item reaction control missing");
assert.match(editorUi,/expand-all-item-reactions/,"expand-all item reaction control missing");
assert.match(editorEvents,/toggle-item-reaction-card/,"item reaction collapse-state handler missing");
assert.match(editorEvents,/editorOpenItemReactionIds\.add\(reaction\.id\)/,"new item reaction must open automatically");
assert.match(editorUi,/data-editor-character-scope/,"shared character scope selector missing from editor");
assert.match(editorUi,/function editorCharacterScopeBar\(/,"shared character scope toolbar helper missing");
assert.match(editorEvents,/data-editor-character-scope/,"shared character scope event handler missing");
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
assert.match(stateCode,/AFFECTION_BANDS/,"five-band affection normalization missing");
assert.match(gameStateCode,/function affectionBandForValue\(/,"five-band affection runtime missing");
assert.match(editorUi,/data-affcond-field="band"/,"affection band editor control missing");
assert.match(editorUi,/data-bind="event-start-mode"/,"TALK start-mode editor control missing");
assert.match(editorUi,/data-bind="event-topic-family"/,"TALK topic-family editor control missing");
assert.match(editorUi,/data-entry-field="narrationRole"/,"narration role editor control missing");
assert.match(editorUi,/data-character-image-file/,"character image file picker missing");
assert.match(editorUi,/clear-character-image/,"character image remove control missing");
assert.match(editorEvents,/function optimizeCharacterImageFile\(/,"character image optimization helper missing");
assert.match(editorEvents,/function handleCharacterImageFile\(/,"character image upload handler missing");
assert.match(editorEvents,/canvas\.toDataURL\("image\/webp",\.86\)/,"character image compression missing");
assert.match(editorEvents,/data-character-image-file/,"character image file change handler missing");
assert.match(stateCode,/for\(const variable of pack\.variables\|\|\[\]\)/,"pool TALK variable installer missing");
assert.match(stateCode,/currentManaged=currentIds\.has\(id\)/,"pool TALK installer must absorb merged supplemental event ids without duplication");
assert.match(stateCode,/source\.variables\.push\(normalizedVariable\)/,"pool TALK variable definitions must be registered in project state");
assert.match(itemPresetCode,/HV_APPLY_ITEM_PRESETS/,"item preset installer missing");
assert.match(itemPresetCode,/FIRST|firstEntries/,"gift FIRST preset flow missing");
assert.match(itemPresetCode,/repeatEntries/,"gift REPEAT preset flow missing");
assert.match(itemPresetCode,/specialEntries/,"gift SPECIAL preset flow missing");
assert.match(itemPresetCode,/HV_BUILD_ITEM_REACTION/,"runtime gift reaction builder missing");
assert.match(itemPresetCode,/RELATION_TASTES/,"relationship-aware gift preferences missing");
assert.doesNotMatch(gameStateCode,/고마워\. 잘 받아둘게\./,"generic gift fallback dialogue must stay removed");
assert.match(gameStateCode,/return \(item\.reactions\|\|\[\]\)\.find\(reaction=>reaction\.characterId===character\.id\)\|\|null/,"gift lookup must require an explicit character reaction");
assert.match(dialogueCode,/itemCount\(i\.id\)>0&&Boolean\(giftReactionFor\(i,ch\)\)/,"inventory must hide gifts without a configured character reaction");
assert.match(dialogueCode,/이 아이템 반응은 아직 설정되지 않았습니다/,"unconfigured gift runtime guard missing");
assert.match(editorUi,/같은 ID가 .*개 등록되어 있습니다/,"duplicate content id validation missing");
assert.match(editorUi,/연결된 획득 EVENT가 존재하지 않습니다/,"broken acquisition-event validation missing");
assert.match(editorUi,/실제 선물 목록에는 표시되지 않습니다/,"unconfigured gift validation message missing");
assert.match(stateCode,/const configuredGiftKeys=new Set\(\)/,"configured gift progress cleanup missing");
assert.match(stateCode,/configuredGiftKeys\.has\(String\(key\)\)/,"stale gift progress keys must be filtered");
assert.match(dialogueCode,/const specialKeys=new Set\(specialItems\.map/,"SPECIAL progress must be limited to configured gift reactions");
assert.match(dialoguePresetCode,/HV_APPLY_DIALOGUE_PRESETS/,"dialogue detail preset installer missing");
assert.match(luciferAcquisitionCode,/HV_APPLY_DIALOGUE_PRESETS/,"Lucifer dialogue acquisition installer missing");
assert.match(index,/css\/hotel-theme\.css/,"hotel visual theme stylesheet missing from build");
assert.match(hotelThemeCss,/--hotel-gold:/,"hotel theme gold palette missing");
assert.match(hotelThemeCss,/\.lobby-character:before/,"hotel lobby gold frame missing");
assert.match(hotelThemeCss,/\.collection-card/,"hotel collection card treatment missing");
assert.match(hotelThemeCss,/\.dialogue-box\.character-dialogue/,"hotel dialogue treatment missing");
assert.match(index,/data\/lucifer-dialogue-acquisitions\.js/,"Lucifer dialogue acquisition script missing from build");
assert.match(index,/data\/lucifer-thoughts\.js/,"Lucifer THOUGHT preset script missing from build");
assert.match(luciferThoughtCode,/HV_APPLY_THOUGHT_PRESETS/,"Lucifer THOUGHT preset installer missing");
assert.match(stateCode,/HV_APPLY_THOUGHT_PRESETS/,"THOUGHT preset hook missing");
assert.match(stateCode,/minAffection/,"THOUGHT affection normalization missing");
assert.match(editorUi,/data-thought-bind="minAffection"/,"THOUGHT minimum affection editor missing");
assert.match(editorUi,/data-thought-bind="maxAffection"/,"THOUGHT maximum affection editor missing");
assert.match(dialogueCode,/affection>=Number\(t\.minAffection/,"THOUGHT runtime minimum-affection filter missing");
assert.match(dialogueCode,/affection<=Number\(t\.maxAffection/,"THOUGHT runtime maximum-affection filter missing");
assert.match(dialoguePresetCode,/hasItemGrant/,"reward TALK migration missing");
assert.match(dialoguePresetCode,/seenTalkSignatures/,"duplicate TALK rotation guard missing");
assert.match(stateCode,/randomEligible:e\.randomEligible!==false/,"random TALK eligibility persistence missing");
assert.match(dialogueCode,/ev\.randomEligible!==false/,"random TALK eligibility filter missing");
assert.match(dialogueCode,/player-dialogue/,"PLAYER dialogue must use its own visual surface class");
assert.match(appShell,/gacha-particle-field-ambient/,"ambient gacha particle field missing");
assert.match(dialogueCode,/function spawnGachaParticles\(/,"gacha burst particle helper missing");
assert.match(dialogueCode,/spawnGachaParticles\(stage,"burst",34\)/,"gacha summon burst particles missing");
assert.match(dialogueCode,/spawnGachaParticles\(stage,"reveal"/,"gacha reveal burst particles missing");
assert.match(featuresCss,/@keyframes gachaAmbientParticle/,"ambient gacha particle animation missing");
assert.match(featuresCss,/@keyframes gachaParticleBurst/,"gacha burst particle animation missing");
assert.match(featuresCss,/prefers-reduced-motion:reduce/,"gacha particle reduced-motion fallback missing");
assert.match(dialogueCode,/character-dialogue/,"character dialogue must use its own visual surface class");
assert.match(dialogueCode,/isPlayer\?"YOU":speaker/,"PLAYER dialogue must render a distinct YOU label");
assert.match(dialogueCss,/\.dialogue-box\.player-dialogue/,"PLAYER dialogue styling missing");
assert.match(dialogueCss,/\.dialogue-box\.character-dialogue/,"character dialogue styling missing");
assert.match(dialogueCss,/\.dialogue-box\.narration-dialogue/,"narration dialogue styling missing");
assert.match(editorUi,/event-random-eligible/,"random TALK eligibility editor control missing");
assert.match(index,/data\/unified-character-content\.js/,"unified per-character TALK/ASK content script missing from build");
assert.match(index,/data\/lucifer-ask-integrated\.js/,"Lucifer integrated ASK script missing from build");
assert.ok(index.indexOf("data/unified-character-content.js")<index.indexOf("data/lucifer-ask-integrated.js"),"Lucifer integrated ASK must load after the unified base pack");
assert.doesNotMatch(index,/data\/(?:relationship-content|topic-conversations|common-topic-asks|solo-talks|character-banter)\.js/,"fragmented per-character content scripts must not load at runtime");
assert.match(index,/data\/lucifer-talk-13-30\.js/,"Lucifer TALK 13-30 script missing from build");
assert.match(index,/data\/lucifer-talk-31-60\.js/,"Lucifer TALK 31-60 script missing from build");
assert.match(index,/data\/lucifer-talk-61-64\.js/,"Lucifer TALK 61-64 script missing from build");
assert.match(index,/data\/lucifer-talk-65-67\.js/,"Lucifer TALK 65-67 script missing from build");
assert.match(index,/data\/lucifer-talk-68-70\.js/,"Lucifer TALK 68-70 script missing from build");

const retiredCharacterPattern=/(?:belphegor|leviathan|벨페고르|레비아탄)/i;
for(const path of [
  "data/unified-character-content.js","data/relationship-content.js","data/solo-talks.js","data/origin-intros.js",
  "data/gacha-profiles.js","data/item-presets.js","data/archive-meta-5.js","data/lucifer-talk-13-30.js","data/lucifer-talk-31-60.js","data/lucifer-talk-61-64.js","data/lucifer-talk-65-67.js","data/lucifer-talk-68-70.js"
]){
  assert.doesNotMatch(read(path),retiredCharacterPattern,path+" must not contain retired Belphegor/Leviathan content");
}
assert.match(stateCode,/RETIRED_CHARACTER_IDS/,"retired-character registry missing");
assert.match(stateCode,/function purgeRetiredCharacterContent\(/,"retired-character saved-state cleanup missing");

const soloTalkContext={window:{HV_STORY_PACKS:[]}};
vm.runInNewContext(soloTalkCode,soloTalkContext);
const soloTalkPacks=soloTalkContext.window.HV_STORY_PACKS||[];
assert.equal(soloTalkPacks.length,33,"solo TALK packs must cover all 33 active characters");
assert.equal(soloTalkPacks.reduce((sum,pack)=>sum+(pack.events||[]).length,0),231,"solo TALK must keep seven curated scenes per active character");

const unifiedCharacterCode=read("data/unified-character-content.js");
const unifiedContext={window:{HV_STORY_PACKS:[]}};
vm.runInNewContext(read("data/topic-pool-500.js"),unifiedContext);
vm.runInNewContext(read("data/character-topic-talks-52.js"),unifiedContext);
vm.runInNewContext(read("data/lucifer-talk-13-30.js"),unifiedContext);
vm.runInNewContext(read("data/lucifer-talk-31-60.js"),unifiedContext);
const luciferBeforeUnified=(unifiedContext.window.HV_STORY_PACKS||[]).find(pack=>pack.id==="pooltalk-52-lucifer-morningstar");
const luciferMainIdsBeforeUnified=Array.from((luciferBeforeUnified?.events||[]).slice(0,60),event=>event.id);
vm.runInNewContext(unifiedCharacterCode,unifiedContext);
const unifiedRuntimePacks=unifiedContext.window.HV_STORY_PACKS||[];
const luciferCanonicalTalk=unifiedRuntimePacks.find(pack=>pack.id==="pooltalk-52-lucifer-morningstar");
assert.ok(luciferCanonicalTalk,"Lucifer canonical TALK pack missing after consolidation");
assert.equal(JSON.stringify(Array.from(luciferCanonicalTalk.events.slice(0,60),event=>event.id)),JSON.stringify(luciferMainIdsBeforeUnified),"Lucifer main 60 TALK slots must remain untouched by consolidation");
assert.equal(luciferCanonicalTalk.events.length,70,"Lucifer canonical TALK must contain 60 main TALK + 10 supplemental TALK");
assert.ok(luciferCanonicalTalk.events.slice(60).every(event=>String(event.name||"").startsWith("TALK · ")),"supplemental scenes must appear as ordinary TALK");
const luciferCanonicalAsk=unifiedRuntimePacks.find(pack=>pack.id==="unified-asks-lucifer-morningstar");
assert.equal(luciferCanonicalAsk?.asks?.length,129,"Lucifer ASK must preserve the restored 120 legacy questions plus nine unified questions");
assert.ok(luciferCanonicalAsk.asks.some(ask=>ask.label==="호텔 생활은 어때요?"),"restored Lucifer hotel-life ASK missing");
assert.ok(luciferCanonicalAsk.asks.some(ask=>ask.label==="릴리스가 떠난 것도 결국 당신 탓 아닌가요?"),"restored Lucifer Lilith blame ASK missing");
assert.equal(unifiedRuntimePacks.filter(pack=>String(pack.id||"").startsWith("unified-asks-")).length,33,"unified ASK packs must cover all active personal character sets");
assert.ok(!unifiedRuntimePacks.some(pack=>/^(?:relationship|topic-conversations|common-topic-asks|solo-talks|character-banter)-/.test(String(pack.id||""))),"fragmented legacy pack ids must not exist in the unified runtime");

const walk6164Entries=(entries,visit)=>{
  for(const entry of entries||[]){
    visit(entry);
    if(entry.type==="choice")for(const option of entry.options||[]){visit(option);walk6164Entries(option.entries,visit)}
  }
};
vm.runInNewContext(read("data/lucifer-talk-61-64.js"),unifiedContext);
const luciferWith6164=(unifiedContext.window.HV_STORY_PACKS||[]).find(pack=>pack.id==="pooltalk-52-lucifer-morningstar");
assert.equal(luciferWith6164?.version,57,"Lucifer supplemental TALK 61-64 override version missing");
assert.equal(JSON.stringify(Array.from(luciferWith6164.events.slice(0,60),event=>event.id)),JSON.stringify(luciferMainIdsBeforeUnified),"Lucifer 61-64 override must not modify main TALK 01-60");
assert.equal(JSON.stringify(Array.from(luciferWith6164.events.slice(60,64),event=>event.id)),JSON.stringify(["solo-talk-lucifer-morningstar-01","solo-talk-lucifer-morningstar-02","solo-talk-lucifer-morningstar-03","solo-talk-lucifer-morningstar-04"]),"Lucifer supplemental TALK 61-64 order must be duck/crown/score/family photo");
assert.equal(JSON.stringify(Array.from(luciferWith6164.events.slice(60,64),event=>event.name)),JSON.stringify(["TALK · 오리 설계","TALK · 왕관 손질","TALK · 낡은 악보","TALK · 가족사진"]),"Lucifer supplemental TALK 61-64 titles must match the revised set");
for(const event of luciferWith6164.events.slice(60,64)){
  assert.ok(["light","medium","high"].includes(event.sensitivity),event.id+" sensitivity missing");
  assert.equal(event.startMode,"EVENT",event.id+" must preserve scene-first TALK flow");
  walk6164Entries(event.entries,owner=>{
    const condition=owner?.affectionCondition;
    if(condition?.characterId==="lucifer-morningstar"){
      assert.ok(["COLD","DISTANT","NEUTRAL","WARM","CLOSE"].includes(condition.band),event.id+" must use five-band affection conditions");
      assert.notEqual(Number(condition.value),58,event.id+" must not use the old 58 split");
    }
  });
}
for(const id of ["luc_t61_tension","luc_t61_push","luc_t61_closed","luc_t62_tension","luc_t63_tension","luc_t64_tension","luc_t61_duck_reason_shared","luc_t62_crown_worn","luc_t63_score_played","luc_t64_photo_boundary_respected"]){
  assert.ok((luciferWith6164.variables||[]).some(variable=>variable.id===id),"Lucifer 61-64 system variable missing: "+id);
}
const lucifer6164Text=JSON.stringify(luciferWith6164.events.slice(60,64));
for(const phrase of ["건드리지 마. 아직 비율 안 맞아.","왕 노릇을 얼마나 하고 있느냐는 다른 문제지만.","그러니까 더 짜증 나.","그 뒤까지 전부 좋았다는 뜻은 아니고."]){
  assert.ok(lucifer6164Text.includes(phrase),"Lucifer TALK 61-64 must preserve the revised user-authored text: "+phrase);
}
const luciferFirst64Ids=Array.from(luciferWith6164.events.slice(0,64),event=>event.id);
vm.runInNewContext(read("data/lucifer-talk-65-67.js"),unifiedContext);
const luciferWith6567=(unifiedContext.window.HV_STORY_PACKS||[]).find(pack=>pack.id==="pooltalk-52-lucifer-morningstar");
assert.equal(luciferWith6567?.version,58,"Lucifer supplemental TALK 65-67 override version missing");
assert.equal(JSON.stringify(Array.from(luciferWith6567.events.slice(0,64),event=>event.id)),JSON.stringify(luciferFirst64Ids),"Lucifer 65-67 override must not modify TALK 01-64");
assert.equal(JSON.stringify(Array.from(luciferWith6567.events.slice(64,67),event=>event.id)),JSON.stringify(["solo-talk-lucifer-morningstar-05","solo-talk-lucifer-morningstar-06","solo-talk-lucifer-morningstar-07"]),"Lucifer supplemental TALK 65-67 order must be apology/feather/hotel key");
assert.equal(JSON.stringify(Array.from(luciferWith6567.events.slice(64,67),event=>event.name)),JSON.stringify(["TALK · 사과 연습","TALK · 천국의 깃털","TALK · 호텔 열쇠"]),"Lucifer supplemental TALK 65-67 titles must match the revised set");
for(const event of luciferWith6567.events.slice(64,67)){
  assert.ok(["medium","high"].includes(event.sensitivity),event.id+" sensitivity missing");
  assert.equal(event.startMode,"EVENT",event.id+" must preserve scene-first TALK flow");
  walk6164Entries(event.entries,owner=>{
    const condition=owner?.affectionCondition;
    if(condition?.characterId==="lucifer-morningstar"){
      assert.ok(["COLD","DISTANT","NEUTRAL","WARM","CLOSE"].includes(condition.band),event.id+" must use five-band affection conditions");
      assert.notEqual(Number(condition.value),58,event.id+" must not use the old 58 split");
    }
  });
}
for(const id of ["luc_t65_tension","luc_t65_push","luc_t65_closed","luc_t66_tension","luc_t66_push","luc_t66_closed","luc_t67_tension","luc_t67_push","luc_t67_closed","luc_t65_apology_practiced_with_player","luc_t66_heaven_boundary_respected","luc_t67_hotel_belonging_discussed"]){
  assert.ok((luciferWith6567.variables||[]).some(variable=>variable.id===id),"Lucifer 65-67 system variable missing: "+id);
}
const lucifer6567Text=JSON.stringify(luciferWith6567.events.slice(64,67));
for(const phrase of ["…이건 좀 못 본 척해주면 안 돼?","전부는 안 돼.","그런 질문 쉽게 하지 마.","나중엔 말할 수도 있고.","이건 입장권은 아니잖아.","그러니까 안 잃어버릴 거야."]){
  assert.ok(lucifer6567Text.includes(phrase),"Lucifer TALK 65-67 must preserve the revised user-authored text: "+phrase);
}
const luciferFirst67Ids=Array.from(luciferWith6567.events.slice(0,67),event=>event.id);
vm.runInNewContext(read("data/lucifer-talk-68-70.js"),unifiedContext);
const luciferWith6870=(unifiedContext.window.HV_STORY_PACKS||[]).find(pack=>pack.id==="pooltalk-52-lucifer-morningstar");
assert.equal(luciferWith6870?.version,59,"Lucifer supplemental TALK 68-70 override version missing");
assert.equal(JSON.stringify(Array.from(luciferWith6870.events.slice(0,67),event=>event.id)),JSON.stringify(luciferFirst67Ids),"Lucifer 68-70 override must not modify TALK 01-67");
assert.equal(luciferWith6870.events.length,70,"Lucifer TALK must remain exactly 70 after 68-70 override");
assert.equal(JSON.stringify(Array.from(luciferWith6870.events.slice(67,70),event=>event.id)),JSON.stringify(["topic-talk-lucifer-morningstar-01","topic-talk-lucifer-morningstar-02","banter-lucifer-morningstar-01"]),"Lucifer TALK 68-70 order must be royal work/heaven/Charlie note");
assert.equal(JSON.stringify(Array.from(luciferWith6870.events.slice(67,70),event=>event.name)),JSON.stringify(["TALK · 왕실 업무 회피","TALK · 천국 이야기","TALK · 찰리의 메모"]),"Lucifer TALK 68-70 titles must match the revised set");
for(const event of luciferWith6870.events.slice(67,70)){
  assert.ok(["medium","high"].includes(event.sensitivity),event.id+" sensitivity missing");
  assert.equal(event.startMode,"EVENT",event.id+" must preserve scene-first TALK flow");
  walk6164Entries(event.entries,owner=>{
    const condition=owner?.affectionCondition;
    if(condition?.characterId==="lucifer-morningstar"){
      assert.ok(["COLD","DISTANT","NEUTRAL","WARM","CLOSE"].includes(condition.band),event.id+" must use five-band affection conditions");
      assert.notEqual(Number(condition.value),58,event.id+" must not use the old 58 split");
    }
  });
}
for(const id of ["luc_t68_tension","luc_t68_push","luc_t68_closed","luc_t69_tension","luc_t69_push","luc_t69_closed","luc_t70_tension","luc_t70_push","luc_t70_closed","luc_t68_one_document_started","luc_t69_player_heaven_trust","luc_t70_note_kept"]){
  assert.ok((luciferWith6870.variables||[]).some(variable=>variable.id===id),"Lucifer 68-70 system variable missing: "+id);
}
const lucifer6870Text=JSON.stringify(luciferWith6870.events.slice(67,70));
for(const phrase of ["확인 안 했으니까 아직 아니야.","하나라고 했잖아.","좋았던 게 있으니까 더 얘기하기 싫은 것도 있겠지.","…오늘은 이 정도면 많이 한 거야.","전략이 너무 정직한데.","찰리 기다리겠다."]){
  assert.ok(lucifer6870Text.includes(phrase),"Lucifer TALK 68-70 must preserve the revised user-authored text: "+phrase);
}




const walkEntries=(entries,visit)=>{
  for(const entry of entries||[]){
    visit(entry);
    if(entry.type==="choice")for(const option of entry.options||[]){visit(option);walkEntries(option.entries,visit)}
  }
};

vm.runInNewContext(luciferAskIntegratedCode,unifiedContext);
const luciferIntegratedAsk=unifiedContext.window.HV_STORY_PACKS.find(pack=>pack.id==="unified-asks-lucifer-morningstar");
assert.equal(luciferIntegratedAsk.version,5,"Lucifer integrated ASK pack version missing");
assert.equal(luciferIntegratedAsk.asks.length,68,"Lucifer integrated ASK must contain all 68 questions");
assert.equal(new Set(luciferIntegratedAsk.asks.map(ask=>ask.id)).size,68,"Lucifer integrated ASK ids must be unique");
assert.equal(luciferIntegratedAsk.asks.reduce((sum,ask)=>sum+(ask.entries.at(-1)?.options?.length||0),0),210,"Lucifer integrated ASK must contain all 210 choices");
assert.ok(luciferIntegratedAsk.asks.every(ask=>ask.repeatable&&ask.applyAskDeltaOnce),"Lucifer integrated ASK must retain repeat dialogue while protecting first-use question effects");
assert.ok(luciferIntegratedAsk.asks.every(ask=>Number.isFinite(ask.repeatAffectionDelta)),"Lucifer integrated ASK repeat affinity values missing");
const luciferRepeatAwareAsks=luciferIntegratedAsk.asks.filter(ask=>ask.entries.some(entry=>entry.askCondition?.status==="asked"));
assert.ok(luciferRepeatAwareAsks.length>=39,"Lucifer integrated ASK must give repeat-specific dialogue to more than half of the questions");
for(const id of ["lucifer-ask-ducks","lucifer-ask-charlie","lucifer-ask-heaven-past","lucifer-ask-player-impression","lucifer-ask-rude-charlie","lucifer-ask-rude-lilith","lucifer-ask-rude-heaven"]){
  const ask=luciferIntegratedAsk.asks.find(row=>row.id===id);
  assert.ok(ask?.entries.some(entry=>entry.askCondition?.status==="not-asked"),id+" first-use ASK branch missing");
  assert.ok(ask?.entries.some(entry=>entry.askCondition?.status==="asked"),id+" repeat ASK branch missing");
}
assert.ok(luciferIntegratedAsk.asks.every(ask=>ask.entries.at(-1)?.type==="choice"),"Every Lucifer ASK must end in a player choice");
assert.ok(!luciferAskIntegratedCode.includes("추가 나레이션 운용 규칙"),"Lucifer ASK appendix text must not leak into dialogue");
const integratedAskById=id=>luciferIntegratedAsk.asks.find(ask=>ask.id===id);
const optionDeltas=ask=>ask.entries.at(-1).options.map(option=>option.affectionEffects[0]?.amount||0);
assert.deepEqual(Array.from(optionDeltas(integratedAskById("lucifer-ask-rude-father"))),[2,-2,1],"rude father choice affinity values changed");
assert.equal(integratedAskById("lucifer-ask-rude-father").affectionDelta,-3,"rude father question penalty missing");
assert.equal(integratedAskById("lucifer-ask-rude-father").repeatAffectionDelta,-2,"rude father repeat penalty missing");
assert.equal(integratedAskById("lucifer-ask-rude-lilith").affectionDelta,-5,"rude Lilith question penalty missing");
assert.deepEqual(Array.from(optionDeltas(integratedAskById("topic-ask-lucifer-morningstar-03"))),[3,2,-3],"Heaven fall ASK choice affinity values changed");
assert.equal(integratedAskById("topic-ask-lucifer-morningstar-03").minAffection,75,"Heaven fall ASK unlock threshold missing");
assert.equal(integratedAskById("common-topic-trust-lucifer-morningstar").affectionDelta,1,"trust ASK first-use affinity missing");
assert.equal(integratedAskById("common-topic-trust-lucifer-morningstar").repeatAffectionDelta,0,"trust ASK repeat affinity changed");
assert.equal(luciferIntegratedAsk.askAliases["banter-ask-lucifer-morningstar-01"],"lucifer-ask-charlie-similar","legacy Lucifer ASK alias migration missing");
let exactRangeConditions=0,oneTimeChoiceEffects=0,narrations=0;
for(const ask of luciferIntegratedAsk.asks)walkEntries(ask.entries,owner=>{
  if(owner.affectionCondition?.characterId==="lucifer-morningstar"&&Number.isFinite(owner.affectionCondition.minValue)&&Number.isFinite(owner.affectionCondition.maxValue))exactRangeConditions++;
  oneTimeChoiceEffects+=(owner.affectionEffects||[]).filter(effect=>effect.once).length;
  if(owner.type==="narration")narrations++;
});
assert.ok(exactRangeConditions>=300,"Lucifer ASK exact affinity range coverage is incomplete");
assert.ok(oneTimeChoiceEffects>=100,"Lucifer ASK one-time choice affinity protection is incomplete");
assert.ok(narrations>0,"Lucifer ASK narration entries missing");
assert.match(stateCode,/claimedInteractionEffectIds/,"one-time ASK effect persistence missing");
assert.match(gameStateCode,/c\.minValue/,"exact ASK affinity minimum check missing");
assert.match(gameStateCode,/c\.maxValue/,"exact ASK affinity maximum check missing");
assert.match(dialogueCode,/repeatAffectionDelta/,"repeat ASK affinity application missing");
assert.match(editorUi,/data-ask-bind="repeatAffectionDelta"/,"repeat ASK affinity editor missing");
assert.match(editorUi,/data-affcond-field="minValue"/,"exact ASK minimum affinity editor missing");
assert.match(editorUi,/data-affcond-field="maxValue"/,"exact ASK maximum affinity editor missing");

const topicPoolCode=read("data/topic-pool-500.js");
const characterTopicTalkCode=read("data/character-topic-talks-52.js");
const luciferTalk1330Code=read("data/lucifer-talk-13-30.js");
const luciferTalk3160Code=read("data/lucifer-talk-31-60.js");
const topicTalkContext={window:{HV_STORY_PACKS:[]}};
vm.runInNewContext(topicPoolCode,topicTalkContext);
vm.runInNewContext(characterTopicTalkCode,topicTalkContext);
vm.runInNewContext(luciferTalk1330Code,topicTalkContext);
const luciferFirst30Before3160=JSON.stringify((topicTalkContext.window.HV_STORY_PACKS||[]).find(pack=>pack.id==="pooltalk-52-lucifer-morningstar")?.events?.slice(0,30)||[]);
vm.runInNewContext(luciferTalk3160Code,topicTalkContext);
const allTopicTalkPacks=(topicTalkContext.window.HV_STORY_PACKS||[]).filter(pack=>String(pack.id||"").startsWith("pooltalk-52-"));
assert.equal(allTopicTalkPacks.length,33,"topic TALK packs must cover the 33 currently enabled characters");
for(const pack of allTopicTalkPacks){
  if(pack.id!=="pooltalk-52-lucifer-morningstar")assert.equal(pack.version,49,pack.id+" must use the shared five-band generator version");
  const characterId=pack.requiredCharacterIds?.[0];
  for(const event of pack.events||[]){
    assert.ok(["CHARACTER_OPEN","EVENT","PLAYER_ASK"].includes(event.startMode),event.id+" start mode missing");
    assert.ok(["light","medium","high"].includes(event.sensitivity),event.id+" sensitivity missing");
    if(pack.id==="pooltalk-52-lucifer-morningstar"&&(pack.events||[]).indexOf(event)<12)continue;
    const bands=new Set();
    walkEntries(event.entries,owner=>{
      const condition=owner?.affectionCondition;
      if(condition?.characterId===characterId){
        assert.ok(condition.band,event.id+" must not retain a numeric two-way affection split");
        bands.add(condition.band);
      }
    });
    assert.equal(JSON.stringify([...bands].sort()),JSON.stringify(["CLOSE","COLD","DISTANT","NEUTRAL","WARM"]),event.id+" must provide all five affection bands");
  }
}
const luciferTopicPack=(topicTalkContext.window.HV_STORY_PACKS||[]).find(pack=>pack.id==="pooltalk-52-lucifer-morningstar");
assert.ok(luciferTopicPack,"Lucifer topic TALK pack missing");
assert.equal(luciferTopicPack.version,55,"Lucifer topic TALK must use the 01-60 five-band implementation version 55");
assert.ok((luciferTopicPack.events||[]).length>=60,"Lucifer topic TALK must keep all 60 main topics");
const luciferFirstTwelve=luciferTopicPack.events.slice(0,12);
assert.equal(JSON.stringify(Array.from(luciferFirstTwelve,event=>event.startMode)),JSON.stringify(["PLAYER_ASK","EVENT","PLAYER_ASK","CHARACTER_OPEN","PLAYER_ASK","EVENT","EVENT","PLAYER_ASK","EVENT","PLAYER_ASK","PLAYER_ASK","PLAYER_ASK"]),"Lucifer 01-12 start modes must follow the design document");
const allowedBands=new Set(["COLD","DISTANT","NEUTRAL","WARM","CLOSE"]);
let bandedLuciferResponses=0;
for(const event of luciferFirstTwelve){
  assert.ok(["light","medium","high"].includes(event.sensitivity),event.id+" sensitivity missing");
  walkEntries(event.entries,owner=>{
    const condition=owner?.affectionCondition;
    if(condition?.characterId==="lucifer-morningstar"){
      assert.notEqual(Number(condition.value),58,event.id+" must not use the old 58 split");
      if(condition.band){assert.ok(allowedBands.has(condition.band),event.id+" has invalid affection band");bandedLuciferResponses++}
    }
  });
}
assert.ok(bandedLuciferResponses>=100,"Lucifer 01-12 must contain substantial five-band response coverage");
for(const id of ["luc_t01_tension","luc_t01_push","luc_t01_closed","luc_t11_tension","luc_t12_closed","luc_alastor_irritation","luc_work_avoidance"]){
  assert.ok((luciferTopicPack.variables||[]).some(variable=>variable.id===id),"Lucifer system variable missing: "+id);
}

const luciferThirteenToTwenty=luciferTopicPack.events.slice(12,20);
assert.equal(JSON.stringify(Array.from(luciferThirteenToTwenty,event=>event.startMode)),JSON.stringify(["PLAYER_ASK","PLAYER_ASK","EVENT","EVENT","PLAYER_ASK","PLAYER_ASK","EVENT","CHARACTER_OPEN"]),"Lucifer 13-20 start modes must follow the design document");
assert.equal(JSON.stringify(Array.from(luciferThirteenToTwenty,event=>event.sensitivity)),JSON.stringify(["light","high","light","medium","medium","medium","light","light"]),"Lucifer 13-20 sensitivity levels must follow the design document");
assert.equal(JSON.stringify(Array.from(luciferThirteenToTwenty,event=>event.entries.find(entry=>entry.type==="choice")?.options?.length)),JSON.stringify([3,4,4,4,4,4,3,3]),"Lucifer 13-20 root choice counts must follow the design document");
let laterBandedLuciferResponses=0;
const laterIds=[];
for(const event of luciferThirteenToTwenty){
  const openingTypes=event.entries.slice(0,event.startMode==="PLAYER_ASK"?3:2).map(entry=>entry.type);
  if(event.startMode==="PLAYER_ASK")assert.equal(JSON.stringify(Array.from(openingTypes)),JSON.stringify(["narration","dialogue","dialogue"]),event.id+" must open with situation, PLAYER question, and Lucifer response");
  else assert.equal(openingTypes[0],"narration",event.id+" must open with visible event narration");
  walkEntries(event.entries,owner=>{
    if(owner?.id){assert.ok(!laterIds.includes(owner.id),owner.id+" must be unique");laterIds.push(owner.id)}
    const condition=owner?.affectionCondition;
    if(condition?.characterId==="lucifer-morningstar"){
      assert.notEqual(Number(condition.value),58,event.id+" must not use the old 58 split");
      if(condition.band){assert.ok(allowedBands.has(condition.band),event.id+" has invalid affection band");laterBandedLuciferResponses++}
    }
  });
}
assert.ok(laterBandedLuciferResponses>=100,"Lucifer 13-20 must contain substantial five-band response coverage");
for(const id of ["luc_t13_tension","luc_t14_closed","luc_t18_push","luc_t20_closed","luc_charlie_soft"]){
  assert.ok((luciferTopicPack.variables||[]).some(variable=>variable.id===id),"Lucifer 13-20 system variable missing: "+id);
}
assert.equal(luciferTopicPack.events[6].topicFamily,"missing_items","Lucifer 07 missing-items family missing");
assert.equal(luciferTopicPack.events[14].topicFamily,"cooking","Lucifer 15 cooking family missing");
assert.equal(luciferTopicPack.events[17].topicFamily,"alcohol","Lucifer 18 alcohol family missing");
assert.equal(luciferTopicPack.events[18].topicFamily,"cooking","Lucifer 19 cooking family missing");
assert.equal(luciferTopicPack.events[19].topicFamily,"sofa_lounge","Lucifer 20 sofa/lounge family missing");
assert.doesNotMatch(luciferTalk1330Code,/호텔 일상 쪽은|왕실 쪽은|하, 그건 이렇게 보자|오케이, 왕의 짧은 의견 하나/,"Lucifer 13-30 must not retain generic generated dialogue");
const luciferVariableIds=new Set((luciferTopicPack.variables||[]).map(variable=>variable.id));
for(const event of luciferTopicPack.events.slice(0,30))walkEntries(event.entries,owner=>{
  for(const effect of owner?.effects||[])if(effect.variableId)assert.ok(luciferVariableIds.has(effect.variableId),owner.id+" references missing variable "+effect.variableId);
});

const luciferTwentyOneToThirty=luciferTopicPack.events.slice(20,30);
assert.equal(JSON.stringify(Array.from(luciferTwentyOneToThirty,event=>event.startMode)),JSON.stringify(["PLAYER_ASK","PLAYER_ASK","PLAYER_ASK","PLAYER_ASK","EVENT","PLAYER_ASK","PLAYER_ASK","PLAYER_ASK","CHARACTER_OPEN","EVENT"]),"Lucifer 21-30 start modes must follow the design document");
assert.equal(JSON.stringify(Array.from(luciferTwentyOneToThirty,event=>event.sensitivity)),JSON.stringify(["medium","medium","medium","high","high","high","high","medium","light","medium"]),"Lucifer 21-30 sensitivity levels must follow the design document");
assert.equal(JSON.stringify(Array.from(luciferTwentyOneToThirty,event=>event.entries.find(entry=>entry.type==="choice")?.options?.length)),JSON.stringify([3,4,4,4,4,4,4,3,3,4]),"Lucifer 21-30 root choice counts must follow the design document");
assert.equal(luciferTopicPack.events[20].topicFamily,"reputation_power","Lucifer 21 reputation topic family missing");
assert.equal(luciferTopicPack.events[27].topicFamily,"reputation_power","Lucifer 28 reputation topic family missing");
assert.equal(luciferTopicPack.events[23].topicFamily,"heaven_sensitive","Lucifer 24 heaven-sensitive family missing");
assert.equal(luciferTopicPack.events[25].topicFamily,"royal_duty_sensitive","Lucifer 26 royal-duty family missing");
for(const id of ["luc_t21_tension","luc_t24_push","luc_t27_closed","luc_t30_tension","luc_unknown_contract_redemption","luc_food_interest"]){
  assert.ok(luciferVariableIds.has(id),"Lucifer 21-30 system variable missing: "+id);
}
const topic29AffectionEffects=[];
walkEntries(luciferTopicPack.events[28].entries,owner=>topic29AffectionEffects.push(...(owner.affectionEffects||[])));
assert.ok(topic29AffectionEffects.every(effect=>Number(effect.amount)>=0),"Lucifer 29 LIGHT topic must not punish the player");
const allLuciferIds=[];
for(const event of luciferTopicPack.events.slice(0,30))walkEntries(event.entries,owner=>{if(owner?.id)allLuciferIds.push(owner.id)});
assert.equal(new Set(allLuciferIds).size,allLuciferIds.length,"Lucifer 01-30 entry and option IDs must be unique");
const luciferThirtyOneToSixty=luciferTopicPack.events.slice(30,60);
assert.equal(JSON.stringify(Array.from(luciferThirtyOneToSixty,event=>event.startMode)),JSON.stringify(["CHARACTER_OPEN","PLAYER_ASK","PLAYER_ASK","EVENT","EVENT","EVENT","EVENT","EVENT","PLAYER_ASK","PLAYER_ASK","EVENT","EVENT","PLAYER_ASK","PLAYER_ASK","EVENT","PLAYER_ASK","EVENT","EVENT","EVENT","PLAYER_ASK","EVENT","EVENT","CHARACTER_OPEN","PLAYER_ASK","PLAYER_ASK","PLAYER_ASK","PLAYER_ASK","PLAYER_ASK","PLAYER_ASK","EVENT"]),"Lucifer 31-60 start modes must follow the design document");
assert.equal(JSON.stringify(Array.from(luciferThirtyOneToSixty,event=>event.sensitivity)),JSON.stringify(["light","high","medium","medium","light","light","medium","light","high","medium","light","light","medium","medium","medium","high","medium","light","light","high","light","medium","light","medium","light","light","medium","high","light","light"]),"Lucifer 31-60 sensitivity levels must follow the design document");
assert.ok(luciferThirtyOneToSixty.every(event=>event.entries.find(entry=>entry.type==="choice")?.options?.length===3),"Lucifer 31-60 must keep three focused root choices");
assert.equal(JSON.stringify(luciferTopicPack.events.slice(0,30)),luciferFirst30Before3160,"Lucifer 31-60 override must not modify 01-30");
for(const event of luciferThirtyOneToSixty){
  if(event.startMode==="PLAYER_ASK"){
    const firstDialogue=event.entries.find(entry=>entry.type==="dialogue");
    assert.equal(firstDialogue?.speaker,"PLAYER",event.id+" PLAYER_ASK must show the player question before Lucifer replies");
  }else assert.equal(event.entries[0]?.type,"narration",event.id+" EVENT/CHARACTER_OPEN must begin with visible narration");
}
assert.equal(luciferTopicPack.events[31].topicFamily,"heaven_sensitive","Lucifer 32 heaven family missing");
assert.equal(luciferTopicPack.events[33].topicFamily,"media_vox","Lucifer 34 media/Vox family missing");
assert.equal(luciferTopicPack.events[35].topicFamily,"alcohol","Lucifer 36 alcohol family missing");
assert.equal(luciferTopicPack.events[40].topicFamily,"sofa_lounge","Lucifer 41 sofa family missing");
assert.equal(luciferTopicPack.events[42].topicFamily,"future_hotel","Lucifer 43 future-hotel family missing");
assert.equal(luciferTopicPack.events[45].topicFamily,"royal_duty_sensitive","Lucifer 46 royal-duty family missing");
assert.equal(luciferTopicPack.events[48].topicFamily,"travel","Lucifer 49 travel family missing");
assert.equal(luciferTopicPack.events[50].topicFamily,"missing_items","Lucifer 51 missing-items family missing");
assert.equal(luciferTopicPack.events[57].topicFamily,"counseling","Lucifer 58 counseling family missing");
assert.equal(luciferTopicPack.events[59].topicFamily,"cooking","Lucifer 60 cooking family missing");
for(const id of ["luc_t31_tension","luc_t32_push","luc_t39_tension","luc_t46_push","luc_t50_closed","luc_t58_closed","luc_t60_tension","luc_charlie_autonomy"]){
  assert.ok(luciferVariableIds.has(id),"Lucifer 31-60 system variable missing: "+id);
}
assert.doesNotMatch(luciferTalk3160Code,/오케이, 왕의 짧은 의견 하나|굳이 하나만 고르면—|하, 그건 이렇게 보자|호텔 일상 쪽은/,"Lucifer 31-60 must not retain generic generated dialogue");
const ids3160=[],negativeTopics=new Set();
for(const [offset,event] of luciferThirtyOneToSixty.entries())walkEntries(event.entries,owner=>{
  if(owner?.id)ids3160.push(owner.id);
  for(const effect of owner?.effects||[])if(effect.variableId)assert.ok(luciferVariableIds.has(effect.variableId),owner.id+" references missing variable "+effect.variableId);
  if((owner?.affectionEffects||[]).some(effect=>Number(effect.amount)<0))negativeTopics.add(offset+31);
});
assert.equal(new Set(ids3160).size,ids3160.length,"Lucifer 31-60 entry and option IDs must be unique");
for(const topic of [32,39,44,46,50,51,58])assert.ok(negativeTopics.has(topic),"Lucifer "+topic+" must preserve its low-affinity penalty branch");
assert.equal(fs.existsSync(new URL("data/lucifer-talk-13-20.js",root)),false,"obsolete Lucifer 13-20 override must be removed");

const soloEventIds=new Set();
const allSoloCharacterLines=[];
const allSoloChoiceLabels=[];
const allSoloChoicePrompts=[];
for(const pack of soloTalkPacks){
  const characterId=pack.requiredCharacterIds?.[0]||"";
  assert.equal((pack.events||[]).length,7,pack.id+" must contain seven curated theme scenes");
  assert.equal(pack.version,11,pack.id+" must use character- and scene-specific solo TALK content");
  const characterLines=[];
  const choicePrompts=[];
  const choiceLabels=[];
  for(const event of pack.events||[]){
    assert.equal(event.characterId,characterId,event.id+" must stay in its selected character room");
    assert.ok(!soloEventIds.has(event.id),event.id+" must be globally unique");
    soloEventIds.add(event.id);
    assert.equal(event.entries.filter(entry=>entry.type==="choice").length,1,event.id+" must present interaction as a choice");
    const opening=String(event.entries?.[0]?.text||"").trim();
    assert.ok(opening.length>0,event.id+" must begin with a visible situation");
    assert.ok([...opening].length<=70,event.id+" opening narration is too long");
    assert.ok(!/이라는 말에|그 말|그 질문|그 얘기|아까 했던|방금 말/.test(opening),event.id+" opening narration must not depend on missing prior dialogue");
    const playerLines=[];
    walkEntries(event.entries,entry=>{if(entry.type==="dialogue"&&entry.speaker==="PLAYER")playerLines.push(entry)});
    assert.equal(playerLines.length,0,event.id+" must not play direct PLAYER dialogue pages");
    const rootChoice=event.entries.find(entry=>entry.type==="choice");
    assert.equal(rootChoice?.options?.length,2,event.id+" must provide two distinct approaches");
    choicePrompts.push(rootChoice.prompt);
    allSoloChoicePrompts.push(rootChoice.prompt);
    for(const option of rootChoice?.options||[]){
      choiceLabels.push(option.label);
      allSoloChoiceLabels.push(option.label);
      const branchLines=[];
      walkEntries(option.entries,entry=>{if(entry.type==="dialogue")branchLines.push(entry)});
      assert.equal(branchLines.length,2,event.id+" each choice must continue through distinct low/high character reactions");
      assert.equal(option.affectionEffects?.[0]?.characterId,characterId,event.id+" choice must preserve TALK affection progression");
      assert.equal(option.exitMode,"continue",event.id+" choice must return to the event flow after its reaction");
    }
    walkEntries(event.entries,entry=>{
      if(entry.type!=="dialogue"||!entry.speakerCharacterId)return;
      assert.equal(entry.speakerCharacterId,characterId,event.id+" must not switch to another character speaker");
      const line=String(entry.text||"").replace(/\s+/g," ").trim();
      assert.ok([...line].length<=60,event.id+" solo TALK line is too long for the dialogue box");
      characterLines.push(line);
      allSoloCharacterLines.push(line);
    });
  }
  const duplicates=characterLines.filter((line,index)=>line&&characterLines.indexOf(line)!==index);
  assert.deepEqual(duplicates,[],pack.id+" must not repeat exact character dialogue lines");
  const tokens=line=>new Set(String(line).replace(/[^a-zA-Z0-9가-힣\s]/g," ").split(/\s+/).filter(token=>token.length>=2));
  const similarity=(left,right)=>{
    const a=tokens(left),b=tokens(right);
    if(!a.size||!b.size)return 0;
    let overlap=0;
    for(const token of a)if(b.has(token))overlap+=1;
    return overlap/(a.size+b.size-overlap);
  };
  let worstSimilarity=0;
  for(let i=0;i<characterLines.length;i++)for(let j=i+1;j<characterLines.length;j++){
    worstSimilarity=Math.max(worstSimilarity,similarity(characterLines[i],characterLines[j]));
  }
  assert.ok(worstSimilarity<0.55,pack.id+" has near-duplicate character dialogue");
  assert.equal(new Set(choicePrompts).size,choicePrompts.length,pack.id+" must not repeat choice prompts");
  assert.equal(new Set(choiceLabels).size,choiceLabels.length,pack.id+" must not repeat player choice wording");
}
assert.equal(new Set(allSoloCharacterLines).size,allSoloCharacterLines.length,"different characters must not share exact SOLO TALK dialogue lines");
assert.equal(new Set(allSoloChoiceLabels).size,allSoloChoiceLabels.length,"SOLO TALK player choices must not be reused across characters");
assert.equal(new Set(allSoloChoicePrompts).size,allSoloChoicePrompts.length,"SOLO TALK choice prompts must not be reused across characters");
assert.ok(!allSoloCharacterLines.some(line=>line.includes("분위기를 읽는 눈은 있네, 베이비")),"retired Asmodeus repeat line must not return");
assert.ok(!allSoloCharacterLines.some(line=>line.includes("이 정도 설명이면 호기심은 잠시 달랠 수 있겠지요")),"shared elegant closer must not return");
assert.ok(!allSoloCharacterLines.some(line=>line.includes("밤이 지나기 전")&&line.includes("내 방식으로 마무리")),"shared night closer must not return");
assert.ok(!soloTalkCode.includes("ACTIVE_TAILS"),"shared solo TALK tail templates must be removed");
assert.ok(!soloTalkCode.includes("MOMENTS"),"generic solo TALK moment templates must be removed");
assert.ok(!soloTalkCode.includes("compactTail"),"three-part solo TALK composition must be removed");
assert.ok(!soloTalkCode.includes("STYLE_BY_CHARACTER"),"shared character style groups must not return");
assert.ok(!soloTalkCode.includes("SOFT_STYLE"),"shared solo voice style tables must not return");
assert.match(soloTalkCode,/SOFT_BY_CHARACTER/,"solo TALK must use character-specific response tables");
assert.ok(!soloTalkCode.includes("천박한 건 좋아하지만 무례한 건 질색이라서"),"repeated Asmodeus etiquette sentence must be removed");

const relationshipContext={window:{}};
vm.runInNewContext(relationshipCode,relationshipContext);
const relationshipPacks=relationshipContext.window.HV_STORY_PACKS||[];
assert.equal(relationshipPacks.length,33,"relationship packs must cover all 33 active characters");
assert.equal(relationshipPacks.reduce((sum,pack)=>sum+(pack.asks||[]).length,0),66,"relationship ASK must add two tiers per active character");
assert.equal(relationshipPacks.reduce((sum,pack)=>sum+(pack.events||[]).length,0),60,"relationship TALK must remove retired Belphegor/Leviathan scenes");
for(const pack of relationshipPacks){
  assert.equal((pack.asks||[]).length,2,pack.id+" must have mid/deep relationship ASK");
  assert.equal(pack.version,6,pack.id+" relationship voice pack must be on branching version 6");
  const [mid,deep]=pack.asks;
  assert.equal(mid.unlockMinAffection,35,pack.id+" mid ASK affection gate mismatch");
  assert.equal(deep.unlockMinAffection,70,pack.id+" deep ASK affection gate mismatch");
  assert.equal(deep.unlockAskCondition?.askId,mid.id,pack.id+" deep ASK must require the mid ASK");
  for(const event of pack.events||[]){
    const directPlayer=[];
    walkEntries(event.entries,entry=>{if(entry.type==="dialogue"&&entry.speaker==="PLAYER")directPlayer.push(entry)});
    assert.equal(directPlayer.length,0,event.id+" relationship TALK must not page direct PLAYER dialogue");
    const choice=event.entries.find(entry=>entry.type==="choice");
    assert.equal(choice?.options?.length,2,event.id+" relationship TALK must provide two response paths");
    for(const option of choice?.options||[]){
      const replies=[];
      walkEntries(option.entries,entry=>{if(entry.type==="dialogue"&&entry.speakerCharacterId===event.characterId)replies.push(entry)});
      assert.equal(replies.length,2,event.id+" relationship choice must have low/high follow-up reactions");
    }
  }
  for(const ask of pack.asks||[]){
    const directPlayer=[];
    walkEntries(ask.entries,entry=>{if(entry.type==="dialogue"&&entry.speaker==="PLAYER")directPlayer.push(entry)});
    assert.equal(directPlayer.length,0,ask.id+" ASK must use the selected question instead of a PLAYER dialogue page");
  }
}
const relationPack=id=>relationshipPacks.find(pack=>pack.id==="relationship-"+id);
const dialogueTexts=event=>{
  const texts=[];
  walkEntries(event?.entries,entry=>{if(entry.type==="dialogue")texts.push(entry.text||"")});
  return texts;
};
assert.ok(dialogueTexts(relationPack("velvette")?.events?.[0]).some(text=>/알고리즘|피드/.test(text)),"Velvette needs influencer/SNS queen diction");
assert.ok(dialogueTexts(relationPack("valentino")?.events?.[0]).some(text=>/플로리다|병신|씨발/.test(text)),"Valentino needs rough Florida-rooted diction");
assert.ok(dialogueTexts(relationPack("cherri-bomb")?.events?.[2]).some(text=>/엔젤|숨기고 싶지/.test(text)),"Cherri high-affection TALK must reveal personal feelings");
assert.ok(dialogueTexts(relationPack("fizzarolli")?.events?.[2]).some(text=>/쓸모없|조용히/.test(text)),"Fizz high-affection TALK must drop the performer mask");
assert.ok(dialogueTexts(relationPack("stolas")?.events?.[2]).some(text=>/옥타비아|블리츠/.test(text)),"Stolas high-affection TALK must reveal private worries");
assert.ok(dialogueTexts(relationPack("octavia")?.events?.[2]).some(text=>/부모님|싸우/.test(text)),"Octavia high-affection TALK must reveal family worries");
assert.ok(dialogueTexts(relationPack("blitzo")?.events?.[0]).some(text=>/씨발|야한/.test(text)),"Blitzo TALK needs rude, crude humor");
assert.ok((relationPack("angel-dust")?.asks||[]).some(ask=>(ask.entries||[]).some(entry=>/야한 농담|그냥 나/.test(entry.text||""))),"Angel ASK needs flirt-mask vulnerability");
assert.ok((relationPack("adam")?.asks||[]).some(ask=>(ask.entries||[]).some(entry=>/씨발|좆같/.test(entry.text||""))),"Adam ASK needs crude ego-driven diction");
const nonSexualCharacters=["charlie-morningstar","emily","sera","niffty","octavia"];
const sexualPattern=/섹스|키스|침대|야한|흥분|플러팅|꼬시|가슴|엉덩이|벗겨|벗기|신음/;
for(const characterId of nonSexualCharacters){
  const pack=relationPack(characterId);
  const relationText=[
    ...(pack?.events||[]).flatMap(dialogueTexts),
    ...(pack?.asks||[]).flatMap(ask=>(ask.entries||[]).map(entry=>entry.text||""))
  ].join(" ");
  assert.ok(!sexualPattern.test(relationText),characterId+" relationship dialogue must remain non-sexual");

  const solo=soloTalkPacks.find(pack=>pack.requiredCharacterIds?.[0]===characterId);
  const soloText=(solo?.events||[]).flatMap(dialogueTexts).join(" ");
  assert.ok(!sexualPattern.test(soloText),characterId+" solo TALK must remain non-sexual");
}
assert.match((relationPack("charlie-morningstar")?.asks||[])[1]?.entries?.map(entry=>entry.text||"").join(" ")||"",/배기|손 잡/,"Charlie's deep relationship ASK must focus on Vaggie intimacy without sexual content");

const banterContext={window:{HV_STORY_PACKS:[]}};
vm.runInNewContext(banterCode,banterContext);
const banterPacks=banterContext.window.HV_STORY_PACKS||[];
assert.equal(banterPacks.length,33,"character banter must cover exactly 33 characters");
assert.ok(!banterPacks.some(pack=>pack.requiredCharacterIds?.[0]==="belphegor"||pack.requiredCharacterIds?.[0]==="leviathan"),"Belphegor and Leviathan must not receive new banter packs");
assert.equal(banterPacks.reduce((sum,pack)=>sum+(pack.events||[]).length,0),33,"each included character must receive one unique banter event");
assert.equal(banterPacks.reduce((sum,pack)=>sum+(pack.asks||[]).length,0),66,"each included character must receive two extra ASK entries");
const banterLinesByCharacter=new Map();
for(const pack of banterPacks){
  const characterId=pack.requiredCharacterIds?.[0]||"";
  assert.equal(pack.version,3,pack.id+" banter pack must be syncable");
  assert.equal((pack.events||[]).length,1,pack.id+" must have one bespoke relationship/humor event");
  assert.equal((pack.asks||[]).length,2,pack.id+" must have two bespoke ASK entries");
  const event=pack.events[0];
  const choice=event.entries.find(entry=>entry.type==="choice");
  assert.equal(choice?.options?.length,2,event.id+" bespoke banter must branch into two reactions");
  const directPlayer=[];
  const texts=[];
  walkEntries(event.entries,entry=>{
    if(entry.type==="dialogue"&&entry.speaker==="PLAYER")directPlayer.push(entry);
    if(entry.type==="dialogue"&&entry.speakerCharacterId===characterId)texts.push(String(entry.text||"").trim());
  });
  assert.equal(directPlayer.length,0,event.id+" bespoke banter must not use direct PLAYER dialogue pages");
  for(const ask of pack.asks||[]){
    walkEntries(ask.entries,entry=>{if(entry.type==="dialogue"&&entry.speakerCharacterId===characterId)texts.push(String(entry.text||"").trim())});
  }
  const duplicates=texts.filter((line,index)=>line&&texts.indexOf(line)!==index);
  assert.deepEqual(duplicates,[],pack.id+" bespoke content must not repeat exact character lines");
  banterLinesByCharacter.set(characterId,texts);
}
for(const characterId of nonSexualCharacters){
  const texts=(banterLinesByCharacter.get(characterId)||[]).join(" ");
  assert.ok(!sexualPattern.test(texts),characterId+" banter/ASK content must remain non-sexual");
}
assert.ok((banterLinesByCharacter.get("asmodeus")||[]).some(line=>/젠틀|천박|베이비|섹시/.test(line)),"Asmodeus bespoke banter must mix gentlemanly and vulgar diction");
assert.ok((banterLinesByCharacter.get("lucifer-morningstar")||[]).some(line=>/찰리|오리/.test(line)),"Lucifer banter must expose Charlie/duck relationship humor");
assert.ok((banterLinesByCharacter.get("vox")||[]).some(line=>/벨벳|발렌티노/.test(line)),"Vox banter must expose Vee relationships");

const itemPresetContext={window:{}};
vm.runInNewContext(itemPresetCode,itemPresetContext);
assert.equal(
  itemPresetContext.window.HV_BUILD_ITEM_REACTION,
  undefined,
  "automatic gift reaction builder must remain disabled after AUTO REACTIONS reset"
);
assert.equal(
  typeof itemPresetContext.window.HV_APPLY_ITEM_PRESETS,
  "function",
  "item preset cleanup hook missing"
);
{
  const manualReaction={
    id:"item-reaction-manual-smoke",
    characterId:"lucifer-morningstar",
    preference:"NEUTRAL",
    affectionDelta:0,
    firstEntries:[{type:"dialogue",text:"수동 반응"}],
    repeatEntries:[],
    specialEntries:[]
  };
  const presetState={
    itemPresetVersion:0,
    characters:[{id:"lucifer-morningstar",name:"Lucifer Morningstar"}],
    items:[{id:"smoke-gift",name:"테스트 선물",rarity:"RARE",collectionCharacterId:"lucifer-morningstar",reactions:[manualReaction]}]
  };
  const result=itemPresetContext.window.HV_APPLY_ITEM_PRESETS(presetState,{normalizeItemReaction:value=>value});
  assert.equal(result.state.items[0].reactions.length,1,"manual item reactions must be preserved");
  assert.equal(result.state.items[0].reactions[0].id,"item-reaction-manual-smoke","manual reaction id must remain untouched");
}

const originContext={window:{}};
vm.runInNewContext(originIntroCode,originContext);
for(const characterId of nonSexualCharacters){
  const intro=originContext.window.HV_ORIGIN_INTROS?.[characterId]||{};
  const introText=Object.values(intro).join(" ");
  assert.ok(!sexualPattern.test(introText),characterId+" origin intros must remain non-sexual");
}
assert.match(characterEventCode,/id:"lute".*?씨발.*?젠장/s,"Lute should retain profanity in irritated/angry scenes");
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
assert.match(dialogueCode,/function recentTalkFamilies\(/,"related TALK cooldown helper missing");
assert.match(dialogueCode,/!recentFamilies\.has\(ev\.topicFamily\)/,"related TALK families must not appear back-to-back");
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
vm.runInContext(luciferAcquisitionCode,context,{filename:"data/lucifer-dialogue-acquisitions.js"});
vm.runInContext(luciferThoughtCode,context,{filename:"data/lucifer-thoughts.js"});
vm.runInContext(stateCode,context,{filename:"js/core/state.js"});

const luciferThoughtInstallCheck=vm.runInContext(`
(()=>{
  const source=normalizeState({
    schemaVersion:4,
    characters:[{id:"lucifer-morningstar",name:"Lucifer Morningstar",origin:"angel"}],
    thoughts:[]
  });
  const installed=installStoryPacks(source).state;
  const thoughts=installed.thoughts.filter(row=>row.characterId==="lucifer-morningstar"&&String(row.id||"").startsWith("lucifer-thought-"));
  const earlyExclusive=thoughts.filter(row=>row.minAffection===0&&row.maxAffection<100);
  const earlyPersistent=thoughts.filter(row=>row.minAffection<40&&row.maxAffection===100);
  const warmPersistent=thoughts.filter(row=>row.minAffection>=45&&row.minAffection<80&&row.maxAffection===100);
  const close=thoughts.filter(row=>row.minAffection>=80&&row.maxAffection===100);
  const at10=thoughts.filter(row=>10>=row.minAffection&&10<=row.maxAffection);
  const at90=thoughts.filter(row=>90>=row.minAffection&&90<=row.maxAffection);
  return{
    count:thoughts.length,
    earlyExclusive:earlyExclusive.length,
    earlyPersistent:earlyPersistent.length,
    warmPersistent:warmPersistent.length,
    close:close.length,
    at10HasClose:at10.some(row=>row.minAffection>=80),
    at90HasEarlyPersistent:at90.some(row=>row.minAffection<40&&row.maxAffection===100),
    at90HasWarmPersistent:at90.some(row=>row.minAffection>=45&&row.minAffection<80&&row.maxAffection===100),
    at90HasClose:at90.some(row=>row.minAffection>=80),
    at90HasExpiredEarly:at90.some(row=>row.maxAffection<90),
    hasDialogueReflection:thoughts.some(row=>/별 지도|우울한 오리|사과 씨앗|사슴 대가리/.test(row.text)),
    frequencies:[...new Set(thoughts.map(row=>row.frequency))]
  };
})()
`,context);
assert.ok(luciferThoughtInstallCheck.count>=40,"Lucifer affinity THOUGHT preset must install the curated pool");
assert.ok(luciferThoughtInstallCheck.earlyExclusive>=4,"clearly distant early THOUGHTs must be allowed to expire");
assert.ok(luciferThoughtInstallCheck.earlyPersistent>=5,"ordinary early THOUGHTs must remain available at high affection");
assert.ok(luciferThoughtInstallCheck.warmPersistent>=10,"warm THOUGHTs must remain available after they unlock");
assert.ok(luciferThoughtInstallCheck.close>=5,"very-close THOUGHT pool missing");
assert.equal(luciferThoughtInstallCheck.at10HasClose,false,"low affection must not include close THOUGHTs");
assert.equal(luciferThoughtInstallCheck.at90HasEarlyPersistent,true,"high affection must still include ordinary lower-affection THOUGHTs");
assert.equal(luciferThoughtInstallCheck.at90HasWarmPersistent,true,"high affection must still include warm THOUGHTs");
assert.equal(luciferThoughtInstallCheck.at90HasClose,true,"high affection must add close THOUGHTs");
assert.equal(luciferThoughtInstallCheck.at90HasExpiredEarly,false,"explicit early-only THOUGHTs must not survive past their max affection");
assert.equal(luciferThoughtInstallCheck.hasDialogueReflection,true,"Lucifer THOUGHT should include dialogue/event/question-reflective writing");
assert.ok(luciferThoughtInstallCheck.frequencies.includes("common")&&luciferThoughtInstallCheck.frequencies.includes("normal")&&luciferThoughtInstallCheck.frequencies.includes("rare"),"Lucifer THOUGHT must use common/normal/rare frequency tiers");

const luciferExistingThoughtMigrationCheck=vm.runInContext(`
(()=>{
  const source=normalizeState({
    schemaVersion:4,
    characters:[{id:"lucifer-morningstar",name:"Lucifer Morningstar",origin:"angel"}],
    thoughts:[
      {
        id:"legacy-luci-duck",
        characterId:"lucifer-morningstar",
        category:"일상",
        frequency:"common",
        minAffection:0,
        maxAffection:100,
        text:"작업대 밑에 오리가 또 늘었네."
      },
      {
        id:"legacy-luci-secret",
        characterId:"lucifer-morningstar",
        category:"비밀",
        frequency:"rare",
        minAffection:0,
        maxAffection:100,
        text:"후광 조각을 다시 보면 그때의 내가 같이 떠오른다."
      },
      {
        id:"legacy-luci-guarded",
        characterId:"lucifer-morningstar",
        category:"관계",
        frequency:"common",
        minAffection:0,
        maxAffection:100,
        text:"아직은 굳이 오래 이야기할 필요 없어."
      },
      {
        id:"legacy-luci-manual",
        characterId:"lucifer-morningstar",
        category:"관계",
        frequency:"normal",
        minAffection:33,
        maxAffection:88,
        text:"이미 직접 설정한 Thought."
      }
    ]
  });
  const installed=installStoryPacks(source).state;
  const byId=id=>installed.thoughts.find(row=>row.id===id);
  return{
    duck:{min:byId("legacy-luci-duck")?.minAffection,max:byId("legacy-luci-duck")?.maxAffection},
    secret:{min:byId("legacy-luci-secret")?.minAffection,max:byId("legacy-luci-secret")?.maxAffection},
    guarded:{min:byId("legacy-luci-guarded")?.minAffection,max:byId("legacy-luci-guarded")?.maxAffection},
    manual:{min:byId("legacy-luci-manual")?.minAffection,max:byId("legacy-luci-manual")?.maxAffection},
    version:installed.storyPackVersions?.["thought-preset-lucifer-affinity"]||0
  };
})()
`,context);
assert.ok(luciferExistingThoughtMigrationCheck.duck.min<=25,"ordinary existing Lucifer daily THOUGHT should unlock early");
assert.equal(luciferExistingThoughtMigrationCheck.duck.max,100,"ordinary existing Lucifer THOUGHT should remain visible at high affection");
assert.ok(luciferExistingThoughtMigrationCheck.secret.min>=85,"sensitive existing Lucifer THOUGHT should unlock late");
assert.equal(luciferExistingThoughtMigrationCheck.secret.max,100,"sensitive existing Lucifer THOUGHT should remain visible after unlock");
assert.ok(luciferExistingThoughtMigrationCheck.guarded.max<100,"clearly guarded early THOUGHT should expire later");
assert.equal(luciferExistingThoughtMigrationCheck.manual.min,33,"manual THOUGHT minimum affection must be preserved");
assert.equal(luciferExistingThoughtMigrationCheck.manual.max,88,"manual THOUGHT maximum affection must be preserved");
assert.equal(luciferExistingThoughtMigrationCheck.version,3,"Lucifer THOUGHT migration version must persist in storyPackVersions");

const thoughtLegacyAffectionCheck=vm.runInContext(`
(()=>{
  const thought=normalizeThought({
    id:"legacy-thought",
    characterId:"lucifer-morningstar",
    requiredAffection:35,
    affectionMax:64,
    frequency:"normal",
    text:"legacy"
  });
  return{min:thought.minAffection,max:thought.maxAffection};
})()
`,context);
assert.equal(thoughtLegacyAffectionCheck.min,35,"legacy THOUGHT requiredAffection must migrate to minAffection");
assert.equal(thoughtLegacyAffectionCheck.max,64,"legacy THOUGHT affectionMax must migrate to maxAffection");

const luciferAcquisitionInstallCheck=vm.runInContext(`
(()=>{
  const source=normalizeState({
    schemaVersion:4,
    characters:[{id:"lucifer-morningstar",name:"Lucifer Morningstar",origin:"angel"}],
    items:[
      {
        id:"item-1789237782413-b24d1dcc58ec3",
        name:"백플립 덕",
        category:"장난감",
        rarity:"RARE",
        collectionCharacterId:"lucifer-morningstar",
        acquisitionMode:"repeatable",
        enabled:true,
        gachaEnabled:true
      }
    ],
    events:[],
    asks:[],
    variables:[]
  });
  const installed=installStoryPacks(source).state;
  const event=installed.events.find(row=>row.id==="lucifer-acq-talk-backflip-duck");
  const text=(event?.entries||[]).map(entry=>entry.text||"").filter(Boolean);
  const grants=(event?.entries||[]).flatMap(entry=>entry.itemEffects||[]);
  const ownedBranch=(event?.entries||[]).find(entry=>entry.id==="lucifer-acq-talk-backflip-duck-owned-1");
  return{
    exists:Boolean(event),
    role:event?.eventRole||"",
    effectId:event?.dialogueAcquisitionEffectId||"",
    text,
    grants,
    ownedCondition:ownedBranch?.itemCondition||null,
    ownedClaim:ownedBranch?.itemEffectClaimCondition||null
  };
})()
`,context);
assert.equal(luciferAcquisitionInstallCheck.exists,true,"Lucifer independent acquisition TALK must install");
assert.equal(luciferAcquisitionInstallCheck.role,"talk","Lucifer acquisition scene must remain a TALK event");
assert.ok(luciferAcquisitionInstallCheck.text.some(line=>/여덟, 아홉, 열/.test(line)),"Lucifer acquisition TALK text must survive event normalization");
assert.ok(luciferAcquisitionInstallCheck.grants.some(effect=>effect.itemId==="item-1789237782413-b24d1dcc58ec3"),"Lucifer acquisition TALK must preserve itemEffects");
assert.match(luciferAcquisitionInstallCheck.effectId,/lucifer-dialogue-acquired-item-1789237782413/,"Lucifer acquisition TALK completion marker missing");
assert.equal(luciferAcquisitionInstallCheck.ownedCondition?.operator,">=","owned-item alternate dialogue branch missing");
assert.equal(luciferAcquisitionInstallCheck.ownedClaim?.status,"unclaimed","owned-item branch must remain available until dialogue acquisition is claimed");

const luciferLegacyCustodyCleanupCheck=vm.runInContext(`
(()=>{
  const source=normalizeState({
    schemaVersion:4,
    characters:[{id:"lucifer-morningstar",name:"Lucifer Morningstar",origin:"angel"}],
    items:[{
      id:"item-1789238615638-c2e89857e40d18",
      name:"오래된 별 지도",
      category:"기념품",
      rarity:"EPIC",
      collectionCharacterId:"lucifer-morningstar",
      inventoryEventId:"legacy-custody-star-map",
      acquisitionMode:"repeatable",
      enabled:true,
      gachaEnabled:true
    }],
    events:[{
      id:"legacy-custody-star-map",
      name:"TALK · 오래된 별 지도 · 보관을 맡기다",
      characterId:"lucifer-morningstar",
      eventRole:"talk",
      entries:[{
        id:"legacy-custody-line",
        type:"narration",
        text:"legacy",
        itemEffects:[{
          id:"legacy-custody-grant",
          itemId:"item-1789238615638-c2e89857e40d18",
          amount:1,
          once:true
        }]
      }]
    }],
    claimedItemEffectIds:["legacy-custody-grant"],
    discoveredTalkIds:["legacy-custody-star-map"]
  });
  const installed=installStoryPacks(source).state;
  const item=installed.items.find(row=>row.id==="item-1789238615638-c2e89857e40d18");
  return{
    legacyExists:installed.events.some(row=>row.id==="legacy-custody-star-map"),
    inventoryEventId:item?.inventoryEventId||"",
    claimed:[...(installed.claimedItemEffectIds||[])],
    discovered:[...(installed.discoveredTalkIds||[])]
  };
})()
`,context);
assert.equal(luciferLegacyCustodyCleanupCheck.legacyExists,false,"legacy Lucifer custody TALK must be removed");
assert.equal(luciferLegacyCustodyCleanupCheck.inventoryEventId,"","legacy Lucifer custody inventoryEventId must be cleared");
assert.ok(!luciferLegacyCustodyCleanupCheck.claimed.includes("legacy-custody-grant"),"legacy Lucifer custody claim id must be cleared");
assert.ok(!luciferLegacyCustodyCleanupCheck.discovered.includes("legacy-custody-star-map"),"legacy Lucifer custody discovery id must be cleared");

const retiredCharacterPurgeCheck=vm.runInContext(`
(()=>{
  const source=normalizeState({
    schemaVersion:4,
    characters:[
      {id:"lucifer-morningstar",name:"Lucifer Morningstar",origin:"hellborn"},
      {id:"belphegor",name:"Belphegor",origin:"hellborn"},
      {id:"leviathan",name:"Leviathan",origin:"hellborn"}
    ],
    events:[
      {id:"keep-event",characterId:"lucifer-morningstar",entries:[{id:"keep-line",type:"dialogue",text:"keep"}]},
      {id:"lucifer-giftx-belphegor-delivery",characterId:"lucifer-morningstar",entries:[{id:"gift-line",type:"dialogue",text:"keep related gift event"}]},
      {id:"belphegor-event",characterId:"belphegor",entries:[{id:"retired-line",type:"dialogue",text:"remove"}]}
    ],
    asks:[{id:"leviathan-ask",characterId:"leviathan",label:"remove",entries:[]}],
    items:[
      {id:"keep-item",name:"keep",collectionCharacterId:"lucifer-morningstar",reactions:[
        {id:"keep-reaction",characterId:"lucifer-morningstar"},
        {id:"belphegor-reaction",characterId:"belphegor"}
      ]},
      {id:"belphegor-item",name:"retired",collectionCharacterId:"belphegor"},
      {id:"gift-item-lucifer-giftx-leviathan-seaglass-duck",name:"레비아탄이 준 선물",collectionCharacterId:"lucifer-morningstar",reactions:[
        {id:"preset-reaction-gift-item-lucifer-giftx-leviathan-seaglass-duck-lucifer-morningstar",characterId:"lucifer-morningstar"}
      ]},
      {id:"gift-item-lucifer-giftx-belphegor-sleep-mask",name:"벨페고르가 준 선물",collectionCharacterId:"lucifer-morningstar"},
      {id:"item-1789235633790-c5e0065c154d4",name:"에즈라엘 덕",collectionCharacterId:"lucifer-morningstar"},
      {id:"item-1789235310866-d72ed2ef92e908",name:"가브리엘 덕",collectionCharacterId:"lucifer-morningstar"},
      {id:"item-1789235202505-8e39df8e8c9a8",name:"미카엘 덕",collectionCharacterId:"lucifer-morningstar"}
    ],
    inventoryCounts:{
      "keep-item":1,
      "belphegor-item":2,
      "gift-item-lucifer-giftx-leviathan-seaglass-duck":1,
      "gift-item-lucifer-giftx-belphegor-sleep-mask":1,
      "item-1789235633790-c5e0065c154d4":1,
      "item-1789235310866-d72ed2ef92e908":1,
      "item-1789235202505-8e39df8e8c9a8":1
    },
    itemHistory:[
      {itemId:"gift-item-lucifer-giftx-leviathan-seaglass-duck",source:"DIALOGUE",amount:1,at:1},
      {itemId:"gift-item-lucifer-giftx-belphegor-sleep-mask",source:"DIALOGUE",amount:1,at:2},
      {itemId:"item-1789235633790-c5e0065c154d4",source:"GACHA",amount:1,at:3}
    ],
    discoveredGiftReactionKeys:[
      "gift-item-lucifer-giftx-leviathan-seaglass-duck::lucifer-morningstar",
      "gift-item-lucifer-giftx-belphegor-sleep-mask::lucifer-morningstar"
    ],
    favoriteCharacterIds:["lucifer-morningstar","belphegor"],
    seenOriginIntroCharacterIds:["leviathan"],
    playState:{
      variables:{belphegor_flag:true,"lucifer.gift.belphegor_delivery":true,keep:true},
      affection:{belphegor:50,"lucifer-morningstar":60},
      emotions:{leviathan:{state:"calm",intensity:10}},
      log:[],
      recentTalks:{belphegor:["belphegor-event"],"lucifer-morningstar":["keep-event","lucifer-giftx-belphegor-delivery"]}
    },
    collectionSettings:{expandedCharacterIds:["belphegor","lucifer-morningstar"]},
    gacha:{history:[
      {itemId:"gift-item-lucifer-giftx-leviathan-seaglass-duck",name:"레비아탄이 준 선물"},
      {itemId:"item-1789235310866-d72ed2ef92e908",name:"가브리엘 덕"}
    ]}
  });
  return {
    characters:source.characters.map(row=>row.id),
    events:source.events.map(row=>row.id),
    asks:source.asks.map(row=>row.id),
    items:source.items.map(row=>row.id),
    keepReactions:source.items.find(row=>row.id==="keep-item")?.reactions.map(row=>row.characterId)||[],
    leviathanReactions:source.items.find(row=>row.id==="gift-item-lucifer-giftx-leviathan-seaglass-duck")?.reactions.map(row=>row.characterId)||[],
    inventory:Object.keys(source.inventoryCounts),
    itemHistory:source.itemHistory.map(row=>row.itemId),
    giftKeys:source.discoveredGiftReactionKeys,
    gachaItems:(source.gacha?.history||[]).map(row=>row.itemId),
    favorites:source.favoriteCharacterIds,
    origins:source.seenOriginIntroCharacterIds,
    variables:Object.keys(source.playState.variables),
    affection:Object.keys(source.playState.affection),
    emotions:Object.keys(source.playState.emotions),
    recent:Object.keys(source.playState.recentTalks),
    recentLucifer:source.playState.recentTalks["lucifer-morningstar"]||[],
    expanded:source.collectionSettings.expandedCharacterIds
  };
})()
`,context);
assert.deepEqual([...retiredCharacterPurgeCheck.characters],["lucifer-morningstar"],"retired characters must be removed from saved state");
assert.deepEqual([...retiredCharacterPurgeCheck.events],["keep-event","lucifer-giftx-belphegor-delivery"],"active-character events that merely mention a retired Sin must remain");
assert.equal(retiredCharacterPurgeCheck.asks.length,0,"retired character ASK must be removed from saved state");
assert.deepEqual([...retiredCharacterPurgeCheck.items],[
  "keep-item",
  "gift-item-lucifer-giftx-leviathan-seaglass-duck",
  "gift-item-lucifer-giftx-belphegor-sleep-mask"
],"Lucifer-owned Leviathan/Belphegor gifts must remain while the three removed ducks are purged");
assert.deepEqual([...retiredCharacterPurgeCheck.keepReactions],["lucifer-morningstar"],"retired-character gift reactions must be removed from unrelated items");
assert.deepEqual([...retiredCharacterPurgeCheck.leviathanReactions],["lucifer-morningstar"],"Lucifer reaction to a Leviathan gift must remain");
assert.deepEqual([...retiredCharacterPurgeCheck.inventory],[
  "keep-item",
  "gift-item-lucifer-giftx-leviathan-seaglass-duck",
  "gift-item-lucifer-giftx-belphegor-sleep-mask"
],"inventory must preserve active-character Sin gifts and remove deleted ducks");
assert.deepEqual([...retiredCharacterPurgeCheck.itemHistory],[
  "gift-item-lucifer-giftx-leviathan-seaglass-duck",
  "gift-item-lucifer-giftx-belphegor-sleep-mask"
],"item history must preserve Leviathan/Belphegor gifts");
assert.equal(retiredCharacterPurgeCheck.giftKeys.length,2,"gift discovery keys for Leviathan/Belphegor gifts must remain");
assert.deepEqual([...retiredCharacterPurgeCheck.gachaItems],["gift-item-lucifer-giftx-leviathan-seaglass-duck"],"gacha history must preserve Sin gifts and remove deleted ducks");
assert.deepEqual([...retiredCharacterPurgeCheck.favorites],["lucifer-morningstar"],"retired favorites must be removed");
assert.equal(retiredCharacterPurgeCheck.origins.length,0,"retired origin intro flags must be removed");
assert.deepEqual([...retiredCharacterPurgeCheck.variables],["lucifer.gift.belphegor_delivery","keep"],"Lucifer gift flags may mention Belphegor and must remain");
assert.deepEqual([...retiredCharacterPurgeCheck.affection],["lucifer-morningstar"],"retired affection state must be removed");
assert.equal(retiredCharacterPurgeCheck.emotions.length,0,"retired emotion state must be removed");
assert.deepEqual([...retiredCharacterPurgeCheck.recent],["lucifer-morningstar"],"retired recent TALK state must be removed");
assert.deepEqual([...retiredCharacterPurgeCheck.recentLucifer],["keep-event","lucifer-giftx-belphegor-delivery"],"Lucifer gift-related recent TALK must remain");
assert.deepEqual([...retiredCharacterPurgeCheck.expanded],["lucifer-morningstar"],"retired collection expansion state must be removed");

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
assert.equal(storyPackInstall.packVersion,4,"story pack version marker missing");
assert.equal(storyPackInstall.openingVisible,true,"opening event must be visible");
assert.equal(storyPackInstall.hiddenVisible,false,"continuation event must be hidden");
assert.equal(storyPackInstall.speakerCharacterId,"lucifer-morningstar","speaker image id must survive compaction");
assert.equal(storyPackInstall.secondChanged,false,"story pack must install only once");

const storyPackCountBeforeLuciferAsk=context.window.HV_STORY_PACKS.length;
context.window.HV_STORY_PACKS.push(structuredClone(luciferIntegratedAsk));
const luciferAskInstall=vm.runInContext(`
(()=>{
  const source=normalizeState({
    schemaVersion:4,
    characters:[{id:"lucifer-morningstar",name:"Lucifer Morningstar",origin:"hellborn"}],
    storyPackVersions:{"unified-asks-lucifer-morningstar":3},
    asks:[{id:"banter-ask-lucifer-morningstar-01",characterId:"lucifer-morningstar",label:"legacy",entries:[]}],
    askedAskIds:["banter-ask-lucifer-morningstar-01"],
    unlockedAskIds:["banter-ask-lucifer-morningstar-01"],
    interactionHistory:[{id:"legacy-history",kind:"ask",characterId:"lucifer-morningstar",askId:"banter-ask-lucifer-morningstar-01"}]
  });
  const installed=installStoryPacks(source).state;
  const legacyDefault=normalizeAsk({id:"legacy-repeat",characterId:"lucifer-morningstar",repeatable:true,affectionDelta:2,entries:[]});
  return{
    version:installed.storyPackVersions["unified-asks-lucifer-morningstar"],
    askCount:installed.asks.filter(ask=>ask.characterId==="lucifer-morningstar").length,
    hasLegacy:installed.asks.some(ask=>ask.id==="banter-ask-lucifer-morningstar-01"),
    asked:installed.askedAskIds,
    unlocked:installed.unlockedAskIds,
    historyAskId:installed.interactionHistory[0]?.askId,
    integratedRepeat:installed.asks.find(ask=>ask.id==="lucifer-ask-rude-father")?.repeatAffectionDelta,
    legacyRepeat:legacyDefault.repeatAffectionDelta,
    legacyOnce:legacyDefault.applyAskDeltaOnce
  };
})()
`,context);
context.window.HV_STORY_PACKS.length=storyPackCountBeforeLuciferAsk;
assert.equal(luciferAskInstall.version,5,"Lucifer integrated ASK installer version missing");
assert.equal(luciferAskInstall.askCount,68,"Lucifer integrated ASK installer must replace legacy questions without duplicates");
assert.equal(luciferAskInstall.hasLegacy,false,"retired Lucifer ASK must be removed during upgrade");
assert.deepEqual([...luciferAskInstall.asked],["lucifer-ask-charlie-similar"],"legacy asked ASK progress must migrate to the integrated id");
assert.deepEqual([...luciferAskInstall.unlocked],["lucifer-ask-charlie-similar"],"legacy unlocked ASK progress must migrate to the integrated id");
assert.equal(luciferAskInstall.historyAskId,"lucifer-ask-charlie-similar","legacy ASK history must migrate to the integrated id");
assert.equal(luciferAskInstall.integratedRepeat,-2,"integrated repeat affinity must survive installation");
assert.equal(luciferAskInstall.legacyRepeat,2,"legacy repeatable ASK must preserve its previous affinity behavior");
assert.equal(luciferAskInstall.legacyOnce,false,"legacy ASK must not silently gain one-time affinity semantics");

const itemPresetResetCheck=vm.runInContext(`
(()=>{
  const source=normalizeState({
    schemaVersion:4,
    itemPresetVersion:0,
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
        id:"manual-lucifer-mug",
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
  return{
    weight:item.weight,
    reactionCount:item.reactions.length,
    reactionId:item.reactions[0]?.id||"",
    first:item.reactions[0]?.firstEntries?.length||0,
    itemPresetVersion:installed.state.itemPresetVersion,
    publicBuilder:typeof window.HV_BUILD_ITEM_REACTION
  };
})()
`,context);
assert.equal(itemPresetResetCheck.weight,1,"AUTO REACTIONS reset must preserve explicit per-item gacha weight");
assert.equal(itemPresetResetCheck.reactionCount,1,"manual CHARACTER REACTIONS must be preserved");
assert.equal(itemPresetResetCheck.reactionId,"manual-lucifer-mug","manual reaction identity must remain unchanged");
assert.equal(itemPresetResetCheck.first,0,"AUTO REACTIONS reset must not repopulate blank manual gift flows");
assert.equal(itemPresetResetCheck.itemPresetVersion,7,"item preset reset version marker missing");
assert.equal(itemPresetResetCheck.publicBuilder,"undefined","automatic gift reaction builder must stay disabled");

const itemPresetWeightPreserveCheck=vm.runInContext(`
(()=>{
  const source=normalizeState({
    schemaVersion:4,
    itemPresetVersion:7,
    characters:[{id:"lucifer-morningstar",name:"Lucifer Morningstar",origin:"hellborn"}],
    items:[{
      id:"lucifer-letter-test",
      name:"찰리에게 보내려다 만 편지",
      rarity:"EPIC",
      collectionCharacterId:"lucifer-morningstar",
      giftable:true,
      gachaEnabled:true,
      weight:.77,
      reactions:[]
    }]
  });
  const installed=installStoryPacks(source);
  return{
    weight:installed.state.items[0].weight,
    reactionCount:installed.state.items[0].reactions.length
  };
})()
`,context);
assert.equal(itemPresetWeightPreserveCheck.weight,.77,"AUTO REACTIONS reset must preserve user-edited current-version gacha weight");
assert.equal(itemPresetWeightPreserveCheck.reactionCount,0,"AUTO REACTIONS reset must not generate replacement reactions");

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
      {id:"charlie-morningstar",name:"Charlie Morningstar",origin:"hellborn"},
      {id:"lucifer-morningstar",name:"Lucifer Morningstar",origin:"hellborn"}
    ],
    events:[{
      id:"legacy-english-line",
      name:"TALK · grief",
      characterId:"lute",
      entries:[
        {id:"line-1",type:"dialogue",speakerCharacterId:"lute",text:"Adam is dead. 그 사실 이후로 내겐 이 싸움이 명령 이상의 것이 됐어."},
        {id:"line-2",type:"dialogue",speakerCharacterId:"charlie-morningstar",text:"Charlie. Stop. Breathe."}
      ]
    },{
      id:"legacy-contextless-lucifer",
      name:"TALK · hotel",
      characterId:"lucifer-morningstar",
      entries:[
        {id:"legacy-lucifer-n",type:"narration",text:"그리고 호텔을 돕는 방식이라는 말에 루시퍼의 표정이 잠깐 부드러워진다."}
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
    luciferOpening:result.events.find(event=>event.id==="legacy-contextless-lucifer")?.entries?.[0]?.text||"",
    version:result.dialoguePresetVersion
  };
})()
`,context);
assert.ok(legacyDialogueLocalizationCheck.eventLines[0].startsWith("아담은 죽었어."),"legacy English character dialogue must be localized");
assert.equal(legacyDialogueLocalizationCheck.eventLines[1],"찰리. 멈춰. 숨 쉬어.","mixed legacy English dialogue must be localized");
assert.equal(legacyDialogueLocalizationCheck.askLine,"먼저 물어봐!","legacy ASK English text must be localized");
assert.equal(legacyDialogueLocalizationCheck.giftLine,"좋아! 그렇지!","legacy gift English text must be localized");
assert.equal(legacyDialogueLocalizationCheck.logLine,"아담은 죽었어.","saved dialogue history must be localized");
assert.match(legacyDialogueLocalizationCheck.luciferOpening,/호텔 업무 메모/,"contextless Lucifer legacy opening must be rewritten with a visible situation");
assert.ok(!legacyDialogueLocalizationCheck.luciferOpening.includes("이라는 말에"),"rewritten Lucifer opening must not depend on missing prior dialogue");
assert.equal(legacyDialogueLocalizationCheck.version,22,"dialogue tuning migration version missing");

const characterEventPackSnapshot=vm.runInContext(`
(window.HV_STORY_PACKS||[])
  .filter(pack=>String(pack.id||"").startsWith("voice-events-"))
  .map(pack=>({
    id:pack.id,
    refs:pack.characterRefs||{},
    events:pack.events||[]
  }))
`,context);
const fullLegacyRefRepairCheck=vm.runInContext(`
(()=>{
  const packs=${JSON.stringify(characterEventPackSnapshot)};
  const characterRows=[];
  const events=[];
  for(const pack of packs){
    for(const [token,aliases] of Object.entries(pack.refs||{})){
      const preferred=(aliases||[]).find(value=>String(value).includes("-"))||(aliases||[])[0];
      if(!preferred)continue;
      if(!characterRows.some(row=>row.id===preferred))characterRows.push({id:preferred,name:preferred,origin:"hellborn"});
      for(const sourceEvent of pack.events||[]){
        events.push({
          ...sourceEvent,
          characterId:token,
          entries:(sourceEvent.entries||[]).map(entry=>entry.type==="dialogue"
            ? {...entry,speakerCharacterId:token}
            : entry
          )
        });
      }
    }
  }
  const source=normalizeState({
    schemaVersion:4,
    dialoguePresetVersion:16,
    characters:characterRows,
    events
  });
  const result=window.HV_APPLY_DIALOGUE_PRESETS(source,{normalizeEntry,normalizeEvent,normalizeVariable,normalizeItemEffects}).state;
  const ids=new Set(result.characters.map(character=>character.id));
  const bad=[];
  const visit=entries=>{
    for(const entry of entries||[]){
      if(entry.speakerCharacterId&&!ids.has(entry.speakerCharacterId))bad.push(entry.speakerCharacterId);
      if(entry.affectionCondition?.characterId&&!ids.has(entry.affectionCondition.characterId))bad.push(entry.affectionCondition.characterId);
      if(entry.emotionCondition?.characterId&&!ids.has(entry.emotionCondition.characterId))bad.push(entry.emotionCondition.characterId);
      if(entry.type==="choice")for(const option of entry.options||[])visit(option.entries);
    }
  };
  for(const event of result.events||[]){
    if(!ids.has(event.characterId))bad.push(event.characterId);
    visit(event.entries);
  }
  return{bad,total:result.events.length,version:result.dialoguePresetVersion};
})()
`,context);
assert.equal(fullLegacyRefRepairCheck.total,48,"all legacy voice events must be included in the repair fixture");
assert.equal(fullLegacyRefRepairCheck.bad.length,0,"all legacy voice event character references must be repaired");
assert.equal(fullLegacyRefRepairCheck.version,22,"full character-ref repair must advance dialogue preset version");

const storyPackCountBeforeTuning=context.window.HV_STORY_PACKS.length;
context.window.HV_STORY_PACKS.push(...structuredClone(relationshipPacks));
const tunedDialogueSyncCheck=vm.runInContext(`
(()=>{
  const fresh=(window.HV_STORY_PACKS||[]).find(pack=>pack.id==="relationship-velvette");
  const eventId=fresh.events[0].id;
  const askId=fresh.asks[0].id;
  const source=normalizeState({
    schemaVersion:4,
    dialoguePresetVersion:7,
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
assert.equal(tunedDialogueSyncCheck.version,22,"tuned dialogue sync must advance preset version");
context.window.HV_STORY_PACKS.length=storyPackCountBeforeTuning;

context.window.HV_STORY_PACKS.push(...structuredClone(soloTalkPacks));
const soloDialogueSyncCheck=vm.runInContext(`
(()=>{
  const fresh=(window.HV_STORY_PACKS||[]).find(pack=>pack.id==="solo-talks-asmodeus");
  const eventId=fresh.events[0].id;
  const source=normalizeState({
    schemaVersion:4,
    dialoguePresetVersion:16,
    characters:[{id:"asmodeus",name:"Asmodeus",origin:"hellborn"}],
    events:[
      {id:eventId,name:"OLD",characterId:"asmodeus",eventRole:"talk",menuVisible:true,entries:[{id:"old",type:"dialogue",speakerCharacterId:"asmodeus",speaker:"ASMODEUS",text:"분위기를 읽는 눈은 있네, 베이비."}]},
      {id:"solo-talk-asmodeus-08",name:"SOLO TALK · retired",characterId:"asmodeus",eventRole:"talk",menuVisible:true,entries:[{id:"old8",type:"dialogue",speakerCharacterId:"asmodeus",text:"구형 filler"}]}
    ]
  });
  const result=window.HV_APPLY_DIALOGUE_PRESETS(source,{normalizeEntry,normalizeEvent,normalizeVariable,normalizeItemEffects}).state;
  const event=result.events[0];
  return{
    choiceCount:event.entries.filter(entry=>entry.type==="choice").length,
    retiredLine:JSON.stringify(event.entries).includes("분위기를 읽는 눈은 있네, 베이비"),
    retiredEventExists:result.events.some(row=>row.id==="solo-talk-asmodeus-08"),
    version:result.dialoguePresetVersion
  };
})()
`,context);
assert.equal(soloDialogueSyncCheck.choiceCount,1,"existing saves must receive the choice-driven solo TALK rewrite");
assert.equal(soloDialogueSyncCheck.retiredLine,false,"existing saves must remove the repeated Asmodeus line");
assert.equal(soloDialogueSyncCheck.retiredEventExists,false,"existing saves must remove retired solo TALK filler events");
assert.equal(soloDialogueSyncCheck.version,22,"solo TALK sync must advance preset version");
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

const luciferDialogueRewardFlow=vm.runInContext(`
(()=>{
  const itemId="item-1789237782413-b24d1dcc58ec3";
  const effectId="lucifer-dialogue-acquired-item-1789237782413-b24d1dcc58ec3";

  const runCase=startCount=>{
    state=normalizeState({
      schemaVersion:4,
      characters:[{id:"lucifer-morningstar",name:"Lucifer Morningstar",origin:"angel"}],
      items:[{
        id:itemId,
        name:"백플립 덕",
        rarity:"RARE",
        collectionCharacterId:"lucifer-morningstar",
        acquisitionMode:"repeatable",
        enabled:true,
        gachaEnabled:true
      }],
      inventoryCounts:{[itemId]:startCount},
      claimedItemEffectIds:[]
    });
    session=createSession();
    showItemAcquired=()=>{};
    saveProgressState=()=>{};

    playback={
      itemEffectClaimSnapshot:[],
      inventoryCountSnapshot:{[itemId]:startCount}
    };
    activeInteractionEvent={
      interactionMeta:{
        kind:"ask",
        itemEffectClaimSnapshot:[],
        inventoryCountSnapshot:{[itemId]:startCount}
      }
    };

    const ownedCondition={itemId,operator:">=",value:1,snapshot:true};
    const newCondition={itemId,operator:"<",value:1,snapshot:true};
    const beforeOwned=itemConditionPasses(ownedCondition);
    const beforeNew=itemConditionPasses(newCondition);
    const beforeUnclaimed=itemEffectClaimConditionPasses({effectId,status:"unclaimed"});
    const beforeClaimed=itemEffectClaimConditionPasses({effectId,status:"claimed"});

    applyItemEffects([{id:effectId,itemId,amount:1,once:true}]);

    const countAfter=itemCount(itemId);
    const liveClaimed=(state.claimedItemEffectIds||[]).includes(effectId);
    const sameAskUnclaimed=itemEffectClaimConditionPasses({effectId,status:"unclaimed"});
    const sameAskClaimed=itemEffectClaimConditionPasses({effectId,status:"claimed"});
    const sameAskOwned=itemConditionPasses(ownedCondition);
    const sameAskNew=itemConditionPasses(newCondition);

    playback={
      itemEffectClaimSnapshot:[...(state.claimedItemEffectIds||[])],
      inventoryCountSnapshot:{...(state.inventoryCounts||{})}
    };
    activeInteractionEvent={
      interactionMeta:{
        kind:"ask",
        itemEffectClaimSnapshot:[...(state.claimedItemEffectIds||[])],
        inventoryCountSnapshot:{...(state.inventoryCounts||{})}
      }
    };
    const nextAskUnclaimed=itemEffectClaimConditionPasses({effectId,status:"unclaimed"});
    const nextAskClaimed=itemEffectClaimConditionPasses({effectId,status:"claimed"});
    const nextAskOwned=itemConditionPasses(ownedCondition);
    const nextAskNew=itemConditionPasses(newCondition);

    return{
      startCount,beforeOwned,beforeNew,beforeUnclaimed,beforeClaimed,
      countAfter,liveClaimed,sameAskUnclaimed,sameAskClaimed,sameAskOwned,sameAskNew,
      nextAskUnclaimed,nextAskClaimed,nextAskOwned,nextAskNew
    };
  };

  return{
    fresh:runCase(0),
    gachaOwned:runCase(1)
  };
})()
`,context);

assert.equal(luciferDialogueRewardFlow.fresh.beforeNew,true,"fresh Lucifer dialogue reward must use the not-owned branch");
assert.equal(luciferDialogueRewardFlow.fresh.beforeOwned,false,"fresh Lucifer dialogue reward must not use the owned branch");
assert.equal(luciferDialogueRewardFlow.fresh.countAfter,1,"fresh Lucifer dialogue reward must add one item");
assert.equal(luciferDialogueRewardFlow.fresh.liveClaimed,true,"fresh Lucifer dialogue reward must record its claim");
assert.equal(luciferDialogueRewardFlow.fresh.sameAskUnclaimed,true,"first ASK must keep its acquisition branch stable after the grant");
assert.equal(luciferDialogueRewardFlow.fresh.sameAskClaimed,false,"first ASK must not immediately show repeat-after-claim lines");
assert.equal(luciferDialogueRewardFlow.fresh.sameAskNew,true,"fresh acquisition must stay on the not-owned branch after the item is granted");
assert.equal(luciferDialogueRewardFlow.fresh.sameAskOwned,false,"fresh acquisition must not jump into the pre-owned branch mid-dialogue");
assert.equal(luciferDialogueRewardFlow.fresh.nextAskUnclaimed,false,"next ASK must hide the one-time acquisition branch");
assert.equal(luciferDialogueRewardFlow.fresh.nextAskClaimed,true,"next ASK must show the already-acquired response");

assert.equal(luciferDialogueRewardFlow.gachaOwned.beforeOwned,true,"gacha-owned Lucifer item must use the already-owned dialogue branch");
assert.equal(luciferDialogueRewardFlow.gachaOwned.beforeNew,false,"gacha-owned Lucifer item must not use the fresh-item branch");
assert.equal(luciferDialogueRewardFlow.gachaOwned.countAfter,2,"gacha-owned Lucifer item must gain one extra copy from dialogue");
assert.equal(luciferDialogueRewardFlow.gachaOwned.liveClaimed,true,"gacha-owned dialogue reward must record its one-time claim");
assert.equal(luciferDialogueRewardFlow.gachaOwned.sameAskUnclaimed,true,"gacha-owned first ASK must remain on its owned acquisition branch until interaction end");
assert.equal(luciferDialogueRewardFlow.gachaOwned.sameAskClaimed,false,"gacha-owned first ASK must not append repeat dialogue immediately");
assert.equal(luciferDialogueRewardFlow.gachaOwned.sameAskOwned,true,"gacha-owned acquisition must stay on the pre-owned branch after gaining the extra copy");
assert.equal(luciferDialogueRewardFlow.gachaOwned.sameAskNew,false,"gacha-owned acquisition must never switch to the fresh branch");
assert.equal(luciferDialogueRewardFlow.gachaOwned.nextAskUnclaimed,false,"gacha-owned acquisition must not grant again on the next ASK");
assert.equal(luciferDialogueRewardFlow.gachaOwned.nextAskClaimed,true,"gacha-owned next ASK must switch to the already-given response");

const luciferAskRepeatCountCheck=vm.runInContext(`
(()=>{
  const askId="lucifer-acq-ask-charlie-duck";
  state=normalizeState({
    schemaVersion:4,
    characters:[{id:"lucifer-morningstar",name:"Lucifer Morningstar",origin:"angel"}],
    asks:[{id:askId,characterId:"lucifer-morningstar",label:"찰리를 닮은 오리도 만들었어요?",repeatable:true,entries:[]}],
    askedAskIds:[askId],
    interactionHistory:[]
  });
  session=createSession();

  const check=count=>{
    state.interactionHistory=Array.from({length:count},(_,index)=>({
      id:"ask-history-"+index,
      kind:"ask",
      characterId:"lucifer-morningstar",
      askId,
      label:"찰리를 닮은 오리도 만들었어요?"
    }));
    return{
      first:askConditionPasses({askId,status:"asked",minCount:1,maxCount:1}),
      second:askConditionPasses({askId,status:"asked",minCount:2,maxCount:2}),
      later:askConditionPasses({askId,status:"asked",minCount:3})
    };
  };

  return{one:check(1),two:check(2),four:check(4)};
})()
`,context);
assert.equal(luciferAskRepeatCountCheck.one.first,true,"second ASK must use the first repeat reaction");
assert.equal(luciferAskRepeatCountCheck.one.second,false,"second ASK must not use the third-ASK reaction");
assert.equal(luciferAskRepeatCountCheck.one.later,false,"second ASK must not use the long-term reaction");
assert.equal(luciferAskRepeatCountCheck.two.first,false,"third ASK must leave the first repeat reaction");
assert.equal(luciferAskRepeatCountCheck.two.second,true,"third ASK must use the second repeat reaction");
assert.equal(luciferAskRepeatCountCheck.two.later,false,"third ASK must not use the long-term reaction");
assert.equal(luciferAskRepeatCountCheck.four.first,false,"later repeats must not use the first repeat reaction");
assert.equal(luciferAskRepeatCountCheck.four.second,false,"later repeats must not use the second repeat reaction");
assert.equal(luciferAskRepeatCountCheck.four.later,true,"later ASK repeats must use the long-term reaction");

const askUnlockRetention=vm.runInContext(`
(()=>{
  state=normalizeState({
    schemaVersion:4,
    characters:[{id:"ask-char",name:"Ask",origin:"hellborn",affectionStart:44}],
    asks:[
      {id:"permanent-ask",characterId:"ask-char",label:"Permanent",startLocked:true,minAffection:45,unlockMinAffection:45,entries:[]},
      {id:"still-locked",characterId:"ask-char",label:"Locked",startLocked:true,minAffection:45,unlockMinAffection:45,entries:[]},
      {id:"live-threshold",characterId:"ask-char",label:"Threshold",startLocked:false,minAffection:45,entries:[]}
    ],
    unlockedAskIds:["permanent-ask"],
    playState:{affection:{"ask-char":44}}
  });
  session=createSession();
  return{
    permanent:askAffectionRequirementPasses(state.asks.find(ask=>ask.id==="permanent-ask")),
    locked:askAffectionRequirementPasses(state.asks.find(ask=>ask.id==="still-locked")),
    liveThreshold:askAffectionRequirementPasses(state.asks.find(ask=>ask.id==="live-threshold"))
  };
})()
`,context);
assert.equal(askUnlockRetention.permanent,true,"an unlocked ASK must remain available after affection drops below its unlock threshold");
assert.equal(askUnlockRetention.locked,false,"an ASK that was never unlocked must stay locked below its threshold");
assert.equal(askUnlockRetention.liveThreshold,false,"a non-locking ASK may still use its live minimum-affection requirement");

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
