const STORAGE_KEY = 'cuteCafeIdleSaveV1';
const APP_VERSION = '1.4.0';

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
    threshold: 8,
    label: '特別営業',
    description: '営業前に特別営業を選べるようになります。',
  },
  {
    threshold: 10,
    label: 'ごほうびポイント',
    description: '営業目標達成時の解放ポイントがさらに +1 されます。',
  },
  {
    threshold: 14,
    label: '季節のフェア',
    description: '特別営業に「季節のフェア」が追加されます。',
  },
];

const TARGET_BALANCE = {
  baseValue: 18,
  dayGrowth: 2.4,
  projectedSalesWeight: 0.58,
  reputationWeight: 2.6,
  stretchBase: 0.82,
  stretchPerDay: 0.018,
  earlyGraceBase: 0.72,
  earlyGracePerDay: 0.05,
  earlyGraceCapDay: 6,
  minimumTarget: 28,
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
  {
    id: 'honeyToast',
    name: 'はちみつトースト',
    description: 'やさしい香りで客単価が伸び、目標も少しまとまりやすくなります。',
    unlockKey: 'artisanMenuUnlocked',
    apply(run) {
      run.priceMultiplier *= 1.14;
      run.targetMultiplier *= 0.96;
      run.notes.push('おすすめメニュー: はちみつトースト');
    },
  },
  {
    id: 'mintJelly',
    name: 'ミントゼリーフロート',
    description: '爽やかさが広がり、来客と評判の伸びが少し上がります。',
    unlockKey: 'artisanMenuUnlocked',
    apply(run) {
      run.visitorMultiplier *= 1.12;
      run.reputationGainMultiplier *= 1.12;
      run.notes.push('おすすめメニュー: ミントゼリーフロート');
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
  {
    id: 'flowerGreeting',
    name: '花かごのごあいさつ',
    description: 'やわらかな迎え方で、目標達成時の評判がさらに上がります。',
    unlockKey: 'hospitalityPrepUnlocked',
    apply(run) {
      run.reputationOnTargetBonus += 2;
      run.notes.push('仕込み: 花かごのごあいさつ');
    },
  },
  {
    id: 'letterReply',
    name: 'おたより返し',
    description: 'やり取りを整えて、目標達成時の解放ポイントを追加で1獲得します。',
    unlockKey: 'hospitalityPrepUnlocked',
    apply(run) {
      run.unlockOnTargetBonus += 1;
      run.notes.push('仕込み: おたより返し');
    },
  },
];

const STYLE_OPTIONS = [
  {
    id: 'quickCounter',
    name: 'さくっと回転',
    description: '短めの営業で客足を回し、テンポ良く売ります。',
    apply(run) {
      run.durationMs = Math.max(32000, run.durationMs - 8000);
      run.visitorMultiplier *= 1.22;
      run.targetMultiplier *= 0.97;
      run.notes.push('営業スタイル: さくっと回転');
    },
  },
  {
    id: 'cozySalon',
    name: 'ゆったり滞在',
    description: '長居したくなる空気で客単価と評判を伸ばします。',
    apply(run) {
      run.durationMs += 9000;
      run.priceMultiplier *= 1.12;
      run.reputationGainMultiplier *= 1.18;
      run.targetMultiplier *= 1.06;
      run.notes.push('営業スタイル: ゆったり滞在');
    },
  },
  {
    id: 'sweetShowcase',
    name: 'ショーケース推し',
    description: '映える見せ方で看板メニューを主役にします。',
    apply(run) {
      run.priceMultiplier *= 1.08;
      run.salesMultiplier *= 1.08;
      run.perkOfferTimeMultiplier *= 0.92;
      run.notes.push('営業スタイル: ショーケース推し');
    },
  },
  {
    id: 'storyShelf',
    name: 'よみもの時間',
    description: '落ち着いた空気でゆっくり過ごしてもらい、評判と売上をじんわり伸ばします。',
    unlockKey: 'storybookStyleUnlocked',
    apply(run) {
      run.durationMs += 7000;
      run.salesMultiplier *= 1.07;
      run.reputationGainMultiplier *= 1.2;
      run.targetMultiplier *= 1.04;
      run.notes.push('営業スタイル: よみもの時間');
    },
  },
  {
    id: 'terraceBreeze',
    name: 'テラスの風',
    description: '外の空気を取り入れて、客足とイベントの流れを少し軽くします。',
    unlockKey: 'terraceStyleUnlocked',
    apply(run) {
      run.visitorMultiplier *= 1.15;
      run.perkOfferTimeMultiplier *= 0.9;
      run.targetMultiplier *= 0.99;
      run.notes.push('営業スタイル: テラスの風');
    },
  },
];

const SPECIAL_SERVICE_OPTIONS = [
  {
    id: 'takeoutRush',
    name: 'テイクアウトデー',
    description: '回転重視の特別営業。短時間で客足を集めます。',
    unlockKey: 'specialServiceUnlocked',
    apply(run) {
      run.durationMs = Math.max(32000, run.durationMs - 10000);
      run.visitorMultiplier *= 1.35;
      run.targetMultiplier *= 0.94;
      run.reputationOnTargetBonus += 1;
      run.notes.push('特別営業: テイクアウトデー');
    },
  },
  {
    id: 'nightCafe',
    name: '夜カフェ営業',
    description: '少し長めに開けて、落ち着いた高単価営業に寄せます。',
    unlockKey: 'specialServiceUnlocked',
    apply(run) {
      run.durationMs += 12000;
      run.priceMultiplier *= 1.18;
      run.targetMultiplier *= 1.08;
      run.insightOnTargetBonus += 1;
      run.notes.push('特別営業: 夜カフェ営業');
    },
  },
  {
    id: 'seasonalFair',
    name: '季節のフェア',
    description: '実績を積むと解放。今日だけ街の注目を集めます。',
    unlockKey: 'festivalServiceUnlocked',
    apply(run) {
      run.visitorMultiplier *= 1.18;
      run.salesMultiplier *= 1.12;
      run.reputationGainMultiplier *= 1.1;
      run.targetMultiplier *= 1.05;
      run.unlockOnTargetBonus += 1;
      run.notes.push('特別営業: 季節のフェア');
    },
  },
  {
    id: 'morningMarket',
    name: '朝市スタンド',
    description: '朝のにぎわいを取り込み、短時間で来客を集めます。',
    unlockKey: 'weekendServiceUnlocked',
    apply(run) {
      run.durationMs = Math.max(32000, run.durationMs - 8000);
      run.visitorMultiplier *= 1.28;
      run.unlockOnTargetBonus += 1;
      run.notes.push('特別営業: 朝市スタンド');
    },
  },
  {
    id: 'dessertCourse',
    name: 'ごほうびデザート会',
    description: '甘い時間に寄せた営業で、単価とひらめきの伸びが良くなります。',
    unlockKey: 'weekendServiceUnlocked',
    apply(run) {
      run.durationMs += 8000;
      run.priceMultiplier *= 1.16;
      run.insightOnTargetBonus += 1;
      run.notes.push('特別営業: ごほうびデザート会');
    },
  },
];

const COMBO_DEFS = [
  {
    id: 'strawberryShowcase',
    name: 'いちご映えセット',
    description: 'いちごラテとショーケース推しで写真映えが広がります。',
    hint: '営業スタイルとおすすめメニューの相性を試してみる',
    unlock(state) {
      return state.systems.comboRecipeUnlocked;
    },
    matches(preDay) {
      return (
        preDay.selectedMenuId === 'strawberryLatte' && preDay.selectedStyleId === 'sweetShowcase'
      );
    },
    apply(run) {
      run.priceMultiplier *= 1.08;
      run.reputationGainMultiplier *= 1.16;
      run.notes.push('本日のコンボ: いちご映えセット');
    },
  },
  {
    id: 'cookieRegulars',
    name: 'おかえりプレート',
    description: 'クッキー盛りと常連メモでいつものお客さんが増えます。',
    hint: '仕込みとおすすめメニューを組み合わせる',
    unlock(state) {
      return state.systems.comboRecipeUnlocked;
    },
    matches(preDay) {
      return preDay.selectedMenuId === 'cookiePlate' && preDay.selectedPrepId === 'regularNotes';
    },
    apply(run) {
      run.visitorMultiplier *= 1.12;
      run.targetMultiplier *= 0.95;
      run.notes.push('本日のコンボ: おかえりプレート');
    },
  },
  {
    id: 'puddingCheck',
    name: 'ごほうび追い風',
    description: 'プリンと最終チェックがかみ合い、ブースト回りが軽くなります。',
    hint: '実績を重ねると甘いごほうび系の組み合わせが見えてきます',
    unlock(state) {
      return state.systems.comboRecipeUnlocked && getAchievementCount() >= 6;
    },
    matches(preDay) {
      return preDay.selectedMenuId === 'rewardPudding' && preDay.selectedPrepId === 'boostCheck';
    },
    apply(run) {
      run.extraBoostDuration += 3;
      run.firstBoostCooldownCutMs += 5000;
      run.notes.push('本日のコンボ: ごほうび追い風');
    },
  },
  {
    id: 'takeoutCookie',
    name: '寄り道おやつ便',
    description: 'テイクアウトデーにクッキー盛りを合わせて客足をさらに集めます。',
    hint: '特別営業とおすすめメニューを合わせる',
    unlock(state) {
      return state.systems.comboRecipeUnlocked && state.systems.specialServiceUnlocked;
    },
    matches(preDay) {
      return preDay.selectedServiceId === 'takeoutRush' && preDay.selectedMenuId === 'cookiePlate';
    },
    apply(run) {
      run.visitorMultiplier *= 1.16;
      run.salesMultiplier *= 1.05;
      run.notes.push('本日のコンボ: 寄り道おやつ便');
    },
  },
  {
    id: 'nightLatte',
    name: '夜ふかしラテ時間',
    description: '夜カフェ営業といちごラテでゆったりした高単価営業になります。',
    hint: 'いくつかコンボを見つけると、夜向けの組み合わせが解放されます',
    unlock(state) {
      return state.systems.comboRecipeUnlocked && state.discoveredCombos.length >= 2;
    },
    matches(preDay) {
      return (
        preDay.selectedServiceId === 'nightCafe' && preDay.selectedMenuId === 'strawberryLatte'
      );
    },
    apply(run) {
      run.priceMultiplier *= 1.1;
      run.reputationGainMultiplier *= 1.12;
      run.notes.push('本日のコンボ: 夜ふかしラテ時間');
    },
  },
  {
    id: 'honeyStory',
    name: 'しおり付きトースト時間',
    description: 'はちみつトーストとよみもの時間で、静かなごほうび感が広がります。',
    hint: '新しいメニューと新しい営業スタイルを組み合わせる',
    unlock(state) {
      return state.systems.secretComboUnlocked && state.systems.storybookStyleUnlocked;
    },
    matches(preDay) {
      return preDay.selectedMenuId === 'honeyToast' && preDay.selectedStyleId === 'storyShelf';
    },
    apply(run) {
      run.priceMultiplier *= 1.08;
      run.reputationGainMultiplier *= 1.14;
      run.notes.push('本日のコンボ: しおり付きトースト時間');
    },
  },
  {
    id: 'mintMarket',
    name: '朝いちばんのひんやり便り',
    description: '朝市スタンドとミントゼリーで、軽やかな回転営業になります。',
    hint: '新しい特別営業と爽やかなメニューを合わせる',
    unlock(state) {
      return state.systems.secretComboUnlocked && state.systems.weekendServiceUnlocked;
    },
    matches(preDay) {
      return preDay.selectedServiceId === 'morningMarket' && preDay.selectedMenuId === 'mintJelly';
    },
    apply(run) {
      run.visitorMultiplier *= 1.14;
      run.targetMultiplier *= 0.94;
      run.notes.push('本日のコンボ: 朝いちばんのひんやり便り');
    },
  },
  {
    id: 'letterDessert',
    name: 'おたより付きデザート会',
    description: 'おたより返しとごほうびデザート会で、やさしい余韻が残ります。',
    hint: '新しい仕込みと甘い特別営業を合わせる',
    unlock(state) {
      return state.systems.secretComboUnlocked && state.systems.hospitalityPrepUnlocked;
    },
    matches(preDay) {
      return (
        preDay.selectedPrepId === 'letterReply' && preDay.selectedServiceId === 'dessertCourse'
      );
    },
    apply(run) {
      run.unlockOnTargetBonus += 1;
      run.insightOnTargetBonus += 1;
      run.notes.push('本日のコンボ: おたより付きデザート会');
    },
  },
];

const DAY_EVENT_DEFS = [
  {
    id: 'photoRequest',
    title: '写真を撮ってもいいですか？',
    description: '映える席でお客さんが撮影の相談をしてきました。',
    choices: [
      {
        label: '撮影しやすく整える',
        detail: '評判が伸びやすくなります。',
        apply(run) {
          run.reputationGainMultiplier *= 1.18;
          run.notes.push('営業中イベント: 撮影しやすく整える');
        },
      },
      {
        label: 'いつもの流れを優先',
        detail: '売上ペースを少し安定させます。',
        apply(run) {
          run.salesMultiplier *= 1.08;
          run.notes.push('営業中イベント: いつもの流れを優先');
        },
      },
    ],
  },
  {
    id: 'extraBatch',
    title: '焼きたてをもう一回出す？',
    description: '人気の焼き菓子が早めに減ってきました。',
    choices: [
      {
        label: '追加で焼く',
        detail: '来客が少し増えます。',
        apply(run) {
          run.visitorMultiplier *= 1.12;
          run.notes.push('営業中イベント: 追加で焼く');
        },
      },
      {
        label: '丁寧に盛りつける',
        detail: '客単価を少し上げます。',
        apply(run) {
          run.priceMultiplier *= 1.1;
          run.notes.push('営業中イベント: 丁寧に盛りつける');
        },
      },
    ],
  },
  {
    id: 'regularRequest',
    title: '常連さんからのひとこと',
    description: 'いつものお客さんが今日は少し違う気分みたいです。',
    choices: [
      {
        label: '会話を楽しむ',
        detail: '目標達成時の評判が増えます。',
        apply(run) {
          run.reputationOnTargetBonus += 1;
          run.notes.push('営業中イベント: 会話を楽しむ');
        },
      },
      {
        label: 'おすすめを勧める',
        detail: '今日の売上に少し補正がかかります。',
        apply(run) {
          run.salesMultiplier *= 1.07;
          run.notes.push('営業中イベント: おすすめを勧める');
        },
      },
    ],
  },
  {
    id: 'giftWrap',
    title: '小さなおみやげを付ける？',
    description: '帰り際のお客さんが、ちょっとした包みを喜びそうです。',
    unlockKey: 'eventAlbumUnlocked',
    choices: [
      {
        label: '包みを用意する',
        detail: '売上補正が少し上がります。',
        apply(run) {
          run.salesMultiplier *= 1.08;
          run.notes.push('営業中イベント: 包みを用意する');
        },
      },
      {
        label: '手書きメモを添える',
        detail: '評判が少し伸びやすくなります。',
        apply(run) {
          run.reputationGainMultiplier *= 1.12;
          run.notes.push('営業中イベント: 手書きメモを添える');
        },
      },
    ],
  },
  {
    id: 'windowSeat',
    title: '窓辺席を整える？',
    description: '外を眺めたいお客さんが増えてきました。',
    unlockKey: 'eventAlbumUnlocked',
    choices: [
      {
        label: '窓辺を主役にする',
        detail: '来客が少し増えます。',
        apply(run) {
          run.visitorMultiplier *= 1.1;
          run.notes.push('営業中イベント: 窓辺を主役にする');
        },
      },
      {
        label: '席数をそのまま保つ',
        detail: '客単価が少し上がります。',
        apply(run) {
          run.priceMultiplier *= 1.08;
          run.notes.push('営業中イベント: 席数をそのまま保つ');
        },
      },
    ],
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
  {
    id: 'serviceStyle',
    name: '営業スタイルノート',
    cost: 4,
    description: '営業前にその日の売り方をひとつ選べるようになります。',
    effectText: '営業スタイルを選択可能',
    requires: ['prepStation'],
    apply(state) {
      state.systems.styleChoiceUnlocked = true;
    },
  },
  {
    id: 'comboRecipe',
    name: '組み合わせメモ',
    cost: 5,
    description: 'おすすめや仕込み、営業スタイルの相性で特別なコンボが発生します。',
    effectText: '本日のコンボが発生',
    requires: ['serviceStyle'],
    apply(state) {
      state.systems.comboRecipeUnlocked = true;
      state.systems.codexUnlocked = true;
    },
  },
  {
    id: 'serviceMoments',
    name: '接客メモ',
    cost: 5,
    description: '営業中に小さなできごとが起こり、その日の流れを選べるようになります。',
    effectText: '営業中イベントが発生',
    requires: ['serviceStyle'],
    apply(state) {
      state.systems.dayEventUnlocked = true;
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
const uiFeedback = {
  lastMoney: 0,
  lastSalePulseAt: 0,
  lastCelebratedSales: 0,
  targetReachedInRun: false,
};

init();

function init() {
  ensureDynamicUi();
  cacheDynamicElements();
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

function ensureDynamicUi() {
  if (!elements.tabs.querySelector('[data-tab="codex"]')) {
    const codexButton = document.createElement('button');
    codexButton.className = 'tab-button';
    codexButton.dataset.tab = 'codex';
    codexButton.textContent = '図鑑';
    const researchButton = elements.tabs.querySelector('[data-tab="research"]');
    elements.tabs.insertBefore(codexButton, researchButton);
  }

  const operationsPanel = document.querySelector('[data-panel="operations"] .panel.primary');
  if (operationsPanel && !document.getElementById('operation-layer-tabs')) {
    const layerTabs = document.createElement('div');
    layerTabs.className = 'operation-layers';
    layerTabs.id = 'operation-layer-tabs';
    layerTabs.innerHTML = `
      <button class="layer-chip active" data-op-layer="pre">営業前</button>
      <button class="layer-chip" data-op-layer="live">営業中</button>
      <button class="layer-chip" data-op-layer="result">結果</button>
    `;
    const panelHead = operationsPanel.querySelector('.panel-head');
    panelHead?.insertAdjacentElement('afterend', layerTabs);
  }

  document.querySelector('.progress-block')?.setAttribute('id', 'progress-block');
  document.querySelector('.ops-stats')?.setAttribute('id', 'ops-stats-block');
  document.querySelector('.prep-card')?.setAttribute('id', 'prep-card');
  document.querySelector('.info-list')?.setAttribute('id', 'info-list-block');

  const notesCards = document.querySelectorAll(
    '[data-panel="operations"] .panel.secondary .notes-card',
  );
  notesCards[0]?.setAttribute('id', 'run-notes-card');
  notesCards[1]?.setAttribute('id', 'result-card');

  const infoList = document.getElementById('info-list-block');
  if (infoList && !document.getElementById('day-event-card')) {
    const eventCard = document.createElement('div');
    eventCard.className = 'notes-card';
    eventCard.id = 'day-event-card';
    eventCard.innerHTML = `
      <h3>営業中のできごと</h3>
      <div id="day-event-box" class="result-box">
        研究で小さな営業イベントが解放されると、営業中にここへ表示されます。
      </div>
    `;
    infoList.insertAdjacentElement('afterend', eventCard);
  }

  if (!document.querySelector('[data-panel="codex"]')) {
    const panel = document.createElement('section');
    panel.className = 'tab-panel';
    panel.dataset.panel = 'codex';
    panel.innerHTML = `
      <section class="panel">
        <div class="panel-head">
          <div>
            <p class="panel-kicker">発見メモ</p>
            <h2>コンボ図鑑</h2>
          </div>
          <div class="status-pill" id="codex-summary">0 / 0発見</div>
        </div>
        <p class="tree-note">
          組み合わせを見つけると図鑑に記録されます。条件が足りないコンボは、うっすらとだけ見えます。
        </p>
        <div class="codex-grid" id="codex-grid"></div>
      </section>
    `;
    const researchPanel = document.querySelector('[data-panel="research"]');
    researchPanel?.parentElement?.insertBefore(panel, researchPanel);
  }

  if (!document.getElementById('event-overlay')) {
    const eventOverlay = document.createElement('div');
    eventOverlay.className = 'overlay hidden';
    eventOverlay.id = 'event-overlay';
    eventOverlay.setAttribute('aria-hidden', 'true');
    eventOverlay.innerHTML = `
      <div class="overlay-card">
        <p class="panel-kicker">営業中イベント</p>
        <h2 id="event-title">小さなできごと</h2>
        <p class="overlay-copy" id="event-description">
          営業中のちょっとした判断で、その日の流れが少し変わります。
        </p>
        <div class="perk-options" id="event-options"></div>
      </div>
    `;
    elements.toastStack.insertAdjacentElement('beforebegin', eventOverlay);
  }
}

function cacheDynamicElements() {
  elements.operationLayerTabs = document.getElementById('operation-layer-tabs');
  elements.progressBlock = document.getElementById('progress-block');
  elements.opsStatsBlock = document.getElementById('ops-stats-block');
  elements.prepCard = document.getElementById('prep-card');
  elements.infoListBlock = document.getElementById('info-list-block');
  elements.dayEventCard = document.getElementById('day-event-card');
  elements.dayEventBox = document.getElementById('day-event-box');
  elements.runNotesCard = document.getElementById('run-notes-card');
  elements.resultCard = document.getElementById('result-card');
  elements.codexGrid = document.getElementById('codex-grid');
  elements.codexSummary = document.getElementById('codex-summary');
  elements.eventOverlay = document.getElementById('event-overlay');
  elements.eventTitle = document.getElementById('event-title');
  elements.eventDescription = document.getElementById('event-description');
  elements.eventOptions = document.getElementById('event-options');
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
    discoveredCombos: [],
    systems: {
      achievementsTabUnlocked: false,
      codexUnlocked: false,
      secondBoostUnlocked: false,
      extraPerkChoice: false,
      prepBoostUnlocked: false,
      secondPrepBoostUnlocked: false,
      menuChoiceUnlocked: false,
      modifierRerollUnlocked: false,
      prepChoiceUnlocked: false,
      styleChoiceUnlocked: false,
      comboRecipeUnlocked: false,
      specialServiceUnlocked: false,
      festivalServiceUnlocked: false,
      dayEventUnlocked: false,
      artisanMenuUnlocked: false,
      hospitalityPrepUnlocked: false,
      storybookStyleUnlocked: false,
      terraceStyleUnlocked: false,
      weekendServiceUnlocked: false,
      secretComboUnlocked: false,
      eventAlbumUnlocked: false,
      thirdPrepBoostUnlocked: false,
    },
    preDay: {
      selectedBoostIds: [],
      selectedMenuId: null,
      selectedPrepId: null,
      selectedStyleId: null,
      selectedServiceId: null,
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
    operationView: 'pre',
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
    unlockOnTargetBonus: 0,
    firstBoostCooldownCutMs: 0,
    firstBoostDiscountUsed: false,
    styleId: null,
    serviceId: null,
    comboId: null,
    eventId: null,
    eventOffered: false,
    eventResolved: false,
    overlayMode: null,
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
  state.discoveredCombos = Array.isArray(state.discoveredCombos) ? state.discoveredCombos : [];
  if (
    !['operations', 'achievements', 'codex', 'tree', 'research', 'settings'].includes(
      state.currentTab,
    )
  ) {
    state.currentTab = 'operations';
  }
  if (!['pre', 'live', 'result'].includes(state.operationView)) {
    state.operationView = 'pre';
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
  applyAchievementSystemUnlocks();
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
  if (!state.systems.styleChoiceUnlocked) {
    state.preDay.selectedStyleId = null;
  }
  if (!state.systems.specialServiceUnlocked) {
    state.preDay.selectedServiceId = null;
  }
  const slotCount = getPreDayBoostSlotCount();
  state.preDay.selectedBoostIds = state.preDay.selectedBoostIds
    .filter(
      (id, index, list) =>
        PRE_DAY_BOOSTS.some((entry) => entry.id === id) && list.indexOf(id) === index,
    )
    .slice(0, slotCount);
  if (
    state.preDay.selectedMenuId &&
    !getAvailableMenuOptions().some((entry) => entry.id === state.preDay.selectedMenuId)
  ) {
    state.preDay.selectedMenuId = null;
  }
  if (
    state.preDay.selectedPrepId &&
    !getAvailablePrepOptions().some((entry) => entry.id === state.preDay.selectedPrepId)
  ) {
    state.preDay.selectedPrepId = null;
  }
  if (
    state.preDay.selectedStyleId &&
    !getAvailableStyleOptions().some((entry) => entry.id === state.preDay.selectedStyleId)
  ) {
    state.preDay.selectedStyleId = null;
  }
  const availableServices = getAvailableSpecialServices();
  if (
    state.preDay.selectedServiceId &&
    !availableServices.some((entry) => entry.id === state.preDay.selectedServiceId)
  ) {
    state.preDay.selectedServiceId = null;
  }
}

function getPreDayBoostSlotCount() {
  if (!state.systems.prepBoostUnlocked) {
    return 0;
  }
  if (state.systems.thirdPrepBoostUnlocked) {
    return 3;
  }
  return state.systems.secondPrepBoostUnlocked ? 2 : 1;
}

function isFeatureEntryUnlocked(entry) {
  return !entry.unlockKey || Boolean(state.systems[entry.unlockKey]);
}

function getAvailableMenuOptions() {
  return MENU_OPTIONS.filter((entry) => isFeatureEntryUnlocked(entry));
}

function getAvailablePrepOptions() {
  return PREP_OPTIONS.filter((entry) => isFeatureEntryUnlocked(entry));
}

function getAvailableStyleOptions() {
  return STYLE_OPTIONS.filter((entry) => isFeatureEntryUnlocked(entry));
}

function applyAchievementSystemUnlocks(showToasts = false, previousCount = 0) {
  const count = getAchievementCount();
  const unlockDefs = [
    {
      threshold: 8,
      key: 'specialServiceUnlocked',
      title: '特別営業が増えました',
      body: '営業前の準備に特別営業が追加されました。',
    },
    {
      threshold: 14,
      key: 'festivalServiceUnlocked',
      title: '季節のフェアが増えました',
      body: '特別営業に「季節のフェア」が追加されました。',
    },
  ];
  for (const unlock of unlockDefs) {
    const unlocked = count >= unlock.threshold;
    state.systems[unlock.key] = unlocked;
    if (showToasts && unlocked && previousCount < unlock.threshold) {
      showToast(unlock.title, unlock.body);
    }
  }
}

function getAvailableSpecialServices() {
  return SPECIAL_SERVICE_OPTIONS.filter((entry) => isFeatureEntryUnlocked(entry));
}

function getStyleById(styleId) {
  return getAvailableStyleOptions().find((entry) => entry.id === styleId) || null;
}

function getSpecialServiceById(serviceId) {
  return SPECIAL_SERVICE_OPTIONS.find((entry) => entry.id === serviceId) || null;
}

function getActiveComboDefinition(preDay = state.preDay) {
  return COMBO_DEFS.find((entry) => isComboUnlocked(entry) && entry.matches(preDay)) || null;
}

function isComboUnlocked(combo) {
  return combo.unlock ? combo.unlock(state) : state.systems.comboRecipeUnlocked;
}

function discoverCombo(comboId) {
  if (state.discoveredCombos.includes(comboId)) {
    return;
  }
  const combo = COMBO_DEFS.find((entry) => entry.id === comboId);
  if (!combo) {
    return;
  }
  state.discoveredCombos.push(comboId);
  showToast('新しいコンボを発見', `${combo.name} が図鑑に記録されました。`);
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

  elements.operationLayerTabs?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-op-layer]');
    if (!button || button.disabled) {
      return;
    }
    if (button.dataset.opLayer === 'result' && !state.lastResult) {
      showToast('まだ結果はありません', '1日営業を終えると結果を見返せます。');
      return;
    }
    state.operationView = button.dataset.opLayer;
    renderOperations(false);
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
  closePerkOverlay();
  closeEventOverlay();
  state.operationView = 'live';
  renderAll();
  showToast('今日もオープン', getOpeningMessage(), 'day-start');
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
  run.targetEarlyGraceMultiplier = Math.min(
    1,
    TARGET_BALANCE.earlyGraceBase +
      Math.min(state.daysCompleted, TARGET_BALANCE.earlyGraceCapDay) *
        TARGET_BALANCE.earlyGracePerDay,
  );
  run.dayTarget = Math.max(
    TARGET_BALANCE.minimumTarget,
    Math.round(
      (run.targetBaseValue + run.targetGrowthValue + run.targetDemandValue) *
        run.targetStretchMultiplier *
        run.targetEarlyGraceMultiplier,
    ),
  );
}

function applyPreDaySelections(run, options = {}) {
  const { discover = true } = options;
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
  if (state.preDay.selectedStyleId) {
    const style = getStyleById(state.preDay.selectedStyleId);
    if (style) {
      run.styleId = style.id;
      style.apply(run);
    }
  }
  if (state.preDay.selectedServiceId) {
    const service = getSpecialServiceById(state.preDay.selectedServiceId);
    if (service && state.systems[service.unlockKey]) {
      run.serviceId = service.id;
      service.apply(run);
    }
  }
  const combo = getActiveComboDefinition();
  if (combo) {
    run.comboId = combo.id;
    combo.apply(run);
    if (discover) {
      discoverCombo(combo.id);
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

  if (run.elapsedMs >= run.durationMs) {
    finishDay();
    return;
  }

  const remainingMs = Math.max(0, run.durationMs - run.elapsedMs);
  const perkMinRemainingMs = Math.min(12000, run.durationMs * 0.24);
  const eventMinRemainingMs = Math.min(9000, run.durationMs * 0.18);

  const perkUnlockTime = run.durationMs * 0.38 * run.perkOfferTimeMultiplier;
  if (!run.perkOffered && run.elapsedMs >= perkUnlockTime && remainingMs > perkMinRemainingMs) {
    offerPerkChoices();
  }

  const eventUnlockTime = run.durationMs * 0.62;
  if (
    state.systems.dayEventUnlocked &&
    !run.eventOffered &&
    !run.selectionPaused &&
    run.elapsedMs >= eventUnlockTime &&
    remainingMs > eventMinRemainingMs
  ) {
    offerDayEvent();
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
    unlockGain += 2 + run.unlockOnTargetBonus;
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
    styleName: getStyleById(run.styleId)?.name || null,
    serviceName: getSpecialServiceById(run.serviceId)?.name || null,
    comboName: COMBO_DEFS.find((entry) => entry.id === run.comboId)?.name || null,
    targetValue,
    achievements: newAchievements.map((entry) => entry.name),
  };

  if (achievedTarget) {
    showToast(
      '売上目標達成',
      `今日は ${formatNumber(roundedDayMoney)} 売り上げました。ごほうびがふわっと届きます。`,
      'target',
    );
  } else {
    showToast(
      '営業終了',
      `今日は ${formatNumber(roundedDayMoney)} の売上でした。次の工夫でまた伸ばせます。`,
      'day-end',
    );
  }

  state.dayRun = createIdleRunState();
  uiFeedback.lastCelebratedSales = 0;
  uiFeedback.targetReachedInRun = false;
  state.preDay.modifierRerollUsed = false;
  state.preDay.forecastModifierId = chooseRandom(DAILY_MODIFIERS).id;
  state.operationView = 'result';
  initializeBoostStates(state.dayRun);
  ensurePreDaySelections();
  renderAll();
  saveState(state);
}

function evaluateAchievements() {
  const newlyUnlocked = [];
  const previousCount = getAchievementCount();
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
  applyAchievementSystemUnlocks(true, previousCount);
  return newlyUnlocked;
}

function offerPerkChoices() {
  const run = state.dayRun;
  run.perkOffered = true;
  run.selectionPaused = true;
  run.overlayMode = 'perk';
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
  state.dayRun.overlayMode = null;
  state.dayRun.selectionPaused = false;
  elements.perkOverlay.classList.add('hidden');
  elements.perkOverlay.setAttribute('aria-hidden', 'true');
}

function offerDayEvent() {
  const run = state.dayRun;
  run.eventOffered = true;
  run.selectionPaused = true;
  run.overlayMode = 'event';
  const availableEvents = DAY_EVENT_DEFS.filter((entry) => isFeatureEntryUnlocked(entry));
  const eventDef = chooseRandom(availableEvents);
  run.eventId = eventDef.id;
  elements.eventTitle.textContent = eventDef.title;
  elements.eventDescription.textContent = eventDef.description;
  elements.eventOptions.innerHTML = '';
  for (const choice of eventDef.choices) {
    const button = document.createElement('button');
    button.className = 'perk-button';
    button.innerHTML = `<strong>${choice.label}</strong><div>${choice.detail}</div>`;
    button.addEventListener('click', () => {
      choice.apply(run);
      run.eventResolved = true;
      renderDayEventStatus();
      closeEventOverlay();
      renderAll();
      saveState(state);
    });
    elements.eventOptions.appendChild(button);
  }
  renderDayEventStatus(eventDef);
  elements.eventOverlay.classList.remove('hidden');
  elements.eventOverlay.setAttribute('aria-hidden', 'false');
}

function closeEventOverlay() {
  if (!elements.eventOverlay) {
    return;
  }
  state.dayRun.overlayMode = null;
  if (state.dayRun.active) {
    state.dayRun.selectionPaused = false;
  }
  elements.eventOverlay.classList.add('hidden');
  elements.eventOverlay.setAttribute('aria-hidden', 'true');
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
  renderCodex();
  renderResearch();
  renderTree();
  renderSettings();
}

function renderTabs() {
  elements.achievementsTabButton.classList.toggle('hidden', !state.systems.achievementsTabUnlocked);
  const codexButton = elements.tabs.querySelector('[data-tab="codex"]');
  codexButton?.classList.toggle('hidden', !state.systems.codexUnlocked);
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
  if (state.currentTab === 'codex' && !state.systems.codexUnlocked) {
    state.currentTab = 'operations';
    renderTabs();
  }
}

function renderResources() {
  elements.moneyValue.textContent = formatNumber(state.money);
  elements.lifetimeMoney.textContent = formatNumber(state.lifetimeMoney);
  elements.reputationValue.textContent = formatWholeNumber(state.reputation);
  elements.unlockPointsValue.textContent = formatWholeNumber(state.unlockPoints);
  elements.insightValue.textContent = formatWholeNumber(state.insight);
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
      ? run.overlayMode === 'event'
        ? 'イベント対応中'
        : '強化選択中'
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
  renderOperationLayerState();
  renderDayEventStatus();
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
  const flavorParts = [result.styleName, result.serviceName, result.comboName].filter(Boolean);
  const flavorText = flavorParts.length > 0 ? ` / ${flavorParts.join(' / ')}` : '';
  elements.lastResultBox.textContent =
    `${result.dayNumber}日目: 売上 ${formatNumber(result.sales)} / 目標 ${formatNumber(result.targetValue)}、来客 ${result.customers}人、評判 +${result.reputationGain}、解放ポイント +${result.unlockGain}、ひらめき +${result.insightGain}` +
    ` / ${result.modifierName}${flavorText}${result.achievedTarget ? ' / 売上目標達成' : ' / 売上目標は未達'}${achievementText}`;
}

function renderOperationLayerState() {
  const hasResult = Boolean(state.lastResult);
  const requestedView =
    !hasResult && state.operationView === 'result' ? 'pre' : state.operationView;
  const view = state.dayRun.active
    ? requestedView === 'result'
      ? 'live'
      : requestedView
    : requestedView;
  elements.operationLayerTabs?.querySelectorAll('[data-op-layer]').forEach((button) => {
    button.classList.toggle('active', button.dataset.opLayer === view);
    if (button.dataset.opLayer === 'result') {
      button.disabled = !hasResult;
    } else {
      button.disabled = false;
    }
  });

  const showPre = view === 'pre';
  const showLive = view === 'live';
  const showResult = view === 'result';

  elements.prepCard?.classList.toggle('hidden', !showPre);
  elements.boostGrid?.classList.toggle('hidden', !showLive);
  elements.progressBlock?.classList.toggle('hidden', showResult);
  elements.opsStatsBlock?.classList.toggle('hidden', showResult);
  elements.infoListBlock?.classList.toggle('hidden', showResult);
  elements.dayEventCard?.classList.toggle('hidden', !showLive);
  elements.runNotesCard?.classList.toggle('hidden', showResult);
  elements.resultCard?.classList.toggle('hidden', !showResult);
}

function renderDayEventStatus(eventDef = null) {
  if (!elements.dayEventBox) {
    return;
  }
  if (!state.systems.dayEventUnlocked) {
    elements.dayEventBox.textContent =
      '研究で営業中イベントが解放されると、営業中に小さな判断が増えます。';
    return;
  }
  if (!state.dayRun.active) {
    elements.dayEventBox.textContent = '営業中に1回だけ、小さなできごとが起こります。';
    return;
  }
  if (!state.dayRun.eventOffered) {
    elements.dayEventBox.textContent =
      '今日はまだ落ち着いています。営業が進むとできごとが起こるかもしれません。';
    return;
  }
  if (!state.dayRun.eventResolved) {
    const currentEvent =
      eventDef || DAY_EVENT_DEFS.find((entry) => entry.id === state.dayRun.eventId) || null;
    elements.dayEventBox.textContent = currentEvent
      ? `${currentEvent.title} の対応を選べます。`
      : '営業中のできごとが発生しています。';
    return;
  }
  elements.dayEventBox.textContent =
    '営業中のできごとは対応済みです。今日の流れに反映されています。';
}

function renderCodex() {
  if (!elements.codexGrid || !elements.codexSummary) {
    return;
  }
  elements.codexSummary.textContent = `${state.discoveredCombos.length} / ${COMBO_DEFS.length}発見`;
  elements.codexGrid.innerHTML = COMBO_DEFS.map((combo) => {
    const discovered = state.discoveredCombos.includes(combo.id);
    const unlocked = isComboUnlocked(combo);
    const cardClass = discovered ? 'discovered' : unlocked ? 'available' : 'locked';
    const title = discovered ? combo.name : unlocked ? '未発見コンボ' : '？？？';
    const body = discovered
      ? combo.description
      : unlocked
        ? combo.hint || 'まだ見つかっていません。'
        : combo.hint || '条件を満たすと見えてきます。';
    const status = discovered ? '発見済み' : unlocked ? '未発見' : '条件未達';
    return `
      <article class="codex-card ${cardClass}">
        <h3>${title}</h3>
        <p>${body}</p>
        <div class="reward">${status}</div>
      </article>
    `;
  }).join('');
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
      statusLabel.textContent = getBoostStatusLabel({
        activeLeft,
        cooldownLeft,
        canUseManually,
        runActive: state.dayRun.active,
      });
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

function renderChoiceSection({
  title,
  description,
  countLabel,
  rowId,
  cardClass = '',
  open = false,
}) {
  const articleClass = ['prep-option', cardClass].filter(Boolean).join(' ');
  return `
    <article class="${articleClass}">
      <h3>${title}</h3>
      <p>${description}</p>
      <details class="prep-section" ${open ? 'open' : ''}>
        <summary>${countLabel}</summary>
        <div class="chip-row" id="${rowId}"></div>
      </details>
    </article>
  `;
}

function renderPrepOptions() {
  ensurePreDaySelections();
  const isActive = state.dayRun.active;
  const cards = [];
  const activeCombo = getActiveComboDefinition();
  const availableMenus = getAvailableMenuOptions();
  const availableStyles = getAvailableStyleOptions();
  const availablePreps = getAvailablePrepOptions();
  const specialServices = getAvailableSpecialServices();
  const hasAnyUnlock =
    state.systems.prepBoostUnlocked ||
    state.systems.menuChoiceUnlocked ||
    state.systems.modifierRerollUnlocked ||
    state.systems.prepChoiceUnlocked ||
    state.systems.styleChoiceUnlocked ||
    state.systems.specialServiceUnlocked ||
    state.systems.comboRecipeUnlocked;

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

  if (state.systems.styleChoiceUnlocked) {
    cards.push(
      renderChoiceSection({
        title: '営業スタイル',
        description: 'その日の売り方をひとつ選んで、営業の流れを少し変えられます。',
        countLabel: `${availableStyles.length}種類から選ぶ`,
        rowId: 'style-chip-row',
        cardClass: 'feature-option',
        open: true,
      }),
    );
  }

  if (state.systems.menuChoiceUnlocked) {
    cards.push(
      renderChoiceSection({
        title: '本日のおすすめメニュー',
        description: '営業前に1つ選べます。',
        countLabel: `${availableMenus.length}種類から選ぶ`,
        rowId: 'menu-chip-row',
        open: true,
      }),
    );
  }

  if (state.systems.specialServiceUnlocked) {
    cards.push(
      renderChoiceSection({
        title: '特別営業',
        description: '実績で増える特別な営業です。今日はひとつだけ選べます。',
        countLabel: `${specialServices.length}種類から選ぶ`,
        rowId: 'service-chip-row',
        cardClass: 'special-option',
      }),
    );
  }

  if (state.systems.prepChoiceUnlocked) {
    cards.push(
      renderChoiceSection({
        title: '仕込み',
        description: '営業前に1つだけ準備を選べます。',
        countLabel: `${availablePreps.length}種類から選ぶ`,
        rowId: 'prep-chip-row',
      }),
    );
  }

  if (state.systems.comboRecipeUnlocked) {
    cards.push(`
      <article class="prep-option combo-option ${activeCombo ? 'combo-active' : 'combo-idle'}">
        <h3>本日のコンボ</h3>
        <p>${activeCombo ? activeCombo.name : 'まだ組み合わせは決まっていません。'}</p>
        <small>${activeCombo ? activeCombo.description : 'おすすめ・仕込み・営業スタイル・特別営業の組み合わせで特別な効果が発生します。'}</small>
      </article>
    `);
  }

  if (state.systems.prepBoostUnlocked) {
    cards.push(
      renderChoiceSection({
        title: '営業前ブースト',
        description: `${getPreDayBoostSlotCount()}つまで選べます。`,
        countLabel: `${PRE_DAY_BOOSTS.length}種類から選ぶ`,
        rowId: 'preboost-chip-row',
      }),
    );
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
  elements.prepStatus.textContent = !hasAnyUnlock
    ? '研究で準備が増えます'
    : isActive
      ? '営業中は変更不可'
      : '営業前に選べます';
  elements.prepStatus.dataset.state = !hasAnyUnlock ? 'locked' : isActive ? 'disabled' : 'ready';
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
    for (const menu of availableMenus) {
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

  const styleRow = document.getElementById('style-chip-row');
  if (styleRow) {
    for (const style of availableStyles) {
      const button = document.createElement('button');
      button.className = `select-chip ${state.preDay.selectedStyleId === style.id ? 'active' : ''}`;
      button.disabled = isActive;
      button.textContent = style.name;
      button.title = style.description;
      button.addEventListener('click', () => {
        state.preDay.selectedStyleId = state.preDay.selectedStyleId === style.id ? null : style.id;
        renderPrepOptions();
        saveState(state);
      });
      styleRow.appendChild(button);
    }
  }

  const serviceRow = document.getElementById('service-chip-row');
  if (serviceRow) {
    for (const service of specialServices) {
      const button = document.createElement('button');
      button.className = `select-chip special-chip ${
        state.preDay.selectedServiceId === service.id ? 'active' : ''
      }`;
      button.disabled = isActive;
      button.textContent = service.name;
      button.title = service.description;
      button.addEventListener('click', () => {
        state.preDay.selectedServiceId =
          state.preDay.selectedServiceId === service.id ? null : service.id;
        renderPrepOptions();
        saveState(state);
      });
      serviceRow.appendChild(button);
    }
  }

  const prepRow = document.getElementById('prep-chip-row');
  if (prepRow) {
    for (const prep of availablePreps) {
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
  elements.researchSummary.textContent = `ひらめき ${formatWholeNumber(state.insight)}`;
  elements.researchGrid.innerHTML = '';
  for (const research of RESEARCH_NODES) {
    const unlocked = hasResearch(research.id);
    const ready = research.requires.every((required) => hasResearch(required));
    const canBuy = ready && !unlocked && state.insight >= research.cost;
    const card = document.createElement('article');
    card.className = `research-card ${
      unlocked ? 'unlocked' : canBuy ? 'ready' : ready ? 'available' : 'locked'
    }`;
    const prereqText =
      research.requires.length === 0 ? 'なし' : research.requires.map(getResearchName).join(' / ');
    const researchStatus = unlocked
      ? '研究済み'
      : canBuy
        ? '研究可能'
        : ready
          ? `ひらめき不足 (${formatWholeNumber(state.insight)} / ${research.cost})`
          : `前提: ${prereqText}`;
    card.innerHTML = `
      <h3>${research.name}</h3>
      <p>${research.description}</p>
      <small>${research.effectText}</small>
      <div class="research-meta">
        <span>コスト ${research.cost}</span>
        <span>${researchStatus}</span>
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
    card.className = `tree-card ${purchased ? 'purchased' : canBuy ? 'ready' : ready ? 'available' : 'locked'}`;
    const prereqText =
      node.requires.length === 0 ? 'なし' : node.requires.map(getNodeName).join(' / ');
    const treeStatus = purchased
      ? '開放済み'
      : canBuy
        ? '購入可能'
        : ready
          ? `ポイント不足 (${formatWholeNumber(state.unlockPoints)} / ${node.cost})`
          : `前提: ${prereqText}`;
    card.innerHTML = `
      <div class="mini-label">${node.branch}</div>
      <h3>${node.name}</h3>
      <p>${node.description}</p>
      <div class="tree-meta">
        <span>コスト ${node.cost}</span>
        <span>${treeStatus}</span>
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
    closeEventOverlay();
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
  applyPreDaySelections(previewRun, { discover: false });
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

function formatWholeNumber(value) {
  return Math.round(Number(value)).toLocaleString('ja-JP');
}

function getBoostStatusLabel({ activeLeft, cooldownLeft, canUseManually, runActive }) {
  if (activeLeft > 0) {
    return `効果中 ${formatSeconds(activeLeft)}`;
  }
  if (cooldownLeft > 0) {
    return `再使用まで ${formatSeconds(cooldownLeft)}`;
  }
  if (!runActive) {
    return canUseManually ? '営業開始後に使用' : '開店時に自動発動';
  }
  return canUseManually ? '準備完了' : '自動発動待ち';
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

function triggerElementBurst(element, className = 'soft-pop') {
  if (!element) {
    return;
  }
  element.classList.remove(className);
  void element.offsetWidth;
  element.classList.add(className);
  window.setTimeout(() => {
    element.classList.remove(className);
  }, 650);
}

function maybePulseMainSales() {
  const now = Date.now();
  const moneyDelta = state.money - uiFeedback.lastMoney;
  if (moneyDelta >= 6 && now - uiFeedback.lastSalePulseAt > 1300) {
    triggerElementBurst(elements.moneyValue, 'number-pop');
    uiFeedback.lastSalePulseAt = now;
  }
  uiFeedback.lastMoney = state.money;
}

function maybeCelebrateRunMoments(targetValue) {
  const run = state.dayRun;
  if (!run.active) {
    uiFeedback.lastCelebratedSales = 0;
    uiFeedback.targetReachedInRun = false;
    return;
  }

  const now = Date.now();
  if (
    run.dayMoney >= uiFeedback.lastCelebratedSales + 18 &&
    now - uiFeedback.lastSalePulseAt > 1100
  ) {
    triggerElementBurst(elements.dayMoneyValue, 'number-pop');
    uiFeedback.lastCelebratedSales = run.dayMoney;
    uiFeedback.lastSalePulseAt = now;
  }

  if (!uiFeedback.targetReachedInRun && run.dayMoney >= targetValue) {
    uiFeedback.targetReachedInRun = true;
    triggerElementBurst(elements.dailyTargetLabel, 'target-pop');
    triggerElementBurst(elements.dayProgressFill, 'target-fill-pop');
    showToast('目標が見えてきました', '今日の売上目標に手が届きました。あと少しです。', 'target');
  }
}

function getOpeningMessage() {
  const modifier = getModifierById(state.preDay.forecastModifierId);
  const activeCombo = getActiveComboDefinition();
  if (activeCombo) {
    return `街のようすは「${modifier.name}」。今日は「${activeCombo.name}」がぴったり合いそうです。`;
  }
  if (state.preDay.selectedStyleId || state.preDay.selectedMenuId || state.preDay.selectedPrepId) {
    return `街のようすは「${modifier.name}」。今日の仕込みがきれいにまとまりました。`;
  }
  return `街のようすは「${modifier.name}」。いつものペースで、やさしく開店しましょう。`;
}

function getEventMessage(eventDef) {
  if (!eventDef) {
    return '営業の途中で、ちいさなできごとが起こりました。';
  }
  return `${eventDef.title}。ちょっとした選び方で今日の空気が変わります。`;
}

function evaluateAchievements() {
  const newlyUnlocked = [];
  const previousCount = getAchievementCount();
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
        `実績達成: ${achievement.name}`,
        `${achievement.description} / 解放ポイント +1 / ひらめき +1`,
        'achievement',
      );
    }
  }
  applyAchievementSystemUnlocks(true, previousCount);
  return newlyUnlocked;
}

function offerPerkChoices() {
  const run = state.dayRun;
  run.perkOffered = true;
  run.selectionPaused = true;
  run.overlayMode = 'perk';
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
      showToast('今日のひと工夫', `${perk.name} を選びました。`, 'perk');
      evaluateAchievements();
      renderAll();
      saveState(state);
    });
    elements.perkOptions.appendChild(button);
  }
  elements.perkOverlay.classList.remove('hidden');
  elements.perkOverlay.setAttribute('aria-hidden', 'false');
}

function offerDayEvent() {
  const run = state.dayRun;
  run.eventOffered = true;
  run.selectionPaused = true;
  run.overlayMode = 'event';
  const eventDef = chooseRandom(DAY_EVENT_DEFS);
  run.eventId = eventDef.id;
  elements.eventTitle.textContent = eventDef.title;
  elements.eventDescription.textContent = eventDef.description;
  showToast('営業中のひとできごと', getEventMessage(eventDef), 'event');
  elements.eventOptions.innerHTML = '';
  for (const choice of eventDef.choices) {
    const button = document.createElement('button');
    button.className = 'perk-button';
    button.innerHTML = `<strong>${choice.label}</strong><div>${choice.detail}</div>`;
    button.addEventListener('click', () => {
      choice.apply(run);
      run.eventResolved = true;
      renderDayEventStatus();
      closeEventOverlay();
      renderAll();
      saveState(state);
    });
    elements.eventOptions.appendChild(button);
  }
  renderDayEventStatus(eventDef);
  elements.eventOverlay.classList.remove('hidden');
  elements.eventOverlay.setAttribute('aria-hidden', 'false');
}

function renderResources() {
  elements.moneyValue.textContent = formatNumber(state.money);
  elements.lifetimeMoney.textContent = formatNumber(state.lifetimeMoney);
  elements.reputationValue.textContent = formatWholeNumber(state.reputation);
  elements.unlockPointsValue.textContent = formatWholeNumber(state.unlockPoints);
  elements.insightValue.textContent = formatWholeNumber(state.insight);
  elements.dayCountValue.textContent = `${state.daysCompleted}日`;
  elements.streakLabel.textContent = `連続目標達成 ${state.stats.currentTargetStreak}日`;
  elements.achievementProgress.textContent = `実績 ${getAchievementCount()} / ${ACHIEVEMENTS.length}`;
  elements.cafeGrade.textContent = getCafeGradeLabel();
  maybePulseMainSales();
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
      ? run.overlayMode === 'event'
        ? 'イベント対応中'
        : 'ひと工夫を選択中'
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
  elements.salesRateValue.textContent = `${formatNumber(getProjectedSalesPerSecond())}/秒`;
  elements.basePriceValue.textContent = formatNumber(getCurrentBasePrice());
  elements.visitorRateValue.textContent = `${formatNumber(getCurrentVisitorRate())}人/秒`;
  elements.reputationEffectValue.textContent = `x${formatNumber(getReputationEffect(), 2)}`;
  elements.todayMultiplierValue.textContent = `x${formatNumber(getTodayMultiplier(), 2)}`;
  elements.gradeBonusRow.classList.toggle('hidden', getAchievementCount() < 6);
  elements.gradeBonusValue.textContent = `x${formatNumber(getAchievementBonusMultiplier(), 2)}`;
  elements.startDayButton.disabled = run.active;
  maybeCelebrateRunMoments(targetValue);
  renderOperationLayerState();
  renderDayEventStatus();
  if (includePrepOptions) {
    renderPrepOptions();
  }
  renderRunNotes();
  renderLastResult();
}

function renderRunNotes() {
  const items = state.dayRun.notes.length ? state.dayRun.notes : ['まだ特別な工夫はありません'];
  elements.runBonusList.innerHTML = items.map((note) => `<li>${note}</li>`).join('');
}

function renderLastResult() {
  if (!state.lastResult) {
    elements.lastResultBox.textContent = '営業終了後に、ここへ今日の結果が表示されます。';
    return;
  }
  const result = state.lastResult;
  const achievementText =
    result.achievements.length > 0 ? ` / 新しい実績: ${result.achievements.join(' / ')}` : '';
  const flavorParts = [result.styleName, result.serviceName, result.comboName].filter(Boolean);
  const flavorText = flavorParts.length > 0 ? ` / ${flavorParts.join(' / ')}` : '';
  elements.lastResultBox.textContent =
    `${result.dayNumber}日目: 売上 ${formatNumber(result.sales)} / 目標 ${formatNumber(result.targetValue)}、来客 ${result.customers}人、評判 +${result.reputationGain}、解放ポイント +${result.unlockGain}、ひらめき +${result.insightGain}` +
    ` / ${result.modifierName}${flavorText}${result.achievedTarget ? ' / 売上目標達成' : ' / 売上目標は未達'}` +
    `${achievementText}`;
}

function renderDayEventStatus(eventDef = null) {
  if (!elements.dayEventBox) {
    return;
  }
  if (!state.systems.dayEventUnlocked) {
    elements.dayEventBox.textContent =
      '研究が進むと、営業中に小さなできごとが起こるようになります。';
    return;
  }
  if (!state.dayRun.active) {
    elements.dayEventBox.textContent = '営業中に1回だけ、小さなできごとが舞い込みます。';
    return;
  }
  if (!state.dayRun.eventOffered) {
    elements.dayEventBox.textContent =
      '今日はまだ静かです。営業が進むと、ちいさなできごとが起こるかもしれません。';
    return;
  }
  if (!state.dayRun.eventResolved) {
    const currentEvent =
      eventDef || DAY_EVENT_DEFS.find((entry) => entry.id === state.dayRun.eventId) || null;
    elements.dayEventBox.textContent = currentEvent
      ? `${currentEvent.title} の対応を選べます。`
      : '営業中のできごとが発生しています。';
    return;
  }
  elements.dayEventBox.textContent =
    '今日のできごとにはもう対応済みです。営業の流れにやさしく反映されています。';
}

function renderCodex() {
  if (!elements.codexGrid || !elements.codexSummary) {
    return;
  }
  elements.codexSummary.textContent = `${state.discoveredCombos.length} / ${COMBO_DEFS.length} 発見`;
  elements.codexGrid.innerHTML = COMBO_DEFS.map((combo) => {
    const discovered = state.discoveredCombos.includes(combo.id);
    const unlocked = isComboUnlocked(combo);
    const cardClass = discovered ? 'discovered' : unlocked ? 'available' : 'locked';
    const title = discovered ? combo.name : unlocked ? '未発見コンボ' : '？？？';
    const body = discovered
      ? combo.description
      : unlocked
        ? combo.hint || '組み合わせを試して見つけてみましょう。'
        : combo.hint || '条件を満たすと姿を見せます。';
    const status = discovered ? '発見済み' : unlocked ? '未発見' : '条件未達';
    return `
      <article class="codex-card ${cardClass}">
        <h3>${title}</h3>
        <p>${body}</p>
        <div class="reward">${status}</div>
      </article>
    `;
  }).join('');
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
        <span>${getBoostStatusLabel({
          activeLeft,
          cooldownLeft,
          canUseManually,
          runActive: state.dayRun.active,
        })}</span>
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
      statusLabel.textContent = getBoostStatusLabel({
        activeLeft,
        cooldownLeft,
        canUseManually,
        runActive: state.dayRun.active,
      });
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

function getBoostStatusLabel({ activeLeft, cooldownLeft, canUseManually, runActive }) {
  if (activeLeft > 0) {
    return `効果中 ${formatSeconds(activeLeft)}`;
  }
  if (cooldownLeft > 0) {
    return `再使用まで ${formatSeconds(cooldownLeft)}`;
  }
  if (!runActive) {
    return canUseManually ? '営業開始後に使用' : '開店時に自動発動';
  }
  return canUseManually ? '準備完了' : '自動発動待ち';
}

function formatSeconds(ms) {
  const seconds = Math.ceil(ms / 1000);
  return `${seconds}秒`;
}

function showToast(title, body, tone = 'default') {
  const toast = document.createElement('div');
  toast.className = `toast ${tone}`.trim();
  const heading = document.createElement('strong');
  heading.textContent = title;
  const copy = document.createElement('div');
  copy.textContent = body;
  toast.append(heading, copy);
  elements.toastStack.appendChild(toast);
  window.setTimeout(
    () => {
      toast.remove();
    },
    tone === 'achievement' ? 3600 : 3000,
  );
}

var EXTRA_ACHIEVEMENTS = [
  ...[1000, 1800, 3000, 5000, 8000, 12000, 18000, 26000, 38000, 55000, 80000, 120000].map(
    (value, index) => ({
      id: `sales_extra_${index + 1}`,
      name: `ごほうび売上 ${index + 1}`,
      description: `累計売上を${value}にする`,
      reward: '解放ポイント +1',
      condition: (state) => state.lifetimeMoney >= value,
    }),
  ),
  ...[180, 240, 320, 420, 540, 700, 900, 1200, 1500, 1900].map((value, index) => ({
    id: `best_day_extra_${index + 1}`,
    name: `今日は主役の日 ${index + 1}`,
    description: `1日で売上${value}を達成する`,
    reward: '解放ポイント +1',
    condition: (state) => state.stats.bestDayMoney >= value,
  })),
  ...[25, 35, 50, 70, 95, 130, 180, 240].map((value, index) => ({
    id: `rep_extra_${index + 1}`,
    name: `やさしい評判 ${index + 1}`,
    description: `評判${value}に到達する`,
    reward: '解放ポイント +1',
    condition: (state) => state.reputation >= value,
  })),
  ...[5, 10, 15, 20, 30, 40, 55, 75, 100].map((value, index) => ({
    id: `days_extra_${index + 1}`,
    name: `営業日誌 ${index + 1}`,
    description: `${value}日営業する`,
    reward: '解放ポイント +1',
    condition: (state) => state.daysCompleted >= value,
  })),
  ...[20, 35, 50, 75, 100, 140, 180].map((value, index) => ({
    id: `boost_extra_${index + 1}`,
    name: `てきぱき接客 ${index + 1}`,
    description: `ブーストを${value}回使う`,
    reward: '解放ポイント +1',
    condition: (state) => state.stats.boostUses >= value,
  })),
  ...[200, 350, 500, 700, 950, 1300, 1800, 2400].map((value, index) => ({
    id: `customer_extra_${index + 1}`,
    name: `にぎやかテーブル ${index + 1}`,
    description: `累計来客${value}人を達成する`,
    reward: '解放ポイント +1',
    condition: (state) => state.stats.totalCustomers >= value,
  })),
  ...[5, 8, 12, 16, 20].map((value, index) => ({
    id: `streak_extra_${index + 1}`,
    name: `まいにちえらい ${index + 1}`,
    description: `売上目標を${value}日連続で達成する`,
    reward: '解放ポイント +1',
    condition: (state) => state.stats.bestTargetStreak >= value,
  })),
  ...[4, 8, 12, 16].map((value, index) => ({
    id: `perk_extra_${index + 1}`,
    name: `ひと工夫メモ ${index + 1}`,
    description: `今日のひと工夫を${value}回選ぶ`,
    reward: '解放ポイント +1',
    condition: (state) => state.stats.perkSelections >= value,
  })),
  ...[3, 6, 10, 14, 18, 22].map((value, index) => ({
    id: `tree_extra_${index + 1}`,
    name: `お店づくり上手 ${index + 1}`,
    description: `解放ツリーを${value}個開放する`,
    reward: '解放ポイント +1',
    condition: (state) => state.unlockedNodes.length >= value,
  })),
  ...[2, 4, 6, 8, 10, 12].map((value, index) => ({
    id: `research_extra_${index + 1}`,
    name: `ひらめきノート ${index + 1}`,
    description: `研究を${value}個解放する`,
    reward: '解放ポイント +1',
    condition: (state) => state.researchUnlocked.length >= value,
  })),
  ...[1, 2, 3, 4, 5].map((value, index) => ({
    id: `combo_discovery_extra_${index + 1}`,
    name: `ひみつのレシピ帳 ${index + 1}`,
    description: `コンボを${value}個発見する`,
    reward: '解放ポイント +1',
    condition: (state) => state.discoveredCombos.length >= value,
  })),
  {
    id: 'combo_strawberry',
    name: 'いちごフェア',
    description: '「いちご映えセット」を発見する',
    reward: '解放ポイント +1',
    condition: (state) => state.discoveredCombos.includes('strawberryShowcase'),
  },
  {
    id: 'combo_cookie',
    name: 'これが定番',
    description: '「おかえりプレート」を発見する',
    reward: '解放ポイント +1',
    condition: (state) => state.discoveredCombos.includes('cookieRegulars'),
  },
  {
    id: 'combo_pudding',
    name: 'ごほうびの追い風',
    description: '「ごほうび追い風」を発見する',
    reward: '解放ポイント +1',
    condition: (state) => state.discoveredCombos.includes('puddingCheck'),
  },
  {
    id: 'combo_takeout',
    name: '帰り道のおみやげ',
    description: '「帰り道のクッキー袋」を発見する',
    reward: '解放ポイント +1',
    condition: (state) => state.discoveredCombos.includes('takeoutCookie'),
  },
  {
    id: 'combo_night',
    name: '夜ふかしのごほうび',
    description: '「夜ふかしラテ時間」を発見する',
    reward: '解放ポイント +1',
    condition: (state) => state.discoveredCombos.includes('nightLatte'),
  },
];

var EXTRA_RESEARCH_NODES = [
  {
    id: 'dessertStand',
    name: 'デザートスタンド',
    cost: 6,
    description: '甘いメニューの見せ方を整えます。',
    effectText: '基本単価 +6%',
    requires: ['featuredMenu', 'comboRecipe'],
    apply(state) {
      state.permanent.priceMultiplier *= 1.06;
    },
  },
  {
    id: 'windowNote',
    name: 'まどべメモ',
    cost: 6,
    description: '街のようすに合わせた準備がしやすくなります。',
    effectText: '本日の補正 +5%',
    requires: ['modifierReroll'],
    apply(state) {
      state.permanent.dailyModifierStrength *= 1.05;
    },
  },
  {
    id: 'smilePractice',
    name: 'にこにこ練習',
    cost: 7,
    description: '接客の雰囲気がやわらかくなります。',
    effectText: '評判獲得 +8%',
    requires: ['serviceMoments'],
    apply(state) {
      state.permanent.reputationGainMultiplier *= 1.08;
    },
  },
  {
    id: 'counterFlow',
    name: 'カウンター動線',
    cost: 7,
    description: 'お店の動きが少し滑らかになります。',
    effectText: '来客速度 +7%',
    requires: ['prepStation', 'serviceStyle'],
    apply(state) {
      state.permanent.visitorMultiplier *= 1.07;
    },
  },
  {
    id: 'codexRibbon',
    name: '図鑑のリボン',
    cost: 8,
    description: '図鑑に手がかりメモを挟めるようになります。',
    effectText: '未発見コンボのヒント強化',
    requires: ['comboRecipe'],
    apply(state) {
      state.systems.codexHintUnlocked = true;
    },
  },
  {
    id: 'eveningRhythm',
    name: '夕暮れリズム',
    cost: 8,
    description: '営業終盤の流れを保ちやすくします。',
    effectText: 'ブースト再使用 -8%',
    requires: ['serviceMoments', 'serviceStyle'],
    apply(state) {
      state.permanent.cooldownMultiplier *= 0.92;
    },
  },
  {
    id: 'artisanMenuBook',
    name: '季節メニューブック',
    cost: 9,
    description: '終盤向けのおすすめメニューが2つ増えます。',
    effectText: '新しいおすすめメニューを解放',
    requires: ['featuredMenu', 'dessertStand'],
    apply(state) {
      state.systems.artisanMenuUnlocked = true;
    },
  },
  {
    id: 'hospitalityNotes',
    name: 'おもてなし手帖',
    cost: 9,
    description: '営業前の仕込みに、やさしい対応メモが増えます。',
    effectText: '新しい仕込みを解放',
    requires: ['prepStation', 'smilePractice'],
    apply(state) {
      state.systems.hospitalityPrepUnlocked = true;
    },
  },
  {
    id: 'weekendCalendar',
    name: '週末カレンダー',
    cost: 10,
    description: '特別営業の幅が広がり、終盤向けの営業が追加されます。',
    effectText: '新しい特別営業を解放',
    requires: ['serviceMoments', 'eveningRhythm'],
    apply(state) {
      state.systems.weekendServiceUnlocked = true;
    },
  },
  {
    id: 'secretRecipeBook',
    name: 'ひみつの組み合わせ帳',
    cost: 11,
    description: '終盤向けのコンボが見つかるようになります。',
    effectText: '新しいコンボを解放',
    requires: ['comboRecipe', 'codexRibbon'],
    apply(state) {
      state.systems.secretComboUnlocked = true;
      state.systems.codexHintUnlocked = true;
    },
  },
  {
    id: 'eventAlbum',
    name: 'できごとアルバム',
    cost: 10,
    description: '営業中の小さなできごとが増えて、流れに変化が出ます。',
    effectText: '営業中イベントを追加',
    requires: ['serviceMoments', 'smilePractice'],
    apply(state) {
      state.systems.eventAlbumUnlocked = true;
    },
  },
];

var EXTRA_TREE_NODES = [
  {
    id: 'welcomeBoard',
    name: 'やさしい案内板',
    description: '店先の空気が整い、評判が伸びやすくなります。',
    cost: 5,
    branch: '左ルート',
    requires: ['loyaltyCard'],
    effectText: '評判獲得 +8%',
    apply(state) {
      state.permanent.reputationGainMultiplier *= 1.08;
    },
  },
  {
    id: 'milkFoam',
    name: 'ふわふわフォーム',
    description: 'ラテの満足度が上がります。',
    cost: 5,
    branch: '中央ルート',
    requires: ['pastryLab'],
    effectText: '基本単価 +8%',
    apply(state) {
      state.permanent.priceMultiplier *= 1.08;
    },
  },
  {
    id: 'windowGarden',
    name: '窓辺のグリーン',
    description: 'やわらかな雰囲気で評判の効きが良くなります。',
    cost: 5,
    branch: '右ルート',
    requires: ['softLanterns'],
    effectText: '評判効果 +8%',
    apply(state) {
      state.permanent.reputationEffectMultiplier *= 1.08;
    },
  },
  {
    id: 'letterSet',
    name: 'おたよりセット',
    description: '常連さんとのやり取りが増えます。',
    cost: 6,
    branch: '左ルート',
    requires: ['welcomeBoard'],
    effectText: '来客速度 +8%',
    apply(state) {
      state.permanent.visitorMultiplier *= 1.08;
    },
  },
  {
    id: 'cakeStand',
    name: 'ケーキスタンド',
    description: 'おすすめの見せ方が華やかになります。',
    cost: 6,
    branch: '中央ルート',
    requires: ['milkFoam'],
    effectText: '売上補正 +6%',
    apply(state) {
      state.permanent.salesMultiplier *= 1.06;
    },
  },
  {
    id: 'softCurtain',
    name: 'やわらかカーテン',
    description: '長居したくなる空気を作ります。',
    cost: 6,
    branch: '右ルート',
    requires: ['windowGarden'],
    effectText: '評判効果 +10%',
    apply(state) {
      state.permanent.reputationEffectMultiplier *= 1.1;
    },
  },
  {
    id: 'storybookStand',
    name: '絵本スタンド',
    description: '落ち着いた営業スタイル「よみもの時間」を解放します。',
    cost: 7,
    branch: '左ルート',
    requires: ['letterSet'],
    effectText: '新しい営業スタイルを解放',
    apply(state) {
      state.systems.storybookStyleUnlocked = true;
    },
  },
  {
    id: 'terraceSign',
    name: 'テラス看板',
    description: '外の空気を活かす営業スタイル「テラスの風」を解放します。',
    cost: 7,
    branch: '右ルート',
    requires: ['softCurtain'],
    effectText: '新しい営業スタイルを解放',
    apply(state) {
      state.systems.terraceStyleUnlocked = true;
    },
  },
  {
    id: 'thirdBoostSlot',
    name: '準備メモ3冊目',
    description: '営業前ブーストを3つまで選べるようになります。',
    cost: 8,
    branch: '中央ルート',
    requires: ['cakeStand'],
    effectText: '営業前ブースト枠が3つになる',
    apply(state) {
      state.systems.thirdPrepBoostUnlocked = true;
    },
  },
  {
    id: 'marketBanner',
    name: '街角バナー',
    description: '街の流れを読みやすくして、来客に寄せた営業を支えます。',
    cost: 8,
    branch: '右ルート',
    requires: ['terraceSign'],
    effectText: '来客速度 +10%',
    apply(state) {
      state.permanent.visitorMultiplier *= 1.1;
    },
  },
  {
    id: 'hostDiary',
    name: 'おもてなし日記',
    description: '手元の工夫がまとまり、評判の伸びが少し安定します。',
    cost: 8,
    branch: '左ルート',
    requires: ['storybookStand'],
    effectText: '評判獲得 +10%',
    apply(state) {
      state.permanent.reputationGainMultiplier *= 1.1;
    },
  },
];

function getAchievementCatalog() {
  return [...ACHIEVEMENTS, ...(EXTRA_ACHIEVEMENTS || [])];
}

function getResearchCatalog() {
  return [...RESEARCH_NODES, ...(EXTRA_RESEARCH_NODES || [])];
}

function getTreeCatalog() {
  return [...TREE_NODES, ...(EXTRA_TREE_NODES || [])];
}

function getResearchName(researchId) {
  const research = getResearchCatalog().find((entry) => entry.id === researchId);
  return research ? research.name : researchId;
}

function getNodeName(nodeId) {
  const node = getTreeCatalog().find((entry) => entry.id === nodeId);
  return node ? node.name : nodeId;
}

function rebuildUnlockEffects() {
  const defaults = createDefaultState();
  state.permanent = defaults.permanent;
  state.systems = { ...defaults.systems, codexHintUnlocked: false };
  for (const nodeId of state.unlockedNodes) {
    const node = getTreeCatalog().find((entry) => entry.id === nodeId);
    if (node) {
      node.apply(state);
    }
  }
  for (const researchId of state.researchUnlocked) {
    const research = getResearchCatalog().find((entry) => entry.id === researchId);
    if (research) {
      research.apply(state);
    }
  }
  applyAchievementSystemUnlocks();
}

function purchaseNode(nodeId) {
  const node = getTreeCatalog().find((entry) => entry.id === nodeId);
  if (!node || state.unlockedNodes.includes(nodeId)) {
    return;
  }
  const ready = node.requires.every((required) => state.unlockedNodes.includes(required));
  if (!ready || state.unlockPoints < node.cost) {
    return;
  }
  state.unlockPoints -= node.cost;
  state.unlockedNodes.push(node.id);
  node.apply(state);
  evaluateAchievements();
  renderAll();
  saveState(state);
}

function purchaseResearch(researchId) {
  const research = getResearchCatalog().find((entry) => entry.id === researchId);
  if (!research || state.researchUnlocked.includes(researchId)) {
    return;
  }
  const ready = research.requires.every((required) => hasResearch(required));
  if (!ready || state.insight < research.cost) {
    return;
  }
  state.insight -= research.cost;
  state.researchUnlocked.push(research.id);
  research.apply(state);
  evaluateAchievements();
  renderAll();
  saveState(state);
}

function renderResearch() {
  const researchCatalog = getResearchCatalog();
  elements.researchSummary.textContent = `ひらめき ${formatWholeNumber(state.insight)}`;
  elements.researchGrid.innerHTML = '';
  for (const research of researchCatalog) {
    const unlocked = hasResearch(research.id);
    const ready = research.requires.every((required) => hasResearch(required));
    const canBuy = ready && !unlocked && state.insight >= research.cost;
    const card = document.createElement('article');
    card.className = `research-card ${unlocked ? 'unlocked' : canBuy ? 'ready' : ready ? 'available' : 'locked'}`;
    const prereqText =
      research.requires.length === 0 ? 'なし' : research.requires.map(getResearchName).join(' / ');
    const researchStatus = unlocked
      ? '研究済み'
      : canBuy
        ? '研究可能'
        : ready
          ? `ひらめき不足 (${formatWholeNumber(state.insight)} / ${research.cost})`
          : `前提: ${prereqText}`;
    card.innerHTML = `
      <h3>${research.name}</h3>
      <p>${research.description}</p>
      <small>${research.effectText}</small>
      <div class="research-meta">
        <span>コスト ${research.cost}</span>
        <span>${researchStatus}</span>
      </div>
      <button class="tree-button" ${canBuy ? '' : 'disabled'}>${unlocked ? '研究済み' : '研究する'}</button>
    `;
    card
      .querySelector('.tree-button')
      .addEventListener('click', () => purchaseResearch(research.id));
    elements.researchGrid.appendChild(card);
  }
}

function renderTree() {
  const treeCatalog = getTreeCatalog();
  elements.treeGrid.innerHTML = '';
  for (const node of treeCatalog) {
    const purchased = state.unlockedNodes.includes(node.id);
    const ready = node.requires.every((required) => state.unlockedNodes.includes(required));
    const canBuy = ready && !purchased && state.unlockPoints >= node.cost;
    const card = document.createElement('article');
    card.className = `tree-card ${purchased ? 'purchased' : canBuy ? 'ready' : ready ? 'available' : 'locked'}`;
    const prereqText =
      node.requires.length === 0 ? 'なし' : node.requires.map(getNodeName).join(' / ');
    const treeStatus = purchased
      ? '解放済み'
      : canBuy
        ? '購入可能'
        : ready
          ? `ポイント不足 (${formatWholeNumber(state.unlockPoints)} / ${node.cost})`
          : `前提: ${prereqText}`;
    card.innerHTML = `
      <div class="mini-label">${node.branch}</div>
      <h3>${node.name}</h3>
      <p>${node.description}</p>
      <div class="tree-meta">
        <span>コスト ${node.cost}</span>
        <span>${treeStatus}</span>
      </div>
      <p>${node.effectText}</p>
      <button class="tree-button" ${canBuy ? '' : 'disabled'}>${purchased ? '解放済み' : '解放する'}</button>
    `;
    card.querySelector('.tree-button').addEventListener('click', () => purchaseNode(node.id));
    elements.treeGrid.appendChild(card);
  }
}

function evaluateAchievements() {
  const newlyUnlocked = [];
  const previousCount = getAchievementCount();
  for (const achievement of getAchievementCatalog()) {
    if (state.achievementsUnlocked.includes(achievement.id)) {
      continue;
    }
    if (achievement.condition(state)) {
      state.achievementsUnlocked.push(achievement.id);
      state.unlockPoints += 1;
      state.insight += 1;
      newlyUnlocked.push(achievement);
      showToast(
        `実績達成: ${achievement.name}`,
        `${achievement.description} / 解放ポイント +1 / ひらめき +1`,
        'achievement',
      );
    }
  }
  return newlyUnlocked;
}

function renderResources() {
  elements.moneyValue.textContent = formatNumber(state.money);
  elements.lifetimeMoney.textContent = formatNumber(state.lifetimeMoney);
  elements.reputationValue.textContent = formatWholeNumber(state.reputation);
  elements.unlockPointsValue.textContent = formatWholeNumber(state.unlockPoints);
  elements.insightValue.textContent = formatWholeNumber(state.insight);
  elements.dayCountValue.textContent = `${state.daysCompleted}日`;
  elements.streakLabel.textContent = `連続目標達成 ${state.stats.currentTargetStreak}日`;
  elements.achievementProgress.textContent = `実績 ${getAchievementCount()} / ${getAchievementCatalog().length}`;
  elements.cafeGrade.textContent = getCafeGradeLabel();
  maybePulseMainSales();
}

function renderAchievements() {
  const achievementCatalog = getAchievementCatalog();
  const count = getAchievementCount();
  elements.achievementSummary.textContent = `${count} / ${achievementCatalog.length}達成`;
  elements.achievementUnlocks.innerHTML = AUTO_UNLOCKS.map((unlock) => {
    const active = count >= unlock.threshold;
    return `
      <article class="unlock-chip ${active ? 'active' : 'locked'}">
        <strong>${unlock.label}</strong>
        <div>${unlock.description}</div>
        <small>${active ? '解放済み' : `実績 ${unlock.threshold} 個で解放`}</small>
      </article>
    `;
  }).join('');
  elements.achievementGrid.innerHTML = achievementCatalog
    .map((achievement) => {
      const unlocked = state.achievementsUnlocked.includes(achievement.id);
      return `
      <article class="achievement-card ${unlocked ? 'unlocked' : 'locked secret'}">
        <h3>${unlocked ? achievement.name : '？？？'}</h3>
        <p>${unlocked ? achievement.description : 'まだ見つかっていないごほうびです。'}</p>
        <small>${unlocked ? '達成済み' : '未達成'}</small>
        <div class="reward">${unlocked ? achievement.reward : 'ひみつのごほうび'}</div>
      </article>
    `;
    })
    .join('');
}

ensureExpandedProgressionUi();

function ensureExpandedProgressionUi() {
  if (!document?.body) {
    return;
  }
  ensureStateIntegrity();
  rebuildUnlockEffects();
  renderAll();
  if (elements.versionLabel) {
    elements.versionLabel.textContent = `Version ${APP_VERSION}`;
  }
  saveState(state);
}
