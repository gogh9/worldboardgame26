// 세계여행 말판놀이 - 세계의 자연환경 데이터 정의 (교과서 52~53쪽 지형/기후 단답형 정답 완벽 반영)

export const CLIMATE_CARDS = [
  {
    id: 'c1',
    name: '1. 열대 (열대 우림/밀림)',
    image: 'assets/cards/climate_1.jpg',
    question: '위 사진이 나타내는 기후는 무엇일까요? (○○)',
    description: '연중 기온이 높고 강수량이 많아 키 큰 나무들이 빽빽하게 우거진 밀림이 형성되는 열대 기후입니다.',
    answer: '열대',
    acceptableAnswers: ['열대', '열대 기후', '열대기후', '열대 우림', '밀림', '정글'],
    initialHint: 'ㅇㄷ',
    hint: '적도 부근으로 1년 내내 덥고 비가 많이 내리는 기후입니다.'
  },
  {
    id: 'c2',
    name: '2. 열대 (고상 가옥)',
    image: 'assets/cards/climate_2.jpg',
    question: '위 사진의 고상 가옥이 주로 발달한 기후는 무엇일까요? (○○)',
    description: '지면의 열기와 습기, 해충을 피하고 통풍을 원활하게 하기 위해 기둥 위에 집을 짓는 열대 기후입니다.',
    answer: '열대',
    acceptableAnswers: ['열대', '열대 기후', '열대기후', '고상 가옥', '고상가옥'],
    initialHint: 'ㅇㄷ',
    hint: '지면에서 올라오는 습기와 열기를 막기 위해 바닥을 띄워 집을 짓는 기후입니다.'
  },
  {
    id: 'c3',
    name: '3. 건조 (흙벽돌 가옥)',
    image: 'assets/cards/climate_3.jpg',
    question: '위 사진의 흙벽돌 가옥이 주로 발달한 기후는 무엇일까요? (○○)',
    description: '뜨거운 햇볕과 모래바람을 막기 위해 벽을 두껍게 하고 창문을 작게 낸 흙벽돌집이 많은 건조 기후입니다.',
    answer: '건조',
    acceptableAnswers: ['건조', '건조 기후', '건조기후', '사막 기후', '사막'],
    initialHint: 'ㄱㅈ',
    hint: '비가 거의 오지 않고 햇볕이 뜨거워 흙벽돌로 두껍게 집을 짓는 기후입니다.'
  },
  {
    id: 'c4',
    name: '4. 건조 (게르/초원 유목)',
    image: 'assets/cards/climate_4.jpg',
    question: '위 사진의 이동식 천막(게르)이 주로 발달한 기후는 무엇일까요? (○○)',
    description: '풀을 찾아 가축을 몰고 이동하기 위해 조립과 해체가 쉬운 천막(게르)을 짓고 유목 생활을 하는 건조(스텝) 기후입니다.',
    answer: '건조',
    acceptableAnswers: ['건조', '건조 기후', '건조기후', '스텝 기후', '스텝', '게르'],
    initialHint: 'ㄱㅈ',
    hint: '비가 적게 내려 나무는 잘 자라지 않고 풀이 자라는 초원에서 유목을 하는 기후입니다.'
  },
  {
    id: 'c5',
    name: '5. 온대 (지중해성 올리브 농업)',
    image: 'assets/cards/climate_5.jpg',
    question: '위 사진의 올리브 농업이 주로 발달한 기후는 무엇일까요? (○○)',
    description: '여름이 덥고 건조하여 가뭄을 잘 견디는 올리브, 코르크, 포도 등을 재배하는 온대(지중해성) 기후입니다.',
    answer: '온대',
    acceptableAnswers: ['온대', '온대 기후', '온대기후', '지중해성 기후', '지중해성', '지중해'],
    initialHint: 'ㅇㄷ',
    hint: '사계절이 비교적 뚜렷하며 지중해 연안처럼 여름철 건조한 기후에 올리브를 재배합니다.'
  },
  {
    id: 'c6',
    name: '6. 냉대 (타이가 침엽수림)',
    image: 'assets/cards/climate_6.jpg',
    question: '위 사진의 침엽수림(타이가)이 넓게 펼쳐진 기후는 무엇일까요? (○○)',
    description: '겨울이 춥고 길어 가문비나무, 소나무 등 바늘잎 침엽수림(타이가)이 울창하게 발달한 냉대 기후입니다.',
    answer: '냉대',
    acceptableAnswers: ['냉대', '냉대 기후', '냉대기후', '타이가'],
    initialHint: 'ㄴㄷ',
    hint: '러시아 시베리아와 캐나다 등 겨울이 매우 춥고 침엽수림이 가득한 기후입니다.'
  },
  {
    id: 'c7',
    name: '7. 한대 (이글루/얼음집)',
    image: 'assets/cards/climate_7.jpg',
    question: '위 사진의 이글루가 주로 발달한 기후는 무엇일까요? (○○)',
    description: '눈과 얼음 벽돌을 둥글게 쌓은 이글루처럼 1년 내내 매우 추운 극지방의 한대 기후입니다.',
    answer: '한대',
    acceptableAnswers: ['한대', '한대 기후', '한대기후', '툰드라 기후', '툰드라', '극지방'],
    initialHint: 'ㅎㄷ',
    hint: '북극이나 남극 주변처럼 1년 내내 영하의 기온으로 얼음과 눈이 가득한 기후입니다.'
  },
  {
    id: 'c8',
    name: '8. 고산 (상춘 기후 도시)',
    image: 'assets/cards/climate_8.jpg',
    question: '위 사진처럼 높은 산지에 대도시가 형성된 기후는 무엇일까요? (○○)',
    description: '열대 지역이지만 해발고도가 높아 1년 내내 봄과 같은 온화한 날씨(상춘 기후)가 나타나는 고산 기후입니다.',
    answer: '고산',
    acceptableAnswers: ['고산', '고산 기후', '고산기후', '상춘 기후', '안데스 고산'],
    initialHint: 'ㄱㅅ',
    hint: '해발 3,000m 이상의 높은 산지에 위치하여 1년 내내 봄 날씨가 이어지는 기후입니다.'
  }
];

export const TERRAIN_CARDS = [
  {
    id: 't1',
    name: '1. 산 (마터호른/혼)',
    image: 'assets/cards/terrain_1.jpg',
    question: '위 사진이 나타내는 지형은 무엇일까요? (○)',
    description: '여러 빙하의 침식 작용으로 산봉우리가 뾰족하게 깎인 스위스 마터호른 같은 험준한 산 지형입니다.',
    answer: '산',
    acceptableAnswers: ['산', '산지', '높은 산', '혼', '호른'],
    initialHint: 'ㅅ',
    hint: '주변보다 높이 솟아오른 험준한 지형으로, 봉우리가 뾰족합니다.'
  },
  {
    id: 't2',
    name: '2. 고원 (대협곡/평탄지)',
    image: 'assets/cards/terrain_2.jpg',
    question: '위 사진이 나타내는 지형은 무엇일까요? (○○)',
    description: '해발고도가 높은 곳에 평탄한 면이 넓게 펼쳐져 있는 고원 지형입니다.',
    answer: '고원',
    acceptableAnswers: ['고원', '고원지대', '고원 지대', '대협곡', '협곡'],
    initialHint: 'ㄱㅇ',
    hint: '높은 산지에 위치하지만 위쪽이 평평하게 펼쳐진 지형입니다.'
  },
  {
    id: 't3',
    name: '3. 화산 (용암 분출)',
    image: 'assets/cards/terrain_3.jpg',
    question: '위 사진이 나타내는 지형은 무엇일까요? (○○)',
    description: '지하 마그마가 지표면을 뚫고 분출하여 용암과 화산재가 흘러내려 형성된 화산 지형입니다.',
    answer: '화산',
    acceptableAnswers: ['화산', '화산 지형', '화산지형', '용암'],
    initialHint: 'ㅎㅅ',
    hint: '지구 내부의 뜨거운 마그마와 용암이 뿜어져 나와 만들어진 산입니다.'
  },
  {
    id: 't4',
    name: '4. 강 (하천 곡류/평야)',
    image: 'assets/cards/terrain_4.jpg',
    question: '위 사진이 나타내는 지형은 무엇일까요? (○)',
    description: '물이 굽이쳐 흐르며 퇴적물이 쌓여 비옥한 평야와 농경지를 만드는 강(하천) 지형입니다.',
    answer: '강',
    acceptableAnswers: ['강', '하천', '강물', '곡류'],
    initialHint: 'ㄱ',
    hint: '육지 위를 흘러 바다나 호수로 들어가는 물줄기입니다.'
  },
  {
    id: 't5',
    name: '5. 갯벌 (해안 조간대)',
    image: 'assets/cards/terrain_5.jpg',
    question: '위 사진이 나타내는 지형은 무엇일까요? (○○)',
    description: '밀물과 썰물의 차이로 인해 물이 빠졌을 때 넓게 드러나는 고운 펄과 모래로 이루어진 갯벌 해안 지형입니다.',
    answer: '갯벌',
    acceptableAnswers: ['갯벌', '조간대', '갯벌 해안'],
    initialHint: 'ㄱㅂ',
    hint: '바닷물이 빠져나갔을 때 드러나는 질퍽한 펄 바닥입니다.'
  },
  {
    id: 't6',
    name: '6. 사막 (사구/모래언덕)',
    image: 'assets/cards/terrain_6.jpg',
    question: '위 사진이 나타내는 지형은 무엇일까요? (○○)',
    description: '바람에 날린 모래가 쌓여 거대한 모래 언덕(사구)을 이루고 비가 거의 오지 않는 건조한 사막 지형입니다.',
    answer: '사막',
    acceptableAnswers: ['사막', '사구', '모래언덕', '모래 언덕', '바르한'],
    initialHint: 'ㅅㅁ',
    hint: '비가 매우 적게 내리고 끝없이 모래와 자갈이 펼쳐진 건조 지형입니다.'
  },
  {
    id: 't7',
    name: '7. 초원 (대평원)',
    image: 'assets/cards/terrain_7.jpg',
    question: '위 사진이 나타내는 지형은 무엇일까요? (○○)',
    description: '나무가 거의 없고 끝없이 풀이 자라는 완만한 구릉과 넓은 평원 지형인 초원입니다.',
    answer: '초원',
    acceptableAnswers: ['초원', '대평원', '평원', '스텝', '사바나', '초원 지대'],
    initialHint: 'ㅊㅇ',
    hint: '나무 대신 푸른 풀이 끝없이 펼쳐져 동물들이 풀을 뜯는 땅입니다.'
  },
  {
    id: 't8',
    name: '8. 빙하 (빙벽/빙설)',
    image: 'assets/cards/terrain_8.jpg',
    question: '위 사진이 나타내는 지형은 무엇일까요? (○○)',
    description: '오랜 시간 쌓인 눈이 단단한 얼음이 되어 천천히 흐르며 거대한 빙벽과 계곡을 만든 빙하 지형입니다.',
    answer: '빙하',
    acceptableAnswers: ['빙하', '빙벽', '빙설', '빙하 지형'],
    initialHint: 'ㅂㅎ',
    hint: '눈이 단단하게 굳어져 큰 덩어리가 되어 천천히 흘러내리는 얼음 지형입니다.'
  }
];

export const BOARD_CELLS = [
  {
    index: 0,
    type: 'start',
    title: '출발선 (START)',
    badge: '🚀',
    category: '특수',
    region: '유럽',
    description: '세계여행 말판놀이를 시작합니다! 주사위를 굴려 탐험을 떠나보세요.',
    color: '#3b82f6'
  },
  {
    index: 1,
    num: 1,
    type: 'quiz',
    title: '1번. 피오르 해안',
    badge: '1',
    category: '지형 퀴즈',
    region: '북유럽 노르웨이',
    question: '빙하의 침식으로 만들어진 골짜기에 빙하가 없어진 후 바닷물이 들어와서 생긴 해안을 무엇이라고 하나요?',
    answer: '피오르 해안',
    acceptableAnswers: [
      '피오르 해안', '피오르해안', '피오르', '피오르드', '피오르드 해안', '피오르드해안',
      '피오르 (피오르드) 해안', '피오르(피오르드) 해안', '피오르드 (피오르) 해안', '피오르드(피오르) 해안'
    ],
    initialHint: 'ㅍㅇㄹ ㅎㅇ',
    explanation: '노르웨이 등 고위도 지역에서 빙하가 깎아 만든 U자곡에 바닷물이 유입되어 형성된 해안을 피오르(Fiord)라고 합니다.',
    color: '#06b6d4'
  },
  {
    index: 2,
    type: 'terrain_card',
    title: '지형 카드',
    badge: '🏔️',
    category: '지형 미션',
    region: '알프스/산악',
    description: '지형 카드를 뒤집어 사진이 어떤 지형인지 설명하세요.',
    color: '#10b981'
  },
  {
    index: 3,
    num: 2,
    type: 'quiz',
    title: '2번. 지중해 가옥',
    badge: '2',
    category: '기후/문화',
    region: '남유럽 지중해',
    question: '[ _____ ] 주변 지역에는 여름철 뜨거운 햇볕을 막으려고 벽을 흰색으로 칠하는 가옥이 많습니다.',
    answer: '지중해',
    acceptableAnswers: ['지중해', '지중해 주변', '지중해성', '지중해 바다', '지중해연안', '지중해 연안'],
    initialHint: 'ㅈㅈㅎ',
    explanation: '지중해 연안(그리스 산토리니 등)은 여름이 맑고 햇볕이 매우 강하기 때문에 빛을 반사하는 흰색 벽 가옥이 발달했습니다.',
    color: '#3b82f6'
  },
  {
    index: 4,
    num: 3,
    type: 'quiz',
    title: '3번. 히말라야산맥',
    badge: '3',
    category: '지형 퀴즈',
    region: '남아시아/중앙아시아',
    question: '인도와 네팔, 중국 등에 걸쳐 있는 산맥으로, 세계에서 가장 높은 에베레스트산이 있는 산맥은 무엇인가요?',
    answer: '히말라야산맥',
    acceptableAnswers: ['히말라야산맥', '히말라야 산맥', '히말라야', '히말라야 산맥 (에베레스트)', '히말라야산'],
    initialHint: 'ㅎㅁㄹㅇㅅㅁ',
    explanation: '대륙판끼리 충돌하여 솟아오른 세계의 지붕이자 에베레스트산이 있는 히말라야산맥입니다.',
    color: '#8b5cf6'
  },
  {
    index: 5,
    type: 'climate_card',
    title: '기후 카드',
    badge: '☀️',
    category: '기후 미션',
    region: '아시아/초원',
    description: '기후 카드를 뒤집어 해당 사진이 무엇인지 설명하세요.',
    color: '#f59e0b'
  },
  {
    index: 6,
    num: 4,
    type: 'quiz',
    title: '4번. 냉대 기후 산업',
    badge: '4',
    category: '기후/산업',
    region: '시베리아/캐나다',
    question: '캐나다와 러시아 등 침엽수가 많은 냉대 기후 지역에서 주로 발달한 산업에는 무엇이 있나요?',
    answer: '임업',
    acceptableAnswers: [
      '임업', '입업', '입업(임업)', '임업(입업)', '임업, 펄프 공업', '임업 펄프 공업',
      '임업과 펄프 공업', '임업 및 펄프 공업', '펄프 공업', '펄프공업',
      '목재 산업', '펄프 산업', '임업, 펄프', '임업 펄프'
    ],
    initialHint: 'ㅇㅇ',
    explanation: '냉대 타이가 침엽수림의 풍부한 목재를 바탕으로 임업과 펄프·종이 가공 공업이 크게 발달했습니다.',
    color: '#059669'
  },
  {
    index: 7,
    type: 'world_travel',
    title: '세계여행 찬스!',
    badge: '✈️',
    category: '특수 찬스',
    region: '태평양 상공',
    description: '다음 차례에 원하는 칸으로 갈 수 있어요.',
    color: '#ec4899'
  },
  {
    index: 8,
    num: 5,
    type: 'quiz',
    title: '5번. 툰드라 순록 유목',
    badge: '5',
    category: '기후/생활',
    region: '북아메리카/북극권',
    question: '한대 기후 지역에서는 여름에 풀과 이끼를 찾아다니며 순록을 기르는 [ _____ ] 생활을 하기도 합니다.',
    answer: '유목',
    acceptableAnswers: ['유목', '유목 생활', '유목생활', '이동 목축', '순록 유목', '순록유목'],
    initialHint: 'ㅇㅁ',
    explanation: '작물이 자라기 힘든 극한의 환경에서 순록 떼를 몰고 이동하며 젖과 털, 고기를 얻는 유목 생활을 합니다.',
    color: '#0284c7'
  },
  {
    index: 9,
    num: 6,
    type: 'quiz',
    title: '6번. 아마존강',
    badge: '6',
    category: '지형 퀴즈',
    region: '남아메리카 브라질',
    question: '브라질, 페루 등에 걸쳐 흐르는 하천으로, 세계에서 가장 유량이 많은 하천은 무엇인가요?',
    answer: '아마존강',
    acceptableAnswers: ['아마존강', '아마존 강', '아마존', '아마존 하천', '아마존강 (아마존)'],
    initialHint: 'ㅇㅁㅈㄱ',
    explanation: '아마존강은 전 세계 하천 유량의 약 20%를 차지할 정도로 가장 물이 풍부하고 유역 면적이 넓은 하천입니다.',
    color: '#16a34a'
  },
  {
    index: 10,
    num: 7,
    type: 'quiz',
    title: '7번. 안데스 판초',
    badge: '7',
    category: '의생활 문화',
    region: '남아메리카 안데스',
    question: '남아메리카 적도 주변의 고산 지역에 사는 사람들이 추위를 막으려고 입는 망토와 같은 옷을 무엇이라고 하나요?',
    answer: '판초',
    acceptableAnswers: ['판초', '폰초', '판초(폰초)', '폰초(판초)', '판초 / 폰초', '안데스 판초', '안데스 폰초'],
    initialHint: 'ㅍㅊ',
    explanation: '라마나 알파카의 털로 짠 두꺼운 천 가운데에 머리를 넣는 구멍을 뚫어 망토처럼 두르는 안데스 고산 지대의 전통 옷입니다.',
    color: '#d97706'
  },
  {
    index: 11,
    type: 'desert_island',
    title: '무인도 조난!',
    badge: '🏝️',
    category: '특수 벌칙',
    region: '남태평양',
    description: '한 번 쉬고 다음 차례에 이동하세요.',
    color: '#eab308'
  },
  {
    index: 12,
    num: 8,
    type: 'quiz',
    title: '8번. 산호초 해안',
    badge: '8',
    category: '지형/생태',
    region: '오세아니아/호주',
    question: '따뜻한 기후 지역의 얕은 바닷속에 사는 산호와 산호충의 뼈 등이 쌓여 이루어진 암초 해안을 무엇이라고 하나요?',
    answer: '산호초 해안',
    acceptableAnswers: [
      '산호초 해안', '산호초해안', '산호초', '산호초 (대보초) 해안',
      '대보초', '대보초 해안', '그레이트 배리어 리프', '산호 해안'
    ],
    initialHint: 'ㅅㅎㅊ ㅎㅇ',
    explanation: '호주의 그레이트 배리어 리프(대보초)처럼 산호들이 오랜 세월 군락을 이루며 만든 신비한 해안 지형입니다.',
    color: '#0ea5e9'
  },
  {
    index: 13,
    type: 'terrain_card',
    title: '지형 카드',
    badge: '🌋',
    category: '지형 미션',
    region: '환태평양/해양',
    description: '지형 카드를 뒤집어 사진이 어떤 지형인지 설명하세요.',
    color: '#10b981'
  },
  {
    index: 14,
    num: 9,
    type: 'quiz',
    title: '9번. 수상 가옥',
    badge: '9',
    category: '주생활 문화',
    region: '동남아시아/하천',
    question: '하천 주변 지역에서 물 위에 지은 가옥을 무엇이라고 하나요?',
    answer: '수상 가옥',
    acceptableAnswers: ['수상 가옥', '수상가옥', '수상', '수상 집', '수상집', '물 위 가옥'],
    initialHint: 'ㅅㅅ ㄱㅇ',
    explanation: '홍수 피해를 막고 물 위에서 물고기를 잡거나 배를 교통수단으로 활용하기 위해 물 위에 나무 기둥을 세워 지은 가옥입니다.',
    color: '#0d9488'
  },
  {
    index: 15,
    type: 'climate_card',
    title: '기후 카드',
    badge: '🌧️',
    category: '기후 미션',
    region: '인도양/아프리카',
    description: '기후 카드를 뒤집어 해당 사진이 무엇인지 설명하세요.',
    color: '#f59e0b'
  },
  {
    index: 16,
    num: 10,
    type: 'quiz',
    title: '10번. 사파리',
    badge: '10',
    category: '기후/문화',
    region: '아프리카 세렝게티',
    question: '열대 사바나 기후 지역에서 차를 타고 다니면서 야생 동물을 관찰하는 여행을 무엇이라고 하나요?',
    answer: '사파리',
    acceptableAnswers: ['사파리', '사파리 여행', '사파리투어', '사파리 투어', '사파리 관람', '사파리 관광'],
    initialHint: 'ㅅㅍㄹ',
    explanation: '사바나 초원에 서식하는 다양한 초식동물과 맹수를 지프차 등을 타고 자연 그대로 관찰하는 대표적인 관광 여행입니다.',
    color: '#ca8a04'
  },
  {
    index: 17,
    type: 'hint_key',
    title: '교과서 찬스!',
    badge: '📖',
    category: '특수 찬스',
    region: '사하라 오아시스',
    description: '다음 차례에 교과서를 10초 동안 볼 수 있어요.',
    color: '#facc15'
  },
  {
    index: 18,
    num: 11,
    type: 'quiz',
    title: '11번. 사하라 사막',
    badge: '11',
    category: '지형 퀴즈',
    region: '북부 아프리카',
    question: '세계에서 가장 면적이 넓은 사막으로, 아프리카의 북부에 있는 사막은 무엇인가요?',
    answer: '사하라 사막',
    acceptableAnswers: ['사하라 사막', '사하라사막', '사하라', '사하라 대사막'],
    initialHint: 'ㅅㅎㄹ ㅅㅁ',
    explanation: '미국 본토 면적에 맞먹는 약 900만 ㎢의 광활한 면적을 자랑하는 세계 최대의 열대 사막입니다.',
    color: '#e11d48'
  },
  {
    index: 19,
    num: 12,
    type: 'quiz',
    title: '12번. 오아시스 농업',
    badge: '12',
    category: '건조 기후 농업',
    region: '서남아시아/중동',
    question: '건조 기후 지역에서 오아시스나 하천의 물을 이용하여 대추야자와 밀 등을 재배하는 농업을 무엇이라고 하나요?',
    answer: '오아시스 농업',
    acceptableAnswers: ['오아시스 농업', '오아시스농업', '오아시스', '오아시스 관개 농업', '관개 농업', '관개농업'],
    initialHint: 'ㅇㅇㅅㅅ ㄴㅇ',
    explanation: '사막 한가운데 솟아나는 오아시스나 주변 산지에서 흘러오는 지하수를 이용하여 대추야자와 곡물을 재배하는 농업입니다.',
    color: '#7c3aed'
  }
];

export const PLAYER_PROFILES = [
  {
    id: 0,
    name: '레오',
    role: '열정 탐험가',
    colorName: '레드',
    colorHex: '#ef4444',
    glowHex: 'rgba(239, 68, 68, 0.6)',
    bgGradient: 'linear-gradient(135deg, #ef4444, #b91c1c)',
    avatar: '🦁',
    pawnIcon: '🔴'
  },
  {
    id: 1,
    name: '마린',
    role: '해양 항해가',
    colorName: '블루',
    colorHex: '#3b82f6',
    glowHex: 'rgba(59, 130, 246, 0.6)',
    bgGradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
    avatar: '🐬',
    pawnIcon: '🔵'
  },
  {
    id: 2,
    name: '그린',
    role: '생태 지리학자',
    colorName: '그린',
    colorHex: '#10b981',
    glowHex: 'rgba(16, 185, 129, 0.6)',
    bgGradient: 'linear-gradient(135deg, #10b981, #047857)',
    avatar: '🦎',
    pawnIcon: '🟢'
  },
  {
    id: 3,
    name: '써니',
    role: '세계 비행사',
    colorName: '옐로우',
    colorHex: '#f59e0b',
    glowHex: 'rgba(245, 158, 11, 0.6)',
    bgGradient: 'linear-gradient(135deg, #f59e0b, #b45309)',
    avatar: '🦅',
    pawnIcon: '🟡'
  }
];

export const MAP_CELL_COORDINATES = {
  0: { x: 2.75, y: 16.5, label: '출발' },
  1: { x: 11.15, y: 17.65, label: '1' },
  2: { x: 12.35, y: 25.50, label: '지형' },
  3: { x: 14.12, y: 33.79, label: '2' },
  4: { x: 29.98, y: 39.32, label: '3' },
  5: { x: 37.39, y: 27.50, label: '기후' },
  6: { x: 44.76, y: 16.47, label: '4' },
  7: { x: 58.70, y: 17.00, label: '여행' },
  8: { x: 72.89, y: 18.01, label: '5' },
  9: { x: 85.51, y: 55.48, label: '6' },
  10: { x: 82.04, y: 68.00, label: '7' },
  11: { x: 64.70, y: 71.00, label: '무인도' },
  12: { x: 48.03, y: 67.20, label: '8' },
  13: { x: 41.39, y: 58.00, label: '지형' },
  14: { x: 35.26, y: 49.02, label: '9' },
  15: { x: 26.47, y: 52.50, label: '기후' },
  16: { x: 17.77, y: 55.87, label: '10' },
  17: { x: 6.75, y: 52.00, label: '찬스' },
  18: { x: 12.21, y: 42.40, label: '11' },
  19: { x: 7.15, y: 40.14, label: '12' }
};

