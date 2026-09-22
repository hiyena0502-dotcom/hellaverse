"use strict";

(()=>{
  const packs=Array.isArray(window.HV_STORY_PACKS)?window.HV_STORY_PACKS:[];
  const pack=packs.find(row=>row?.id==="pooltalk-52-lucifer-morningstar");
  if(!pack)return;

  const C="lucifer-morningstar";
  const NAME="Lucifer Morningstar";
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
        if(kind==="p"){out.push(P(base+"-"+band.toLowerCase()+"-p"+index,text,band));return}
        if(kind==="n"){out.push(N(base+"-"+band.toLowerCase()+"-n"+index,text,role||"reaction",band));return}
        const extra={};
        if(firstDialogue){
          firstDialogue=false;
          const emotion=pick(cfg.emotion,band);
          if(emotion)extra.emotionEffects=[EF(base+"-emo-"+band.toLowerCase(),emotion[0],emotion[1])];
        }
        if(index===lastDialogue){
          const delta=Number(pick(cfg.delta,band,0))||0;
          if(delta)extra.affectionEffects=[AF(base+"-aff-"+band.toLowerCase(),delta)];
          const descriptors=[...(cfg.commonFx||[]),...(pick(cfg.fxBy,band,[])||[])];
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

  const e65id="solo-talk-lucifer-morningstar-05";
  const e65=eventBase(e65id,"사과 연습","65","high","charlie_apology",[
    N(e65id+"-intro-1","탁자 위에 구겨진 메모 몇 장이 흩어져 있다.","intro","",{effects:[
      ...reset("65",e65id),
      {id:e65id+"-practice-seen",...V("luc_t65_apology_practice_seen","set",true)}
    ]}),
    N(e65id+"-intro-2","한 장에는 짧게 적힌 문장이 여러 번 지워져 있다.","situation"),
    N(e65id+"-intro-3","‘미안해.’","background-dialogue"),
    N(e65id+"-intro-4","‘내가—’","background-dialogue"),
    N(e65id+"-intro-5","‘그때는—’","background-dialogue"),
    N(e65id+"-intro-6","루시퍼는 새 종이에 무언가 쓰려다가 네가 글씨를 읽은 걸 알아차리고 손바닥으로 슬쩍 가린다.","action"),
    ...S(e65id+"-open-low",["COLD","DISTANT"],[
      ["d","보지 마."]
    ],{emotion:{default:["guarded",55]}}),
    ...S(e65id+"-open-high",["NEUTRAL","WARM","CLOSE"],[
      ["d","…이건 좀 못 본 척해주면 안 돼?"]
    ],{emotion:{default:["embarrassed",45]}}),
    CH(e65id+"-root","어떻게 반응할까?",[
      O(e65id+"-c1","누구에게 하려는 사과인지 묻는다","sensitive",[
        P(e65id+"-c1-p","누구한테 하려고 연습하는 건데요?"),
        ...S(e65id+"-c1-low",["COLD","DISTANT"],[
          ["d","왜 그게 중요해."],
          ["n","플레이어가 기다린다.","reaction"],
          ["d","…찰리일 수도 있고."]
        ],{
          emotion:{default:["guarded",50]},
          fxBy:{
            COLD:[raw("luc_t65_push","add",1)],
            DISTANT:[raw("luc_t65_push","add",1)]
          }
        }),
        ...S(e65id+"-c1-high",["NEUTRAL","WARM","CLOSE"],[
          ["d","누구겠어."],
          ["p","찰리요?"],
          ["d","응."],
          ["n","펜을 손가락 사이에서 굴린다.","action"],
          ["d","말하려고 하면 자꾸 다른 말부터 나와서 적어본 거야."]
        ],{
          emotion:{default:["embarrassed",40]},
          delta:{WARM:1,CLOSE:1},
          commonFx:[raw("luc_t65_charlie_target_revealed","set",true)]
        }),
        CH(e65id+"-c1-follow","조금 더 말할까?",[
          O(e65id+"-c1-a","그냥 미안하다고 하면 되지 않냐고 한다","confrontational",[
            P(e65id+"-c1-a-p","그냥 “미안해”라고 하면 되잖아요."),
            ...S(e65id+"-c1-a-low",["COLD","DISTANT"],[
              ["d","알아."],
              ["d","알면 다 바로 되는 줄 알아?"]
            ],{
              emotion:{default:["guarded",60]},
              delta:{COLD:-2,DISTANT:-1},
              fxBy:{
                COLD:[raw("luc_t65_tension","add",1),raw("luc_t65_push","add",1)],
                DISTANT:[raw("luc_t65_tension","add",1),raw("luc_t65_push","add",1)]
              }
            }),
            ...S(e65id+"-c1-a-high",["NEUTRAL","WARM","CLOSE"],[
              ["d","나도 그 정도는 알아."],
              ["n","메모를 내려다본다.","action"],
              ["d","문제는 그다음 말을 안 망치는 거지."]
            ],{
              emotion:{default:["anxious",35]},
              delta:{NEUTRAL:-1},
              commonFx:[raw("luc_t65_fear_of_ruining_apology","set",true)]
            })
          ])
        ],{condition:VC("luc_t65_closed","==",false)})
      ]),
      O(e65id+"-c2","메모를 읽어봐도 되냐고 묻는다","sensitive",[
        P(e65id+"-c2-p","제가 한번 봐줄까요?"),
        ...S(e65id+"-c2-low",["COLD","DISTANT"],[
          ["d","아니."],
          ["d","사과문 검수까지 받을 생각 없어."]
        ],{
          emotion:{default:["guarded",60]},
          delta:{COLD:-2,DISTANT:-1},
          fxBy:{
            COLD:[raw("luc_t65_tension","add",1),raw("luc_t65_push","add",1)],
            DISTANT:[raw("luc_t65_push","add",1)]
          }
        }),
        ...S(e65id+"-c2-high",["NEUTRAL","WARM","CLOSE"],[
          ["d","전부는 안 돼."],
          ["p","전부는요?"],
          ["d","…문장 하나만."],
          ["n","종이를 돌려주려다 다시 자기 쪽으로 당긴다.","action"],
          ["d","잠깐. 역시 내가 읽을게."]
        ],{
          emotion:{default:["embarrassed",50]},
          commonFx:[raw("luc_t65_review_offer_considered","set",true)]
        }),
        CH(e65id+"-c2-follow","뭐라고 할까?",[
          O(e65id+"-c2-a","너무 완벽하게 하려는 것 같다고 한다","sensitive",[
            P(e65id+"-c2-a-p","사과를 너무 완벽하게 하려고 하는 거 아니에요?"),
            ...S(e65id+"-c2-a-low",["COLD","DISTANT"],[
              ["d","망치는 것보단 낫잖아."]
            ],{
              emotion:{default:["guarded",45]}
            }),
            ...S(e65id+"-c2-a-high",["NEUTRAL","WARM","CLOSE"],[
              ["d","완벽하게 하려는 건 아니야."],
              ["n","잠시 뜸을 들인다.","reaction"],
              ["d","또 엉뚱한 말해서 싸우기 싫은 거지."]
            ],{
              emotion:{default:["sad",35]},
              delta:{WARM:1,CLOSE:1},
              commonFx:[raw("luc_t65_avoid_another_fight","set",true)]
            })
          ])
        ],{condition:VC("luc_t65_closed","==",false)})
      ]),
      O(e65id+"-c3","메모 없이 말해보라고 한다","sensitive",[
        P(e65id+"-c3-p","그냥 연습 삼아서 저한테 말해봐요."),
        ...S(e65id+"-c3-low",["COLD","DISTANT"],[
          ["d","싫어."],
          ["p","연습인데도요?"],
          ["d","그래서 더 싫어."]
        ],{
          emotion:{default:["guarded",60]},
          delta:{COLD:-2,DISTANT:-1},
          fxBy:{
            COLD:[raw("luc_t65_tension","add",1),raw("luc_t65_push","add",1)],
            DISTANT:[raw("luc_t65_push","add",1)]
          }
        }),
        ...S(e65id+"-c3-high",["NEUTRAL","WARM","CLOSE"],[
          ["d","너한테?"],
          ["n","한참 입을 열지 않는다.","reaction"],
          ["d","…미안해."],
          ["p","그다음은요?"],
          ["d","봐. 벌써 막혔잖아."],
          ["n","구겨진 메모를 다시 펴놓는다.","action"],
          ["d","종이가 더 쉽네."]
        ],{
          emotion:{default:["embarrassed",55]},
          delta:{WARM:1,CLOSE:2},
          commonFx:[raw("luc_t65_apology_practiced_with_player","set",true)]
        })
      ])
    ])
  ]);

  const e66id="solo-talk-lucifer-morningstar-06";
  const e66=eventBase(e66id,"천국의 깃털","66","high","heaven_memory",[
    N(e66id+"-intro-1","작은 상자 안에 희미한 빛깔의 깃털 하나가 놓여 있다.","intro","",{effects:[
      ...reset("66",e66id),
      {id:e66id+"-feather-seen",...V("luc_t66_feather_seen","set",true)}
    ]}),
    N(e66id+"-intro-2","루시퍼는 먼지를 털지도 않고 한동안 손끝만 가까이 댔다가 결국 조심스럽게 들어 올린다.","action"),
    N(e66id+"-intro-3","네가 다가오자 손안에 숨기지는 않지만 먼저 설명하지도 않는다.","reaction"),
    CH(e66id+"-root","어떻게 반응할까?",[
      O(e66id+"-c1","천국에서 가져온 건지 묻는다","sensitive",[
        P(e66id+"-c1-p","그거 천국에서 가져온 거예요?"),
        ...S(e66id+"-c1-low",["COLD","DISTANT"],[
          ["d","오래된 거야."],
          ["p","그건 대답이 아닌데요."],
          ["d","오늘은 그게 대답이야."]
        ],{
          emotion:{default:["guarded",60]},
          delta:{COLD:-1},
          fxBy:{
            COLD:[raw("luc_t66_tension","add",1),raw("luc_t66_push","add",1)],
            DISTANT:[raw("luc_t66_push","add",1)]
          }
        }),
        ...S(e66id+"-c1-high",["NEUTRAL","WARM","CLOSE"],[
          ["d","응."],
          ["n","깃털을 한번 뒤집어본다.","action"],
          ["d","아주 오래됐어."]
        ],{
          emotion:{default:["sad",30]},
          delta:{WARM:1,CLOSE:1},
          commonFx:[raw("luc_t66_heaven_origin_confirmed","set",true)]
        }),
        CH(e66id+"-c1-follow","조금 더 물어볼까?",[
          O(e66id+"-c1-a","왜 아직 가지고 있는지 묻는다","sensitive",[
            P(e66id+"-c1-a-p","그렇게 오래됐는데 왜 안 버렸어요?"),
            ...S(e66id+"-c1-a-low",["COLD","DISTANT"],[
              ["d","몰라."],
              ["d","안 버렸으니까 아직 있겠지."]
            ],{
              emotion:{default:["guarded",65]},
              delta:{COLD:-2,DISTANT:-1},
              fxBy:{
                COLD:[raw("luc_t66_tension","add",1),raw("luc_t66_push","add",1)],
                DISTANT:[raw("luc_t66_tension","add",1),raw("luc_t66_push","add",1)]
              }
            }),
            ...S(e66id+"-c1-a-high",["NEUTRAL","WARM","CLOSE"],[
              ["d","딱히 이유를 정해본 적은 없어."],
              ["n","잠깐 생각한다.","reaction"],
              ["d","버리고 싶을 때도 있었는데… 결국 안 버렸네."]
            ],{
              emotion:{default:["sad",45]},
              delta:{WARM:1,CLOSE:1},
              commonFx:[raw("luc_t66_kept_feather_reason_shared","set",true)]
            })
          ])
        ],{condition:VC("luc_t66_closed","==",false)})
      ]),
      O(e66id+"-c2","만져봐도 되는지 묻는다","sensitive",[
        P(e66id+"-c2-p","저도 만져봐도 돼요?"),
        N(e66id+"-c2-hand","루시퍼의 손가락이 아주 조금 오므라든다.","reaction"),
        ...S(e66id+"-c2-low",["COLD","DISTANT"],[
          ["d","안 돼."],
          ["n","잠시 후 덧붙인다.","transition"],
          ["d","오래돼서 그래."]
        ],{
          emotion:{default:["guarded",65]},
          commonFx:[raw("luc_t66_touch_refused","set",true)]
        }),
        ...S(e66id+"-c2-high",["NEUTRAL","WARM","CLOSE"],[
          ["d","음…"],
          ["n","한동안 고민하다 깃털을 내밀려다 멈춘다.","action"],
          ["d","오늘은 그냥 보기만 해."],
          ["p","알겠어요."],
          ["d","…고마워."]
        ],{
          emotion:{default:["anxious",35]},
          delta:{NEUTRAL:1,WARM:1,CLOSE:1},
          commonFx:[
            raw("luc_t66_touch_refused","set",true),
            raw("luc_t66_feather_boundary_respected","set",true)
          ]
        })
      ]),
      O(e66id+"-c3","천국이 그리운지 묻는다","sensitive",[
        P(e66id+"-c3-p","이거 보면 천국이 그립기도 해요?"),
        N(e66id+"-c3-pause","루시퍼가 웃지도 않고 바로 대답하지도 않는다.","reaction"),
        ...S(e66id+"-c3-low",["COLD","DISTANT"],[
          ["d","그런 질문 쉽게 하지 마."]
        ],{
          emotion:{default:["guarded",75]},
          delta:{COLD:-2,DISTANT:-1},
          fxBy:{
            COLD:[raw("luc_t66_tension","add",1),raw("luc_t66_push","add",1)],
            DISTANT:[raw("luc_t66_tension","add",1),raw("luc_t66_push","add",1)]
          }
        }),
        ...S(e66id+"-c3-high",["NEUTRAL","WARM","CLOSE"],[
          ["d","가끔 기억나는 거랑 돌아가고 싶은 건 다르잖아."],
          ["p","좋은 기억도 있긴 하죠?"],
          ["d","없진 않아."],
          ["n","깃털을 다시 상자에 내려놓는다.","action"],
          ["d","…그 정도면 됐지?"]
        ],{
          emotion:{default:["sad",50]},
          delta:{NEUTRAL:-1},
          commonFx:[raw("luc_t66_heaven_memory_acknowledged","set",true)]
        }),
        CH(e66id+"-c3-follow","여기서 어떻게 할까?",[
          O(e66id+"-c3-a","더 묻지 않는다","supportive",[
            P(e66id+"-c3-a-p","네. 더 안 물을게요."),
            N(e66id+"-c3-a-lid","루시퍼가 상자 뚜껑을 바로 닫지 않는다.","reaction"),
            ...S(e66id+"-c3-a-low",["COLD","DISTANT"],[
              ["d","좋아."]
            ],{
              emotion:{default:["calm",30]},
              delta:{COLD:2,DISTANT:2},
              commonFx:[
                raw("luc_t66_tension","subtract",1),
                raw("luc_t66_closed","set",true),
                raw("luc_t66_heaven_boundary_respected","set",true)
              ]
            }),
            ...S(e66id+"-c3-a-high",["NEUTRAL","WARM","CLOSE"],[
              ["d","응."],
              ["n","잠시 뒤 아주 작게 덧붙인다.","reaction"],
              ["d","나중엔 말할 수도 있고."]
            ],{
              emotion:{default:["calm",35]},
              delta:{NEUTRAL:1,WARM:1,CLOSE:2},
              commonFx:[
                raw("luc_t66_tension","subtract",1),
                raw("luc_t66_closed","set",true),
                raw("luc_t66_heaven_boundary_respected","set",true),
                raw("luc_t66_future_heaven_talk_possible","set",true)
              ]
            })
          ])
        ],{condition:VC("luc_t66_closed","==",false)})
      ])
    ])
  ]);

  const e67id="solo-talk-lucifer-morningstar-07";
  const e67=eventBase(e67id,"호텔 열쇠","67","medium","hotel_belonging",[
    N(e67id+"-intro-1","붉은 호텔 열쇠 하나가 작업대 한쪽에 놓여 있다.","intro","",{effects:[
      ...reset("67",e67id),
      {id:e67id+"-key-seen",...V("luc_t67_key_seen","set",true)}
    ]}),
    N(e67id+"-intro-2","루시퍼는 다른 물건을 치우면서도 그 열쇠만은 몇 번 피해 손을 움직인다.","action"),
    N(e67id+"-intro-3","네가 집어 들려 하자 손가락으로 먼저 눌러 고정한다.","reaction"),
    ...S(e67id+"-open-low",["COLD","DISTANT"],[
      ["d","그건 거기 둬."]
    ],{emotion:{default:["guarded",45]}}),
    ...S(e67id+"-open-high",["NEUTRAL","WARM","CLOSE"],[
      ["d","아, 그거 찰리가 준 거야."]
    ],{emotion:{default:["calm",30]},commonFx:[raw("luc_t67_charlie_key_revealed","set",true)]}),
    CH(e67id+"-root","어떤 이야기를 이어갈까?",[
      O(e67id+"-c1","왜 따로 두고 있는지 묻는다","neutral",[
        P(e67id+"-c1-p","왜 항상 여기 둬요?"),
        ...S(e67id+"-c1-low",["COLD","DISTANT"],[
          ["d","안 잃어버리려고."],
          ["d","찰리한테 잃어버렸다고 말하기 싫거든."]
        ],{
          emotion:{default:["calm",30]},
          commonFx:[raw("luc_t67_key_kept_safe","set",true)]
        }),
        ...S(e67id+"-c1-high",["NEUTRAL","WARM","CLOSE"],[
          ["d","여기 두면 적어도 어디 있는지는 알잖아."],
          ["p","자주 써요?"],
          ["d","가끔."],
          ["d","사실 문 열 방법 자체는 꼭 이게 없어도 되는데…"],
          ["n","열쇠를 한번 튕긴다.","action"],
          ["d","찰리가 준 거니까 갖고 다니는 거지."]
        ],{
          emotion:{default:["calm",35]},
          delta:{WARM:1,CLOSE:1},
          commonFx:[
            raw("luc_t67_key_kept_safe","set",true),
            raw("luc_t67_charlie_gift_matters","set",true)
          ]
        })
      ]),
      O(e67id+"-c2","호텔이 집처럼 느껴지냐고 묻는다","sensitive",[
        P(e67id+"-c2-p","이제 호텔도 좀 집 같아요?"),
        ...S(e67id+"-c2-low",["COLD","DISTANT"],[
          ["d","집?"],
          ["d","거기까진 가지 마."]
        ],{
          emotion:{default:["guarded",55]},
          delta:{COLD:-1},
          fxBy:{
            COLD:[raw("luc_t67_tension","add",1),raw("luc_t67_push","add",1)],
            DISTANT:[raw("luc_t67_push","add",1)]
          }
        }),
        ...S(e67id+"-c2-high",["NEUTRAL","WARM","CLOSE"],[
          ["d","음…"],
          ["n","한동안 대답을 고른다.","reaction"],
          ["d","‘집’은 좀 큰 말이고."],
          ["d","자주 가도 이상하지 않은 곳 정도?"],
          ["p","찰리가 있으니까요?"],
          ["d","그게 제일 크지."]
        ],{
          emotion:{default:["embarrassed",35]},
          delta:{WARM:1,CLOSE:1},
          commonFx:[raw("luc_t67_hotel_belonging_discussed","set",true)]
        }),
        CH(e67id+"-c2-follow","한 번 더 물어볼까?",[
          O(e67id+"-c2-a","열쇠가 없어도 갈 거냐고 묻는다","supportive",[
            P(e67id+"-c2-a-p","이 열쇠 없어도 계속 갈 거죠?"),
            ...S(e67id+"-c2-a-low",["COLD","DISTANT"],[
              ["d","찰리가 있으니까."]
            ],{
              emotion:{default:["calm",30]},
              commonFx:[raw("luc_t67_key_not_required","set",true)]
            }),
            ...S(e67id+"-c2-a-high",["NEUTRAL","WARM","CLOSE"],[
              ["d","당연하지."],
              ["n","열쇠를 손바닥 안으로 굴린다.","action"],
              ["d","이건 입장권은 아니잖아."]
            ],{
              emotion:{default:["joy",30]},
              delta:{WARM:1,CLOSE:1},
              commonFx:[raw("luc_t67_key_not_required","set",true)]
            })
          ])
        ],{condition:VC("luc_t67_closed","==",false)})
      ]),
      O(e67id+"-c3","잃어버리면 어떻게 할지 묻는다","light",[
        P(e67id+"-c3-p","진짜 잃어버리면요?"),
        ...S(e67id+"-c3-low",["COLD","DISTANT"],[
          ["d","안 잃어버려."],
          ["p","만약에요."],
          ["d","하나 새로 만들지."],
          ["n","잠깐 멈춘다.","reaction"],
          ["d","찰리한텐 말 안 하고."]
        ],{
          emotion:{default:["guarded",25]},
          commonFx:[raw("luc_t67_loss_plan_shared","set",true)]
        }),
        ...S(e67id+"-c3-high",["NEUTRAL","WARM","CLOSE"],[
          ["d","일단 새로 만들고."],
          ["d","그리고 최대한 자연스럽게 원래부터 그 열쇠였던 것처럼—"],
          ["p","찰리가 바로 알 것 같은데요."],
          ["d","…알겠지."],
          ["n","루시퍼가 열쇠를 조금 더 안전한 곳으로 옮겨놓는다.","action"],
          ["d","그러니까 안 잃어버릴 거야."]
        ],{
          emotion:{default:["joy",30]},
          delta:{WARM:1,CLOSE:1},
          commonFx:[
            raw("luc_t67_loss_plan_shared","set",true),
            raw("luc_t67_key_moved_safer","set",true)
          ]
        })
      ])
    ])
  ]);

  const variables=[];
  for(let n=65;n<=67;n++){
    const s=String(n);
    variables.push(
      {id:"luc_t"+s+"_tension",name:"루시퍼 TALK "+s+" · 긴장도",type:"number",defaultValue:"0",minValue:0,maxValue:3},
      {id:"luc_t"+s+"_push",name:"루시퍼 TALK "+s+" · 압박 횟수",type:"number",defaultValue:"0",minValue:0,maxValue:3},
      {id:"luc_t"+s+"_closed",name:"루시퍼 TALK "+s+" · 주제 종료",type:"boolean",defaultValue:"false"},
      {id:"luc_flag_t"+s+"_seen",name:"루시퍼 TALK "+s+" 확인",type:"boolean",defaultValue:"false"}
    );
  }
  [
    ["luc_t65_apology_practice_seen","65 · 사과 연습 메모 확인"],
    ["luc_t65_charlie_target_revealed","65 · 사과 대상이 찰리임을 확인"],
    ["luc_t65_fear_of_ruining_apology","65 · 사과를 망칠까 두려워함"],
    ["luc_t65_review_offer_considered","65 · 메모 검수 제안"],
    ["luc_t65_avoid_another_fight","65 · 다시 싸우기 싫다는 속내"],
    ["luc_t65_apology_practiced_with_player","65 · 플레이어 앞에서 사과 연습"],
    ["luc_t66_feather_seen","66 · 천국의 깃털 확인"],
    ["luc_t66_heaven_origin_confirmed","66 · 천국에서 온 깃털 확인"],
    ["luc_t66_kept_feather_reason_shared","66 · 깃털을 버리지 못한 이유 공유"],
    ["luc_t66_touch_refused","66 · 깃털 접촉 거절"],
    ["luc_t66_feather_boundary_respected","66 · 깃털 경계 존중"],
    ["luc_t66_heaven_memory_acknowledged","66 · 천국의 좋은 기억 인정"],
    ["luc_t66_heaven_boundary_respected","66 · 천국 질문 경계 존중"],
    ["luc_t66_future_heaven_talk_possible","66 · 나중에 천국 이야기를 할 가능성"],
    ["luc_t67_key_seen","67 · 호텔 열쇠 확인"],
    ["luc_t67_charlie_key_revealed","67 · 찰리가 준 열쇠임을 확인"],
    ["luc_t67_key_kept_safe","67 · 호텔 열쇠를 따로 보관"],
    ["luc_t67_charlie_gift_matters","67 · 찰리가 준 물건이라 소중함"],
    ["luc_t67_hotel_belonging_discussed","67 · 호텔 소속감 이야기"],
    ["luc_t67_key_not_required","67 · 열쇠 없이도 호텔에 감"],
    ["luc_t67_loss_plan_shared","67 · 열쇠 분실 시 대처 계획"],
    ["luc_t67_key_moved_safer","67 · 열쇠를 더 안전한 곳으로 옮김"]
  ].forEach(([id,name])=>variables.push({id,name,type:"boolean",defaultValue:"false"}));

  const variableMap=new Map((pack.variables||[]).map(v=>[v.id,v]));
  for(const v of variables)variableMap.set(v.id,v);
  pack.variables=[...variableMap.values()];

  const first64=(pack.events||[]).slice(0,64);
  const restMap=new Map((pack.events||[]).slice(64).map(event=>[event.id,event]));
  const overrideMap=new Map([[e65.id,e65],[e66.id,e66],[e67.id,e67]]);
  const order=[
    "solo-talk-lucifer-morningstar-05",
    "solo-talk-lucifer-morningstar-06",
    "solo-talk-lucifer-morningstar-07",
    "topic-talk-lucifer-morningstar-01",
    "topic-talk-lucifer-morningstar-02",
    "banter-lucifer-morningstar-01"
  ];
  const ordered=[];
  for(const id of order){
    const event=overrideMap.get(id)||restMap.get(id);
    if(event)ordered.push(event);
  }
  for(const event of (pack.events||[]).slice(64)){
    if(!order.includes(event.id))ordered.push(event);
  }
  pack.events=[...first64,...ordered];
  pack.version=58;
})();
