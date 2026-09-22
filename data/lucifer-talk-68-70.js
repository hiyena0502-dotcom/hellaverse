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

  const e68id="topic-talk-lucifer-morningstar-01";
  const e68=eventBase(e68id,"왕실 업무 회피","68","medium","royal_work_avoidance",[
    N(e68id+"-intro-1","결재 서류가 책상 한쪽에 제법 높게 쌓여 있다.","intro","",{effects:[
      ...reset("68",e68id),
      {id:e68id+"-paperwork-seen",...V("luc_t68_paperwork_seen","set",true)},
      {id:e68id+"-avoidance",...V("luc_work_avoidance","add",1)}
    ]}),
    N(e68id+"-intro-2","루시퍼는 맨 위 서류 위에 작은 고무오리를 세워놓고 각도를 조정하는 데 몹시 집중하고 있다.","action"),
    P(e68id+"-open-p1","일은 안 하세요?"),
    ...S(e68id+"-open-low",["COLD","DISTANT"],[
      ["d","하고 있지."],
      ["p","뭘요?"],
      ["d","서류를 안 보는 일."],
      ["d","아주 성공적이야."]
    ],{emotion:{default:["calm",30]}}),
    ...S(e68id+"-open-high",["NEUTRAL","WARM","CLOSE"],[
      ["d","지금 저 오리가 서류를 지키고 있잖아."],
      ["p","처리하는 건 아니고요?"],
      ["d","그건 다른 업무지."]
    ],{emotion:{default:["joy",30]}}),
    CH(e68id+"-root","어떻게 반응할까?",[
      O(e68id+"-c1","밀린 서류를 가리킨다","neutral",[
        P(e68id+"-c1-p","저거 전부 오늘 해야 하는 거 아니에요?"),
        ...S(e68id+"-c1-low",["COLD","DISTANT"],[
          ["d","아니."],
          ["p","확실해요?"],
          ["d","확인 안 했으니까 아직 아니야."]
        ],{
          emotion:{default:["guarded",25]},
          commonFx:[raw("luc_t68_deadline_avoided","set",true)]
        }),
        ...S(e68id+"-c1-high",["NEUTRAL","WARM","CLOSE"],[
          ["d","몇 개는 오늘일 수도 있고."],
          ["n","잠시 서류를 쳐다본다.","reaction"],
          ["d","…확인하면 정말 오늘 일이 되니까 조금 있다 볼래."]
        ],{
          emotion:{default:["embarrassed",25]},
          commonFx:[raw("luc_t68_deadline_avoided","set",true)]
        }),
        CH(e68id+"-c1-follow","그럼 어떻게 할까?",[
          O(e68id+"-c1-a","중요한 것만 먼저 보라고 한다","supportive",[
            P(e68id+"-c1-a-p","그럼 중요한 것만 골라봐요."),
            ...S(e68id+"-c1-a-low",["COLD","DISTANT"],[
              ["d","누가?"],
              ["n","플레이어가 쳐다본다.","reaction"],
              ["d","나 말고."]
            ],{
              emotion:{default:["guarded",25]},
              fxBy:{
                COLD:[raw("luc_t68_push","add",1)],
                DISTANT:[raw("luc_t68_push","add",1)]
              }
            }),
            ...S(e68id+"-c1-a-high",["NEUTRAL","WARM","CLOSE"],[
              ["d","제목만 읽어줘."],
              ["p","제가요?"],
              ["d","응. 진짜 급해 보이는 단어 나오면 그때 볼게."]
            ],{
              emotion:{default:["joy",25]},
              delta:{WARM:1,CLOSE:1},
              commonFx:[raw("luc_t68_important_only_plan","set",true)]
            })
          ])
        ],{condition:VC("luc_t68_closed","==",false)})
      ]),
      O(e68id+"-c2","찰리가 보면 뭐라고 할지 묻는다","light",[
        P(e68id+"-c2-p","찰리가 이거 보면 뭐라고 할까요?"),
        N(e68id+"-c2-stop","루시퍼가 오리를 만지던 손을 멈춘다.","reaction"),
        ...S(e68id+"-c2-low",["COLD","DISTANT"],[
          ["d","왜 굳이 찰리를 끌어와."]
        ],{
          emotion:{default:["guarded",40]},
          delta:{COLD:-1},
          fxBy:{COLD:[raw("luc_t68_tension","add",1)]}
        }),
        ...S(e68id+"-c2-high",["NEUTRAL","WARM","CLOSE"],[
          ["d","아."],
          ["n","서류 쪽을 한번 본다.","action"],
          ["d","…한숨 쉬겠네."],
          ["p","그게 끝이에요?"],
          ["d","그리고 “아빠, 이건 언제까지 미룬 거예요?” 하겠지."],
          ["n","찰리의 목소리를 흉내 낸 뒤 표정이 미묘해진다.","reaction"],
          ["d","오늘 두 개만 할까."],
          ["p","효과 좋은데요."],
          ["d","이 방법 자주 쓰지 마."]
        ],{
          emotion:{default:["embarrassed",35]},
          delta:{WARM:1,CLOSE:1},
          commonFx:[
            raw("luc_t68_charlie_prompt_effective","set",true),
            raw("luc_t68_two_documents_promised","set",true)
          ]
        })
      ]),
      O(e68id+"-c3","고무오리를 치우려고 한다","confrontational",[
        P(e68id+"-c3-p","일단 방해물부터 치울게요."),
        N(e68id+"-c3-grab","루시퍼가 오리를 즉시 집어 든다.","reaction"),
        ...S(e68id+"-c3-low",["COLD","DISTANT"],[
          ["d","방해물 아니야."],
          ["d","감독관이야."]
        ],{
          emotion:{default:["guarded",55]},
          delta:{COLD:-2,DISTANT:-1},
          fxBy:{
            COLD:[raw("luc_t68_tension","add",1),raw("luc_t68_push","add",1)],
            DISTANT:[raw("luc_t68_push","add",1)]
          },
          commonFx:[raw("luc_t68_duck_supervisor","set",true)]
        }),
        ...S(e68id+"-c3-high",["NEUTRAL","WARM","CLOSE"],[
          ["d","안 돼, 얘가 없으면 업무 효율이 더 떨어져."],
          ["p","지금보다요?"],
          ["d","…이론상 가능해."],
          ["n","고무오리를 서류 옆으로 옮긴다.","action"],
          ["d","좋아. 하나만 보자."],
          ["n","서류를 한 장 집었다가 두 번째 장까지 딸려 올라오자 다시 내려놓는다.","action"],
          ["d","하나라고 했잖아."]
        ],{
          emotion:{default:["joy",30]},
          delta:{WARM:1,CLOSE:1},
          commonFx:[
            raw("luc_t68_duck_supervisor","set",true),
            raw("luc_t68_one_document_started","set",true)
          ]
        })
      ])
    ])
  ]);

  const e69id="topic-talk-lucifer-morningstar-02";
  const e69=eventBase(e69id,"천국 이야기","69","high","heaven_story",[
    N(e69id+"-intro-1","루시퍼가 오래된 깃털 하나를 손끝 사이에서 천천히 굴리고 있다.","intro","",{effects:[
      ...reset("69",e69id),
      {id:e69id+"-feather-seen",...V("luc_t69_feather_seen","set",true)}
    ]}),
    N(e69id+"-intro-2","네가 들어온 걸 알아차렸지만 이번에는 숨기지 않는다.","reaction"),
    N(e69id+"-intro-3","다만 먼저 무슨 물건인지 설명하지도 않는다.","situation"),
    CH(e69id+"-root","어떻게 말을 걸까?",[
      O(e69id+"-c1","천국에서 가져온 건지 묻는다","sensitive",[
        P(e69id+"-c1-p","그거 천국에서 가져온 거예요?"),
        ...S(e69id+"-c1-low",["COLD","DISTANT"],[
          ["d","응."],
          ["n","짧은 대답 뒤로 말이 이어지지 않는다.","reaction"]
        ],{emotion:{default:["guarded",45]}}),
        ...S(e69id+"-c1-high",["NEUTRAL","WARM","CLOSE"],[
          ["d","응. 오래된 거야."],
          ["p","얼마나요?"],
          ["d","굳이 세면 기분 나쁠 만큼."]
        ],{
          emotion:{default:["calm",30]},
          commonFx:[raw("luc_t69_heaven_origin_confirmed","set",true)]
        }),
        CH(e69id+"-c1-follow","천국 이야기를 더 물어볼까?",[
          O(e69id+"-c1-a","천국 이야기를 조금 더 물어본다","sensitive",[
            P(e69id+"-c1-a-p","그때 천국은 어땠어요?"),
            ...S(e69id+"-c1-a-low",["COLD","DISTANT"],[
              ["d","너무 큰 질문이야."],
              ["d","다른 거 물어봐."]
            ],{
              emotion:{default:["guarded",70]},
              delta:{COLD:-2,DISTANT:-1},
              commonFx:[raw("luc_t69_closed","set",true)],
              fxBy:{
                COLD:[raw("luc_t69_tension","add",1),raw("luc_t69_push","add",1)],
                DISTANT:[raw("luc_t69_tension","add",1),raw("luc_t69_push","add",1)]
              }
            }),
            ...S(e69id+"-c1-a-high",["NEUTRAL","WARM","CLOSE"],[
              ["d","…한두 마디로 말하기 어려워."],
              ["p","좋았어요?"],
              ["d","좋았던 것도 있었지."],
              ["n","깃털을 내려놓는다.","action"],
              ["d","여기까지만."]
            ],{
              emotion:{default:["sad",45]},
              delta:{WARM:1,CLOSE:1},
              commonFx:[
                raw("luc_t69_good_heaven_memory_acknowledged","set",true),
                raw("luc_t69_closed","set",true)
              ]
            })
          ])
        ],{condition:VC("luc_t69_closed","==",false)})
      ]),
      O(e69id+"-c2","천국이 싫기만 한 건 아니냐고 묻는다","sensitive",[
        P(e69id+"-c2-p","천국 얘기만 나오면 피하잖아요. 싫기만 한 곳은 아니죠?"),
        ...S(e69id+"-c2-low",["COLD","DISTANT"],[
          ["d","피하는 데는 이유가 있겠지."],
          ["d","그걸 지금 설명해야 하는 건 아니고."]
        ],{
          emotion:{default:["guarded",75]},
          delta:{COLD:-2,DISTANT:-1},
          fxBy:{
            COLD:[raw("luc_t69_tension","add",1),raw("luc_t69_push","add",1)],
            DISTANT:[raw("luc_t69_tension","add",1),raw("luc_t69_push","add",1)]
          }
        }),
        ...S(e69id+"-c2-high",["NEUTRAL","WARM","CLOSE"],[
          ["d","전부 싫었다고 한 적은 없어."],
          ["n","잠시 손가락으로 깃털 끝을 정돈한다.","action"],
          ["d","좋았던 게 있으니까 더 얘기하기 싫은 것도 있겠지."],
          ["n","말하고 나서 스스로 조금 놀란 듯 입을 다문다.","reaction"],
          ["d","…다음 질문."]
        ],{
          emotion:{default:["sad",55]},
          delta:{WARM:1,CLOSE:1},
          commonFx:[
            raw("luc_t69_mixed_heaven_feelings_shared","set",true),
            raw("luc_t69_closed","set",true)
          ]
        })
      ]),
      O(e69id+"-c3","에밀리가 물어보면 대답할지 묻는다","neutral",[
        P(e69id+"-c3-p","에밀리가 옛날 천국 이야기 물어보면요?"),
        ...S(e69id+"-c3-low",["COLD","DISTANT"],[
          ["d","그 애는 질문이 너무 많아."]
        ],{
          emotion:{default:["calm",30]},
          commonFx:[raw("luc_t69_emily_questions","set",true)]
        }),
        ...S(e69id+"-c3-high-a",["NEUTRAL","WARM","CLOSE"],[
          ["d","아, 분명 물어보겠네."],
          ["d","하나 답하면 세 개 더 나올 것 같은데."]
        ],{
          emotion:{default:["joy",25]},
          commonFx:[raw("luc_t69_emily_questions","set",true)]
        }),
        P(e69id+"-c3-p2","그래도 대답해줄 거예요?"),
        ...S(e69id+"-c3-low-b",["COLD","DISTANT"],[
          ["d","아는 거고 말하고 싶은 거면."]
        ],{emotion:{default:["calm",30]}}),
        ...S(e69id+"-c3-high-b",["NEUTRAL","WARM","CLOSE"],[
          ["d","조금은."]
        ],{emotion:{default:["calm",30]}}),
        P(e69id+"-c3-p3","저한테는요?"),
        N(e69id+"-c3-look","루시퍼가 너를 한번 본다.","reaction"),
        ...S(e69id+"-c3-low-c",["COLD","DISTANT"],[
          ["d","지금도 대답하고 있잖아."]
        ],{emotion:{default:["guarded",30]}}),
        ...S(e69id+"-c3-high-c",["NEUTRAL","WARM","CLOSE"],[
          ["d","…오늘은 이 정도면 많이 한 거야."]
        ],{
          emotion:{default:["embarrassed",30]},
          delta:{WARM:1,CLOSE:2},
          commonFx:[raw("luc_t69_player_heaven_trust","set",true)]
        })
      ])
    ])
  ]);

  const e70id="banter-lucifer-morningstar-01";
  const e70=eventBase(e70id,"찰리의 메모","70","medium","charlie_note",[
    N(e70id+"-intro-1","탁자 위에 찰리가 남긴 호텔 메모가 펼쳐져 있다.","intro","",{effects:[
      ...reset("70",e70id),
      {id:e70id+"-note-seen",...V("luc_t70_charlie_note_seen","set",true)}
    ]}),
    N(e70id+"-intro-2","루시퍼는 이미 다 읽은 듯한데 같은 줄을 다시 읽는다.","action"),
    N(e70id+"-intro-3","맨 아래에는 느낌표가 세 개 붙어 있다.","situation"),
    ...S(e70id+"-open-low",["COLD","DISTANT"],[
      ["d","느낌표 세 개."],
      ["d","아주 안 좋은 징조야."]
    ],{emotion:{default:["calm",30]}}),
    ...S(e70id+"-open-high",["NEUTRAL","WARM","CLOSE"],[
      ["d","하하. 이거 찰리 목소리로 읽히는데."],
      ["d","특히 이 세 번째 느낌표."]
    ],{emotion:{default:["joy",35]}}),
    CH(e70id+"-root","어떻게 반응할까?",[
      O(e70id+"-c1","찰리 글씨가 귀엽다고 한다","supportive",[
        P(e70id+"-c1-p","글씨는 귀엽네요."),
        ...S(e70id+"-c1-low",["COLD","DISTANT"],[
          ["d","그건 맞아."],
          ["n","메모를 한번 들어 보인다.","action"],
          ["d","내용은 안 귀여워. 회의 오라는 거잖아."]
        ],{emotion:{default:["calm",30]}}),
        ...S(e70id+"-c1-high",["NEUTRAL","WARM","CLOSE"],[
          ["d","그치?"],
          ["d","여기 글씨 커진 것 봐. 이 부분 말하면서 분명 손까지 움직였을걸."],
          ["p","엄청 자세히 보네요."],
          ["d","세 번째 읽는 중이니까."],
          ["p","왜 세 번이나 읽어요?"],
          ["d","…"],
          ["d","내용 확인."],
          ["p","다 외웠을 것 같은데요."],
          ["d","다음 질문."]
        ],{
          emotion:{default:["embarrassed",35]},
          delta:{WARM:1,CLOSE:1},
          commonFx:[raw("luc_t70_note_reread_three_times","set",true)]
        })
      ]),
      O(e70id+"-c2","회의에 갈 건지 묻는다","neutral",[
        P(e70id+"-c2-p","그래서 회의 갈 거예요?"),
        ...S(e70id+"-c2-low",["COLD","DISTANT"],[
          ["d","몇 시인데."],
          ["n","플레이어가 시간을 알려준다.","action"],
          ["d","아직 시간 있네."],
          ["p","그 말은 갈 거라는 뜻이에요?"],
          ["d","그렇게까지 말하진 않았어."]
        ],{
          emotion:{default:["guarded",25]},
          commonFx:[raw("luc_work_avoidance","add",1)]
        }),
        ...S(e70id+"-c2-high",["NEUTRAL","WARM","CLOSE"],[
          ["d","갈 거야."],
          ["p","의외로 바로 대답하네요."],
          ["d","찰리가 굳이 메모까지 남겼잖아."],
          ["n","잠깐 생각한다.","reaction"],
          ["d","…조금 늦을 수도 있고."]
        ],{
          emotion:{default:["calm",30]},
          delta:{WARM:1,CLOSE:1},
          commonFx:[raw("luc_t70_meeting_committed","set",true)]
        }),
        CH(e70id+"-c2-follow","회의에 가면?",[
          O(e70id+"-c2-a","회의에서 실제로 일할 거냐고 묻는다","light",[
            P(e70id+"-c2-a-p","가면 제대로 참여는 하고요?"),
            ...S(e70id+"-c2-a-low",["COLD","DISTANT"],[
              ["d","앉아는 있을게."],
              ["p","그게 참여예요?"],
              ["d","첫 단계지."]
            ],{
              emotion:{default:["calm",25]},
              commonFx:[raw("luc_work_avoidance","add",1)]
            }),
            ...S(e70id+"-c2-a-high",["NEUTRAL","WARM","CLOSE"],[
              ["d","찰리가 직접 물어보는 건 대답해줄 거고."],
              ["d","계획표 정리 담당 같은 건 기대하지 마."]
            ],{
              emotion:{default:["joy",25]},
              commonFx:[raw("luc_t70_meeting_participation_boundary","set",true)]
            })
          ])
        ],{condition:VC("luc_t70_closed","==",false)})
      ]),
      O(e70id+"-c3","메모 위에 오리 하나를 올려둔다","light",[
        N(e70id+"-c3-act","플레이어는 말없이 작은 고무오리 하나를 메모 위에 올려둔다.","action"),
        N(e70id+"-c3-look","루시퍼가 오리와 메모를 번갈아 본다.","reaction"),
        ...S(e70id+"-c3-low",["COLD","DISTANT"],[
          ["d","뭐야."],
          ["d","뇌물?"],
          ["p","회의 가라고요."],
          ["d","오리 하나로 왕을 움직이려고?"],
          ["n","잠깐 오리를 집어 든다.","action"],
          ["d","…전략이 너무 정직한데."]
        ],{
          emotion:{default:["curious",30]},
          delta:{DISTANT:1},
          commonFx:[
            raw("luc_t70_duck_bribe_used","set",true),
            raw("luc_duck_interest","add",1)
          ]
        }),
        ...S(e70id+"-c3-high",["NEUTRAL","WARM","CLOSE"],[
          ["d","하."],
          ["n","고무오리를 손바닥 위에서 한번 굴린다.","action"],
          ["d","찰리 메모 위에 오리 올려두면 내가 거절 못 할 줄 알았지?"],
          ["p","맞았어요?"],
          ["d","짜증 나게도."]
        ],{
          emotion:{default:["joy",40]},
          delta:{NEUTRAL:1,WARM:1,CLOSE:1},
          commonFx:[
            raw("luc_t70_duck_bribe_used","set",true),
            raw("luc_t70_meeting_committed","set",true),
            raw("luc_duck_interest","add",1)
          ]
        }),
        CH(e70id+"-c3-follow","한 번 더 장난칠까?",[
          O(e70id+"-c3-a","찰리가 직접 만든 오리라고 거짓말한다","light",[
            P(e70id+"-c3-a-p","찰리가 만든 거예요."),
            N(e70id+"-c3-a-look","루시퍼가 바로 고무오리를 다시 본다.","reaction"),
            ...S(e70id+"-c3-a-low",["COLD","DISTANT"],[
              ["d","진짜?"],
              ["n","플레이어가 웃는다.","reaction"],
              ["d","…거짓말이지."]
            ],{
              emotion:{default:["guarded",45]},
              delta:{COLD:-2,DISTANT:-1},
              fxBy:{COLD:[raw("luc_t70_tension","add",1)]},
              commonFx:[raw("luc_t70_duck_lie_told","set",true)]
            }),
            ...S(e70id+"-c3-a-high",["NEUTRAL","WARM","CLOSE"],[
              ["d","잠깐, 진짜로?"],
              ["p","아뇨."],
              ["n","몇 초 정적.","reaction"],
              ["d","너 오늘 운 좋은 줄 알아."]
            ],{
              emotion:{default:["joy",35]},
              delta:{NEUTRAL:-1},
              commonFx:[raw("luc_t70_duck_lie_told","set",true)]
            })
          ])
        ],{condition:VC("luc_t70_closed","==",false)})
      ]),
      O(e70id+"-c4","메모를 버리지 않는 이유를 묻는다","sensitive",[
        P(e70id+"-c4-p","회의 싫다면서 이 메모는 왜 안 버려요?"),
        ...S(e70id+"-c4-low",["COLD","DISTANT"],[
          ["d","아직 회의 안 끝났잖아."],
          ["p","끝나면요?"],
          ["d","그때 생각해."]
        ],{emotion:{default:["guarded",30]}}),
        ...S(e70id+"-c4-high",["NEUTRAL","WARM","CLOSE"],[
          ["d","음…"],
          ["n","메모 모서리를 반듯하게 펴놓는다.","action"],
          ["d","찰리가 직접 쓴 거니까."],
          ["p","그래서 보관하게요?"],
          ["d","그렇게 거창하게 말하지 마."],
          ["n","메모를 접어서 주머니에 넣는다.","action"],
          ["p","방금 보관했는데요."],
          ["d","회의 장소까지 가져가는 거야."],
          ["p","끝나고도 안 버릴 것 같은데."],
          ["n","루시퍼가 대답 없이 고무오리까지 챙긴다.","action"]
        ],{
          emotion:{default:["embarrassed",40]},
          delta:{WARM:1,CLOSE:2},
          commonFx:[
            raw("luc_t70_note_kept","set",true),
            raw("luc_t70_meeting_committed","set",true)
          ]
        }),
        ...S(e70id+"-c4-close-low",["COLD","DISTANT"],[
          ["d","늦겠다. 가자."]
        ],{
          emotion:{default:["calm",30]},
          commonFx:[raw("luc_t70_meeting_committed","set",true)]
        }),
        ...S(e70id+"-c4-close-high",["NEUTRAL","WARM","CLOSE"],[
          ["d","찰리 기다리겠다."]
        ],{
          emotion:{default:["calm",35]},
          commonFx:[raw("luc_t70_meeting_committed","set",true)]
        })
      ])
    ])
  ]);

  const variables=[];
  for(let n=68;n<=70;n++){
    const s=String(n);
    variables.push(
      {id:"luc_t"+s+"_tension",name:"루시퍼 TALK "+s+" · 긴장도",type:"number",defaultValue:"0",minValue:0,maxValue:3},
      {id:"luc_t"+s+"_push",name:"루시퍼 TALK "+s+" · 압박 횟수",type:"number",defaultValue:"0",minValue:0,maxValue:3},
      {id:"luc_t"+s+"_closed",name:"루시퍼 TALK "+s+" · 주제 종료",type:"boolean",defaultValue:"false"},
      {id:"luc_flag_t"+s+"_seen",name:"루시퍼 TALK "+s+" 확인",type:"boolean",defaultValue:"false"}
    );
  }
  [
    ["luc_t68_paperwork_seen","68 · 밀린 왕실 서류 확인"],
    ["luc_t68_deadline_avoided","68 · 서류 마감 확인 회피"],
    ["luc_t68_important_only_plan","68 · 중요한 서류만 우선 보기"],
    ["luc_t68_charlie_prompt_effective","68 · 찰리 언급이 업무에 효과"],
    ["luc_t68_two_documents_promised","68 · 서류 두 개 처리 약속"],
    ["luc_t68_duck_supervisor","68 · 고무오리 감독관"],
    ["luc_t68_one_document_started","68 · 서류 한 장 시작"],
    ["luc_t69_feather_seen","69 · 천국 깃털 확인"],
    ["luc_t69_heaven_origin_confirmed","69 · 천국에서 온 물건 확인"],
    ["luc_t69_good_heaven_memory_acknowledged","69 · 천국의 좋은 기억 인정"],
    ["luc_t69_mixed_heaven_feelings_shared","69 · 천국에 대한 복합 감정 공유"],
    ["luc_t69_emily_questions","69 · 에밀리의 천국 질문 예상"],
    ["luc_t69_player_heaven_trust","69 · 플레이어에게 천국 이야기를 꽤 함"],
    ["luc_t70_charlie_note_seen","70 · 찰리의 호텔 메모 확인"],
    ["luc_t70_note_reread_three_times","70 · 찰리 메모 세 번째 읽음"],
    ["luc_t70_meeting_committed","70 · 찰리 회의 참석 결정"],
    ["luc_t70_meeting_participation_boundary","70 · 회의 참여 범위 선 긋기"],
    ["luc_t70_duck_bribe_used","70 · 오리 뇌물 사용"],
    ["luc_t70_duck_lie_told","70 · 찰리가 만든 오리라는 거짓말"],
    ["luc_t70_note_kept","70 · 찰리 메모 보관"]
  ].forEach(([id,name])=>variables.push({id,name,type:"boolean",defaultValue:"false"}));

  const variableMap=new Map((pack.variables||[]).map(v=>[v.id,v]));
  for(const v of variables)variableMap.set(v.id,v);
  pack.variables=[...variableMap.values()];

  const first67=(pack.events||[]).slice(0,67);
  const restMap=new Map((pack.events||[]).slice(67).map(event=>[event.id,event]));
  const overrideMap=new Map([[e68.id,e68],[e69.id,e69],[e70.id,e70]]);
  const order=[
    "topic-talk-lucifer-morningstar-01",
    "topic-talk-lucifer-morningstar-02",
    "banter-lucifer-morningstar-01"
  ];
  const ordered=[];
  for(const id of order){
    const event=overrideMap.get(id)||restMap.get(id);
    if(event)ordered.push(event);
  }
  for(const event of (pack.events||[]).slice(67)){
    if(!order.includes(event.id))ordered.push(event);
  }
  pack.events=[...first67,...ordered];
  pack.version=59;
})();
