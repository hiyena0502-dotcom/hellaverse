"use strict";

(()=>{
  const dialogue=(id,speakerCharacterId,speaker,text,extra={})=>({
    id,type:"dialogue",speakerCharacterId,speaker,text,...extra
  });
  const player=(id,text,extra={})=>dialogue(id,"","PLAYER",text,extra);
  const narration=(id,text,extra={})=>({id,type:"narration",text,...extra});
  const option=(id,label,entries=[],extra={})=>({id,label,entries,exitMode:"continue",...extra});
  const choice=(id,prompt,options,extra={})=>({id,type:"choice",prompt,options,...extra});
  const effect=(id,variableId,operation,value)=>({id,variableId,operation,value});
  const affection=(id,characterId,amount)=>({id,characterId,amount});
  const emotion=(id,characterId,state,intensity)=>({id,characterId,state,intensity});

  const C={
    lucifer:"lucifer-morningstar",
    charlie:"charlie-morningstar",
    vaggie:"vaggie",
    alastor:"alastor",
    angel:"angel-dust",
    husk:"husk",
    niffty:"niffty",
    baxter:"baxter"
  };

  window.HV_STORY_PACKS=[{
    id:"hotel-ensemble-comedy",
    version:4,
    requiredCharacterIds:Object.values(C),
    variables:[
      {id:"hotel_welcome_started",name:"호텔 환영회 시작",type:"boolean",defaultValue:"false"},
      {id:"hotel_welcome_teamwork",name:"호텔 환영회 협동",type:"number",defaultValue:"0"},
      {id:"hotel_welcome_control",name:"호텔 환영회 통제",type:"number",defaultValue:"0"},
      {id:"hotel_welcome_result",name:"호텔 환영회 결과",type:"string",defaultValue:""},
      {id:"hotel_welcome_complete",name:"호텔 환영회 완료",type:"boolean",defaultValue:"false"},
      {id:"hotel_fridge_result",name:"심야 냉장고 재판 결과",type:"string",defaultValue:""},
      {id:"hotel_compliment_result",name:"익명 칭찬 상자 결과",type:"string",defaultValue:""},
      {id:"hotel_photo_result",name:"호텔 단체사진 결과",type:"string",defaultValue:""},
      {id:"hotel_laundry_result",name:"공용 세탁실 결과",type:"string",defaultValue:""},
      {id:"hotel_game_result",name:"게임의 밤 결과",type:"string",defaultValue:""},
      {id:"hotel_movie_pick",name:"심야 영화 선택",type:"string",defaultValue:""}
    ],
    events:[
      {
        id:"hotel-welcome-01-emergency-meeting",
        name:"호텔 환영회 01 · 30분 전 긴급회의",
        characterId:C.charlie,
        menuVisible:true,
        continuationEventIds:["hotel-welcome-02-duck-choir"],
        entries:[
          narration("welcome-01-n1","호텔 로비 한가운데에 일정표 세 장, 장식 상자 여섯 개, 정체를 알 수 없는 전선 뭉치가 한꺼번에 쌓여 있다.",{effects:[effect("welcome-start","hotel_welcome_started","set","true")]}),
          dialogue("welcome-01-d1",C.charlie,"CHARLIE","좋아! 모두 침착해! 손님들이 도착하기까지 아직 삼십 분이나 남았어!"),
          dialogue("welcome-01-d2",C.vaggie,"VAGGIE","방금 전에는 서른두 분이라고 했잖아."),
          dialogue("welcome-01-d3",C.charlie,"CHARLIE","맞아. 그러니까 벌써 이 분이나 아주 알차게 쓴 거지!"),
          dialogue("welcome-01-d4",C.husk,"HUSK","아무것도 안 했는데 시간이 줄어든 걸 보통은 알차다고 안 해."),
          dialogue("welcome-01-d5",C.lucifer,"LUCIFER","걱정할 것 없단다! 환영 담당은 이미 완성했으니까!"),
          narration("welcome-01-n2","루시퍼가 금색 천으로 덮인 커다란 상자를 두드린다. 상자 안에서 여러 마리의 꽥꽥거리는 소리가 난다."),
          dialogue("welcome-01-d6",C.angel,"ANGEL DUST","저 상자, 방금 단체로 울었는데? 환영 담당 맞아?"),
          dialogue("welcome-01-d7",C.lucifer,"LUCIFER","자동 인사와 삼부 합창이 가능한 오리 합창단이야. 내가 만들었으니 당연히 수준은 높고."),
          dialogue("welcome-01-d8",C.alastor,"ALASTOR","기계 새에게 첫인상을 맡기다니. 실패 방식도 참 현대적이군요."),
          dialogue("welcome-01-d9",C.baxter,"BAXTER","누가 장식 조명을 실험실 전원에 연결했지? 이대로면 로비가 세 번은 꺼져."),
          dialogue("welcome-01-d10",C.angel,"ANGEL DUST","세 번 켜면 되는 거 아냐?"),
          choice("welcome-01-c1","어디서부터 중재할까?",[
            option("welcome-01-o1","한 명씩 말하고 계획부터 맞춘다",[
              player("welcome-01-o1-d1","한 명씩 말해요. 각자 준비한 걸 맞춰보면 겹치는 일부터 줄일 수 있어요."),
              dialogue("welcome-01-o1-d2",C.charlie,"CHARLIE","맞아! 정상적이고 차분한 회의를 하면 돼!"),
              dialogue("welcome-01-o1-d3",C.husk,"HUSK","지금까지 한 게 회의가 아니었다는 건 마음에 드네.")
            ],{effects:[effect("welcome-01-o1-fx","hotel_welcome_teamwork","add","2")],affectionEffects:[affection("welcome-01-o1-af",C.charlie,1)]}),
            option("welcome-01-o2","가장 먼저 폭발할 것부터 찾는다",[
              player("welcome-01-o2-d1","일단 가장 먼저 폭발할 것부터 찾죠. 나머지는 그다음이에요."),
              dialogue("welcome-01-o2-d2",C.baxter,"BAXTER","합리적이군. 후보가 여섯 개라는 것만 빼면."),
              dialogue("welcome-01-o2-d3",C.vaggie,"VAGGIE","좋아. 전력부터 확인하고 나머지는 내가 붙잡아둘게.")
            ],{effects:[effect("welcome-01-o2-fx","hotel_welcome_control","add","2")],affectionEffects:[affection("welcome-01-o2-af",C.vaggie,1)]}),
            option("welcome-01-o3","루시퍼의 상자부터 봉인한다",[
              player("welcome-01-o3-d1","다른 건 몰라도 그 상자는 지금 열지 마세요."),
              dialogue("welcome-01-o3-d2",C.lucifer,"LUCIFER","뭐? 하지만 이건 오늘의 핵심인데?"),
              player("welcome-01-o3-d3","그러니까 다들 준비될 때 같이 보자는 뜻이에요."),
              dialogue("welcome-01-o3-d4",C.lucifer,"LUCIFER","아. 꽤 합리적인 감상이군. 오리들은 기다릴 수 있어.")
            ],{effects:[effect("welcome-01-o3-fx1","hotel_welcome_teamwork","add","1"),effect("welcome-01-o3-fx2","hotel_welcome_control","add","1")],affectionEffects:[affection("welcome-01-o3-af",C.lucifer,1)]})
          ]),
          dialogue("welcome-01-d11",C.charlie,"CHARLIE","좋아. 역할을 다시 나누자. 그리고 당신은 중재 담당!"),
          player("welcome-01-d12","그런 역할이 원래 있었나요?"),
          dialogue("welcome-01-d13",C.vaggie,"VAGGIE","방금 필요해졌어."),
          dialogue("welcome-01-d14",C.husk,"HUSK","애도를 표하지.")
        ]
      },
      {
        id:"hotel-welcome-02-duck-choir",
        name:"호텔 환영회 02 · 오리 합창단",
        characterId:C.lucifer,
        menuVisible:false,
        continuationEventIds:["hotel-welcome-03-radio-stage"],
        entries:[
          narration("welcome-02-n1","회의가 끝난 지 오 분. 로비에는 약속한 세 마리보다 정확히 스물일곱 마리 많은 고무 오리가 줄지어 있다."),
          dialogue("welcome-02-d1",C.lucifer,"LUCIFER","누구도 움직이지 마."),
          dialogue("welcome-02-d2",C.angel,"ANGEL DUST","난 좋은데? 얘는 안토니오, 얘는 안토니오 주니어—"),
          dialogue("welcome-02-d3",C.lucifer,"LUCIFER","이름 붙이지 마! 정들면 회수하기 어려워져!"),
          dialogue("welcome-02-d4",C.niffty,"NIFFTY","반짝이는 문양을 닦았더니 오리가 나왔어! 한 번 더 닦으면 더 나올까?"),
          dialogue("welcome-02-d5",C.lucifer,"LUCIFER","그건 복제 룬이야! 왜 마법진을 광내고 있어?!"),
          dialogue("welcome-02-d6",C.niffty,"NIFFTY","더러웠으니까!"),
          dialogue("welcome-02-d7",C.husk,"HUSK","난 쉰 마리 넘는다에 두 병 건다."),
          choice("welcome-02-c1","루시퍼의 체면도 지키며 오리를 정리하려면?",[
            option("welcome-02-o1","지휘자가 멋지게 퇴장시킨다",[
              player("welcome-02-o1-d1","노래는 멋져요. 만든 사람이 직접 멋지게 퇴장시켜 주면 더 좋겠어요."),
              dialogue("welcome-02-o1-d2",C.lucifer,"LUCIFER","그렇지? 음정 자동 보정에 사흘을— 아니, 지금은 그게 아니지."),
              narration("welcome-02-o1-n1","루시퍼가 지팡이를 돌리자 오리들이 두 줄로 정렬한다. 마지막 오리만 엉뚱한 방향으로 간다."),
              dialogue("welcome-02-o1-d3",C.husk,"HUSK","저건 남겨둬. 마음에 드네.")
            ],{effects:[effect("welcome-02-o1-fx","hotel_welcome_teamwork","add","2")],affectionEffects:[affection("welcome-02-o1-af",C.lucifer,2)],emotionEffects:[emotion("welcome-02-o1-em",C.lucifer,"joy",25)]}),
            option("welcome-02-o2","니프티에게 제한 시간 청소를 맡긴다",[
              player("welcome-02-o2-d1","니프티, 오리를 전부 상자에 넣으면 로비가 아주 깨끗해질 거예요. 제한 시간 삼 분."),
              dialogue("welcome-02-o2-d2",C.niffty,"NIFFTY","너무 길어!"),
              narration("welcome-02-o2-n1","붉은 잔상만 남기고 니프티가 사라진다. 오리 숫자가 무서운 속도로 줄어든다."),
              dialogue("welcome-02-o2-d3",C.lucifer,"LUCIFER","내 발명품을 쓰레기처럼 쓸어 담고 있잖아.")
            ],{effects:[effect("welcome-02-o2-fx","hotel_welcome_control","add","2")],affectionEffects:[affection("welcome-02-o2-af",C.niffty,1)]}),
            option("welcome-02-o3","허스크의 내기를 이용한다",[
              player("welcome-02-o3-d1","허스크, 쉰 마리 안 넘게 막으면 당신이 이긴 걸로 하죠."),
              dialogue("welcome-02-o3-d2",C.husk,"HUSK","…상자 이리 줘."),
              dialogue("welcome-02-o3-d3",C.angel,"ANGEL DUST","우리 고양이 승부욕 버튼 눌렸네.")
            ],{effects:[effect("welcome-02-o3-fx1","hotel_welcome_teamwork","add","1"),effect("welcome-02-o3-fx2","hotel_welcome_control","add","1")],affectionEffects:[affection("welcome-02-o3-af",C.husk,1)]})
          ]),
          dialogue("welcome-02-d8",C.alastor,"ALASTOR · 방송","친애하는 호텔 여러분. 무대 리허설이 곧 시작됩니다. 귀를 막을 분은 지금이 마지막 기회랍니다."),
          dialogue("welcome-02-d9",C.vaggie,"VAGGIE","중재 담당. 다음 사고야.")
        ]
      },
      {
        id:"hotel-welcome-03-radio-stage",
        name:"호텔 환영회 03 · 생방송과 생쇼 사이",
        characterId:C.alastor,
        menuVisible:false,
        continuationEventIds:["hotel-welcome-04-blackout"],
        entries:[
          narration("welcome-03-n1","무대 위에서는 엔젤의 분홍 조명, 알래스터의 낡은 마이크, 배기의 진행표와 백스터의 전력계가 한 자리를 두고 싸우고 있다."),
          dialogue("welcome-03-d1",C.alastor,"ALASTOR","손님을 맞는 데 필요한 것은 품격 있는 진행과 적절한 긴장감이지요."),
          dialogue("welcome-03-d2",C.angel,"ANGEL DUST","네 웰컴 멘트는 장례식장에서 관이 열릴 때나 어울려."),
          dialogue("welcome-03-d3",C.alastor,"ALASTOR","그렇다면 자네의 조명은 관을 다시 닫고 싶게 만드는군."),
          dialogue("welcome-03-d4",C.vaggie,"VAGGIE","알래스터는 오프닝만. 엔젤은 정확히 삼 분."),
          dialogue("welcome-03-d5",C.baxter,"BAXTER","이 조명 절반은 뽑아. 현재 부하가 안전선의 백육십 퍼센트야."),
          choice("welcome-03-c1","각자의 자리를 어떻게 정할까?",[
            option("welcome-03-o1","역할과 순서를 명확히 나눈다",[
              player("welcome-03-o1-d1","알래스터는 진행, 엔젤은 무대, 배기는 큐, 백스터는 전력. 다른 사람 순서에는 끼어들지 마요."),
              dialogue("welcome-03-o1-d2",C.vaggie,"VAGGIE","마음에 드네."),
              dialogue("welcome-03-o1-d3",C.alastor,"ALASTOR","오늘만은 협조해 드리지요.")
            ],{effects:[effect("welcome-03-o1-fx","hotel_welcome_teamwork","add","3")]}),
            option("welcome-03-o2","장비를 절반으로 줄인다",[
              player("welcome-03-o2-d1","조명과 방송 장비를 절반으로 줄여요. 정전되면 둘 다 없어요."),
              dialogue("welcome-03-o2-d2",C.baxter,"BAXTER","드디어 전기의 기초를 이해하는 생명체가 나타났군."),
              dialogue("welcome-03-o2-d3",C.angel,"ANGEL DUST","분홍 조명을 빼면 내 왼쪽 얼굴이 죽는다고.")
            ],{effects:[effect("welcome-03-o2-fx","hotel_welcome_control","add","3")]}),
            option("welcome-03-o3","30초씩 시범을 보인다",[
              player("welcome-03-o3-d1","서로 삼십 초씩 보여주고 손님 반응으로 순서를 정하죠."),
              dialogue("welcome-03-o3-d2",C.angel,"ANGEL DUST","인기 대결? 진작 그렇게 말하지."),
              dialogue("welcome-03-o3-d3",C.husk,"HUSK","난 둘 다 망한다에 건다.")
            ],{effects:[effect("welcome-03-o3-fx1","hotel_welcome_teamwork","add","1"),effect("welcome-03-o3-fx2","hotel_welcome_control","add","1")]})
          ]),
          dialogue("welcome-03-d6",C.charlie,"CHARLIE","좋아! 이제 다 정리된 거지?"),
          dialogue("welcome-03-d7",C.baxter,"BAXTER","아니. 누군가 오리 상자를 전원 장치 위에 올려놨어."),
          narration("welcome-03-n2","작은 금빛 불꽃이 튀고 호텔의 모든 불이 꺼진다.")
        ]
      },
      {
        id:"hotel-welcome-04-blackout",
        name:"호텔 환영회 04 · 정전 속 전문가들",
        characterId:C.baxter,
        menuVisible:false,
        continuationEventIds:["hotel-welcome-05-grand-opening"],
        entries:[
          narration("welcome-04-n1","완전한 어둠 속에서 오리 한 마리의 눈만 붉게 빛난다."),
          dialogue("welcome-04-d1",C.angel,"ANGEL DUST","이거 분위기 괜찮은데? 내 무대 그냥 이렇게 갈까?"),
          dialogue("welcome-04-d2",C.vaggie,"VAGGIE","안 돼."),
          dialogue("welcome-04-d3",C.alastor,"ALASTOR","오히려 제 방송에는 더없이 좋은 환경이군요."),
          dialogue("welcome-04-d4",C.vaggie,"VAGGIE","더 안 돼."),
          dialogue("welcome-04-d5",C.baxter,"BAXTER","재설정에는 안정적인 마력원과 일정한 신호가 필요해."),
          dialogue("welcome-04-d6",C.lucifer,"LUCIFER","마력원이라면 내가 있지."),
          dialogue("welcome-04-d7",C.alastor,"ALASTOR","신호라면 제가 있고요."),
          dialogue("welcome-04-d8",C.lucifer,"LUCIFER","싫어."),
          player("welcome-04-d9","서로 돕는 게 아니라 백스터를 각각 돕는다고 생각하면 되잖아요."),
          dialogue("welcome-04-d10",C.baxter,"BAXTER","정확해. 내가 중간에서 조절한다."),
          choice("welcome-04-c1","마지막 복구 방식을 정한다",[
            option("welcome-04-o1","백스터의 지시에 맞춰 모두 협동한다",[
              player("welcome-04-o1-d1","루시퍼는 마력, 알래스터는 신호. 백스터가 둘을 맞추고 나머지는 수동 정리예요."),
              dialogue("welcome-04-o1-d2",C.niffty,"NIFFTY","전선이 먼저 날 건드리면?!"),
              dialogue("welcome-04-o1-d3",C.vaggie,"VAGGIE","피해.")
            ],{effects:[effect("welcome-04-o1-fx1","hotel_welcome_result","set","teamwork"),effect("welcome-04-o1-fx2","hotel_welcome_teamwork","add","2")]}),
            option("welcome-04-o2","공연을 포기하고 기본 전력만 살린다",[
              player("welcome-04-o2-d1","기본 조명과 출입문부터 살려요. 공연은 전력이 안정된 뒤에 생각하죠."),
              dialogue("welcome-04-o2-d2",C.baxter,"BAXTER","가장 안전하고 가장 지루한 해결책이군. 찬성이다."),
              dialogue("welcome-04-o2-d3",C.husk,"HUSK","처음부터 공연이 상대가 안 됐지.")
            ],{effects:[effect("welcome-04-o2-fx1","hotel_welcome_result","set","control"),effect("welcome-04-o2-fx2","hotel_welcome_control","add","2")]}),
            option("welcome-04-o3","정전 자체를 공연으로 포장한다",[
              player("welcome-04-o3-d1","손님이 오면 정전도 연출이라고 해요. 알래스터가 안내하고 엔젤은 손전등 공연. 그동안 복구해요."),
              dialogue("welcome-04-o3-d2",C.angel,"ANGEL DUST","봐, 이래서 중재 담당이 필요한 거야."),
              dialogue("welcome-04-o3-d3",C.vaggie,"VAGGIE","왜 최악의 두 사람을 동시에 신나게 만든 거지?")
            ],{effects:[effect("welcome-04-o3-fx","hotel_welcome_result","set","chaos")],affectionEffects:[affection("welcome-04-o3-af1",C.angel,1),affection("welcome-04-o3-af2",C.alastor,1)]})
          ]),
          narration("welcome-04-n2","금빛 마력과 붉은 신호가 전선을 따라 박동한다. 백스터가 이를 악물고 두 흐름을 맞춘다."),
          dialogue("welcome-04-d11",C.baxter,"BAXTER","지금! 둘 다 출력 낮춰!"),
          dialogue("welcome-04-d12",C.lucifer,"LUCIFER","저쪽부터 낮추라고 해."),
          dialogue("welcome-04-d13",C.alastor,"ALASTOR","저도 같은 의견입니다."),
          player("welcome-04-d14","둘 다요!"),
          narration("welcome-04-n3","호텔의 불이 한꺼번에 켜진다. 동시에 현관문이 열리고 첫 손님들이 들어온다.")
        ]
      },
      {
        id:"hotel-welcome-05-grand-opening",
        name:"호텔 환영회 05 · 완벽하지 않은 성공",
        characterId:C.charlie,
        menuVisible:false,
        entries:[
          narration("welcome-05-n1","누구도 준비가 끝났다고 말할 틈 없이 환영회가 시작된다."),
          narration("welcome-05-team-n1","알래스터의 소개가 끝나자 엔젤의 조명이 정확히 켜지고 배기가 큐를 넘긴다. 백스터의 전력계도 간신히 안전선 아래다.",{condition:{variableId:"hotel_welcome_result",operator:"==",value:"teamwork"}}),
          dialogue("welcome-05-team-d1",C.charlie,"CHARLIE","되고 있어. 진짜로 되고 있어!",{condition:{variableId:"hotel_welcome_result",operator:"==",value:"teamwork"}}),
          dialogue("welcome-05-team-d2",C.lucifer,"LUCIFER","물론이지. 내가 참여한 계획이잖니.",{condition:{variableId:"hotel_welcome_result",operator:"==",value:"teamwork"}}),
          narration("welcome-05-control-n1","화려한 공연은 사라졌지만 로비의 조명과 음악은 놀라울 만큼 안정적이다.",{condition:{variableId:"hotel_welcome_result",operator:"==",value:"control"}}),
          dialogue("welcome-05-control-d1",C.husk,"HUSK","기분 나쁠 정도로 멀쩡하네.",{condition:{variableId:"hotel_welcome_result",operator:"==",value:"control"}}),
          dialogue("welcome-05-control-d2",C.angel,"ANGEL DUST","걱정 마. 내가 있잖아.",{condition:{variableId:"hotel_welcome_result",operator:"==",value:"control"}}),
          narration("welcome-05-chaos-n1","붉은 손전등이 어둠을 가르고 알래스터의 목소리가 로비에 울린다. 손님들은 이것이 계획된 공연이라고 믿는다.",{condition:{variableId:"hotel_welcome_result",operator:"==",value:"chaos"}}),
          dialogue("welcome-05-chaos-d1",C.angel,"ANGEL DUST","다들 봤지? 준비가 덜 될수록 더 비싸 보이는 거라고.",{condition:{variableId:"hotel_welcome_result",operator:"==",value:"chaos"}}),
          dialogue("welcome-05-chaos-d2",C.baxter,"BAXTER","삼 분 안에 복구 못 하면 그 연출이 진짜 화재로 바뀐다.",{condition:{variableId:"hotel_welcome_result",operator:"==",value:"chaos"}}),
          narration("welcome-05-n2","마지막 손님이 자리를 잡는다. 로비 구석의 오리 한 마리가 환영 멜로디 마지막 음을 낸다."),
          dialogue("welcome-05-d1",C.charlie,"CHARLIE","완벽하진 않았지만… 다들 같이 해냈어."),
          dialogue("welcome-05-d2",C.vaggie,"VAGGIE","아무도 다치지 않았고 호텔도 서 있어. 오늘 기준으론 대성공이야."),
          dialogue("welcome-05-d3",C.husk,"HUSK","바 기준으로는 컵 세 개 깨졌어."),
          dialogue("welcome-05-d4",C.niffty,"NIFFTY","두 개야! 하나는 원래 금 가 있었어!"),
          dialogue("welcome-05-d5",C.lucifer,"LUCIFER","결론적으로 내 오리가 행사의 시작과 끝을 모두 책임졌군."),
          dialogue("welcome-05-d6",C.baxter,"BAXTER","그 결론이면 다음엔 전력 장치를 잠가버리겠어."),
          dialogue("welcome-05-d7",C.charlie,"CHARLIE","그리고 당신, 정말 고마웠어. 당신이 없었으면 우린 서로 말도 안 듣고—"),
          dialogue("welcome-05-d8",C.vaggie,"VAGGIE","호텔 절반을 날렸겠지."),
          player("welcome-05-d9","절반이면 생각보다 적네요."),
          dialogue("welcome-05-d10",C.husk,"HUSK","이제 여기 사람이 다 됐군."),
          dialogue("welcome-05-d11",C.lucifer,"LUCIFER","앙코르를 원하는군!"),
          dialogue("welcome-05-d12",C.charlie,"EVERYONE EXCEPT LUCIFER","안 돼.",{effects:[effect("welcome-complete","hotel_welcome_complete","set","true")]})
        ]
      },

      {
        id:"hotel-fridge-01-missing-cake",
        name:"심야 냉장고 재판 01 · 사라진 케이크",
        characterId:C.husk,
        menuVisible:true,
        continuationEventIds:["hotel-fridge-02-interrogation"],
        entries:[
          narration("fridge-01-n1","새벽 두 시. 허스크가 바 위에 빈 케이크 상자를 증거물처럼 올려놓는다."),
          dialogue("fridge-01-d1",C.husk,"HUSK","찰리가 내일 아침에 내놓겠다던 케이크가 사라졌다."),
          dialogue("fridge-01-d2",C.angel,"ANGEL DUST","날 왜 보는 건데? 난 케이크보다 관리가 까다로워."),
          dialogue("fridge-01-d3",C.niffty,"NIFFTY","상자는 깨끗해! 너무 깨끗해서 수상해!"),
          dialogue("fridge-01-d4",C.charlie,"CHARLIE","괜찮아, 화내기 전에 차근차근 확인하면—"),
          dialogue("fridge-01-d5",C.vaggie,"VAGGIE","이미 모두가 서로를 범인처럼 보고 있어."),
          player("fridge-01-d6","그럼 재판 말고 사실 확인부터 하죠. 마지막으로 본 사람은요?"),
          dialogue("fridge-01-d7",C.lucifer,"LUCIFER","내 디저트에 보안 장치를 좀 달았을 뿐이란다. 남의 디저트였으면 안 했겠지."),
          dialogue("fridge-01-d8",C.husk,"HUSK","…왜 그걸 이제 말하지?"),
          dialogue("fridge-01-d9",C.lucifer,"LUCIFER","아무도 보안 장치가 용의자일 거라곤 안 물었으니까.")
        ]
      },
      {
        id:"hotel-fridge-02-interrogation",
        name:"심야 냉장고 재판 02 · 용의자 전원",
        characterId:C.niffty,
        menuVisible:false,
        continuationEventIds:["hotel-fridge-03-verdict"],
        entries:[
          narration("fridge-02-n1","니프티가 냅킨에 그린 수사판을 펼친다. 선은 전부 엔젤에게 이어져 있다."),
          dialogue("fridge-02-d1",C.angel,"ANGEL DUST","이건 수사가 아니라 팬아트잖아."),
          dialogue("fridge-02-d2",C.niffty,"NIFFTY","부스러기가 네 방 쪽으로 갔어!"),
          dialogue("fridge-02-d3",C.angel,"ANGEL DUST","발 달린 부스러기였나 보지."),
          dialogue("fridge-02-d4",C.baxter,"BAXTER","실제로 움직였을 가능성이 높아. 상자에서 미약한 마력 반응이 난다."),
          choice("fridge-02-c1","증언이 또 싸움으로 번지기 전에 무엇을 확인할까?",[
            option("fridge-02-o1","부스러기의 이동 경로를 따라간다",[
              player("fridge-02-o1-d1","누가 먹었는지보다 부스러기가 어디로 갔는지부터 봐요."),
              dialogue("fridge-02-o1-d2",C.niffty,"NIFFTY","추적 청소! 내가 제일 좋아하는 장르야!"),
              dialogue("fridge-02-o1-d3",C.husk,"HUSK","그런 장르가 있다는 게 더 무섭군.")
            ],{effects:[effect("fridge-02-o1-fx","hotel_fridge_result","set","trail")]}),
            option("fridge-02-o2","루시퍼의 보안 장치를 재현한다",[
              player("fridge-02-o2-d1","보안 장치가 뭘 하는지 같은 상자로 재현해 보죠."),
              dialogue("fridge-02-o2-d2",C.lucifer,"LUCIFER","좋아! 과학적이고, 무엇보다 내 방식답네."),
              dialogue("fridge-02-o2-d3",C.baxter,"BAXTER","그 두 단어가 같이 쓰인 게 불안하군.")
            ],{effects:[effect("fridge-02-o2-fx","hotel_fridge_result","set","device")]}),
            option("fridge-02-o3","모두의 알리바이를 한 문장으로 제한한다",[
              player("fridge-02-o3-d1","각자 한 문장만. 길어지면 허스크가 종을 칩니다."),
              dialogue("fridge-02-o3-d2",C.husk,"HUSK","처음으로 마음에 드는 재판 규칙이군."),
              dialogue("fridge-02-o3-d3",C.angel,"ANGEL DUST","내 인생을 한 문장에 담기엔 너무 자극적인데.")
            ],{effects:[effect("fridge-02-o3-fx","hotel_fridge_result","set","testimony")]})
          ])
        ]
      },
      {
        id:"hotel-fridge-03-verdict",
        name:"심야 냉장고 재판 03 · 달콤한 판결",
        characterId:C.lucifer,
        menuVisible:false,
        entries:[
          narration("fridge-03-trail-n1","부스러기 흔적은 냉장고 뒤를 돌아 다시 빈 상자 안으로 이어진다.",{condition:{variableId:"hotel_fridge_result",operator:"==",value:"trail"}}),
          narration("fridge-03-device-n1","재현용 상자가 작은 다리를 내밀더니 냉장고 아래로 달려간다.",{condition:{variableId:"hotel_fridge_result",operator:"==",value:"device"}}),
          narration("fridge-03-testimony-n1","모두의 알리바이가 끝나는 순간, 빈 상자 안에서 조그만 재채기 소리가 난다.",{condition:{variableId:"hotel_fridge_result",operator:"==",value:"testimony"}}),
          dialogue("fridge-03-d1",C.baxter,"BAXTER","상자가 케이크를 먹은 게 아니야. 케이크와 자리를 바꾼 거다."),
          dialogue("fridge-03-d2",C.lucifer,"LUCIFER","도둑이 상자를 열면 디저트가 안전한 곳으로 순간이동하는 완벽한 장치지!"),
          dialogue("fridge-03-d3",C.vaggie,"VAGGIE","안전한 곳이 어디인데?"),
          dialogue("fridge-03-d4",C.lucifer,"LUCIFER","그게… 무작위라는 작은 설계상의 자유가 있어."),
          narration("fridge-03-n1","천장에서 퐁 소리가 나더니 멀쩡한 케이크가 알래스터의 마이크 스탠드 위에 나타난다."),
          dialogue("fridge-03-d5",C.alastor,"ALASTOR","유죄 판결을 내리기 전에 증거품부터 치워주시겠습니까?"),
          dialogue("fridge-03-d6",C.angel,"ANGEL DUST","범인은 꼬맹이 왕이네. 난 사과를 케이크로 받을게."),
          dialogue("fridge-03-d7",C.husk,"HUSK","판결. 장치 압수, 케이크 반씩, 앞으로 냉장고엔 마법 금지."),
          player("fridge-03-d8","그리고 니프티의 수사판은 폐기."),
          dialogue("fridge-03-d9",C.niffty,"NIFFTY","벌써 액자에 넣었는데!")
        ]
      },

      {
        id:"hotel-compliment-01-box",
        name:"익명 칭찬 상자 01 · 좋은 의도의 시작",
        characterId:C.charlie,
        menuVisible:true,
        continuationEventIds:["hotel-compliment-02-mixup"],
        entries:[
          narration("compliment-01-n1","찰리가 로비 한복판에 하트가 그려진 ‘익명 칭찬 상자’를 놓는다."),
          dialogue("compliment-01-d1",C.charlie,"CHARLIE","서로의 좋은 점을 익명으로 적는 거야! 부담 없이 따뜻해질 수 있어."),
          dialogue("compliment-01-d2",C.vaggie,"VAGGIE","익명이라는 부분이 조금 불안하지만 취지는 좋아."),
          dialogue("compliment-01-d3",C.angel,"ANGEL DUST","내 칭찬은 상자 하나로 모자랄 텐데."),
          dialogue("compliment-01-d4",C.husk,"HUSK","걱정 마. 아무도 안 쓰면 넉넉해."),
          dialogue("compliment-01-d5",C.alastor,"ALASTOR","익명 편지라. 오해를 정성껏 포장하는 훌륭한 방식이지요."),
          dialogue("compliment-01-d6",C.lucifer,"LUCIFER","난 서명해도 괜찮단다. 필체만 봐도 품격이 드러나니까."),
          player("compliment-01-d7","한 사람당 한 장, 놀리기 금지, 쓴 사람 추궁 금지. 이 세 가지만 지켜요."),
          dialogue("compliment-01-d8",C.niffty,"NIFFTY","종이는 같은 크기로 잘라야 익명이야! 가위 가져올게!"),
          dialogue("compliment-01-d9",C.vaggie,"VAGGIE","뛰지 말고. 가위 들고 뛰지 마!")
        ]
      },
      {
        id:"hotel-compliment-02-mixup",
        name:"익명 칭찬 상자 02 · 수신인 실종",
        characterId:C.angel,
        menuVisible:false,
        continuationEventIds:["hotel-compliment-03-reveal"],
        entries:[
          narration("compliment-02-n1","니프티가 종이를 같은 크기로 자르는 데 성공했다. 문제는 수신인 이름까지 잘라냈다는 것이다."),
          dialogue("compliment-02-d1",C.niffty,"NIFFTY","완벽하게 익명이야! 받는 사람도 모를 만큼!"),
          dialogue("compliment-02-d2",C.vaggie,"VAGGIE","그건 전달 불가능이라고 하는 거야."),
          dialogue("compliment-02-d3",C.angel,"ANGEL DUST","첫 장. ‘시끄럽지만 방이 조용하면 허전하다.’ 이거 나지?"),
          dialogue("compliment-02-d4",C.husk,"HUSK","라디오일 수도 있지."),
          dialogue("compliment-02-d5",C.alastor,"ALASTOR","전 그보다 문법이 정확합니다."),
          dialogue("compliment-02-d6",C.lucifer,"LUCIFER","‘작지만 존재감은 가장 크다.’ 드디어 내 얘기가 나왔군."),
          dialogue("compliment-02-d7",C.niffty,"NIFFTY","내 얘기일 수도 있어!"),
          choice("compliment-02-c1","칭찬 쟁탈전을 어떻게 중재할까?",[
            option("compliment-02-o1","모두가 가장 어울리는 사람을 골라 준다",[
              player("compliment-02-o1-d1","자기 걸 주장하지 말고 다른 사람에게 가장 어울리는 칭찬을 골라줘요."),
              dialogue("compliment-02-o1-d2",C.charlie,"CHARLIE","좋아! 칭찬을 한 번 더 하는 셈이네."),
              dialogue("compliment-02-o1-d3",C.husk,"HUSK","결국 회의잖아.")
            ],{effects:[effect("compliment-02-o1-fx","hotel_compliment_result","set","share")]}),
            option("compliment-02-o2","쓴 사람만 손을 들되 이유는 묻지 않는다",[
              player("compliment-02-o2-d1","읽고 나서 쓴 사람만 손을 들어요. 왜 썼는지는 묻지 않기."),
              dialogue("compliment-02-o2-d2",C.vaggie,"VAGGIE","최소한 오배송은 막겠네."),
              dialogue("compliment-02-o2-d3",C.alastor,"ALASTOR","침묵 속의 자백이라. 분위기도 좋군요.")
            ],{effects:[effect("compliment-02-o2-fx","hotel_compliment_result","set","hands")]}),
            option("compliment-02-o3","모두가 한 장씩 무작위로 가진다",[
              player("compliment-02-o3-d1","오늘은 무작위로 한 장씩 가져요. 정확한 주인보다 필요한 사람에게 가는 걸로."),
              dialogue("compliment-02-o3-d2",C.angel,"ANGEL DUST","감동 복권이네. 재밌는데?"),
              dialogue("compliment-02-o3-d3",C.lucifer,"LUCIFER","내 품격이 무작위 배정이라니.")
            ],{effects:[effect("compliment-02-o3-fx","hotel_compliment_result","set","random")]})
          ])
        ]
      },
      {
        id:"hotel-compliment-03-reveal",
        name:"익명 칭찬 상자 03 · 익명보다 솔직하게",
        characterId:C.vaggie,
        menuVisible:false,
        entries:[
          narration("compliment-03-share-n1","모두가 남에게 어울리는 문장을 찾느라 평소보다 훨씬 오래 서로를 바라본다.",{condition:{variableId:"hotel_compliment_result",operator:"==",value:"share"}}),
          narration("compliment-03-hands-n1","문장이 읽힐 때마다 손이 하나씩 올라간다. 알래스터만 끝까지 두 손을 지팡이에 얹고 있다.",{condition:{variableId:"hotel_compliment_result",operator:"==",value:"hands"}}),
          narration("compliment-03-random-n1","접힌 종이가 하나씩 돌아간다. 신기하게도 아무도 자기 몫을 바꾸려 하지 않는다.",{condition:{variableId:"hotel_compliment_result",operator:"==",value:"random"}}),
          dialogue("compliment-03-d1",C.charlie,"CHARLIE","이상하게 시작했지만… 다들 한 장씩은 받았네."),
          dialogue("compliment-03-d2",C.husk,"HUSK","난 ‘말없이 잔을 채워주는 걸 안다’를 받았어. 누가 썼는지 뻔하지만."),
          dialogue("compliment-03-d3",C.angel,"ANGEL DUST","추궁 금지라며. 그냥 고맙다고 해, 수염아."),
          dialogue("compliment-03-d4",C.husk,"HUSK","…고맙다."),
          dialogue("compliment-03-d5",C.lucifer,"LUCIFER","내 쪽지는 ‘딸을 웃게 하려고 노력한다’군."),
          dialogue("compliment-03-d6",C.vaggie,"VAGGIE","그건 꽤 정확하네."),
          dialogue("compliment-03-d7",C.alastor,"ALASTOR","전 ‘소리가 꺼지면 가끔은 걱정된다’를 받았습니다. 누가 이런 무례한 다정을—"),
          dialogue("compliment-03-d8",C.charlie,"CHARLIE","쓴 사람 추궁 금지!"),
          player("compliment-03-d9","익명은 조금 실패했지만 칭찬은 제대로 도착했네요."),
          dialogue("compliment-03-d10",C.niffty,"NIFFTY","다음엔 종이 말고 옷에 직접 써줄게!"),
          dialogue("compliment-03-d11",C.vaggie,"VAGGIE","다음 행사는 내가 준비할게.")
        ]
      },
      {
        id:"hotel-photo-01-lineup",
        name:"호텔 단체사진 01 · 한 프레임에 전원",
        characterId:C.charlie,
        menuVisible:true,
        continuationEventIds:["hotel-photo-02-timer"],
        entries:[
          narration("photo-01-n1","찰리가 로비 벽에 ‘오늘은 꼭 단체사진 성공!’이라고 적힌 종이를 붙인다. 그 아래에는 이미 실패한 폴라로이드가 네 장 놓여 있다."),
          dialogue("photo-01-d1",C.charlie,"CHARLIE","이번엔 진짜야! 모두 한 장에, 눈 뜨고, 싸우지 않고 찍는 거야!"),
          dialogue("photo-01-d2",C.husk,"HUSK","조건이 너무 많군."),
          dialogue("photo-01-d3",C.angel,"ANGEL DUST","난 왼쪽. 조명도 왼쪽. 내 좋은 쪽이 거기거든."),
          dialogue("photo-01-d4",C.vaggie,"VAGGIE","넌 아까 오른쪽이 좋다며."),
          dialogue("photo-01-d5",C.angel,"ANGEL DUST","아까랑 지금은 얼굴이 달라."),
          dialogue("photo-01-d6",C.lucifer,"LUCIFER","키 순서라면 난 당연히 앞줄 중앙이군."),
          dialogue("photo-01-d7",C.niffty,"NIFFTY","난 어디든 좋아! 천장도 돼!"),
          dialogue("photo-01-d8",C.baxter,"BAXTER","천장에는 타이머 센서가 있다. 제발 사람은 바닥에 있어."),
          choice("photo-01-c1","전원을 한 프레임 안에 넣으려면 어떻게 배치할까?",[
            option("photo-01-o1","키와 역할대로 빠르게 줄을 세운다",[
              player("photo-01-o1-d1","앞줄, 뒷줄만 정해요. 자리 취향은 사진 한 장 찍고 바꾸죠."),
              dialogue("photo-01-o1-d2",C.vaggie,"VAGGIE","좋아. 십 초 안에 움직여."),
              dialogue("photo-01-o1-d3",C.husk,"HUSK","사진이 아니라 대피 훈련 같은데.")
            ],{effects:[effect("photo-01-o1-fx","hotel_photo_result","set","order")],affectionEffects:[affection("photo-01-o1-af",C.vaggie,1)]}),
            option("photo-01-o2","각자 편한 자리에 서게 둔다",[
              player("photo-01-o2-d1","그냥 제일 편한 자리에 서요. 서로 안 가리기만 하면 돼요."),
              dialogue("photo-01-o2-d2",C.charlie,"CHARLIE","자연스러운 분위기! 그것도 좋아!"),
              dialogue("photo-01-o2-d3",C.alastor,"ALASTOR","자연스러움이란 대개 통제 포기의 우아한 표현이지요.")
            ],{effects:[effect("photo-01-o2-fx","hotel_photo_result","set","natural")]}),
            option("photo-01-o3","촬영 직전까지 자리를 비워 둔다",[
              player("photo-01-o3-d1","타이머 누르고 마지막 순간에 빈 곳으로 뛰어들어요. 고민할 시간이 없으면 싸울 시간도 없어요."),
              dialogue("photo-01-o3-d2",C.angel,"ANGEL DUST","위험한데 재밌네."),
              dialogue("photo-01-o3-d3",C.baxter,"BAXTER","내 카메라 근처에서 뛰지만 마.")
            ],{effects:[effect("photo-01-o3-fx","hotel_photo_result","set","rush")],affectionEffects:[affection("photo-01-o3-af",C.angel,1)]})
          ]),
          dialogue("photo-01-d9",C.charlie,"CHARLIE","좋아, 이제 남은 건 셔터 한 번뿐이야."),
          dialogue("photo-01-d10",C.baxter,"BAXTER","그 말을 하기엔 루시퍼가 카메라에 뭔가 붙이고 있는데.")
        ]
      },
      {
        id:"hotel-photo-02-timer",
        name:"호텔 단체사진 02 · 셔터 전쟁",
        characterId:C.baxter,
        menuVisible:false,
        continuationEventIds:["hotel-photo-03-result"],
        entries:[
          narration("photo-02-n1","카메라 렌즈 둘레에 금빛 왕관 모양 장식이 생겼다. 백스터가 아무 말 없이 루시퍼를 본다."),
          dialogue("photo-02-d1",C.lucifer,"LUCIFER","작은 보정이야. 내가 사진에 나오는데 이 정도 광택은 있어야지."),
          dialogue("photo-02-d2",C.baxter,"BAXTER","그 광택이 자동초점을 태우고 있어."),
          dialogue("photo-02-d3",C.alastor,"ALASTOR","사진 한 장을 위해 이렇게까지 기계를 달래야 하다니. 라디오의 시대가 그립군요."),
          dialogue("photo-02-d4",C.angel,"ANGEL DUST","라디오는 얼굴이 안 나오니까 네가 좋아하는 거겠지."),
          dialogue("photo-02-d5",C.alastor,"ALASTOR","제 얼굴은 상상에 맡길수록 가치가 높답니다."),
          dialogue("photo-02-d6",C.niffty,"NIFFTY","렌즈 닦아줄까? 아주 세게?"),
          dialogue("photo-02-d7",C.baxter,"BAXTER","아무도. 카메라를. 만지지 마."),
          narration("photo-02-n2","타이머가 갑자기 10에서 시작한다."),
          dialogue("photo-02-d8",C.charlie,"CHARLIE","다들 자리! 지금!"),
          player("photo-02-d9","싸움은 사진 찍고 이어가요! 카메라 봐요!"),
          dialogue("photo-02-d10",C.husk,"HUSK","내가 왜 이 말에 익숙해지고 있지."),
          narration("photo-02-n3","3. 2. 1. 셔터가 눌리는 순간, 금빛 장식 하나가 렌즈 앞으로 천천히 떨어진다.")
        ]
      },
      {
        id:"hotel-photo-03-result",
        name:"호텔 단체사진 03 · 완벽하게 망한 한 장",
        characterId:C.charlie,
        menuVisible:false,
        entries:[
          narration("photo-03-order-n1","정렬은 완벽했다. 문제는 전원이 동시에 떨어지는 장식을 보느라 카메라가 아니라 위를 보고 있다는 점이다.",{condition:{variableId:"hotel_photo_result",operator:"==",value:"order"}}),
          narration("photo-03-natural-n1","자세는 제각각이지만 이상할 정도로 모두 평소다운 표정이다. 루시퍼만 렌즈 앞 장식을 잡으려다 팔이 흐릿하다.",{condition:{variableId:"hotel_photo_result",operator:"==",value:"natural"}}),
          narration("photo-03-rush-n1","절반은 뛰는 중이고 절반은 웃는 중이다. 니프티는 정말로 잠깐 천장에 있다.",{condition:{variableId:"hotel_photo_result",operator:"==",value:"rush"}}),
          dialogue("photo-03-d1",C.charlie,"CHARLIE","…완벽하진 않네."),
          dialogue("photo-03-d2",C.vaggie,"VAGGIE","다시 찍을까?"),
          dialogue("photo-03-d3",C.husk,"HUSK","안 돼."),
          dialogue("photo-03-d4",C.angel,"ANGEL DUST","난 잘 나왔는데? 채택."),
          dialogue("photo-03-d5",C.lucifer,"LUCIFER","내 장식도 아주 역동적으로 나왔군."),
          dialogue("photo-03-d6",C.baxter,"BAXTER","네 장식 때문에 망한 거야."),
          dialogue("photo-03-d7",C.alastor,"ALASTOR","그래도 드물게 모두가 같은 순간을 보고 있군요."),
          player("photo-03-d8","그럼 성공한 단체사진 아닌가요?"),
          dialogue("photo-03-d9",C.charlie,"CHARLIE","맞아. 액자에 넣자!"),
          dialogue("photo-03-d10",C.niffty,"NIFFTY","액자 닦아도 돼?!"),
          dialogue("photo-03-d11",C.baxter,"BAXTER","장식 없는 액자로.")
        ]
      },

      {
        id:"hotel-laundry-01-mixup",
        name:"공용 세탁실 01 · 이름표 없는 빨래",
        characterId:C.niffty,
        menuVisible:true,
        continuationEventIds:["hotel-laundry-02-sorting"],
        entries:[
          narration("laundry-01-n1","세탁실 문을 열자 빨래 바구니 여섯 개와 옷 더미 하나가 정확히 같은 크기로 정렬되어 있다."),
          dialogue("laundry-01-d1",C.niffty,"NIFFTY","좋은 소식! 전부 빨았어! 더 좋은 소식! 누구 건지는 몰라!"),
          dialogue("laundry-01-d2",C.vaggie,"VAGGIE","이름표 붙이라고 했잖아."),
          dialogue("laundry-01-d3",C.niffty,"NIFFTY","이름표도 빨았어!"),
          dialogue("laundry-01-d4",C.angel,"ANGEL DUST","내 실크 셔츠를 뜨거운 물에 넣은 건 아니지?"),
          dialogue("laundry-01-d5",C.husk,"HUSK","저 조그만 분홍 천이 네 거면 유감이군."),
          dialogue("laundry-01-d6",C.angel,"ANGEL DUST","그건 원래 그 크기야."),
          dialogue("laundry-01-d7",C.lucifer,"LUCIFER","내 흰 코트는 특별 세탁이 필요해. 아무 옷이랑 같이 돌릴 물건은 아니거든."),
          dialogue("laundry-01-d8",C.baxter,"BAXTER","그 코트에서 약한 마력 방전이 측정된다. 세탁기 탓하지 마."),
          player("laundry-01-d9","옷 주인부터 찾죠. 특징 하나씩 말해요. 서로 놀리는 건 나중에."),
          dialogue("laundry-01-d10",C.husk,"HUSK","그 ‘나중에’가 제일 믿음직스럽군.")
        ]
      },
      {
        id:"hotel-laundry-02-sorting",
        name:"공용 세탁실 02 · 소유권 분쟁",
        characterId:C.vaggie,
        menuVisible:false,
        continuationEventIds:["hotel-laundry-03-finish"],
        entries:[
          narration("laundry-02-n1","문제의 옷들이 테이블 위에 올라온다. 검은 조끼, 붉은 리본, 분홍 셔츠, 흰 장갑, 정체불명의 작은 양말 한 짝."),
          dialogue("laundry-02-d1",C.alastor,"ALASTOR","붉은 리본이 전부 제 것이라는 성급한 결론은 삼가 주시길."),
          dialogue("laundry-02-d2",C.angel,"ANGEL DUST","그럼 저 귀여운 양말은 네 거야?"),
          dialogue("laundry-02-d3",C.alastor,"ALASTOR","질문을 취소할 기회를 드리지요."),
          dialogue("laundry-02-d4",C.lucifer,"LUCIFER","흰 장갑은 내 것 같지만… 왜 한 짝뿐이지?"),
          dialogue("laundry-02-d5",C.niffty,"NIFFTY","다른 한 짝은 필터 안에서 새로운 삶을 시작했어!"),
          choice("laundry-02-c1","뒤섞인 빨래를 어떤 방식으로 돌려줄까?",[
            option("laundry-02-o1","특징을 확인해 하나씩 소유자를 맞춘다",[
              player("laundry-02-o1-d1","색 말고 단추, 재질, 수선 자국을 봐요. 하나씩 맞추면 돼요."),
              dialogue("laundry-02-o1-d2",C.vaggie,"VAGGIE","그래. 가장 확실해."),
              dialogue("laundry-02-o1-d3",C.baxter,"BAXTER","드디어 분류라는 개념이 등장했군.")
            ],{effects:[effect("laundry-02-o1-fx","hotel_laundry_result","set","careful")],affectionEffects:[affection("laundry-02-o1-af",C.vaggie,1)]}),
            option("laundry-02-o2","각자 자기 것만 골라 가게 한다",[
              player("laundry-02-o2-d1","각자 확실히 자기 것만 가져가요. 남는 건 마지막에 같이 확인하고."),
              dialogue("laundry-02-o2-d2",C.husk,"HUSK","빨리 끝나는 방식이면 찬성."),
              dialogue("laundry-02-o2-d3",C.niffty,"NIFFTY","남는 건 내 거 해도 돼?")
            ],{effects:[effect("laundry-02-o2-fx","hotel_laundry_result","set","quick")]}),
            option("laundry-02-o3","옷을 입어 보고 맞으면 가져간다",[
              player("laundry-02-o3-d1","정 모르겠으면 입어 보고 맞는 사람이 가져가죠."),
              dialogue("laundry-02-o3-d2",C.angel,"ANGEL DUST","드디어 이 상황을 이해하는 사람이 나왔네."),
              dialogue("laundry-02-o3-d3",C.husk,"HUSK","난 참가 안 한다.")
            ],{effects:[effect("laundry-02-o3-fx","hotel_laundry_result","set","tryon")],affectionEffects:[affection("laundry-02-o3-af",C.angel,1)]})
          ]),
          narration("laundry-02-n2","분류가 끝날 즈음 세탁기 안에서 둔탁한 소리가 난다."),
          dialogue("laundry-02-d6",C.baxter,"BAXTER","아직 안 끝났어. 안에서 금속성 물체가 회전 중이다."),
          dialogue("laundry-02-d7",C.lucifer,"LUCIFER","…내 지팡이 장식이 하나 없긴 한데.")
        ]
      },
      {
        id:"hotel-laundry-03-finish",
        name:"공용 세탁실 03 · 탈수 금지 물품",
        characterId:C.lucifer,
        menuVisible:false,
        entries:[
          narration("laundry-03-n1","세탁기가 멈추고 문이 열린다. 안에서 금빛 사과 장식과 양말 한 짝이 나란히 굴러나온다."),
          dialogue("laundry-03-d1",C.lucifer,"LUCIFER","아! 찾았다."),
          dialogue("laundry-03-d2",C.baxter,"BAXTER","그게 드럼을 세 번 찍고도 멀쩡한 게 더 문제야."),
          narration("laundry-03-careful-n1","테이블 위 빨래는 주인별로 가지런히 정리되어 있다. 니프티가 보기 드물게 손을 대지 않고 감상한다.",{condition:{variableId:"hotel_laundry_result",operator:"==",value:"careful"}}),
          narration("laundry-03-quick-n1","각자 빨래는 대부분 돌아갔다. 정체불명의 셔츠 한 장만 남아 모두가 눈을 피한다.",{condition:{variableId:"hotel_laundry_result",operator:"==",value:"quick"}}),
          narration("laundry-03-tryon-n1","세탁실이 잠시 패션쇼가 되었고, 누구 것인지 몰랐던 옷의 절반은 예상보다 빨리 주인을 찾았다.",{condition:{variableId:"hotel_laundry_result",operator:"==",value:"tryon"}}),
          dialogue("laundry-03-d3",C.niffty,"NIFFTY","다음엔 이름표를 옷 안쪽에 박아버릴게!"),
          dialogue("laundry-03-d4",C.vaggie,"VAGGIE","펜으로 써. 그냥 펜으로."),
          dialogue("laundry-03-d5",C.angel,"ANGEL DUST","그리고 뜨거운 물 금지."),
          dialogue("laundry-03-d6",C.husk,"HUSK","왕실 장식 세탁 금지도 추가해."),
          dialogue("laundry-03-d7",C.lucifer,"LUCIFER","그건 실수 한 번이었어."),
          dialogue("laundry-03-d8",C.baxter,"BAXTER","세탁기 기록엔 네 번이라고 돼 있는데."),
          player("laundry-03-d9","규칙표는 제가 써둘게요."),
          dialogue("laundry-03-d10",C.alastor,"ALASTOR","‘마법, 무기, 왕실 장식은 주머니에서 꺼낼 것.’ 아주 품격 있는 호텔 규칙이군요.")
        ]
      },

      {
        id:"hotel-game-01-invitation",
        name:"게임의 밤 01 · 친목 활동 강제 개시",
        characterId:C.husk,
        menuVisible:true,
        continuationEventIds:["hotel-game-02-board"],
        entries:[
          narration("game-01-n1","찰리가 ‘친목을 위한 평화로운 게임의 밤’이라고 적힌 팻말을 바에 세운다. 허스크는 이미 피곤한 얼굴이다."),
          dialogue("game-01-d1",C.charlie,"CHARLIE","한 판만! 경쟁보다 협동이 중요한 게임으로 골랐어!"),
          dialogue("game-01-d2",C.husk,"HUSK","그 말 듣고 안심된 적이 한 번도 없어."),
          dialogue("game-01-d3",C.angel,"ANGEL DUST","상품 있어? 없으면 내가 만들게."),
          dialogue("game-01-d4",C.vaggie,"VAGGIE","상품 없음. 내기 없음. 속임수 없음."),
          dialogue("game-01-d5",C.alastor,"ALASTOR","규칙이 세 줄이나 되니 이미 절반은 깨졌겠군요."),
          dialogue("game-01-d6",C.lucifer,"LUCIFER","그래서 내가 게임을 하나 가져왔지! 내가 고른 가족용 협동 보드게임! 당연히 재미없을 리 없고."),
          narration("game-01-n2","루시퍼가 금빛 상자를 열자 작은 말들이 스스로 걸어 나와 테이블 위에 선다."),
          dialogue("game-01-d7",C.baxter,"BAXTER","왜 보드게임에서 마력 반응이 나와?"),
          dialogue("game-01-d8",C.lucifer,"LUCIFER","몰입감."),
          dialogue("game-01-d9",C.niffty,"NIFFTY","말이 도망가면 잡아도 돼?!"),
          player("game-01-d10","일단 설명서부터 읽고 시작해요. 이번엔 순서를 바꾸지 맙시다."),
          dialogue("game-01-d11",C.husk,"HUSK","이 호텔에서 가장 비현실적인 제안이군.")
        ]
      },
      {
        id:"hotel-game-02-board",
        name:"게임의 밤 02 · 보드가 플레이어를 고른다",
        characterId:C.lucifer,
        menuVisible:false,
        continuationEventIds:["hotel-game-03-score"],
        entries:[
          narration("game-02-n1","게임 시작 오 분 만에 보드 위 성이 세워지고, 작은 말들은 주인들의 성격을 닮은 듯 제멋대로 움직이기 시작한다."),
          dialogue("game-02-d1",C.angel,"ANGEL DUST","내 말이 왜 허스크 말만 따라다녀?"),
          dialogue("game-02-d2",C.husk,"HUSK","내가 묻고 싶다."),
          dialogue("game-02-d3",C.alastor,"ALASTOR","제 말은 훌륭하군요. 벌써 규칙판을 점령했습니다."),
          dialogue("game-02-d4",C.vaggie,"VAGGIE","그건 점령이 아니라 규칙 위반이야."),
          dialogue("game-02-d5",C.baxter,"BAXTER","보드가 참가자의 감정에 반응해 경로를 바꾼다."),
          dialogue("game-02-d6",C.lucifer,"LUCIFER","가족 간 이해를 돕는 기능이지."),
          dialogue("game-02-d7",C.charlie,"CHARLIE","아빠, 왜 설명서엔 그 내용이 없어?"),
          dialogue("game-02-d8",C.lucifer,"LUCIFER","서프라이즈도 가족 활동의 일부니까?"),
          choice("game-02-c1","점점 과몰입하는 게임을 어떻게 끝까지 진행할까?",[
            option("game-02-o1","모두의 말을 한 팀으로 묶는다",[
              player("game-02-o1-d1","개인 점수 없애고 전부 한 팀으로 해요. 보드가 싸움을 먹고 큰다면 먹이를 끊는 거죠."),
              dialogue("game-02-o1-d2",C.charlie,"CHARLIE","완벽해! 진짜 협동 게임이 됐어!"),
              dialogue("game-02-o1-d3",C.alastor,"ALASTOR","승자가 사라지는군요. 섭섭한 구조입니다.")
            ],{effects:[effect("game-02-o1-fx","hotel_game_result","set","team")],affectionEffects:[affection("game-02-o1-af",C.charlie,1)]}),
            option("game-02-o2","규칙을 최소화하고 시간 제한을 둔다",[
              player("game-02-o2-d1","규칙 세 개만 남기고 십 분 안에 끝내요. 보드가 새 규칙 만들면 무효."),
              dialogue("game-02-o2-d2",C.vaggie,"VAGGIE","좋아. 끝나는 시간이 보이는 게 제일 좋아."),
              dialogue("game-02-o2-d3",C.husk,"HUSK","이제야 게임 같군.")
            ],{effects:[effect("game-02-o2-fx","hotel_game_result","set","control")]}),
            option("game-02-o3","보드가 하고 싶은 대로 한 판 지켜본다",[
              player("game-02-o3-d1","한 판만 보드가 정하는 대로 가보죠. 대신 위험해지면 바로 접어요."),
              dialogue("game-02-o3-d2",C.angel,"ANGEL DUST","살아있는 보드랑 기싸움? 난 찬성."),
              dialogue("game-02-o3-d3",C.baxter,"BAXTER","과학적 호기심 때문에 반대하기가 어렵군.")
            ],{effects:[effect("game-02-o3-fx","hotel_game_result","set","chaos")],emotionEffects:[emotion("game-02-o3-em",C.baxter,"curious",45)]})
          ]),
          narration("game-02-n2","보드 중앙의 성이 갑자기 열리고 작은 종이 울린다."),
          dialogue("game-02-d9",C.niffty,"NIFFTY","끝났어? 부숴도 돼?"),
          dialogue("game-02-d10",C.lucifer,"LUCIFER","아직 점수 계산이 남았어!")
        ]
      },
      {
        id:"hotel-game-03-score",
        name:"게임의 밤 03 · 승자 없는 우승",
        characterId:C.charlie,
        menuVisible:false,
        entries:[
          narration("game-03-team-n1","모든 말이 같은 칸에 모이자 보드가 잠시 멈추더니 ‘공동 승리’라는 금빛 글자를 띄운다.",{condition:{variableId:"hotel_game_result",operator:"==",value:"team"}}),
          narration("game-03-control-n1","시간 제한이 끝나자 허스크가 정확히 종을 치고 보드를 닫는다. 처음으로 게임이 스스로 끝나지 못했다.",{condition:{variableId:"hotel_game_result",operator:"==",value:"control"}}),
          narration("game-03-chaos-n1","보드는 끝내 모든 말을 테이블 밖으로 탈주시킨 뒤, 스스로 ‘재경기’를 요구하는 문구를 띄운다.",{condition:{variableId:"hotel_game_result",operator:"==",value:"chaos"}}),
          dialogue("game-03-d1",C.charlie,"CHARLIE","그래도 다 같이 한 게임을 끝냈어!"),
          dialogue("game-03-d2",C.husk,"HUSK","‘끝냈다’의 정의부터 확인하자."),
          dialogue("game-03-d3",C.angel,"ANGEL DUST","난 재밌었어. 특히 알래스터 말이 규칙판 뜯어먹은 거."),
          dialogue("game-03-d4",C.alastor,"ALASTOR","취향이 고약한 말이었지요."),
          dialogue("game-03-d5",C.baxter,"BAXTER","난 보드 내부 구조를 보고 싶어."),
          dialogue("game-03-d6",C.lucifer,"LUCIFER","분해는 안 돼! 절판된 가족용 초판이야."),
          dialogue("game-03-d7",C.vaggie,"VAGGIE","다음 게임의 밤은 평범한 카드로 한다."),
          dialogue("game-03-d8",C.husk,"HUSK","내 카드엔 손대지 마."),
          dialogue("game-03-d9",C.niffty,"NIFFTY","그럼 숨바꼭질!"),
          player("game-03-d10","오늘은 여기서 끝내는 게 공동 승리 같아요."),
          dialogue("game-03-d11",C.charlie,"CHARLIE","좋아. 다음엔 더 평화로운 걸 찾자!"),
          dialogue("game-03-d12",C.husk,"HUSK","그 말이 제일 불안하다.")
        ]
      },
      {
        id:"hotel-movie-01-pick",
        name:"심야 영화 01 · 리모컨은 하나",
        characterId:C.angel,
        menuVisible:true,
        continuationEventIds:["hotel-movie-02-couch"],
        entries:[
          narration("movie-01-n1","늦은 밤, 로비 소파 앞에 간식과 담요가 쌓였다. 문제는 리모컨이 하나고 보고 싶은 영화는 여섯 개라는 것이다."),
          dialogue("movie-01-d1",C.charlie,"CHARLIE","오늘은 그냥 편하게 영화 한 편 보는 거야. 아무 계획도 없어!"),
          dialogue("movie-01-d2",C.vaggie,"VAGGIE","그 말이 계획보다 더 불안해."),
          dialogue("movie-01-d3",C.angel,"ANGEL DUST","난 공포. 피 많이 나오는 걸로."),
          dialogue("movie-01-d4",C.husk,"HUSK","난 조용한 거."),
          dialogue("movie-01-d5",C.niffty,"NIFFTY","벌레 나오는 거! 아주 크게!"),
          dialogue("movie-01-d6",C.baxter,"BAXTER","다큐멘터리. 최소한 사실관계가 맞는 걸 보자."),
          dialogue("movie-01-d7",C.lucifer,"LUCIFER","뮤지컬은 어때? 좋은 왕이라면 최소 세 곡은 직접 불러야—"),
          dialogue("movie-01-d8",C.alastor,"ALASTOR","무성 영화라면 모두의 요구를 절반쯤 만족시키겠군요."),
          choice("movie-01-c1","당신은 뭘 보고 싶어?",[
            option("movie-01-o1","공포 영화가 보고 싶다",[
              player("movie-01-o1-d1","전 공포요. 오늘은 그냥 놀랄 준비 하고 왔어요."),
              dialogue("movie-01-o1-d2",C.angel,"ANGEL DUST","봐! 취향 있는 사람이 또 있잖아."),
              dialogue("movie-01-o1-d3",C.husk,"HUSK","둘이 동시에 소리만 안 지르면 상관없어.")
            ],{effects:[effect("movie-01-o1-fx","hotel_movie_pick","set","horror")],affectionEffects:[affection("movie-01-o1-af",C.angel,1)]}),
            option("movie-01-o2","가벼운 코미디가 좋다",[
              player("movie-01-o2-d1","오늘은 코미디가 좋아요. 아무 생각 없이 웃고 싶어요."),
              dialogue("movie-01-o2-d2",C.charlie,"CHARLIE","좋아! 그게 영화의 밤 취지랑 제일 가깝다!"),
              dialogue("movie-01-o2-d3",C.alastor,"ALASTOR","누가 무엇을 보고 웃는지가 더 흥미롭겠군요.")
            ],{effects:[effect("movie-01-o2-fx","hotel_movie_pick","set","comedy")],affectionEffects:[affection("movie-01-o2-af",C.charlie,1)]}),
            option("movie-01-o3","아무거나 좋고 간식이 중요하다",[
              player("movie-01-o3-d1","전 영화보다 간식이요. 팝콘 있는 쪽에 투표할게요."),
              dialogue("movie-01-o3-d2",C.husk,"HUSK","가장 정직한 답이군."),
              dialogue("movie-01-o3-d3",C.niffty,"NIFFTY","팝콘에 벌레 모양 사탕 넣어도 돼?!")
            ],{effects:[effect("movie-01-o3-fx","hotel_movie_pick","set","snack")],affectionEffects:[affection("movie-01-o3-af",C.husk,1)]})
          ]),
          dialogue("movie-01-d9",C.vaggie,"VAGGIE","좋아. 이번엔 다수결도 협상도 없어. 그냥 틀자."),
          dialogue("movie-01-d10",C.angel,"ANGEL DUST","드디어 영화보다 긴 예고편이 끝났네.")
        ]
      },
      {
        id:"hotel-movie-02-couch",
        name:"심야 영화 02 · 소파 자리 전쟁",
        characterId:C.husk,
        menuVisible:false,
        continuationEventIds:["hotel-movie-03-credits"],
        entries:[
          narration("movie-02-n1","영화가 시작되자 이번엔 소파 자리가 문제다. 엔젤은 담요를 두 장 차지했고, 루시퍼는 팔걸이에 왕관 모양 쿠션을 올려놨다."),
          dialogue("movie-02-d1",C.husk,"HUSK","난 바에 있을 거다. 거기선 아무도 내 팔걸이 안 훔쳐."),
          dialogue("movie-02-d2",C.angel,"ANGEL DUST","이건 훔친 게 아니라 선점이야."),
          dialogue("movie-02-d3",C.lucifer,"LUCIFER","그 쿠션은 그냥 쿠션이 아니야. 내가 쓰던 거잖아."),
          dialogue("movie-02-d4",C.vaggie,"VAGGIE","그럼 상징물은 바닥에 둬."),
          narration("movie-02-horror-n1","첫 점프 스케어가 터지자 엔젤이 웃고, 찰리는 담요를 턱까지 끌어올린다.",{condition:{variableId:"hotel_movie_pick",operator:"==",value:"horror"}}),
          narration("movie-02-comedy-n1","첫 웃음 포인트에서 찰리가 가장 크게 웃고, 알래스터는 영화보다 주변 반응을 더 즐기는 표정이다.",{condition:{variableId:"hotel_movie_pick",operator:"==",value:"comedy"}}),
          narration("movie-02-snack-n1","영화 제목이 뜨기도 전에 팝콘 그릇이 절반 비었다. 범인은 한 명이 아니다.",{condition:{variableId:"hotel_movie_pick",operator:"==",value:"snack"}}),
          player("movie-02-d5","전 그냥 여기 앉을게요. 누가 밀면 같이 밀립니다."),
          dialogue("movie-02-d6",C.charlie,"CHARLIE","완벽해! 다 같이 붙어 앉으면 더 영화의 밤 같아."),
          dialogue("movie-02-d7",C.baxter,"BAXTER","밀집도는 올라가지만 화면 시야각은 나빠져."),
          dialogue("movie-02-d8",C.niffty,"NIFFTY","난 등받이 위에 앉을래!"),
          dialogue("movie-02-d9",C.vaggie,"VAGGIE","발로 화면만 가리지 마."),
          narration("movie-02-n2","몇 분 뒤, 누가 어디에 앉았는지는 중요하지 않게 된다. 모두가 같은 화면을 보고 있기 때문이다.")
        ]
      },
      {
        id:"hotel-movie-03-credits",
        name:"심야 영화 03 · 엔딩 크레딧 이후",
        characterId:C.charlie,
        menuVisible:false,
        entries:[
          narration("movie-03-n1","엔딩 크레딧이 올라가지만 아무도 바로 일어나지 않는다. 빈 그릇과 구겨진 담요만 늘어났다."),
          dialogue("movie-03-d1",C.charlie,"CHARLIE","이런 거 좋다. 별일 안 일어나고 그냥 같이 있는 거."),
          dialogue("movie-03-d2",C.husk,"HUSK","팝콘 그릇 세 개 엎어진 건 별일에 안 들어가나 보군."),
          dialogue("movie-03-d3",C.niffty,"NIFFTY","두 개야! 하나는 내가 잡았어!"),
          dialogue("movie-03-d4",C.angel,"ANGEL DUST","다음 편 바로 갈 사람?"),
          dialogue("movie-03-d5",C.vaggie,"VAGGIE","지금 새벽 세 시야."),
          dialogue("movie-03-d6",C.lucifer,"LUCIFER","뮤지컬이라면 시간 감각이 더 빨리—"),
          dialogue("movie-03-d7",C.baxter,"BAXTER","안 돼."),
          dialogue("movie-03-d8",C.alastor,"ALASTOR","의견 일치가 이렇게 빠른 것도 드문 일이군요."),
          choice("movie-03-c1","당신은 어떻게 할까?",[
            option("movie-03-o1","한 편 더 보자고 한다",[
              player("movie-03-o1-d1","전 한 편 더 볼래요. 대신 이번엔 짧은 걸로."),
              dialogue("movie-03-o1-d2",C.angel,"ANGEL DUST","좋아, 내 편 하나 확보."),
              dialogue("movie-03-o1-d3",C.vaggie,"VAGGIE","내일 아침 일정은 네가 설명해.")
            ]),
            option("movie-03-o2","간식 정리부터 돕는다",[
              player("movie-03-o2-d1","영화는 여기까지. 전 그릇부터 치울게요."),
              dialogue("movie-03-o2-d2",C.charlie,"CHARLIE","나도 도울게!"),
              dialogue("movie-03-o2-d3",C.husk,"HUSK","그 말은 마음에 드네.")
            ]),
            option("movie-03-o3","소파에서 그대로 버틴다",[
              player("movie-03-o3-d1","전 여기서 안 움직일래요. 이미 너무 편해졌어요."),
              dialogue("movie-03-o3-d2",C.niffty,"NIFFTY","담요 덮어줄까? 얼굴까지?"),
              dialogue("movie-03-o3-d3",C.lucifer,"LUCIFER","내 쿠션 하나 빌려주지. 잘 다뤄.")
            ])
          ]),
          dialogue("movie-03-d9",C.charlie,"CHARLIE","그럼 다음 영화의 밤도 있는 걸로!"),
          dialogue("movie-03-d10",C.husk,"HUSK","그 결론은 누가 승인했지?")
        ]
      }
    ]
  }];
})();
