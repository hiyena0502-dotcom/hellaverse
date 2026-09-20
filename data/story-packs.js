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
    version:1,
    requiredCharacterIds:Object.values(C),
    variables:[
      {id:"hotel_welcome_started",name:"호텔 환영회 시작",type:"boolean",defaultValue:"false"},
      {id:"hotel_welcome_teamwork",name:"호텔 환영회 협동",type:"number",defaultValue:"0"},
      {id:"hotel_welcome_control",name:"호텔 환영회 통제",type:"number",defaultValue:"0"},
      {id:"hotel_welcome_result",name:"호텔 환영회 결과",type:"string",defaultValue:""},
      {id:"hotel_welcome_complete",name:"호텔 환영회 완료",type:"boolean",defaultValue:"false"},
      {id:"hotel_fridge_result",name:"심야 냉장고 재판 결과",type:"string",defaultValue:""},
      {id:"hotel_compliment_result",name:"익명 칭찬 상자 결과",type:"string",defaultValue:""}
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
          dialogue("welcome-01-d7",C.lucifer,"LUCIFER","자동 인사와 삼부 합창이 가능한 왕실 환영용 오리 합창단이야."),
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
          dialogue("fridge-01-d7",C.lucifer,"LUCIFER","나는 냉장고 안에 왕실 디저트 보안 장치를 설치했을 뿐이란다."),
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
              dialogue("fridge-02-o2-d2",C.lucifer,"LUCIFER","좋아! 과학적이고 왕실다운 접근이야."),
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
      }
    ]
  }];
})();
