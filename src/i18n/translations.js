/**
 * i18n 翻譯文字定義
 *
 * 支援語言：
 * - zh-TW: 繁體中文
 * - en: 英文
 * - ja: 日文
 */

export const translations = {
  'zh-TW': {
    // 頁面標題
    pageTitle: '日文輸入練習',
    siteName: '日文學習卡片盒',

    // 導航
    backToCards: '← 返回卡片盒',

    // 行動裝置提示
    mobileNotice: '請使用桌面瀏覽器搭配實體鍵盤進行練習',
    backButton: '返回卡片盒',

    // 控制面板
    jlptLabel: 'JLPT 等級：',
    jlptAll: '全部',
    nextQuestion: '下一題',

    // 模式切換按鈕
    mobileMode: '手機模式',
    keyboardMode: '鍵盤模式',
    kanaMode: '假名模式',
    questionMode: '題庫模式',
    hideHint: '隱藏提示',
    showHint: '顯示提示',

    // 輸入提示
    inputHint: '使用實體鍵盤輸入羅馬拼音',
    mobileInputPlaceholder: 'ここに入力',
    mobileInputHint: '日本語入力で直接かなを入力',

    // 載入狀態
    loading: '載入中...',
    loadingQuestions: '載入題庫中...',

    // 結果頁面
    complete: '完成！',
    accuracy: '準確率',
    time: '時間',
    keystrokes: '按鍵數',
    viewSourceCard: '查看來源卡片：',
    retry: '重新開始',

    // 錯誤訊息
    initFailed: '應用程式初始化失敗',
    reload: '重新載入',
    // 練習模式選單
    practiceModeLabel: '練習：',
    modeQuestion: '文章練習',
    modeKana: '假名練習',
    modeGojuon: '五十音表',
    modeGojuonAdvanced: '五十音進階',
    restart: '重新開始',

    // 五十音表格
    gridProgress: '進度',
    gridHintFree: '照順序輸入，或任意輸入表中的假名；點擊格子可移動目前位置',
    gridHintOrdered: '依序輸入每列的範例單字；點擊格子可跳到該單字',
    switchToKatakana: '切換片假名',
    switchToHiragana: '切換平假名',
    dictNumber: '編號',
    dictHiragana: '平假名',
    dictKatakana: '片假名',
    dictDakuon: '濁音',
    dictHandakuon: '半濁音',
    dictWord: '範例單字',
    modeHandwriting: '五十音手寫',
    mobileHandwritingLink: '改用手寫練習',
    hwHint: '依筆順在手寫板上書寫；點擊表格可換字',
    hwLevelTrace: '描紅',
    hwLevelHint: '提示',
    hwLevelBlind: '默寫',
    hwOrderRandom: '隨機順序',
    hwOrderSequential: '依序練習',
    hwStrokeProgress: '第 {{n}} / {{total}} 筆',
    hwBlindProgress: '已寫 {{n}} 筆',
    hwReasonReversed: '方向相反，注意這一筆從哪裡起筆',
    hwReasonOrder: '筆順不對：這是第 {{n}} 筆，應該先寫第 {{expected}} 筆',
    hwReasonShape: '第 {{n}} 筆的位置或形狀不太對，看一下正確寫法',
    hwReasonCount: '筆畫數不對',
    hwGood: '很好！',
    hwClear: '清除',
    hwDemo: '示範筆順',
    hwAttribution: '筆順資料：KanjiVG（CC BY-SA 3.0）',
  },

  'en': {
    // Page title
    pageTitle: 'Japanese Typing Practice',
    siteName: 'Japanese Learning Cards',

    // Navigation
    backToCards: '← Back to Cards',

    // Mobile notice
    mobileNotice: 'Please use a desktop browser with a physical keyboard',
    backButton: 'Back to Cards',

    // Control panel
    jlptLabel: 'JLPT Level:',
    jlptAll: 'All',
    nextQuestion: 'Next',

    // Mode switch buttons
    mobileMode: 'Mobile Mode',
    keyboardMode: 'Keyboard Mode',
    kanaMode: 'Kana Mode',
    questionMode: 'Question Mode',
    hideHint: 'Hide Hint',
    showHint: 'Show Hint',

    // Input hints
    inputHint: 'Type romaji using your keyboard',
    mobileInputPlaceholder: 'Type here',
    mobileInputHint: 'Input kana directly using Japanese IME',

    // Loading states
    loading: 'Loading...',
    loadingQuestions: 'Loading questions...',

    // Result page
    complete: 'Complete!',
    accuracy: 'Accuracy',
    time: 'Time',
    keystrokes: 'Keystrokes',
    viewSourceCard: 'View source card:',
    retry: 'Retry',

    // Error messages
    initFailed: 'Failed to initialize application',
    reload: 'Reload',
    // Practice mode menu
    practiceModeLabel: 'Practice:',
    modeQuestion: 'Articles',
    modeKana: 'Kana',
    modeGojuon: 'Gojūon Chart',
    modeGojuonAdvanced: 'Gojūon Advanced',
    restart: 'Restart',

    // Gojūon grid
    gridProgress: 'Progress',
    gridHintFree: 'Type in order, or type any kana in the chart; click a cell to move the cursor',
    gridHintOrdered: 'Type each example word in order; click a cell to jump to it',
    switchToKatakana: 'Katakana',
    switchToHiragana: 'Hiragana',
    dictNumber: 'No.',
    dictHiragana: 'Hiragana',
    dictKatakana: 'Katakana',
    dictDakuon: 'Dakuon',
    dictHandakuon: 'Handakuon',
    dictWord: 'Example',
    modeHandwriting: 'Gojūon Handwriting',
    mobileHandwritingLink: 'Try handwriting practice',
    hwHint: 'Write on the pad in stroke order; click the chart to change kana',
    hwLevelTrace: 'Trace',
    hwLevelHint: 'Hint',
    hwLevelBlind: 'Recall',
    hwOrderRandom: 'Random order',
    hwOrderSequential: 'In order',
    hwStrokeProgress: 'Stroke {{n}} / {{total}}',
    hwBlindProgress: '{{n}} strokes written',
    hwReasonReversed: 'Wrong direction — check where this stroke starts',
    hwReasonOrder: 'Wrong order: that is stroke {{n}}, write stroke {{expected}} first',
    hwReasonShape: 'Stroke {{n}} is off in position or shape — see the correct stroke',
    hwReasonCount: 'Wrong number of strokes',
    hwGood: 'Nice!',
    hwClear: 'Clear',
    hwDemo: 'Show order',
    hwAttribution: 'Stroke data: KanjiVG (CC BY-SA 3.0)',
  },

  'ja': {
    // ページタイトル
    pageTitle: '日本語入力練習',
    siteName: '日本語学習カード',

    // ナビゲーション
    backToCards: '← カードへ戻る',

    // モバイル通知
    mobileNotice: 'デスクトップブラウザと物理キーボードをご使用ください',
    backButton: 'カードへ戻る',

    // コントロールパネル
    jlptLabel: 'JLPTレベル：',
    jlptAll: 'すべて',
    nextQuestion: '次へ',

    // モード切替ボタン
    mobileMode: 'スマホモード',
    keyboardMode: 'キーボードモード',
    kanaMode: 'かなモード',
    questionMode: '問題モード',
    hideHint: 'ヒントを隠す',
    showHint: 'ヒントを表示',

    // 入力ヒント
    inputHint: 'キーボードでローマ字を入力',
    mobileInputPlaceholder: 'ここに入力',
    mobileInputHint: '日本語入力で直接かなを入力',

    // 読み込み状態
    loading: '読み込み中...',
    loadingQuestions: '問題を読み込み中...',

    // 結果ページ
    complete: '完了！',
    accuracy: '正確率',
    time: '時間',
    keystrokes: 'キー数',
    viewSourceCard: 'ソースカードを見る：',
    retry: 'やり直す',

    // エラーメッセージ
    initFailed: 'アプリの初期化に失敗しました',
    reload: '再読み込み',
    // 練習モードメニュー
    practiceModeLabel: '練習：',
    modeQuestion: '文章練習',
    modeKana: 'かな練習',
    modeGojuon: '五十音図',
    modeGojuonAdvanced: '五十音・応用',
    restart: 'やり直す',

    // 五十音表
    gridProgress: '進捗',
    gridHintFree: '順番どおり、または表の好きなかなを入力。マスをクリックすると現在位置を移動',
    gridHintOrdered: '各行の例語を順番に入力。マスをクリックするとその単語へ移動',
    switchToKatakana: 'カタカナ',
    switchToHiragana: 'ひらがな',
    dictNumber: '番号',
    dictHiragana: 'ひらがな',
    dictKatakana: 'カタカナ',
    dictDakuon: '濁音',
    dictHandakuon: '半濁音',
    dictWord: '例語',
    modeHandwriting: '五十音・手書き',
    mobileHandwritingLink: '手書き練習へ',
    hwHint: '書き順どおりに書いてください。表をクリックすると文字を変更',
    hwLevelTrace: 'なぞり',
    hwLevelHint: 'ヒント',
    hwLevelBlind: '書き取り',
    hwOrderRandom: 'ランダム',
    hwOrderSequential: '順番どおり',
    hwStrokeProgress: '{{n}} / {{total}} 画目',
    hwBlindProgress: '{{n}} 画',
    hwReasonReversed: '方向が逆です。書き始めの位置を確認しましょう',
    hwReasonOrder: '書き順が違います：それは {{n}} 画目、先に {{expected}} 画目を',
    hwReasonShape: '{{n}} 画目の位置か形が違います。正しい書き方を見てください',
    hwReasonCount: '画数が違います',
    hwGood: 'よくできました！',
    hwClear: '消す',
    hwDemo: '書き順を見る',
    hwAttribution: '書き順データ：KanjiVG（CC BY-SA 3.0）',
  },
};
