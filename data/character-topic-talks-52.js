"use strict";

(()=>{
  const SOURCE=Array.isArray(window.HV_TOPIC_POOL_500)?window.HV_TOPIC_POOL_500:[];
  if(!SOURCE.length)return;

  const D=(id,who,speaker,text,extra={})=>({id:id,type:"dialogue",speakerCharacterId:who,speaker:speaker,text:text,...extra});
  const P=(id,text,extra={})=>D(id,"","PLAYER",text,extra);
  const N=(id,text,extra={})=>({id:id,type:"narration",text:text,...extra});
  const A=(who,operator,value)=>({characterId:who,operator:operator,value:value});
  const slug=s=>String(s).toLowerCase().replace(/[^a-z0-9가-힣]+/g,"-").replace(/^-|-$/g,"");
  const hash=s=>{let h=2166136261;for(const ch of String(s)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0};
  const pick=(arr,key)=>arr[hash(key)%arr.length];

  const PFS=[
    {id:"lucifer-morningstar",name:"Lucifer Morningstar",scope:"hazbin",cross:["helluva"],t:58,i:"family heaven power hotel redemption hellsociety leisure trust",easy:"hotel leisure power",guard:["왕한테 그걸 바로 묻는 배짱은 인정하지.","하, 꽤 큰 주제를 꺼냈네."],warm:["네가 물으면 대충 넘기기가 어렵네.","이 정도는 네 앞에서 말해도 되겠지."],rule:"권위보다 선택한 뒤 책임지는 쪽을 더 중요하게 봐",soft:"가족 얘기만 나오면 농담으로 빠져나가던 버릇이 조금 줄었어",a:["결재 서류를 오리 모양 문진으로 눌러둔다","작은 고무오리의 왕관을 손끝으로 바로잡는다","찰리가 남긴 메모를 접었다 펼친다"]},
    {id:"charlie-morningstar",name:"Charlie Morningstar",scope:"hazbin",t:45,i:"hotel redemption trust family heaven friendship morality",easy:"hotel redemption friendship trust",guard:["좋아, 이건 진짜 생각해볼 만한 주제야!","응! 그런데 쉬운 답은 아닐 것 같아."],warm:["네가 같이 생각해주면 훨씬 덜 막막해!","이건 너한테 꼭 솔직하게 말하고 싶어."],rule:"사람을 바꾸는 것보다 스스로 바뀔 기회를 열어두는 게 먼저라고 믿어",soft:"희망만 외치는 대신 상대가 싫다고 말할 권리도 더 신경 쓰게 됐어",a:["색색의 체크리스트를 무릎 위에 펼친다","호텔 일정표에 별표 하나를 더 그린다","새 프로그램 메모를 두 손으로 들고 읽는다"]},
    {id:"sera",name:"Sera",scope:"hazbin",t:52,i:"heaven extermination law power morality trust redemption",easy:"law heaven",guard:["가벼운 답을 기대한다면 곤란하군요.","그 주제는 책임과 분리해서 말할 수 없습니다."],warm:["당신이라면 불편한 맥락까지 들어줄 것 같군요.","조금 더 솔직하게 말해도 되겠지요."],rule:"선한 의도보다 결정이 실제로 누구에게 어떤 결과를 남겼는지를 봅니다",soft:"확신이 흔들렸다는 사실을 숨기는 데 쓰던 힘을 조금은 내려놓았습니다",a:["수정 표시가 빼곡한 문서를 덮는다","규정집의 같은 문장을 한 번 더 읽는다","회의 기록을 가지런히 정리한다"]},
    {id:"lute",name:"Lute",scope:"hazbin",t:55,i:"extermination violence heaven trust duty morality",easy:"violence duty",guard:["그 질문, 선 넘기 직전이야.","말 돌리지 마. 핵심부터 말해."],warm:["…네가 묻는 거라면 짧게는 답하지.","이젠 네가 그걸 약점으로 쓰지 않는다는 건 알아."],rule:"말보다 실제 상황에서 어떻게 움직였는지가 훨씬 정확해",soft:"누굴 잃었다는 이유로 판단까지 무뎌지는 건 싫지만 감정을 없는 척하는 것도 지쳤어",a:["칼날의 흠집을 엄지로 확인한다","장갑 끈을 다시 조인다","전투 기록표를 접어 옆에 둔다"]},
    {id:"adam",name:"Adam",scope:"hazbin",t:50,i:"heaven fame violence media selfworth leisure power",easy:"fame violence leisure",guard:["뭐야, 갑자기 철학 시간?","씨발, 재미없는 방향으로 가네."],warm:["너한텐 이 정도 말해도 지는 기분은 안 드네.","아, 됐어. 네가 이미 눈치챘을 것 같으니까 말한다."],rule:"존나 잘하면 인정받는 게 당연하다는 쪽이지만 인정만으로 다 설명 안 되는 것도 있긴 해",soft:"아무도 안 볼 때까지 계속 센 척할 필요는 없다는 걸 아주 조금은 인정했어",a:["기타 피크를 손가락 사이로 튕긴다","볼륨을 한 칸 낮추고 네 쪽을 본다","아무도 없는 객석을 한 번 훑어본다"]},
    {id:"vaggie",name:"Vaggie",scope:"hazbin",t:48,i:"hotel extermination trust violence family duty redemption",easy:"hotel duty violence",guard:["일단 현실적으로 보자.","쉽게 대답할 문제는 아니야."],warm:["네가 결론을 강요하지 않을 건 아니까 말할게.","같이 겪은 게 있으니까 설명이 덜 필요하네."],rule:"좋은 의도보다 위험할 때 실제로 누구를 지켰는지를 봐",soft:"경계를 내려놓는 것과 방심하는 건 다르다는 걸 이제는 구분할 수 있어",a:["비상구 확인표에 체크를 남긴다","찰리의 일정표를 현실적인 순서로 고친다","창 끝을 바닥에 세우고 숨을 고른다"]},
    {id:"alastor",name:"Alastor",scope:"hazbin",t:60,i:"soul power media hellsociety past leisure trust",easy:"media power leisure",guard:["하하! 제법 노골적인 화제군요.","흥미롭지만 답할 의무까지 생긴 건 아니랍니다."],warm:["당신이라면 일부는 들려드려도 괜찮겠군요.","아주 조금 특별 취급이라고 생각하셔도 좋습니다."],rule:"사람은 말보다 욕망이 드러나는 순간에 훨씬 재미있습니다",soft:"모든 정보를 거래 재료로만 보지 않아도 되는 상대가 드물게 생기긴 하는군요",a:["라디오 다이얼을 반 칸 돌린다","마이크 지팡이를 손끝에서 천천히 굴린다","찻잔을 받침에 소리 없이 내려놓는다"]},
    {id:"vox",name:"Vox",scope:"hazbin",t:58,i:"media tech power fame money trust hellsociety",easy:"media tech fame",guard:["그 주제, 데이터가 부족한데.","좋아. 대신 근거 없이 말하진 마."],warm:["네가 묻는 거면 원본 쪽으로 말해도 되겠지.","그래, 이번엔 편집 없이 간다."],rule:"반응과 영향력을 숫자로 보는 편이지만 숫자만으로 설명 안 되는 관계도 있다는 건 알아",soft:"편집 전 원본을 보여줘도 바로 손해 계산부터 하지 않는 순간이 늘었어",a:["실시간 그래프 창을 손가락으로 닫는다","화면 밝기를 조금 낮춘다","리모컨을 소파에 던지고 네 쪽으로 몸을 돌린다"]},
    {id:"niffty",name:"Niffty",scope:"hazbin",t:35,i:"hotel leisure work friendship food trust",easy:"hotel leisure work friendship food trust",guard:["오! 그 얘기 재밌겠다!","좋아! 빨리 말해봐!"],warm:["너랑 하는 얘기는 중간에 도망 안 가서 좋아!","좋아! 이건 오래 기억해둘래!"],rule:"가만히 고민하는 것보다 손부터 움직이면 뭔가 달라져",soft:"사람이 없어지는 건 먼지보다 훨씬 싫어서 요즘은 더 잘 기억해두려고 해",a:["빗자루를 겨드랑이에 끼고 고개를 든다","작은 단추 상자를 색깔별로 정리한다","소파 밑에서 먼지를 잡아내고 승리한 표정을 짓는다"]},
    {id:"angel-dust",name:"Angel Dust",scope:"hazbin",t:55,i:"fame romance selfworth trust past hotel leisure",easy:"fame leisure hotel",guard:["자기야, 그건 꽤 속옷 안쪽까지 들어오는 질문인데?","와, 갑자기 분위기 촉촉해지네."],warm:["네 앞에서는 굳이 예쁜 답으로 포장 안 해도 되겠지.","좋아, 오늘은 서비스 말고 진짜 나로 대답해줄게."],rule:"사람이 뭘 해줄 수 있느냐보다 아무것도 안 해도 곁에 남는지가 더 중요해졌어",soft:"농담으로 덮지 않아도 분위기가 안 죽는 사람이 있다는 걸 조금 믿게 됐지",a:["거울을 닫고 립스틱을 테이블에 내려놓는다","휴대폰 카메라를 끄고 화면을 뒤집어 놓는다","화려한 재킷 단추를 하나 풀고 편하게 앉는다"]},
    {id:"husk",name:"Husk",scope:"hazbin",t:48,i:"trust past soul leisure hotel morality",easy:"leisure hotel",guard:["그걸 굳이 나한테 묻냐.","…길게 말할 주제는 아니네."],warm:["너한텐 설명을 반쯤 생략해도 알아들을 것 같네.","좋아, 이번엔 대충 넘기지 않을게."],rule:"말보다 반복되는 습관이 사람을 더 정확하게 보여줘",soft:"체념이 편하다고 믿던 때보다 작은 선택을 다시 해보는 날이 늘었어",a:["이미 깨끗한 잔을 천천히 닦는다","카드 한 장을 뒤집어 테이블에 내려놓는다","병을 열려다 말고 다시 선반에 올린다"]},
    {id:"blitzo",name:"Blitzø",scope:"helluva",t:55,i:"imp work family romance past violence human trust",easy:"work violence human",guard:["씨발, 왜 하필 그 얘기냐?","좋아, 단 감정 상담처럼 굴면 바로 끝낸다."],warm:["너라면 내가 헛소리해도 바로 도망가진 않겠지.","이 정도는 이미 들킨 것 같으니까 말한다."],rule:"계획보다 몸부터 움직이는 편이지만 결국 누가 끝까지 남았는지는 기억해",soft:"버리기 전에 먼저 망치는 게 안전하다고 믿던 버릇이 아주 조금 덜 심해졌어",a:["장부 한쪽에 말 그림을 낙서한다","책상 위 총을 옆으로 밀어 공간을 만든다","오래된 사진 서랍을 닫지 않은 채 손을 뗀다"]},
    {id:"paimon",name:"Paimon",scope:"helluva",t:55,i:"goetia power family law hellsociety",easy:"goetia power law",guard:["그대의 질문은 다소 격식을 벗어났군.","가문의 일은 쉽게 논할 것이 아니오."],warm:["그대에게는 조금 덜 격식 차려 말해도 되겠군.","좋다. 오늘은 왕족보다 한 사람으로 답해보지."],rule:"책임과 지위는 분리하기 어렵다고 배웠으나 지위가 마음까지 대신 정해줄 수는 없더군",soft:"자녀를 가문의 항목으로만 보았던 시선을 뒤늦게 고치려 하고 있소",a:["왕실 일정표에서 시선을 뗀다","가문 문장이 새겨진 반지를 돌린다","두꺼운 기록서를 천천히 덮는다"]},
    {id:"satan",name:"Satan",scope:"helluva",t:50,i:"sin power law violence hellsociety duty trust",easy:"violence law power",guard:["핵심부터 말해.","그 얘기 장난처럼 꺼낸 건 아니겠지."],warm:["네가 묻는 거면 끝까지는 들어주지.","좋다. 이번엔 소리부터 지르진 않겠다."],rule:"힘이 있으면 책임도 끝까지 져야 한다고 본다",soft:"분노를 감추는 대신 어디까지 쓸지 고르는 쪽으로 바뀌고 있어",a:["쥔 주먹을 한 번 펴고 숨을 내쉰다","판결문을 반으로 접어 내려놓는다","운동용 붕대를 손에서 풀어낸다"]},
    {id:"mammon",name:"Mammon",scope:"helluva",t:50,i:"sin money fame media tech power",easy:"money fame media tech",guard:["그걸 돈으로 환산하면 얘기 쉬운데!","야, 갑자기 비즈니스 아닌 얘기냐?"],warm:["너한테는 매출 보고서 말고 다른 답도 해줄 수 있겠네.","좋아, 오늘은 브랜드 말고 내 생각으로 간다."],rule:"가치가 숫자로 보이면 편하지만 사람까지 전부 숫자로 만들면 언젠가 계산이 틀어지더라",soft:"손해 보는 선택도 선택이라는 말을 아주 가끔 진지하게 보게 됐어",a:["상품 샘플의 가격표를 뒤집어 놓는다","계산기를 두드리다 손을 멈춘다","자기 얼굴이 박힌 머그컵을 한쪽으로 민다"]},
    {id:"asmodeus",name:"Asmodeus",scope:"helluva",t:52,i:"sin romance trust fame party morality",easy:"romance trust party",guard:["베이비, 그건 분위기보다 선부터 확인해야 하는 주제야.","좋아, 대신 자극적인 답 기대하면 실망할걸."],warm:["네가 묻는 방식은 선을 알고 있어서 마음에 들어.","좋아, 베이비. 이번엔 꽤 진지하게 가보자."],rule:"욕망은 강할수록 더 분명한 허락과 경계가 필요해",soft:"사랑이 약점이 아니라 서로 선택하는 방식일 수 있다는 걸 피즈와 함께 배웠어",a:["클럽 조명을 한 단계 낮춘다","공연 콘셉트 문서에서 한 줄을 지운다","무대 쪽 소음을 줄이고 네 말을 듣는다"]},
    {id:"beelzebub",name:"Beelzebub",scope:"helluva",t:45,i:"sin party trust food leisure friendship",easy:"party trust food leisure friendship",guard:["오, 이거 파티 얘기보다 조금 깊다!","좋아! 근데 억지로 밝게 답하진 않을게!"],warm:["너랑은 기분 안 좋은 날 얘기도 자연스럽게 되네!","좋아, 이건 제대로 말해볼래!"],rule:"즐거움은 억지 텐션이 아니라 자기 상태를 솔직하게 알고 놀 때 오래가",soft:"사람들 사이에 있어도 외로울 수 있다는 걸 숨기지 않게 됐어",a:["파티 컵 대신 물병을 손에 든다","음악 볼륨을 조금 낮추고 고개를 기울인다","간식 트레이를 내려놓고 네 옆에 선다"]},
    {id:"sir-pentious",name:"Sir Pentious",scope:"hazbin",t:42,i:"tech redemption heaven friendship human trust",easy:"tech redemption friendship",guard:["오! 꽤 중대한 질문이로군!","흠, 이것은 발명품보다 답이 어렵소!"],warm:["그대에겐 솔직히 말해도 부끄럽지 않겠군.","좋소! 이번에는 과장 없이 말해보겠소."],rule:"실패한 설계도도 다음 시도의 재료가 되듯 사람도 다시 해볼 수 있다고 믿소",soft:"구원된 뒤에도 과거를 없애기보다 책임과 그리움을 함께 들고 가려 하오",a:["설계도를 말아 옆에 둔다","연기 나는 장치의 스위치를 끈다","망토를 정리하고 자세를 바로 한다"]},
    {id:"cherri-bomb",name:"Cherri Bomb",scope:"hazbin",t:50,i:"violence friendship past leisure trust",easy:"violence leisure friendship",guard:["야, 그건 폭탄보다 타이밍 구리게 터질 질문인데.","좋아, 대신 분위기 질질 끌진 말자."],warm:["너라면 불쌍하다는 얼굴 안 할 거니까 말한다.","좋아, 오늘은 폭발음 없이 얘기해보자."],rule:"재미는 좋아하지만 같이 노는 사람을 진짜 잃는 건 전혀 재미없어",soft:"농담으로 덮는 대신 그리운 건 그립다고 인정하는 날이 생겼어",a:["작은 폭탄의 안전핀을 다시 꽂는다","성냥갑을 닫고 테이블에 내려놓는다","창밖을 한 번 보고 씩 웃는다"]},
    {id:"velvette",name:"Velvette",scope:"hazbin",t:60,i:"media fame tech power selfworth",easy:"media fame tech",guard:["자기야, 그 주제 지금 트렌드도 아닌데 왜 캐?","좋아, 대신 촌스러운 결론은 금지."],warm:["네가 편집할 사람이 아니라는 건 아니까.","좋아, 필터 없이 간다. 드문 기회야."],rule:"보여주는 이미지도 힘이지만 그 이미지가 나를 전부 먹어버리게 두진 않을 거야",soft:"통제 못 하는 표정을 보여줘도 바로 약점이 되지 않는 관계가 있다는 건 인정해",a:["휴대폰 카메라를 끄고 화면을 뒤집는다","업로드 대기 중인 게시물을 잠시 멈춘다","댓글 창을 닫고 손가락으로 테이블을 두드린다"]},
    {id:"valentino",name:"Valentino",scope:"hazbin",t:62,i:"media fame romance power soul money trust",easy:"media fame money",guard:["베이비, 질문이 너무 안쪽으로 들어오는데.","그 얘기를 공짜로 풀 만큼 친절하진 않아."],warm:["네가 들은 걸 거래에 쓰지 않는다는 건 알지.","오늘은 계약 조건 없는 답을 하나 주지."],rule:"사람이 원하는 걸 알아내면 통제는 쉬워지지만 통제와 친밀감이 같은 건 아니더군",soft:"상대가 떠날 수 있는데도 남는 상황을 예전보다 덜 불편해하게 됐어",a:["계약서 모서리를 손톱으로 두드린다","담배 연기를 옆으로 흘려보낸다","촬영이 끝난 빈 스튜디오를 바라본다"]},
    {id:"carmilla-carmine",name:"Carmilla Carmine",scope:"hazbin",t:50,i:"power family law violence soul duty",easy:"law violence duty",guard:["먼저 책임의 범위를 분명히 하죠.","그 주제는 감정만으로 판단하지 않습니다."],warm:["당신이라면 책임까지 포함해 들을 거라 생각합니다.","이 정도 맥락은 공유해도 괜찮겠군요."],rule:"보호라는 이름을 붙였더라도 결과와 책임을 피할 수는 없습니다",soft:"가족을 지키려는 마음이 통제로 변하지 않도록 더 의식하려 합니다",a:["재고표의 마지막 수량을 확인한다","무기 상자의 잠금장치를 닫는다","장갑을 벗어 가지런히 테이블에 놓는다"]},
    {id:"rosie",name:"Rosie",scope:"hazbin",t:45,i:"trust friendship family hellsociety leisure morality",easy:"trust friendship leisure",guard:["어머, 오늘은 차보다 진한 이야기를 골랐군요.","그건 예의를 지키면서 다뤄야 할 주제랍니다."],warm:["당신이라면 제 말을 소문으로 만들진 않겠지요.","좋아요. 오늘은 제가 조금 더 말하는 쪽을 해볼게요."],rule:"사람은 말할 때보다 남의 이야기를 어떻게 간직하는지에서 더 잘 보인답니다",soft:"늘 들어주는 쪽에만 서지 않고 제 이야기에도 자리를 내어주게 되었어요",a:["찻잔에 뜨거운 물을 천천히 붓는다","설탕 집게를 내려놓고 손을 포갠다","찻주전자의 뚜껑을 덮고 네 쪽으로 몸을 돌린다"]},
    {id:"abel",name:"Abel",scope:"hazbin",t:42,i:"heaven family trust human redemption morality",easy:"heaven human trust",guard:["음… 그건 생각보다 어려운 질문이네요.","그 주제는 제가 아직 배우는 중이에요."],warm:["당신 앞에서는 모른다고 말해도 괜찮아서 좋아요.","좋아요. 이번엔 제가 먼저 솔직하게 말해볼게요."],rule:"모른다고 인정하고 다시 배우는 게 부끄러운 일은 아니라고 생각해요",soft:"아버지를 사랑했던 기억과 잘못을 인정하는 마음을 동시에 가져도 된다고 배우고 있어요",a:["질문 목록을 한 장 뒤로 넘긴다","아버지 기록의 책갈피를 끼운다","펜을 내려놓고 잠깐 생각한다"]},
    {id:"emily",name:"Emily",scope:"hazbin",t:40,i:"heaven redemption trust friendship culture morality",easy:"heaven redemption trust friendship culture",guard:["오! 이거 진짜 궁금했던 거야!","잠깐, 나 너무 빨리 대답하지 말고 생각할게!"],warm:["너랑은 이런 얘기 끝까지 해도 지치지 않아!","좋아! 이번엔 내가 먼저 마음부터 말해볼게!"],rule:"사랑하는 곳일수록 질문하면 안 되는 게 아니라 더 잘 알아야 한다고 믿어",soft:"모르는 사실이 무서워도 눈을 돌리지 않고 같이 묻는 사람이 있다는 게 큰 힘이 돼",a:["질문 목록에 별표를 하나 그린다","날개 끝을 살짝 접고 의자에 가까이 앉는다","흥분해서 말하려다 스스로 한 번 숨을 고른다"]},
    {id:"baxter",name:"Baxter",scope:"hazbin",t:50,i:"tech work human hellsociety morality selfworth",easy:"tech work",guard:["감상 말고 조건부터 정의해.","그건 변수 통제가 거의 불가능한 주제인데."],warm:["네가 이해한 척 안 하는 건 마음에 들어.","이번엔 데이터 말고 내 쪽 반응도 포함해볼게."],rule:"가설보다 결과가 틀리면 가설을 버려야지 자존심 때문에 데이터를 버리진 않아",soft:"실패 기록을 감추는 것보다 다음 실험에 쓰는 편이 낫다는 걸 사람 관계에도 조금 적용하게 됐어",a:["실험 로그의 실패 표시를 지우지 않고 남긴다","과열 장치의 전원을 마지못해 끈다","보안경을 이마 위로 올리고 네 쪽을 본다"]},
    {id:"zestial",name:"Zestial",scope:"hazbin",t:52,i:"power past hellsociety trust morality",easy:"power hellsociety",guard:["그 화두는 짧은 답을 허락하지 않는구려.","서두르면 뜻을 잃기 쉬운 이야기로다."],warm:["그대와는 오래된 말도 새 뜻을 얻는구려.","좋소. 오늘은 지난 세월까지 조금 곁들여 이야기해보지."],rule:"급히 내린 판단보다 오래 지켜본 변화에 더 무게를 두느니라",soft:"새것이 오래된 것을 지운다 생각하지 않고 나란히 놓일 수 있음을 다시 배우는 중이로다",a:["오래된 찻잎을 조금 덜어 잔에 넣는다","창밖 거리를 오래 바라보다 천천히 고개를 돌린다","낡은 기록 한 장을 접어 옆에 둔다"]},
    {id:"stolas",name:"Stolas",scope:"helluva",t:62,i:"goetia family romance human past trust power",easy:"goetia human",guard:["아… 그 이야기는 조금 조심스럽군요.","그건 왕실 예법으로는 정리되지 않는 문제랍니다."],warm:["당신이라면 제 감정을 대신 정리하려 하진 않겠지요.","솔직하지 않은 답이 오히려 더 실례일 것 같아요."],rule:"의무와 사랑을 같은 말로 착각하면 결국 누군가의 선택을 빼앗게 된다는 걸 배웠습니다",soft:"우아하지 않은 감정을 보여도 관계가 끝나지 않는 경험이 조금씩 쌓이고 있어요",a:["망원경에서 눈을 떼고 별 지도를 접는다","거대한 창가에 기대 있다가 네 쪽으로 돌아선다","옥타비아에게 보내려던 메시지를 저장하고 화면을 끈다"]},
    {id:"loona",name:"Loona",scope:"helluva",t:48,i:"imp family trust culture human selfworth",easy:"culture human",guard:["왜 그런 걸 물어.","그 얘기 길게 할 생각 없어."],warm:["네가 캐물으려고 묻는 건 아닌 건 알아.","너라면 내가 멈추라면 멈출 거잖아."],rule:"말보다 내 선을 지켜주는지가 더 중요해",soft:"기대 안 하면 덜 아프다는 생각이 항상 맞는 건 아니라는 증거가 조금 생겼어",a:["휴대폰 화면을 끄고 뒤집어 놓는다","헤드폰 한쪽을 귀에서 빼고 고개를 든다","메시지를 쓰다 지우고 폰을 주머니에 넣는다"]},
    {id:"moxxie",name:"Moxxie",scope:"helluva",t:45,i:"imp work family human violence morality trust culture",easy:"work human culture",guard:["그건 전제를 정확히 나누는 편이 좋겠습니다.","대충 말하면 오해가 생길 주제입니다."],warm:["당신과는 이런 토론을 끝까지 해도 괜찮겠군요.","좋습니다. 이번엔 원칙 말고 제 경험도 포함하죠."],rule:"두려움을 느끼는 것과 무책임한 건 전혀 다른 문제라고 생각합니다",soft:"제 판단을 존중해주는 사람 앞에서는 실패 가능성도 조금 덜 부끄럽게 말할 수 있습니다",a:["작전표의 마지막 오타를 고친다","악보를 접어 테이블 한쪽에 둔다","안경을 고쳐 쓰고 의자를 네 쪽으로 돌린다"]},
    {id:"millie",name:"Millie",scope:"helluva",t:42,i:"imp work family violence friendship trust",easy:"work violence friendship family",guard:["오, 그건 제대로 얘기해볼 만하네!","좋아! 근데 솔직하게 말할 거야!"],warm:["너한텐 약한 얘기까지 해도 이상하지 않더라.","좋아, 이번엔 진짜 속마음까지 말해볼게!"],rule:"사랑한다고 대신 싸워주는 것만이 답은 아니고 맡겨줄 때도 알아야 해",soft:"강한 척하지 않고 무섭다고 말해도 내가 약해지는 건 아니라는 걸 조금 알게 됐어",a:["칼날을 천으로 닦아 칼집에 넣는다","가족에게 온 편지를 접어 주머니에 넣는다","간식 봉지를 뜯어 네 쪽으로 내민다"]},
    {id:"fizzarolli",name:"Fizzarolli",scope:"helluva",t:60,i:"fame romance selfworth past media trust",easy:"fame media",guard:["와, 그거 무대 뒤에서도 잘 안 꺼내는 얘긴데.","관객 질문치곤 너무 안쪽인데?"],warm:["너라면 내가 안 웃겨도 자리 안 뜰 것 같아서 말한다.","좋아, 오늘은 펀치라인 없이 끝까지 가보자."],rule:"사람들이 웃는 순간은 좋지만 웃기지 못한다고 내가 사라지는 건 아니라는 걸 배우는 중이야",soft:"오지 말고도 조용한 나를 견디는 사람이 있다는 게 예전보다 덜 낯설어",a:["의수 관절을 점검하다 손을 멈춘다","메이크업 거울 조명을 한 칸 낮춘다","공연용 모자를 벗어 무릎 위에 올린다"]},
    {id:"octavia",name:"Octavia",scope:"helluva",t:62,i:"family goetia past trust culture romance",easy:"culture",guard:["지금 꼭 그 얘기 해야 해?","누구 편 들라는 식이면 대화 끝."],warm:["넌 결론 내리려고 듣는 건 아니니까.","그래. 오늘은 조금 더 말해도 될 것 같아."],rule:"누가 맞는지 정해주는 것보다 내가 느낀 걸 없던 일로 만들지 않는 게 더 중요해",soft:"좋았던 기억을 인정해도 지금의 화가 사라지는 건 아니라는 걸 받아들이고 있어",a:["플레이리스트 재생을 멈추고 헤드폰을 목에 건다","가족사진이 떠 있던 화면을 끄지 않은 채 내려놓는다","별 사진을 확대하다 손가락을 멈춘다"]}
  ].map(c=>({...c,interests:c.i.split(" "),easy:c.easy.split(" ")}));

  const RX=[
    ["hotel",/호텔|투숙객|객실|로비|조식|냉장고|소파|재활 시설|상담사|호텔 멤버|호텔 직원/],
    ["redemption",/구원|속죄|선행|죄인|재활|두 번째 기회|변했다|용서받|죄책감/],
    ["heaven",/천국|천사|위너|Sera|Lute|Abel|펜셔스.*천국/],
    ["extermination",/숙청|엑소시스트|아담의 죽음|전쟁|천사 무기|포로|평화 회담/],
    ["soul",/영혼|계약|오버로드|소유|허점/],
    ["media",/뉴스|방송|미디어|시청률|인터뷰|영상|라디오|텔레비전|복스|벨벳|Vees|선전|SNS|연예인|유행|이미지/],
    ["tech",/기술|스마트폰|인터넷|전자기기|복스텍|장치|발명|Grimoire/],
    ["power",/권력|왕족|오버로드|통치|서열|귀족|계급|영향력|왕실|혁명|힘이 강/],
    ["family",/가족|부모|자녀|형제|아버지|엄마|아빠|찰리|옥타비아|Octavia|릴리스|딸|가문/],
    ["romance",/연애|사랑|연인|데이트|결혼|질투|전 애인|비밀 연애|공개 연애|욕망|키스/],
    ["trust",/믿|신뢰|비밀|등을 맡|경계|친구 관계|화해|동행/],
    ["past",/과거|인간 시절|생전|죽기 전|어린 시절|기억|후회|처음.*지옥|살아 있을 때|예전/],
    ["human",/인간 세계|인간 세상|인간 문화|인간으로|인간의|인간들이|경찰|종교|역사적/],
    ["work",/업무|회사|직원|직책|의뢰|고객|장비|임무|사업|출근|상사|운영비/],
    ["imp",/I\.M\.P|Imp|Hellhound|Wrath|블리츠|목시|밀리|루나/],
    ["goetia",/Goetia|귀족|왕족|가문|정략결혼|Grimoire|스톨라스|Octavia/],
    ["sin",/7대 죄악|죄악|Asmodeus|Beelzebub|Mammon|Satan|Sinsmas|Lust Ring|Gluttony|Greed|Sloth/],
    ["party",/파티|술 취|노래방|Ozzie's|게임|축제|Sinsmas/],
    ["fame",/유명|팬|연예|이미지|브랜드|공연|무대|시청률|유행/],
    ["law",/법|법원|판결|규칙|처벌|시민권|배상|책임|관리해야|제한해야|금지/],
    ["hellsociety",/지옥 사회|Pride Ring|Ring|Pentagram City|Imp City|Hellborn|Sinner|지옥 전체|지옥에서|지역/],
    ["violence",/싸움|죽이|살인|무기|폭력|전투|위험|복수|총기|폭발|현상수배|협박/],
    ["leisure",/휴일|휴가|게임|요리|음식|술|소파|노래방|사진|옷|머리|선물|쉬는 날|관광|놀이공원/],
    ["friendship",/친구|동료|같이|서로|선택한 가족|상담|칭찬|단체|협력/],
    ["selfworth",/자격|가치|쓸모|칭찬|평가|약함|약한|자신을 용서|정체성/],
    ["money",/돈|의뢰비|가격|사업|상품|매출|투자|운영비|무료|거래/],
    ["food",/음식|조식|요리|차|술|간식|먹|메뉴/],
    ["culture",/문화|시대|학교|결혼|억양|밈|종교|역사|출신지|관광/]
  ];
  const SENS=new Set(["family","past","soul","extermination","romance","selfworth","trust","redemption"]);

  const tags=t=>{const out=[];for(const row of RX)if(row[1].test(t.title))out.push(row[0]);return out.length?out:["hellsociety"]};
  const eligible=(c,t)=>t.scope==="common"||t.scope===c.scope||(c.cross||[]).includes(t.scope);
  const score=(c,t)=>{
    if(!eligible(c,t))return-9999;
    let n=t.scope==="common"?12:18;
    for(const x of tags(t)){if(c.interests.includes(x))n+=36;if(c.easy.includes(x))n+=8}
    return n+(hash(c.id+"::"+t.id)%17);
  };
  const primary=(c,t)=>tags(t).find(x=>c.interests.includes(x))||tags(t)[0];

  const CUE={
    hotel:["공동생활이 좋은 의도만으로 굴러가지는 않는다는 점","생활 규칙에서 누가 배려받고 누가 떠맡는지가 드러난다는 점","작은 운영 문제에도 관계의 우선순위가 비친다는 점"],
    redemption:["다시 시작하는 것과 과거를 지우는 일이 전혀 다르다는 점","변화는 말보다 반복되는 선택에서 확인된다는 점","기회를 주는 것과 책임까지 대신 져주는 일은 다르다는 점"],
    heaven:["천국이라는 이름만으로 모든 판단이 옳아지는 것은 아니라는 점","질서를 지키는 일과 질문을 막는 일은 구분해야 한다는 점","완벽해 보이는 곳일수록 모순을 인정하기 어렵다는 점"],
    extermination:["명령을 받은 사실과 자신이 한 선택은 따로 봐야 한다는 점","전쟁이 끝나도 기억과 원한은 그대로 남는다는 점","살아남은 사람에게 화해의 속도를 강요할 수 없다는 점"],
    soul:["계약 문장보다 실제 선택권이 있었는지가 중요하다는 점","힘을 얻는 거래일수록 잃는 것을 뒤늦게 알아차리기 쉽다는 점","소유와 동의가 같은 뜻처럼 취급되면 위험하다는 점"],
    media:["보이는 장면과 실제 상황이 다를수록 편집권의 주인이 중요하다는 점","관심을 얻는 것과 신뢰를 얻는 일은 전혀 다른 기술이라는 점","반복해서 본 이미지가 사실보다 먼저 믿음을 얻기도 한다는 점"],
    tech:["새 도구의 편리함만큼 통제권도 봐야 한다는 점","좋은 장비도 사용하는 사람이 엉망이면 결과가 망가진다는 점","기능보다 실패했을 때 무엇이 망가지는지를 먼저 봐야 한다는 점"],
    power:["힘을 가진 이유와 그 힘을 쓸 자격은 같은 질문이 아니라는 점","권력은 명령보다 결과를 감당할 때 더 선명해진다는 점","복종과 존경은 전혀 같은 감정이 아니라는 점"],
    family:["가족에는 사랑뿐 아니라 오래된 기대와 상처도 같이 움직인다는 점","보호하려는 마음이 상대의 선택을 대신할 때 위험해진다는 점","가족이라는 이유가 행동의 면죄부가 될 수 없다는 점"],
    romance:["좋아하는 감정과 상대를 가질 권리는 전혀 다르다는 점","사랑은 서로의 결정을 존중할 때 오래간다는 점","화해와 이별을 어느 한쪽이 혼자 결정할 수 없다는 점"],
    trust:["신뢰는 멋진 한마디보다 작은 행동이 반복될 때 생긴다는 점","경계를 존중하는 사람이 결국 더 가까워진다는 점","비밀을 아는 것과 그 비밀을 맡을 자격은 다르다는 점"],
    past:["과거를 설명한다고 현재의 선택이 자동으로 정당해지지는 않는다는 점","오래된 기억은 사라지지 않아도 다루는 방식은 달라질 수 있다는 점","지나간 일이 다음 행동까지 고정하지는 않는다는 점"],
    human:["인간 세계와 지옥이 달라 보여도 닮은 문제가 많다는 점","인간의 악마 상상에는 자기 두려움이 많이 섞인다는 점","짧은 삶이 인간 사회를 더 급하게 움직이게 한다는 점"],
    work:["효율만 따지다 보면 팀부터 망가질 수 있다는 점","업무에서는 누가 책임지고 누가 위험을 떠안는지가 중요하다는 점","귀찮은 규칙도 사고가 난 뒤에는 존재 이유가 드러난다는 점"],
    imp:["현장에서는 신분보다 누가 제대로 움직이는지가 먼저 드러난다는 점","임프라는 이유로 능력까지 낮게 보는 것은 편견이라는 점","작은 회사일수록 한 사람의 감정이 업무 전체에 번지기 쉽다는 점"],
    goetia:["혈통으로 받은 의무가 개인의 인생 전체를 대신 정할 수 없다는 점","가문의 명예가 자녀에게 너무 쉽게 무게로 넘어간다는 점","신분과 마법이 강할수록 사적인 선택도 정치처럼 취급된다는 점"],
    sin:["거대한 상징이 되어도 사적인 선택은 사라지지 않는다는 점","자신이 대표하는 욕망을 이해하는 일과 끌려다니는 일은 다르다는 점","통치자의 이미지와 개인 감정이 충돌하면 둘 다 숨기기 어렵다는 점"],
    party:["즐기는 일과 스스로를 망가뜨리는 일은 다르다는 점","사람이 많은 자리도 외로움을 없애주지는 못한다는 점","좋은 파티라면 모두가 같은 속도로 놀 필요는 없다는 점"],
    fame:["유명해질수록 실제 사람보다 기대되는 캐릭터가 먼저 보인다는 점","박수가 커질수록 멈췄을 때의 조용함도 커진다는 점","이미지를 지키는 일이 본인을 지우기 시작하면 오래 버티기 어렵다는 점"],
    law:["법의 존재보다 누구에게 똑같이 적용되는지가 더 중요하다는 점","판결은 끝나는 문장이 아니라 이후 결과를 책임지는 시작이라는 점","권력이 큰 사람일수록 규칙 밖에 서기 쉬워진다는 점"],
    hellsociety:["출신과 계급이 다르면 같은 장소도 전혀 다르게 보인다는 점","누가 어디에 살 수 있는지부터 권력 차이가 드러난다는 점","지옥도 결국 수많은 존재가 얽혀 사는 사회라는 점"],
    violence:["싸움에서 이기는 것과 문제를 해결하는 일은 같지 않다는 점","무기를 들 수 있는 것보다 언제 내려놓는지가 더 어렵다는 점","위험한 상황에서는 살아서 돌아오는 판단이 먼저라는 점"],
    leisure:["쉬는 방식에도 성격이 그대로 드러난다는 점","사소한 취미가 큰 문제보다 사람을 더 솔직하게 보여준다는 점","같이 하는 사람이 바뀌면 같은 놀이도 다른 기억이 된다는 점"],
    friendship:["친구는 늘 동의하기보다 선을 넘었을 때 말해주기도 한다는 점","같이 웃는 것보다 엉망인 날 남아 있는지가 더 오래 기억된다는 점","도움을 주는 일과 상대 대신 결정하는 일은 다르다는 점"],
    selfworth:["가치를 성과 하나에 묶으면 실패할 때 사람 전체가 무너진다는 점","약한 모습을 보였다고 능력까지 사라지는 것은 아니라는 점","쓸모를 증명해야만 사랑받는 관계는 사람을 소모시킨다는 점"],
    money:["가격을 매길 수 있다는 것과 실제 가치가 있다는 것은 다르다는 점","수익이 난다고 정당한 사업이 되는 것은 아니라는 점","돈은 선택지를 늘리지만 모든 선택의 이유가 되면 사람을 놓치기 쉽다는 점"],
    food:["음식 취향에는 기억과 사람까지 함께 따라오는 경우가 많다는 점","같이 먹는 자리가 편하면 말도 자연스럽게 나온다는 점","누군가의 취향을 기억하는 일도 작은 친밀감이라는 점"],
    culture:["문화 차이는 틀린 답보다 익숙한 답이 다른 데서 생긴다는 점","출신만으로 성격까지 단정하는 순간 편견이 시작된다는 점","같은 지옥 안에서도 사는 곳이 다르면 상식부터 달라진다는 점"]
  };

  const setup=[
    (a,t)=>a+". 방금 전 상황과 맞물려 ‘"+t+"’ 이야기가 자연스럽게 튀어나온다.",
    (a,t)=>a+". 잠깐의 정적 뒤 화제는 "+t+" 쪽으로 흘러간다.",
    (a,t)=>a+". 주변에서 벌어진 일을 계기로 "+t+"에 대한 생각이 떠오른 듯하다.",
    (a,t)=>a+". 별것 아닌 잡담이 어느새 "+t+"라는 꽤 큰 주제로 번진다.",
    (a,t)=>a+". 네가 전에 들었던 "+t+" 이야기를 꺼내자 시선이 잠깐 멈춘다.",
    (a,t)=>a+". 다른 얘기를 하던 중 "+t+"와 연결되는 지점에서 말끝이 달라진다.",
    (a,t)=>a+". 오늘따라 "+t+" 같은 문제를 그냥 넘기기 어려워 보인다.",
    (a,t)=>a+". 우연히 나온 한마디가 "+t+"에 관한 대화의 시작이 된다.",
    (a,t)=>a+". 평소라면 흘려보냈을 "+t+"라는 화제가 이상하게 오래 남는다.",
    (a,t)=>a+". 네가 "+t+"에 대한 이야기를 꺼내자 손에 하던 일이 잠깐 멎는다.",
    (a,t)=>a+". 분위기가 조금 가라앉은 틈에 "+t+"가 대화 위로 올라온다.",
    (a,t)=>a+". 사소한 계기 하나가 "+t+"에 대한 서로 다른 생각을 건드린다.",
    (a,t)=>a+". 잠시 주변이 조용해지자 "+t+"라는 주제를 피할 이유도 사라진다."
  ];
  const p1=[
    t=>"그럼 "+t+"에 대해서는 어떻게 생각해요?",
    t=>t+", 직접 겪는 입장에선 다르게 보여요?",
    t=>"아까 얘기 나온 김에 물어볼게요. "+t+"는요?",
    t=>t+" 같은 일이라면 당신은 어느 쪽을 먼저 봐요?",
    t=>"당신 기준으로 "+t+"는 어디서부터 문제가 된다고 봐요?",
    t=>t+" 얘기, 그냥 넘기기엔 좀 걸리죠?",
    t=>"다른 사람 말고 당신 생각이 궁금해요. "+t+"는 어때요?",
    t=>t+" 상황이 실제로 닥치면 지금 말한 대로 할 수 있을까요?",
    t=>"이건 좀 의견이 갈릴 것 같은데, "+t+"는 어떻게 봐요?",
    t=>t+"를 한 문장으로 정리하라면 뭐라고 할래요?",
    t=>"당신한테 "+t+"는 단순한 문제는 아닌 것 같네요.",
    t=>"혹시 "+t+"에 대해 예전이랑 생각이 바뀐 적 있어요?",
    t=>t+" 이야기가 나오면 제일 먼저 떠오르는 게 뭐예요?"
  ];
  const p2=["그 기준은 생각보다 명확하네요.","그렇게 보는 이유가 당신답긴 해요.","그럼 반대 상황이면 답도 달라져요?","말보다 실제 상황이 더 복잡하겠네요.","그 부분은 예전보다 생각이 많이 달라진 것 같아요.","그 얘기까지 들으니까 앞의 말이 좀 다르게 들려요.","결국 누구에게 선택권이 있느냐가 중요하다는 거네요.","그럼 결과보다 과정도 봐야 한다는 뜻이군요.","당신이 그 부분을 신경 쓸 줄은 조금 의외예요.","그 정도면 완전히 닫힌 생각은 아니네요.","듣고 보니 단순히 좋다 나쁘다로 끝낼 문제는 아니군요.","그걸 직접 인정하는 건 생각보다 어려웠겠네요.","그래도 지금은 예전과 같은 답은 아니네요."];

  const FORMAL=new Set(["sera","alastor","carmilla-carmine","rosie","abel","stolas","moxxie"]);
  const ARCHAIC=new Set(["paimon","sir-pentious","zestial"]);
  const register=c=>ARCHAIC.has(c.id)?"archaic":FORMAL.has(c.id)?"formal":"casual";

  const lowCasual=[
    (g,x,r)=>g+" 내가 먼저 보는 건 "+x+"이야. "+r+".",
    (g,x,r)=>g+" 내 쪽 기준은 단순해. "+r+". 그리고 "+x+"도 무시 못 해.",
    (g,x,r)=>g+" 먼저 말하자면 "+x+"이 중요해. 그래서 난 "+r+".",
    (g,x,r)=>g+" 굳이 정리하면 "+r+". 거기에 "+x+"까지 포함되고.",
    (g,x,r)=>g+" 적어도 하나는 확실해. "+x+"이야. "+r+".",
    (g,x,r)=>g+" 좋은 말로 포장할 생각은 없어. "+r+". 핵심은 "+x+"이고.",
    (g,x,r)=>g+" 내가 신경 쓰는 건 "+x+"이야. 결국 "+r+".",
    (g,x,r)=>g+" 겉으로 보이는 답보다 "+x+"이 더 걸려. 난 "+r+".",
    (g,x,r)=>g+" 상황마다 다르겠지만 "+x+"부터 봐. 내 기준은 "+r+".",
    (g,x,r)=>g+" 솔직히 말하면 "+r+". 그 이유도 "+x+" 때문이고.",
    (g,x,r)=>g+" 남들이 어떻게 말하든 "+x+"은 남아. 그래서 "+r+".",
    (g,x,r)=>g+" 한쪽 편만 들 생각은 없어. "+x+"부터 따져봐야 해. 나는 "+r+".",
    (g,x,r)=>g+" 결론부터 내리진 마. "+x+"이 빠지면 얘기가 달라져. 난 "+r+"."
  ];
  const highCasual=[
    (w,x,s)=>w+" 지금은 "+x+"부터 보게 돼. 요즘은 "+s+".",
    (w,x,s)=>w+" 예전보다 먼저 보이는 건 "+x+"이야. 그리고 "+s+".",
    (w,x,s)=>w+" 나도 답이 조금 바뀌었어. "+x+"을 전보다 무겁게 봐. "+s+".",
    (w,x,s)=>w+" 숨기기 싫은 부분은 "+x+"이야. "+s+".",
    (w,x,s)=>w+" 네가 있어서 그런지 "+x+"까지 생각하게 돼. "+s+".",
    (w,x,s)=>w+" 예전엔 단순하게 봤는데 지금은 "+x+"을 빼놓지 않아. "+s+".",
    (w,x,s)=>w+" 내 경험을 끼워 말하면 "+x+"이 제일 먼저 남아. "+s+".",
    (w,x,s)=>w+" 솔직한 답은 이거야. "+x+"이 중요해. 그리고 "+s+".",
    (w,x,s)=>w+" 내가 바뀐 부분이 있다면 "+x+"을 무시하지 않게 된 거야. "+s+".",
    (w,x,s)=>w+" 이제는 "+x+"을 전보다 더 믿어. "+s+".",
    (w,x,s)=>w+" 네 앞에서는 인정할 수 있겠네. "+x+"이 걸려. "+s+".",
    (w,x,s)=>w+" 완벽한 답은 아니지만 "+x+"은 확실해. "+s+".",
    (w,x,s)=>w+" 오래 생각해보니 "+x+"이 남더라. 그래서인지 "+s+"."
  ];
  const lowFormal=[
    (g,x,r)=>g+" 제가 먼저 보는 것은 "+x+"입니다. "+r+".",
    (g,x,r)=>g+" 제 기준부터 말하자면 "+r+". 그리고 "+x+"도 중요합니다.",
    (g,x,r)=>g+" 먼저 "+x+"을 빼놓을 수 없습니다. "+r+".",
    (g,x,r)=>g+" 정리하자면 "+r+". 그 판단에는 "+x+"도 포함됩니다.",
    (g,x,r)=>g+" 적어도 "+x+"만큼은 분명히 봐야 합니다. "+r+".",
    (g,x,r)=>g+" 보기 좋은 결론보다 "+x+"이 더 중요합니다. "+r+".",
    (g,x,r)=>g+" 제가 신경 쓰는 지점은 "+x+"입니다. 결국 "+r+".",
    (g,x,r)=>g+" 겉으로 드러난 답보다 "+x+"부터 봐야 합니다. "+r+".",
    (g,x,r)=>g+" 상황에 따라 달라져도 "+x+"은 빠질 수 없습니다. "+r+".",
    (g,x,r)=>g+" 솔직히 말씀드리면 "+r+". 그 이유에는 "+x+"이 있습니다.",
    (g,x,r)=>g+" 다른 평가와 별개로 "+x+"은 남습니다. "+r+".",
    (g,x,r)=>g+" 어느 한쪽만 고르기 전에 "+x+"부터 살펴야 합니다. "+r+".",
    (g,x,r)=>g+" 결론을 서두르기보다 "+x+"을 보겠습니다. "+r+"."
  ];
  const highFormal=[
    (w,x,s)=>w+" 지금은 "+x+"부터 생각하게 됩니다. "+s+".",
    (w,x,s)=>w+" 예전보다 먼저 보이는 것은 "+x+"입니다. 그리고 "+s+".",
    (w,x,s)=>w+" 제 답도 조금 달라졌습니다. "+x+"을 더 무겁게 봅니다. "+s+".",
    (w,x,s)=>w+" 숨기고 싶지 않은 부분은 "+x+"입니다. "+s+".",
    (w,x,s)=>w+" 당신과 이야기하다 보니 "+x+"까지 생각하게 됩니다. "+s+".",
    (w,x,s)=>w+" 예전에는 단순하게 봤지만 이제는 "+x+"을 빼놓지 않습니다. "+s+".",
    (w,x,s)=>w+" 제 경험을 포함하면 "+x+"이 가장 먼저 남습니다. "+s+".",
    (w,x,s)=>w+" 솔직한 답은 "+x+"을 중요하게 본다는 것입니다. "+s+".",
    (w,x,s)=>w+" 달라진 점이 있다면 "+x+"을 무시하지 않게 된 것입니다. "+s+".",
    (w,x,s)=>w+" 이제는 "+x+"을 전보다 더 신뢰합니다. "+s+".",
    (w,x,s)=>w+" 당신 앞에서는 인정할 수 있겠군요. "+x+"이 마음에 남습니다. "+s+".",
    (w,x,s)=>w+" 완벽한 답은 아니지만 "+x+"만큼은 분명합니다. "+s+".",
    (w,x,s)=>w+" 오래 생각해보니 결국 "+x+"이 남았습니다. "+s+"."
  ];
  const lowArchaic=[
    (g,x,r)=>g+" 내가 먼저 보는 것은 "+x+"이오. "+r+".",
    (g,x,r)=>g+" 내 기준을 말하자면 "+r+". 또한 "+x+"도 빼놓을 수 없소.",
    (g,x,r)=>g+" 먼저 "+x+"을 살펴야 하오. "+r+".",
    (g,x,r)=>g+" 굳이 정리하자면 "+r+". 그 안에는 "+x+"도 있소.",
    (g,x,r)=>g+" 적어도 "+x+"만큼은 분명하오. "+r+".",
    (g,x,r)=>g+" 번드르르한 결론보다 "+x+"이 중요하오. "+r+".",
    (g,x,r)=>g+" 내가 유심히 보는 것은 "+x+"이오. 결국 "+r+".",
    (g,x,r)=>g+" 겉으로 드러난 것보다 "+x+"을 먼저 헤아려야 하오. "+r+".",
    (g,x,r)=>g+" 경우가 달라도 "+x+"은 빠질 수 없소. "+r+".",
    (g,x,r)=>g+" 솔직히 말하자면 "+r+". 그 까닭에도 "+x+"이 있소.",
    (g,x,r)=>g+" 남들이 무엇이라 하든 "+x+"은 남는 법이오. "+r+".",
    (g,x,r)=>g+" 한쪽만 택하기 전에 "+x+"부터 보아야 하오. "+r+".",
    (g,x,r)=>g+" 결론을 서두르지 말게. "+x+"이 빠지면 뜻이 달라지오. "+r+"."
  ];
  const highArchaic=[
    (w,x,s)=>w+" 지금은 "+x+"부터 생각하게 되는군. "+s+".",
    (w,x,s)=>w+" 예전보다 먼저 보이는 것은 "+x+"이오. 그리고 "+s+".",
    (w,x,s)=>w+" 내 답도 조금 달라졌소. "+x+"을 더 무겁게 보오. "+s+".",
    (w,x,s)=>w+" 숨기고 싶지 않은 부분은 "+x+"이오. "+s+".",
    (w,x,s)=>w+" 그대와 말하다 보니 "+x+"까지 생각하게 되는구려. "+s+".",
    (w,x,s)=>w+" 전에는 단순히 보았으나 이제는 "+x+"을 빼놓지 않소. "+s+".",
    (w,x,s)=>w+" 내 경험을 곁들이면 "+x+"이 가장 먼저 남는구려. "+s+".",
    (w,x,s)=>w+" 솔직한 답은 "+x+"을 중요히 본다는 것이오. "+s+".",
    (w,x,s)=>w+" 달라진 점이 있다면 "+x+"을 무시하지 않게 된 것이오. "+s+".",
    (w,x,s)=>w+" 이제는 "+x+"을 전보다 더 믿게 되었소. "+s+".",
    (w,x,s)=>w+" 그대 앞에서는 인정할 수 있겠군. "+x+"이 마음에 남소. "+s+".",
    (w,x,s)=>w+" 완전한 답은 아니나 "+x+"만큼은 분명하오. "+s+".",
    (w,x,s)=>w+" 오래 헤아려보니 결국 "+x+"이 남는구려. "+s+"."
  ];

  const closeLow=(c,t,key)=>{
    const r=register(c);
    const n=hash(key)%4;
    if(r==="formal")return ["‘"+t+"’에 관해서는 지금 이 정도까지만 말씀드리겠습니다.","‘"+t+"’에 대한 제 답은 여기까지입니다.","지금은 ‘"+t+"’을 더 단순하게 정리하고 싶지 않습니다.","‘"+t+"’에 관해서는 제가 먼저 더 말할 때까지 두는 편이 좋겠습니다."][n];
    if(r==="archaic")return ["‘"+t+"’ 이야기는 지금 이 정도로 해두지.","‘"+t+"’에 관한 내 답은 여기까지요.","지금은 ‘"+t+"’을 더 단순히 만들고 싶지 않소.","‘"+t+"’ 이야기는 내가 먼저 더 꺼낼 때까지 두는 것이 좋겠군."][n];
    return ["‘"+t+"’ 얘기는 지금 이 정도까지만 하자.","‘"+t+"’에 대한 내 답은 여기까지야.","지금은 ‘"+t+"’을 더 단순하게 만들고 싶지 않아.","‘"+t+"’ 얘기는 내가 먼저 더 꺼낼 때까지 두자."][n];
  };
  const closeHigh=(c,t,key)=>{
    const r=register(c);
    const n=hash(key)%4;
    if(r==="formal")return ["‘"+t+"’ 이야기를 당신과 여기까지 할 수 있게 된 것도 꽤 큰 변화입니다.","이제는 ‘"+t+"’ 같은 주제를 당신 앞에서 굳이 피하지 않아도 되겠군요.","‘"+t+"’에 관한 생각이 더 달라지면 다음에는 제가 먼저 말할 수도 있겠습니다.","오늘 ‘"+t+"’ 이야기를 이 정도까지 한 것을 후회하지는 않을 것 같습니다."][n];
    if(r==="archaic")return ["‘"+t+"’ 이야기를 그대와 여기까지 나누게 된 것도 제법 큰 변화로군.","이제는 ‘"+t+"’ 같은 화두를 그대 앞에서 굳이 피할 까닭은 없겠소.","‘"+t+"’에 관한 생각이 더 달라진다면 다음에는 내가 먼저 꺼낼 수도 있겠구려.","오늘 ‘"+t+"’ 이야기를 이만큼 나눈 것을 후회하진 않을 듯하오."][n];
    return ["‘"+t+"’ 얘기를 너랑 여기까지 할 수 있게 된 것도 꽤 큰 변화야.","이제는 ‘"+t+"’ 같은 주제를 네 앞에서 굳이 피할 필요는 없겠네.","‘"+t+"’에 대한 생각이 더 달라지면 다음엔 내가 먼저 말할 수도 있겠어.","오늘 ‘"+t+"’ 얘기를 이 정도까지 한 건 후회하지 않을 것 같아."][n];
  };

  const chosen=c=>{
    const all=SOURCE.filter(t=>eligible(c,t)).map(t=>({t:t,s:score(c,t)})).sort((x,y)=>y.s-x.s||hash(c.id+x.t.id)-hash(c.id+y.t.id));
    const best=all.filter(x=>tags(x.t).some(z=>c.interests.includes(z)));
    const out=[],seen=new Set();
    for(const x of best.concat(all)){if(seen.has(x.t.id))continue;seen.add(x.t.id);out.push(x.t);if(out.length===52)break}
    return out;
  };

  const make=(c,t,n)=>{
    const tg=primary(c,t),cue=pick(CUE[tg]||CUE.hellsociety,c.id+t.id+"cue");
    const sen=tags(t).some(x=>SENS.has(x)),easy=tags(t).some(x=>c.easy.includes(x)),highOnly=sen&&!easy;
    const id="pooltalk-"+slug(c.id)+"-"+String(n+1).padStart(2,"0")+"-"+slug(t.id);
    const st=setup[(hash(id+"s")+n)%setup.length](pick(c.a,id+"a"),t.title);
    const q=p1[(hash(id+"q")+n)%p1.length](t.title);
    const follow=p2[(hash(id+"f")+n)%p2.length]+" ‘"+t.title+"’ 쪽을 그렇게 본다는 건 기억해둘게요.";
    const reg=register(c);
    const loSet=reg==="formal"?lowFormal:reg==="archaic"?lowArchaic:lowCasual;
    const hiSet=reg==="formal"?highFormal:reg==="archaic"?highArchaic:highCasual;
    const lo=loSet[(hash(id+"l")+n)%loSet.length](pick(c.guard,id+"g"),cue,c.rule);
    const hi=hiSet[(hash(id+"h")+n)%hiSet.length](pick(c.warm,id+"w"),cue,c.soft);
    const lo2=closeLow(c,t.title,id+"lc"),hi2=closeHigh(c,t.title,id+"hc");
    const title="TALK · "+c.name+" · "+t.title;
    if(highOnly){
      const cond=A(c.id,">=",c.t);
      return {id:id,name:title,characterId:c.id,eventRole:"talk",menuVisible:true,randomEligible:true,entries:[
        N(id+"-n",st,{affectionCondition:cond}),P(id+"-p1",q,{affectionCondition:cond}),D(id+"-h1",c.id,c.name,hi,{affectionCondition:cond}),P(id+"-p2",follow,{affectionCondition:cond}),D(id+"-h2",c.id,c.name,hi2,{affectionCondition:cond})
      ]};
    }
    return {id:id,name:title,characterId:c.id,eventRole:"talk",menuVisible:true,randomEligible:true,entries:[
      N(id+"-n",st),P(id+"-p1",q),
      D(id+"-l1",c.id,c.name,lo,{affectionCondition:A(c.id,"<",c.t)}),
      D(id+"-h1",c.id,c.name,hi,{affectionCondition:A(c.id,">=",c.t)}),
      P(id+"-p2",follow),
      D(id+"-l2",c.id,c.name,lo2,{affectionCondition:A(c.id,"<",c.t)}),
      D(id+"-h2",c.id,c.name,hi2,{affectionCondition:A(c.id,">=",c.t)})
    ]};
  };

  window.HV_STORY_PACKS ||= [];
  for(const c of PFS){
    const list=chosen(c);
    window.HV_STORY_PACKS.push({id:"pooltalk-52-"+slug(c.id),version:1,requiredCharacterIds:[c.id],events:list.map((t,n)=>make(c,t,n))});
  }
})();