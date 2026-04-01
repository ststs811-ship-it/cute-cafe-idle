const STORAGE_KEY = 'cuteCafeIdleSaveV1';
const APP_VERSION = '1.1.0';

const DAILY_MODIFIERS = [
  {
    id: 'sunny',
    name: '晴れ',
    description: 'お散歩ついでのお客さんが増えます。来客 +20%',
    visitorMultiplier: 1.2,
    priceMultiplier: 1,
    reputationMultiplier: 1,
    effectMultiplier: 1,
  },
  {
    id: 'rainy',
    name: '雨',
    description: '客足は少し鈍るけれど、温かいドリンクがよく売れます。来客 -20%、単価 +15%',
    visitorMultiplier: 0.8,
    priceMultiplier: 1.15,
    reputationMultiplier: 1,
    effectMultiplier: 1,
  },
  {
    id: 'sns',
    name: 'SNSで話題',
    description: '評判がそのまま集客力に繋がります。評判効果 2倍',
    visitorMultiplier: 1,
    priceMultiplier: 1,
    reputationMultiplier: 2,
    effectMultiplier: 1,
  },
  {
    id: 'market',
    name: '小さな市',
    description: '店前の通りがにぎやかです。来客 +10%、売上補正 +10%',
    visitorMultiplier: 1.1,
    priceMultiplier: 1,
    reputationMultiplier: 1,
    effectMultiplier: 1.1,
  },
  {
    id: 'quiet',
    name: 'しずかな午後',
    description: '客数は控えめですが、ゆったり滞在で注文が丁寧になります。来客 -10%、単価 +8%',
    visitorMultiplier: 0.9,
    priceMultiplier: 1.08,
    reputationMultiplier: 1,
    effectMultiplier: 1,
  },
];

const PERK_POOL = [
  {
    id: 'priceBurst',
    name: '本日の特製セット',
    description: '今日だけ単価 +25%',
    apply(run) {
      run.priceMultiplier *= 1.25;
      run.notes.push('本日の特製セット: 単価 +25%');
    },
  },
  {
    id: 'visitorFlow',
    name: '看板を磨く',
    description: '今日だけ来客速度 +30%',
    apply(run) {
      run.visitorMultiplier *= 1.3;
      run.notes.push('看板を磨く: 来客速度 +30%');
    },
  },
  {
    id: 'boostLong',
    name: '元気な接客',
    description: '今日だけ全ブースト時間 +5秒',
    apply(run) {
      run.extraBoostDuration += 5;
      run.notes.push('元気な接客: ブースト時間 +5秒');
    },
  },
  {
    id: 'sweetBonus',
    name: '焼き菓子つき',
    description: '今日だけ売上補正 +15%',
    apply(run) {
      run.salesMultiplier *= 1.15;
      run.notes.push('焼き菓子つき: 売上補正 +15%');
    },
  },
  {
    id: 'popularPost',
    name: '写真映えPOP',
    description: '今日だけ評判獲得 +40%',
    apply(run) {
      run.reputationGainMultiplier *= 1.4;
      run.notes.push('写真映えPOP: 評判獲得 +40%');
    },
  },
  {
    id: 'regulars',
    name: '常連さんの応援',
    description: '今日だけ営業目標を達成しやすくします。目標 -15%',
    apply(run) {
      run.targetMultiplier *= 0.85;
      run.notes.push('常連さんの応援: 今日の目標 -15%');
    },
  },
];

const TREE_NODES = [
  {
    id: 'achievementsTab',
    name: '実績ノート',
    description: '実績タブを開放します。',
    cost: 1,
    branch: '左ルート',
    requires: [],
    effectText: '実績一覧が見えるようになる',
    apply(state) {
      state.systems.achievementsTabUnlocked = true;
    },
  },
  {
    id: 'menuUpgrade',
    name: 'おすすめメニュー',
    description: '看板メニューが増えて単価が上がります。',
    cost: 1,
    branch: '中央ルート',
    requires: [],
    effectText: '基本単価 +10%',
    apply(state) {
      state.permanent.priceMultiplier *= 1.1;
    },
  },
  {
    id: 'cozySeats',
    name: 'ふかふか席',
    description: '席の満足度が上がり、来客速度が伸びます。',
    cost: 1,
    branch: '右ルート',
    requires: [],
    effectText: '来客速度 +12%',
    apply(state) {
      state.permanent.visitorMultiplier *= 1.12;
    },
  },
  {
    id: 'reputationBook',
    name: '口コミノート',
    description: '評判の伸びが安定します。',
    cost: 2,
    branch: '左ルート',
    requires: ['achievementsTab'],
    effectText: '評判獲得 +25%',
    apply(state) {
      state.permanent.reputationGainMultiplier *= 1.25;
    },
  },
  {
    id: 'secondBoost',
    name: 'おすすめセット告知',
    description: '2つ目のブーストを開放します。',
    cost: 2,
    branch: '中央ルート',
    requires: ['menuUpgrade'],
    effectText: '単価系ブースト追加',
    apply(state) {
      state.systems.secondBoostUnlocked = true;
    },
  },
  {
    id: 'choicePlus',
    name: '臨機応変メモ',
    description: 'ランダム強化の候補を1つ追加します。',
    cost: 3,
    branch: '右ルート',
    requires: ['cozySeats'],
    effectText: '強化候補 +1',
    apply(state) {
      state.systems.extraPerkChoice = true;
    },
  },
  {
    id: 'happyPlaylist',
    name: 'ごきげんプレイリスト',
    description: '店内BGMで動きが良くなり、ブースト再使用が早まります。',
    cost: 3,
    branch: '左ルート',
    requires: ['reputationBook'],
    effectText: 'ブーストのクールダウン -20%',
    apply(state) {
      state.permanent.cooldownMultiplier *= 0.8;
    },
  },
  {
    id: 'signatureBeans',
    name: '看板ブレンド',
    description: '看板豆で客単価をしっかり上げます。',
    cost: 3,
    branch: '中央ルート',
    requires: ['secondBoost'],
    effectText: '基本単価 +18%',
    apply(state) {
      state.permanent.priceMultiplier *= 1.18;
    },
  },
  {
    id: 'festivalBoard',
    name: 'イベント黒板',
    description: '日替わりの街のようすの良い面をさらに活かします。',
    cost: 3,
    branch: '右ルート',
    requires: ['choicePlus'],
    effectText: '本日の補正 +10%',
    apply(state) {
      state.permanent.dailyModifierStrength *= 1.1;
    },
  },
  {
    id: 'loyaltyCard',
    name: 'スタンプカード',
    description: 'リピーターが増えて来客速度が上がります。',
    cost: 4,
    branch: '左ルート',
    requires: ['happyPlaylist'],
    effectText: '来客速度 +18%',
    apply(state) {
      state.permanent.visitorMultiplier *= 1.18;
    },
  },
  {
    id: 'pastryLab',
    name: '小さなお菓子工房',
    description: '焼き菓子の人気で売上補正が上がります。',
    cost: 4,
    branch: '中央ルート',
    requires: ['signatureBeans'],
    effectText: '売上補正 +12%',
    apply(state) {
      state.permanent.salesMultiplier *= 1.12;
    },
  },
  {
    id: 'softLanterns',
    name: 'やわらか照明',
    description: 'お店の雰囲気で評判の効きが強くなります。',
    cost: 4,
    branch: '右ルート',
    requires: ['festivalBoard'],
    effectText: '評判効果 +20%',
    apply(state) {
      state.permanent.reputationEffectMultiplier *= 1.2;
    },
  },
];

const ACHIEVEMENTS = [
  {
    id: 'firstOpen',
    name: 'はじめての営業',
    description: '1日営業を1回終える',
    reward: '解放ポイント +1',
    condition: (state) => state.daysCompleted >= 1,
  },
  {
    id: 'sales100',
    name: '売上100到達',
    description: '累計売上を100にする',
    reward: '解放ポイント +1',
    condition: (state) => state.lifetimeMoney >= 100,
  },
  {
    id: 'sales400',
    name: '売上400到達',
    description: '累計売上を400にする',
    reward: '解放ポイント +1',
    condition: (state) => state.lifetimeMoney >= 400,
  },
  {
    id: 'sales1200',
    name: '売上1200到達',
    description: '累計売上を1200にする',
    reward: '解放ポイント +1',
    condition: (state) => state.lifetimeMoney >= 1200,
  },
  {
    id: 'day50',
    name: '今日は好調',
    description: '1日で売上50を達成する',
    reward: '解放ポイント +1',
    condition: (state) => state.stats.bestDayMoney >= 50,
  },
  {
    id: 'day90',
    name: '大繁盛',
    description: '1日で売上90を達成する',
    reward: '解放ポイント +1',
    condition: (state) => state.stats.bestDayMoney >= 90,
  },
  {
    id: 'day150',
    name: '列ができる店',
    description: '1日で売上150を達成する',
    reward: '解放ポイント +1',
    condition: (state) => state.stats.bestDayMoney >= 150,
  },
  {
    id: 'rep5',
    name: '名前を覚えられる',
    description: '評判5に到達する',
    reward: '解放ポイント +1',
    condition: (state) => state.reputation >= 5,
  },
  {
    id: 'rep10',
    name: '街の人気店',
    description: '評判10に到達する',
    reward: '解放ポイント +1',
    condition: (state) => state.reputation >= 10,
  },
  {
    id: 'rep18',
    name: '遠くからも来る',
    description: '評判18に到達する',
    reward: '解放ポイント +1',
    condition: (state) => state.reputation >= 18,
  },
  {
    id: 'boost5',
    name: '気合いの接客',
    description: 'ブーストを5回使う',
    reward: '解放ポイント +1',
    condition: (state) => state.stats.boostUses >= 5,
  },
  {
    id: 'boost12',
    name: 'ブースト巧者',
    description: 'ブーストを12回使う',
    reward: '解放ポイント +1',
    condition: (state) => state.stats.boostUses >= 12,
  },
  {
    id: 'customers40',
    name: '常連が増えてきた',
    description: '累計来客40人を達成する',
    reward: '解放ポイント +1',
    condition: (state) => state.stats.totalCustomers >= 40,
  },
  {
    id: 'customers120',
    name: '人気スポット',
    description: '累計来客120人を達成する',
    reward: '解放ポイント +1',
    condition: (state) => state.stats.totalCustomers >= 120,
  },
  {
    id: 'target3',
    name: '目標3連続',
    description: '目標達成を3日連続で続ける',
    reward: '解放ポイント +1',
    condition: (state) => state.stats.bestTargetStreak >= 3,
  },
  {
    id: 'target5',
    name: '目標5連続',
    description: '目標達成を5日連続で続ける',
    reward: '解放ポイント +1',
    condition: (state) => state.stats.bestTargetStreak >= 5,
  },
  {
    id: 'tree3',
    name: '育てはじめ',
    description: 'ツリーを3個開放する',
    reward: '解放ポイント +1',
    condition: (state) => state.unlockedNodes.length >= 3,
  },
  {
    id: 'tree6',
    name: '店づくり上手',
    description: 'ツリーを6個開放する',
    reward: '解放ポイント +1',
    condition: (state) => state.unlockedNodes.length >= 6,
  },
  {
    id: 'perk3',
    name: 'ひらめき上手',
    description: 'ランダム強化を3回選ぶ',
    reward: '解放ポイント +1',
    condition: (state) => state.stats.perkSelections >= 3,
  },
  {
    id: 'allBoosts',
    name: '看板もメニューも完璧',
    description: '両方のブーストを同じ営業で使う',
    reward: '解放ポイント +1',
    condition: (state) => state.stats.usedBothBoostsInRun,
  },
];

const AUTO_UNLOCKS = [
  { threshold: 3, label: 'お店メモ拡張', description: '連続目標達成の表示が有効になります。' },
  {
    threshold: 6,
    label: 'カフェランク補正',
    description: '実績数に応じて売上に小さな補正が付きます。',
  },
  {
    threshold: 10,
    label: 'ごほうびポイント',
    description: '営業目標達成時の解放ポイントがさらに +1 されます。',
  },
];

const TARGET_BALANCE = {
  baseValue: 24,
  dayGrowth: 3,
  projectedSalesWeight: 1,
  reputationWeight: 4,
  stretchBase: 1.1,
  stretchPerDay: 0.025,
};

const REPUTATION_BALANCE = {
  customerDivisor: 18,
  targetBonus: 1,
};

const BOOST_DEFS = {
  hustle: {
    id: 'hustle',
    name: '呼び込み',
    description: '10秒間、来客速度が2倍',
    baseDuration: 10,
    baseCooldown: 30,
    multiplier() {
      return { visitor: 2, price: 1 };
    },
  },
  menuPush: {
    id: 'menuPush',
    name: 'おすすめセット',
    description: '8秒間、単価が1.8倍',
    baseDuration: 8,
    baseCooldown: 40,
    multiplier() {
      return { visitor: 1, price: 1.8 };
    },
  },
};

const PRE_DAY_BOOSTS = [
  {
    id: 'morningFlyer',
    name: '朝のチラシ',
    description: '開店と同時に「呼び込み」が自動で発動します。',
    apply(run) {
      run.startingBoosts.push({ boostId: 'hustle', duration: 12 });
      run.notes.push('朝のチラシ: 開店直後に呼び込みが自動発動');
    },
  },
  {
    id: 'chefSpecial',
    name: '先出しセット',
    description: '開店と同時におすすめセット効果が先に始まります。',
    apply(run) {
      run.startingBoosts.push({ boostId: 'menuPush', duration: 10 });
      run.notes.push('先出しセット: 開店直後におすすめセットが自動発動');
    },
  },
  {
    id: 'earlyIdea',
    name: '朝の試食会',
    description: '今日のランダム強化が少し早めに出ます。',
    apply(run) {
      run.perkOfferTimeMultiplier *= 0.75;
      run.notes.push('朝の試食会: ランダム強化の登場が早くなる');
    },
  },
];

const MENU_OPTIONS = [
  {
    id: 'strawberryLatte',
    name: 'いちごラテ',
    description: 'やさしい甘さで単価が少し上がります。',
    apply(run) {
      run.priceMultiplier *= 1.12;
      run.notes.push('おすすめメニュー: いちごラテ');
    },
  },
  {
    id: 'cookiePlate',
    name: 'ねこクッキー皿',
    description: 'ついで買いが増えて来客が少し伸びます。',
    apply(run) {
      run.visitorMultiplier *= 1.15;
      run.notes.push('おすすめメニュー: ねこクッキー皿');
    },
  },
  {
    id: 'rewardPudding',
    name: 'ごほうびプリン',
    description: '営業目標を達成すると、ひらめきを追加で1獲得します。',
    apply(run) {
      run.insightOnTargetBonus += 1;
      run.notes.push('おすすめメニュー: ごほうびプリン');
    },
  },
];

const PREP_OPTIONS = [
  {
    id: 'carefulClean',
    name: 'ていねい清掃',
    description: '今日のランダム強化が少し早めに出ます。',
    apply(run) {
      run.perkOfferTimeMultiplier *= 0.82;
      run.notes.push('仕込み: ていねい清掃');
    },
  },
  {
    id: 'regularNotes',
    name: '常連メモ確認',
    description: '営業目標達成で評判を追加で1獲得します。',
    apply(run) {
      run.reputationOnTargetBonus += 1;
      run.notes.push('仕込み: 常連メモ確認');
    },
  },
  {
    id: 'boostCheck',
    name: '道具チェック',
    description: '最初に使う営業中ブーストの再使用が少し早くなります。',
    apply(run) {
      run.firstBoostCooldownCutMs += 10000;
      run.notes.push('仕込み: 道具チェック');
    },
  },
];

const RESEARCH_NODES = [
  {
    id: 'prepBoostKit',
    name: '営業前ブースト枠',
    cost: 2,
    description: '営業前に1つだけブーストを仕込めるようになります。',
    effectText: '開店前にブーストを選択できる',
    requires: [],
    apply(state) {
      state.systems.prepBoostUnlocked = true;
    },
  },
  {
    id: 'secondPrepBoost',
    name: '2つ目の営業前ブースト',
    cost: 3,
    description: '営業前ブーストを2つまで仕込めるようになります。',
    effectText: '営業前ブースト枠が2つになる',
    requires: ['prepBoostKit'],
    apply(state) {
      state.systems.secondPrepBoostUnlocked = true;
    },
  },
  {
    id: 'featuredMenu',
    name: '本日のおすすめメニュー',
    cost: 3,
    description: '営業前に今日のおすすめメニューを1つ選べます。',
    effectText: 'おすすめメニュー選択を解放',
    requires: [],
    apply(state) {
      state.systems.menuChoiceUnlocked = true;
    },
  },
  {
    id: 'modifierReroll',
    name: '天気メモの見直し',
    cost: 3,
    description: '日替わりの街のようすを営業前に1回だけ引き直せます。',
    effectText: '街のようすの事前確認と引き直しを解放',
    requires: [],
    apply(state) {
      state.systems.modifierRerollUnlocked = true;
    },
  },
  {
    id: 'prepStation',
    name: '仕込み台',
    cost: 4,
    description: '営業前に仕込みを1つ選べるようになります。',
    effectText: '仕込み選択を解放',
    requires: ['featuredMenu'],
    apply(state) {
      state.systems.prepChoiceUnlocked = true;
    },
  },
];

const elements = {
  moneyValue: document.getElementById('money-value'),
  lifetimeMoney: document.getElementById('lifetime-money'),
  reputationValue: document.getElementById('reputation-value'),
  unlockPointsValue: document.getElementById('unlock-points-value'),
  insightValue: document.getElementById('insight-value'),
  dayCountValue: document.getElementById('day-count-value'),
  streakLabel: document.getElementById('streak-label'),
  dayStatus: document.getElementById('day-status'),
  dailyModifierName: document.getElementById('daily-modifier-name'),
  dailyModifierDesc: document.getElementById('daily-modifier-desc'),
  timeLeftLabel: document.getElementById('time-left-label'),
  dailyTargetLabel: document.getElementById('daily-target-label'),
  dayProgressFill: document.getElementById('day-progress-fill'),
  dayMoneyValue: document.getElementById('day-money-value'),
  dayCustomersValue: document.getElementById('day-customers-value'),
  salesRateValue: document.getElementById('sales-rate-value'),
  basePriceValue: document.getElementById('base-price-value'),
  visitorRateValue: document.getElementById('visitor-rate-value'),
  reputationEffectValue: document.getElementById('reputation-effect-value'),
  todayMultiplierValue: document.getElementById('today-multiplier-value'),
  gradeBonusRow: document.getElementById('grade-bonus-row'),
  gradeBonusValue: document.getElementById('grade-bonus-value'),
  runBonusList: document.getElementById('run-bonus-list'),
  lastResultBox: document.getElementById('last-result-box'),
  boostGrid: document.getElementById('boost-grid'),
  prepGrid: document.getElementById('prep-grid'),
  prepStatus: document.getElementById('prep-status'),
  achievementGrid: document.getElementById('achievement-grid'),
  achievementSummary: document.getElementById('achievement-summary'),
  achievementUnlocks: document.getElementById('achievement-unlocks'),
  achievementProgress: document.getElementById('achievement-progress'),
  researchGrid: document.getElementById('research-grid'),
  researchSummary: document.getElementById('research-summary'),
  treeGrid: document.getElementById('tree-grid'),
  cafeGrade: document.getElementById('cafe-grade'),
  startDayButton: document.getElementById('start-day-button'),
  manualSaveButton: document.getElementById('manual-save-button'),
  resetRunButton: document.getElementById('reset-run-button'),
  exportSaveButton: document.getElementById('export-save-button'),
  copySaveButton: document.getElementById('copy-save-button'),
  importSaveButton: document.getElementById('import-save-button'),
  resetSaveButton: document.getElementById('reset-save-button'),
  saveDataTextarea: document.getElementById('save-data-textarea'),
  perkOverlay: document.getElementById('perk-overlay'),
  perkOptions: document.getElementById('perk-options'),
  toastStack: document.getElementById('toast-stack'),
  achievementsTabButton: document.getElementById('achievements-tab-button'),
  tabs: document.getElementById('tabs'),
  versionLabel: document.getElementById('version-label'),
};

const state = loadState();
let tickerHandle = 0;
let saveHandle = 0;

init();

function init() {
  bindEvents();
  ensureStateIntegrity();
  renderAll();
  if (elements.versionLabel) {
    elements.versionLabel.textContent = `Version ${APP_VERSION}`;
  }
  document.body.dataset.gameReady = 'true';
  tickerHandle = window.setInterval(tick, 250);
  saveHandle = window.setInterval(() => saveState(state), 5000);
}

function createDefaultState() {
  return {
    money: 0,
    lifetimeMoney: 0,
    reputation: 0,
    unlockPoints: 2,
    insight: 0,
    daysCompleted: 0,
    achievementsUnlocked: [],
    unlockedNodes: [],
    researchUnlocked: [],
    systems: {
      achievementsTabUnlocked: false,
      secondBoostUnlocked: false,
      extraPerkChoice: false,
      prepBoostUnlocked: false,
      secondPrepBoostUnlocked: false,
      menuChoiceUnlocked: false,
      modifierRerollUnlocked: false,
      prepChoiceUnlocked: false,
    },
    preDay: {
      selectedBoostIds: [],
      selectedMenuId: null,
      selectedPrepId: null,
      forecastModifierId: null,
      modifierRerollUsed: false,
    },
    permanent: {
      priceMultiplier: 1,
      visitorMultiplier: 1,
      salesMultiplier: 1,
      reputationGainMultiplier: 1,
      reputationEffectMultiplier: 1,
      cooldownMultiplier: 1,
      dailyModifierStrength: 1,
    },
    stats: {
      bestDayMoney: 0,
      totalCustomers: 0,
      boostUses: 0,
      perkSelections: 0,
      currentTargetStreak: 0,
      bestTargetStreak: 0,
      usedBothBoostsInRun: false,
    },
    dayRun: createIdleRunState(),
    lastResult: null,
    currentTab: 'operations',
  };
}

function createIdleRunState() {
  return {
    active: false,
    selectionPaused: false,
    modifierId: null,
    modifierName: '未設定',
    modifierDescription: '営業開始でランダムに決まります。',
    startedAt: 0,
    elapsedMs: 0,
    durationMs: 45000,
    dayMoney: 0,
    dayCustomers: 0,
    basePrice: 8,
    visitorRate: 0.75,
    dayTarget: 30,
    targetBaseValue: 0,
    targetGrowthValue: 0,
    targetDemandValue: 0,
    targetStretchMultiplier: 1,
    targetMultiplier: 1,
    priceMultiplier: 1,
    visitorMultiplier: 1,
    salesMultiplier: 1,
    reputationMultiplier: 1,
    reputationGainMultiplier: 1,
    effectMultiplier: 1,
    extraBoostDuration: 0,
    perkOfferTimeMultiplier: 1,
    insightOnTargetBonus: 0,
    reputationOnTargetBonus: 0,
    firstBoostCooldownCutMs: 0,
    firstBoostDiscountUsed: false,
    startingBoosts: [],
    boostStates: {},
    perkOffered: false,
    perkChosen: false,
    notes: [],
    usedBoostIds: [],
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createDefaultState();
    }
    return { ...createDefaultState(), ...JSON.parse(raw) };
  } catch (error) {
    console.warn('save load failed', error);
    return createDefaultState();
  }
}

function ensureStateIntegrity() {
  const defaults = createDefaultState();
  state.systems = { ...defaults.systems, ...state.systems };
  state.preDay = { ...defaults.preDay, ...state.preDay };
  state.permanent = { ...defaults.permanent, ...state.permanent };
  state.stats = { ...defaults.stats, ...state.stats };
  state.dayRun = { ...createIdleRunState(), ...state.dayRun };
  state.achievementsUnlocked = Array.isArray(state.achievementsUnlocked)
    ? state.achievementsUnlocked
    : [];
  state.unlockedNodes = Array.isArray(state.unlockedNodes) ? state.unlockedNodes : [];
  state.researchUnlocked = Array.isArray(state.researchUnlocked) ? state.researchUnlocked : [];
  if (!['operations', 'achievements', 'tree', 'research', 'settings'].includes(state.currentTab)) {
    state.currentTab = 'operations';
  }
  initializeBoostStates(state.dayRun);
  rebuildUnlockEffects();
  ensurePreDaySelections();
}

function rebuildUnlockEffects() {
  const defaults = createDefaultState();
  state.permanent = defaults.permanent;
  state.systems = { ...defaults.systems };
  for (const nodeId of state.unlockedNodes) {
    const node = TREE_NODES.find((entry) => entry.id === nodeId);
    if (node) {
      node.apply(state);
    }
  }
  for (const researchId of state.researchUnlocked) {
    const research = RESEARCH_NODES.find((entry) => entry.id === researchId);
    if (research) {
      research.apply(state);
    }
  }
}

function initializeBoostStates(run) {
  const boosts = getAvailableBoosts();
  for (const boost of boosts) {
    if (!run.boostStates[boost.id]) {
      run.boostStates[boost.id] = { activeUntil: 0, cooldownUntil: 0 };
    }
  }
}

function ensurePreDaySelections() {
  if (!state.preDay.forecastModifierId) {
    state.preDay.forecastModifierId = chooseRandom(DAILY_MODIFIERS).id;
  }
  if (!state.systems.prepBoostUnlocked) {
    state.preDay.selectedBoostIds = [];
  }
  if (!state.systems.menuChoiceUnlocked) {
    state.preDay.selectedMenuId = null;
  }
  if (!state.systems.prepChoiceUnlocked) {
    state.preDay.selectedPrepId = null;
  }
  const slotCount = getPreDayBoostSlotCount();
  state.preDay.selectedBoostIds = state.preDay.selectedBoostIds
    .filter(
      (id, index, list) =>
        PRE_DAY_BOOSTS.some((entry) => entry.id === id) && list.indexOf(id) === index,
    )
    .slice(0, slotCount);
}

function getPreDayBoostSlotCount() {
  if (!state.systems.prepBoostUnlocked) {
    return 0;
  }
  return state.systems.secondPrepBoostUnlocked ? 2 : 1;
}

function hasResearch(researchId) {
  return state.researchUnlocked.includes(researchId);
}

function getModifierById(modifierId) {
  return DAILY_MODIFIERS.find((entry) => entry.id === modifierId) || DAILY_MODIFIERS[0];
}

function setForecastModifier(modifierId) {
  state.preDay.forecastModifierId = modifierId;
}

function rerollForecastModifier() {
  const currentId = state.preDay.forecastModifierId;
  const choices = DAILY_MODIFIERS.filter((entry) => entry.id !== currentId);
  const modifier = chooseRandom(choices);
  setForecastModifier(modifier.id);
  state.preDay.modifierRerollUsed = true;
}

function bindEvents() {
  elements.startDayButton.addEventListener('click', startDay);
  elements.manualSaveButton.addEventListener('click', () => {
    saveState(state);
    showToast('保存しました', 'ローカルに進行状況を保存しました。');
  });
  elements.resetRunButton.addEventListener('click', () => {
    if (state.dayRun.notes.length === 0) {
      showToast('今日の強化', 'まだ今日だけの強化はありません。');
      return;
    }
    showToast('今日の強化', state.dayRun.notes.join(' / '));
  });

  elements.exportSaveButton.addEventListener('click', exportSaveData);
  elements.copySaveButton.addEventListener('click', copySaveData);
  elements.importSaveButton.addEventListener('click', importSaveData);
  elements.resetSaveButton.addEventListener('click', resetAllProgress);
  elements.saveDataTextarea.addEventListener('input', () => {
    elements.saveDataTextarea.dataset.autofill = 'manual';
  });

  elements.tabs.addEventListener('click', (event) => {
    const button = event.target.closest('[data-tab]');
    if (!button) {
      return;
    }
    if (button.dataset.tab === 'achievements' && !state.systems.achievementsTabUnlocked) {
      showToast('まだ開放されていません', '解放ツリーの「実績ノート」で実績タブを開けます。');
      return;
    }
    state.currentTab = button.dataset.tab;
    renderTabs();
    saveState(state);
  });

  elements.boostGrid.addEventListener('click', (event) => {
    const button = event.target.closest('[data-boost-id]');
    if (!button || button.disabled) {
      return;
    }
    useBoost(button.dataset.boostId);
  });
}

function startDay() {
  if (state.dayRun.active) {
    return;
  }
  ensurePreDaySelections();
  const modifier = getModifierById(state.preDay.forecastModifierId);
  state.dayRun = createIdleRunState();
  state.dayRun.active = true;
  state.dayRun.modifierId = modifier.id;
  state.dayRun.modifierName = modifier.name;
  state.dayRun.modifierDescription = modifier.description;
  state.dayRun.startedAt = Date.now();
  state.dayRun.durationMs = 45000 + Math.min(state.daysCompleted, 6) * 1500;
  state.dayRun.basePrice = 8 + Math.floor(state.daysCompleted / 2);
  state.dayRun.visitorRate = 0.75 + state.reputation * 0.035 + state.daysCompleted * 0.015;
  state.dayRun.priceMultiplier = modifier.priceMultiplier;
  state.dayRun.visitorMultiplier = modifier.visitorMultiplier;
  state.dayRun.salesMultiplier = modifier.effectMultiplier;
  state.dayRun.reputationMultiplier = modifier.reputationMultiplier;
  state.dayRun.effectMultiplier = modifier.effectMultiplier;
  state.dayRun.notes = [modifier.name + ': ' + modifier.description];
  applyPreDaySelections(state.dayRun);
  initializeDayTarget(state.dayRun);
  initializeBoostStates(state.dayRun);
  applyStartingBoosts(state.dayRun);
  renderAll();
  saveState(state);
}

function initializeDayTarget(run) {
  const projectedBaseSales =
    run.basePrice *
    state.permanent.priceMultiplier *
    run.priceMultiplier *
    run.visitorRate *
    state.permanent.visitorMultiplier *
    run.visitorMultiplier *
    (1 +
      state.reputation *
        0.04 *
        run.reputationMultiplier *
        state.permanent.reputationEffectMultiplier) *
    state.permanent.salesMultiplier *
    run.salesMultiplier *
    state.permanent.dailyModifierStrength *
    (run.durationMs / 1000);
  run.targetBaseValue = TARGET_BALANCE.baseValue + state.daysCompleted * TARGET_BALANCE.dayGrowth;
  run.targetGrowthValue = projectedBaseSales * TARGET_BALANCE.projectedSalesWeight;
  run.targetDemandValue = state.reputation * TARGET_BALANCE.reputationWeight;
  run.targetStretchMultiplier =
    TARGET_BALANCE.stretchBase + Math.min(state.daysCompleted, 20) * TARGET_BALANCE.stretchPerDay;
  run.dayTarget = Math.round(
    (run.targetBaseValue + run.targetGrowthValue + run.targetDemandValue) *
      run.targetStretchMultiplier,
  );
}

function applyPreDaySelections(run) {
  for (const boostId of state.preDay.selectedBoostIds) {
    const boost = PRE_DAY_BOOSTS.find((entry) => entry.id === boostId);
    if (boost) {
      boost.apply(run);
    }
  }
  if (state.preDay.selectedMenuId) {
    const menu = MENU_OPTIONS.find((entry) => entry.id === state.preDay.selectedMenuId);
    if (menu) {
      menu.apply(run);
    }
  }
  if (state.preDay.selectedPrepId) {
    const prep = PREP_OPTIONS.find((entry) => entry.id === state.preDay.selectedPrepId);
    if (prep) {
      prep.apply(run);
    }
  }
}

function applyStartingBoosts(run) {
  const now = Date.now();
  for (const startingBoost of run.startingBoosts) {
    if (!run.boostStates[startingBoost.boostId]) {
      run.boostStates[startingBoost.boostId] = { activeUntil: 0, cooldownUntil: 0 };
    }
    run.boostStates[startingBoost.boostId].activeUntil = Math.max(
      run.boostStates[startingBoost.boostId].activeUntil,
      now + startingBoost.duration * 1000,
    );
  }
}

function tick() {
  if (!state.dayRun.active) {
    renderDynamic();
    return;
  }

  const run = state.dayRun;
  if (run.selectionPaused) {
    renderDynamic();
    return;
  }

  const now = Date.now();
  const delta = 250;
  run.elapsedMs = Math.min(run.elapsedMs + delta, run.durationMs);
  updateRunRevenue(delta / 1000, now);

  const perkUnlockTime = run.durationMs * 0.38 * run.perkOfferTimeMultiplier;
  if (!run.perkOffered && run.elapsedMs >= perkUnlockTime) {
    offerPerkChoices();
  }

  if (run.elapsedMs >= run.durationMs) {
    finishDay();
  }

  renderDynamic();
}

function updateRunRevenue(deltaSeconds, now) {
  const run = state.dayRun;
  const activeMultipliers = getActiveBoostMultipliers(now);
  const reputationEffect =
    1 +
    state.reputation * 0.04 * run.reputationMultiplier * state.permanent.reputationEffectMultiplier;
  const price =
    run.basePrice * state.permanent.priceMultiplier * run.priceMultiplier * activeMultipliers.price;
  const visitorRate =
    run.visitorRate *
    state.permanent.visitorMultiplier *
    run.visitorMultiplier *
    activeMultipliers.visitor;
  const salesMultiplier =
    state.permanent.salesMultiplier *
    run.salesMultiplier *
    getAchievementBonusMultiplier() *
    state.permanent.dailyModifierStrength;
  const moneyGain = price * visitorRate * reputationEffect * salesMultiplier * deltaSeconds;
  const customerGain = visitorRate * deltaSeconds;
  run.dayMoney += moneyGain;
  run.dayCustomers += customerGain;
  state.money += moneyGain;
  state.lifetimeMoney += moneyGain;
}

function finishDay() {
  const run = state.dayRun;
  run.active = false;
  run.selectionPaused = false;
  state.daysCompleted += 1;
  const roundedDayMoney = roundValue(run.dayMoney);
  const roundedCustomers = Math.floor(run.dayCustomers);
  state.stats.bestDayMoney = Math.max(state.stats.bestDayMoney, roundedDayMoney);
  state.stats.totalCustomers += roundedCustomers;

  const targetValue = getCurrentTargetValue();
  const achievedTarget = roundedDayMoney >= targetValue;
  let unlockGain = 1;
  let insightGain = 0;
  if (achievedTarget) {
    state.stats.currentTargetStreak += 1;
    state.stats.bestTargetStreak = Math.max(
      state.stats.bestTargetStreak,
      state.stats.currentTargetStreak,
    );
    unlockGain += 2;
    insightGain += 2 + run.insightOnTargetBonus;
    if (getAchievementCount() >= 10) {
      unlockGain += 1;
    }
  } else {
    state.stats.currentTargetStreak = 0;
    insightGain += 0;
  }

  const reputationGain = Math.max(
    1,
    Math.round(
      (roundedCustomers / REPUTATION_BALANCE.customerDivisor +
        (achievedTarget ? REPUTATION_BALANCE.targetBonus + run.reputationOnTargetBonus : 0)) *
        state.permanent.reputationGainMultiplier *
        run.reputationGainMultiplier,
    ),
  );

  state.reputation += reputationGain;
  state.unlockPoints += unlockGain;
  state.insight += insightGain;
  state.stats.usedBothBoostsInRun =
    run.usedBoostIds.includes('hustle') && run.usedBoostIds.includes('menuPush');

  const newAchievements = evaluateAchievements();
  state.lastResult = {
    dayNumber: state.daysCompleted,
    sales: roundedDayMoney,
    customers: roundedCustomers,
    reputationGain,
    unlockGain,
    insightGain,
    achievedTarget,
    modifierName: run.modifierName,
    targetValue,
    achievements: newAchievements.map((entry) => entry.name),
  };

  state.dayRun = createIdleRunState();
  state.preDay.modifierRerollUsed = false;
  state.preDay.forecastModifierId = chooseRandom(DAILY_MODIFIERS).id;
  initializeBoostStates(state.dayRun);
  ensurePreDaySelections();
  renderAll();
  saveState(state);
}

function evaluateAchievements() {
  const newlyUnlocked = [];
  for (const achievement of ACHIEVEMENTS) {
    if (state.achievementsUnlocked.includes(achievement.id)) {
      continue;
    }
    if (achievement.condition(state)) {
      state.achievementsUnlocked.push(achievement.id);
      state.unlockPoints += 1;
      state.insight += 1;
      newlyUnlocked.push(achievement);
      showToast(
        '実績達成: ' + achievement.name,
        achievement.description + ' / 解放ポイント +1 / ひらめき +1',
      );
    }
  }
  return newlyUnlocked;
}

function offerPerkChoices() {
  const run = state.dayRun;
  run.perkOffered = true;
  run.selectionPaused = true;
  const count = state.systems.extraPerkChoice ? 4 : 3;
  const options = shuffle([...PERK_POOL]).slice(0, count);
  elements.perkOptions.innerHTML = '';
  for (const perk of options) {
    const button = document.createElement('button');
    button.className = 'perk-button';
    button.innerHTML = `<strong>${perk.name}</strong><div>${perk.description}</div>`;
    button.addEventListener('click', () => {
      perk.apply(state.dayRun);
      state.dayRun.perkChosen = true;
      state.stats.perkSelections += 1;
      closePerkOverlay();
      showToast('今日だけの強化', perk.name + ' を選びました。');
      evaluateAchievements();
      renderAll();
      saveState(state);
    });
    elements.perkOptions.appendChild(button);
  }
  elements.perkOverlay.classList.remove('hidden');
  elements.perkOverlay.setAttribute('aria-hidden', 'false');
}

function closePerkOverlay() {
  state.dayRun.selectionPaused = false;
  elements.perkOverlay.classList.add('hidden');
  elements.perkOverlay.setAttribute('aria-hidden', 'true');
}

function getAvailableBoosts() {
  const boosts = [BOOST_DEFS.hustle];
  if (state.systems.secondBoostUnlocked) {
    boosts.push(BOOST_DEFS.menuPush);
  }
  return boosts;
}

function useBoost(boostId) {
  const run = state.dayRun;
  if (!run.active || run.selectionPaused) {
    return;
  }
  const boost = BOOST_DEFS[boostId];
  const now = Date.now();
  const boostState = run.boostStates[boostId];
  const cooldown = Math.round(boost.baseCooldown * state.permanent.cooldownMultiplier);
  if (!boostState || boostState.cooldownUntil > now) {
    return;
  }
  const duration = boost.baseDuration + run.extraBoostDuration;
  boostState.activeUntil = now + duration * 1000;
  const cooldownCut = !run.firstBoostDiscountUsed ? run.firstBoostCooldownCutMs : 0;
  boostState.cooldownUntil = now + Math.max(5000, cooldown * 1000 - cooldownCut);
  run.firstBoostDiscountUsed = true;
  state.stats.boostUses += 1;
  if (!run.usedBoostIds.includes(boostId)) {
    run.usedBoostIds.push(boostId);
  }
  evaluateAchievements();
  renderBoosts();
  saveState(state);
}

function getActiveBoostMultipliers(now) {
  const result = { visitor: 1, price: 1 };
  for (const boost of Object.values(BOOST_DEFS)) {
    const status = state.dayRun.boostStates[boost.id];
    if (!status || status.activeUntil <= now) {
      continue;
    }
    const multiplier = boost.multiplier();
    result.visitor *= multiplier.visitor;
    result.price *= multiplier.price;
  }
  return result;
}

function purchaseNode(nodeId) {
  const node = TREE_NODES.find((entry) => entry.id === nodeId);
  if (!node || state.unlockedNodes.includes(node.id)) {
    return;
  }
  const prereqsMet = node.requires.every((required) => state.unlockedNodes.includes(required));
  if (!prereqsMet || state.unlockPoints < node.cost) {
    return;
  }
  state.unlockPoints -= node.cost;
  state.unlockedNodes.push(node.id);
  node.apply(state);
  showToast('ノード開放', `${node.name} を開放しました。`);
  evaluateAchievements();
  renderAll();
  saveState(state);
}

function purchaseResearch(researchId) {
  const research = RESEARCH_NODES.find((entry) => entry.id === researchId);
  if (!research || hasResearch(research.id)) {
    return;
  }
  const prereqsMet = research.requires.every((required) => hasResearch(required));
  if (!prereqsMet || state.insight < research.cost) {
    return;
  }
  state.insight -= research.cost;
  state.researchUnlocked.push(research.id);
  research.apply(state);
  ensurePreDaySelections();
  showToast('研究完了', `${research.name} を解放しました。`);
  renderAll();
  saveState(state);
}

function renderAll() {
  renderTabs();
  renderResources();
  renderOperations();
  renderBoosts();
  renderAchievements();
  renderResearch();
  renderTree();
  renderSettings();
}

function renderTabs() {
  elements.achievementsTabButton.classList.toggle('hidden', !state.systems.achievementsTabUnlocked);
  for (const button of document.querySelectorAll('.tab-button')) {
    button.classList.toggle('active', button.dataset.tab === state.currentTab);
  }
  for (const panel of document.querySelectorAll('.tab-panel')) {
    panel.classList.toggle('active', panel.dataset.panel === state.currentTab);
  }
  if (state.currentTab === 'achievements' && !state.systems.achievementsTabUnlocked) {
    state.currentTab = 'operations';
    renderTabs();
  }
}

function renderResources() {
  elements.moneyValue.textContent = formatNumber(state.money);
  elements.lifetimeMoney.textContent = formatNumber(state.lifetimeMoney);
  elements.reputationValue.textContent = formatNumber(state.reputation);
  elements.unlockPointsValue.textContent = formatNumber(state.unlockPoints);
  elements.insightValue.textContent = formatNumber(state.insight);
  elements.dayCountValue.textContent = `${state.daysCompleted}日`;
  elements.streakLabel.textContent = `連続目標達成 ${state.stats.currentTargetStreak}日`;
  elements.achievementProgress.textContent = `実績 ${getAchievementCount()} / ${ACHIEVEMENTS.length}`;
  elements.cafeGrade.textContent = getCafeGradeLabel();
}

function renderOperations(includePrepOptions = true) {
  const run = state.dayRun;
  const targetValue = run.active ? getCurrentTargetValue() : getPreviewTargetValue();
  elements.dayStatus.dataset.state = run.active
    ? run.selectionPaused
      ? 'paused'
      : 'active'
    : 'ready';
  elements.dayStatus.textContent = run.active
    ? run.selectionPaused
      ? '強化選択中'
      : '営業中'
    : '準備中';
  elements.dailyModifierName.textContent = run.modifierName;
  elements.dailyModifierDesc.textContent = run.modifierDescription;
  elements.timeLeftLabel.textContent = run.active
    ? `残り ${formatSeconds(Math.max(0, run.durationMs - run.elapsedMs))}`
    : `営業時間 ${formatSeconds(run.durationMs)}`;
  elements.dailyTargetLabel.textContent = `本日の売上目標 ${formatNumber(targetValue)}`;
  elements.dayProgressFill.style.width = `${Math.min(100, (run.elapsedMs / run.durationMs) * 100)}%`;
  elements.dayMoneyValue.textContent = formatNumber(run.dayMoney);
  elements.dayCustomersValue.textContent = `${Math.floor(run.dayCustomers)}人`;
  elements.salesRateValue.textContent = formatNumber(getProjectedSalesPerSecond()) + '/秒';
  elements.basePriceValue.textContent = formatNumber(getCurrentBasePrice());
  elements.visitorRateValue.textContent = `${formatNumber(getCurrentVisitorRate())}人/秒`;
  elements.reputationEffectValue.textContent = `x${formatNumber(getReputationEffect(), 2)}`;
  elements.todayMultiplierValue.textContent = `x${formatNumber(getTodayMultiplier(), 2)}`;
  elements.gradeBonusRow.classList.toggle('hidden', getAchievementCount() < 6);
  elements.gradeBonusValue.textContent = `x${formatNumber(getAchievementBonusMultiplier(), 2)}`;
  elements.startDayButton.disabled = run.active;
  if (includePrepOptions) {
    renderPrepOptions();
  }
  renderRunNotes();
  renderLastResult();
}

function renderDynamic() {
  renderResources();
  renderOperations(false);
  updateBoostDisplays();
}

function renderRunNotes() {
  const items = state.dayRun.notes.length ? state.dayRun.notes : ['まだありません'];
  elements.runBonusList.innerHTML = items.map((note) => `<li>${note}</li>`).join('');
}

function renderLastResult() {
  if (!state.lastResult) {
    elements.lastResultBox.textContent = '営業終了後にここへ結果が表示されます。';
    return;
  }
  const result = state.lastResult;
  const achievementText =
    result.achievements.length > 0 ? ` / 新実績: ${result.achievements.join('、')}` : '';
  elements.lastResultBox.textContent =
    `${result.dayNumber}日目: 売上 ${formatNumber(result.sales)} / 目標 ${formatNumber(result.targetValue)}、来客 ${result.customers}人、評判 +${result.reputationGain}、解放ポイント +${result.unlockGain}、ひらめき +${result.insightGain}` +
    ` / ${result.modifierName}${result.achievedTarget ? ' / 売上目標達成' : ' / 売上目標は未達'}${achievementText}`;
}

function renderBoosts() {
  const now = Date.now();
  const boosts = [...getAvailableBoosts()];
  for (const boost of Object.values(BOOST_DEFS)) {
    const exists = boosts.some((entry) => entry.id === boost.id);
    const status = state.dayRun.boostStates[boost.id];
    if (!exists && status && status.activeUntil > now) {
      boosts.push(boost);
    }
  }
  elements.boostGrid.innerHTML = '';
  for (const boost of boosts) {
    const boostState = state.dayRun.boostStates[boost.id] || { activeUntil: 0, cooldownUntil: 0 };
    const activeLeft = Math.max(0, boostState.activeUntil - now);
    const cooldownLeft = Math.max(0, boostState.cooldownUntil - now);
    const canUseManually = getAvailableBoosts().some((entry) => entry.id === boost.id);
    const ready =
      canUseManually && state.dayRun.active && cooldownLeft === 0 && !state.dayRun.selectionPaused;
    const wrapper = document.createElement('article');
    wrapper.className = `boost-card ${
      activeLeft > 0 ? 'active-state' : ready ? 'ready' : cooldownLeft > 0 ? 'cooldown' : ''
    }`.trim();
    wrapper.innerHTML = `
      <h3>${boost.name}</h3>
      <div class="boost-meta">${boost.description}</div>
      <div class="boost-line">
        <span>${activeLeft > 0 ? `発動中 ${formatSeconds(activeLeft)}` : cooldownLeft > 0 ? `再使用まで ${formatSeconds(cooldownLeft)}` : '準備完了'}</span>
        <button class="boost-button" data-boost-id="${boost.id}" ${ready ? '' : 'disabled'}>${canUseManually ? '使う' : '自動発動'}</button>
      </div>
    `;
    elements.boostGrid.appendChild(wrapper);
  }
  updateBoostDisplays(now);
}

function updateBoostDisplays(now = Date.now()) {
  for (const card of elements.boostGrid.querySelectorAll('.boost-card')) {
    const button = card.querySelector('[data-boost-id]');
    if (!button) {
      continue;
    }

    const boostId = button.dataset.boostId;
    const boost = BOOST_DEFS[boostId];
    const boostState = state.dayRun.boostStates[boostId] || { activeUntil: 0, cooldownUntil: 0 };
    const activeLeft = Math.max(0, boostState.activeUntil - now);
    const cooldownLeft = Math.max(0, boostState.cooldownUntil - now);
    const canUseManually = getAvailableBoosts().some((entry) => entry.id === boostId);
    const ready =
      canUseManually && state.dayRun.active && cooldownLeft === 0 && !state.dayRun.selectionPaused;

    card.className = `boost-card ${
      activeLeft > 0 ? 'active-state' : ready ? 'ready' : cooldownLeft > 0 ? 'cooldown' : ''
    }`.trim();

    const statusLabel = card.querySelector('.boost-line span');
    if (statusLabel) {
      statusLabel.textContent =
        activeLeft > 0
          ? `効果中 ${formatSeconds(activeLeft)}`
          : cooldownLeft > 0
            ? `再使用まで ${formatSeconds(cooldownLeft)}`
            : '準備完了';
    }

    button.disabled = !ready;
    button.textContent = canUseManually ? '使う' : '自動発動';

    if (boost?.description) {
      const meta = card.querySelector('.boost-meta');
      if (meta) {
        meta.textContent = boost.description;
      }
    }
  }
}

function renderPrepOptions() {
  ensurePreDaySelections();
  const isActive = state.dayRun.active;
  const cards = [];

  if (state.systems.modifierRerollUnlocked) {
    const modifier = getModifierById(state.preDay.forecastModifierId);
    cards.push(`
      <article class="prep-option">
        <h3>今日の街のようす</h3>
        <p>${modifier.name}</p>
        <small>${modifier.description}</small>
        <button class="inline-button" id="reroll-modifier-button" ${isActive || state.preDay.modifierRerollUsed ? 'disabled' : ''}>
          ${state.preDay.modifierRerollUsed ? '今日は引き直し済み' : '1回だけ引き直す'}
        </button>
      </article>
    `);
  }

  if (state.systems.menuChoiceUnlocked) {
    cards.push(`
      <article class="prep-option">
        <h3>本日のおすすめメニュー</h3>
        <p>営業前に1つ選べます。</p>
        <div class="chip-row" id="menu-chip-row"></div>
      </article>
    `);
  }

  if (state.systems.prepChoiceUnlocked) {
    cards.push(`
      <article class="prep-option">
        <h3>仕込み</h3>
        <p>営業前に1つだけ準備を選べます。</p>
        <div class="chip-row" id="prep-chip-row"></div>
      </article>
    `);
  }

  if (state.systems.prepBoostUnlocked) {
    cards.push(`
      <article class="prep-option">
        <h3>営業前ブースト</h3>
        <p>${getPreDayBoostSlotCount()}つまで選べます。</p>
        <div class="chip-row" id="preboost-chip-row"></div>
      </article>
    `);
  }

  if (cards.length === 0) {
    cards.push(`
      <article class="prep-option">
        <h3>研究待ち</h3>
        <p>研究タブで新しい準備行動を解放すると、営業前に選べることが増えていきます。</p>
      </article>
    `);
  }

  elements.prepStatus.textContent =
    cards.length === 1 &&
    !state.systems.prepBoostUnlocked &&
    !state.systems.menuChoiceUnlocked &&
    !state.systems.modifierRerollUnlocked &&
    !state.systems.prepChoiceUnlocked
      ? '研究で行動が増えます'
      : isActive
        ? '営業中は固定'
        : '営業前に選べます';
  elements.prepStatus.dataset.state =
    cards.length === 1 &&
    !state.systems.prepBoostUnlocked &&
    !state.systems.menuChoiceUnlocked &&
    !state.systems.modifierRerollUnlocked &&
    !state.systems.prepChoiceUnlocked
      ? 'locked'
      : isActive
        ? 'disabled'
        : 'ready';
  elements.prepGrid.innerHTML = cards.join('');

  const rerollButton = document.getElementById('reroll-modifier-button');
  if (rerollButton) {
    rerollButton.addEventListener('click', () => {
      rerollForecastModifier();
      renderAll();
      saveState(state);
    });
  }

  const menuRow = document.getElementById('menu-chip-row');
  if (menuRow) {
    for (const menu of MENU_OPTIONS) {
      const button = document.createElement('button');
      button.className = `select-chip ${state.preDay.selectedMenuId === menu.id ? 'active' : ''}`;
      button.disabled = isActive;
      button.textContent = menu.name;
      button.title = menu.description;
      button.addEventListener('click', () => {
        state.preDay.selectedMenuId = state.preDay.selectedMenuId === menu.id ? null : menu.id;
        renderPrepOptions();
        saveState(state);
      });
      menuRow.appendChild(button);
    }
  }

  const prepRow = document.getElementById('prep-chip-row');
  if (prepRow) {
    for (const prep of PREP_OPTIONS) {
      const button = document.createElement('button');
      button.className = `select-chip ${state.preDay.selectedPrepId === prep.id ? 'active' : ''}`;
      button.disabled = isActive;
      button.textContent = prep.name;
      button.title = prep.description;
      button.addEventListener('click', () => {
        state.preDay.selectedPrepId = state.preDay.selectedPrepId === prep.id ? null : prep.id;
        renderPrepOptions();
        saveState(state);
      });
      prepRow.appendChild(button);
    }
  }

  const boostRow = document.getElementById('preboost-chip-row');
  if (boostRow) {
    for (const boost of PRE_DAY_BOOSTS) {
      const selected = state.preDay.selectedBoostIds.includes(boost.id);
      const button = document.createElement('button');
      button.className = `select-chip ${selected ? 'active' : ''}`;
      button.disabled = isActive;
      button.textContent = boost.name;
      button.title = boost.description;
      button.addEventListener('click', () => {
        const selectedIds = [...state.preDay.selectedBoostIds];
        const slotCount = getPreDayBoostSlotCount();
        if (selected) {
          state.preDay.selectedBoostIds = selectedIds.filter((id) => id !== boost.id);
        } else if (selectedIds.length < slotCount) {
          state.preDay.selectedBoostIds = [...selectedIds, boost.id];
        } else {
          state.preDay.selectedBoostIds = [...selectedIds.slice(1), boost.id];
        }
        renderPrepOptions();
        saveState(state);
      });
      boostRow.appendChild(button);
    }
  }
}

function renderResearch() {
  elements.researchSummary.textContent = `ひらめき ${formatNumber(state.insight)}`;
  elements.researchGrid.innerHTML = '';
  for (const research of RESEARCH_NODES) {
    const unlocked = hasResearch(research.id);
    const ready = research.requires.every((required) => hasResearch(required));
    const canBuy = ready && !unlocked && state.insight >= research.cost;
    const card = document.createElement('article');
    card.className = `research-card ${unlocked ? 'unlocked' : canBuy ? 'ready' : 'locked'}`;
    const prereqText =
      research.requires.length === 0 ? 'なし' : research.requires.map(getResearchName).join(' / ');
    card.innerHTML = `
      <h3>${research.name}</h3>
      <p>${research.description}</p>
      <small>${research.effectText}</small>
      <div class="research-meta">
        <span>コスト ${research.cost}</span>
        <span>${unlocked ? '研究済み' : ready ? '研究可能' : `前提: ${prereqText}`}</span>
      </div>
      <button class="tree-button" ${canBuy ? '' : 'disabled'}>${unlocked ? '研究済み' : '研究する'}</button>
    `;
    card
      .querySelector('.tree-button')
      .addEventListener('click', () => purchaseResearch(research.id));
    elements.researchGrid.appendChild(card);
  }
}

function renderSettings() {
  if (elements.saveDataTextarea.dataset.autofill !== 'manual') {
    elements.saveDataTextarea.value = serializeSaveData();
  }
}

function renderAchievements() {
  const count = getAchievementCount();
  elements.achievementSummary.textContent = `${count} / ${ACHIEVEMENTS.length}達成`;
  elements.achievementUnlocks.innerHTML = AUTO_UNLOCKS.map((unlock) => {
    const active = count >= unlock.threshold;
    return `
      <article class="unlock-chip ${active ? 'active' : 'locked'}">
        <strong>${unlock.label}</strong>
        <div>${unlock.description}</div>
        <small>${active ? '開放済み' : `実績 ${unlock.threshold} 個で開放`}</small>
      </article>
    `;
  }).join('');
  elements.achievementGrid.innerHTML = ACHIEVEMENTS.map((achievement) => {
    const unlocked = state.achievementsUnlocked.includes(achievement.id);
    return `
      <article class="achievement-card ${unlocked ? 'unlocked' : 'locked'}">
        <h3>${achievement.name}</h3>
        <p>${achievement.description}</p>
        <small>${unlocked ? '達成済み' : '未達成'}</small>
        <div class="reward">${achievement.reward}</div>
      </article>
    `;
  }).join('');
}

function renderTree() {
  elements.treeGrid.innerHTML = '';
  for (const node of TREE_NODES) {
    const purchased = state.unlockedNodes.includes(node.id);
    const ready = node.requires.every((required) => state.unlockedNodes.includes(required));
    const canBuy = ready && !purchased && state.unlockPoints >= node.cost;
    const card = document.createElement('article');
    card.className = `tree-card ${purchased ? 'purchased' : canBuy ? 'ready' : 'locked'}`;
    const prereqText =
      node.requires.length === 0 ? 'なし' : node.requires.map(getNodeName).join(' / ');
    card.innerHTML = `
      <div class="mini-label">${node.branch}</div>
      <h3>${node.name}</h3>
      <p>${node.description}</p>
      <div class="tree-meta">
        <span>コスト ${node.cost}</span>
        <span>${purchased ? '開放済み' : ready ? '購入可能' : `前提: ${prereqText}`}</span>
      </div>
      <p>${node.effectText}</p>
      <button class="tree-button" ${canBuy ? '' : 'disabled'}>${purchased ? '開放済み' : '開放する'}</button>
    `;
    card.querySelector('.tree-button').addEventListener('click', () => purchaseNode(node.id));
    elements.treeGrid.appendChild(card);
  }
}

function saveState(nextState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
  } catch (error) {
    console.warn('save failed', error);
  }
}

function serializeSaveData() {
  return JSON.stringify(state, null, 2);
}

function exportSaveData() {
  elements.saveDataTextarea.dataset.autofill = 'auto';
  elements.saveDataTextarea.value = serializeSaveData();
  elements.saveDataTextarea.focus();
  elements.saveDataTextarea.select();
  showToast('エクスポート準備完了', 'セーブデータをテキスト欄に出力しました。');
}

async function copySaveData() {
  const text = serializeSaveData();
  elements.saveDataTextarea.dataset.autofill = 'auto';
  elements.saveDataTextarea.value = text;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      showToast('コピーしました', 'セーブデータをクリップボードへコピーしました。');
      return;
    }
  } catch (error) {
    console.warn('clipboard copy failed', error);
  }
  elements.saveDataTextarea.focus();
  elements.saveDataTextarea.select();
  showToast('コピー準備完了', 'テキスト欄を選択しました。手動でコピーできます。');
}

function importSaveData() {
  const raw = elements.saveDataTextarea.value.trim();
  if (!raw) {
    showToast('インポートできません', 'セーブデータ欄に文字列を貼り付けてください。');
    return;
  }
  try {
    const parsed = JSON.parse(raw);
    applyLoadedState(parsed);
    saveState(state);
    elements.saveDataTextarea.dataset.autofill = 'auto';
    elements.saveDataTextarea.value = serializeSaveData();
    showToast('インポートしました', 'セーブデータを読み込みました。');
  } catch (error) {
    console.warn('import failed', error);
    showToast('インポート失敗', 'セーブデータの形式が正しくありません。');
  }
}

function resetAllProgress() {
  const accepted = window.confirm(
    '本当に全リセットしますか？\n現在の売上・実績・研究・解放状況はすべて失われます。',
  );
  if (!accepted) {
    return;
  }
  applyLoadedState(createDefaultState());
  saveState(state);
  elements.saveDataTextarea.dataset.autofill = 'auto';
  elements.saveDataTextarea.value = serializeSaveData();
  showToast('全リセットしました', '最初の状態に戻しました。');
}

function applyLoadedState(source) {
  const fresh = createDefaultState();
  const loaded = { ...fresh, ...source };
  for (const key of Object.keys(state)) {
    delete state[key];
  }
  Object.assign(state, loaded);
  ensureStateIntegrity();
  if (state.dayRun.active) {
    closePerkOverlay();
    state.dayRun.active = false;
    state.dayRun.selectionPaused = false;
  }
  renderAll();
}

function getProjectedSalesPerSecond() {
  if (!state.dayRun.active) {
    return 0;
  }
  const now = Date.now();
  const multipliers = getActiveBoostMultipliers(now);
  return (
    getCurrentBasePrice() *
    getCurrentVisitorRate() *
    getReputationEffect() *
    getTodayMultiplier() *
    multipliers.price *
    multipliers.visitor
  );
}

function getCurrentBasePrice() {
  return state.dayRun.basePrice * state.permanent.priceMultiplier * state.dayRun.priceMultiplier;
}

function getCurrentVisitorRate() {
  return (
    state.dayRun.visitorRate * state.permanent.visitorMultiplier * state.dayRun.visitorMultiplier
  );
}

function getReputationEffect() {
  return (
    1 +
    state.reputation *
      0.04 *
      state.dayRun.reputationMultiplier *
      state.permanent.reputationEffectMultiplier
  );
}

function getAchievementBonusMultiplier() {
  return getAchievementCount() >= 6 ? 1 + Math.min(getAchievementCount() - 5, 8) * 0.01 : 1;
}

function getTodayMultiplier() {
  return (
    state.permanent.salesMultiplier *
    state.dayRun.salesMultiplier *
    state.permanent.dailyModifierStrength *
    getAchievementBonusMultiplier()
  );
}

function getCurrentTargetValue() {
  return Math.round(state.dayRun.dayTarget * state.dayRun.targetMultiplier);
}

function getPreviewTargetValue() {
  const previewRun = createIdleRunState();
  const modifier = getModifierById(state.preDay.forecastModifierId);
  previewRun.durationMs = 45000 + Math.min(state.daysCompleted, 6) * 1500;
  previewRun.basePrice = 8 + Math.floor(state.daysCompleted / 2);
  previewRun.visitorRate = 0.75 + state.reputation * 0.035 + state.daysCompleted * 0.015;
  previewRun.priceMultiplier = modifier.priceMultiplier;
  previewRun.visitorMultiplier = modifier.visitorMultiplier;
  previewRun.salesMultiplier = modifier.effectMultiplier;
  previewRun.reputationMultiplier = modifier.reputationMultiplier;
  previewRun.effectMultiplier = modifier.effectMultiplier;
  applyPreDaySelections(previewRun);
  initializeDayTarget(previewRun);
  return Math.round(previewRun.dayTarget * previewRun.targetMultiplier);
}

function getCafeGradeLabel() {
  const count = getAchievementCount();
  if (count >= 16) {
    return 'みんなの憧れカフェ';
  }
  if (count >= 10) {
    return '街で評判のカフェ';
  }
  if (count >= 6) {
    return 'やさしい人気店';
  }
  if (count >= 3) {
    return 'がんばり中のカフェ';
  }
  return 'ふつうの喫茶店';
}

function getAchievementCount() {
  return state.achievementsUnlocked.length;
}

function chooseRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function shuffle(list) {
  const next = [...list];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

function formatNumber(value, digits = 1) {
  return Number(value).toLocaleString('ja-JP', {
    maximumFractionDigits: digits,
    minimumFractionDigits: value >= 100 ? 0 : Math.min(digits, 1),
  });
}

function roundValue(value) {
  return Math.round(value * 10) / 10;
}

function formatSeconds(ms) {
  const seconds = Math.ceil(ms / 1000);
  return `${seconds}秒`;
}

function showToast(title, body) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<strong>${title}</strong><div>${body}</div>`;
  elements.toastStack.appendChild(toast);
  window.setTimeout(() => {
    toast.remove();
  }, 3200);
}

function getNodeName(nodeId) {
  const node = TREE_NODES.find((entry) => entry.id === nodeId);
  return node ? node.name : nodeId;
}

function getResearchName(researchId) {
  const research = RESEARCH_NODES.find((entry) => entry.id === researchId);
  return research ? research.name : researchId;
}
