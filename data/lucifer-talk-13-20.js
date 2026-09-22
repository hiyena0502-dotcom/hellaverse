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
  const EV=(id,title,startMode,sensitivity,entries)=>({
    id,name:"TALK · Lucifer Morningstar · "+title,characterId:C,eventRole:"talk",menuVisible:true,
    randomEligible:true,startMode,sensitivity,continuationEventIds:[],emotionExitMode:"keep",entries
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

  const variables=[];
  for(let topic=13;topic<=20;topic++){
    const n=String(topic).padStart(2,"0");
    variables.push(
      {id:"luc_t"+n+"_tension",name:"루시퍼 TALK "+n+" · 긴장도",type:"number",defaultValue:"0",minValue:0,maxValue:3},
      {id:"luc_t"+n+"_push",name:"루시퍼 TALK "+n+" · 압박 횟수",type:"number",defaultValue:"0",minValue:0,maxValue:3},
      {id:"luc_t"+n+"_closed",name:"루시퍼 TALK "+n+" · 주제 종료",type:"boolean",defaultValue:"false"},
      {id:"luc_flag_t"+n+"_seen",name:"루시퍼 TALK "+n+" 확인",type:"boolean",defaultValue:"false"}
    );
  }
  variables.push({id:"luc_charlie_soft",name:"루시퍼 · 찰리 관련 부드러운 반응",type:"boolean",defaultValue:"false"});
  const byId=new Map((pack.variables||[]).map(variable=>[variable.id,variable]));
  for(const variable of variables)byId.set(variable.id,variable);
  pack.variables=[...byId.values()];
  pack.version=52;
})();
