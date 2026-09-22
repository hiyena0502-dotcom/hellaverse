"use strict";

(()=>{
  const packs=Array.isArray(window.HV_STORY_PACKS)?window.HV_STORY_PACKS:[];
  const pack=packs.find(row=>row?.id==="pooltalk-52-lucifer-morningstar");
  if(!pack)return;

  const C="lucifer-morningstar";
  const NAME="Lucifer Morningstar";
  const BANDS=["COLD","DISTANT","NEUTRAL","WARM","CLOSE"];
  const AC=band=>({characterId:C,band,operator:">=",value:0});
  const FX=(id,variableId,operation,value)=>({id,variableId,operation,value:String(value)});
  const AF=(id,amount)=>amount?{id,characterId:C,amount,silent:true}:null;
  const D=(id,text,band="",extra={})=>({id,type:"dialogue",speaker:NAME,speakerCharacterId:C,text,...(band?{affectionCondition:AC(band)}:{}),...extra});
  const P=(id,text)=>({id,type:"dialogue",speaker:"PLAYER",speakerCharacterId:"",text});
  const N=(id,text,role="situation",extra={})=>({id,type:"narration",text,narrationRole:role,...extra});
  const CH=(id,prompt,options,extra={})=>({id,type:"choice",prompt,options,...extra});
  const O=(id,label,tone,entries,extra={})=>({id,label,tone,entries,condition:null,effects:[],itemEffects:[],itemCondition:null,askCondition:null,affectionCondition:null,affectionEffects:[],emotionCondition:null,emotionEffects:[],exitMode:"continue",targetEventId:"",...extra});
  const add=(id,variableId,value=1)=>FX(id,variableId,"add",value);
  const set=(id,variableId,value=true)=>FX(id,variableId,"set",value);
  const reset=(topic,id)=>[
    set(id+"-seen","luc_flag_t"+topic+"_seen",true),
    set(id+"-tension","luc_t"+topic+"_tension",0),
    set(id+"-push","luc_t"+topic+"_push",0),
    set(id+"-closed","luc_t"+topic+"_closed",false)
  ];
  const BR=(id,map)=>BANDS.flatMap(band=>{
    const raw=map[band]??map.default;
    if(!raw)return[];
    const spec=typeof raw==="string"||Array.isArray(raw)?{lines:raw}:raw;
    const lines=Array.isArray(spec.lines)?spec.lines:[spec.lines];
    return lines.filter(Boolean).map((text,index)=>{
      const aff=index===0?AF(id+"-aff-"+band.toLowerCase(),Number(spec.delta)||0):null;
      return D(id+"-"+band.toLowerCase()+"-"+(index+1),text,band,{
        ...(index===0&&spec.effects?.length?{effects:spec.effects}:{}),
        ...(aff?{affectionEffects:[aff]}:{})
      });
    });
  });
  const EV=(id,title,startMode,sensitivity,entries,extra={})=>({
    id,name:"TALK · Lucifer Morningstar · "+title,characterId:C,eventRole:"talk",menuVisible:true,
    randomEligible:true,startMode,sensitivity,continuationEventIds:[],emotionExitMode:"keep",...extra,entries
  });
  const replace=(title,builder)=>{
    const index=pack.events.findIndex(row=>row?.name==="TALK · Lucifer Morningstar · "+title);
    if(index<0)return;
    pack.events[index]=builder(pack.events[index].id);
  };

  replace("호텔 멤버 중 노래방에서 가장 시끄러운 사람",id=>EV(id,"호텔 멤버 중 노래방에서 가장 시끄러운 사람","PLAYER_ASK","light",[
    N(id+"-intro","노래방 할인 전단이 로비 테이블 위에 펼쳐져 있다.","intro",{effects:reset("13",id)}),
    P(id+"-player","여기 사람들 노래방 가면 누가 제일 시끄러울 것 같아요?"),
    ...BR(id+"-open",{
      COLD:"그 긴 거미. 고민할 것도 없잖아.",
      DISTANT:"거미가 제일 시끄럽겠지. 노래보다 멘트가 더 길 것 같고.",
      NEUTRAL:"긴 거미가 무대를 잡고, 조그만 청소광은 곡을 열 개 연속 예약하겠네.",
      WARM:["거미가 공연을 시작하고, 작은 애가 탬버린을 들고 뛰고, 찰리는 갑자기 단체 합창을 제안하겠지.","노래방이 아니라 재난 합동 공연이 되겠는데?"],
      CLOSE:["제일 시끄러운 건 거미겠지만 끝까지 남는 건 찰리일걸.","다 같이 한 곡만 더 부르자고 웃으면 아무도 먼저 못 나가니까."]
    }),
    CH(id+"-choice","어떤 이야기를 이어갈까?",[
      O(id+"-loudest","누가 마이크를 가장 오래 잡을지도 묻는다","light",[
        P(id+"-loudest-player","그럼 마이크를 제일 오래 안 놓는 사람은요?"),
        ...BR(id+"-loudest-r",{COLD:"거미. 다음 질문.",DISTANT:"긴 거미가 멘트까지 곡으로 칠걸.",NEUTRAL:"거미가 잡고, 니프티가 빼앗고, 찰리가 두 번째 마이크를 가져오겠지.",WARM:"거미가 앙코르를 외치기 전에 작은 애가 예약 목록을 끝까지 채워놓을 거야.",CLOSE:"결국 찰리가 모두에게 한 소절씩 나눠주겠지. 그럼 마이크는 안 놓아도 싸움은 안 날 테고."}),
        CH(id+"-loudest-follow","누구를 더 짚어볼까?",[
          O(id+"-alastor","알래스터도 노래할지 묻는다","light",[
            P(id+"-alastor-player","알래스터는요?"),
            ...BR(id+"-alastor-r",{default:{lines:"라디오 사슴은 마이크보다 자기 지팡이를 들고 분위기부터 장악하려 들겠지.",effects:[add(id+"-alastor-irritation","luc_alastor_irritation",1)]},WARM:{lines:"빨간 사슴은 낡은 노래 하나 불러놓고 자기가 밤을 구했다고 생각할걸.",effects:[add(id+"-alastor-irritation-warm","luc_alastor_irritation",1)]},CLOSE:{lines:"사슴 대가리는 마이크 없이도 방 전체에 목소리를 깔 수 있잖아. 아주 유감스럽게도.",effects:[add(id+"-alastor-irritation-close","luc_alastor_irritation",1)]}})
          ]),
          O(id+"-mediate","루시퍼가 마이크를 중재하라고 한다","confrontational",[
            P(id+"-mediate-player","그럼 루시퍼가 순서를 정하면 되겠네요."),
            ...BR(id+"-mediate-r",{COLD:{lines:"내가 왜 노래방 진행요원이야?",delta:-1,effects:[add(id+"-mediate-work-cold","luc_work_avoidance",1)]},DISTANT:{lines:"싫어. 마이크는 힘센 사람이 아니라 먼저 잡은 사람이 쓰는 거야.",effects:[add(id+"-mediate-work-dist","luc_work_avoidance",1)]},NEUTRAL:{lines:"순서표까지 만들 생각은 없어. 마이크 하나를 더 사.",effects:[add(id+"-mediate-work-neutral","luc_work_avoidance",1)]},WARM:{lines:"왕에게 마이크 당번표를 맡기겠다고? 훌륭한 권력 낭비네.",effects:[add(id+"-mediate-work-warm","luc_work_avoidance",1)]},CLOSE:{lines:"내가 맡으면 첫 순서를 찰리에게 주고 바로 사라질 거야. 공정하지 않지?",effects:[add(id+"-mediate-work-close","luc_work_avoidance",1)]}})
          ])
        ])
      ]),
      O(id+"-sing","루시퍼도 노래할 건지 묻는다","light",[
        P(id+"-sing-player","루시퍼도 부를 거예요?"),
        ...BR(id+"-sing-r",{COLD:"내가 왜? …찰리가 같이 부르자면 한 곡 정도는 모르지만.",DISTANT:"굳이 마이크를 잡을 필요가 있나? 목소리는 충분히 크거든.",NEUTRAL:"분위기가 너무 처참하면 한 곡쯤 구해줄 수는 있지.",WARM:"하! 내가 부르면 적어도 음정 때문에 사고가 나진 않아. 다른 이유는 몰라도.",CLOSE:"찰리가 듀엣을 고르면 부르지. 그 애가 좋아하는 곡은 아직 몇 개 기억하니까."}),
        CH(id+"-sing-follow","어떻게 받아칠까?",[
          O(id+"-tease","제일 시끄러운 사람이 루시퍼 아니냐고 놀린다","light",[
            P(id+"-tease-player","사실 제일 시끄러운 사람은 루시퍼 아니에요?"),
            ...BR(id+"-tease-r",{COLD:{lines:"그 정도로 친한 척할 사이는 아니지 않나?",delta:-1},DISTANT:"목소리가 좋은 거랑 시끄러운 건 다르거든.",NEUTRAL:"그건 성량이야. 아주 고급스러운 차이지.",WARM:{lines:"들켰네! 그래도 내가 제일 듣기 좋은 소음일걸?",delta:1},CLOSE:{lines:"맞아. 대신 네가 앙코르를 외치면 책임져.",delta:1}})
          ]),
          O(id+"-duet","찰리와 듀엣을 권한다","supportive",[
            P(id+"-duet-player","찰리랑 듀엣하면 되겠네요."),
            ...BR(id+"-duet-r",{COLD:"찰리가 원하면.",DISTANT:"걔가 고른 곡이라면 한 곡은 하지.",NEUTRAL:"찰리는 분명 연습 일정부터 잡겠네. 노래 한 곡인데.",WARM:{lines:"그건 괜찮겠는데? 찰리가 먼저 고르게 해야지.",delta:1,effects:[set(id+"-duet-soft","luc_charlie_soft",true)]},CLOSE:{lines:["응. 그건 하고 싶네.","찰리가 어릴 때 같이 부르던 곡도 아직 기억해."],delta:1,effects:[set(id+"-duet-soft-close","luc_charlie_soft",true)]}})
          ])
        ])
      ]),
      O(id+"-fun","시끄러워도 재미있으면 된다고 한다","supportive",[
        P(id+"-fun-player","시끄러워도 재미있으면 됐죠."),
        ...BR(id+"-fun-r",{COLD:"그건 맞아. 조용할 거라 기대한 사람도 없을 테고.",DISTANT:"노래방에서 조용할 필요는 없지.",NEUTRAL:"그래. 카메라와 유리잔만 멀쩡하면 성공이야.",WARM:{lines:"정답! 노래보다 웃는 소리가 더 크면 그걸로 된 거지.",delta:1},CLOSE:{lines:"맞아. 찰리가 즐거우면 몇 시간쯤 시끄러운 건 견딜 수 있어.",delta:1}}),
        CH(id+"-sins-follow","칠죄종까지 함께 간다면?",[
          O(id+"-sins","칠죄종도 데려가자고 한다","light",[
            P(id+"-sins-player","칠죄종까지 같이 가면요?"),
            ...BR(id+"-sins-r",{default:"비는 파티로 만들고, 오지는 무대 조명부터 바꾸고, 사탄은 점수로 싸우겠지.",WARM:"비는 방을 통째로 빌리고, 오지는 공연장으로 만들고, 마몬은 입장권을 팔 거야. 사탄은 최고 점수가 자기 거라고 우기고.",CLOSE:"그 조합이면 노래방 건물부터 남아 있길 빌어야 해. …그래도 꽤 재밌겠네."})
          ])
        ])
      ])
    ])
  ]));

  replace("지옥 주민이 천국을 관광할 수 있는 날이 올까",id=>EV(id,"지옥 주민이 천국을 관광할 수 있는 날이 올까","PLAYER_ASK","high",[
    N(id+"-intro","‘천국 일일 관광’이라고 적힌 장난 전단이 호텔 게시판에 붙어 있다.","intro",{effects:reset("14",id)}),
    P(id+"-player","언젠가 지옥 주민도 천국 관광 같은 걸 갈 수 있을까요?"),
    ...BR(id+"-open",{COLD:"관광? 지금은 문 앞에서 바로 돌려보낼걸.",DISTANT:"마음대로 드나드는 곳은 아니야. 특히 지옥 쪽에서 올라가면.",NEUTRAL:"지금은 허가도 통제도 필요하겠지. 관광이라고 부를 단계는 아니고.",WARM:"예전 같았으면 웃었을 텐데, 이제는 완전히 불가능하다고 하기도 어렵네.",CLOSE:"지금 당장은 아니야. 그래도 구원이 실제로 증명됐으니 문이 영원히 닫혀 있다고 단정할 순 없겠지."}),
    CH(id+"-choice","무엇을 물어볼까?",[
      O(id+"-guide","루시퍼가 직접 가이드하면 어떨지 농담한다","light",[
        P(id+"-guide-player","그럼 루시퍼가 직접 가이드하면 되겠네요."),
        ...BR(id+"-guide-r",{COLD:"몇 천 년 전에 쫓겨난 사람을 가이드로? 훌륭한 선택이네.",DISTANT:"내 지도는 몇 천 년 전 거야. 길 하나쯤 사라졌어도 책임 못 져.",NEUTRAL:"옛 천국 투어라면 가능하지. 현재와 다를 수 있다는 면책 조항부터 붙이고.",WARM:"하! ‘여긴 예전에 이랬습니다’만 반복하는 최악의 가이드가 되겠네.",CLOSE:"내가 기억하는 천국과 지금은 많이 다를 거야. 그래도 옛길 몇 군데는 기억하지."}),
        CH(id+"-guide-follow","조금 더 물어볼까?",[
          O(id+"-remember","기억나는 곳이 있는지 묻는다","sensitive",[
            P(id+"-remember-player","그래도 기억나는 곳은 있죠?"),
            ...BR(id+"-remember-r",{default:"있지. 기억까지 전부 지워진 건 아니니까.",WARM:"몇 군데는. 빛이 너무 밝지 않던 작업 공간 같은 곳.",CLOSE:"응. 생각을 만들고 형태를 붙이던 곳이 있었어. 장소보다 그때의 내가 더 선명하지만."})
          ]),
          O(id+"-return","다시 가는 건 싫은지 묻는다","sensitive",[
            P(id+"-return-player","다시 가는 건 싫어요?"),
            ...BR(id+"-return-r",{COLD:{lines:"그건 관광 안내 질문이 아니잖아.",delta:-1},DISTANT:"에밀리 같은 애한테 가이드를 부탁해. 그 질문은 여기까지고.",NEUTRAL:"좋고 싫고로 정리할 수 있는 곳은 아니야.",WARM:"가고 싶은 것과 다시 마주할 수 있는 건 다른 문제지.",CLOSE:{lines:"무섭지 않다고 하면 거짓말이야. 그래도 예전처럼 무조건 피하고 싶진 않아.",delta:1}})
          ])
        ])
      ]),
      O(id+"-rules","지금은 정말 자유롭게 못 가는지 묻는다","neutral",[
        P(id+"-rules-player","지금은 정말 자유롭게 오갈 수 없는 거예요?"),
        ...BR(id+"-rules-r",{default:"그래. 허가와 통제가 있어. 문이 있다고 누구나 드나드는 건 아니야.",WARM:"구원된 영혼과 방문객은 같은 문제가 아니야. 천국은 그 둘을 아주 꼼꼼하게 나눌걸.",CLOSE:"지금은 자유 왕래가 아니야. 누가 들어오는지, 왜 오는지, 언제 나가는지 전부 통제하려 들겠지."}),
        CH(id+"-rules-follow","한마디를 보탤까?",[
          O(id+"-heavenlike","천국답다고 냉소한다","light",[
            P(id+"-heavenlike-player","통제부터 하는 게 천국답네요."),
            ...BR(id+"-heavenlike-r",{default:"그 말엔 반박하기 어렵네.",WARM:"하. 질서라는 이름을 붙이면 뭐든 덜 불편해 보인다고 생각하거든.",CLOSE:"맞아. 다만 이번엔 바뀔 여지가 있는지도 지켜볼 생각이야."})
          ])
        ])
      ]),
      O(id+"-someday","그래도 언젠가는 가능할지 묻는다","supportive",[
        P(id+"-someday-player","그래도 언젠가는 가능할까요?"),
        ...BR(id+"-someday-r",{COLD:"예전 같았으면 바로 아니라고 했을 거야.",DISTANT:"불가능하다고 단정하긴 전보다 어려워졌지.",NEUTRAL:"구원이 증명됐으니 적어도 논의할 이유는 생겼어.",WARM:"가능할지도 몰라. 찰리가 그 말을 들으면 계획서를 백 장은 만들겠지만.",CLOSE:"언젠가는. 찰리는 분명 그날을 실제 일정처럼 준비하겠지."}),
        CH(id+"-someday-follow","누구를 떠올릴까?",[
          O(id+"-charlie-happy","찰리가 좋아할 것 같다고 한다","supportive",[
            P(id+"-charlie-happy-player","찰리가 정말 좋아하겠네요."),
            ...BR(id+"-charlie-happy-r",{default:{lines:"그건 확실하지.",delta:1},WARM:{lines:"응. 걔 얼굴만 봐도 알 수 있을걸. 또 불가능한 걸 가능하게 만들었다고 좋아하겠지.",delta:1,effects:[set(id+"-charlie-soft","luc_charlie_soft",true)]},CLOSE:{lines:"그래. 찰리가 그걸 직접 보는 날이 오면… 나도 옆에서 보고 싶네.",delta:1,effects:[set(id+"-charlie-soft-close","luc_charlie_soft",true)]}})
          ])
        ])
      ]),
      O(id+"-good-memory","천국에 좋은 기억도 있었는지 묻는다","sensitive",[
        P(id+"-good-memory-player","천국에 좋은 기억도 있었어요?"),
        ...BR(id+"-good-memory-r",{COLD:{lines:"좋은 기억이 없었다고 한 적은 없어.",delta:-1},DISTANT:"있었지. 있었다는 것까지만 말할게.",NEUTRAL:"좋은 기억도 있었어. 전부 나빴다면 이렇게 복잡하지도 않았겠지.",WARM:"장소보다 그때의 내가 좋았던 기억이 있어. 뭐든 만들 수 있다고 믿던 때.",CLOSE:["있어. 아직 세상이 넓고, 새로운 걸 생각하는 게 죄가 아니라고 믿던 때가.","그 기억까지 미워하고 싶진 않아."]}),
        CH(id+"-memory-follow","여기서 어디까지 물을까?",[
          O(id+"-which-memory","어떤 기억인지 더 묻는다","sensitive",[
            P(id+"-which-memory-player","어떤 기억인데요?"),
            ...BR(id+"-which-memory-r",{COLD:{lines:"멈추라고 했잖아. 이 주제는 끝이야.",delta:-2,effects:[add(id+"-memory-push-cold","luc_t14_push",1),add(id+"-memory-tension-cold","luc_t14_tension",1),set(id+"-memory-close-cold","luc_t14_closed",true)]},DISTANT:{lines:"좋았다는 사실이면 충분하지 않아?",delta:-1,effects:[add(id+"-memory-push-dist","luc_t14_push",1),add(id+"-memory-tension-dist","luc_t14_tension",1)]},NEUTRAL:"빛과 음악, 아직 완성되지 않은 생각들. 그 정도만.",WARM:"아무도 이름 붙이지 않은 걸 처음 만드는 순간들. 그때는 그게 허락될 거라고 믿었어.",CLOSE:{lines:["새로운 걸 만들면 모두가 기뻐할 거라고 믿었어.","순진했지만, 그 마음 자체는 나쁘지 않았지."],delta:1}}),
            CH(id+"-memory-deeper","마지막으로 더 물을까?",[
              O(id+"-want-return","그럼 돌아가고 싶은지 묻는다","confrontational",[
                P(id+"-want-return-player","그럼 사실은 돌아가고 싶은 거예요?"),
                ...BR(id+"-want-return-r",{COLD:{lines:"두 번이나 밀어붙였지. 이제 그만해.",delta:-2,effects:[add(id+"-return-push-cold","luc_t14_push",1),add(id+"-return-tension-cold","luc_t14_tension",1),set(id+"-return-close-cold","luc_t14_closed",true)]},DISTANT:{lines:"그렇게 단순한 답을 원하면 다른 사람한테 물어봐.",delta:-1,effects:[add(id+"-return-push-dist","luc_t14_push",1),add(id+"-return-tension-dist","luc_t14_tension",1)]},NEUTRAL:"돌아간다는 말은 맞지 않아. 예전과 같은 곳도, 같은 나도 아니니까.",WARM:"보고 싶은 게 남아 있는 것과 돌아가고 싶은 건 달라.",CLOSE:"돌아가고 싶진 않아. 다만 언젠가 도망치지 않고 바라볼 수는 있었으면 해."})
              ],{condition:{variableId:"luc_t14_closed",operator:"==",value:"false"}}),
              O(id+"-memory-stop","여기서 화제를 멈춘다","supportive",[
                P(id+"-memory-stop-player","알겠어요. 여기까지만 물을게요."),
                ...BR(id+"-memory-stop-r",{default:{lines:"…그래. 그게 좋겠네.",delta:1,effects:[set(id+"-memory-stop-close","luc_t14_closed",true)]},CLOSE:{lines:"고마워. 나중엔 내가 먼저 말할 수도 있으니까.",delta:2,effects:[set(id+"-memory-stop-close-close","luc_t14_closed",true)]}})
              ])
            ])
          ],{condition:{variableId:"luc_t14_closed",operator:"==",value:"false"}}),
          O(id+"-good-memory-stop","다른 이야기로 돌린다","supportive",[
            P(id+"-good-memory-stop-player","좋은 기억도 있었다는 것만 알면 됐어요."),
            ...BR(id+"-good-memory-stop-r",{default:{lines:"그 정도면 충분해.",delta:1,effects:[set(id+"-good-memory-stop-close","luc_t14_closed",true)]},CLOSE:{lines:"응. 그걸 나쁘게 쓰지 않을 거란 것도 알겠어.",delta:2,effects:[set(id+"-good-memory-stop-close2","luc_t14_closed",true)]}})
          ])
        ])
      ])
    ])
  ]));

  replace("호텔 요리 대회",id=>EV(id,"호텔 요리 대회","EVENT","light",[
    N(id+"-intro","주방에서 그릇이 연달아 부딪히는 소리가 난다. 문 옆에는 ‘호텔 요리 대회’라고 적힌 종이가 붙어 있다.","intro",{effects:reset("15",id)}),
    ...BR(id+"-open",{COLD:"요리 대회? 난 심사표 같은 건 안 써.",DISTANT:"이 호텔에서 요리 대회라니. 구급상자부터 가까이 둬야겠네.",NEUTRAL:"맛으로만 끝나면 다행이지. 벌써 불꽃 장식 얘기가 들리는데.",WARM:"오, 잠깐. 경쟁이면 얘기가 다르지. 누가 주방을 먼저 태우나 보자고.",CLOSE:"찰리가 붙인 거지? 좋아, 적어도 디저트 부문은 있어야 해."}),
    CH(id+"-choice","어디부터 볼까?",[
      O(id+"-best","누가 제일 잘할 것 같은지 묻는다","light",[
        P(id+"-best-player","누가 제일 잘할 것 같아요?"),
        ...BR(id+"-best-r",{COLD:"바텐더 고양이. 적어도 칼을 휘두르며 웃진 않잖아.",DISTANT:"허스크가 의외로 무난할 것 같고, 작은 애는 결과보다 과정이 무서워.",NEUTRAL:"바텐더 고양이는 기본은 할 것 같고, 긴 거미는 플레이팅에 쓸데없이 진심일걸.",WARM:"허스크는 먹을 걸 만들고, 거미는 사진 찍을 걸 만들고, 작은 애는 증거물을 만들겠네.",CLOSE:"맛만 보면 허스크. 재미까지 보면 전부 한 접시씩은 궁금한데."}),
        CH(id+"-best-follow","누구 요리가 궁금할까?",[
          O(id+"-husk","허스크를 짚는다","neutral",[P(id+"-husk-player","허스크가 제일 무난해 보여요?"),...BR(id+"-husk-r",{default:"바텐더는 맛없는 걸 내놓으면 술까지 욕먹는다는 걸 알잖아.",WARM:"그 고양이는 투덜거리면서도 먹을 만한 걸 내놓을 타입이야.",CLOSE:"허스크라면 조용히 한 접시 내놓고 아무 기대도 하지 말라고 하겠지. 그런 게 대개 제일 멀쩡해."})]),
          O(id+"-angel","엔젤을 짚는다","light",[P(id+"-angel-player","엔젤은요?"),...BR(id+"-angel-r",{default:"팔이 많으니 동시에 여러 개는 만들겠네. 먹을 수 있는지는 별개고.",WARM:"긴 거미는 맛보다 장식이 두 배는 클걸. 접시가 무대가 되겠지.",CLOSE:"거미 요리는 화려하긴 할 거야. 요리보다 사진이 먼저 끝날 것 같지만."})]),
          O(id+"-niffty","니프티를 짚는다","light",[P(id+"-niffty-player","니프티는요?"),...BR(id+"-niffty-r",{default:"칼 들고 너무 행복해 보여. 그게 문제야.",WARM:"결과물은 멀쩡할 수도 있어. 과정은 절대 보고 싶지 않고.",CLOSE:"작은 애 접시는 의외로 맛있을지 몰라. 재료를 묻지 않는 조건으로."})]),
          O(id+"-alastor","알래스터를 짚는다","light",[
            P(id+"-alastor-player","알래스터는 잠발라야도 만든다던데요."),
            ...BR(id+"-alastor-r",{default:{lines:"그 정보를 내가 왜 알아야 해? 음식이 맛있으면 음식만 인정할 거야. 사슴은 아니고.",effects:[add(id+"-alastor-irritation","luc_alastor_irritation",1)]},WARM:{lines:"그래, 잠발라야. 맛있으면 접시는 비우지. 빨간 사슴한테 칭찬은 안 해.",effects:[add(id+"-alastor-irritation-warm","luc_alastor_irritation",1)]},CLOSE:{lines:"그 사슴 요리가 정말 맛있으면? 음식은 인정하고 요리사는 계속 싫어할 거야. 완벽히 공정하지.",effects:[add(id+"-alastor-irritation-close","luc_alastor_irritation",1)]}})
          ])
        ])
      ]),
      O(id+"-taste","먹어보고 판단하자고 한다","supportive",[
        P(id+"-taste-player","일단 먹어보고 정하죠."),
        ...BR(id+"-taste-r",{COLD:"그게 제일 빠르지. 기준은 맛 하나로 하고.",DISTANT:"그래. 회의보다 한 입이 빠르니까.",NEUTRAL:"좋아. 맛있으면 통과, 주방이 타도 맛있으면… 일단 보류.",WARM:{lines:"정답! 복잡한 심사표는 필요 없어. 한 입 먹고 표정 보면 끝이야.",delta:1},CLOSE:{lines:"좋아. 네가 먼저 먹고 멀쩡하면 나도 먹지.",delta:1}}),
        CH(id+"-taste-follow","첫 시식은 누가 할까?",[
          O(id+"-first-bite","루시퍼에게 첫 시식을 맡긴다","light",[
            P(id+"-first-bite-player","그럼 루시퍼가 먼저 먹어봐요."),
            ...BR(id+"-first-bite-r",{COLD:{lines:"왜 내가 독성 검사 담당이야?",delta:-1},DISTANT:"아니, 제안한 네가 먼저지.",NEUTRAL:"공평하게 가위바위보라도 하자고.",WARM:"하! 좋아. 대신 수상한 색이면 네 입부터 벌려.",CLOSE:"알겠어. 내가 먼저 먹고 살아 있으면 다음은 너야."})
          ])
        ])
      ]),
      O(id+"-join","루시퍼도 참가하라고 한다","light",[
        P(id+"-join-player","루시퍼도 참가해요."),
        ...BR(id+"-join-r",{COLD:"내가 왜— 디저트 부문은 있어?",DISTANT:"참가는 귀찮은데 장식은 조금 손댈 수 있겠네.",NEUTRAL:"요리는 몰라도 디저트 장치라면 생각나는 게 있긴 해.",WARM:{lines:"좋아! 설탕 왕관이 열리면 안에서 작은 오리가 나오는 디저트는 어때?",delta:1,effects:[add(id+"-join-maker","luc_maker_interest",1)]},CLOSE:{lines:["나도 할래. 맛은 기본이고 움직이는 장식까지 넣자.","사슴 대가리가 무슨 표정을 짓나 보고 싶어졌어."],delta:1,effects:[add(id+"-join-maker-close","luc_maker_interest",1)]}}),
        CH(id+"-join-follow","승부 상대를 정할까?",[
          O(id+"-cookoff","알래스터와 요리 승부를 붙인다","light",[
            P(id+"-cookoff-player","알래스터랑 제대로 붙어보면요?"),
            ...BR(id+"-cookoff-r",{default:{lines:"그 사슴과? 관심 없어. …종목은 뭐지?",effects:[add(id+"-cookoff-irritation","luc_alastor_irritation",1)]},WARM:{lines:"승부는 관심 없는데 걔가 지는 건 보고 싶네. 좋아, 디저트로 붙어.",effects:[add(id+"-cookoff-irritation-warm","luc_alastor_irritation",1)]},CLOSE:{lines:"좋아. 사슴은 잠발라야, 나는 디저트. 분야가 다르다고? 내가 이기면 같은 분야야.",effects:[add(id+"-cookoff-irritation-close","luc_alastor_irritation",1)]}})
          ])
        ])
      ]),
      O(id+"-judge","찰리가 심사하면 전부 좋은 점수를 줄 것 같다고 한다","light",[
        P(id+"-judge-player","찰리가 심사하면 다 좋은 점수 줄 것 같아요."),
        ...BR(id+"-judge-r",{default:"맞아. 노력 점수, 색깔 점수, 웃긴 모양 점수까지 새로 만들걸.",WARM:"찰리는 접시마다 좋은 점을 세 개씩 찾을 거야. 그러다 전부 공동 우승이지.",CLOSE:"응. 그래서 찰리 여자친구를 같이 앉혀야 해. 찰리는 마음을 보고, 그쪽은 실제로 먹을 수 있는지 보게."}),
        CH(id+"-judge-follow","심사위원을 더 붙인다면?",[
          O(id+"-lucifer-judge","루시퍼도 심사하라고 한다","confrontational",[
            P(id+"-lucifer-judge-player","루시퍼도 심사표를 맡아요."),
            ...BR(id+"-lucifer-judge-r",{COLD:{lines:"표까지 쓰라고? 싫어.",delta:-1,effects:[add(id+"-judge-work-cold","luc_work_avoidance",1)]},DISTANT:{lines:"먹는 건 해도 결과 정리는 안 해.",effects:[add(id+"-judge-work-dist","luc_work_avoidance",1)]},NEUTRAL:{lines:"심사는 할 수 있어. 긴 표와 회의만 빼면.",effects:[add(id+"-judge-work-neutral","luc_work_avoidance",1)]},WARM:{lines:"한 입 먹고 왕관 스티커 붙이는 방식이면 하지.",effects:[add(id+"-judge-work-warm","luc_work_avoidance",1)]},CLOSE:{lines:"찰리 옆에서 맛만 볼게. 점수 합계는 찰리 여자친구 몫이야.",effects:[add(id+"-judge-work-close","luc_work_avoidance",1)]}})
          ])
        ])
      ])
    ])
  ]));

  replace("구원이 증명된 뒤 갑자기 호텔에 찾아오는 죄인들",id=>EV(id,"구원이 증명된 뒤 갑자기 호텔에 찾아오는 죄인들","EVENT","medium",[
    N(id+"-intro","호텔 문이 연달아 열리고, 구원 이야기를 들은 죄인들이 로비를 가득 메운다. 찰리는 질문을 받느라 한 걸음도 움직이지 못한다.","intro",{effects:reset("16",id)}),
    ...BR(id+"-open",{COLD:"지난번보단 진짜 목적이 있는 얼굴이 많네.",DISTANT:"구원이 증명되자마자 이렇게 몰려온다고? 소문은 빠르군.",NEUTRAL:"적어도 이번엔 호텔을 웃으러 온 사람보다 들어오려는 사람이 많아.",WARM:"찰리 말이 진짜였다는 게 증명됐으니 당연하긴 한데… 저 숫자는 좀 많지 않아?",CLOSE:"찰리가 바라던 장면이네. 문제는 저 애가 지금 숨도 못 쉬고 있다는 거고."}),
    CH(id+"-choice","붐비는 로비에서 무엇을 볼까?",[
      O(id+"-genuine","이번에는 진짜 구원받으러 온 사람이 많을 것 같다고 한다","supportive",[
        P(id+"-genuine-player","이번에는 정말 구원받으러 온 사람이 많겠죠."),
        ...BR(id+"-genuine-r",{COLD:"지난번보단 많겠지. 증거가 생겼으니까.",DISTANT:"적어도 사기라고 비웃기는 어려워졌어.",NEUTRAL:"응. 체크인만 하면 바로 천국에 간다고 착각한 사람도 있겠지만.",WARM:"많을 거야. 찰리가 그토록 설명하던 가능성이 이제 말이 아니라 증거가 됐으니까.",CLOSE:"그래. 찰리가 포기하지 않은 일이 실제로 누군가를 올려보냈어. 그걸 보고도 안 오는 쪽이 더 이상하지."}),
        CH(id+"-genuine-follow","몰려온 이유를 더 볼까?",[
          O(id+"-instant","바로 천국에 가는 줄 아는 사람도 있을 것 같다고 한다","light",[P(id+"-instant-player","체크인하면 바로 천국 가는 줄 아는 사람도 있겠네요."),...BR(id+"-instant-r",{default:"벌써 줄 맨 앞에 그런 얼굴이 셋은 보여. 찰리가 설명하다 목이 먼저 나가겠네.",WARM:"분명 있어. ‘오늘 방 잡으면 내일 날개 나오나요?’ 같은 질문부터 받을걸.",CLOSE:"있겠지. 그래도 찰리는 한 명씩 앉혀놓고 끝까지 설명할 거야. 그래서 더 말려야 하고."})]),
          O(id+"-rumor","복스가 또 이상한 소문을 만들지 묻는다","light",[P(id+"-rumor-player","복스가 또 이상한 소문을 만들까요?"),...BR(id+"-rumor-r",{default:"텔레비전 대가리라면 이미 ‘천국행 패키지’ 자막을 뽑고 있겠지.",WARM:"그 화면 머리는 실패보다 성공을 더 자극적으로 팔아. 이번엔 그게 더 귀찮을걸.",CLOSE:"복스가 뭘 떠들든 증거는 못 지워. 찰리한테는 그게 가장 큰 차이지."})])
        ])
      ]),
      O(id+"-charlie-happy","찰리가 엄청 좋아할 것 같다고 한다","supportive",[
        P(id+"-charlie-happy-player","찰리가 정말 좋아하겠네요."),
        ...BR(id+"-charlie-happy-r",{COLD:{lines:"처음엔 그렇겠지. 지금은 사람들 사이에 파묻혔지만.",effects:[set(id+"-protect-cold","luc_charlie_protective",true)]},DISTANT:{lines:"좋아하긴 해. 문제는 전부 자기가 상대하려 한다는 거지.",effects:[set(id+"-protect-dist","luc_charlie_protective",true)]},NEUTRAL:{lines:"기뻐서 한 명도 돌려보내지 못할걸. 그래서 누군가는 잠깐 빼내야 해.",effects:[set(id+"-protect-neutral","luc_charlie_protective",true)]},WARM:{lines:["응. 저 얼굴 봐. 완전히 신났잖아.","…그리고 벌써 숨 돌릴 틈도 없어 보이네."],effects:[set(id+"-protect-warm","luc_charlie_protective",true)]},CLOSE:{lines:["찰리가 꿈꾸던 날이야. 나도 그건 기뻐.","그래도 저 애가 군중 속에서 쓰러질 때까지 두진 않을 거야."],effects:[set(id+"-protect-close","luc_charlie_protective",true)]}}),
        CH(id+"-charlie-follow","루시퍼에게 어떻게 말할까?",[
          O(id+"-help","감당하기 어려우면 도와줄 건지 묻는다","supportive",[P(id+"-help-player","또 감당하기 어려워지면 도와줄 거죠?"),...BR(id+"-help-r",{COLD:"찰리를 저기서 빼내는 건 할 거야. 네가 말하지 않아도.",DISTANT:"프런트 표는 안 만들어도 찰리가 숨 쉴 틈은 만들지.",NEUTRAL:{lines:"응. 사람들을 전부 상대하는 대신 찰리를 잠깐 빼낼 거야.",delta:1},WARM:{lines:"당연하지. 걔가 손을 들기도 전에 표정 보면 알아.",delta:1},CLOSE:{lines:"응. 찰리가 부탁하지 못할 만큼 바쁠 때는 내가 먼저 갈 거야.",delta:1}})]),
          O(id+"-replace","아예 일을 대신 해주라고 한다","confrontational",[P(id+"-replace-player","그냥 루시퍼가 일을 대신하면 되잖아요."),...BR(id+"-replace-r",{COLD:{lines:"내가 프런트 직원이 되라는 거야? 찰리를 돕는 것과 걔 일을 빼앗는 건 달라.",delta:-1,effects:[add(id+"-replace-work-cold","luc_work_avoidance",1)]},DISTANT:{lines:"대신하진 않아. 필요한 순간에만 끼어들 거야.",effects:[add(id+"-replace-work-dist","luc_work_avoidance",1)]},NEUTRAL:{lines:"전부 대신하면 찰리가 더 싫어해. 한꺼번에 몰린 사람부터 정리하는 정도지.",effects:[add(id+"-replace-work-neutral","luc_work_avoidance",1)]},WARM:{lines:"내가 체크인 명단을 들고 서 있는 그림을 상상해봐. 찰리도 웃을걸.",effects:[add(id+"-replace-work-warm","luc_work_avoidance",1)]},CLOSE:{lines:"찰리를 쉬게는 해도 호텔을 내 방식으로 가져오진 않아. 걔가 만든 곳이니까.",effects:[add(id+"-replace-work-close","luc_work_avoidance",1)]}})])
        ])
      ]),
      O(id+"-staff","이 많은 사람을 누가 상대할지 묻는다","neutral",[
        P(id+"-staff-player","이 많은 사람은 누가 상대해요?"),
        ...BR(id+"-staff-r",{COLD:"찰리 여자친구가 프런트를 잡고 나머지는 할 수 있는 걸 하면 되지.",DISTANT:"찰리 여자친구가 줄을 세우고, 바텐더 고양이는 진정할 사람부터 앉히겠네.",NEUTRAL:"찰리 여자친구가 입구를 정리하고, 허스크랑 거미가 대기 공간을 보는 정도면 되겠지.",WARM:"매기—베기? 아무튼 그쪽이 줄을 정리하고, 거미는 사람들 긴장부터 풀 수 있겠네.",CLOSE:"찰리는 설명하고, 여자친구는 속도를 줄이고, 나머지는 한 사람씩 맡으면 돼. 당번표는 만들지 말고."}),
        CH(id+"-staff-follow","누구에게 더 맡길까?",[
          O(id+"-staff-alastor","알래스터에게 맡기자고 한다","light",[P(id+"-staff-alastor-player","알래스터가 사람들을 상대하면 빠르지 않을까요?"),...BR(id+"-staff-alastor-r",{default:{lines:"사슴 대가리한테 새 죄인들을 줄 세우라고? 호텔보다 자기 방송부터 키울걸.",effects:[add(id+"-staff-alastor-irritation","luc_alastor_irritation",1)]},WARM:{lines:"빨간 사슴에게 맡기면 조용해지긴 하겠지. 모두가 무서워서.",effects:[add(id+"-staff-alastor-irritation-warm","luc_alastor_irritation",1)]},CLOSE:{lines:"빠르긴 하겠네. 다만 찰리 호텔이 아니라 라디오 사슴 쇼가 될 거야.",effects:[add(id+"-staff-alastor-irritation-close","luc_alastor_irritation",1)]}})])
        ])
      ]),
      O(id+"-changed","구원이 증명된 뒤 생각이 달라졌는지 묻는다","sensitive",[
        P(id+"-changed-player","실제로 구원이 증명되고 생각이 달라졌어요?"),
        ...BR(id+"-changed-r",{COLD:"가능하다는 사실은 인정해. 그건 호감과 상관없는 사실이니까.",DISTANT:"불가능하다고 말할 근거는 사라졌지.",NEUTRAL:"응. 가능성을 의심할 이유는 줄었어. 찰리를 믿기 시작한 건 그보다 전이지만.",WARM:"증거가 생겨서 세상이 따라온 거지. 난 그 전에 이미 찰리가 틀리지 않았다고 생각하기 시작했고.",CLOSE:"구원에 대한 생각은 바뀌었어. 찰리에 대한 건… 증명되기 전부터 이미 바뀌고 있었고."}),
        CH(id+"-changed-follow","감정을 직접 물을까?",[
          O(id+"-proud","찰리가 자랑스러운지 묻는다","supportive",[P(id+"-proud-player","찰리가 자랑스러워요?"),...BR(id+"-proud-r",{COLD:"그건 당연하지.",DISTANT:"응. 그 애가 해낸 일이니까.",NEUTRAL:{lines:"자랑스러워. 끝까지 포기하지 않았으니까.",delta:1},WARM:{lines:["응. 아주 많이.","걔는 내가 포기한 뒤에도 계속 문을 두드렸어."],delta:1},CLOSE:{lines:["말로 다 못 할 만큼.","찰리는 내가 실패했다고 믿은 가능성을 자기 손으로 증명했어."],delta:1}})])
        ])
      ])
    ])
  ]));

  replace("호텔에서 가장 믿으면 안 되는 사람",id=>EV(id,"호텔에서 가장 믿으면 안 되는 사람","PLAYER_ASK","medium",[
    N(id+"-intro","호텔 열쇠와 서류가 놓인 프런트에서 여러 사람의 이름이 한꺼번에 들린다.","intro",{effects:reset("17",id)}),
    P(id+"-player","이 호텔에서 제일 믿으면 안 되는 사람 하나만 고르면요?"),
    ...BR(id+"-open",{COLD:"사슴 대가리.",DISTANT:"라디오 사슴. 너무 쉬운 질문인데.",NEUTRAL:"알래스터. 도움을 주는 것과 믿을 수 있는 건 전혀 다르니까.",WARM:"빨간 사슴. 이유 목록이 필요하면 밤새 말할 수도 있어.",CLOSE:"알래스터. 단, 위험하다는 걸 숨기지 않는다는 점에선 오히려 예측은 쉬운 편이지."}),
    CH(id+"-choice","누구의 신뢰를 더 따져볼까?",[
      O(id+"-alastor","알래스터를 고른 이유를 묻는다","light",[
        P(id+"-alastor-player","그냥 싫어서 알래스터를 고른 거 아니에요?"),
        ...BR(id+"-alastor-r",{COLD:{lines:"싫은 데는 이유가 있거든. 친한 척 떠보지 마.",delta:-1,effects:[add(id+"-alastor-irritation-cold","luc_alastor_irritation",1)]},DISTANT:{lines:"싫은 건 맞아. 틀린 말은 아니고.",effects:[add(id+"-alastor-irritation-dist","luc_alastor_irritation",1)]},NEUTRAL:{lines:"싫어하는 것과 못 믿는 이유가 겹칠 뿐이야.",effects:[add(id+"-alastor-irritation-neutral","luc_alastor_irritation",1)]},WARM:{lines:"하! 물론 싫지. 그래도 근거 없이 고른 건 아니야.",delta:1,effects:[add(id+"-alastor-irritation-warm","luc_alastor_irritation",1)]},CLOSE:{lines:"둘 다야. 네가 그걸 알아챈 건 조금 웃기네.",delta:1,effects:[add(id+"-alastor-irritation-close","luc_alastor_irritation",1)]}}),
        CH(id+"-alastor-follow","반론을 해볼까?",[
          O(id+"-helped","그래도 호텔을 도왔다고 말한다","neutral",[P(id+"-helped-player","그래도 알래스터가 호텔을 돕긴 했잖아요."),...BR(id+"-helped-r",{default:"도움과 신뢰는 달라. 자기 목적과 호텔 목적이 겹칠 때 움직인 거지.",WARM:"도운 건 인정해. 그래서 믿으라는 결론은 안 나와.",CLOSE:"도움은 기록해둘 수 있어. 신뢰는 맡긴 뒤 등을 돌릴 수 있느냐의 문제고."})])
        ])
      ]),
      O(id+"-husk","허스크는 믿을 만한지 묻는다","neutral",[
        P(id+"-husk-player","허스크는 믿을 만해요?"),
        ...BR(id+"-husk-r",{COLD:"바텐더 고양이는 싫으면 싫다고 얼굴에 다 써 있어.",DISTANT:"적어도 속내가 표정에 보여. 사슴보다 훨씬 편하지.",NEUTRAL:"허스크는 과거가 어떻든 지금 어떻게 구는지가 보이는 쪽이야.",WARM:"그 고양이는 투덜대도 중요한 순간엔 자리를 안 뜰 것 같더군.",CLOSE:"믿을 수 있는 편이야. 자기가 못 지킬 약속을 쉽게 하지 않는 타입이니까."}),
        CH(id+"-husk-follow","과거를 따져볼까?",[
          O(id+"-husk-past","과거에 오버로드였다고 지적한다","sensitive",[P(id+"-husk-past-player","그래도 과거에는 오버로드였잖아요."),...BR(id+"-husk-past-r",{default:"과거 직함보다 지금 누구 곁에 남는지가 더 중요하지.",WARM:"맞아. 그래도 지금은 찰리 호텔에서 사람들을 챙기고 있잖아.",CLOSE:"그 과거를 숨기지도 않고, 지금은 같은 실수를 경계하는 것 같더군. 그게 더 중요해."})])
        ])
      ]),
      O(id+"-others","엔젤이나 니프티는 어떤지 묻는다","light",[
        P(id+"-others-player","엔젤이나 니프티는요?"),
        ...BR(id+"-others-r",{COLD:"거미는 중요한 순간엔 의외로 움직이고, 작은 애는 결과를 예측할 수가 없어.",DISTANT:"긴 거미는 격식 있는 일을 맡기기 불안하고, 조그만 청소광은 신뢰보다 안전 문제야.",NEUTRAL:"엔젤은 농담 뒤에 숨지만 필요할 때 할 일은 해. 니프티는… 의도는 믿어도 결과는 못 믿겠네.",WARM:"거미는 생각보다 사람을 챙기고, 작은 애는 정말로 돕고 싶어 해. 방식이 무서울 뿐이지.",CLOSE:"둘 다 중요한 순간엔 호텔 편에 설 거야. 맡길 일의 종류를 아주 신중하게 고르면."})
      ]),
      O(id+"-self","루시퍼 본인은 믿을 만한지 묻는다","sensitive",[
        P(id+"-self-player","그럼 당신은 믿어도 돼요?"),
        ...BR(id+"-self-r",{COLD:"뭘 맡기느냐에 따라 다르지.",DISTANT:"전부 다 믿으라고는 안 해. 구체적으로 물어봐.",NEUTRAL:"비밀과 위험한 일은 답이 다를걸. 서류는 절대 맡기지 말고.",WARM:"위험할 때 빠지진 않아. 귀찮은 행정은 미리 다른 사람을 찾아.",CLOSE:{lines:["정말 위험할 때는 믿어도 돼.","네가 곤란하다고 말했는데 모른 척 빠지진 않을 테니까."],delta:1}}),
        CH(id+"-self-follow","무엇을 맡길지 골라보자.",[
          O(id+"-documents","중요한 서류를 맡긴다","light",[P(id+"-documents-player","중요한 서류는요?"),...BR(id+"-documents-r",{default:{lines:"안 돼. 그건 믿음 문제가 아니라 적성 문제야.",effects:[add(id+"-documents-work","luc_work_avoidance",1)]},CLOSE:{lines:"절대 안 돼. 널 배신하진 않아도 서류 마감은 배신할 수 있어.",effects:[add(id+"-documents-work-close","luc_work_avoidance",1)]}})]),
          O(id+"-secret","비밀을 맡긴다","sensitive",[P(id+"-secret-player","비밀은요?"),...BR(id+"-secret-r",{COLD:"떠들 만큼 네 일에 관심이 많진 않아.",DISTANT:"굳이 퍼뜨릴 이유가 없으면 안 하지.",NEUTRAL:"지킬 수 있어. 비밀을 거래할 만큼 부지런하지도 않고.",WARM:"네가 숨기고 싶은 일이라면 입 다물어줄게.",CLOSE:{lines:"지켜. 네가 직접 말할 준비가 될 때까지는.",delta:1}})]),
          O(id+"-danger","위험한 상황에서 믿을 수 있는지 묻는다","sensitive",[P(id+"-danger-player","위험할 때도요?"),...BR(id+"-danger-r",{COLD:"도망가진 않아.",DISTANT:"위험하다고 먼저 빠지는 타입은 아니야.",NEUTRAL:"내가 감당할 수 있는 상황이면 남겨두고 가진 않아.",WARM:"응. 위험할 때는 농담부터 해도 자리는 지켜.",CLOSE:{lines:"그럴 때는 믿어도 돼. 네가 뒤를 맡겼다면 비우지 않을게.",delta:1}})]),
          O(id+"-charlie","찰리와 관련된 일이라면 어떤지 묻는다","supportive",[P(id+"-charlie-player","찰리와 관련된 일이라면요?"),...BR(id+"-charlie-r",{default:{lines:"그건 묻지 않아도 돼. 찰리 일이라면 내가 가.",effects:[set(id+"-charlie-protect","luc_charlie_protective",true)]},CLOSE:{lines:"찰리 일이라면 언제든. 그리고 네가 걔를 지키려는 쪽이라면 너도 혼자 두진 않아.",effects:[set(id+"-charlie-protect-close","luc_charlie_protective",true)]}})])
        ])
      ])
    ])
  ]));

  replace("호텔에서 술을 제한해야 하는가",id=>EV(id,"호텔에서 술을 제한해야 하는가","PLAYER_ASK","medium",[
    N(id+"-intro","바 옆 게시판에 음주 제한 공지 초안이 반쯤 작성된 채 놓여 있다.","intro",{effects:reset("18",id)}),
    P(id+"-player","호텔에서 술은 좀 제한해야 하지 않아요?"),
    ...BR(id+"-open",{COLD:"호텔 전체 규칙으로? 문제가 생긴 사람만 그때 말리면 되잖아.",DISTANT:"금지문부터 붙이면 밖에서 사 오거나 숨길걸.",NEUTRAL:"전체를 묶기보다 위험하게 마시는 사람이 생겼을 때 멈추는 게 낫지 않아?",WARM:"긴 규칙표를 붙이는 순간 바텐더 고양이가 먼저 찢을 것 같은데.",CLOSE:"찰리는 이유를 듣고 싶어 할 거고, 찰리 여자친구는 사고가 나기 전에 선을 긋고 싶어 하겠지."}),
    CH(id+"-choice","어떤 기준을 이야기할까?",[
      O(id+"-limit","어느 정도 제한은 필요하다고 말한다","neutral",[
        P(id+"-limit-player","그래도 어느 정도 제한은 필요하지 않아요?"),
        ...BR(id+"-limit-r",{COLD:"필요할 수도 있지. 그렇다고 모두에게 같은 선을 그을 필요는 없어.",DISTANT:"시간이나 양을 적어놓는다고 사람들이 갑자기 책임감 있어지진 않아.",NEUTRAL:"사고가 반복되면 제한은 필요해. 다만 문제 없는 사람까지 묶는 건 싫어.",WARM:"규칙 하나쯤은 가능하지. ‘남에게 피해 주면 오늘은 끝.’ 짧고 좋잖아.",CLOSE:"제한 자체보다 누가 위험해지는지 먼저 봐야 해. 같은 잔도 누구에겐 전혀 다른 이유일 수 있으니까."}),
        CH(id+"-limit-follow","반론이나 사례를 더 들까?",[
          O(id+"-too-late","사고가 난 뒤면 늦다고 반론한다","neutral",[P(id+"-too-late-player","사고가 난 뒤에 말리면 늦잖아요."),...BR(id+"-too-late-r",{default:"그래서 징조가 보일 때 말리는 거지. 모든 잔을 미리 뺏는 것과는 달라.",WARM:"맞아. 완전히 터질 때까지 보자는 뜻은 아니야. 선을 넘기 직전에 잡아야지.",CLOSE:"그건 동의해. 다만 예방이라는 이름으로 사람을 전부 통제하고 싶진 않아."})]),
          O(id+"-charlie-vaggie","찰리와 배기는 어떻게 할지 묻는다","neutral",[P(id+"-charlie-vaggie-player","찰리와 배기는 어떻게 할까요?"),...BR(id+"-charlie-vaggie-r",{default:"찰리는 왜 마시는지부터 묻고, 찰리 여자친구는 위험해 보이면 잔부터 치우겠지.",WARM:"찰리는 상담을 시작하고, 베기—매기? 그쪽은 물부터 내밀 거야. 둘이 같이 하면 의외로 괜찮겠네.",CLOSE:"찰리는 사람을 보고, 여자친구는 상황을 볼 거야. 둘 다 있어야 놓치는 게 줄겠지."})])
        ])
      ]),
      O(id+"-husk","허스크가 가장 싫어할 것 같다고 한다","light",[
        P(id+"-husk-player","허스크가 제일 싫어하겠네요."),
        ...BR(id+"-husk-r",{default:"바텐더 고양이는 금지문을 싫어하겠지. 그래도 누가 위험하게 마시면 모른 척하진 않을걸.",WARM:"그 고양이는 투덜거리면서도 취한 사람 잔을 조용히 치울 타입이야.",CLOSE:"허스크는 술을 좋아해도 술 때문에 망가지는 얼굴은 알아볼 거야. 그래서 오히려 먼저 눈치챌지도 모르지."}),
        CH(id+"-husk-follow","그에게 어디까지 맡길까?",[
          O(id+"-husk-all","술 문제를 전부 허스크에게 맡기자고 한다","confrontational",[P(id+"-husk-all-player","그럼 술 문제는 전부 허스크에게 맡기면 되겠네요."),...BR(id+"-husk-all-r",{COLD:{lines:"한 사람한테 전부 떠넘기는 게 해결책이야?",delta:-1,effects:[add(id+"-husk-work-cold","luc_work_avoidance",1)]},DISTANT:{lines:"바텐더라고 상담과 경비까지 다 맡길 순 없지.",effects:[add(id+"-husk-work-dist","luc_work_avoidance",1)]},NEUTRAL:{lines:"허스크가 먼저 알아차릴 수는 있어도 전부 책임질 이유는 없어.",effects:[add(id+"-husk-work-neutral","luc_work_avoidance",1)]},WARM:{lines:"고양이한테 바, 상담, 규칙 집행까지 다 주면 바로 사표 던질걸.",effects:[add(id+"-husk-work-warm","luc_work_avoidance",1)]},CLOSE:{lines:"그건 허스크를 돕는 게 아니라 또 짐을 얹는 거야. 역할은 나눠야지.",effects:[add(id+"-husk-work-close","luc_work_avoidance",1)]}})])
        ])
      ]),
      O(id+"-angel","엔젤 때문에라도 제한이 필요하지 않냐고 한다","sensitive",[
        P(id+"-angel-player","엔젤 때문에라도 제한이 필요하지 않아요?"),
        ...BR(id+"-angel-r",{COLD:"즐기려고 마시는 것과 잊으려고 계속 마시는 건 다르지.",DISTANT:"거미 하나 때문에 병을 전부 없앤다고 해결될 것 같진 않아.",NEUTRAL:"엔젤이 위험해 보이면 멈춰야 해. 하지만 호텔 전체를 비우는 건 다른 문제고.",WARM:"긴 거미가 웃고 있어도 계속 잊으려고 마시는 순간은 있겠지. 그땐 누군가 옆에 있어야 해.",CLOSE:"엔젤에게 필요한 건 병이 사라지는 것만이 아니라, 멈췄을 때 혼자 남지 않는 거겠지."}),
        CH(id+"-angel-follow","방법을 더 밀어붙일까?",[
          O(id+"-force","억지로 못 마시게 하면 된다고 한다","confrontational",[
            P(id+"-force-player","그럼 억지로 못 마시게 하면 되잖아요."),
            ...BR(id+"-force-r",{
              COLD:{lines:"강제로 뺏는 게 전부 해결한다고 생각해?",delta:-1,effects:[add(id+"-force-tension-cold","luc_t18_tension",1),add(id+"-force-push-cold","luc_t18_push",1)]},
              DISTANT:{lines:"통제만으로 끝날 문제면 벌써 끝났겠지.",delta:-1,effects:[add(id+"-force-tension-dist","luc_t18_tension",1),add(id+"-force-push-dist","luc_t18_push",1)]},
              NEUTRAL:{lines:"못 마시게 하는 것만으론 왜 마시는지 사라지지 않아.",delta:-1,effects:[add(id+"-force-tension-neutral","luc_t18_tension",1),add(id+"-force-push-neutral","luc_t18_push",1)]},
              WARM:{lines:"네가 걱정하는 건 알아. 그래도 사람을 붙잡아두는 걸 도움이라고 부르진 마.",delta:-1,effects:[add(id+"-force-tension-warm","luc_t18_tension",1),add(id+"-force-push-warm","luc_t18_push",1)]},
              CLOSE:{lines:"가까운 사이라도 강제로 결정권을 뺏는 건 싫어. 위험한 순간을 막고, 그다음은 같이 버텨야지.",delta:-1,effects:[add(id+"-force-tension-close","luc_t18_tension",1),add(id+"-force-push-close","luc_t18_push",1)]}
            })
          ])
        ])
      ]),
      O(id+"-ban","아예 호텔에서 술을 없애자고 한다","light",[
        P(id+"-ban-player","그냥 호텔에서 술을 전부 없애면요?"),
        ...BR(id+"-ban-r",{COLD:"밖에서 사 오겠지.",DISTANT:"숨기거나 밖에서 마실걸. 장소만 바뀌어.",NEUTRAL:"바텐더 고양이가 먼저 나가고, 거미는 창문으로 병을 들여오겠네.",WARM:"하! 금지 첫날에 비밀 술집이 생길걸. 위치는 아마 바 바로 뒤고.",CLOSE:"없애는 건 쉬워도 이유는 안 없어져. 난 그 사람이 남에게 피해 줄 정도일 때 그 사람만 멈추게 할 거야."}),
        CH(id+"-ban-follow","루시퍼 방식은 무엇일까?",[
          O(id+"-own-rule","루시퍼라면 어떻게 할지 묻는다","neutral",[P(id+"-own-rule-player","루시퍼라면 어떻게 할 건데요?"),...BR(id+"-own-rule-r",{default:{lines:"남에게 피해 줄 정도면 그 사람 잔만 치워. 끝. 긴 규칙표는 없어.",effects:[add(id+"-own-rule-work","luc_work_avoidance",1)]},WARM:{lines:"선을 넘으면 그날은 끝. 다음 날엔 왜 그랬는지 다른 사람이 물어보고. 난 표는 안 써.",effects:[add(id+"-own-rule-work-warm","luc_work_avoidance",1)]},CLOSE:{lines:"위험해지면 멈추게 하고 혼자 두지 않아. 그 이상은 본인이 선택해야 해.",effects:[add(id+"-own-rule-work-close","luc_work_avoidance",1)]}})])
        ])
      ])
    ])
  ]));

  replace("호텔에서 절대 맡기면 안 되는 사람이 요리를 한다면",id=>EV(id,"호텔에서 절대 맡기면 안 되는 사람이 요리를 한다면","EVENT","light",[
    N(id+"-intro","주방 문틈으로 연기가 새어 나온다. 안에서는 칼이 빠르게 도마를 두드리고, 니프티의 웃음소리가 따라온다.","intro",{effects:reset("19",id)}),
    ...BR(id+"-open",{COLD:"요리를 못한다는 뜻은 아니야. 칼 들고 너무 행복해 보여서 그래.",DISTANT:"작은 애가 저렇게 웃을 때는 결과보다 과정이 걱정돼.",NEUTRAL:"완성된 접시는 멀쩡할 수도 있어. 주방은 아닐 것 같고.",WARM:"하! 맛은 있을지도 몰라. 재료와 과정만 절대 묻지 말자.",CLOSE:"좋아, 누가 됐든 문을 열기 전에 방패부터 가져와. 냄새는 괜찮은데 소리가 너무 즐겁잖아."}),
    CH(id+"-choice","주방 앞에서 무엇을 할까?",[
      O(id+"-niffty","니프티가 요리하면 안 되는지 묻는다","light",[
        P(id+"-niffty-player","니프티가 요리하면 안 돼요?"),
        ...BR(id+"-niffty-r",{COLD:"안 된다는 게 아니라 보고 싶지 않다는 거야.",DISTANT:"먹을 수는 있겠지. 칼질하는 얼굴을 잊을 수 없을 뿐.",NEUTRAL:"요리는 멀쩡할 가능성이 있어. 도마가 살아남을 가능성은 낮고.",WARM:"작은 애 접시는 예쁘게 나올걸. 접시 아래에 뭘 숨겼는지만 확인해.",CLOSE:"니프티라면 맛과 공포를 동시에 완성하겠지. 호텔답긴 하네."}),
        CH(id+"-niffty-follow","결과와 과정을 어떻게 볼까?",[
          O(id+"-taste-good","맛있으면 된 거 아니냐고 한다","neutral",[P(id+"-taste-good-player","그래도 맛있으면 된 거 아닌가요?"),...BR(id+"-taste-good-r",{default:"그 논리는 이해해. 먼저 살아서 한 입 먹은 사람이 있으면.",WARM:"맞아. 맛있으면 과정은 비밀로 묻자. 아주 깊게.",CLOSE:"그래. 접시가 맛있고 모두 손가락이 그대로면 성공으로 치자."})]),
          O(id+"-watch","누가 옆에서 지켜봐야 한다고 한다","neutral",[P(id+"-watch-player","그래도 누가 옆에서 봐야겠어요."),...BR(id+"-watch-r",{default:{lines:"찰리나 찰리 여자친구가 보면 되겠네. 나는 문 밖에서 응원할게.",effects:[add(id+"-watch-work","luc_work_avoidance",1)]},WARM:{lines:"베기—매기? 그쪽이 칼 개수를 세고 찰리가 재료를 확인하면 돼. 난 시식 때 올게.",effects:[add(id+"-watch-work-warm","luc_work_avoidance",1)]},CLOSE:{lines:"찰리가 옆에 있으면 작은 애도 조금은 천천히 하겠지. 난 비상시에 문을 닫는 역할로 충분해.",effects:[add(id+"-watch-work-close","luc_work_avoidance",1)]}})])
        ])
      ]),
      O(id+"-others","다른 사람이 요리하면 어떨지 묻는다","light",[
        P(id+"-others-player","그럼 다른 사람이 요리하면요?"),
        ...BR(id+"-others-r",{default:"누구를 고르느냐에 따라 음식이 되거나 공연이 되겠지.",WARM:"바텐더 고양이면 음식, 거미면 쇼, 라디오 사슴이면 자존심 싸움이야.",CLOSE:"허스크가 가장 안전하고, 거미가 가장 화려하고, 사슴은 가장 인정하기 싫겠네."}),
        CH(id+"-others-follow","누구를 고를까?",[
          O(id+"-alastor","알래스터 요리를 묻는다","light",[P(id+"-alastor-player","알래스터가 요리하면요?"),...BR(id+"-alastor-r",{default:{lines:"잠발라야를 안다는 건 알아. 맛있으면 음식만 인정해. 사슴은 아니야.",effects:[add(id+"-alastor-irritation","luc_alastor_irritation",1)]},WARM:{lines:"그 빨간 사슴은 분명 냄비 옆에서 방송까지 하겠지. 맛있어도 조용히 먹을 거야.",effects:[add(id+"-alastor-irritation-warm","luc_alastor_irritation",1)]},CLOSE:{lines:"맛있다면 접시는 비워. 그리고 본인 앞에서는 우연히 배고팠다고 할 거야.",effects:[add(id+"-alastor-irritation-close","luc_alastor_irritation",1)]}})]),
          O(id+"-angel","엔젤 요리를 묻는다","light",[P(id+"-angel-player","엔젤이 요리하면요?"),...BR(id+"-angel-r",{default:"팔이 많아서 동시에 여러 냄비는 보겠네. 집중하는지는 모르겠고.",WARM:"긴 거미는 불 네 개를 동시에 쓰고 접시에 장식은 여덟 개 올릴걸.",CLOSE:"거미라면 맛보다 연출에 진심일 거야. 그래도 중요한 순간엔 의외로 제대로 해낼지도 모르지."})])
        ])
      ]),
      O(id+"-try","결국 먹어보고 판단하자고 한다","supportive",[
        P(id+"-try-player","결국 먹어보고 판단하죠."),
        N(id+"-plate","주방 문이 열리고 니프티가 김이 오르는 접시를 들고 나타난다. 칼은 여전히 다른 손에 들려 있다.","situation"),
        ...BR(id+"-try-r",{COLD:"…접시는 멀쩡하네. 네가 먼저 먹어.",DISTANT:"냄새는 괜찮아. 그게 더 불안한데.",NEUTRAL:"좋아. 보기엔 정상이고, 작은 애 표정만 비정상이야.",WARM:{lines:"하! 진짜로 가져왔네. 좋아, 한 입이면 알겠지.",delta:1},CLOSE:{lines:"생각보다 훌륭해 보이는데? 자, 이제 누가 용감한지만 정하면 돼.",delta:1}}),
        CH(id+"-try-follow","첫 한 입을 앞에 두고 어떻게 할까?",[
          O(id+"-you-first","루시퍼에게 먼저 먹어보라고 한다","light",[P(id+"-you-first-player","루시퍼가 먼저 먹어봐요."),...BR(id+"-you-first-r",{COLD:{lines:"왜 늘 내가 먼저야?",delta:-1},DISTANT:"가위바위보도 없이? 불공평하네.",NEUTRAL:"왕의 독성 검사라니 직함 사용이 아주 창의적이야.",WARM:"좋아. 대신 내가 쓰러지면 네가 두 입 먹는 거야.",CLOSE:"알겠어. 네가 그렇게 기대하는 얼굴이면 한 입은 먹지."})]),
          O(id+"-scared","겁먹은 거냐고 놀린다","light",[P(id+"-scared-player","설마 겁먹었어요?"),...BR(id+"-scared-r",{COLD:{lines:"그 정도로 친한 척 놀릴 사이는 아니잖아.",delta:-1},DISTANT:"경계심과 겁은 다른 거야.",NEUTRAL:"이건 합리적인 생존 본능이거든.",WARM:{lines:"하! 내가? 좋아, 잘 봐. 왕이 먼저 먹어주지.",delta:1},CLOSE:{lines:"조금. 네가 웃고 있으니 더 인정하기 싫네. 그래도 먹어볼게.",delta:1}})])
        ])
      ])
    ])
  ]));

  replace("호텔에서 가장 편한 소파를 누가 차지하는가",id=>EV(id,"호텔에서 가장 편한 소파를 누가 차지하는가","CHARACTER_OPEN","light",[
    N(id+"-intro","로비 구석의 푹신한 소파 한쪽만 유난히 눌려 있다. 루시퍼는 지나가다 멈춰 쿠션을 손끝으로 눌러본다.","intro",{effects:reset("20",id)}),
    ...BR(id+"-open",{COLD:"이 소파만 유난히 닳았네. 누가 매일 차지하나 본데.",DISTANT:"푹신하긴 하네. 그래서 늘 비어 있지 않은 거겠지.",NEUTRAL:"이 정도면 호텔에서 가장 인기 있는 자리겠는데. 이름표라도 붙어 있나?",WARM:"오, 이건 생각보다 괜찮네. 누가 먼저 발견했는지에 따라 전쟁이 나겠어.",CLOSE:"여기였군. 찰리가 가끔 사람들 사이에서 잠깐 쉬는 자리. …꽤 편하겠네."}),
    CH(id+"-choice","이 소파를 두고 무슨 이야기를 할까?",[
      O(id+"-first","누가 제일 먼저 차지할 것 같은지 묻는다","light",[
        P(id+"-first-player","누가 제일 먼저 차지할 것 같아요?"),
        ...BR(id+"-first-r",{COLD:"긴 거미. 소파 전체를 침대처럼 쓰겠지.",DISTANT:"거미가 눕고, 작은 애가 소파 밑을 청소하다 같이 차지하겠네.",NEUTRAL:"엔젤이 먼저 눕고, 찰리는 누가 오면 바로 자리를 양보할걸.",WARM:"긴 거미가 다리를 뻗고, 찰리는 옆에 반쯤 걸터앉고, 여자친구는 결국 찰리 옆에 붙겠지.",CLOSE:"엔젤이 먼저 차지해도 찰리가 웃으며 비켜달라면 공간은 생길 거야. 그 애한텐 이상하게 다들 자리를 만들더군."}),
        CH(id+"-first-follow","다른 자리까지 상상해볼까?",[
          O(id+"-husk","허스크는 왜 안 쓰는지 묻는다","neutral",[P(id+"-husk-player","허스크는 이 소파 안 써요?"),...BR(id+"-husk-r",{default:"바텐더 고양이는 바에서 멀어지지 않을걸. 잔 닦는 척 쉬는 쪽이 편하겠지.",WARM:"그 고양이는 소파보다 바 의자에 붙어 있을 거야. 이동하기 귀찮다는 이유로.",CLOSE:"허스크라면 조용한 시간에나 올지도 몰라. 누가 말 걸지 않는다는 보장이 있으면."})]),
          O(id+"-with-husk","허스크 옆에 루시퍼도 앉을지 묻는다","light",[P(id+"-with-husk-player","허스크가 앉아 있으면 옆에 같이 앉을 거예요?"),...BR(id+"-with-husk-r",{COLD:"자리가 넓으면. 굳이 대화할 필요는 없잖아.",DISTANT:"서로 말 안 한다면 가능하지.",NEUTRAL:"조용히 각자 쉬는 거면 나쁘지 않겠네.",WARM:{lines:"그 고양이랑은 서로 말 안 하고 쉬는 게 오히려 편할 것 같아.",delta:1},CLOSE:{lines:"응. 허스크는 침묵을 억지로 채우지 않으니까. 그런 옆자리는 편하지.",delta:1}})])
        ])
      ]),
      O(id+"-take","루시퍼가 먼저 차지하면 된다고 한다","light",[
        P(id+"-take-player","루시퍼가 먼저 차지하면 되잖아요."),
        ...BR(id+"-take-r",{COLD:"왕이 소파 때문에 자리싸움까지 해야 해?",DISTANT:"왕권을 이런 데 쓰면 마몬이 사용료부터 붙일걸.",NEUTRAL:"‘왕실 우선 좌석’ 팻말이라도 붙이라고? 찰리가 바로 떼겠네.",WARM:"하! 드디어 왕권을 쓸 만한 곳을 찾았군. 가장 푹신한 소파 선점권.",CLOSE:"그냥 앉으면 되지. 찰리가 오면 같이 앉고."}),
        CH(id+"-take-follow","소파와 관련해 더 놀려볼까?",[
          O(id+"-history","소파 뒤에 숨었던 일을 놀린다","light",[P(id+"-history-player","소파랑 인연도 있잖아요. 뒤에 숨기도 했고."),...BR(id+"-history-r",{COLD:{lines:"그 장면을 들추는 건 지금 별로 안 웃긴데.",delta:-1},DISTANT:"숨은 게 아니라 전략적으로 엄폐한 거야.",NEUTRAL:"그건 엄폐물이었어. 소파의 기능을 아주 정확히 쓴 거지.",WARM:{lines:"하! 전략적 엄폐였다고. 아주 푹신하고 훌륭한 엄폐.",delta:1},CLOSE:{lines:"맞아, 숨었어. 네가 그렇게 웃을 줄 알았으면 좀 더 우아하게 숨을걸.",delta:1}})]),
          O(id+"-charlie","찰리가 오면 비켜줄 건지 묻는다","supportive",[P(id+"-charlie-player","찰리가 오면 비켜줄 거죠?"),...BR(id+"-charlie-r",{COLD:{lines:"당연하지. 그건 물을 필요도 없어.",effects:[set(id+"-charlie-soft-cold","luc_charlie_soft",true)]},DISTANT:{lines:"응. 찰리 자리라면 바로.",effects:[set(id+"-charlie-soft-dist","luc_charlie_soft",true)]},NEUTRAL:{lines:"비켜주지. 아니면 같이 앉으면 되고.",effects:[set(id+"-charlie-soft-neutral","luc_charlie_soft",true)]},WARM:{lines:"찰리면 굳이 비킬 필요도 없지. 옆에 앉으라고 하면 돼.",effects:[set(id+"-charlie-soft-warm","luc_charlie_soft",true)]},CLOSE:{lines:"응. 다만 찰리가 같이 앉자고 하면 그건 더 좋고.",effects:[set(id+"-charlie-soft-close","luc_charlie_soft",true)]}})])
        ])
      ]),
      O(id+"-owner","결국 이 소파 주인이 누구인지 묻는다","neutral",[
        P(id+"-owner-player","그래서 이 소파 주인은 누구예요?"),
        ...BR(id+"-owner-r",{COLD:{lines:"몰라. 비어 있으면 앉는 사람 거지.",effects:[add(id+"-owner-work-cold","luc_work_avoidance",1)]},DISTANT:{lines:"공식 주인까지 정해야 해? 그냥 먼저 앉아.",effects:[add(id+"-owner-work-dist","luc_work_avoidance",1)]},NEUTRAL:{lines:"이름표도 규칙도 없어. 매일 누가 차지하면 난 다른 소파를 찾을 거고.",effects:[add(id+"-owner-work-neutral","luc_work_avoidance",1)]},WARM:{lines:"오늘은 내 거. 내일 긴 거미가 누워 있으면 팔이랑 다리 좀 접으라고 하지 뭐.",effects:[add(id+"-owner-work-warm","luc_work_avoidance",1)]},CLOSE:{lines:"주인은 없어. 찰리와 여자친구가 앉아 있으면 방해하지 않고, 찰리가 부르면 예외고.",effects:[add(id+"-owner-work-close","luc_work_avoidance",1)]}}),
        N(id+"-sit","루시퍼가 결국 소파 한쪽에 앉아 등을 기대본다.","action"),
        ...BR(id+"-sit-r",{COLD:"…생각보다 괜찮네.",DISTANT:"푹신하긴 하군. 인기 있는 이유는 알겠어.",NEUTRAL:"좋아. 오늘은 내가 먼저 찾았으니 잠깐은 내 자리야.",WARM:["하, 이거 꽤 좋은데?","쿠션 하나만 더 가져오면 완벽하겠어."],CLOSE:["생각보다 훨씬 편하네.","옆은 비워둘게. 앉고 싶으면 앉아."]})
      ])
    ])
  ]));

  replace("지옥에서 평판이 곧 권력인가",id=>EV(id,"지옥에서 평판이 곧 권력인가","PLAYER_ASK","medium",[
    N(id+"-intro","유명 악마들의 얼굴이 실린 잡지가 로비 테이블에 펼쳐져 있다.","intro",{effects:reset("21",id)}),
    P(id+"-player","지옥에서는 이름이 알려지고 무서워하는 사람이 많으면 그것도 권력인 거예요?"),
    ...BR(id+"-open",{COLD:"안 싸우고도 길을 비켜주면 편하긴 하지.",DISTANT:"평판만으로 상대가 먼저 물러나면 힘처럼 쓸 수는 있어.",NEUTRAL:"이름만으로 사람 행동을 바꾸면 그것도 권력의 한 종류지. 전부는 아니지만.",WARM:"그렇지. 싸우기 전에 상대가 계산하게 만드는 힘이니까. 다만 이름만 남고 실속이 비면 오래 못 가.",CLOSE:"평판은 남을 움직이게 해. 그런데 그 이름을 실제로 받쳐줄 힘이나 사람이 없으면 결국 껍데기야."}),
    CH(id+"-choice","평판과 권력 중 무엇을 더 짚을까?",[
      O(id+"-power","평판도 결국 권력인지 다시 묻는다","neutral",[
        P(id+"-power-player","그럼 평판도 결국 권력인 건 맞네요?"),
        ...BR(id+"-power-r",{COLD:"쓸 수 있으면 권력이지. 그 이상은 몰라.",DISTANT:"어느 정도는. 겁먹고 따르는 것도 행동을 바꾸는 일이니까.",NEUTRAL:"맞아. 다만 평판 하나만으로 모든 문이 열리진 않아.",WARM:"맞아. 싸우지 않고도 움직이게 만든다는 점에선 꽤 효율적인 권력이지.",CLOSE:"응. 다만 사람들이 이름을 두려워하는 것과 진심으로 따르는 건 전혀 달라."}),
        CH(id+"-power-follow","평판 말고 또 무엇이 필요할까?",[
          O(id+"-needs","실제로 무엇이 더 필요한지 묻는다","neutral",[
            P(id+"-needs-player","그럼 평판 말고 또 뭐가 필요해요?"),
            ...BR(id+"-needs-r",{default:"힘, 돈, 사람, 계약. 누구냐에 따라 다르지. 내가 오버로드 세력표까지 관리하진 않아.",WARM:"직접 힘일 수도 있고, 돈이나 계약, 자기 편일 수도 있어. 정답표가 하나인 건 아니야.",CLOSE:"버틸 힘과 움직일 사람, 잃기 싫은 것까지. 이름보다 그 뒤에 실제로 남아 있는 게 중요하지."})
          ])
        ])
      ]),
      O(id+"-examples","알래스터와 Vox를 사례로 묻는다","light",[
        P(id+"-examples-player","알래스터나 Vox는요? 둘 다 평판이 권력이 된 경우 아닌가요?"),
        ...BR(id+"-examples-r",{COLD:"둘 다 이름만 큰 건 아니지. 유감스럽게도.",DISTANT:"빨간 사슴도 TV 얼굴도 실제로 쥔 게 있으니 평판만 있는 쪽은 아니야.",NEUTRAL:"둘 다 평판과 실체를 같이 가진 쪽이야. 쓰는 방식이 다를 뿐이지.",WARM:"사슴은 공포를 오래 남겼고, TV는 화면과 회사를 쥐었지. 둘 다 소문만으로 버티는 건 아니야.",CLOSE:"둘 다 자기 이름을 실제 힘에 연결해뒀어. 그래서 보기 싫어도 무시하기 어렵지."}),
        CH(id+"-examples-follow","어느 쪽을 더 물어볼까?",[
          O(id+"-alastor","알래스터를 더 묻는다","light",[P(id+"-alastor-player","알래스터는요?"),...BR(id+"-alastor-r",{default:{lines:"라디오 사슴은 평판도 크고 실제 힘도 있어. 둘 다 가진 쪽이라 더 성가신 거야.",effects:[add(id+"-alastor-irritation","luc_alastor_irritation",1)]},CLOSE:{lines:"사슴 대가리는 오래 사라져도 이름이 남았고, 돌아와서 그 이름이 빈말이 아니란 것도 보여줬지. 마음에 들진 않지만.",effects:[add(id+"-alastor-irritation-close","luc_alastor_irritation",1)]}})]),
          O(id+"-alastor-dislike","그래서 더 싫은 거냐고 묻는다","light",[P(id+"-alastor-dislike-player","그래서 더 싫어요?"),...BR(id+"-alastor-dislike-r",{COLD:{lines:"친한 척 떠보지 마.",delta:-1},DISTANT:"싫은 건 맞지만 질문이랑은 상관없어.",NEUTRAL:"힘이 있어서 싫은 게 아니라 그 힘을 쓰는 꼴이 싫은 거야.",WARM:{lines:"하! 둘 다지. 네가 그걸 굳이 확인하는 건 조금 웃기네.",delta:1},CLOSE:{lines:"응. 힘도 있고 찰리 주변에서 계속 웃고 있으니 더 거슬려.",delta:1}})]),
          O(id+"-vox","Vox를 더 묻는다","neutral",[P(id+"-vox-player","Vox의 영향력은 어느 정도예요?"),...BR(id+"-vox-r",{default:"화면과 회사, 같이 움직이는 놈들이 있다는 건 알아. 정확한 세력 규모를 내가 왜 조사해.",WARM:"얼굴이 많이 보인다는 것만으로 끝나는 놈은 아니야. 그래도 숫자까지 세고 다니진 않아.",CLOSE:{lines:"평소엔 관심 없어. 호텔이나 찰리를 건드리는 순간부터는 얘기가 달라지고.",effects:[set(id+"-vox-protect","luc_charlie_protective",true)]}})])
        ])
      ]),
      O(id+"-self","루시퍼의 평판과 실제 영향력을 묻는다","sensitive",[
        P(id+"-self-player","그럼 루시퍼는요? 왕이라는 평판과 실제 영향력이 같은가요?"),
        ...BR(id+"-self-r",{COLD:"그 논리면 다들 내 말 잘 들어야겠네. 안 그렇잖아.",DISTANT:"왕이라는 이름은 남아 있지. 그걸 얼마나 썼는지는 다른 문제고.",NEUTRAL:"이름과 힘은 있어. 실제로 왕 역할을 얼마나 했냐고 물으면 답이 달라지지만.",WARM:"내 이름이 사라진 건 아니야. 다만 오래 그 이름으로 뭘 움직이진 않았지.",CLOSE:"왕이라는 이름과 실제로 왕 노릇을 한 정도가 같진 않아. 그건 나도 알아."}),
        CH(id+"-self-follow","그 책임까지 물을까?",[
          O(id+"-responsibility","왕인데 너무 관심이 없었다고 지적한다","confrontational",[P(id+"-responsibility-player","왕인데 너무 관심 없이 지낸 거 아니에요?"),...BR(id+"-responsibility-r",{COLD:{lines:"그걸 지금 네가 평가할 자리는 아니지.",delta:-2,effects:[add(id+"-self-tension-cold","luc_t21_tension",1)]},DISTANT:{lines:"모르는 이야기를 너무 쉽게 결론 내리네.",delta:-1,effects:[add(id+"-self-tension-dist","luc_t21_tension",1)]},NEUTRAL:{lines:"관심을 놓은 건 맞아. 그래도 한 문장으로 정리당하고 싶진 않네.",delta:-1},WARM:"틀린 말은 아니야. 그래도 지금 당장 업무 보고를 시작하진 않을 거야.",CLOSE:"응. 성실하게 왕 역할을 했다고는 못 해. 인정한다고 바로 달라지는 건 아니지만."})]),
          O(id+"-leave","평가하지 않고 화제를 돌린다","supportive",[P(id+"-leave-player","그건 여기서 평가하지 않을게요."),...BR(id+"-leave-r",{default:{lines:"…그래. 그게 낫겠네.",delta:1,effects:[set(id+"-leave-close","luc_t21_closed",true)]},CLOSE:{lines:"고마워. 내가 말하고 싶을 때는 조금 더 말할 수도 있으니까.",delta:1,effects:[set(id+"-leave-close2","luc_t21_closed",true)]}})])
        ])
      ])
    ])
  ],{topicFamily:"reputation_power"}));

  replace("힘센 Sinner가 Hellborn 귀족보다 낮은 취급을 받는 문제",id=>EV(id,"힘센 Sinner가 Hellborn 귀족보다 낮은 취급을 받는 문제","PLAYER_ASK","medium",[
    N(id+"-intro","지옥의 오래된 신분표와 오버로드 기사 한 장이 나란히 놓여 있다.","intro",{effects:reset("22",id)}),
    P(id+"-player","힘이 센 죄인도 신분상 Hellborn 귀족보다 아래로 취급되는 거예요?"),
    ...BR(id+"-open",{COLD:"힘이 세다고 귀족 집안에서 태어난 게 되진 않으니까.",DISTANT:"신분과 실제 힘은 다른 표를 쓰지.",NEUTRAL:"공식 서열은 혈통을 보고, 현실은 누가 더 위험한지도 같이 봐.",WARM:"작위가 주먹 대신 맞아주진 않지만, 지옥은 오래된 이름도 꽤 좋아하거든.",CLOSE:"서열표는 귀족을 위에 두고, 실제 방에서는 힘센 죄인을 먼저 의식할 수도 있어. 둘이 늘 같진 않아."}),
    CH(id+"-choice","힘과 신분 중 무엇을 더 볼까?",[
      O(id+"-difference","힘과 신분이 어떻게 다른지 묻는다","neutral",[P(id+"-difference-player","힘과 신분은 정확히 어떻게 달라요?"),...BR(id+"-difference-r",{default:"강하다고 가문이나 작위가 생기는 건 아니야. 반대로 작위가 싸움까지 대신해주지도 않고.",WARM:"태어난 위치와 실제로 할 수 있는 일은 별개야. 둘이 겹치면 편하고, 안 겹치면 주변이 계산을 시작하지.",CLOSE:"신분은 제도가 붙인 자리이고 힘은 현실에서 행사할 수 있는 거야. 지옥은 둘 다 보면서도 하나인 척하지."})]),
      O(id+"-unfair","태어난 것만으로 대우가 달라지는 게 불공평하다고 한다","neutral",[
        P(id+"-unfair-player","태어난 것만으로 대우가 달라지는 건 불공평하지 않아요?"),
        ...BR(id+"-unfair-r",{COLD:"공평하다고 한 적 없어. 오래됐다고 옳은 것도 아니고.",DISTANT:"익숙한 구조라는 것과 좋은 구조라는 건 다르지.",NEUTRAL:"공평하다고 하긴 어렵지. 다만 오래 굳은 구조는 질문 하나로 바로 안 움직여.",WARM:"맞아. 태어난 이름이 먼저 문을 여는 건 공평하지 않아. 지옥은 그런 모순을 오래 끌고 왔고.",CLOSE:"나도 공평하다고 생각하진 않아. 다만 그걸 안다고 내가 오늘 제도 개편안을 쓰겠다는 뜻도 아니야."}),
        CH(id+"-unfair-follow","왕의 책임까지 묻을까?",[
          O(id+"-change","왕이면 바꿔야 한다고 압박한다","confrontational",[P(id+"-change-player","그럼 왕이면 바꿔야죠."),...BR(id+"-change-r",{COLD:{lines:"당장 내 책상에 법안 올리라는 소리야? 쉽게 말하네.",delta:-2,effects:[add(id+"-change-work-cold","luc_work_avoidance",1),add(id+"-change-ten-cold","luc_t22_tension",1)]},DISTANT:{lines:"구조 하나를 오늘 대화로 갈아엎으라고? 아니.",delta:-2,effects:[add(id+"-change-work-dist","luc_work_avoidance",1),add(id+"-change-ten-dist","luc_t22_tension",1)]},NEUTRAL:{lines:"바꿔야 할 부분이 있다는 것과 내가 지금 전부 맡는 건 다른 얘기야.",delta:-1,effects:[add(id+"-change-work-neutral","luc_work_avoidance",1)]},WARM:{lines:"틀린 말은 아닌데, 내가 갑자기 개혁 위원장이 되진 않아.",effects:[add(id+"-change-work-warm","luc_work_avoidance",1)]},CLOSE:{lines:"책임이 없다고 하진 않을게. 그래도 즉석에서 약속하고 미루는 것보다 모른다고 말하는 게 낫지.",effects:[add(id+"-change-work-close","luc_work_avoidance",1)]}})]),
          O(id+"-recognize","문제라는 걸 인정한 것으로 충분하다고 한다","supportive",[P(id+"-recognize-player","적어도 문제라는 건 알고 있네요."),...BR(id+"-recognize-r",{default:"보이는 걸 안 보인다고 할 생각은 없어.",WARM:{lines:"응. 바로 고치겠다는 빈말보다 그 정도가 지금은 정확해.",delta:1},CLOSE:{lines:"알아. 그리고 네가 당장 답을 강요하지 않아서 말하기도 편하네.",delta:1}})])
        ])
      ]),
      O(id+"-status","지위를 잃으면 실제 대우도 바뀌는지 묻는다","neutral",[
        P(id+"-status-player","귀족이나 오버로드가 지위를 잃으면 대우도 바로 바뀌어요?"),
        ...BR(id+"-status-r",{default:"이름 뒤 작위가 사라지면 고개 숙이던 놈들부터 자세를 바꾸지. 힘이 남아 있으면 조금 늦어질 뿐이고.",WARM:"지위만 믿고 붙어 있던 쪽은 빨리 떠나. 실제 힘이나 관계가 남았으면 대우가 전부 사라지진 않고.",CLOSE:"호칭이 사라진 순간 태도가 바뀌는 걸 오래 봤어. 그래서 직함보다 끝까지 남는 걸 더 보게 되지."}),
        CH(id+"-status-follow","구체 사례까지 요구할까?",[
          O(id+"-seen","그런 경우를 많이 봤는지 묻는다","sensitive",[P(id+"-seen-player","그런 경우 많이 봤어요?"),...BR(id+"-seen-r",{COLD:"오래 살았으니 봤지. 명단까지 내놓진 않을 거야.",DISTANT:"봤어. 구체적인 사례는 여기까지고.",NEUTRAL:"몇 번은. 권력보다 주변 표정이 먼저 바뀌더군.",WARM:"충성이라고 부르던 게 직함과 같이 사라지는 장면은 드물지 않았어.",CLOSE:"응. 그래서 누가 자리를 보고 남았는지, 사람을 보고 남았는지 구분하게 됐지."})])
        ])
      ]),
      O(id+"-interest","루시퍼가 이 구조에 관심 있는지 묻는다","sensitive",[P(id+"-interest-player","루시퍼는 이 구조에 관심이 있어요?"),...BR(id+"-interest-r",{COLD:"이상한 건 보여도 내가 매일 붙잡을 문제는 아니야.",DISTANT:"알고는 있어. 직접 관리하고 싶다는 뜻은 아니고.",NEUTRAL:"관심과 개입은 달라. 구조는 보이지만 매일 손댈 생각은 없어.",WARM:"문제가 있다는 건 알아. 그렇다고 내가 회의와 규칙표를 붙들 사람은 아니고.",CLOSE:"신경을 완전히 끈 건 아니야. 다만 찰리처럼 매일 바꾸려고 달려들 자신도 없지."})])
    ])
  ]));

  replace("호텔의 성공으로 오버로드 체제가 약해질 가능성",id=>EV(id,"호텔의 성공으로 오버로드 체제가 약해질 가능성","PLAYER_ASK","medium",[
    N(id+"-intro","호텔 홍보물 옆에 오버로드 기업 광고지가 겹쳐 놓여 있다.","intro",{effects:reset("23",id)}),
    P(id+"-player","호텔이 계속 성공하면 오버로드들한테도 영향이 갈까요?"),
    ...BR(id+"-open",{COLD:"몇 놈한텐 영향이 갈지 몰라도 체제 전체는 모르지.",DISTANT:"죄인들이 다른 선택지를 갖게 되면 계약을 쥔 쪽도 신경은 쓰겠지.",NEUTRAL:"영향은 있을 수 있어. 다만 호텔 하나가 곧바로 체제 전체를 무너뜨린다고 단정하진 마.",WARM:"다른 길이 실제로 생기면 오버로드들도 예전처럼 당연하게 굴 순 없겠지. 어디까지인지는 아직 몰라.",CLOSE:"찰리 호텔이 선택지를 만들 수는 있어. 다만 그 애한테 지옥 권력 구조 전체를 바꾸라는 짐까지 얹고 싶진 않아."}),
    CH(id+"-choice","호텔의 성공이 무엇을 바꿀지 물어볼까?",[
      O(id+"-weaken","새 선택지가 오버로드를 약하게 만들지 묻는다","neutral",[P(id+"-weaken-player","죄인한테 다른 선택지가 생기면 오버로드가 약해질 수도 있죠?"),...BR(id+"-weaken-r",{default:"몇 계약과 세력에는 영향이 있겠지. 체제 전체가 자동으로 무너지는 건 아니고.",WARM:"가능성은 있어. 선택지가 없을 때 강한 계약은 다른 길이 생기면 예전만큼 절대적이지 않을 테니까.",CLOSE:"응. 적어도 ‘이 방법밖에 없다’는 말은 약해질 수 있어. 그게 찰리가 만들고 싶은 변화겠지."})]),
      O(id+"-contract","구원된 죄인의 영혼 계약이 어떻게 되는지 묻는다","sensitive",[P(id+"-contract-player","영혼 계약이 있는 죄인이 구원되면 계약은 어떻게 돼요?"),...BR(id+"-contract-r",{default:{lines:"몰라. 실제로 확인된 적 없는 문제야. 자동으로 풀린다고 말할 근거도 없어.",effects:[set(id+"-unknown-contract","luc_unknown_contract_redemption",true)]},WARM:{lines:"그건 나도 몰라. 엔젤 같은 경우라면 찰리가 반드시 알아보려 하겠지만, 아직 답을 만들 순 없어.",effects:[set(id+"-unknown-contract-warm","luc_unknown_contract_redemption",true)]},CLOSE:{lines:"모른다고 말하는 게 정확해. 찰리가 도와주고 싶어 하는 마음과 계약 규칙이 확인됐다는 건 다른 일이니까.",effects:[set(id+"-unknown-contract-close","luc_unknown_contract_redemption",true)]}})]),
      O(id+"-vees","Vees와 다른 오버로드가 호텔을 신경 쓰는 이유를 묻는다","neutral",[P(id+"-vees-player","Vees 같은 오버로드가 호텔을 계속 신경 쓰는 이유는 뭘까요?"),...BR(id+"-vees-r",{COLD:"걔들한테 물어봐. 내가 속마음 분석까지 해줘야 해?",DISTANT:"TV 얼굴이 호텔을 자기 식으로 이용하려는 건 보여. 무서워하는지까진 몰라.",NEUTRAL:"호텔이 관심과 이야기를 가져가니 이용하거나 비틀려 하겠지. 감정까지 단정하진 않을 거야.",WARM:"복스는 화면에 잡히는 걸 자기 방식으로 통제하고 싶어 보이더군. 그게 두려움인지 욕심인지는 본인 몫이고.",CLOSE:"호텔을 건드리며 뭘 얻으려는 건 확실해. 다만 걔 속을 읽는 데 내 시간을 쓰고 싶진 않아."})]),
      O(id+"-want","오버로드들이 약해지길 바라는지 묻는다","sensitive",[
        P(id+"-want-player","루시퍼는 오버로드들이 약해졌으면 좋겠어요?"),
        ...BR(id+"-want-r",{COLD:"몇 놈 덜 설치면 조용하긴 하겠지.",DISTANT:"체제 전체를 뜯어고칠 계획은 없어. 위험한 놈이 줄면 나쁠 건 없고.",NEUTRAL:"약해지는 것보다 죄인들이 선택권을 갖는 쪽이 더 중요하지.",WARM:"찰리 호텔이 누군가의 목줄을 느슨하게 만든다면 그건 좋은 일이야. 내가 정복전을 할 생각은 없지만.",CLOSE:"찰리가 사람들에게 다른 길을 보여줄 수 있다면 바라지. 다만 그 애가 오버로드 전부와 싸워야 한다는 뜻은 아니야."}),
        CH(id+"-want-follow","도움을 요구할까?",[
          O(id+"-help","루시퍼도 도우라고 한다","confrontational",[P(id+"-help-player","그럼 루시퍼도 좀 도와줘요."),...BR(id+"-help-r",{COLD:{lines:"내가 죄인 계약을 전부 풀 수 있는 척하지 마.",delta:-1},DISTANT:{lines:"할 수 있는 범위도 모르면서 쉽게 맡기네.",delta:-1},NEUTRAL:"찰리가 요청하고 실제로 할 수 있는 일이면 보지. 약속부터 하진 않아.",WARM:"찰리에게 위험이 생기면 나설 거야. 체제 개혁 담당은 아니고.",CLOSE:{lines:"찰리가 위험해지면 먼저 움직여. 그래도 그 애의 일을 내가 전부 대신하진 않을 거야.",effects:[set(id+"-help-protect","luc_charlie_protective",true)]}})]),
          O(id+"-burden","찰리에게 부담을 얹지 말자고 한다","supportive",[P(id+"-burden-player","호텔이 성공해도 찰리 혼자 체제까지 바꿀 필요는 없죠."),...BR(id+"-burden-r",{default:"그래. 그건 그 애한테 너무 큰 짐이야.",WARM:{lines:"맞아. 찰리는 사람을 돕는 일만으로도 충분히 많은 걸 하고 있어.",delta:1},CLOSE:{lines:"응. 그 말을 알아줘서 고마워. 찰리 꿈을 또 다른 의무로 만들고 싶진 않아.",delta:1,effects:[set(id+"-burden-soft","luc_charlie_soft",true)]}})])
        ])
      ])
    ])
  ]));

  replace("천사가 호텔에 장기 체류한다면 어떤 문제가 생길까",id=>EV(id,"천사가 호텔에 장기 체류한다면 어떤 문제가 생길까","PLAYER_ASK","high",[
    N(id+"-intro","호텔 투숙 명단의 빈칸 옆에 금빛 깃털 하나가 끼워져 있다.","intro",{effects:reset("24",id)}),
    P(id+"-player","천사가 며칠이 아니라 호텔에 오래 살게 되면 어떨 것 같아요?"),
    ...BR(id+"-open",{COLD:"시선과 소문부터 몰리겠지. 친절하다고 다 잊는 곳은 아니니까.",DISTANT:"호텔 사람들도 경계할 거고, 천사 쪽에서도 가만두진 않겠지.",NEUTRAL:"생활 방식보다 서로를 보는 시선이 먼저 문제일 거야. 과거가 사라지는 건 아니니까.",WARM:"적응 자체는 가능하겠지만 천사 한 명이 친절하다고 오래된 일을 전부 잊을 순 없어.",CLOSE:"잘 지낼 수도 있어. 그래도 그 존재만으로 누군가는 경계하고, 나처럼 낯설어하는 사람도 있겠지."}),
    CH(id+"-choice","장기 체류에서 무엇을 먼저 생각할까?",[
      O(id+"-problem","가장 먼저 생길 문제를 묻는다","neutral",[P(id+"-problem-player","가장 먼저 생길 문제는 뭐예요?"),...BR(id+"-problem-r",{default:"시선, 소문, 경계. 방 배정보다 그 셋이 먼저겠지.",WARM:"서로 당연하다고 생각하는 생활 방식부터 다를 거야. 작은 오해가 오래된 불신을 건드릴 수도 있고.",CLOSE:"새 천사가 선의로 와도 호텔 사람들이 바로 믿을 의무는 없어. 반대로 그 천사도 지옥에 익숙할 리 없고."})]),
      O(id+"-emily","Emily라면 잘 적응할 것 같다고 한다","light",[
        P(id+"-emily-player","Emily라면 신나서 잘 적응할 것 같은데요."),
        ...BR(id+"-emily-r",{COLD:"질문하면서 온 호텔을 돌아다니겠지. 조용하진 않겠네.",DISTANT:"그 애라면 겁보다 호기심이 먼저일 것 같긴 해.",NEUTRAL:"응. 찰리랑 금방 뭔가 프로그램부터 만들지도 모르지.",WARM:"하! 분명 하루 만에 질문 목록을 열 장 만들고 찰리랑 온 호텔을 뛰어다닐걸.",CLOSE:"잘 적응하겠지. 내가 떠난 뒤 만들어진 천사가 찰리와 웃으며 여기 사는 건… 이상하지만 나쁜 장면은 아닐 거야."}),
        CH(id+"-emily-follow","천국 질문까지 이어갈까?",[
          O(id+"-answer","루시퍼에게 천국 질문도 답해줄지 묻는다","sensitive",[P(id+"-answer-player","Emily가 천국 질문을 많이 하면 그래도 답해줄 거죠?"),...BR(id+"-answer-r",{COLD:{lines:"내가 답하고 싶은 것만. 질문한다고 전부 내놓을 의무는 없어.",delta:-1},DISTANT:{lines:"아는 것과 말하고 싶은 것만. 천국 역사 수업은 안 해.",delta:-1},NEUTRAL:"말할 수 있는 건 답하겠지. 나머지는 모른다고 하거나 넘길 거고.",WARM:"그 애가 정말 궁금해서 묻는다면 몇 가지는 말해줄 수 있어. 전부는 아니야.",CLOSE:{lines:"응. 내가 말할 수 있는 범위라면. 그 애가 내 과거를 책임질 사람도 아니니까 천천히 말하면 되겠지.",delta:1}})]),
          O(id+"-avoid","불편해서 피하는 거라고 단정한다","confrontational",[P(id+"-avoid-player","결국 불편해서 피하는 거죠?"),...BR(id+"-avoid-r",{COLD:{lines:"내 감정을 네가 대신 결론 내리지 마.",delta:-2,effects:[add(id+"-avoid-push-cold","luc_t24_push",1),add(id+"-avoid-ten-cold","luc_t24_tension",1)]},DISTANT:{lines:"불편한 건 맞아도 네가 단정할 일은 아니야.",delta:-1,effects:[add(id+"-avoid-push-dist","luc_t24_push",1),add(id+"-avoid-ten-dist","luc_t24_tension",1)]},NEUTRAL:{lines:"피하는 순간도 있겠지. 그 말로 전부 설명되진 않아.",delta:-1},WARM:"불편해서 미루는 것도 있어. 그래도 그 애를 싫어해서는 아니야.",CLOSE:"응, 불편해서 피할 때가 있어. 하지만 내 불편함을 그 애 잘못으로 만들진 않을 거야."})]),
          O(id+"-respect","대답하기 싫은 건 넘기자고 한다","supportive",[P(id+"-respect-player","대답하기 싫은 건 넘겨도 돼요."),...BR(id+"-respect-r",{default:{lines:"…그럼 훨씬 낫겠네.",delta:1,effects:[set(id+"-respect-close","luc_t24_closed",true)]},CLOSE:{lines:"고마워. 그런 식이면 내가 먼저 말할 수 있는 것도 생길 거야.",delta:1,effects:[set(id+"-respect-close2","luc_t24_closed",true)]}})])
        ])
      ]),
      O(id+"-vaggie","찰리 여자친구도 천사 출신이라고 한다","neutral",[P(id+"-vaggie-player","이미 호텔에 천사 출신인 배기도 있잖아요."),...BR(id+"-vaggie-r",{COLD:"매기—찰리 여자친구는 이미 여기 생활에 익숙하잖아.",DISTANT:"찰리 여자친구는 새로 내려온 천사랑 경우가 달라.",NEUTRAL:"베기? 매기? 아무튼 그 애는 이미 지옥과 호텔 사람들을 알아. 새 천사는 처음부터 배워야 하고.",WARM:"찰리 여자친구가 새 천사 적응을 도우면 좋겠네. 나한테 오는 질문도 절반은 줄 테고.",CLOSE:"그 애는 호텔을 자기 자리로 선택했지. 새로 온 천사가 같은 선택을 하는 데는 시간이 필요할 거야."})]),
      O(id+"-uncomfortable","천사가 오래 머무는 게 불편한지 묻는다","sensitive",[P(id+"-uncomfortable-player","루시퍼는 천사가 오래 머무는 게 불편해요?"),...BR(id+"-uncomfortable-r",{COLD:"천사라는 이유로 쫓아낼 생각은 없어. 그걸로 충분하지.",DISTANT:"조금 이상하겠지. 그래도 그 천사 잘못은 아니야.",NEUTRAL:"낯설고 조금 불편할 수는 있어. 그 감정을 당사자한테 떠넘기진 않을 거고.",WARM:"내가 떠난 뒤 만들어진 천사가 여기서 아무렇지 않게 지내는 건 꽤 낯설 것 같아.",CLOSE:"낯설고 복잡하겠지. 그래도 그 애가 여기 있고 싶다면 내 과거 때문에 내쫓고 싶진 않아."})])
    ])
  ],{topicFamily:"heaven_sensitive"}));

  replace("Lute를 호텔에 들여보낼 수 있는가",id=>EV(id,"Lute를 호텔에 들여보낼 수 있는가","EVENT","high",[
    N(id+"-intro","천국 방문객 후보 메모에 ‘Lute’라는 이름이 적혀 있다. 루시퍼의 손끝이 그 줄에서 멈춘다.","intro",{effects:[...reset("25",id),set(id+"-protect","luc_charlie_protective",true)]}),
    ...BR(id+"-open",{COLD:"호텔을 공격했던 애를 손님처럼 들이겠다고? 목적부터 밝혀.",DISTANT:"그 이름은 평범한 방문객 명단에 넣을 수 없어.",NEUTRAL:"들일지 말지보다 왜 오는지부터 확인해야 해. 안전 문제니까.",WARM:"찰리가 만나고 싶다고 해도 목적과 조건은 먼저 볼 거야. 혼자 두고 싶진 않고.",CLOSE:"찰리 결정은 존중해. 그래도 호텔을 공격했던 사람을 그 애 옆에 아무 확인 없이 세우진 않을 거야."}),
    CH(id+"-choice","Lute의 방문을 어떻게 판단할까?",[
      O(id+"-ban","아예 들이면 안 되는지 묻는다","neutral",[
        P(id+"-ban-player","아예 들이면 안 된다고 생각해요?"),
        ...BR(id+"-ban-r",{COLD:"공격했던 인물이야. 문부터 열 이유는 없어.",DISTANT:"목적을 모르면 들이지 않아. 호불호 문제가 아니야.",NEUTRAL:"무조건 금지라고 단정하진 않아도 안전 확인 없이 입장시킬 순 없어.",WARM:"방문 목적을 먼저 확인하고 찰리가 정말 만나고 싶은지도 물어야지.",CLOSE:"찰리가 대화를 원한다면 막진 않아. 대신 조건을 확인하고 가까이 있을 거야."}),
        CH(id+"-ban-follow","찰리가 대화를 원한다면?",[
          O(id+"-talk","진짜 찰리와 대화하러 온 경우를 묻는다","sensitive",[P(id+"-talk-player","진짜 찰리와 대화하러 오는 거라면요?"),...BR(id+"-talk-r",{default:{lines:"찰리가 직접 만나고 싶다고 하면 존중해. 그래도 혼자 두진 않아.",effects:[set(id+"-talk-protect","luc_charlie_protective",true)]},CLOSE:{lines:"찰리가 선택하면 문은 열 수 있어. 난 근처에 있고, 찰리가 그만하고 싶다는 순간 끝낼 거야.",effects:[set(id+"-talk-protect-close","luc_charlie_protective",true)]}})])
        ])
      ]),
      O(id+"-vaggie","찰리 여자친구와 다시 충돌할 가능성을 묻는다","neutral",[
        P(id+"-vaggie-player","배기와 다시 충돌할 가능성도 높죠?"),
        ...BR(id+"-vaggie-r",{COLD:"높지. 둘 사이를 내가 모른 척할 이유도 없고.",DISTANT:"찰리 여자친구가 경계하는 건 당연해. 과거가 있으니까.",NEUTRAL:"충돌 가능성은 높아. 둘 다 같은 방에 세우기 전에 찰리 의사부터 볼 거야.",WARM:"매기인지 베기인지 그 애가 무기를 드는 건 이해해. 다만 찰리까지 가운데 끼게 두진 않아.",CLOSE:"찰리 여자친구가 경계하는 걸 과민 반응이라고 부르진 않을 거야. 위험해지면 내가 끼고."}),
        CH(id+"-vaggie-follow","중재를 맡길까?",[
          O(id+"-mediate","루시퍼가 무조건 중재하라고 한다","confrontational",[P(id+"-mediate-player","그럼 루시퍼가 둘을 무조건 중재해야겠네요."),...BR(id+"-mediate-r",{COLD:{lines:"왜 모든 싸움의 진행요원을 나한테 맡겨?",delta:-1},DISTANT:"무조건은 아니야. 찰리까지 위험해질 때 끼는 거지.",NEUTRAL:"당사자들이 말로 끝낼 수 있으면 두고 봐. 선을 넘으면 막고.",WARM:"찰리까지 휘말리면 바로 끼어들어. 그 전엔 둘 선택도 존중해야지.",CLOSE:"찰리 안전이 걸리면 망설이지 않아. 그래도 그 애들 대신 모든 말을 정하진 않을 거야."})])
        ])
      ]),
      O(id+"-charlie","찰리가 들어오게 하자고 하면 어떡할지 묻는다","sensitive",[P(id+"-charlie-player","찰리가 일단 들어오게 하자고 하면요?"),...BR(id+"-charlie-r",{COLD:"찰리 호텔이니까 결정은 듣지. 경계까지 버리진 않아.",DISTANT:"찰리 선택은 존중해. 관찰하는 건 내 선택이고.",NEUTRAL:"들어오게 할 수는 있어. 목적과 퇴장 조건은 분명히 하고.",WARM:"찰리가 기회를 주고 싶다면 막지 않아. 대신 혼자 감당하게 두진 않을 거야.",CLOSE:"찰리를 믿어서 문은 열 수 있어. Lute를 믿어서가 아니라."})]),
      O(id+"-change","Lute가 달라졌다면 기회를 줄 수 있는지 묻는다","neutral",[P(id+"-change-player","Lute가 정말 달라졌다면 기회를 줄 수 있어요?"),...BR(id+"-change-r",{COLD:"말만으로는 못 믿어. 행동부터 보여.",DISTANT:"달라졌다는 증거가 먼저야. 믿어줄 의무는 없어.",NEUTRAL:"행동이 달라졌다면 판단도 바뀔 수는 있어. 바로 신뢰하진 않고.",WARM:"기회는 가능해. 하지만 찰리에게 다시 위험이 되는 순간 끝이야.",CLOSE:"찰리가 보고 판단할 기회는 줄 수 있어. 경계가 사라진다는 뜻은 아니야."})])
    ])
  ]));

  replace("지옥에서 왕족의 존재가 정말 필요한가",id=>EV(id,"지옥에서 왕족의 존재가 정말 필요한가","PLAYER_ASK","high",[
    N(id+"-intro","오래된 지옥 계급도의 맨 위에 왕가 문장이 찍혀 있다.","intro",{effects:reset("26",id)}),
    P(id+"-player","지옥에 왕족이 꼭 필요한가요?"),
    ...BR(id+"-open",{COLD:"내가 오래 제대로 왕 노릇 안 했는데도 지옥은 굴러갔잖아.",DISTANT:"필요하다고 자신 있게 말하긴 어렵네.",NEUTRAL:"상징과 조정 역할은 있었지. 꼭 왕족이어야 하는지는 다른 질문이고.",WARM:"솔직히 존재 자체가 반드시 필요하다고 확신하진 않아.",CLOSE:"내가 오래 자리를 비운 동안에도 각자 굴러갔어. 그 사실 앞에서 왕족이 꼭 필요하다고 우기긴 어렵지."}),
    CH(id+"-choice","왕족과 루시퍼의 책임 중 무엇을 물을까?",[
      O(id+"-needed","왕족이 정말 필요한지 재차 묻는다","sensitive",[
        P(id+"-needed-player","그럼 정말 없어도 된다는 뜻이에요?"),
        ...BR(id+"-needed-r",{COLD:"결론을 대신 만들어내진 마. 확신이 없다고 했어.",DISTANT:"없어도 된다고 선언한 건 아니야. 필요성을 당연하게 보진 않는다는 거지.",NEUTRAL:"지금 답 하나로 왕정을 없애거나 지킬 생각은 없어.",WARM:"필요성에 의문은 있어. 그걸 바로 결론으로 바꿀 준비는 안 됐고.",CLOSE:"확신이 없다는 게 가장 정확해. 책임을 피하려는 말로만 들릴 수 있다는 것도 알아."}),
        CH(id+"-needed-follow","그 대답의 책임을 지적할까?",[
          O(id+"-irresponsible","무책임한 대답이라고 한다","confrontational",[P(id+"-irresponsible-player","너무 무책임한 대답 아닌가요?"),...BR(id+"-irresponsible-r",{COLD:{lines:"그 말 듣자고 솔직해진 건 아니야.",delta:-2,effects:[add(id+"-irr-ten-cold","luc_t26_tension",1)]},DISTANT:{lines:"쉽게 단정하는 쪽이 더 책임 있어 보이진 않는데.",delta:-1,effects:[add(id+"-irr-ten-dist","luc_t26_tension",1)]},NEUTRAL:{lines:"틀린 지적은 아니어도 그렇게 몰아붙이면 답하고 싶진 않아.",delta:-1},WARM:"무책임하게 들릴 수 있지. 그래도 거짓 확신보단 나아.",CLOSE:"틀린 말은 아니야. 내가 오래 피한 결과니까. 그래도 오늘 당장 답을 꾸며내진 않을게."})]),
          O(id+"-honest","확신 없다는 답을 받아들인다","supportive",[P(id+"-honest-player","확신 없다는 것도 답이긴 하네요."),...BR(id+"-honest-r",{default:"그래. 적어도 지금은 그게 제일 정확해.",WARM:{lines:"응. 결론을 강요하지 않으니 오히려 더 생각할 수 있겠네.",delta:1},CLOSE:{lines:"고마워. 내가 모르는 걸 모른다고 해도 되는 대화는 드물거든.",delta:1}})])
        ])
      ]),
      O(id+"-who","루시퍼가 일을 안 할 때 누가 움직이는지 묻는다","sensitive",[P(id+"-who-player","루시퍼가 일을 안 할 때는 누가 움직여요?"),...BR(id+"-who-r",{COLD:"사탄과 나머지가 자기 영역을 굴려. 그렇다고 사탄이 왕은 아니고.",DISTANT:"칠죄종은 각자 링을 관리해. 내가 없다고 한 명이 전부 대신하는 구조는 아니야.",NEUTRAL:"사탄을 포함한 칠죄종이 자기 영역을 움직였지. 지옥 전체를 한 사람이 대신한 건 아니고.",WARM:"각자 자기 링은 굴렸어. 내가 그걸 자랑처럼 말할 처지는 아니지만.",CLOSE:"칠죄종이 각자 버텼지. 내가 빠진 자리를 한 명이 왕처럼 채운 게 아니라, 모두가 자기 몫을 계속한 거야."}),
        CH(id+"-who-follow","루시퍼가 한 일을 직접 추궁할까?",[
          O(id+"-what","대체 무엇을 했는지 묻는다","confrontational",[P(id+"-what-player","그럼 당신은 대체 뭘 했는데요?"),...BR(id+"-what-r",{COLD:{lines:"업무 감사라도 나왔어? 그만해.",delta:-3,effects:[add(id+"-what-ten-cold","luc_t26_tension",1),add(id+"-what-push-cold","luc_t26_push",1)]},DISTANT:{lines:"내 삶 전체를 보고서처럼 내놓진 않아.",delta:-2,effects:[add(id+"-what-ten-dist","luc_t26_tension",1),add(id+"-what-push-dist","luc_t26_push",1)]},NEUTRAL:{lines:"많이 놓았어. 그래도 네가 요구하는 방식으로 업무 내역을 공개하진 않을 거야.",delta:-1},WARM:{lines:"해야 할 만큼 하지 못했어. 즐거운 질문은 아니네.",delta:-1},CLOSE:"많이 피했고, 오래 손을 놓았어. 그 이상을 지금 전부 설명하진 않을게."})]),
          O(id+"-stop","업무 추궁을 멈춘다","supportive",[P(id+"-stop-player","업무 내역까지 물을 건 아니었어요."),...BR(id+"-stop-r",{default:{lines:"…그래. 여기서 멈추자.",delta:1,effects:[set(id+"-stop-close","luc_t26_closed",true)]},CLOSE:{lines:"고마워. 인정할 건 인정해도 심문받고 싶진 않으니까.",delta:1,effects:[set(id+"-stop-close2","luc_t26_closed",true)]}})])
        ])
      ]),
      O(id+"-privilege","왕족의 특권이 불공평하다고 한다","neutral",[
        P(id+"-privilege-player","왕족의 특권은 불공평하지 않아요?"),
        ...BR(id+"-privilege-r",{default:"불공평하지 않다고 우길 생각은 없어. 나도 그 꼭대기에 있고.",WARM:"맞아. 태어난 이름만으로 가진 게 있다는 건 사실이야.",CLOSE:"응. 내가 가장 위에 있다는 지적도 틀리지 않아. 그 사실을 인정하는 것과 바로 없애는 건 다른 문제지만."}),
        CH(id+"-privilege-follow","변화를 요구할까?",[
          O(id+"-abolish","바꿀 생각이 없는지 묻는다","confrontational",[P(id+"-abolish-player","그럼 바꿀 생각은 없어요?"),...BR(id+"-abolish-r",{COLD:{lines:"오늘 당장 왕정 폐지안이라도 쓰라고? 싫어.",delta:-2,effects:[add(id+"-abolish-work-cold","luc_work_avoidance",1)]},DISTANT:{lines:"질문 하나로 제도 개편 약속을 받아내진 마.",delta:-1,effects:[add(id+"-abolish-work-dist","luc_work_avoidance",1)]},NEUTRAL:{lines:"생각이 없는 것과 계획이 없는 건 달라. 지금 계획은 없어.",delta:-1,effects:[add(id+"-abolish-work-neutral","luc_work_avoidance",1)]},WARM:{lines:"바꿀 필요가 있는 부분은 있겠지. 내가 지금 회의표부터 만들진 않아.",effects:[add(id+"-abolish-work-warm","luc_work_avoidance",1)]},CLOSE:{lines:"언젠가 답해야 할 문제라는 건 알아. 오늘 빈 약속으로 끝내고 싶진 않아.",effects:[add(id+"-abolish-work-close","luc_work_avoidance",1)]}})])
        ])
      ]),
      O(id+"-charlie","찰리도 왕족인데 어떻게 생각하는지 묻는다","sensitive",[
        P(id+"-charlie-player","찰리도 왕족인데, 찰리에 대해서는 어떻게 생각해요?"),
        ...BR(id+"-charlie-r",{default:{lines:"공주가 아니어도 찰리는 찰리야. 그 애 가치는 직함에서 안 나와.",effects:[set(id+"-charlie-soft","luc_charlie_soft",true)]},CLOSE:{lines:"찰리가 왕족이라 특별한 게 아니야. 그 애라서 특별하지.",effects:[set(id+"-charlie-soft-close","luc_charlie_soft",true)]}}),
        CH(id+"-charlie-follow","찰리와 루시퍼를 비교할까?",[
          O(id+"-compare","찰리가 왕보다 더 열심히 지옥을 바꾼다고 한다","confrontational",[P(id+"-compare-player","찰리가 왕보다 더 열심히 지옥을 바꾸는 것 같아요."),...BR(id+"-compare-r",{COLD:{lines:"찰리를 칭찬하는 척 나를 깎아내리지 마.",delta:-3,effects:[add(id+"-compare-ten-cold","luc_t26_tension",1)]},DISTANT:{lines:"비교해서 누구 하나를 찌르는 방식은 마음에 안 들어.",delta:-2,effects:[add(id+"-compare-ten-dist","luc_t26_tension",1)]},NEUTRAL:{lines:"찰리가 열심히 하는 건 맞아. 굳이 그 말에 나를 붙이지 마.",delta:-1},WARM:"반박하기 어렵네. 그래도 찰리에게 왕 역할까지 떠넘기진 마.",CLOSE:"맞아. 그 애는 나보다 오래 포기하지 않았어. 그래서 자랑스럽고, 미안하지."})]),
          O(id+"-praise","찰리 개인의 노력을 칭찬한다","supportive",[P(id+"-praise-player","왕족이라서가 아니라 찰리가 열심히 하는 게 대단한 거죠."),...BR(id+"-praise-r",{default:{lines:"그래. 그 말이면 충분해.",delta:1},CLOSE:{lines:"응. 찰리를 직함 없이 봐줘서 고마워.",delta:1,effects:[set(id+"-praise-soft","luc_charlie_soft",true)]}})])
        ])
      ])
    ])
  ],{topicFamily:"royal_duty_sensitive"}));

  replace("호텔이 아니라 Hellborn용 상담소가 생긴다면 갈 의향이 있는가",id=>EV(id,"호텔이 아니라 Hellborn용 상담소가 생긴다면 갈 의향이 있는가","PLAYER_ASK","high",[
    N(id+"-intro","Hellborn 전용 상담소 전단이 다른 광고지 사이에 끼워져 있다.","intro",{effects:reset("27",id)}),
    P(id+"-player","Hellborn용이긴 한데 특별히 받아준다면 상담 받아볼 생각 있어요?"),
    ...BR(id+"-open",{COLD:"왜 내가 가야 하는데?",DISTANT:"구체적으로 뭘 하는 곳인지부터 봐야지.",NEUTRAL:"가서 처음부터 내 얘기를 설명하라고 하면 별로인데.",WARM:"한 번 정도는… 뭘 하는지 들어볼 수는 있겠네.",CLOSE:"완전히 싫다고 하진 않을게. 다만 내가 말할 범위는 내가 정해."}),
    CH(id+"-choice","상담에 관해 어디까지 물을까?",[
      O(id+"-visit","한번 가볼지 묻는다","neutral",[
        P(id+"-visit-player","정말 받아준다면 한 번은 가볼래요?"),
        ...BR(id+"-visit-r",{COLD:"전단 하나 보고 약속할 생각 없어.",DISTANT:"무슨 방식인지 보고. 가능성까지 닫진 않아.",NEUTRAL:"질문부터 받아볼 순 있겠지. 바로 속을 다 말하진 않을 거고.",WARM:"한 번쯤은 생각해볼 수 있어. 요즘 어떻게 지내냐는 질문 정도라면.",CLOSE:"응, 한 번은. 호텔에 있고 찰리를 자주 보는 지금은 예전보다 낫다고 말할 수도 있겠네."}),
        CH(id+"-visit-follow","첫 질문을 상상해볼까?",[
          O(id+"-how","요즘 어떻게 지내는지 묻는다고 한다","supportive",[P(id+"-how-player","처음엔 요즘 어떻게 지내는지만 물을 거래요."),...BR(id+"-how-r",{default:"그 정도면 답할 수 있지. 호텔에 있다고.",WARM:{lines:"전보다 낫다고는 할 수 있어. 찰리도 자주 보고.",delta:1},CLOSE:{lines:"요즘은 덜 혼자라고 답하겠네. 그 정도부터라면 시작할 수 있어.",delta:1}})])
        ])
      ]),
      O(id+"-hate","상담받는 것 자체가 싫은지 묻는다","sensitive",[
        P(id+"-hate-player","상담받는 것 자체가 싫어요?"),
        ...BR(id+"-hate-r",{COLD:"처음 보는 사람한테 내 얘기를 설명하는 게 귀찮아.",DISTANT:"싫다기보다 ‘편하게 말해보세요’라는 상황이 편하지 않아.",NEUTRAL:"내가 뭘 느끼는지 정리해서 내놓으라는 방식이 낯설어.",WARM:"말하는 것보다 누가 내 얘기를 해석할지가 더 불편한 것 같아.",CLOSE:"싫다고 밀어내는 편이 익숙했지. 말하고 나서 달라질 게 없을까 봐 피한 것도 있고."}),
        CH(id+"-hate-follow","상태를 대신 규정할까?",[
          O(id+"-many","말할 게 엄청 많아 보인다고 한다","confrontational",[P(id+"-many-player","말할 게 엄청 많아 보이는데요."),...BR(id+"-many-r",{COLD:{lines:"날 분석한 척하지 마.",delta:-2,effects:[add(id+"-many-ten-cold","luc_t27_tension",1)]},DISTANT:{lines:"네가 내 상태를 대신 정하진 마.",delta:-1,effects:[add(id+"-many-ten-dist","luc_t27_tension",1)]},NEUTRAL:{lines:"그렇게 평가받으면 더 말하기 싫어져.",delta:-1},WARM:"많아 보일 수는 있겠네. 그래도 네가 목록을 만들진 마.",CLOSE:"맞을지도 모르지. 네가 놀리는 거라는 건 알아도, 대신 결론 내리진 말아줘."})]),
          O(id+"-pace","말하고 싶은 만큼만 하면 된다고 한다","supportive",[P(id+"-pace-player","말하고 싶은 만큼만 하면 되죠."),...BR(id+"-pace-r",{default:{lines:"그 말이면 훨씬 낫네.",delta:1},CLOSE:{lines:"응. 그런 곳이라면 한 번쯤 가볼 수도 있겠어.",delta:1}})])
        ])
      ]),
      O(id+"-charlie","찰리가 가보라고 하면 어떨지 묻는다","supportive",[P(id+"-charlie-player","찰리가 진지하게 가보라고 하면요?"),...BR(id+"-charlie-r",{COLD:{lines:"찰리가 걱정해서 말한다면 이유는 듣지.",effects:[set(id+"-charlie-soft-cold","luc_charlie_soft",true)]},DISTANT:{lines:"그 애가 진지하다면 바로 웃어넘기진 않아.",effects:[set(id+"-charlie-soft-dist","luc_charlie_soft",true)]},NEUTRAL:{lines:"왜 그렇게 생각했는지 듣고 결정할 거야.",effects:[set(id+"-charlie-soft-neutral","luc_charlie_soft",true)]},WARM:{lines:"찰리가 같이 알아보자고 하면 한 번쯤 생각해보겠지.",delta:1,effects:[set(id+"-charlie-soft-warm","luc_charlie_soft",true)]},CLOSE:{lines:"찰리가 같이 가자고 하면 갈 수도 있어. 그 애가 걱정하는 얼굴을 계속 보고 싶진 않으니까.",delta:1,effects:[set(id+"-charlie-soft-close","luc_charlie_soft",true)]}})]),
      O(id+"-family","상담사가 가족 이야기를 물으면 어떡할지 묻는다","sensitive",[
        P(id+"-family-player","상담사가 가족 이야기를 물으면요?"),
        ...BR(id+"-family-r",{COLD:"찰리 얘기는 할 수 있어. 나머지는 안 해.",DISTANT:"찰리는 비교적 쉽지. 내 과거 전체는 아니고.",NEUTRAL:"찰리 이야기는 할 수 있어도 가족 관계를 전부 설명하진 않을 거야.",WARM:"찰리와 요즘 어떻게 지내는지는 말할 수 있어. 천국과 과거는 내가 준비됐을 때고.",CLOSE:"찰리 얘기부터라면 가능해. 가족 전체와 천국까지 한꺼번에 열진 않을 거야."}),
        CH(id+"-family-follow","천국 이야기까지 밀어붙일까?",[
          O(id+"-heaven","천국 이야기 같은 걸 말하라고 한다","confrontational",[P(id+"-heaven-player","천국 이야기 같은 것도 해야 하지 않아요?"),...BR(id+"-heaven-r",{COLD:{lines:"해야 한다고 정하지 마. 이 질문은 끝이야.",delta:-3,effects:[add(id+"-heaven-push-cold","luc_t27_push",1),add(id+"-heaven-ten-cold","luc_t27_tension",1),set(id+"-heaven-close-cold","luc_t27_closed",true)]},DISTANT:{lines:"그걸 네가 정할 일은 아니야.",delta:-2,effects:[add(id+"-heaven-push-dist","luc_t27_push",1),add(id+"-heaven-ten-dist","luc_t27_tension",1)]},NEUTRAL:{lines:"언젠가 말할 수도 있어. 의무처럼 요구하면 안 하고 싶어져.",delta:-1},WARM:"필요할 수는 있겠지. 준비됐다는 뜻은 아니야.",CLOSE:"그 얘기가 내 안에 남아 있는 건 알아. 그래도 꺼낼 때와 사람은 내가 고를게."})]),
          O(id+"-backoff","더 캐묻지 않는다","supportive",[P(id+"-backoff-player","그건 더 캐묻지 않을게요."),...BR(id+"-backoff-r",{default:{lines:"…고마워. 그게 도움이 되네.",delta:1,effects:[set(id+"-backoff-close","luc_t27_closed",true)]},CLOSE:{lines:"응. 내가 먼저 말할 준비가 되면 그때 들어줘.",delta:1,effects:[set(id+"-backoff-close2","luc_t27_closed",true)]}})])
        ])
      ])
    ])
  ],{topicFamily:"personal_boundary"}));

  replace("지옥에서 명성과 실제 권력은 같은 것인가",id=>EV(id,"지옥에서 명성과 실제 권력은 같은 것인가","PLAYER_ASK","medium",[
    N(id+"-intro","지옥 유명 인사 순위가 실린 잡지를 루시퍼가 대충 넘기고 있다.","intro",{effects:reset("28",id)}),
    P(id+"-player","유명한 사람이 실제로도 제일 강한 건 아니죠?"),
    ...BR(id+"-open",{COLD:"당연하지. 인기순위가 전투력 순위는 아니잖아.",DISTANT:"유명세와 실제 힘이 겹칠 수는 있어도 같은 건 아니야.",NEUTRAL:"아무것도 없이 유명해질 수도 있고, 강해도 광고 안 하는 존재도 있지.",WARM:"화면에 많이 나온다고 가장 강한 건 아니야. 다만 유명세를 실제 영향력으로 바꾸는 놈은 있고.",CLOSE:"이름이 크다고 지금도 같은 힘을 가진 건 아니야. 반대로 조용하다고 약한 것도 아니고."}),
    CH(id+"-choice","명성과 실제 힘을 어떻게 비교할까?",[
      O(id+"-fame","유명하면 실제 힘도 어느 정도 있는지 묻는다","neutral",[P(id+"-fame-player","그래도 유명하면 어느 정도 힘은 있는 거 아닌가요?"),...BR(id+"-fame-r",{default:"유명해질 발판은 있겠지. 그게 싸움, 돈, 방송, 인맥 중 뭔지는 다르고.",WARM:"대개 뭔가 쥔 건 있어. 하지만 사람들이 아는 얼굴과 실제로 할 수 있는 일의 크기는 같지 않아.",CLOSE:"명성도 도구야. 도구를 쓸 능력과 버틸 실체가 있는지는 따로 봐야지."})]),
      O(id+"-compare","Vox와 알래스터를 비교한다","light",[
        P(id+"-compare-player","Vox와 알래스터를 비교하면요?"),
        ...BR(id+"-compare-r",{COLD:"TV는 회사와 화면을 쥐었고, 사슴은 오래된 공포를 남겼지.",DISTANT:"둘 다 이름만 큰 건 아니야. 현재 힘을 숫자로 비교해줄 생각은 없지만.",NEUTRAL:"복스는 조직과 매체가 있고, 알래스터는 사라져도 남은 평판이 있어. 방식이 달라.",WARM:"TV 얼굴은 지금 쥔 게 많고, 빨간 사슴은 과거에 남긴 무서움이 아직 살아 있지.",CLOSE:"복스는 현재의 연결망, 사슴 대가리는 오래 남은 공포를 써. 누가 몇 점 더 센지는 몰라."}),
        CH(id+"-compare-follow","알래스터의 현재 힘까지 물을까?",[
          O(id+"-alastor-now","알래스터가 예전과 같은 힘인지 묻는다","sensitive",[P(id+"-alastor-now-player","알래스터가 지금도 예전과 같은 힘인지는 알아요?"),...BR(id+"-alastor-now-r",{default:{lines:"몰라. 과거 평판이 유지된다고 현재가 정확히 같다는 뜻은 아니지.",effects:[add(id+"-alastor-irritation","luc_alastor_irritation",1)]},CLOSE:{lines:"정확히는 몰라. 직접 확인하려고 사슴과 힘겨루기할 만큼 한가하지도 않고.",effects:[add(id+"-alastor-irritation-close","luc_alastor_irritation",1)]}})])
        ])
      ]),
      O(id+"-self","루시퍼도 유명하지만 활동은 적었다고 지적한다","sensitive",[
        P(id+"-self-player","루시퍼도 이름은 제일 유명한데 활동은 적었잖아요."),
        ...BR(id+"-self-r",{COLD:"굳이 나까지 끌고 와?",DISTANT:"활동이 적었던 건 맞아. 힘이 없어진 건 아니고.",NEUTRAL:"내 이름과 실제 영향력이 늘 같진 않았지. 내가 그 이름을 거의 안 썼으니까.",WARM:"맞아. 유명세는 남았는데 내가 직접 움직인 일은 적었어.",CLOSE:"응. 이름은 가장 컸어도 그 이름을 열심히 써먹진 않았지. 그 차이는 인정해."}),
        CH(id+"-self-follow","영향력이 별개였다고 평가할까?",[
          O(id+"-influence","실제 영향력은 별개였다고 말한다","confrontational",[P(id+"-influence-player","이름은 제일 커도 실제 영향력은 별개였던 거네요."),...BR(id+"-influence-r",{COLD:{lines:"평가표 읽듯 말하지 마.",delta:-2,effects:[add(id+"-influence-ten-cold","luc_t28_tension",1)]},DISTANT:{lines:"말투가 꽤 비꼬네.",delta:-1},NEUTRAL:{lines:"틀린 말은 아니어도 그렇게 단정당하면 기분 좋진 않아.",delta:-1},WARM:"그래. 내가 영향력을 쓰지 않은 시간이 길었지.",CLOSE:"맞아. 힘이 없었던 게 아니라 손을 놓고 있었어. 결과는 비슷하게 보였겠지만."})]),
          O(id+"-separate","힘과 활동을 구분해 이해한다","supportive",[P(id+"-separate-player","힘이 없었다기보다 쓰지 않았던 거군요."),...BR(id+"-separate-r",{default:"그래. 그 구분이면 정확해.",WARM:{lines:"응. 변명처럼 들릴 수 있어도 사실은 그래.",delta:1},CLOSE:{lines:"맞아. 그리고 왜 그렇게 살았는지는… 다른 날에 말할 수도 있겠지.",delta:1}})])
        ])
      ])
    ])
  ],{topicFamily:"reputation_power"}));

  replace("각 Ring의 음식 중 가장 먹어보고 싶은 것",id=>EV(id,"각 Ring의 음식 중 가장 먹어보고 싶은 것","CHARACTER_OPEN","light",[
    N(id+"-intro","각 Ring의 대표 음식 사진이 실린 전단을 루시퍼가 먼저 집어 든다.","intro",{effects:reset("29",id)}),
    ...BR(id+"-open",{COLD:"비네 음식은 먹어볼 만하겠네.",DISTANT:"하나 고르라면 Gluttony. 적어도 양은 확실할 테니까.",NEUTRAL:"비 쪽이 먼저 떠오르네. ‘조금만’ 차려도 테이블이 가득 찰 것 같고.",WARM:"Gluttony! 비가 간식만 준비한다고 해도 연회가 될걸.",CLOSE:"비네 가자. 메뉴 고르는 척하다가 테이블 전체를 먹게 될 것 같지만 그게 재미있지."}),
    CH(id+"-choice","Ring의 음식을 어떻게 골라볼까?",[
      O(id+"-one","하나만 고르면 어디인지 묻는다","light",[P(id+"-one-player","하나만 고르면 역시 Gluttony예요?"),...BR(id+"-one-r",{COLD:"응. 비는 음식으로 장난치진 않으니까.",DISTANT:"Gluttony. 선택지가 너무 많다는 게 문제겠지만.",NEUTRAL:"비네. 양도 많고 실패할 확률도 낮지.",WARM:{lines:"당연히 비네! ‘간단히 먹자’고 해놓고 디저트가 여섯 줄로 나올걸.",delta:1,effects:[add(id+"-food-warm","luc_food_interest",1)]},CLOSE:{lines:"응. 그냥 비한테 연락하고 가자고 하고 싶네. 계획표 없이 먹으러 가는 건 좋잖아.",delta:1,effects:[add(id+"-food-close","luc_food_interest",1)]}})]),
      O(id+"-familiar","Wrath·Lust·Greed의 음식도 묻는다","light",[
        P(id+"-familiar-player","Wrath나 Lust, Greed 음식은요?"),
        ...BR(id+"-familiar-r",{COLD:"Wrath는 고기, Lust는 가게를 잘 고르면 괜찮고, Greed는 가격표부터 봐.",DISTANT:"사탄 추천은 음식이면 믿을 만해. 오지 가게도 괜찮고. 마몬 쪽은 계산서가 문제지.",NEUTRAL:"Wrath는 농장 음식, Lust는 음식과 술. Greed는 맛보다 마몬이 붙인 가격이 먼저 걱정돼.",WARM:"사탄은 고기 하나는 제대로 고를 거고, 오지 가게는 공연만 피하면 좋아. 마몬은 물 한 잔에도 브랜드 값을 붙일걸.",CLOSE:"Wrath에선 사탄 추천, Lust에선 오지 단골집. Greed는 마몬 몰래 현지인이 가는 데로. 그게 제일 안전해."})
      ]),
      O(id+"-all","Pride·Sloth·Envy까지 전부 고르라고 한다","light",[P(id+"-all-player","Pride, Sloth, Envy까지 전부 하나씩 골라봐요."),...BR(id+"-all-r",{COLD:{lines:"갑자기 지옥 음식 평가표 만들 거야? Pride는 늘 먹고, 나머진 당사자한테 물어봐.",effects:[add(id+"-all-work-cold","luc_work_avoidance",1)]},DISTANT:{lines:"과제처럼 시키지 마. Sloth와 Envy 음식은 현지 쪽에 물어보는 게 낫겠네.",effects:[add(id+"-all-work-dist","luc_work_avoidance",1)]},NEUTRAL:{lines:"Pride는 여행 음식이 아니고, Sloth와 Envy는 내가 아는 척하지 않을게. 당사자 추천이 낫지.",effects:[add(id+"-all-work-neutral","luc_work_avoidance",1)]},WARM:{lines:"하! 메뉴판 숙제네. Pride는 제외하고, Sloth와 Envy는 현지 추천으로 넘기자.",effects:[add(id+"-all-work-warm","luc_work_avoidance",1)]},CLOSE:{lines:"전부 고르는 건 귀찮아. 대신 같이 가면 네가 고른 걸 한입씩 뺏어 먹을게. 훨씬 효율적이지.",effects:[add(id+"-all-work-close","luc_work_avoidance",1),add(id+"-all-food-close","luc_food_interest",1)]}})])
    ])
  ]));

  replace("지옥에서 혁명이 벌어진다면 누가 가장 먼저 반응할까",id=>EV(id,"지옥에서 혁명이 벌어진다면 누가 가장 먼저 반응할까","EVENT","medium",[
    N(id+"-intro","TV에서 누군가 혁명을 외치는 방송이 흘러나온다. 루시퍼가 화면을 보며 눈썹을 올린다.","intro",{effects:reset("30",id)}),
    ...BR(id+"-open",{COLD:"누가 누구 상대로? 그것부터 없으면 그냥 소음이지.",DISTANT:"혁명이라는 단어만으로는 부족해. 불똥이 어디로 튀는지가 먼저야.",NEUTRAL:"대부분 자기 구역과 돈에 영향이 오는 순간 움직이겠지.",WARM:"Vees는 방송부터 잡고, 오버로드들은 자기 영역부터 잠글걸. 누가 정확히 먼저인지는 모르고.",CLOSE:"다들 대의를 위해 움직인다기보다 자기한테 불이 붙는 순간 반응할 거야. 나도 상황부터 볼 테고."}),
    CH(id+"-choice","혁명 가정에서 누구를 먼저 볼까?",[
      O(id+"-first","누가 가장 먼저 움직일지 묻는다","neutral",[P(id+"-first-player","지옥 전체가 들썩이면 누가 가장 먼저 움직일까요?"),...BR(id+"-first-r",{default:"자기 구역이나 돈에 먼저 불똥 튄 쪽. 순위까지 맞힐 생각은 없어.",WARM:"Vees는 방송과 시장이 흔들리면 빠를 거고, 다른 오버로드도 자기 영역을 지키려 들겠지.",CLOSE:"누가 1등인지는 몰라. 대의보다 손실이 보이는 순간 움직이는 쪽이 빠를 거야."})]),
      O(id+"-lilith","Lilith라면 어떻게 했을지 묻는다","sensitive",[
        P(id+"-lilith-player","Lilith라면 이런 상황에서 어떻게 했을까요?"),
        ...BR(id+"-lilith-r",{COLD:{lines:"왜 갑자기 걔 얘기야?",delta:-1,effects:[add(id+"-lilith-ten-cold","luc_t30_tension",1)]},DISTANT:"사람을 움직이는 데 능숙했어. 그 이상은 말 안 해.",NEUTRAL:"목소리와 분위기로 사람을 모으는 법은 알았지. 지금이라면 어떨지는 몰라.",WARM:"과거의 릴리스라면 사람들을 먼저 모으고 방향을 만들었겠지. 지금도 같을지는 내가 정할 수 없어.",CLOSE:"사람들이 왜 움직이는지 보는 데 능숙했어. 그래도 돌아온 뒤 무엇을 할지는 그 사람만 알겠지."}),
        CH(id+"-lilith-follow","Lilith와 루시퍼의 관계까지 물을까?",[
          O(id+"-vox-name","Vox가 Lilith 이름을 이용하는 게 화나는지 묻는다","sensitive",[P(id+"-vox-name-player","Vox가 Lilith 이름을 이용하는 건 화나요?"),...BR(id+"-vox-name-r",{COLD:{lines:"그걸 지금 네가 파고들 필요는 없어.",delta:-1,effects:[add(id+"-vox-push-cold","luc_t30_push",1)]},DISTANT:"마음에 들진 않아. 여기까지.",NEUTRAL:"짜증은 나. 걔 이름을 자기 방송 도구처럼 쓰는 건 싫으니까.",WARM:"응, 화나. 복스가 어떤 이름이든 화면에 올리면 자기 소유처럼 굴잖아.",CLOSE:"화나지. 내 감정과 별개로 릴리스 이름을 복스가 제 이야기처럼 파는 건 싫어."})]),
          O(id+"-follow-her","Lilith가 돌아오면 루시퍼도 따를지 묻는다","confrontational",[P(id+"-follow-her-player","Lilith가 돌아오면 루시퍼도 따를 거예요?"),...BR(id+"-follow-her-r",{COLD:{lines:"그 질문은 끝이야.",delta:-3,effects:[add(id+"-follow-push-cold","luc_t30_push",1),add(id+"-follow-ten-cold","luc_t30_tension",1),set(id+"-follow-close-cold","luc_t30_closed",true)]},DISTANT:{lines:"내 관계를 혁명 가정에 끼워 넣지 마.",delta:-2,effects:[add(id+"-follow-push-dist","luc_t30_push",1),add(id+"-follow-ten-dist","luc_t30_tension",1)]},NEUTRAL:{lines:"그건 지금 답할 수 있는 질문이 아니야.",delta:-1},WARM:{lines:"몰라. 돌아오지도 않은 사람과 내 선택을 네가 먼저 정하지 마.",delta:-1},CLOSE:"…그때 생각할게. 가까운 사이라고 미래의 답까지 전부 줄 수 있는 건 아니야."})]),
          O(id+"-change-topic","Lilith 이야기를 멈춘다","supportive",[P(id+"-change-topic-player","그 얘기는 여기서 멈출게요."),...BR(id+"-change-topic-r",{default:{lines:"그래. 그게 좋아.",delta:1,effects:[set(id+"-lilith-close","luc_t30_closed",true)]},CLOSE:{lines:"고마워. 지금은 그 정도가 내가 줄 수 있는 답이야.",delta:1,effects:[set(id+"-lilith-close2","luc_t30_closed",true)]}})])
        ])
      ]),
      O(id+"-sins","칠죄종이 어떻게 반응할지 묻는다","light",[P(id+"-sins-player","칠죄종은 어떻게 반응할까요?"),...BR(id+"-sins-r",{default:"사탄은 질서가 깨지면 움직이고, 마몬은 손익부터 보겠지.",WARM:"사탄은 크게 반응하고, 마몬은 계산기부터 두드려. 비와 오지는 자기 사람들에게 번지면 나설 것 같고.",CLOSE:"각자 자기 방식이지. 사탄은 질서, 마몬은 돈, 비와 오지는 자기 사람. 행동 예측표까지 만들진 않을 거야."})]),
      O(id+"-self","루시퍼 본인은 무엇부터 할지 묻는다","sensitive",[
        P(id+"-self-player","루시퍼는 무엇부터 할 건데요?"),
        ...BR(id+"-self-r",{COLD:"누가 왜 움직이는지부터 봐. 아무것도 모르고 칠 순 없잖아.",DISTANT:"상황과 원인부터 확인해. 혁명이란 단어만 듣고 진압하진 않아.",NEUTRAL:"어디서 시작됐고 누구에게 위험한지 먼저 볼 거야.",WARM:"원인부터 보고 호텔까지 번지는지 확인해. 찰리가 있으면 그 애 위치가 먼저고.",CLOSE:{lines:"찰리 위치부터 확인하고, 혼자 군중 속으로 들어가려 하면 같이 가거나 막을 거야. 그다음 원인을 보지.",effects:[set(id+"-self-protect","luc_charlie_protective",true)]}}),
        CH(id+"-self-follow","왕의 역할을 압박할까?",[
          O(id+"-stop-it","왕이면 일단 막아야 한다고 한다","confrontational",[P(id+"-stop-it-player","왕이면 일단 막아야 하는 거 아닌가요?"),...BR(id+"-stop-it-r",{COLD:{lines:"무슨 일인지도 모르고 때려눕히라는 거야?",delta:-2,effects:[add(id+"-stop-ten-cold","luc_t30_tension",1)]},DISTANT:{lines:"진압부터 하는 왕을 원하면 다른 사람 찾아.",delta:-1},NEUTRAL:{lines:"원인을 모르고 막으면 더 큰 일이 될 수 있어.",delta:-1},WARM:"질서를 지키는 것과 이유도 없이 누르는 건 달라.",CLOSE:"호텔과 찰리를 지키는 건 먼저 해. 그래도 누가 왜 일어났는지도 모르고 힘부터 쓰진 않을 거야."})]),
          O(id+"-charlie","찰리부터 확인하는 걸 이해한다","supportive",[P(id+"-charlie-player","호텔까지 번지면 찰리부터 확인해야겠네요."),...BR(id+"-charlie-r",{default:{lines:"당연하지. 그건 순서 고민할 일도 아니야.",effects:[set(id+"-charlie-protect","luc_charlie_protective",true)]},WARM:{lines:"응. 찰리가 혼자 해결하려고 뛰어들기 전에 찾아야지.",delta:1,effects:[set(id+"-charlie-protect-warm","luc_charlie_protective",true)]},CLOSE:{lines:"맞아. 찰리를 찾고, 그 애가 사람들을 돕고 싶다면 혼자 가지 않게 할 거야.",delta:1,effects:[set(id+"-charlie-protect-close","luc_charlie_protective",true)]}})])
        ])
      ])
    ])
  ],{topicFamily:"family_sensitive"}));

  const variables=[];
  for(let topic=13;topic<=30;topic++){
    const n=String(topic).padStart(2,"0");
    variables.push(
      {id:"luc_t"+n+"_tension",name:"루시퍼 TALK "+n+" · 긴장도",type:"number",defaultValue:"0",minValue:0,maxValue:3},
      {id:"luc_t"+n+"_push",name:"루시퍼 TALK "+n+" · 압박 횟수",type:"number",defaultValue:"0",minValue:0,maxValue:3},
      {id:"luc_t"+n+"_closed",name:"루시퍼 TALK "+n+" · 주제 종료",type:"boolean",defaultValue:"false"},
      {id:"luc_flag_t"+n+"_seen",name:"루시퍼 TALK "+n+" 확인",type:"boolean",defaultValue:"false"}
    );
  }
  variables.push({id:"luc_charlie_soft",name:"루시퍼 · 찰리 관련 부드러운 반응",type:"boolean",defaultValue:"false"});
  variables.push({id:"luc_unknown_contract_redemption",name:"루시퍼 · 구원 시 영혼 계약은 미확인",type:"boolean",defaultValue:"false"});
  variables.push({id:"luc_food_interest",name:"루시퍼 · 링 음식 관심",type:"number",defaultValue:"0",minValue:0,maxValue:9});
  const byId=new Map((pack.variables||[]).map(variable=>[variable.id,variable]));
  for(const variable of variables)byId.set(variable.id,variable);
  pack.variables=[...byId.values()];
  const topicFamilies={1:"heaven_sensitive",7:"missing_items",11:"royal_duty_sensitive",14:"heaven_sensitive",15:"cooking",18:"alcohol",19:"cooking",20:"sofa_lounge",21:"reputation_power",24:"heaven_sensitive",26:"royal_duty_sensitive",27:"personal_boundary",28:"reputation_power",30:"family_sensitive"};
  for(const [topic,family] of Object.entries(topicFamilies)){
    const event=pack.events[Number(topic)-1];
    if(event)event.topicFamily=family;
  }
  pack.version=54;
})();
