# Default Content

`data/default-content.js`가 사이트의 기본 캐릭터/대사 파일입니다.

## 캐릭터

```js
characters: [
  {
    id: "character-id",
    name: "CHARACTER",
    origin: "hellborn",
    role: "",
    image: "",
    quote: "",
    description: "",
    affectionStart: 0,
    emotionDefault: "calm",
    emotionIntensity: 0,
    enabled: true
  }
]
```

## 대화 이벤트

```js
events: [
  {
    id: "character-id-talk-001",
    name: "첫 대화",
    characterId: "character-id",
    entries: [
      { id: "line-001", type: "dialogue", characterId: "character-id", text: "대사" },
      {
        id: "choice-001",
        type: "choice",
        prompt: "어떻게 대답할까?",
        options: [
          {
            id: "option-001",
            label: "선택지",
            entries: [
              { id: "line-002", type: "dialogue", characterId: "character-id", text: "선택 후 대사" }
            ],
            exitMode: "continue",
            targetEventId: ""
          }
        ]
      }
    ],
    nextEventId: "",
    emotionExitMode: "keep"
  }
]
```

누락 필드는 런타임 normalize 함수가 기본값을 채웁니다. ID는 다른 데이터 연결에 쓰이므로 한번 정한 뒤에는 가능하면 유지하세요.

브라우저 EDITOR에서 만든 콘텐츠를 사이트의 영구 기본값으로 만들려면 해당 데이터를 이 파일에 옮기면 됩니다.
