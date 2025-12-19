/**
 * 羅馬字對應表
 * 假名 -> 可接受的羅馬字輸入陣列
 */
export const ROMAJI_MAP = {
  // 母音
  'あ': ['a'], 'い': ['i'], 'う': ['u'], 'え': ['e'], 'お': ['o'],
  'ア': ['a'], 'イ': ['i'], 'ウ': ['u'], 'エ': ['e'], 'オ': ['o'],

  // か行
  'か': ['ka'], 'き': ['ki'], 'く': ['ku'], 'け': ['ke'], 'こ': ['ko'],
  'カ': ['ka'], 'キ': ['ki'], 'ク': ['ku'], 'ケ': ['ke'], 'コ': ['ko'],

  // さ行（多種輸入方式）
  'さ': ['sa'], 'し': ['si', 'shi'], 'す': ['su'], 'せ': ['se'], 'そ': ['so'],
  'サ': ['sa'], 'シ': ['si', 'shi'], 'ス': ['su'], 'セ': ['se'], 'ソ': ['so'],

  // た行
  'た': ['ta'], 'ち': ['ti', 'chi'], 'つ': ['tu', 'tsu'], 'て': ['te'], 'と': ['to'],
  'タ': ['ta'], 'チ': ['ti', 'chi'], 'ツ': ['tu', 'tsu'], 'テ': ['te'], 'ト': ['to'],

  // な行
  'な': ['na'], 'に': ['ni'], 'ぬ': ['nu'], 'ね': ['ne'], 'の': ['no'],
  'ナ': ['na'], 'ニ': ['ni'], 'ヌ': ['nu'], 'ネ': ['ne'], 'ノ': ['no'],

  // は行
  'は': ['ha'], 'ひ': ['hi'], 'ふ': ['hu', 'fu'], 'へ': ['he'], 'ほ': ['ho'],
  'ハ': ['ha'], 'ヒ': ['hi'], 'フ': ['hu', 'fu'], 'ヘ': ['he'], 'ホ': ['ho'],

  // ま行
  'ま': ['ma'], 'み': ['mi'], 'む': ['mu'], 'め': ['me'], 'も': ['mo'],
  'マ': ['ma'], 'ミ': ['mi'], 'ム': ['mu'], 'メ': ['me'], 'モ': ['mo'],

  // や行
  'や': ['ya'], 'ゆ': ['yu'], 'よ': ['yo'],
  'ヤ': ['ya'], 'ユ': ['yu'], 'ヨ': ['yo'],

  // ら行
  'ら': ['ra'], 'り': ['ri'], 'る': ['ru'], 'れ': ['re'], 'ろ': ['ro'],
  'ラ': ['ra'], 'リ': ['ri'], 'ル': ['ru'], 'レ': ['re'], 'ロ': ['ro'],

  // わ行
  'わ': ['wa'], 'を': ['wo'], 'ん': ['n', 'nn'],
  'ワ': ['wa'], 'ヲ': ['wo'], 'ン': ['n', 'nn'],

  // 濁音
  'が': ['ga'], 'ぎ': ['gi'], 'ぐ': ['gu'], 'げ': ['ge'], 'ご': ['go'],
  'ガ': ['ga'], 'ギ': ['gi'], 'グ': ['gu'], 'ゲ': ['ge'], 'ゴ': ['go'],

  'ざ': ['za'], 'じ': ['zi', 'ji'], 'ず': ['zu'], 'ぜ': ['ze'], 'ぞ': ['zo'],
  'ザ': ['za'], 'ジ': ['zi', 'ji'], 'ズ': ['zu'], 'ゼ': ['ze'], 'ゾ': ['zo'],

  'だ': ['da'], 'ぢ': ['di'], 'づ': ['du', 'dzu'], 'で': ['de'], 'ど': ['do'],
  'ダ': ['da'], 'ヂ': ['di'], 'ヅ': ['du', 'dzu'], 'デ': ['de'], 'ド': ['do'],

  'ば': ['ba'], 'び': ['bi'], 'ぶ': ['bu'], 'べ': ['be'], 'ぼ': ['bo'],
  'バ': ['ba'], 'ビ': ['bi'], 'ブ': ['bu'], 'ベ': ['be'], 'ボ': ['bo'],

  // 半濁音
  'ぱ': ['pa'], 'ぴ': ['pi'], 'ぷ': ['pu'], 'ぺ': ['pe'], 'ぽ': ['po'],
  'パ': ['pa'], 'ピ': ['pi'], 'プ': ['pu'], 'ペ': ['pe'], 'ポ': ['po'],

  // 拗音
  'きゃ': ['kya'], 'きゅ': ['kyu'], 'きょ': ['kyo'],
  'しゃ': ['sya', 'sha'], 'しゅ': ['syu', 'shu'], 'しょ': ['syo', 'sho'],
  'ちゃ': ['tya', 'cha'], 'ちゅ': ['tyu', 'chu'], 'ちょ': ['tyo', 'cho'],
  'にゃ': ['nya'], 'にゅ': ['nyu'], 'にょ': ['nyo'],
  'ひゃ': ['hya'], 'ひゅ': ['hyu'], 'ひょ': ['hyo'],
  'みゃ': ['mya'], 'みゅ': ['myu'], 'みょ': ['myo'],
  'りゃ': ['rya'], 'りゅ': ['ryu'], 'りょ': ['ryo'],
  'ぎゃ': ['gya'], 'ぎゅ': ['gyu'], 'ぎょ': ['gyo'],
  'じゃ': ['zya', 'ja', 'jya'], 'じゅ': ['zyu', 'ju', 'jyu'], 'じょ': ['zyo', 'jo', 'jyo'],
  'びゃ': ['bya'], 'びゅ': ['byu'], 'びょ': ['byo'],
  'ぴゃ': ['pya'], 'ぴゅ': ['pyu'], 'ぴょ': ['pyo'],

  // 促音（小っ）- 單獨輸入時
  'っ': ['xtu', 'ltu', 'xtsu', 'ltsu'],
  'ッ': ['xtu', 'ltu', 'xtsu', 'ltsu'],

  // 小字
  'ぁ': ['xa', 'la'], 'ぃ': ['xi', 'li'], 'ぅ': ['xu', 'lu'], 'ぇ': ['xe', 'le'], 'ぉ': ['xo', 'lo'],
  'ゃ': ['xya', 'lya'], 'ゅ': ['xyu', 'lyu'], 'ょ': ['xyo', 'lyo'],

  // 標點符號
  '、': [','], '。': ['.'], '？': ['?'], '！': ['!'],
  '「': ['['], '」': [']'],
  'ー': ['-'],
  '〜': ['~'],

  // ===== 外來語片假名 =====

  // ティ/ディ 系列（ti/di 音）
  'ティ': ['thi', 'texi', 'teli'],
  'ディ': ['dhi', 'dexi', 'deli'],

  // ファ行（fa/fi/fe/fo 音）
  'ファ': ['fa', 'huxa', 'hula'],
  'フィ': ['fi', 'huxi', 'huli'],
  'フェ': ['fe', 'huxe', 'hule'],
  'フォ': ['fo', 'huxo', 'hulo'],

  // ウィ/ウェ/ウォ
  'ウィ': ['wi', 'uxi', 'uli'],
  'ウェ': ['we', 'uxe', 'ule'],
  'ウォ': ['wo', 'uxo', 'ulo'],

  // ヴ系列（v 音，外來語）
  'ヴァ': ['va', 'vuxa'],
  'ヴィ': ['vi', 'vuxi'],
  'ヴ': ['vu'],
  'ヴェ': ['ve', 'vuxe'],
  'ヴォ': ['vo', 'vuxo'],

  // ===== 古典假名 =====

  // ゐ/ヰ (wi) - 歷史假名，現代已合併為 い
  'ゐ': ['wi'],
  'ヰ': ['wi'],

  // ゑ/ヱ (we) - 歷史假名，現代已合併為 え
  'ゑ': ['we'],
  'ヱ': ['we'],
};

/**
 * 取得假名對應的羅馬字選項
 * @param {string} kana - 假名字元
 * @returns {string[]} - 可接受的羅馬字陣列
 */
export function getRomajiOptions(kana) {
  return ROMAJI_MAP[kana] || [];
}

/**
 * 檢查輸入是否為某個羅馬字的前綴
 * @param {string} input - 目前輸入的字串
 * @param {string[]} romajiOptions - 可接受的羅馬字選項
 * @returns {boolean}
 */
export function isPartialMatch(input, romajiOptions) {
  return romajiOptions.some(romaji => romaji.startsWith(input));
}

/**
 * 檢查輸入是否完全匹配某個羅馬字
 * @param {string} input - 目前輸入的字串
 * @param {string[]} romajiOptions - 可接受的羅馬字選項
 * @returns {boolean}
 */
export function isExactMatch(input, romajiOptions) {
  return romajiOptions.includes(input);
}

/**
 * 促音字元
 */
export const SOKUON = ['っ', 'ッ'];

/**
 * 標點符號列表
 * 注意：波浪符有兩種 Unicode 字符
 * - 〜 (U+301C) WAVE DASH
 * - ～ (U+FF5E) FULLWIDTH TILDE
 */
export const PUNCTUATION = ['、', '。', '？', '！', '「', '」', 'ー', '〜', '～', '*'];

/**
 * 檢查是否為標點符號
 * @param {string} kana - 字元
 * @returns {boolean}
 */
export function isPunctuation(kana) {
  return PUNCTUATION.includes(kana);
}

/**
 * 檢查是否為促音字元
 * @param {string} char - 字元
 * @returns {boolean}
 */
export function isSokuon(char) {
  return SOKUON.includes(char);
}

/**
 * 從羅馬字提取前導子音
 * @param {string} romaji - 羅馬字
 * @returns {string|null} - 子音或 null（如果是母音開頭）
 */
function getLeadingConsonant(romaji) {
  // 特殊處理複合子音
  if (romaji.startsWith('ch')) return 'c';
  if (romaji.startsWith('sh')) return 's';
  if (romaji.startsWith('ts')) return 't';
  if (romaji.startsWith('th')) return 't';
  if (romaji.startsWith('dh')) return 'd';

  const first = romaji[0];
  const vowels = ['a', 'i', 'u', 'e', 'o'];

  return vowels.includes(first) ? null : first;
}

/**
 * 檢查假名是否為促音模式（促音 + 後續假名）
 * @param {string} kana - 假名字串
 * @returns {boolean}
 */
export function isSokuonPattern(kana) {
  return kana.length >= 2 && SOKUON.includes(kana[0]);
}

/**
 * 生成促音 + 假名組合的羅馬字選項
 *
 * 例如：
 * - 'った' → ['tta', 'xtuta', 'ltuta', ...]
 * - 'っか' → ['kka', 'xtuka', 'ltuka', ...]
 * - 'っしょ' → ['ssho', 'ssyo', 'xtusho', ...]
 *
 * @param {string} sokuonKana - 促音 + 後續假名（如 'った', 'っか'）
 * @returns {string[]} - 可接受的羅馬字選項陣列
 */
export function getSokuonRomajiOptions(sokuonKana) {
  if (!isSokuonPattern(sokuonKana)) {
    return [];
  }

  const following = sokuonKana.slice(1);
  const baseRomaji = getRomajiOptions(following);

  if (baseRomaji.length === 0) {
    return [];
  }

  const options = [];

  // 方式 1：子音重複（主要使用者期望）
  // 例如：ka → kka, ta → tta, sho → ssho
  for (const romaji of baseRomaji) {
    const consonant = getLeadingConsonant(romaji);
    if (consonant) {
      options.push(consonant + romaji);
    }
  }

  // 方式 2：傳統 xtu/ltu 輸入（向後相容）
  // 例如：ka → xtuka, ta → xtuta
  const smallTsuOptions = ['xtu', 'ltu'];
  for (const tsu of smallTsuOptions) {
    for (const romaji of baseRomaji) {
      options.push(tsu + romaji);
    }
  }

  return options;
}
