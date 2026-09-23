"use strict";

(()=>{
  const VERSION=19;
  const key=value=>String(value||"").normalize("NFKC").trim().toLowerCase().replace(/[^a-z0-9가-힣]+/g,"");
  const hash=value=>{
    let h=2166136261;
    for(const ch of String(value||"")){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}
    return h>>>0;
  };
  const tokens=value=>new Set(String(value||"").toLowerCase().match(/[a-z0-9가-힣]{2,}/g)||[]);
  const LEGACY_DIALOGUE_TRANSLATIONS=[
    ["Sorry I wasn't here sooner, sweetie.","더 일찍 곁에 있어주지 못해서 미안하구나, 얘야."],
    ["A smile is a valuable tool, my dear.","미소는 아주 유용한 도구랍니다, 친애하는 분."],
    ["Not a bad boy.","나쁜 남자는 아니었어."],
    ["Oh, hello.","오, 안녕하시오."],
    ["I decided... to stay.","나… 남기로 했어."],
    ["Tell Auntie Rosie what she can do for you.","로지 이모한테 뭘 도와주면 좋을지 말해보렴."],
    ["Adam is dead.","아담은 죽었어."],
    ["That was uncalled for, Adam.","그건 선을 넘었어, 아담."],
    ["Charlie!! Don't give up on this!","찰리!! 이걸 포기하면 안 돼!"],
    ["Ugh, we were partners.","으, 우린 동료였어."],
    ["Hi. Hello. Abel here, son of Adam.","안녕. 아벨이야. 아담의 아들이고."],
    ["Charlie. Stop. Breathe.","찰리. 멈춰. 숨 쉬어."],
    ["ASK FIRST!","먼저 물어봐!"],
    ["KING OF HELL","지옥의 왕"],
    ["DADDY","아빠"],
    ["YES!","좋아!"],
    ["Fine.","그래."],
    ["darling","얘야"],
    ["Wrath","분노의 링"],
    ["그리고 호텔을 돕는 방식이라는 말에 루시퍼의 표정이 잠깐 부드러워진다.","루시퍼가 호텔 업무 메모를 훑다가 한 줄에서 손을 멈춘다. 굳어 있던 표정이 조금 누그러진다."],
    ["호텔을 돕는 방식이라는 말에 루시퍼의 표정이 잠깐 부드러워진다.","루시퍼가 호텔 업무 메모를 읽다가 잠시 손을 멈춘다. 표정이 조금 누그러진다."]
  ];
  const localizeLegacyDialogue=value=>{
    let text=String(value??"");
    for(const [from,to] of LEGACY_DIALOGUE_TRANSLATIONS)text=text.split(from).join(to);
    text=text.replace(/\bNO\b/g,"안 돼");
    return text;
  };
  const LUCIFER_NAME_REWRITES=[
    [/\bVoxTech\b/gi,"그 TV 놈 회사"],
    [/\bVoxTek\b/gi,"그 TV 놈 회사"],
    [/\bV Tower\b/gi,"그 TV 놈네 타워"],
    [/\bVees\b/g,"그 TV 놈 패거리"],
    [/\bVox\b/gi,"그 TV 대가리"],
    [/복스/g,"그 TV 대가리"],
    [/\bAlastor\b/gi,"그 사슴 대가리"],
    [/알래스터/g,"그 사슴 대가리"],
    [/\bVaggie\b/gi,"찰리 여자친구"],
    [/배기/g,"찰리 여자친구"],
    [/\bNiffty\b/gi,"그 조그만 애"],
    [/니프티/g,"그 조그만 애"],
    [/\bHusk\b/gi,"그 바텐더 고양이"],
    [/허스크/g,"그 바텐더 고양이"],
    [/\bAngel Dust\b/gi,"그 긴 거미"],
    [/엔젤 더스트/g,"그 긴 거미"],
    [/\bAngel\b/g,"그 긴 거미"],
    [/엔젤/g,"그 긴 거미"],
    [/\bEmily\b/gi,"그 신난 천사"],
    [/에밀리/g,"그 신난 천사"],
    [/\bLute\b/gi,"아담 옆에 있던 천사"],
    [/류트/g,"아담 옆에 있던 천사"],
    [/\bCarmilla Carmine\b/gi,"그 무기상"],
    [/카밀라 카마인/g,"그 무기상"],
    [/\bCarmilla\b/gi,"그 무기상"],
    [/카밀라/g,"그 무기상"],
    [/\bBaxter\b/gi,"그 물고기 과학자"],
    [/백스터/g,"그 물고기 과학자"],
    [/\bSir Pentious\b/gi,"그 뱀"],
    [/\bPentious\b/gi,"그 뱀"],
    [/펜셔스/g,"그 뱀"],
    [/펜티어스/g,"그 뱀"],
    [/\bValentino\b/gi,"그 나방 놈"],
    [/발렌티노/g,"그 나방 놈"],
    [/\bVelvette\b/gi,"그 패션 애"],
    [/벨벳/g,"그 패션 애"],
    [/\bRosie\b/gi,"그 식인종 여자"],
    [/로지/g,"그 식인종 여자"],
    [/\bCherri Bomb\b/gi,"그 폭탄 던지는 애"],
    [/체리 밤/g,"그 폭탄 던지는 애"],
    [/\bAbel\b/gi,"아담 아들"],
    [/아벨/g,"아담 아들"],
    [/\bZestial\b/gi,"그 오래된 오버로드"],
    [/제스티얼/g,"그 오래된 오버로드"],
    [/\bZeezi\b/gi,"그 공룡 같은 오버로드"],
    [/지지/g,"그 공룡 같은 오버로드"]
  ];
  const rewriteLuciferKnowledge=text=>{
    let next=String(text??"");
    for(const [re,to] of LUCIFER_NAME_REWRITES)next=next.replace(re,to);
    return next;
  };
  const normalizeLuciferNameKnowledge=source=>{
    let changed=false;
    const apply=entries=>walk(entries,owner=>{
      if(owner?.type!=="dialogue")return;
      const isLucifer=owner.speakerCharacterId==="lucifer-morningstar"||/^(?:Lucifer Morningstar|LUCIFER)$/i.test(String(owner.speaker||""));
      if(!isLucifer||typeof owner.text!=="string")return;
      const next=rewriteLuciferKnowledge(owner.text);
      if(next!==owner.text){owner.text=next;changed=true}
    });
    for(const event of source.events||[])apply(event.entries);
    for(const ask of source.asks||[])apply(ask.entries);
    for(const item of source.items||[]){
      for(const reaction of item.reactions||[]){
        for(const field of ["firstEntries","repeatEntries","specialEntries"])apply(reaction[field]);
      }
    }
    return changed;
  };
  const LUCIFER_LOW_AFFECTION_COURTESY={
    "천사가 호텔에서 죄인과 직접 생활한다면":["불편한 부분은 넘겨도 된다고 한다","불편한 얘기면 굳이 다 답 안 하셔도 돼요.","…그 정도 선은 아네. 좋아, 필요한 만큼만 말하지."],
    "다른 지역에도 재활 시설을 세워야 하는가":["직접 맡아달라는 뜻은 아니라고 말한다","의견만 궁금한 거예요. 직접 맡아달라는 뜻은 아니고요.","그럼 됐어. 갑자기 지점장 시키는 줄 알았네."],
    "호텔에 게임룸을 만들자는 의견":["운영은 다른 사람에게 맡기고 취향만 묻는다","운영은 다른 사람이 한다 치고, 당신은 뭐가 있으면 좋겠어요?","그 질문은 훨씬 낫네. 핀볼. 그리고 오리 들어간 거."],
    "호텔이 오버로드 정치에서 중립을 유지할 수 있는가":["복잡한 정치 얘기는 여기서 접는다","복잡한 얘기면 여기까지만 할게요.","현명하네. 나도 그게 좋아."],
    "호텔에서 같이 술 마시기 좋은 사람":["이유는 캐묻지 않고 취향만 듣는다","이유는 안 물을게요. 그냥 편한 사람이 누구인지 정도만요.","그 정도면 답할 만하지."],
    "호텔 단체 사진을 찍으려다 난장판이 되는 상황":["사진이 싫으면 빠져도 된다고 한다","굳이 찍기 싫으면 안 찍어도 되죠.","하, 당연하지. 그래도 찰리가 원하면 한 장 정도는."],
    "냉장고에 넣어둔 음식을 누가 자꾸 훔쳐 먹는가":["범인을 몰아세우지 말고 새로 채우자고 한다","범인 찾는 대신 새로 채워둘까요?","그게 더 빠르겠네. 범인 심문은 찰리한테 맡기고."],
    "호텔 직원들의 휴일을 정하는 문제":["근무표를 맡기려는 건 아니라고 한다","당신한테 근무표를 짜달라는 건 아니에요.","좋아. 그 말 아주 마음에 드네."],
    "호텔 멤버 전원이 아무 일도 하지 않고 쉬는 날을 보내려다 결국 사고가 나는 상황":["오늘만큼은 그냥 쉬어도 된다고 한다","사고 나기 전까진 그냥 쉬세요. 뭔가 맡기려는 건 아니고요.","드디어 제대로 쉬는 법을 아는 사람이 있네."],
    "호텔을 왕실이 공식적으로 지원해야 하는가":["공식 지원을 강요하는 건 아니라고 한다","왕실 도장 찍으라는 얘기는 아니에요. 필요한 만큼만 도우면 되죠.","그래. 그게 훨씬 말이 되네."],
    "권력자가 평범한 Hellborn의 삶을 얼마나 이해할 수 있는가":["모르는 부분이 있어도 탓하지 않는다","모르는 부분이 있어도 이상한 건 아니라고 생각해요.","…그 말은 덜 귀찮게 들리네. 적어도 심문은 아니고."],
    "찰리가 직접 모든 투숙객을 관리하는 건 가능한가":["찰리의 선택을 존중하자고 한다","찰리가 원하면 맡기고, 필요할 때만 도와도 되겠죠.","그래. 그 애가 부르기 전부터 대신 살 필요는 없지."],
    "호텔 멤버 중 노래방에서 가장 시끄러운 사람":["순위는 더 캐묻지 않겠다고 한다","그 정도만 알면 됐어요. 더 순위 매기진 않을게요.","좋아. 사람 줄 세우는 건 취향 아니야."],
    "지옥 주민이 천국을 관광할 수 있는 날이 올까":["천국 얘기가 불편하면 넘긴다","천국 얘기가 불편하면 여기까지만 할게요.","…그래. 그건 고맙네."],
    "호텔 요리 대회":["심사까지 맡기려는 건 아니라고 한다","심사위원 하라는 건 아니고, 그냥 구경만 해도 돼요.","구경만? 그럼 꽤 괜찮은 행사네."],
    "구원이 증명된 뒤 갑자기 호텔에 찾아오는 죄인들":["몰려온 사람들을 전부 맡기려는 건 아니라고 한다","사람이 몰려와도 당신이 다 처리하라는 뜻은 아니에요.","당연하지. 그래도 그걸 먼저 말해주니 좋네."],
    "호텔에서 가장 믿으면 안 되는 사람":["굳이 누구 이름까지 말하지 않아도 된다고 한다","굳이 누구 이름까지 말할 필요는 없어요.","좋아. 괜한 명단 만들 필요 없지."],
    "호텔에서 술을 제한해야 하는가":["규칙을 직접 정해달라는 건 아니라고 한다","규칙을 직접 정하라는 건 아니에요. 의견만 듣고 싶었어요.","그럼 짧게는 말해주지."],
    "호텔에서 절대 맡기면 안 되는 사람이 요리를 한다면":["확인한다고 직접 먹어볼 필요는 없다고 한다","확인하겠다고 직접 먹어볼 필요는 없어요.","당연하지. 내 위장이 왜 증거물이야."],
    "호텔에서 가장 편한 소파를 누가 차지하는가":["원한다면 자리를 양보한다","원하시면 그 소파 쓰세요. 전 다른 데 앉을게요.","…오. 예의가 있네. 좋아, 기억해둘게."],
    "지옥에서 평판이 곧 권력인가":["정확한 분석까지 요구하지 않는다","정확한 분석까지 부탁한 건 아니에요. 느낌만 들으면 돼요.","그럼 간단하지. 이름값이 쓸모 있을 때도 있다. 끝."],
    "힘센 Sinner가 Hellborn 귀족보다 낮은 취급을 받는 문제":["당장 해결책까지 요구하지 않는다","당장 해결책을 내놓으라는 건 아니에요.","좋아. 그건 내 서류가 아니라 네 질문이네."],
    "호텔의 성공으로 오버로드 체제가 약해질 가능성":["미래를 맞혀달라는 건 아니라고 한다","미래를 맞혀달라는 건 아니에요. 여기까지만 할게요.","그래. 실제로 일어나면 그때 보면 되지."],
    "천사가 호텔에 장기 체류한다면 어떤 문제가 생길까":["개인적인 천국 경험은 묻지 않는다","개인적인 천국 얘기까지 하실 필요는 없어요.","…그 선은 지켜줘."],
    "Lute를 호텔에 들여보낼 수 있는가":["결정은 찰리에게 맡기자고 한다","들일지 말지는 찰리가 정할 일이겠죠. 당신 생각만 궁금했어요.","그래. 그게 맞아. 난 옆에서 보고 있으면 되고."],
    "지옥에서 왕족의 존재가 정말 필요한가":["왕관을 내려놓으라는 뜻은 아니라고 한다","당신한테 왕관 내려놓으라는 뜻은 아니에요.","하. 당연하지. 그럼 질문 자체는 들어줄 만하네."],
    "호텔이 아니라 Hellborn용 상담소가 생긴다면 갈 의향이 있는가":["상담을 강요하려는 건 아니라고 한다","가라고 강요하려는 건 아니에요. 싫으면 안 가도 되고요.","좋아. 그 정도 거리면 대화는 할 수 있겠네."],
    "지옥에서 명성과 실제 권력은 같은 것인가":["누구와 비교하지 않아도 된다고 한다","굳이 누구랑 비교하지 않아도 돼요.","드디어. 내 관심도 없는 놈들 평가표는 사양이야."],
    "각 Ring의 음식 중 가장 먹어보고 싶은 것":["생각나는 것 하나만 말해달라고 한다","정답처럼 고를 필요 없어요. 생각나는 것 하나만요.","그 정도면 쉽지."],
    "지옥에서 혁명이 벌어진다면 누가 가장 먼저 반응할까":["예측까지 요구하지 않는다고 한다","누가 먼저 움직일지 맞혀달라는 건 아니에요.","좋아. 아직 안 일어난 일에 회의할 필요 없지."],
    "지옥에서 가장 끔찍한 관광지":["직접 안내까지 할 필요는 없다고 한다","직접 안내하실 필요는 없고, 피하고 싶은 곳만 말해줘도 돼요.","그건 쉬워. 끔찍한 데는 널렸거든."],
    "천국 음식은 지옥 음식과 얼마나 다를까":["기억나지 않으면 떠올리지 않아도 된다고 한다","기억 안 나면 굳이 떠올리지 않으셔도 돼요.","…좋아. 그 말은 마음에 드네."],
    "Hellborn이 천국에 관심을 가질 이유가 있는가":["개인 경험까지 캐묻지 않는다고 한다","당신 경험까지 캐묻는 건 아니에요.","그럼 일반적인 얘기만 하지."],
    "라디오와 텔레비전 중 어떤 매체가 더 영향력이 있는가":["누가 더 강한지까지 묻지 않는다","누가 더 강한지까지 말할 필요는 없어요.","그래. 매체 얘기면 매체 얘기만 하자."],
    "다른 사람 옷을 하루 동안 입어보기":["허락 없이 옷을 건드리지 않겠다고 한다","당신 옷은 허락 없이 건드리지 않을게요.","당연한 얘긴데, 직접 들으니까 꽤 마음에 드네."],
    "인간 세계의 술과 지옥의 술 비교":["최근 인간 세상 사정까지 요구하지 않는다","최근 인간 세상 사정까지 아실 필요는 없죠.","맞아. 내가 인간 바 순회라도 하는 줄 알아?"],
    "방송에 호텔 내부를 공개해야 하는가":["방송 출연을 강요하지 않는다","당신까지 방송에 나와야 한다는 뜻은 아니에요.","좋아. 호텔 주인공은 찰리니까."],
    "호텔 전체에 인터넷이 끊긴 상황":["수리를 맡기려는 건 아니라고 한다","고쳐달라는 건 아니에요. 그냥 인터넷이 끊겼다고 알려드린 거예요.","아, 그럼 완벽하네. 내 일이 아니군."],
    "귀족사회에서 진짜 친구를 구별하는 방법":["개인적인 관계까지 묻지 않는다","누가 친구였는지까지 말하지 않으셔도 돼요.","…좋아. 원칙만 말하는 건 괜찮아."],
    "호텔에 통금 시간이 필요한가":["직접 단속할 필요는 없다고 한다","통금이 생겨도 당신이 단속할 필요는 없겠죠.","정답. 내가 왜 호텔 문지기야."],
    "호텔 로비에서 잠드는 사람들에 대한 불만":["거슬리지 않으면 그냥 두자고 한다","거슬리지 않으면 그냥 두죠. 굳이 깨울 필요 없고요.","그래. 조용하면 나도 신경 안 써."],
    "카드 게임에서 가장 사기 칠 것 같은 사람":["진지하게 의심하는 건 아니라고 한다","진짜 범인 취급하려는 건 아니에요. 그냥 장난으로 물은 거예요.","그럼 됐어. 사슴 대가리 욕하는 장난이면 더 좋고."],
    "호텔이 정말 성공하면 그다음에는 무엇을 해야 하는가":["바로 다음 계획을 세우라는 뜻은 아니라고 한다","성공하자마자 다음 계획 세우라는 뜻은 아니에요.","아, 드디어 정상적인 말이 나왔네. 일단 쉬어야지."],
    "호텔 운영비는 어디서 마련해야 하는가":["장부까지 보라는 뜻은 아니라고 한다","장부 보라는 뜻은 아니에요. 숫자는 다른 사람이 봐도 되죠.","좋아. 아주 훌륭한 생각이야."],
    "복스텍 제품을 호텔에서 사용해도 되는가":["당장 부수자는 건 아니라고 한다","당장 부수자는 건 아니에요. 불편하면 안 써도 되고요.","그래. 기계 하나 때문에 내가 성질낼 필요는 없지."],
    "Satan 같은 권력자가 법정에서 얼마나 큰 권한을 가져야 하는가":["루시퍼의 권한을 의심하는 건 아니라고 한다","당신 권한을 의심하려는 건 아니에요.","하, 그건 알아두는 게 좋아. 그럼 사탄 얘기만 하지."],
    "죄악들 사이에도 서열 의식이 존재하는가":["굳이 전부 줄 세우지 않아도 된다고 한다","굳이 전부 줄 세우지 않아도 돼요.","좋아. 어차피 맨 위는 정해져 있으니까."],
    "호텔에서 가장 이상한 취미를 가진 사람":["오리를 이상한 취미라고 한 건 아니라고 한다","오리는 이상한 취미라고 한 건 아니에요.","그래? 그럼 계속 말해봐."],
    "지옥식 휴가 계획을 세우기":["일정표까지 짜달라는 건 아니라고 한다","일정표까지 짜달라는 건 아니에요. 쉬고 싶은지만 물은 거예요.","훨씬 낫네. 일정표 없는 휴가라면 생각해볼 수 있지."],
    "호텔의 실패 사례도 공개해야 하는가":["개인적인 실패까지 공개하자는 건 아니라고 한다","개인적인 실패까지 공개하자는 뜻은 아니에요.","그 선은 마음에 드네."],
    "호텔에 자꾸 물건이 사라지는 문제":["누구를 도둑으로 몰지는 말자고 한다","누굴 도둑으로 몰자는 건 아니에요. 찾기만 하면 돼요.","그래. 괜한 재판 열지 말자."],
    "누군가 익명의 선물을 두고 간 상황":["허락 없이 선물을 열지 않겠다고 한다","당신 앞으로 온 거면 제가 먼저 열진 않을게요.","당연하지. 그래도 물어보고 손대는 건 마음에 드네."],
    "Sinsmas 선물을 누구에게 줄 것인가":["모두 챙길 의무는 없다고 한다","모두 챙겨야 한다는 뜻은 아니에요. 주고 싶은 사람만 주면 되죠.","그래. 선물이 의무가 되면 재미없잖아."],
    "언젠가 호텔이 더 이상 필요 없는 곳이 될 수 있을까":["미래 얘기는 여기서 멈춰도 된다고 한다","지금 답하기 어려우면 미래 얘긴 여기까지만 해도 돼요.","좋아. 미래의 일은 미래의 내가 듣지."],
    "새 투숙객의 방을 누가 안내할 것인가":["직접 안내를 맡기려는 건 아니라고 한다","당신이 직접 안내하라는 뜻은 아니에요.","좋아. 그럼 아주 합리적인 질문이네."],
    "호텔에 반려동물을 들여도 되는가":["규칙표를 만들자는 얘기는 아니라고 한다","규칙표 만들자는 얘기는 아니에요. 그냥 괜찮은지만요.","그럼 괜찮지. 찰리가 감당하면."],
    "술 취하면 가장 위험한 사람":["누가 최악인지 정하지 않아도 된다고 한다","굳이 누가 최악인지 정하지 않아도 돼요.","그래. 술 취한 사람 순위표까지 만들 생각 없어."],
    "호텔에 전문 상담사가 필요한가":["루시퍼에게 상담을 강요하지 않는다","당신도 꼭 상담받으라는 뜻은 아니에요.","…좋아. 그 말부터 하고 시작하면 들을 순 있지."],
    "호텔 조식 메뉴를 누가 정해야 하는가":["메뉴 회의 대신 하나만 묻는다","메뉴 회의하자는 건 아니에요. 좋아하는 것 하나만 말해줘요.","팬케이크. 끝. 훌륭한 회의였네."],
    "누가 가장 최악의 요리를 만드는가":["직접 먹고 판정할 필요는 없다고 한다","직접 먹고 판정하라는 건 아니에요.","당연하지. 왕이 독극물 감별사인 줄 알아?"],
    "오리 설계":["허락하기 전에는 설계도를 만지지 않는다","허락하기 전엔 설계도 안 만질게요.","…좋아. 그건 기본인데도 마음에 드네."],
    "왕관 손질":["왕관은 건드리지 않고 보기만 한다","왕관은 건드리지 않을게요. 그냥 보고만 있을게요.","그래. 눈으로 보는 건 무료니까."],
    "낡은 악보":["말하기 싫은 곡이면 더 묻지 않는다","말하기 싫은 곡이면 묻지 않을게요.","좋아. 그럼 악보 얘기는 여기까지."],
    "가족사진":["설명을 요구하지 않고 사진도 건드리지 않는다","설명 안 하셔도 돼요. 사진도 안 건드릴게요.","그래. 그 정도면 충분해."],
    "사과 연습":["못 본 걸로 하고 연습을 계속하게 둔다","못 본 걸로 할게요. 연습 계속하세요.","…좋아. 그게 더 낫네."],
    "천국의 깃털":["허락하기 전에는 깃털을 만지지 않는다","허락하기 전엔 안 만질게요.","좋아. 그건 내가 정하고 싶어."],
    "호텔 열쇠":["찰리가 준 물건에는 손대지 않는다","찰리가 준 거면 제가 손대지 않을게요.","그래. 그건 내가 챙길게."],
    "왕실 업무 회피":["재촉하지 않고 급한 것만 나중에 보라고 한다","재촉하진 않을게요. 급한 것만 나중에 확인하세요.","하, 드디어 서류보다 말이 통하는 사람이네."],
    "천국 이야기":["말하기 싫다면 여기서 그만 묻는다","말하기 싫으시면 여기서 그만 물을게요.","…그래. 그럼 됐어."],
    "찰리의 메모":["회의에 갈지 재촉하지 않는다","회의 갈지 말지는 직접 정하세요. 전 재촉 안 할게요.","좋아. 찰리 잔소리는 하나면 충분하니까."]
  };
  const addLuciferLowAffectionCourtesyChoices=(source,helpers={})=>{
    let changed=false;
    const makeEntry=raw=>typeof helpers.normalizeEntry==="function"?helpers.normalizeEntry(raw):raw;
    for(const event of source.events||[]){
      if(event.characterId!=="lucifer-morningstar")continue;
      const title=String(event.name||"")
        .replace(/^\s*TALK\s*·\s*(?:Lucifer Morningstar\s*·\s*)?/i,"")
        .trim();
      const spec=LUCIFER_LOW_AFFECTION_COURTESY[title];
      if(!spec)continue;
      const choice=(event.entries||[]).find(entry=>entry?.type==="choice");
      if(!choice||!Array.isArray(choice.options))continue;
      const optionId=String(event.id||"lucifer-talk")+"-courtesy-low-aff";
      if(choice.options.some(option=>option?.id===optionId))continue;
      const [label,playerText,luciferText]=spec;
      choice.options.push({
        id:optionId,
        label,
        tone:"supportive",
        entries:[
          makeEntry({id:optionId+"-player",type:"dialogue",speaker:"PLAYER",text:playerText}),
          makeEntry({
            id:optionId+"-lucifer",
            type:"dialogue",
            speaker:"Lucifer Morningstar",
            speakerCharacterId:"lucifer-morningstar",
            text:luciferText,
            emotionEffects:[{id:optionId+"-calm",characterId:"lucifer-morningstar",state:"calm",intensity:22}]
          })
        ],
        condition:null,
        effects:[],
        itemEffects:[],
        itemCondition:null,
        askCondition:null,
        affectionCondition:{characterId:"lucifer-morningstar",band:"",operator:"<",value:58},
        affectionEffects:[{id:optionId+"-aff",characterId:"lucifer-morningstar",amount:1,silent:false}],
        emotionCondition:null,
        emotionEffects:[],
        exitMode:"continue",
        targetEventId:""
      });
      changed=true;
    }
    return changed;
  };

  const localizeEntryTree=entries=>{
    let changed=false;
    walk(entries,owner=>{
      for(const field of ["text","prompt","label"]){
        if(typeof owner?.[field]!=="string")continue;
        const next=localizeLegacyDialogue(owner[field]);
        if(next!==owner[field]){owner[field]=next;changed=true}
      }
    });
    return changed;
  };
  const clonePlain=value=>JSON.parse(JSON.stringify(value));
  const repairLegacyCharacterRefs=source=>{
    const characters=source.characters||[];
    const valid=new Set(characters.map(character=>character.id));
    const lookup=new Map();
    for(const character of characters){
      lookup.set(key(character.id),character.id);
      lookup.set(key(character.name),character.id);
    }
    for(const pack of window.HV_STORY_PACKS||[]){
      const refs=pack?.characterRefs&&typeof pack.characterRefs==="object"?pack.characterRefs:{};
      for(const [token,aliases] of Object.entries(refs)){
        const candidates=[token,...(Array.isArray(aliases)?aliases:[aliases])].filter(Boolean);
        const resolved=candidates.map(candidate=>lookup.get(key(candidate))).find(Boolean);
        if(!resolved)continue;
        for(const candidate of candidates)lookup.set(key(candidate),resolved);
      }
    }
    const fix=value=>{
      const raw=String(value||"");
      if(!raw||valid.has(raw))return raw;
      return lookup.get(key(raw))||raw;
    };
    let changed=false;
    const applyOwner=owner=>{
      if(!owner||typeof owner!=="object")return;
      for(const field of ["characterId","speakerCharacterId"]){
        if(typeof owner[field]!=="string"||!owner[field])continue;
        const next=fix(owner[field]);
        if(next!==owner[field]){owner[field]=next;changed=true}
      }
      for(const field of ["affectionCondition","emotionCondition"]){
        if(!owner[field]?.characterId)continue;
        const next=fix(owner[field].characterId);
        if(next!==owner[field].characterId){owner[field].characterId=next;changed=true}
      }
      for(const field of ["affectionEffects","emotionEffects"]){
        for(const effect of owner[field]||[]){
          if(!effect.characterId)continue;
          const next=fix(effect.characterId);
          if(next!==effect.characterId){effect.characterId=next;changed=true}
        }
      }
    };
    for(const event of source.events||[]){
      applyOwner(event);
      walk(event.entries,applyOwner);
    }
    for(const ask of source.asks||[]){
      applyOwner(ask);
      if(ask.unlockEmotionCondition?.characterId){
        const next=fix(ask.unlockEmotionCondition.characterId);
        if(next!==ask.unlockEmotionCondition.characterId){ask.unlockEmotionCondition.characterId=next;changed=true}
      }
      walk(ask.entries,applyOwner);
    }
    for(const thought of source.thoughts||[]){
      if(!thought.characterId)continue;
      const next=fix(thought.characterId);
      if(next!==thought.characterId){thought.characterId=next;changed=true}
    }
    for(const item of source.items||[]){
      if(item.collectionCharacterId){
        const next=fix(item.collectionCharacterId);
        if(next!==item.collectionCharacterId){item.collectionCharacterId=next;changed=true}
      }
      for(const reaction of item.reactions||[]){
        applyOwner(reaction);
        for(const field of ["firstEntries","repeatEntries","specialEntries"])walk(reaction[field],applyOwner);
      }
    }
    return changed;
  };
  const pruneRetiredSoloTalk=source=>{
    const currentIds=new Set();
    for(const pack of window.HV_STORY_PACKS||[]){
      for(const event of pack.events||[]){
        if(String(event?.id||"").startsWith("solo-talk-"))currentIds.add(event.id);
      }
    }
    if(!currentIds.size)return false;
    const before=(source.events||[]).length;
    source.events=(source.events||[]).filter(event=>!String(event.id||"").startsWith("solo-talk-")||currentIds.has(event.id));
    return source.events.length!==before;
  };
  const syncTunedStoryPacks=source=>{
    let changed=false;
    const tuned=(window.HV_STORY_PACKS||[]).filter(pack=>Number(pack?.version||0)>=2);
    if(!tuned.length)return false;
    const eventById=new Map((source.events||[]).map(event=>[event.id,event]));
    const askById=new Map((source.asks||[]).map(ask=>[ask.id,ask]));
    for(const pack of tuned){
      for(const fresh of pack.events||[]){
        const live=eventById.get(fresh.id);
        if(!live)continue;
        live.name=fresh.name;
        live.characterId=fresh.characterId;
        live.eventRole=fresh.eventRole||live.eventRole||"talk";
        live.menuVisible=fresh.menuVisible!==false;
        live.randomEligible=fresh.randomEligible!==false;
        live.continuationEventIds=clonePlain(fresh.continuationEventIds||[]);
        live.emotionExitMode=fresh.emotionExitMode||"keep";
        live.entries=clonePlain(fresh.entries||[]);
        changed=true;
      }
      for(const fresh of pack.asks||[]){
        const live=askById.get(fresh.id);
        if(!live)continue;
        for(const key of ["label","characterId","minAffection","startLocked","unlockMinAffection","unlockCondition","unlockItemCondition","unlockAskCondition","unlockEmotionCondition","unlockHint","repeatable","affectionDelta","emotionState","emotionIntensity","enabled"]){
          if(Object.prototype.hasOwnProperty.call(fresh,key))live[key]=clonePlain(fresh[key]);
          else delete live[key];
        }
        live.entries=clonePlain(fresh.entries||[]);
        changed=true;
      }
    }
    return changed;
  };
  const walk=(entries,visit)=>{
    for(const entry of entries||[]){
      visit(entry);
      if(entry.type==="choice")for(const option of entry.options||[]){visit(option);walk(option.entries,visit)}
    }
  };
  const hasItemGrant=entries=>{
    let found=false;
    walk(entries,owner=>{if((owner.itemEffects||[]).some(effect=>Number(effect.amount||0)>0))found=true});
    return found;
  };
  const talkSignature=event=>{
    const parts=[];
    walk(event.entries,entry=>{
      if(entry.type==="dialogue"||entry.type==="narration"){
        const text=String(entry.text||"").normalize("NFKC").toLowerCase().replace(/\s+/g," ").trim();
        if(text)parts.push(text);
      }else if(entry.type==="choice"){
        const prompt=String(entry.prompt||"").normalize("NFKC").toLowerCase().replace(/\s+/g," ").trim();
        if(prompt)parts.push(prompt);
      }
    });
    return parts.join(" | ");
  };
  const roleOf=event=>{
    const explicit=String(event.eventRole||"").toLowerCase();
    const id=String(event.id||"");
    const name=String(event.name||"");
    const legacyActionId=/(?:^|-)act(?:-|\d|$)/i.test(id)||/(?:^|-)action(?:-|\d|$)/i.test(id);
    if(["entry","exit","story","action"].includes(explicit))return explicit;
    if(/^\s*ENTRY(?:\s*[·:|\-]|\s|$)/i.test(name))return"entry";
    if(/^\s*EXIT(?:\s*[·:|\-]|\s|$)/i.test(name))return"exit";
    if(/^\s*ACTION(?:\s*[·:|\-]|\s|$)/i.test(name)||legacyActionId)return"action";
    if(event.menuVisible===false)return"story";
    return"talk";
  };
  const characterKey=character=>key(character?.id||character?.name||"");
  const closeByCharacter={
    charliemorningstar:"찰리는 방금 나눈 이야기를 잊지 않으려는 듯 체크리스트 귀퉁이에 작은 별표를 그린다.",
    vaggie:"배기는 주변을 한 번 더 확인한 뒤, 조금 누그러진 표정으로 고개를 끄덕인다.",
    alastor:"알래스터는 라디오 다이얼을 한 칸 돌린 뒤 의미를 알 수 없는 미소를 남긴다.",
    vox:"복스의 화면에 짧은 파형이 스쳤다가, 아무 일도 없었다는 듯 평소의 미소로 돌아온다.",
    niffty:"니프티는 대화가 끝나자마자 방금 발견한 새로운 할 일을 향해 쏜살같이 달려간다.",
    angeldust:"엔젤은 농담을 하나 더 던지려다 말고, 대신 가볍게 어깨를 맞댄다.",
    husk:"허스크는 빈 잔을 천천히 닦으며 방금 한 말이 충분했다는 듯 턱짓한다.",
    lute:"류트는 더 말할 필요가 없다는 듯 무기를 고쳐 쥐지만, 이번에는 먼저 자리를 뜨지 않는다.",
    adam:"아담은 마지막까지 자기가 이긴 대화였다고 우기며 만족스럽게 웃는다.",
    emily:"에밀리는 떠오른 생각을 놓칠세라 두 손을 모으고 한 번 더 힘차게 고개를 끄덕인다.",
    baxter:"백스터는 방금 얻은 반응까지 실험 기록에 적으며 혼자 만족스럽게 웃는다.",
    sirpentious:"펜셔스는 망토를 과장되게 펄럭였지만, 마지막 감사 인사만큼은 의외로 조용하다.",
    cherribomb:"체리는 다음엔 더 시끄러운 일을 하자며 웃고는 손바닥을 내민다.",
    stolas:"스톨라스는 창밖의 별빛을 한 번 올려다본 뒤 한결 부드러운 목소리로 작별한다.",
    loona:"루나는 휴대폰으로 시선을 돌리지만, 입꼬리가 아주 조금 올라간 건 숨기지 못한다.",
    moxxie:"목시는 방금 대화의 결론을 정리하듯 반듯하게 고개를 끄덕인다.",
    millie:"밀리는 기분 좋게 웃으며 다음에는 자신이 먼저 찾아가겠다고 말한다.",
    fizzarolli:"피자로리는 즉석에서 짧은 마무리 포즈를 만들고 네 반응을 확인한다.",
    octavia:"옥타비아는 다시 헤드폰을 쓰기 전, 작게나마 분명한 인사를 남긴다."
  };
  const emotionByCharacter={
    lute:["guarded",34],adam:["joy",38],vox:["curious",34],alastor:["curious",32],
    husk:["calm",30],vaggie:["calm",30],baxter:["curious",46],octavia:["calm",28]
  };

  function addLinkedReward(event,item,character,helpers){
    if(!event||!item)return false;
    let existing=false;
    walk(event.entries,owner=>{
      if((owner.itemEffects||[]).some(effect=>effect.itemId===item.id))existing=true;
    });
    if(existing)return false;
    const rewardId="dialogue-reward-"+String(event.id).replace(/[^a-zA-Z0-9_-]+/g,"-")+"-"+String(item.id).replace(/[^a-zA-Z0-9_-]+/g,"-");
    const reward={
      id:rewardId,
      type:"narration",
      text:`대화를 마치자 ${character?.name||"상대"}가 「${item.name}」을(를) 건넨다.`,
      itemEffects:[{id:rewardId+"-grant",itemId:item.id,amount:1,once:true}]
    };
    event.entries.push(typeof helpers.normalizeEntry==="function"?helpers.normalizeEntry(reward):reward);
    item.inventoryEventId=event.id;
    return true;
  }
  function itemScore(item,eventTokens,eventId){
    const itemTokens=tokens([item.name,item.description].join(" "));
    let score=0;
    itemTokens.forEach(token=>{if(eventTokens.has(token))score+=10});
    score+=Math.max(0,5-(hash(eventId+"::"+item.id)%6));
    return score;
  }
  function bestReward(source,event,used,granted){
    const eventTokens=tokens([event.name,...(event.entries||[]).map(entry=>entry.text||entry.prompt||"")].join(" "));
    return (source.items||[])
      .filter(item=>item.enabled!==false&&item.collectionCharacterId===event.characterId&&!used.has(item.id)&&!granted.has(item.id))
      .sort((a,b)=>itemScore(b,eventTokens,event.id)-itemScore(a,eventTokens,event.id)||hash(event.id+a.id)-hash(event.id+b.id))[0]||null;
  }
  function enrichVoiceEvent(source,event,character,helpers){
    let changed=false;
    const suffix=String(event.id).replace(/[^a-zA-Z0-9_-]+/g,"-");
    const variableId="seen_"+suffix.replace(/-/g,"_");
    if(!source.variables.some(variable=>variable.id===variableId)){
      source.variables.push(helpers.normalizeVariable({id:variableId,name:`확인 · ${event.name}`,type:"boolean",defaultValue:"false"}));
      changed=true;
    }
    const first=event.entries[0];
    if(first&&!((first.effects||[]).some(effect=>effect.variableId===variableId))){
      first.effects=[...(first.effects||[]),{id:suffix+"-seen",variableId,operation:"set",value:"true"}];
      changed=true;
    }
    const player=event.entries.find(entry=>entry.type==="dialogue"&&(entry.speaker==="PLAYER"||!entry.speakerCharacterId));
    if(player&&character&&!((player.affectionEffects||[]).some(effect=>effect.characterId===character.id))){
      player.affectionEffects=[...(player.affectionEffects||[]),{id:suffix+"-affection",characterId:character.id,amount:1}];
      changed=true;
    }
    const closeId=suffix+"-closing-narration";
    if(!event.entries.some(entry=>entry.id===closeId)){
      const identity=characterKey(character);
      const emotion=emotionByCharacter[identity]||["joy",30];
      const closing={
        id:closeId,type:"narration",
        text:closeByCharacter[identity]||`${character?.name||"상대"}가 방금 나눈 이야기를 되새기듯 잠시 머문 뒤 자리를 정리한다.`,
        emotionEffects:character?[{id:suffix+"-emotion",characterId:character.id,state:emotion[0],intensity:emotion[1]}]:[]
      };
      event.entries.push(typeof helpers.normalizeEntry==="function"?helpers.normalizeEntry(closing):closing);
      changed=true;
    }
    return changed;
  }

  window.HV_APPLY_DIALOGUE_PRESETS=(source,helpers={})=>{
    if(!source||!Array.isArray(source.events))return{state:source,changed:false};
    const current=Math.max(0,Number(source.dialoguePresetVersion)||0);
    let changed=false;
    const characters=new Map((source.characters||[]).map(character=>[character.id,character]));
    if(current<17&&pruneRetiredSoloTalk(source))changed=true;
    if(current<17&&syncTunedStoryPacks(source))changed=true;
    if(current<17&&repairLegacyCharacterRefs(source))changed=true;
    if(current<17){
      for(const event of source.events||[])if(localizeEntryTree(event.entries))changed=true;
      for(const ask of source.asks||[])if(localizeEntryTree(ask.entries))changed=true;
      for(const item of source.items||[]){
        for(const reaction of item.reactions||[]){
          for(const field of ["firstEntries","repeatEntries","specialEntries"]){
            if(localizeEntryTree(reaction[field]))changed=true;
          }
        }
      }
      for(const row of source.playState?.log||[]){
        if(typeof row?.text==="string"){
          const next=localizeLegacyDialogue(row.text);
          if(next!==row.text){row.text=next;changed=true}
        }
      }
    }
    if(normalizeLuciferNameKnowledge(source))changed=true;
    if(addLuciferLowAffectionCourtesyChoices(source,helpers))changed=true;
    const seenTalkSignatures=new Map();
    for(const event of source.events){
      const role=roleOf(event);
      if(event.eventRole!==role){event.eventRole=role;changed=true}
      if(role==="action"&&/^\s*ACTION\s*[·:|\-]/i.test(event.name||"")){
        event.name=String(event.name).replace(/^\s*ACTION\s*[·:|\-]\s*/i,"TALK · ");
        changed=true;
      }
      const visible=["talk","action"].includes(role)?event.menuVisible!==false:false;
      if(event.menuVisible!==visible){event.menuVisible=visible;changed=true}
      if(role==="talk"&&(hasItemGrant(event.entries)||/보관을 맡기다|아이템\s*(?:획득|지급)|수집품을?\s*건네/i.test(String(event.name||"")))){
        if(event.randomEligible!==false){event.randomEligible=false;changed=true}
      }
      if(role==="talk"){
        const signature=talkSignature(event);
        if(signature){
          const signatureKey=String(event.characterId||"")+"::"+signature;
          if(seenTalkSignatures.has(signatureKey)){
            if(event.randomEligible!==false){event.randomEligible=false;changed=true}
          }else seenTalkSignatures.set(signatureKey,event.id);
        }
      }
      if(current<3&&String(event.id).startsWith("voice-")){
        if(enrichVoiceEvent(source,event,characters.get(event.characterId),helpers))changed=true;
      }
    }

    if(current<3){
      const used=new Set();
      const granted=new Set();
      const collectGranted=entries=>walk(entries,owner=>{
        for(const effect of owner.itemEffects||[])if(effect.itemId)granted.add(effect.itemId);
      });
      for(const event of source.events||[])collectGranted(event.entries);
      for(const ask of source.asks||[])collectGranted(ask.entries);
      for(const item of source.items||[]){
        if(!item.inventoryEventId)continue;
        const event=source.events.find(candidate=>candidate.id===item.inventoryEventId);
        if(event&&addLinkedReward(event,item,characters.get(event.characterId),helpers)){changed=true;granted.add(item.id)}
        used.add(item.id);
      }
      for(const event of source.events.filter(candidate=>candidate.eventRole==="talk"&&String(candidate.id).startsWith("voice-"))){
        const item=bestReward(source,event,used,granted);
        if(!item)continue;
        if(addLinkedReward(event,item,characters.get(event.characterId),helpers)){used.add(item.id);granted.add(item.id);changed=true}
      }
    }
    if(current<VERSION){
      source.dialoguePresetVersion=VERSION;
      changed=true;
    }
    return{state:source,changed};
  };
  window.HV_DIALOGUE_PRESET_VERSION=VERSION;
})();
