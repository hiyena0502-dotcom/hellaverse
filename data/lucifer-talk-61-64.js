"use strict";

(()=>{
  const packs=Array.isArray(window.HV_STORY_PACKS)?window.HV_STORY_PACKS:[];
  const pack=packs.find(row=>row?.id==="pooltalk-52-lucifer-morningstar");
  if(!pack)return;

  const C="lucifer-morningstar";
  const NAME="Lucifer Morningstar";
  const BANDS=["COLD","DISTANT","NEUTRAL","WARM","CLOSE"];
  const AC=band=>({characterId:C,band,operator:">=",value:0});
  const VC=(variableId,operator,value)=>({variableId,operator,value:String(value)});
  const V=(variableId,operation,value)=>({variableId,operation,value:String(value)});
  const AF=(id,amount)=>({id,characterId:C,amount,silent:true});
  const EF=(id,state,intensity)=>({id,characterId:C,state,intensity});
  const D=(id,text,band="",extra={})=>({id,type:"dialogue",speaker:NAME,speakerCharacterId:C,text,...(band?{affectionCondition:AC(band)}:{}),...extra});
  const P=(id,text,band="")=>({id,type:"dialogue",speaker:"PLAYER",speakerCharacterId:"",text,...(band?{affectionCondition:AC(band)}:{})});
  const N=(id,text,role="situation",band="",extra={})=>({id,type:"narration",text,narrationRole:role,...(band?{affectionCondition:AC(band)}:{}),...extra});
  const CH=(id,prompt,options,extra={})=>({id,type:"choice",prompt,options,...extra});
  const O=(id,label,tone,entries,extra={})=>({id,label,tone,entries,condition:null,effects:[],itemEffects:[],itemCondition:null,askCondition:null,affectionCondition:null,affectionEffects:[],emotionCondition:null,emotionEffects:[],exitMode:"continue",targetEventId:"",...extra});
  const raw=(variableId,operation,value)=>({variableId,operation,value});

  const pick=(map,band,def=null)=>map?.[band]??map?.default??def;
  const S=(base,bands,items,cfg={})=>{
    const out=[];
    for(const band of bands){
      const lastDialogue=[...items].map((x,i)=>[x,i]).filter(([x])=>x[0]==="d").at(-1)?.[1]??-1;
      let firstDialogue=true;
      items.forEach((item,index)=>{
        const [kind,text,role]=item;
        if(kind==="p"){
          out.push(P(base+"-"+band.toLowerCase()+"-p"+index,text,band));
          return;
        }
        if(kind==="n"){
          out.push(N(base+"-"+band.toLowerCase()+"-n"+index,text,role||"reaction",band));
          return;
        }
        const extra={};
        if(firstDialogue){
          firstDialogue=false;
          const emotion=pick(cfg.emotion,band);
          if(emotion)extra.emotionEffects=[EF(base+"-emo-"+band.toLowerCase(),emotion[0],emotion[1])];
        }
        if(index===lastDialogue){
          const delta=Number(pick(cfg.delta,band,0))||0;
          if(delta)extra.affectionEffects=[AF(base+"-aff-"+band.toLowerCase(),delta)];
          const descriptors=[
            ...(cfg.commonFx||[]),
            ...(pick(cfg.fxBy,band,[])||[])
          ];
          if(descriptors.length)extra.effects=descriptors.map((fx,i)=>({
            id:base+"-fx-"+band.toLowerCase()+"-"+i,
            variableId:fx.variableId,
            operation:fx.operation,
            value:String(fx.value)
          }));
        }
        out.push(D(base+"-"+band.toLowerCase()+"-d"+index,text,band,extra));
      });
    }
    return out;
  };

  const reset=(n,id)=>[
    {id:id+"-seen",...V("luc_flag_t"+n+"_seen","set",true)},
    {id:id+"-tension",...V("luc_t"+n+"_tension","set",0)},
    {id:id+"-push",...V("luc_t"+n+"_push","set",0)},
    {id:id+"-closed",...V("luc_t"+n+"_closed","set",false)}
  ];

  const eventBase=(id,name,n,sensitivity,topicFamily,entries)=>({
    id,
    name:"TALK · "+name,
    characterId:C,
    eventRole:"talk",
    menuVisible:true,
    randomEligible:true,
    startMode:"EVENT",
    sensitivity,
    topicFamily,
    emotionExitMode:"keep",
    entries
  });

  const e61id="solo-talk-lucifer-morningstar-01";
  const e61=eventBase(e61id,"오리 설계","61","light","duck_crafting",[
    N(e61id+"-intro-1","작업대 위에 작은 오리 설계도가 펼쳐져 있다.","intro","",{effects:[
      ...reset("61",e61id),
      {id:e61id+"-design-seen",...V("luc_t61_duck_design_seen","set",true)}
    ]}),
    N(e61id+"-intro-2","몸통 옆에는 지워진 선이 여러 겹 겹쳐 있고, 날개 부분에는 알아보기 힘든 메모가 빽빽하다.","situation"),
    N(e61id+"-intro-3","루시퍼는 연필 끝으로 한 부분을 톡톡 두드리다가 네가 가까이 온 걸 알아차린다.","action"),
    ...S(e61id+"-open-low",["COLD","DISTANT"],[
      ["d","건드리지 마. 아직 비율 안 맞아."]
    ],{emotion:{default:["guarded",40]}}),
    ...S(e61id+"-open-high",["NEUTRAL","WARM","CLOSE"],[
      ["d","아, 잘 왔어. 이거 봐."],
      ["d","날개를 여기서 조금만 더 키우면 귀여워지는데 그러면 중심이—"],
      ["n","잠깐 멈춘다.","reaction"],
      ["d","…아. 벌써 설명하고 있었네."]
    ],{emotion:{default:["joy",35]}}),
    CH(e61id+"-root","어떤 이야기를 이어갈까?",[
      O(e61id+"-c1","왜 이렇게까지 설계도를 그리는지 묻는다","light",[
        P(e61id+"-c1-p","오리 하나 만드는데 설계도가 이렇게 많이 필요해요?"),
        ...S(e61id+"-c1-low",["COLD","DISTANT"],[
          ["d","‘오리 하나’?"],
          ["d","방금 아주 위험한 말을 했는데."]
        ],{emotion:{default:["guarded",30]}}),
        ...S(e61id+"-c1-high",["NEUTRAL","WARM","CLOSE"],[
          ["d","제대로 만들려면 필요하지!"],
          ["d","모양만 귀여우면 끝인 줄 알아? 균형도 맞아야 하고, 움직이는 거면 안 넘어져야 하고—"],
          ["p","움직이기도 해요?"],
          ["n","루시퍼가 웃는다.","reaction"],
          ["d","그건 완성되면 보여줄 거야."]
        ],{
          emotion:{default:["joy",50]},
          delta:{WARM:1,CLOSE:1},
          fxBy:{
            NEUTRAL:[raw("luc_t61_moving_duck_revealed","set",true)],
            WARM:[raw("luc_t61_moving_duck_revealed","set",true)],
            CLOSE:[raw("luc_t61_moving_duck_revealed","set",true)]
          }
        }),
        CH(e61id+"-c1-follow","조금 더 물어볼까?",[
          O(e61id+"-c1-a","단순한 고무오리는 안 만드냐고 묻는다","light",[
            P(e61id+"-c1-a-p","그냥 평범한 고무오리는요?"),
            ...S(e61id+"-c1-a-low",["COLD","DISTANT"],[
              ["d","그건 가게에서 사면 되잖아."]
            ],{emotion:{default:["calm",20]},commonFx:[raw("luc_duck_interest","add",1)]}),
            ...S(e61id+"-c1-a-high",["NEUTRAL","WARM","CLOSE"],[
              ["d","만들 수 있는데 왜 평범하게 만들어?"],
              ["d","그건 낭비지."]
            ],{emotion:{default:["joy",35]},commonFx:[raw("luc_duck_interest","add",1)]})
          ])
        ],{condition:VC("luc_t61_closed","==",false)})
      ]),
      O(e61id+"-c2","왜 그렇게 오리 만드는 걸 좋아하는지 묻는다","sensitive",[
        P(e61id+"-c2-p","근데 왜 하필 오리예요?"),
        N(e61id+"-c2-stop","연필이 잠깐 멈춘다.","reaction"),
        ...S(e61id+"-c2-low",["COLD","DISTANT"],[
          ["d","귀엽잖아."],
          ["n","플레이어가 기다린다.","reaction"],
          ["d","뭘 더 원해. 충분한 이유인데."]
        ],{emotion:{default:["guarded",35]}}),
        ...S(e61id+"-c2-high",["NEUTRAL","WARM","CLOSE"],[
          ["d","음…"],
          ["n","루시퍼가 설계도 가장자리를 손가락으로 문지른다.","action"],
          ["d","만들 때는 그거 하나만 생각하면 되니까."],
          ["p","다른 생각을 안 해도 돼서요?"],
          ["d","…응. 그런 것도 있고."],
          ["n","곧바로 연필을 든다.","action"],
          ["d","그리고 귀엽잖아. 그게 제일 중요해."]
        ],{
          emotion:{default:["calm",35]},
          delta:{WARM:1,CLOSE:1},
          fxBy:{
            NEUTRAL:[raw("luc_t61_duck_reason_shared","set",true)],
            WARM:[raw("luc_t61_duck_reason_shared","set",true)],
            CLOSE:[raw("luc_t61_duck_reason_shared","set",true)]
          }
        })
      ]),
      O(e61id+"-c3","설계도를 봐도 되는지 묻는다","supportive",[
        P(e61id+"-c3-p","저도 좀 봐도 돼요?"),
        ...S(e61id+"-c3-low",["COLD","DISTANT"],[
          ["d","보기만 해."],
          ["d","저 빨간 선은 틀린 거니까 그것도 못 본 걸로 하고."]
        ],{
          emotion:{default:["guarded",25]},
          commonFx:[raw("luc_t61_blueprint_shared","set",true)]
        }),
        ...S(e61id+"-c3-high",["NEUTRAL","WARM","CLOSE"],[
          ["d","좋아. 대신 아직 평가하지 마."],
          ["p","왜요?"],
          ["d","미완성이잖아."],
          ["d","완성 전에는 천재의 과정이고, 망하면 그때 실수인 거야."]
        ],{
          emotion:{default:["joy",30]},
          delta:{WARM:1,CLOSE:1},
          commonFx:[raw("luc_t61_blueprint_shared","set",true)]
        }),
        CH(e61id+"-c3-follow","어떻게 답할까?",[
          O(e61id+"-c3-a","완성되면 첫 번째로 보여달라고 한다","supportive",[
            P(e61id+"-c3-a-p","그럼 완성되면 제일 먼저 보여줘요."),
            ...S(e61id+"-c3-a-low",["COLD","DISTANT"],[
              ["d","기억나면."]
            ],{emotion:{default:["calm",20]}}),
            ...S(e61id+"-c3-a-high",["NEUTRAL","WARM","CLOSE"],[
              ["d","당연하지."],
              ["n","설계도 아래에 있던 종이 한 장을 슬쩍 덮는다.","action"],
              ["p","방금 숨긴 건 뭔데요?"],
              ["d","다음 버전."],
              ["d","그건 아직 비밀이야."]
            ],{
              emotion:{default:["joy",40]},
              delta:{WARM:1,CLOSE:1},
              fxBy:{
                NEUTRAL:[raw("luc_t61_first_viewer_promised","set",true),raw("luc_t61_next_version_hidden","set",true)],
                WARM:[raw("luc_t61_first_viewer_promised","set",true),raw("luc_t61_next_version_hidden","set",true)],
                CLOSE:[raw("luc_t61_first_viewer_promised","set",true),raw("luc_t61_next_version_hidden","set",true)]
              }
            })
          ])
        ],{condition:VC("luc_t61_closed","==",false)})
      ])
    ])
  ]);

  const e62id="solo-talk-lucifer-morningstar-02";
  const e62=eventBase(e62id,"왕관 손질","62","medium","royal_identity",[
    N(e62id+"-intro-1","탁자 위에 금빛 왕관이 놓여 있다.","intro","",{effects:[
      ...reset("62",e62id),
      {id:e62id+"-crown-seen",...V("luc_t62_crown_seen","set",true)}
    ]}),
    N(e62id+"-intro-2","루시퍼는 부드러운 천으로 한쪽을 닦다가 빛에 비춰보고, 마음에 안 드는지 다시 문지른다.","action"),
    ...S(e62id+"-open-low",["COLD","DISTANT"],[
      ["d","왜."],
      ["d","왕관 닦는 것도 구경거리야?"]
    ],{emotion:{default:["guarded",35]}}),
    ...S(e62id+"-open-high",["NEUTRAL","WARM","CLOSE"],[
      ["d","여기 얼룩 보여?"],
      ["n","왕관을 살짝 기울인다.","action"],
      ["d","아니, 이쪽. 빛 받으면 보이잖아."]
    ],{emotion:{default:["curious",30]}}),
    CH(e62id+"-root","어떤 이야기를 이어갈까?",[
      O(e62id+"-c1","평소 잘 쓰지도 않으면서 왜 닦는지 묻는다","neutral",[
        P(e62id+"-c1-p","자주 쓰지도 않는데 이렇게까지 닦아요?"),
        ...S(e62id+"-c1-low",["COLD","DISTANT"],[
          ["d","안 쓴다고 더럽게 둘 이유는 없잖아."]
        ],{emotion:{default:["calm",25]}}),
        ...S(e62id+"-c1-high",["NEUTRAL","WARM","CLOSE"],[
          ["d","가끔 눈에 들어오면 거슬리거든."],
          ["p","그게 이유 전부예요?"],
          ["d","응?"],
          ["n","한 번 더 왕관을 확인한다.","action"],
          ["d","…거의?"]
        ],{emotion:{default:["curious",25]}}),
        CH(e62id+"-c1-follow","조금 더 묻을까?",[
          O(e62id+"-c1-a","왕이라는 걸 확인하려는 건 아니냐고 묻는다","sensitive",[
            P(e62id+"-c1-a-p","보면서 ‘그래도 내가 왕이긴 하지’ 같은 생각은 안 해요?"),
            ...S(e62id+"-c1-a-low",["COLD","DISTANT"],[
              ["d","왕관 없어도 알아."]
            ],{
              emotion:{default:["guarded",45]},
              delta:{COLD:-1},
              fxBy:{
                COLD:[raw("luc_t62_tension","add",1),raw("luc_t62_push","add",1)],
                DISTANT:[raw("luc_t62_push","add",1)]
              }
            }),
            ...S(e62id+"-c1-a-high",["NEUTRAL","WARM","CLOSE"],[
              ["d","하하, 굳이 물건 보고 확인해야 할 정도는 아니야."],
              ["n","잠깐 입꼬리가 내려간다.","reaction"],
              ["d","왕 노릇을 얼마나 하고 있느냐는 다른 문제지만."]
            ],{
              emotion:{default:["sad",25]},
              commonFx:[raw("luc_t62_king_role_admitted","set",true)]
            })
          ])
        ],{condition:VC("luc_t62_closed","==",false)})
      ]),
      O(e62id+"-c2","직접 닦아주겠다고 한다","supportive",[
        P(e62id+"-c2-p","제가 해줄까요?"),
        N(e62id+"-c2-pull","루시퍼가 바로 왕관을 자기 쪽으로 끌어온다.","reaction"),
        ...S(e62id+"-c2-low",["COLD","DISTANT"],[
          ["d","아니."],
          ["p","빠르네요."],
          ["d","이건 내가 해."]
        ],{
          emotion:{default:["guarded",35]},
          commonFx:[raw("luc_t62_help_offered","set",true)]
        }),
        ...S(e62id+"-c2-high",["NEUTRAL","WARM","CLOSE"],[
          ["d","고맙지만 이건 됐어."],
          ["d","남이 닦아놨는데 나보다 잘하면 좀 자존심 상하잖아."],
          ["p","그게 이유예요?"],
          ["d","아주 중요한 이유지."]
        ],{
          emotion:{default:["joy",30]},
          delta:{WARM:1,CLOSE:1},
          commonFx:[raw("luc_t62_help_offered","set",true)]
        })
      ]),
      O(e62id+"-c3","지금 써보라고 한다","light",[
        P(e62id+"-c3-p","다 닦았으면 한번 써봐요."),
        ...S(e62id+"-c3-low",["COLD","DISTANT"],[
          ["d","왜?"],
          ["d","지금 즉위식이라도 해?"]
        ],{emotion:{default:["guarded",25]}}),
        ...S(e62id+"-c3-high-a",["NEUTRAL","WARM","CLOSE"],[
          ["d","지금?"],
          ["n","잠깐 왕관과 너를 번갈아 본다.","reaction"],
          ["d","…좋아. 딱 한 번."]
        ],{emotion:{default:["joy",35]}}),
        N(e62id+"-c3-wear","왕관을 머리에 올린 뒤 자세를 살짝 바로잡는다.","action","",{effects:[
          {id:e62id+"-c3-worn",...V("luc_t62_crown_worn","set",true)}
        ]}),
        ...S(e62id+"-c3-high-b",["NEUTRAL","WARM","CLOSE"],[
          ["d","어때."]
        ],{emotion:{default:["joy",40]}}),
        P(e62id+"-c3-p2","왕 같네요."),
        ...S(e62id+"-c3-low-b",["COLD","DISTANT"],[
          ["d","원래 왕이야."]
        ],{emotion:{default:["calm",25]}}),
        ...S(e62id+"-c3-high-c",["NEUTRAL","WARM","CLOSE"],[
          ["d","그건 칭찬이라고 하기엔 사실 확인에 가까운데."],
          ["n","그래도 바로 벗지는 않는다.","reaction"]
        ],{
          emotion:{default:["joy",40]},
          delta:{WARM:1,CLOSE:1}
        })
      ])
    ])
  ]);

  const e63id="solo-talk-lucifer-morningstar-03";
  const e63=eventBase(e63id,"낡은 악보","63","high","music_memory",[
    N(e63id+"-intro-1","접힌 악보 한 장이 다른 종이들과 떨어져 놓여 있다.","intro","",{effects:[
      ...reset("63",e63id),
      {id:e63id+"-score-seen",...V("luc_t63_score_seen","set",true)}
    ]}),
    N(e63id+"-intro-2","중간부터 음표가 끊겨 있고, 그 아래는 몇 번이나 썼다 지운 흔적뿐이다.","situation"),
    N(e63id+"-intro-3","루시퍼가 악보를 펼쳤다가 네가 다가오자 접지도 숨기지도 않은 채 그대로 둔다.","action"),
    ...S(e63id+"-open-low",["COLD","DISTANT"],[
      ["d","미완성이야."]
    ],{emotion:{default:["guarded",35]}}),
    ...S(e63id+"-open-high",["NEUTRAL","WARM","CLOSE"],[
      ["d","아직 안 끝났어."],
      ["p","오래된 것 같은데요."],
      ["d","그 말은 굳이 안 해도 됐어."]
    ],{emotion:{default:["calm",30]}}),
    CH(e63id+"-root","어떤 이야기를 이어갈까?",[
      O(e63id+"-c1","왜 완성하지 않았는지 묻는다","sensitive",[
        P(e63id+"-c1-p","왜 여기서 멈췄어요?"),
        ...S(e63id+"-c1-low",["COLD","DISTANT"],[
          ["d","마음에 안 들어서."],
          ["p","그 뒤로 계속요?"],
          ["d","그럴 수도 있지."]
        ],{emotion:{default:["guarded",40]}}),
        ...S(e63id+"-c1-high",["NEUTRAL","WARM","CLOSE"],[
          ["d","처음엔 한 부분이 마음에 안 들었고."],
          ["n","악보를 한번 내려다본다.","action"],
          ["d","그러다 너무 오래 놔뒀고."],
          ["p","지금 다시 하면 되잖아요."],
          ["d","그러게."],
          ["n","그 말과 달리 연필은 들지 않는다.","reaction"]
        ],{emotion:{default:["sad",25]}}),
        CH(e63id+"-c1-follow","조금 더 들어갈까?",[
          O(e63id+"-c1-a","완성하기 싫은 건지 묻는다","sensitive",[
            P(e63id+"-c1-a-p","사실 끝내기 싫은 거 아니에요?"),
            ...S(e63id+"-c1-a-low",["COLD","DISTANT"],[
              ["d","분석하지 마."]
            ],{
              emotion:{default:["guarded",60]},
              delta:{COLD:-2,DISTANT:-1},
              fxBy:{
                COLD:[raw("luc_t63_tension","add",1),raw("luc_t63_push","add",1),raw("luc_t63_closed","set",true)],
                DISTANT:[raw("luc_t63_tension","add",1),raw("luc_t63_push","add",1)]
              }
            }),
            ...S(e63id+"-c1-a-high",["NEUTRAL","WARM","CLOSE"],[
              ["d","…모르겠네."],
              ["d","끝내면 이제 진짜 완성된 걸 들어야 하잖아."]
            ],{
              emotion:{default:["sad",40]},
              delta:{NEUTRAL:-1},
              fxBy:{
                NEUTRAL:[raw("luc_t63_push","add",1)],
                WARM:[raw("luc_t63_completion_avoidance_shared","set",true)],
                CLOSE:[raw("luc_t63_completion_avoidance_shared","set",true)]
              }
            })
          ])
        ],{condition:VC("luc_t63_closed","==",false)})
      ]),
      O(e63id+"-c2","한번 연주해달라고 한다","sensitive",[
        P(e63id+"-c2-p","완성된 데까지만 들려줘요."),
        ...S(e63id+"-c2-low",["COLD","DISTANT"],[
          ["d","싫어."],
          ["p","왜요?"],
          ["d","미완성이니까."]
        ],{
          emotion:{default:["guarded",50]},
          delta:{COLD:-1},
          fxBy:{
            COLD:[raw("luc_t63_tension","add",1),raw("luc_t63_push","add",1)],
            DISTANT:[raw("luc_t63_push","add",1)]
          }
        }),
        ...S(e63id+"-c2-high",["NEUTRAL","WARM","CLOSE"],[
          ["d","지금?"],
          ["n","플레이어가 기다린다.","reaction"],
          ["d","…조금만."],
          ["n","루시퍼가 가까운 건반에 손을 얹는다.","action"],
          ["n","몇 마디가 이어지다가 악보와 같은 곳에서 멈춘다.","situation"],
          ["d","여기까지."],
          ["p","좋은데요."],
          ["d","그러니까 더 짜증 나."]
        ],{
          emotion:{default:["anxious",30]},
          delta:{WARM:1,CLOSE:1},
          commonFx:[raw("luc_t63_score_played","set",true)]
        })
      ]),
      O(e63id+"-c3","찰리에게 들려준 적 있는지 묻는다","supportive",[
        P(e63id+"-c3-p","찰리도 이 곡 알아요?"),
        N(e63id+"-c3-pause","루시퍼가 곧바로 대답하지 않는다.","reaction"),
        ...S(e63id+"-c3-a",["COLD","DISTANT"],[
          ["d","아마 아니."]
        ],{emotion:{default:["guarded",30]}}),
        ...S(e63id+"-c3-b",["NEUTRAL","WARM","CLOSE"],[
          ["d","제대로 들려준 적은 없어."]
        ],{emotion:{default:["sad",25]}}),
        P(e63id+"-c3-p2","완성하면 들려줄 거예요?"),
        ...S(e63id+"-c3-low",["COLD","DISTANT"],[
          ["d","완성하면 생각해보지."]
        ],{emotion:{default:["calm",25]}}),
        ...S(e63id+"-c3-high",["NEUTRAL","WARM","CLOSE"],[
          ["d","찰리가 듣고 싶다고 하면."],
          ["n","잠깐 악보를 접으려다 다시 편다.","action"],
          ["d","…그 전에 끝내야겠지만."]
        ],{
          emotion:{default:["sad",30]},
          delta:{WARM:1,CLOSE:1},
          commonFx:[raw("luc_t63_charlie_song","set",true)]
        })
      ])
    ])
  ]);

  const e64id="solo-talk-lucifer-morningstar-04";
  const e64=eventBase(e64id,"가족사진","64","high","family_sensitive",[
    N(e64id+"-intro-1","작은 가족사진이 선반 위에 세워져 있다.","intro","",{effects:[
      ...reset("64",e64id),
      {id:e64id+"-photo-seen",...V("luc_t64_photo_seen","set",true)}
    ]}),
    N(e64id+"-intro-2","루시퍼는 주변의 먼지만 닦고 있다가 사진틀이 조금 비뚤어진 걸 발견한다.","situation"),
    N(e64id+"-intro-3","손을 뻗었다가 잠깐 멈춘 뒤 결국 반듯하게 맞춘다.","action"),
    N(e64id+"-intro-4","네가 사진을 보고 있다는 걸 알아차리고도 처음에는 아무 말도 하지 않는다.","reaction"),
    CH(e64id+"-root","어떤 이야기를 이어갈까?",[
      O(e64id+"-c1","오래된 사진인지 묻는다","sensitive",[
        P(e64id+"-c1-p","오래된 사진이죠?"),
        ...S(e64id+"-c1-low",["COLD","DISTANT"],[
          ["d","보면 알잖아."],
          ["d","오래됐어."]
        ],{emotion:{default:["guarded",45]}}),
        ...S(e64id+"-c1-high",["NEUTRAL","WARM","CLOSE"],[
          ["d","응."],
          ["n","손끝으로 사진틀 모서리를 한번 누른다.","action"],
          ["d","꽤 오래됐지."],
          ["p","계속 가지고 있었어요?"],
          ["d","버릴 이유가 없었으니까."],
          ["n","그 이상은 덧붙이지 않는다.","closing"]
        ],{emotion:{default:["sad",25]}}),
        CH(e64id+"-c1-follow","조금 더 물어볼까?",[
          O(e64id+"-c1-a","좋은 기억이냐고 묻는다","sensitive",[
            P(e64id+"-c1-a-p","좋은 기억이에요?"),
            N(e64id+"-c1-a-look","루시퍼가 사진을 내려다본다.","action"),
            ...S(e64id+"-c1-a-low",["COLD","DISTANT"],[
              ["d","그 질문은 좀 복잡한데."]
            ],{
              emotion:{default:["guarded",60]},
              delta:{COLD:-2,DISTANT:-1},
              fxBy:{
                COLD:[raw("luc_t64_tension","add",1),raw("luc_t64_push","add",1)],
                DISTANT:[raw("luc_t64_tension","add",1),raw("luc_t64_push","add",1)]
              }
            }),
            ...S(e64id+"-c1-a-high",["NEUTRAL","WARM","CLOSE"],[
              ["d","좋았던 순간인 건 맞아."],
              ["n","잠깐 침묵한다.","reaction"],
              ["d","그 뒤까지 전부 좋았다는 뜻은 아니고."]
            ],{
              emotion:{default:["sad",45]},
              delta:{NEUTRAL:-1},
              fxBy:{
                NEUTRAL:[raw("luc_t64_push","add",1)],
                WARM:[raw("luc_t64_memory_acknowledged","set",true)],
                CLOSE:[raw("luc_t64_memory_acknowledged","set",true)]
              }
            })
          ])
        ],{condition:VC("luc_t64_closed","==",false)})
      ]),
      O(e64id+"-c2","사진을 닦아주겠다고 한다","supportive",[
        P(e64id+"-c2-p","사진틀도 닦아줄까요?"),
        ...S(e64id+"-c2-low",["COLD","DISTANT"],[
          ["d","아니, 그냥 둬."],
          ["n","목소리가 생각보다 빠르게 나온다.","reaction"],
          ["n","잠시 뒤 조금 누그러진다.","transition"],
          ["d","…내가 할게."]
        ],{emotion:{default:["guarded",45]}}),
        ...S(e64id+"-c2-high",["NEUTRAL","WARM","CLOSE"],[
          ["d","괜찮아."],
          ["d","이건 내가 하는 게 편해."]
        ],{emotion:{default:["calm",30]}}),
        N(e64id+"-c2-withdraw","플레이어는 손을 거둔다.","action","",{effects:[
          {id:e64id+"-c2-respected",...V("luc_t64_photo_boundary_respected","set",true)},
          {id:e64id+"-c2-tension-down",...V("luc_t64_tension","subtract",1)}
        ]}),
        N(e64id+"-c2-clean","루시퍼는 아무 말 없이 천으로 사진틀 가장자리를 닦는다.","action"),
        ...S(e64id+"-c2-thanks",["NEUTRAL","WARM","CLOSE"],[
          ["d","고마워."]
        ],{
          emotion:{default:["calm",35]},
          delta:{WARM:1,CLOSE:1}
        })
      ]),
      O(e64id+"-c3","호텔에 가져다놓을 생각은 없는지 묻는다","supportive",[
        P(e64id+"-c3-p","호텔에 둬도 찰리가 좋아할 것 같은데요."),
        N(e64id+"-c3-stop","루시퍼의 손이 멈춘다.","reaction"),
        ...S(e64id+"-c3-low",["COLD","DISTANT"],[
          ["d","찰리가 원하면."]
        ],{emotion:{default:["guarded",30]}}),
        ...S(e64id+"-c3-high",["NEUTRAL","WARM","CLOSE"],[
          ["d","음…"],
          ["n","한동안 사진을 본다.","reaction"],
          ["d","찰리가 갖고 싶어 한다면 줄 수도 있지."],
          ["p","당신은 괜찮고요?"],
          ["d","사진 한 장 없어지는 거잖아."],
          ["n","말한 뒤 사진틀을 괜히 다시 바로 세운다.","action"],
          ["d","…복사본 하나 만들면 되고."]
        ],{
          emotion:{default:["sad",30]},
          delta:{WARM:1,CLOSE:1},
          commonFx:[raw("luc_t64_hotel_copy_considered","set",true)]
        })
      ])
    ])
  ]);

  const variables=[];
  for(let n=61;n<=64;n++){
    const s=String(n);
    variables.push(
      {id:"luc_t"+s+"_tension",name:"루시퍼 TALK "+s+" · 긴장도",type:"number",defaultValue:"0",minValue:0,maxValue:3},
      {id:"luc_t"+s+"_push",name:"루시퍼 TALK "+s+" · 압박 횟수",type:"number",defaultValue:"0",minValue:0,maxValue:3},
      {id:"luc_t"+s+"_closed",name:"루시퍼 TALK "+s+" · 주제 종료",type:"boolean",defaultValue:"false"},
      {id:"luc_flag_t"+s+"_seen",name:"루시퍼 TALK "+s+" 확인",type:"boolean",defaultValue:"false"}
    );
  }
  [
    ["luc_t61_duck_design_seen","61 · 오리 설계도 확인"],
    ["luc_t61_moving_duck_revealed","61 · 움직이는 오리 언급"],
    ["luc_t61_duck_reason_shared","61 · 오리를 만드는 이유 공유"],
    ["luc_t61_blueprint_shared","61 · 설계도 열람 허용"],
    ["luc_t61_first_viewer_promised","61 · 완성품 첫 공개 약속"],
    ["luc_t61_next_version_hidden","61 · 다음 버전 비밀 확인"],
    ["luc_t62_crown_seen","62 · 왕관 손질 목격"],
    ["luc_t62_king_role_admitted","62 · 왕 역할 회피 인정"],
    ["luc_t62_help_offered","62 · 왕관 손질 도움 제안"],
    ["luc_t62_crown_worn","62 · 왕관 착용"],
    ["luc_t63_score_seen","63 · 낡은 악보 확인"],
    ["luc_t63_completion_avoidance_shared","63 · 완성 회피 속내 공유"],
    ["luc_t63_score_played","63 · 미완성 곡 연주"],
    ["luc_t63_charlie_song","63 · 찰리에게 곡을 들려줄 가능성"],
    ["luc_t64_photo_seen","64 · 가족사진 확인"],
    ["luc_t64_memory_acknowledged","64 · 가족사진의 복잡한 기억 인정"],
    ["luc_t64_photo_boundary_respected","64 · 가족사진 경계 존중"],
    ["luc_t64_hotel_copy_considered","64 · 호텔용 사진 복사본 고려"]
  ].forEach(([id,name])=>variables.push({id,name,type:"boolean",defaultValue:"false"}));

  const variableMap=new Map((pack.variables||[]).map(v=>[v.id,v]));
  for(const v of variables)variableMap.set(v.id,v);
  pack.variables=[...variableMap.values()];

  const first60=(pack.events||[]).slice(0,60);
  const extraMap=new Map((pack.events||[]).slice(60).map(e=>[e.id,e]));
  const overrideMap=new Map([
    [e61.id,e61],[e62.id,e62],[e63.id,e63],[e64.id,e64]
  ]);
  const order=[
    "solo-talk-lucifer-morningstar-01",
    "solo-talk-lucifer-morningstar-02",
    "solo-talk-lucifer-morningstar-03",
    "solo-talk-lucifer-morningstar-04",
    "solo-talk-lucifer-morningstar-05",
    "solo-talk-lucifer-morningstar-06",
    "solo-talk-lucifer-morningstar-07",
    "topic-talk-lucifer-morningstar-01",
    "topic-talk-lucifer-morningstar-02",
    "banter-lucifer-morningstar-01"
  ];
  const ordered=[];
  for(const id of order){
    const event=overrideMap.get(id)||extraMap.get(id);
    if(event)ordered.push(event);
  }
  for(const event of (pack.events||[]).slice(60)){
    if(!order.includes(event.id))ordered.push(event);
  }
  pack.events=[...first60,...ordered];
  pack.version=57;
})();
