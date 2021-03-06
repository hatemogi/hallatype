# 한 달짜리 프로젝트 개발 이야기 (0.1) - 계획

이번 개인 프로젝트는 좀 계획적으로 도전해보려 합니다. 평소 성향대로 느긋이 하다 보면 결국 정체기를 겪으며 의욕이 사그라드러서 마무리를 못하게 될 때가 더러 있었기에, 짧은 기간 동안 집중해 개발하는 것이 목표지요. 대략 한 달의 기간을 어떻게 쓰느냐에 따라 간단하게나마 데모를 공개할 수 있을지 판가름 날 텐데요, 총기간을 따져보니, 약 22일 정도의 시간이 있고, 그중 주말이나 공휴일이라서 출근하지 않는 날은 5일 정도가 있더군요. 생각보다 짧은 기간이라서 잘게 쪼개고 악착같이 활용해야 하겠습니다. 자칫 넷플릭스나 브롤스타즈에 시간을 많이 뺏긴다면 기간 내에 시연에 실패하는 것은 뻔한 상황인 것 같습니다.

## 언어, 프레임워크, 도구 선택

개인 프로젝트, 그리고 일부의 신규 업무 프로젝트는 새로운 언어나 프레임워크를 선택할 기회가 생기기도 합니다. 특히 개인 프로젝트는 혼자서 마음대로 정하면 되기 때문에 자유도가 아주 높은 편이지요. 그러나, 신규 프로젝트를 시작하면서 너무 많은 선택지의 장단점을 고려하는데 에너지를 쏟으면 안 됩니다. 사실상 언어나 도구의 선택은 당장의 생산성이 0인 활동이기 때문에, 이상적으로는 프로젝트 시작 전에 미리 정해두는 게 좋은 것 같습니다. 평소 관심 있게 살펴보며 예제도 따라 해 보면서 어떤 언어나 도구가 좋은지를 비교해 두었다가 이용하는 게 맞지, 프로젝트 시작하고 나서 그걸 고르고 앉아 있는 것은 이미 늦은 일 같습니다.

프로젝트의 예상 수명이 길 수록, 더 많이 공들여서 각 선택지의 장단점을 고르게 됩니다만, 사실 공들인다고 해도 최선의 결정을 하기는 너무 어렵습니다. 어떤 회사나 팀이 특정 결정을 잘해서 프로젝트가 성공했다고 주장하는 것은 어떻게 보면 사후 합리화의 일종인 것 같습니다. 그 프로젝트가 잘됐으면 그들이 사용한 언어나 프레임워크가 후광을 받는 것이고, 또 반대로, 프로젝트가 망했으면 아무리 좋은 언어나 프레임워크를 썼다고 하더라도 별 관심이 가지 않는 거지요.

암튼, 이번 프로젝트는 시작 전에 미리 언어와 기본 프레임워크를 정해두었습니다. 타입스크립트(TypeScript)로 개발할 거고, 뷰(Vue)를 쓰려고 합니다. 언어의 선택지로는 ES5, Elm, ClojureScript, TypeScript를 놓고 고민해 볼 수 있는데, 이번엔 꽤 대중적인 타입스크립트를 골랐습니다. 자바스크립트 쪽에서 타입스크립트가 꽤 각광받고 있는 것 같고, 앞으로도 당분간 꽤 흥할 것 같아서 함께 흘러가 보려 합니다.

사실 이번 프로젝트는 거의 HTML5 캔버스에 그리는 부분이 핵심일 거라서, 뷰를 쓰던 리액트를 쓰던 큰 차이가 없을 것 같고, 심지어 안 써도 될 것 같긴 하네요.

에디터도 비주얼 스튜디오 코드(vscode)를 쓰면 될 것 같습니다. 워낙 타입스크립트 지원이 강력하여 그냥 묻어서 쓰면 될 것 같군요.

## 사람들에게 무얼 보일지에 대한 고민

주변 사람들에게 이번 프로젝트 아이디어를 얘기해봤는데, 반응이 별로 좋지 않더군요. 요약하자면, 요새 그런 걸 누가 쓰겠냐는 의견이었습니다. 주변 사람들의 말이 맞다면 이번 프로젝트도 흥행에는 실패할 것 같지만, 그래도 기술적으로는 제게 재밌는 부분이 있어서 해보려 합니다. 이렇게라도 뭔가 하다 보면 흥행 요소에서도 배워가는 게 있기를 바라면서요.

어쨌건 흥행 성패는, 전문적으로 기획하는 분들에게도 미지의 영역인 거니, 지나친 기대나 걱정은 하지 말고 해 볼 텐데요, 그래도 다행인 것은, 나름 쓸 사람에 대한 고민을 조금은 하고 있다는 점입니다. 그냥 개발자 입장으로는 "내가 이런 멋진 걸 만들면, 남들도 우와~하면서 써줄 거야"라고 낙관하게 되는데요, 그러지 말고, 초점을 더 사용자 쪽으로 옮겨서, 내가 생각하는 사용자 입장에서는 이러 이런 게 필요한 기능인 것 같다고 생각해보려 합니다.

주워들은 얘기로는 제품을 사용할 특정한 가상의 사용자를  "페르소나"라고 부르는 것 같습니다. 암튼, 페르소나를 대략 정해놓고, 그 사용자라면 어떤 게 필요한 기능인지, 어떤 것은 필요 없는지 가르며 꼭 필요한 핵심 기능만을 구현해야 하겠습니다.

결국 개발 프로젝트는, 해야할 일은 많고 필요한 자원은 늘 부족하기 때문에, 아주 적은 결과물 만으로도 최대한 많은 성과를 내려는 노력을 해야 하는데요, 그러려면 성과의 기준과 대상이 정확하면 좋겠습니다. 어차피 결과를 드러내 보면 예상과는 전혀 다를 수도 있지만, 그래도 만드는 과정에서 갈팡질팡하지 않게끔 길잡이 역할은 해줄 거라 기대합니다.

## 두 번의 릴리스 계획

22일이래 봤자, 근무하는 날은 많아야 2시간 정도 할 수 있을 테고, 노는 날은 매진해서 10시간을 개발한다고  치면,

17 * 2시간 +  5 * 10시간 = 84시간

밖에 없네요. 생각보다 시간이 더 짧네요. 아, 실패할 것 같습니다. 그래도 이렇게 미리미리 시작 전에 도구 선정도 끝내 놓고, 프로그램 디자인도 미리미리 해두면 84시간 동안은 개발 자체에만 집중할 수도 있을 테니, 어떠면 가능할 것 같기도 합니다.

그 와중에 낙관적으로 두 번의 릴리스를 목표로 해보겠습니다. 첫 릴리스는 가장 중요한 기능 한 두 개만 골라서 데모로 만들어서 공개할 예정입니다. 과연 몇 분이나 써봐 주실지 모르겠지만, 써보는 분들의 의견을 바탕으로 2차 릴리스에 넣을 기능을 선택해도 될 것 같습니다. 의견이 없거나 안 좋다면, 아예 2차 릴리스는 없던 일로 하게 될지도 모르겠네요. (그러지 않기를 바라지만요... ^.-)

그럼, 계속 응원 부탁드리겠습니다. 고맙습니다. (언제나 그렇듯, 아래 박수 버튼을 누르시면 다음 편이 빨리 올라옵니다. ^^)
