(function () {
  const SUPPORTED_LOCALES = [
    { code: "en", label: "EN", native: "English" },
    { code: "ko", label: "KO", native: "한국어" },
    { code: "ja", label: "JA", native: "日本語" },
    { code: "zh", label: "ZH", native: "中文" },
  ];

  const CURATED_EN_DEFAULT_ROUTES = new Set([
    "/",
    "/company/about.html",
    "/blog/korean-honorifics-guide/",
    "/games/k-meme-quiz/",
    "/products/medical.html",
    "/products/semiconductor.html",
    "/products/chemical.html",
    "/quote/request.html",
    "/quote/payment.html",
    "/quote/",
    "/quote/thank-you.html",
    "/products/",
    "/products/pfa-tube/",
    "/products/ptfe-tube/",
    "/products/esd-pfa-tube/",
    "/saas/ai-ops-autopilot/",
  ]);

  const ROUTE_META = {
    "/": {
      title: {
        en: "Pure-Flon",
        ko: "퓨어플론",
        ja: "ピュアフロン",
        zh: "Pure-Flon",
      },
      description: {
        en: "Pure-Flon routes B2B fluoropolymer products, SaaS intake, free tools, games, and blog discovery from one hub.",
        ko: "Pure-Flon은 B2B 불소수지 제품, SaaS 인입, 무료 도구, 게임, 블로그 유입을 하나의 허브에서 연결합니다.",
        ja: "Pure-FlonはB2Bフッ素樹脂製品、SaaS導線、無料ツール、ゲーム、ブログ導線を1つのハブでつなぎます。",
        zh: "Pure-Flon 将 B2B 氟聚合物产品、SaaS 线索入口、免费工具、游戏与博客流量汇聚在一个中心页面。",
      },
    },
    "/products/medical.html": {
      title: {
        en: "Medical PTFE Tubing | Documentation Review Support | Pure-Flon",
        ko: "의료용 PTFE 튜브 | 문서 검토 지원 | Pure-Flon",
        ja: "医療用 PTFE チューブ | 文書確認サポート | Pure-Flon",
        zh: "医用 PTFE 管 | 文档审核支持 | Pure-Flon",
      },
      description: {
        en: "Medical PTFE tubing for catheter, surgical, and diagnostic device programs, with documentation and qualification review aligned per application.",
        ko: "카테터, 수술기구, 진단장비 프로그램에 맞춰 문서와 적합성 검토를 협의하는 의료용 PTFE 튜브입니다.",
        ja: "カテーテル、手術器具、診断装置向けに文書と適合性確認を用途別に進める医療用 PTFE チューブです。",
        zh: "适用于导管、手术器械和诊断设备项目，并按应用场景协调文档与适配审核的医用 PTFE 管。",
      },
    },
    "/products/semiconductor.html": {
      title: {
        en: "Semiconductor PTFE Tubing | Ultra-High Purity | Pure-Flon",
        ko: "반도체용 PTFE 튜브 | 초고순도 | Pure-Flon",
        ja: "半導体向け PTFE チューブ | 超高純度 | Pure-Flon",
        zh: "半导体用 PTFE 管 | 超高纯度 | Pure-Flon",
      },
      description: {
        en: "Ultra-high-purity PTFE tubing for wafer fabs, etch lines, and CVD/PVD systems with particle-conscious routing.",
        ko: "웨이퍼 제조, 식각 라인, CVD/PVD 장비를 위한 초고순도 PTFE 튜브입니다.",
        ja: "ウェーハ製造、エッチング配管、CVD/PVD 装置向けの超高純度 PTFE チューブです。",
        zh: "适用于晶圆制造、刻蚀管路和 CVD/PVD 设备的超高纯度 PTFE 管。",
      },
    },
    "/products/chemical.html": {
      title: {
        en: "Chemical PTFE Tubing | Broad Chemical Compatibility | Pure-Flon",
        ko: "화학용 PTFE 튜브 | 내화학성 | Pure-Flon",
        ja: "化学向け PTFE チューブ | 耐薬品性 | Pure-Flon",
        zh: "化工用 PTFE 管 | 耐化学性 | Pure-Flon",
      },
      description: {
        en: "Chemical-duty PTFE tubing with broad acid, base, and solvent compatibility for reactors, analyzers, and transfer lines.",
        ko: "반응기, 분석기, 유체 이송 라인을 위한 산, 염기, 용매 대응 화학용 PTFE 튜브입니다.",
        ja: "反応器、分析装置、移送ライン向けの酸・アルカリ・溶剤対応化学用 PTFE チューブです。",
        zh: "适用于反应器、分析设备和输送管路的耐酸碱与溶剂化工用 PTFE 管。",
      },
    },
    "/quote/request.html": {
      title: {
        en: "PTFE Tubing Quote Request | Expert Reply Within 1 Business Day | Pure-Flon",
        ko: "PTFE 튜브 견적 요청 | 1영업일 내 전문가 응답 | Pure-Flon",
        ja: "PTFE チューブ見積依頼 | 1営業日以内に回答 | Pure-Flon",
        zh: "PTFE 管报价申请 | 1 个工作日内回复 | Pure-Flon",
      },
      description: {
        en: "Submit your PTFE tubing RFQ for medical, semiconductor, or chemical applications and get a reply within 1 business day.",
        ko: "의료, 반도체, 화학용 PTFE 튜브 RFQ를 제출하고 1영업일 내 답변을 받으세요.",
        ja: "医療、半導体、化学用途の PTFE チューブ RFQ を送信し、1営業日以内に回答を受け取れます。",
        zh: "提交医疗、半导体、化工用途的 PTFE 管 RFQ，并在 1 个工作日内收到回复。",
      },
    },
    "/company/about.html": {
      title: {
        en: "About Pure-Flon | Premium Fluoropolymer Tubing Manufacturer",
        ko: "회사 소개 | Pure-Flon",
        ja: "会社情報 | Pure-Flon",
        zh: "关于 Pure-Flon",
      },
      description: {
        en: "Learn how Pure-Flon builds premium PTFE and fluoropolymer tubing programs for medical, semiconductor, and chemical customers across Asia-Pacific.",
        ko: "의료, 반도체, 화학 고객을 위한 Pure-Flon의 프리미엄 PTFE 및 불소수지 튜브 역량을 소개합니다.",
        ja: "医療、半導体、化学分野向けに Pure-Flon が提供するプレミアム PTFE・フッ素樹脂チューブ体制を紹介します。",
        zh: "了解 Pure-Flon 如何为亚太地区医疗、半导体与化工客户提供高端 PTFE 与氟聚合物管路方案。",
      },
    },
    "/blog/korean-honorifics-guide/": {
      title: {
        en: "Korean Honorifics Explained Simply | pure-flon blog",
        ko: "한국어 존댓말 가이드 | pure-flon blog",
        ja: "韓国語敬語ガイド | pure-flon blog",
        zh: "韩语敬语指南 | pure-flon blog",
      },
      description: {
        en: "A practical guide to Korean honorifics, speech levels, oppa, unnie, nim, and yo with examples you can use right away.",
        ko: "오빠, 언니, 님, 요체와 한국어 화법 단계를 실전 예시로 정리한 가이드입니다.",
        ja: "oppa、unnie、nim、yo など韓国語敬語と話し方レベルを実例で学べるガイドです。",
        zh: "通过实用示例学习韩语敬语、说话层级、oppa、unnie、nim 与 yo 的完整指南。",
      },
    },
    "/games/k-meme-quiz/": {
      title: {
        en: "K-Meme Quiz | Test Your Korean Meme IQ",
        ko: "K-Meme Quiz | 한국 인터넷 밈 퀴즈",
        ja: "K-Meme Quiz | 韓国ネットミームクイズ",
        zh: "K-Meme Quiz | 韩国网络梗测试",
      },
      description: {
        en: "Play a fast Korean internet meme quiz with 10 random questions, streak scoring, and shareable results.",
        ko: "10문제 랜덤 출제와 스트릭 점수가 있는 한국 인터넷 밈 퀴즈입니다.",
        ja: "10問ランダム出題、連続正解ボーナス、共有機能付きの韓国ネットミームクイズです。",
        zh: "包含 10 道随机题、连对加分和分享结果功能的韩国网络梗测试。",
      },
    },
    "/quote/payment.html": {
      title: {
        en: "Payment Notice | Pure-Flon",
        ko: "입금 통지 | Pure-Flon",
        ja: "入金通知 | Pure-Flon",
        zh: "付款通知 | Pure-Flon",
      },
      description: {
        en: "Submit your payment notice with quote number and transfer reference so the Pure-Flon team can review and confirm settlement.",
        ko: "견적 번호와 송금 참조번호를 제출해 Pure-Flon 팀이 결제 검토를 진행할 수 있도록 합니다.",
        ja: "見積番号と送金参照番号を送信し、Pure-Flon チームが入金確認を進められるようにします。",
        zh: "提交报价编号和汇款参考号，方便 Pure-Flon 团队审核并确认收款。",
      },
    },
  };

  const ROUTE_OVERRIDES = {
    "/company/about.html": [
      {
        selector: ".hero__title",
        html: {
          en: 'Asia-Pacific premium tubing expertise built for the next manufacturing wave <span class="hero__highlight">Premium PTFE and fluoropolymer tubing specialist</span>',
          ja: '次世代製造を支えるアジア太平洋プレミアム配管チーム <span class="hero__highlight">プレミアム PTFE・フッ素樹脂チューブ専門メーカー</span>',
          zh: '面向下一代制造升级的亚太高端管路团队 <span class="hero__highlight">高端 PTFE 与氟聚合物管路专家</span>',
        },
      },
      {
        selector: ".hero__description",
        text: {
          en: "Pure-Flon combines 25 years of process know-how, disciplined manufacturing, and project-proven quality systems to support medical, semiconductor, and chemical tubing programs across Asia-Pacific.",
          ja: "Pure-Flon は 25 年の工程ノウハウ、厳格な製造運営、実証済みの品質体制を組み合わせ、医療・半導体・化学分野のチューブ案件を支えます。",
          zh: "Pure-Flon 结合 25 年工艺经验、严格制造体系和经过项目验证的质量流程，为亚太地区医疗、半导体与化工管路项目提供支持。",
        },
      },
      {
        selector: ".hero__metrics .metric:nth-child(1) .metric__label",
        text: { en: "Years of experience", ja: "経験年数", zh: "经验年数" },
      },
      {
        selector: ".hero__metrics .metric:nth-child(2) .metric__label",
        text: { en: "Export markets", ja: "輸出市場", zh: "出口市场" },
      },
      {
        selector: ".hero__metrics .metric:nth-child(3) .metric__label",
        text: { en: "Global projects", ja: "グローバル案件", zh: "全球项目" },
      },
      {
        selector: ".hero__metrics .metric:nth-child(4) .metric__label",
        text: { en: "Quality assurance", ja: "品質保証", zh: "质量保障" },
      },
      {
        selector: ".section-header .section-title",
        text: { en: "Meet Pure-Flon", ja: "Pure-Flon の紹介", zh: "认识 Pure-Flon" },
      },
      {
        selector: ".section-header .section-description",
        text: {
          en: "A manufacturing partner focused on premium fluoropolymer tubing programs, not generic commodity supply.",
          ja: "汎用品ではなく、プレミアムなフッ素樹脂チューブ案件に集中する製造パートナーです。",
          zh: "我们不是泛用型供货商，而是专注高端氟聚合物管路项目的制造伙伴。",
        },
      },
    ],
    "/games/k-meme-quiz/": [
      {
        selector: "#scr-start .sub",
        html: {
          en: "Korean internet meme quiz<br>10 random questions from a pool of 50+ memes",
          ja: "韓国ネットミームクイズ<br>50 種以上のミームから 10 問をランダム出題",
          zh: "韩国网络梗测试<br>从 50 多个梗中随机抽取 10 题",
        },
      },
      {
        selector: "#best-stats .stat-box:nth-child(1) .stat-l",
        text: { en: "Best score", ja: "最高点", zh: "最高分" },
      },
      {
        selector: "#best-stats .stat-box:nth-child(2) .stat-l",
        text: { en: "Plays", ja: "游玩次数", zh: "游玩次数" },
      },
      {
        selector: "#best-stats .stat-box:nth-child(3) .stat-l",
        text: { en: "Best streak", ja: "最長連続", zh: "最长连对" },
      },
      {
        selector: ".btn-start",
        text: { en: "Start quiz →", ja: "クイズを始める →", zh: "开始测试 →" },
      },
      {
        selector: ".score-bar > div:first-child .score-label",
        text: { en: "Score", ja: "スコア", zh: "分数" },
      },
      {
        selector: ".score-bar > div:last-child .score-label",
        text: { en: "Questions left", ja: "残り問題", zh: "剩余题数" },
      },
      {
        selector: "#q-num",
        text: { en: "Question 1", ja: "問題 1", zh: "第 1 题" },
      },
    ],
    "/products/medical.html": [
      {
        selector: ".product-hero__title",
        html: {
          en: 'Medical PTFE Tubing <span class="badge badge--fda">Documentation review</span>',
          ja: '医療用 PTFE チューブ <span class="badge badge--fda">文書確認</span>',
          zh: '医用 PTFE 管 <span class="badge badge--fda">文档审核</span>',
        },
      },
      {
        selector: ".product-hero__description",
        text: {
          en: "Medical PTFE tubing for catheter, surgical, and diagnostic device programs, with material, process, and documentation review aligned per application.",
          ja: "カテーテル、手術器具、診断装置向けに、材料・工程・文書確認を用途ごとに進める医療用 PTFE チューブです。",
          zh: "面向导管、手术器械和诊断设备项目，按应用场景协调材料、工艺与文档审核的医用 PTFE 管。",
        },
      },
    ],
    "/products/semiconductor.html": [
      {
        selector: ".product-hero__title",
        html: {
          en: 'Semiconductor PTFE Tubing <span class="badge badge--purity">Fab review</span>',
          ja: '半導体用 PTFE チューブ <span class="badge badge--purity">Fab 確認</span>',
          zh: '半导体用 PTFE 管 <span class="badge badge--purity">Fab 审核</span>',
        },
      },
      {
        selector: ".product-hero__description",
        text: {
          en: "PTFE tubing for wet benches, etch lines, and process equipment where particle-control goals, cleaning, and packaging must be reviewed per fab.",
          ja: "ウェットベンチ、エッチング配管、各種プロセス装置向けに、粒子管理目標や洗浄・包装条件を fab ごとに確認する PTFE チューブです。",
          zh: "适用于湿法台、刻蚀管路和工艺设备的 PTFE 管，需按 fab 分别审核颗粒控制目标、清洗与包装条件。",
        },
      },
    ],
    "/products/chemical.html": [
      {
        selector: ".product-hero__title",
        html: {
          en: 'Chemical PTFE Tubing <span class="badge badge--chemical">Media review</span>',
          ja: '化学用 PTFE チューブ <span class="badge badge--chemical">媒体確認</span>',
          zh: '化工用 PTFE 管 <span class="badge badge--chemical">介质审核</span>',
        },
      },
      {
        selector: ".product-hero__description",
        text: {
          en: "Chemical-duty PTFE tubing for corrosive acids, bases, solvents, and transfer systems, with compatibility reviewed per media, temperature, and pressure.",
          ja: "腐食性の高い酸、アルカリ、溶剤、移送ライン向けに、媒体・温度・圧力ごとに適合性を確認する化学用 PTFE チューブです。",
          zh: "面向强腐蚀酸碱、溶剂与输送系统的化工级 PTFE 管，需按介质、温度与压力逐项审核兼容性。",
        },
      },
    ],
    "/quote/request.html": [
      {
        selector: ".quote-hero__title",
        html: {
          en: 'PTFE tubing RFQ <span class="badge badge--primary">Reply within 1 business day</span>',
          ja: 'PTFE チューブ RFQ <span class="badge badge--primary">1 営業日以内に返信</span>',
          zh: 'PTFE 管 RFQ <span class="badge badge--primary">1 个工作日内回复</span>',
        },
      },
      {
        selector: ".quote-hero__description",
        text: {
          en: "Send the key dimensions, media, and application context. A Pure-Flon engineer will route your request and return a practical tubing recommendation with quote guidance.",
          ja: "主要寸法、媒体、用途条件を送信してください。Pure-Flon のエンジニアが内容を確認し、適切なチューブ提案と見積方針を返します。",
          zh: "请提交关键尺寸、介质与应用条件。Pure-Flon 工程师会评估需求，并返回合适的管路建议与报价方向。",
        },
      },
    ],
  };

  const PHRASES = [
    { en: "Skip to main content", ko: "메인 콘텐츠로 건너뛰기", ja: "メインコンテンツへスキップ", zh: "跳转到主要内容" },
    { en: "Home", ko: "홈", ja: "ホーム", zh: "首页" },
    { en: "Products", ko: "제품", ja: "製品", zh: "产品" },
    { en: "Products ▼", ko: "제품 ▼", ja: "製品 ▼", zh: "产品 ▼" },
    { en: "Product Catalog", ko: "제품 카탈로그", ja: "製品カタログ", zh: "产品目录" },
    { en: "Quote", ko: "견적", ja: "見積", zh: "报价" },
    { en: "Quote Request", ko: "견적요청", ja: "見積依頼", zh: "报价申请" },
    { en: "Quote Hub", ko: "견적 허브", ja: "見積ハブ", zh: "报价中心" },
    { en: "Request Quote", ko: "견적 요청", ja: "見積依頼", zh: "申请报价" },
    { en: "Get Quote", ko: "견적 요청", ja: "見積依頼", zh: "申请报价" },
    { en: "Request Quote Now", ko: "지금 견적 요청하기", ja: "今すぐ見積を依頼", zh: "立即申请报价" },
    { en: "Contact", ko: "문의", ja: "お問い合わせ", zh: "联系" },
    { en: "About", ko: "회사소개", ja: "会社情報", zh: "关于我们" },
    { en: "Blog", ko: "블로그", ja: "ブログ", zh: "博客" },
    { en: "Tools", ko: "도구", ja: "ツール", zh: "工具" },
    { en: "Games", ko: "게임", ja: "ゲーム", zh: "游戏" },
    { en: "SaaS", ko: "SaaS", ja: "SaaS", zh: "SaaS" },
    { en: "Ask for a sample", ko: "샘플 요청", ja: "サンプル依頼", zh: "申请样品" },
    { en: "Compatibility test", ko: "호환성 테스트", ja: "適合性テスト", zh: "兼容性测试" },
    { en: "Technical consultation", ko: "기술 상담 받기", ja: "技術相談を受ける", zh: "获取技术咨询" },
    { en: "Current page", ko: "현재 위치", ja: "現在の位置", zh: "当前位置" },
    { en: "Main menu", ko: "주 메뉴", ja: "メインメニュー", zh: "主菜单" },
    { en: "Open menu", ko: "메뉴 열기", ja: "メニューを開く", zh: "打开菜单" },
    { en: "Choose language", ko: "언어 선택", ja: "言語を選択", zh: "选择语言" },
    { en: "Request a B2B Quote", ko: "Request a B2B Quote", ja: "B2B 見積を依頼する", zh: "申请 B2B 报价" },
    { en: "Medical PTFE Tubing", ko: "의료용 PTFE 튜브", ja: "医療用 PTFE チューブ", zh: "医用 PTFE 管" },
    { en: "Semiconductor PTFE Tubing", ko: "반도체용 PTFE 튜브", ja: "半導体用 PTFE チューブ", zh: "半导体用 PTFE 管" },
    { en: "Chemical PTFE Tubing", ko: "화학용 PTFE 튜브", ja: "化学用 PTFE チューブ", zh: "化工用 PTFE 管" },
    { en: "Documentation review", ko: "문서 검토", ja: "文書確認", zh: "文档审核" },
    { en: "Fab review", ko: "Fab 검토", ja: "Fab 確認", zh: "Fab 审核" },
    { en: "Media review", ko: "매질 검토", ja: "媒体確認", zh: "介质审核" },
    { en: "Technical Specifications", ko: "기술 사양", ja: "技術仕様", zh: "技术规格" },
    { en: "Key Applications", ko: "주요 응용 분야", ja: "主要用途", zh: "主要应用" },
    { en: "Size Range", ko: "크기 범위", ja: "寸法範囲", zh: "尺寸范围" },
    { en: "Properties", ko: "물성", ja: "材料特性", zh: "材料特性" },
    { en: "Documentation & review path", ko: "문서 및 검토 경로", ja: "文書と確認経路", zh: "文档与审核路径" },
    { en: "Semiconductor Process Compatibility", ko: "반도체 공정 호환성", ja: "半導体プロセス適合性", zh: "半导体工艺兼容性" },
    { en: "Chemical Compatibility", ko: "화학물질 호환성", ja: "化学適合性", zh: "化学兼容性" },
    { en: "Safety Features", ko: "안전성 특징", ja: "安全特長", zh: "安全特性" },
    { en: "Detailed Technical Data", ko: "상세 기술 데이터", ja: "詳細技術データ", zh: "详细技术数据" },
    { en: "Strengths of Pure-Flon Medical PTFE", ko: "Pure-Flon 의료용 PTFE의 특장점", ja: "Pure-Flon 医療用 PTFE の特長", zh: "Pure-Flon 医用 PTFE 的优势" },
    { en: "Strengths of Pure-Flon Semiconductor PTFE", ko: "Pure-Flon 반도체용 PTFE의 특장점", ja: "Pure-Flon 半導体用 PTFE の特長", zh: "Pure-Flon 半导体用 PTFE 的优势" },
    { en: "Medical PTFE Tubing RFQ", ko: "의료용 PTFE 튜브 견적 요청", ja: "医療用 PTFE チューブ見積依頼", zh: "医用 PTFE 管报价申请" },
    { en: "Semiconductor PTFE Tubing RFQ", ko: "반도체용 PTFE 튜브 견적 요청", ja: "半導体用 PTFE チューブ見積依頼", zh: "半导体用 PTFE 管报价申请" },
    { en: "Chemical PTFE Tubing RFQ", ko: "화학용 PTFE 튜브 견적 요청", ja: "化学用 PTFE チューブ見積依頼", zh: "化工用 PTFE 管报价申请" },
    { en: "Responds within 24 hours", ko: "24시간 내 응답", ja: "24時間以内に回答", zh: "24 小时内回复" },
    { en: "Free sample available", ko: "무료 샘플 제공", ja: "無料サンプル提供", zh: "提供免费样品" },
    { en: "Custom solution", ko: "맞춤형 솔루션", ja: "カスタムソリューション", zh: "定制方案" },
    { en: "Product Information", ko: "제품 정보", ja: "製品情報", zh: "产品信息" },
    { en: "Product Type *", ko: "제품 종류 *", ja: "製品タイプ *", zh: "产品类型 *" },
    { en: "Please select a product", ko: "제품을 선택해주세요", ja: "製品を選択してください", zh: "请选择产品" },
    { en: "Inner Diameter (mm) *", ko: "내경 (mm) *", ja: "内径 (mm) *", zh: "内径 (mm) *" },
    { en: "Outer Diameter (mm) *", ko: "외경 (mm) *", ja: "外径 (mm) *", zh: "外径 (mm) *" },
    { en: "Length (m) *", ko: "길이 (m) *", ja: "長さ (m) *", zh: "长度 (m) *" },
    { en: "Quantity *", ko: "수량 *", ja: "数量 *", zh: "数量 *" },
    { en: "Intended use and environment", ko: "사용 용도 및 환경", ja: "使用用途と環境", zh: "用途与使用环境" },
    { en: "Describe the application, temperature, pressure, or media in detail", ko: "사용 목적, 온도, 압력, 화학물질 등을 자세히 입력해주세요", ja: "用途、温度、圧力、媒体を詳しく入力してください", zh: "请详细说明用途、温度、压力和介质" },
    { en: "Contact Information", ko: "연락처 정보", ja: "連絡先情報", zh: "联系信息" },
    { en: "Company / Organization *", ko: "회사명/기관명 *", ja: "会社名 / 組織名 *", zh: "公司 / 机构名称 *" },
    { en: "Contact Name *", ko: "담당자명 *", ja: "担当者名 *", zh: "联系人姓名 *" },
    { en: "Department / Title", ko: "부서/직책", ja: "部署 / 役職", zh: "部门 / 职位" },
    { en: "Email *", ko: "이메일 *", ja: "メール *", zh: "邮箱 *" },
    { en: "Phone", ko: "연락처", ja: "電話番号", zh: "电话" },
    { en: "Additional Requirements", ko: "추가 요청사항", ja: "追加要件", zh: "附加需求" },
    { en: "Required documents or reviews", ko: "필요한 문서 또는 검토", ja: "必要な文書または確認", zh: "所需文件或审核" },
    { en: "Food-contact or regulatory review", ko: "식품 접촉 또는 규제 검토", ja: "食品接触または規制確認", zh: "食品接触或法规审核" },
    { en: "Quality or manufacturing document review", ko: "품질 또는 제조 문서 검토", ja: "品質または製造文書確認", zh: "质量或制造文件审核" },
    { en: "Biocompatibility or test-report review", ko: "생체적합성 또는 시험성적 검토", ja: "生体適合性または試験報告確認", zh: "生物相容性或测试报告审核" },
    { en: "Additional notes", ko: "기타 요청사항", ja: "追加メモ", zh: "其他备注" },
    { en: "Share any special requirements or questions", ko: "특별한 요구사항이나 질문이 있으시면 자세히 입력해주세요", ja: "特別な要件や質問があれば詳しく入力してください", zh: "如有特殊要求或问题，请详细填写" },
    { en: "Send Quote Request", ko: "견적 요청 보내기", ja: "見積依頼を送信", zh: "发送报价申请" },
    { en: "Reset", ko: "초기화", ja: "リセット", zh: "重置" },
    { en: "Fast response", ko: "빠른 응답", ja: "迅速対応", zh: "快速回复" },
    { en: "A specialist will reply within 1 business day", ko: "24시간 내 전문가가 직접 연락드립니다", ja: "1営業日以内に担当者が返信します", zh: "专家将在 1 个工作日内回复" },
    { en: "Accurate quote", ko: "정확한 견적", ja: "正確な見積", zh: "准确报价" },
    { en: "Engineers with 25 years of experience propose the right fit", ko: "25년 경험의 엔지니어가 최적화된 솔루션을 제안합니다", ja: "25年の経験を持つエンジニアが最適案を提案します", zh: "拥有 25 年经验的工程师将提供合适方案" },
    { en: "Free consultation", ko: "무료 상담", ja: "無料相談", zh: "免费咨询" },
    { en: "Quote and technical consultation are provided at no charge", ko: "견적 및 기술 상담은 모두 무료로 제공됩니다", ja: "見積と技術相談は無料です", zh: "报价和技术咨询均免费提供" },
    { en: "Payment Notice", ko: "입금 통지", ja: "入金通知", zh: "付款通知" },
    { en: "If you already transferred funds, submit the payment reference on the payment notice page.", ko: "견적서를 받은 뒤 송금을 마쳤다면 입금 통지 페이지에서 결제 참조번호를 제출해 주세요.", ja: "送金済みの場合は、入金通知ページで決済参照番号を送信してください。", zh: "如果已完成汇款，请在付款通知页面提交付款参考号。" },
    { en: "Payment Information", ko: "입금 정보", ja: "入金情報", zh: "付款信息" },
    { en: "Quote Number *", ko: "견적 번호 *", ja: "見積番号 *", zh: "报价编号 *" },
    { en: "Example: Q-20260329-1430", ko: "예: Q-20260329-1430", ja: "例: Q-20260329-1430", zh: "例如：Q-20260329-1430" },
    { en: "Quote request email *", ko: "견적 요청 이메일 *", ja: "見積依頼メール *", zh: "报价申请邮箱 *" },
    { en: "Payment reference *", ko: "결제 참조번호 *", ja: "決済参照番号 *", zh: "付款参考号 *" },
    { en: "Receipt or transfer reference", ko: "입금 영수증 또는 송금 참조번호", ja: "入金控えまたは送金参照番号", zh: "汇款凭证或转账参考号" },
    { en: "Payment method *", ko: "결제 방식 *", ja: "支払方法 *", zh: "付款方式 *" },
    { en: "Bank transfer", ko: "무통장입금", ja: "銀行振込", zh: "银行转账" },
    { en: "International wire", ko: "국제 송금", ja: "海外送金", zh: "国际汇款" },
    { en: "Corporate transfer", ko: "법인 계좌이체", ja: "法人振込", zh: "公司转账" },
    { en: "Transferred amount", ko: "송금 금액", ja: "送金金額", zh: "汇款金额" },
    { en: "Optional", ko: "선택 입력", ja: "任意入力", zh: "选填" },
    { en: "Currency", ko: "통화", ja: "通貨", zh: "币种" },
    { en: "Additional memo", ko: "추가 메모", ja: "追加メモ", zh: "附加备注" },
    { en: "Leave the transfer time, sender name, or accounting note", ko: "입금 시각, 송금자명, 회계팀에 전달할 메모를 남겨 주세요", ja: "送金時刻、送金者名、経理メモを入力してください", zh: "请填写汇款时间、汇款人姓名或财务备注" },
    { en: "Submit Payment Notice", ko: "입금 통지 제출", ja: "入金通知を送信", zh: "提交付款通知" },
    { en: "Card payment (coming soon)", ko: "카드 결제 (준비 중)", ja: "カード決済（準備中）", zh: "银行卡支付（即将推出）" },
    { en: "Back to Quote Request", ko: "견적 요청으로 돌아가기", ja: "見積依頼に戻る", zh: "返回报价申请" },
    { en: "Not instant confirmation", ko: "결제 즉시 확정 아님", ja: "即時確定ではありません", zh: "并非即时确认" },
    { en: "This page only captures the settlement notice. Final paid confirmation happens after team review.", ko: "이 페이지는 검토용 결제 통지만 접수합니다. 최종 `paid` 확정은 운영팀이 확인 후 진행합니다.", ja: "このページは入金通知のみを受け付けます。最終的な paid 確定は運営確認後に行われます。", zh: "本页仅接收入账通知，最终 paid 确认需经团队审核。" },
    { en: "Quote email must match", ko: "견적 이메일 일치 필요", ja: "見積メール一致が必要", zh: "报价邮箱需一致" },
    { en: "The email must match the one used in the original RFQ.", ko: "견적 요청 시 사용한 이메일과 일치해야 정상 접수됩니다.", ja: "元の RFQ で使ったメールアドレスと一致する必要があります。", zh: "邮箱必须与原 RFQ 使用的邮箱一致。" },
    { en: "Contact us directly for urgent cases", ko: "급한 건 직접 문의", ja: "急ぎは直接連絡", zh: "紧急情况请直接联系" },
    { en: "If shipment timing is urgent, also tell us at contact@pure-flon.com.", ko: "긴급한 출하 일정이 있으면 contact@pure-flon.com 으로 함께 알려 주세요.", ja: "出荷を急ぐ場合は contact@pure-flon.com にもお知らせください。", zh: "如出货时间紧急，请同时发送邮件至 contact@pure-flon.com。" },
    { en: "Card checkout is under review", ko: "카드 결제 자동화 점검 중", ja: "カード決済自動化を点検中", zh: "银行卡支付自动化检查中" },
    { en: "The live domain currently routes payment by email review instead of automatic checkout.", ko: "현재는 자동 Checkout 연결 대신 운영팀이 이메일로 결제 링크 또는 수기 결제 절차를 안내합니다.", ja: "現在は自動 Checkout の代わりに、運営チームがメールで決済リンクまたは手動手順を案内します。", zh: "当前线上域名通过邮件审核处理付款，暂不提供自动结账。" },
    { en: "A premium fluoropolymer tubing manufacturer serving East Asia.", ko: "동아시아 시장을 선도하는 프리미엄 PTFE 튜브 제조업체", ja: "東アジア市場に対応するプレミアム PTFE チューブメーカー", zh: "服务东亚市场的高端 PTFE 管制造商" },
    { en: "Need guidance before the quote round?", ko: "Need purity-first guidance before the quote round?", ja: "見積前にまず適合性を確認したいですか？", zh: "报价前想先确认材料适配吗？" },
    { en: "Products, SaaS, quote, free tools, games, and blog discovery in one place.", ko: "제품, SaaS, 견적, 무료 도구, 게임, 블로그를 한 곳에서 연결합니다.", ja: "製品、SaaS、見積、無料ツール、ゲーム、ブログ導線を1か所でつなぎます。", zh: "将产品、SaaS、报价、免费工具、游戏与博客流量汇聚在一个页面。" },
    { en: "Quote request submitted. We will reply within 1 business day via contact@pure-flon.com.", ko: "견적 요청이 접수되었습니다. 1영업일 내에 contact@pure-flon.com 기준으로 답변드리겠습니다.", ja: "見積依頼を受け付けました。1営業日以内に contact@pure-flon.com から返信します。", zh: "报价申请已提交。我们将在 1 个工作日内通过 contact@pure-flon.com 回复。" },
    { en: "We could not submit your RFQ. Please try again or email contact@pure-flon.com.", ko: "견적 요청을 접수하지 못했습니다. 잠시 후 다시 시도해 주세요. 문제가 계속되면 contact@pure-flon.com 으로 문의해 주세요.", ja: "見積依頼を送信できませんでした。再試行するか contact@pure-flon.com へご連絡ください。", zh: "无法提交报价申请。请稍后重试，或发送邮件至 contact@pure-flon.com。" },
    { en: "Payment notice received. We will review your quote number and confirm settlement.", ko: "입금 통지가 접수되었습니다. 견적 번호 ${payload.quoteNumber} 기준으로 검토 후 결제 확정이 진행됩니다.", ja: "入金通知を受け付けました。見積番号 ${payload.quoteNumber} を基準に確認後、決済確定を進めます。", zh: "已收到付款通知。我们将根据报价编号 ${payload.quoteNumber} 审核并确认收款。" },
    { en: "We could not capture your payment notice. Please verify the quote number and email.", ko: "입금 통지를 접수하지 못했습니다. 견적 번호와 이메일을 다시 확인해 주세요. 문제가 계속되면 contact@pure-flon.com 으로 문의해 주세요.", ja: "入金通知を送信できませんでした。見積番号とメールを確認してください。", zh: "无法提交付款通知。请检查报价编号和邮箱信息。" },
    { en: "Card checkout is disabled on the live domain. Email the quote number to contact@pure-flon.com.", ko: "라이브 도메인에서는 카드 결제가 비활성화되어 있습니다. contact@pure-flon.com 으로 견적 번호를 보내 주시면 운영팀이 결제 절차를 안내합니다.", ja: "ライブドメインではカード決済が無効です。見積番号を contact@pure-flon.com に送ってください。", zh: "线上域名暂未启用银行卡支付，请将报价编号发送至 contact@pure-flon.com。" },
  ];

  const path = window.location.pathname;

  function buildPhraseIndex() {
    const index = new Map();
    for (const phrase of PHRASES) {
      for (const locale of SUPPORTED_LOCALES) {
        const value = phrase[locale.code];
        if (!value) continue;
        index.set(value, phrase);
      }
    }
    return index;
  }

  const PHRASE_INDEX = buildPhraseIndex();

  function getStoredLocale() {
    const params = new URLSearchParams(window.location.search);
    const requested = params.get("lang");
    if (SUPPORTED_LOCALES.some((locale) => locale.code === requested)) {
      return requested;
    }
    const saved = window.localStorage.getItem("pure-flon-locale");
    if (SUPPORTED_LOCALES.some((locale) => locale.code === saved)) {
      return saved;
    }
    if (CURATED_EN_DEFAULT_ROUTES.has(path)) {
      return "en";
    }
    return document.documentElement.lang || "en";
  }

  function normalizeText(value) {
    return value.replace(/\s+/g, " ").trim();
  }

  function translateExact(value, locale) {
    const normalized = normalizeText(value);
    const phrase = PHRASE_INDEX.get(normalized);
    if (!phrase || !phrase[locale]) {
      return null;
    }
    return phrase[locale];
  }

  function replaceNodeText(node, locale) {
    const raw = node.textContent;
    if (!raw || !normalizeText(raw)) return false;
    const translated = translateExact(raw, locale);
    if (!translated) return false;
    const leading = raw.match(/^\s*/)?.[0] || "";
    const trailing = raw.match(/\s*$/)?.[0] || "";
    const nextValue = `${leading}${translated}${trailing}`;
    if (nextValue !== raw) {
      node.textContent = nextValue;
      return true;
    }
    return false;
  }

  function replaceAttributes(root, locale) {
    const attrs = ["placeholder", "aria-label", "title", "alt", "content", "value"];
    for (const element of root.querySelectorAll("*")) {
      for (const attr of attrs) {
        const current = element.getAttribute(attr);
        if (!current) continue;
        const translated = translateExact(current, locale);
        if (translated && translated !== current) {
          element.setAttribute(attr, translated);
        }
      }
    }
  }

  function translateTextNodes(root, locale) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.parentElement) return NodeFilter.FILTER_REJECT;
        const tag = node.parentElement.tagName;
        if (["SCRIPT", "STYLE", "NOSCRIPT"].includes(tag)) {
          return NodeFilter.FILTER_REJECT;
        }
        return normalizeText(node.textContent || "") ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      },
    });
    const nodes = [];
    let current;
    while ((current = walker.nextNode())) {
      nodes.push(current);
    }
    for (const node of nodes) {
      replaceNodeText(node, locale);
    }
  }

  function applyRouteMeta(locale) {
    const meta = ROUTE_META[path];
    if (!meta) return;
    if (meta.title?.[locale]) {
      document.title = meta.title[locale];
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) ogTitle.setAttribute("content", meta.title[locale]);
      const twitterTitle = document.querySelector('meta[name="twitter:title"]');
      if (twitterTitle) twitterTitle.setAttribute("content", meta.title[locale]);
    }
    if (meta.description?.[locale]) {
      const description = document.querySelector('meta[name="description"]');
      if (description) description.setAttribute("content", meta.description[locale]);
      const ogDescription = document.querySelector('meta[property="og:description"]');
      if (ogDescription) ogDescription.setAttribute("content", meta.description[locale]);
      const twitterDescription = document.querySelector('meta[name="twitter:description"]');
      if (twitterDescription) twitterDescription.setAttribute("content", meta.description[locale]);
    }
  }

  function applyRouteOverrides(locale) {
    const overrides = ROUTE_OVERRIDES[path];
    if (!overrides) return;
    for (const override of overrides) {
      const target = document.querySelector(override.selector);
      if (!target) continue;
      if (override.html?.[locale] && target.innerHTML !== override.html[locale]) {
        target.innerHTML = override.html[locale];
      } else if (override.text?.[locale] && target.textContent !== override.text[locale]) {
        target.textContent = override.text[locale];
      }
    }
  }

  function setDocumentLanguage(locale) {
    document.documentElement.lang = locale;
  }

  function buildLocaleUrl(locale) {
    const url = new URL(window.location.href);
    if (locale === "en") {
      url.searchParams.delete("lang");
    } else {
      url.searchParams.set("lang", locale);
    }
    return url.toString();
  }

  function rewriteInternalLinks(locale) {
    const anchors = document.querySelectorAll('a[href]');
    for (const anchor of anchors) {
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) {
        continue;
      }
      let target;
      try {
        target = new URL(href, window.location.origin);
      } catch (_error) {
        continue;
      }
      if (target.origin !== window.location.origin) continue;
      if (locale === "en") {
        target.searchParams.delete("lang");
      } else {
        target.searchParams.set("lang", locale);
      }
      const nextHref = target.pathname + target.search + target.hash;
      anchor.setAttribute("href", nextHref);
    }
  }

  function syncAlternateLinks() {
    document.querySelectorAll('link[data-pf-i18n="alternate"]').forEach((node) => node.remove());
    for (const locale of SUPPORTED_LOCALES) {
      const link = document.createElement("link");
      link.rel = "alternate";
      link.hreflang = locale.code;
      link.href = buildLocaleUrl(locale.code);
      link.dataset.pfI18n = "alternate";
      document.head.appendChild(link);
    }
    const defaultLink = document.createElement("link");
    defaultLink.rel = "alternate";
    defaultLink.hreflang = "x-default";
    defaultLink.href = buildLocaleUrl("en");
    defaultLink.dataset.pfI18n = "alternate";
    document.head.appendChild(defaultLink);
  }

  function renderSwitcher(locale, onSelect) {
    const existing = document.getElementById("pf-language-switcher");
    if (existing) existing.remove();

    const styleId = "pf-language-switcher-style";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        .pf-language-switcher {
          position: fixed;
          right: 18px;
          bottom: 18px;
          z-index: 2147483647;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px;
          border-radius: 999px;
          background: rgba(3, 7, 18, 0.84);
          border: 1px solid rgba(148, 163, 184, 0.22);
          box-shadow: 0 18px 42px -24px rgba(2, 6, 23, 0.78);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
        }
        .pf-language-switcher--inline {
          position: static;
          right: auto;
          bottom: auto;
          box-shadow: none;
        }
        .pf-language-switcher button {
          border: 0;
          border-radius: 999px;
          min-width: 46px;
          padding: 8px 10px;
          font: 600 12px/1 system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
          color: rgba(226, 232, 240, 0.76);
          background: transparent;
          cursor: pointer;
          transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
        }
        .pf-language-switcher button:hover {
          background: rgba(255, 255, 255, 0.08);
          color: #fff;
          transform: translateY(-1px);
        }
        .pf-language-switcher button.is-active {
          background: rgba(37, 99, 235, 0.92);
          color: #fff;
          box-shadow: 0 10px 24px -16px rgba(37, 99, 235, 0.84);
        }
        @media (max-width: 720px) {
          .pf-language-switcher {
            left: 12px;
            right: 12px;
            bottom: 12px;
            justify-content: space-between;
          }
          .pf-language-switcher button {
            flex: 1 1 auto;
            min-width: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }

    const mount = document.querySelector(".language-selector");
    const container = document.createElement("div");
    container.id = "pf-language-switcher";
    container.className = "pf-language-switcher";

    if (mount) {
      container.classList.add("pf-language-switcher--inline");
      mount.replaceChildren(container);
    } else {
      document.body.appendChild(container);
    }

    for (const item of SUPPORTED_LOCALES) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = item.label;
      button.title = item.native;
      button.className = item.code === locale ? "is-active" : "";
      button.addEventListener("click", () => onSelect(item.code));
      container.appendChild(button);
    }
  }

  function applyLocale(locale) {
    setDocumentLanguage(locale);
    applyRouteMeta(locale);
    translateTextNodes(document.body, locale);
    replaceAttributes(document.body, locale);
    applyRouteOverrides(locale);
    rewriteInternalLinks(locale);
    syncAlternateLinks();
    window.localStorage.setItem("pure-flon-locale", locale);
    renderSwitcher(locale, (nextLocale) => {
      if (nextLocale === locale) return;
      const url = new URL(window.location.href);
      if (nextLocale === "en") {
        url.searchParams.delete("lang");
      } else {
        url.searchParams.set("lang", nextLocale);
      }
      history.replaceState({}, "", url.pathname + url.search + url.hash);
      applyLocale(nextLocale);
    });
  }

  function observeDynamicChanges(locale) {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "childList") {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.TEXT_NODE && node.parentElement) {
              replaceNodeText(node, locale);
            } else if (node.nodeType === Node.ELEMENT_NODE) {
              translateTextNodes(node, locale);
              replaceAttributes(node, locale);
            }
          });
        } else if (mutation.type === "attributes" && mutation.target instanceof Element) {
          replaceAttributes(mutation.target, locale);
        }
      }
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["placeholder", "aria-label", "title", "alt", "content", "value"],
    });
  }

  function init() {
    const locale = getStoredLocale();
    applyLocale(locale);
    observeDynamicChanges(locale);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
