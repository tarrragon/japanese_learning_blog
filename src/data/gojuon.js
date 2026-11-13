/**
 * 五十音資料
 *
 * - GOJUON_ROWS：基本五十音表（行 × 段），用於「五十音表」練習
 * - KANA_DICTIONARY：46 個清音的範例單字字典，用於「五十音進階」練習
 */

/** 段（母音）欄位標題 */
export const GOJUON_COLUMNS = ['あ段 (a)', 'い段 (i)', 'う段 (u)', 'え段 (e)', 'お段 (o)'];

/**
 * 基本五十音表（平假名 / 片假名）
 * null 表示該位置沒有假名
 */
export const GOJUON_ROWS = [
  { label: 'あ行', romaji: '', hiragana: ['あ', 'い', 'う', 'え', 'お'], katakana: ['ア', 'イ', 'ウ', 'エ', 'オ'] },
  { label: 'か行', romaji: 'k', hiragana: ['か', 'き', 'く', 'け', 'こ'], katakana: ['カ', 'キ', 'ク', 'ケ', 'コ'] },
  { label: 'さ行', romaji: 's', hiragana: ['さ', 'し', 'す', 'せ', 'そ'], katakana: ['サ', 'シ', 'ス', 'セ', 'ソ'] },
  { label: 'た行', romaji: 't', hiragana: ['た', 'ち', 'つ', 'て', 'と'], katakana: ['タ', 'チ', 'ツ', 'テ', 'ト'] },
  { label: 'な行', romaji: 'n', hiragana: ['な', 'に', 'ぬ', 'ね', 'の'], katakana: ['ナ', 'ニ', 'ヌ', 'ネ', 'ノ'] },
  { label: 'は行', romaji: 'h', hiragana: ['は', 'ひ', 'ふ', 'へ', 'ほ'], katakana: ['ハ', 'ヒ', 'フ', 'ヘ', 'ホ'] },
  { label: 'ま行', romaji: 'm', hiragana: ['ま', 'み', 'む', 'め', 'も'], katakana: ['マ', 'ミ', 'ム', 'メ', 'モ'] },
  { label: 'や行', romaji: 'y', hiragana: ['や', null, 'ゆ', null, 'よ'], katakana: ['ヤ', null, 'ユ', null, 'ヨ'] },
  { label: 'ら行', romaji: 'r', hiragana: ['ら', 'り', 'る', 'れ', 'ろ'], katakana: ['ラ', 'リ', 'ル', 'レ', 'ロ'] },
  { label: 'わ行', romaji: 'w', hiragana: ['わ', null, null, null, 'を'], katakana: ['ワ', null, null, null, 'ヲ'] },
  { label: 'ん', romaji: '', hiragana: ['ん', null, null, null, null], katakana: ['ン', null, null, null, null] },
];

/**
 * 範例單字
 * @typedef {Object} ExampleWord
 * @property {string} word - 單字（假名）
 * @property {string} meaning - 中文翻譯
 * @property {string} romaji - 羅馬拼音（Hepburn，顯示用）
 */

/**
 * 假名字典（46 個清音，依五十音順序）
 * @type {Array<{
 *   hiragana: string, katakana: string, romaji: string,
 *   hiraganaWord: ExampleWord, katakanaWord: ExampleWord|null,
 *   dakuon?: string, dakuonWord?: ExampleWord,
 *   handakuon?: string, handakuonWord?: ExampleWord
 * }>}
 */
export const KANA_DICTIONARY = [
  { hiragana: 'あ', katakana: 'ア', romaji: 'a', hiraganaWord: w('あめ', '雨', 'ame'), katakanaWord: w('アイス', '冰淇淋', 'aisu') },
  { hiragana: 'い', katakana: 'イ', romaji: 'i', hiraganaWord: w('いぬ', '狗', 'inu'), katakanaWord: w('イメージ', '形象', 'imēji') },
  { hiragana: 'う', katakana: 'ウ', romaji: 'u', hiraganaWord: w('うみ', '海', 'umi'), katakanaWord: w('ウール', '羊毛', 'ūru') },
  { hiragana: 'え', katakana: 'エ', romaji: 'e', hiraganaWord: w('えき', '車站', 'eki'), katakanaWord: w('エレベーター', '電梯', 'erebētā') },
  { hiragana: 'お', katakana: 'オ', romaji: 'o', hiraganaWord: w('おかし', '點心', 'okashi'), katakanaWord: w('オレンジ', '橘子', 'orenji') },

  { hiragana: 'か', katakana: 'カ', romaji: 'ka', hiraganaWord: w('かさ', '傘', 'kasa'), katakanaWord: w('カメラ', '相機', 'kamera'), dakuon: 'が', dakuonWord: w('がっこう', '學校', 'gakkō') },
  { hiragana: 'き', katakana: 'キ', romaji: 'ki', hiraganaWord: w('きって', '郵票', 'kitte'), katakanaWord: w('キーボード', '鍵盤', 'kībōdo'), dakuon: 'ぎ', dakuonWord: w('ぎんこう', '銀行', 'ginkō') },
  { hiragana: 'く', katakana: 'ク', romaji: 'ku', hiraganaWord: w('くつ', '鞋子', 'kutsu'), katakanaWord: w('クリスマス', '聖誕節', 'kurisumasu'), dakuon: 'ぐ', dakuonWord: w('ぐらい', '大約', 'gurai') },
  { hiragana: 'け', katakana: 'ケ', romaji: 'ke', hiraganaWord: w('けいたい', '手機', 'keitai'), katakanaWord: w('ケーキ', '蛋糕', 'kēki'), dakuon: 'げ', dakuonWord: w('げんき', '精神好', 'genki') },
  { hiragana: 'こ', katakana: 'コ', romaji: 'ko', hiraganaWord: w('こども', '小孩', 'kodomo'), katakanaWord: w('コーヒー', '咖啡', 'kōhī'), dakuon: 'ご', dakuonWord: w('ごはん', '飯', 'gohan') },

  { hiragana: 'さ', katakana: 'サ', romaji: 'sa', hiraganaWord: w('さくら', '櫻花', 'sakura'), katakanaWord: w('サイズ', '尺寸', 'saizu'), dakuon: 'ざ', dakuonWord: w('ざっし', '雜誌', 'zasshi') },
  { hiragana: 'し', katakana: 'シ', romaji: 'shi', hiraganaWord: w('しんぶん', '報紙', 'shinbun'), katakanaWord: w('シャツ', '襯衫', 'shatsu'), dakuon: 'じ', dakuonWord: w('じかん', '時間', 'jikan') },
  { hiragana: 'す', katakana: 'ス', romaji: 'su', hiraganaWord: w('すし', '壽司', 'sushi'), katakanaWord: w('スマホ', '智慧型手機', 'sumaho'), dakuon: 'ず', dakuonWord: w('ずっと', '一直', 'zutto') },
  { hiragana: 'せ', katakana: 'セ', romaji: 'se', hiraganaWord: w('せんせい', '老師', 'sensei'), katakanaWord: w('セーター', '毛衣', 'sētā'), dakuon: 'ぜ', dakuonWord: w('ぜんぶ', '全部', 'zenbu') },
  { hiragana: 'そ', katakana: 'ソ', romaji: 'so', hiraganaWord: w('そら', '天空', 'sora'), katakanaWord: w('ソファー', '沙發', 'sofā'), dakuon: 'ぞ', dakuonWord: w('ぞう', '大象', 'zō') },

  { hiragana: 'た', katakana: 'タ', romaji: 'ta', hiraganaWord: w('たべる', '吃', 'taberu'), katakanaWord: w('タクシー', '計程車', 'takushī'), dakuon: 'だ', dakuonWord: w('だいがく', '大學', 'daigaku') },
  // ぢ 開頭的常用詞幾乎不存在（上手 是「じょうず」），改用含ぢ的「はなぢ」
  { hiragana: 'ち', katakana: 'チ', romaji: 'chi', hiraganaWord: w('ちず', '地圖', 'chizu'), katakanaWord: w('チケット', '票券', 'chiketto'), dakuon: 'ぢ', dakuonWord: w('はなぢ', '鼻血', 'hanaji') },
  // 「づくり」只是接尾形式，改用含づ的「つづく」
  { hiragana: 'つ', katakana: 'ツ', romaji: 'tsu', hiraganaWord: w('つくえ', '桌子', 'tsukue'), katakanaWord: w('ツアー', '旅遊', 'tsuā'), dakuon: 'づ', dakuonWord: w('つづく', '繼續', 'tsuzuku') },
  { hiragana: 'て', katakana: 'テ', romaji: 'te', hiraganaWord: w('てがみ', '信', 'tegami'), katakanaWord: w('テレビ', '電視', 'terebi'), dakuon: 'で', dakuonWord: w('でんわ', '電話', 'denwa') },
  { hiragana: 'と', katakana: 'ト', romaji: 'to', hiraganaWord: w('とり', '鳥', 'tori'), katakanaWord: w('トイレ', '廁所', 'toire'), dakuon: 'ど', dakuonWord: w('どうぶつ', '動物', 'dōbutsu') },

  { hiragana: 'な', katakana: 'ナ', romaji: 'na', hiraganaWord: w('なつ', '夏天', 'natsu'), katakanaWord: w('ナイフ', '刀', 'naifu') },
  { hiragana: 'に', katakana: 'ニ', romaji: 'ni', hiraganaWord: w('にく', '肉', 'niku'), katakanaWord: w('ニュース', '新聞', 'nyūsu') },
  { hiragana: 'ぬ', katakana: 'ヌ', romaji: 'nu', hiraganaWord: w('ぬま', '沼澤', 'numa'), katakanaWord: w('ヌードル', '麵條', 'nūdoru') },
  { hiragana: 'ね', katakana: 'ネ', romaji: 'ne', hiraganaWord: w('ねこ', '貓', 'neko'), katakanaWord: w('ネクタイ', '領帶', 'nekutai') },
  { hiragana: 'の', katakana: 'ノ', romaji: 'no', hiraganaWord: w('のみもの', '飲料', 'nomimono'), katakanaWord: w('ノート', '筆記本', 'nōto') },

  // 半濁音單字與「バス」皆為外來語，依實際寫法使用片假名
  { hiragana: 'は', katakana: 'ハ', romaji: 'ha', hiraganaWord: w('はな', '花', 'hana'), katakanaWord: w('ハンバーグ', '漢堡排', 'hanbāgu'), dakuon: 'ば', dakuonWord: w('バス', '巴士', 'basu'), handakuon: 'ぱ', handakuonWord: w('パン', '麵包', 'pan') },
  { hiragana: 'ひ', katakana: 'ヒ', romaji: 'hi', hiraganaWord: w('ひと', '人', 'hito'), katakanaWord: w('ヒーター', '暖氣', 'hītā'), dakuon: 'び', dakuonWord: w('びょういん', '醫院', 'byōin'), handakuon: 'ぴ', handakuonWord: w('ピアノ', '鋼琴', 'piano') },
  { hiragana: 'ふ', katakana: 'フ', romaji: 'fu', hiraganaWord: w('ふゆ', '冬天', 'fuyu'), katakanaWord: w('フォーク', '叉子', 'fōku'), dakuon: 'ぶ', dakuonWord: w('ぶんぼうぐ', '文具', 'bunbōgu'), handakuon: 'ぷ', handakuonWord: w('プール', '游泳池', 'pūru') },
  { hiragana: 'へ', katakana: 'ヘ', romaji: 'he', hiraganaWord: w('へや', '房間', 'heya'), katakanaWord: w('ヘアー', '頭髮', 'heā'), dakuon: 'べ', dakuonWord: w('べんとう', '便當', 'bentō'), handakuon: 'ぺ', handakuonWord: w('ペン', '筆', 'pen') },
  { hiragana: 'ほ', katakana: 'ホ', romaji: 'ho', hiraganaWord: w('ほん', '書', 'hon'), katakanaWord: w('ホテル', '飯店', 'hoteru'), dakuon: 'ぼ', dakuonWord: w('ぼうし', '帽子', 'bōshi'), handakuon: 'ぽ', handakuonWord: w('ポケット', '口袋', 'poketto') },

  { hiragana: 'ま', katakana: 'マ', romaji: 'ma', hiraganaWord: w('まち', '城市', 'machi'), katakanaWord: w('マフラー', '圍巾', 'mafurā') },
  { hiragana: 'み', katakana: 'ミ', romaji: 'mi', hiraganaWord: w('みず', '水', 'mizu'), katakanaWord: w('ミルク', '牛奶', 'miruku') },
  { hiragana: 'む', katakana: 'ム', romaji: 'mu', hiraganaWord: w('むし', '蟲', 'mushi'), katakanaWord: w('ムービー', '電影', 'mūbī') },
  { hiragana: 'め', katakana: 'メ', romaji: 'me', hiraganaWord: w('め', '眼睛', 'me'), katakanaWord: w('メール', '電子郵件', 'mēru') },
  { hiragana: 'も', katakana: 'モ', romaji: 'mo', hiraganaWord: w('もり', '森林', 'mori'), katakanaWord: w('モーター', '馬達', 'mōtā') },

  { hiragana: 'や', katakana: 'ヤ', romaji: 'ya', hiraganaWord: w('やま', '山', 'yama'), katakanaWord: w('ヤクルト', '養樂多', 'yakuruto') },
  { hiragana: 'ゆ', katakana: 'ユ', romaji: 'yu', hiraganaWord: w('ゆき', '雪', 'yuki'), katakanaWord: w('ユーモア', '幽默', 'yūmoa') },
  { hiragana: 'よ', katakana: 'ヨ', romaji: 'yo', hiraganaWord: w('よる', '夜晚', 'yoru'), katakanaWord: w('ヨーグルト', '優格', 'yōguruto') },

  { hiragana: 'ら', katakana: 'ラ', romaji: 'ra', hiraganaWord: w('らいねん', '明年', 'rainen'), katakanaWord: w('ラジオ', '收音機', 'rajio') },
  { hiragana: 'り', katakana: 'リ', romaji: 'ri', hiraganaWord: w('りんご', '蘋果', 'ringo'), katakanaWord: w('リモコン', '遙控器', 'rimokon') },
  { hiragana: 'る', katakana: 'ル', romaji: 'ru', hiraganaWord: w('るす', '不在家', 'rusu'), katakanaWord: w('ルーム', '房間', 'rūmu') },
  { hiragana: 'れ', katakana: 'レ', romaji: 're', hiraganaWord: w('れい', '禮儀', 'rei'), katakanaWord: w('レストラン', '餐廳', 'resutoran') },
  { hiragana: 'ろ', katakana: 'ロ', romaji: 'ro', hiraganaWord: w('ろうか', '走廊', 'rōka'), katakanaWord: w('ロボット', '機器人', 'robotto') },

  { hiragana: 'わ', katakana: 'ワ', romaji: 'wa', hiraganaWord: w('わたし', '我', 'watashi'), katakanaWord: w('ワイン', '葡萄酒', 'wain') },
  // を 只作為助詞使用（教える 是「おしえる」），改用助詞例句
  { hiragana: 'を', katakana: 'ヲ', romaji: 'wo', hiraganaWord: w('ほんをよむ', '讀書', 'hon o yomu'), katakanaWord: null },
  { hiragana: 'ん', katakana: 'ン', romaji: 'n', hiraganaWord: w('んー', '嗯', 'n-'), katakanaWord: w('アニメーション', '動畫', 'animēshon') },
];

function w(word, meaning, romaji) {
  return { word, meaning, romaji };
}
