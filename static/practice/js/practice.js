var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {
      get: all[name],
      enumerable: true,
      configurable: true,
      set: (newValue) => all[name] = () => newValue
    });
};
var __esm = (fn, res) => () => (fn && (res = fn(fn = 0)), res);

// src/domain/InputBuffer.js
class InputBuffer {
  #value;
  constructor(value = "") {
    this.#value = value;
  }
  get value() {
    return this.#value;
  }
  get length() {
    return this.#value.length;
  }
  isEmpty() {
    return this.#value.length === 0;
  }
  add(key) {
    return new InputBuffer(this.#value + key);
  }
  reset() {
    return new InputBuffer;
  }
  tryMatch(character) {
    if (character.matchesRomaji(this.#value)) {
      return { type: MatchType.COMPLETE };
    }
    if (character.isPartialMatch(this.#value)) {
      return { type: MatchType.PARTIAL };
    }
    return { type: MatchType.MISMATCH };
  }
}
var MatchType;
var init_InputBuffer = __esm(() => {
  MatchType = {
    COMPLETE: "COMPLETE",
    PARTIAL: "PARTIAL",
    MISMATCH: "MISMATCH"
  };
});

// src/domain/EventTypes.js
var SessionEventTypes;
var init_EventTypes = __esm(() => {
  SessionEventTypes = {
    KEY_PRESSED: "KeyPressed",
    ROMAJI_MATCHED: "RomajiMatched",
    CHARACTER_COMPLETED: "CharacterCompleted",
    CHARACTER_MISTAKEN: "CharacterMistaken",
    SPEECH_REQUESTED: "SpeechRequested",
    SESSION_COMPLETED: "SessionCompleted"
  };
});

// src/domain/TypingSession.js
var exports_TypingSession = {};
__export(exports_TypingSession, {
  TypingSession: () => TypingSession
});

class TypingSession {
  #question;
  #inputBuffer;
  #startTime;
  #handlers;
  #totalKeystrokes;
  #mistakes;
  constructor(question) {
    this.#question = question;
    this.#inputBuffer = new InputBuffer;
    this.#startTime = new Date;
    this.#handlers = new Map;
    this.#totalKeystrokes = 0;
    this.#mistakes = 0;
    this.#skipPunctuation();
  }
  #skipPunctuation() {
    const skippedChars = [];
    while (!this.#question.isCompleted()) {
      const currentChar = this.#question.getCurrentCharacter();
      if (!currentChar || !currentChar.isPunctuation()) {
        break;
      }
      skippedChars.push(currentChar);
      this.#question = this.#question.advance();
    }
    return skippedChars;
  }
  get question() {
    return this.#question;
  }
  get startTime() {
    return this.#startTime;
  }
  get inputBuffer() {
    return this.#inputBuffer;
  }
  on(eventType, handler) {
    if (!this.#handlers.has(eventType)) {
      this.#handlers.set(eventType, []);
    }
    this.#handlers.get(eventType).push(handler);
  }
  #emit(eventType, data) {
    const handlers = this.#handlers.get(eventType);
    if (handlers) {
      handlers.forEach((handler) => handler(data));
    }
  }
  handleKeyPress(key) {
    if (this.#question.isCompleted()) {
      return;
    }
    this.#totalKeystrokes++;
    this.#emit(SessionEventTypes.KEY_PRESSED, {
      key,
      timestamp: Date.now()
    });
    const currentChar = this.#question.getCurrentCharacter();
    if (!currentChar) {
      return;
    }
    const newBuffer = this.#inputBuffer.add(key);
    const matchResult = newBuffer.tryMatch(currentChar);
    switch (matchResult.type) {
      case MatchType.COMPLETE:
        this.#handleComplete(currentChar, newBuffer);
        break;
      case MatchType.PARTIAL:
        this.#handlePartial(newBuffer);
        break;
      case MatchType.MISMATCH:
        this.#handleMismatch(currentChar, key);
        break;
    }
  }
  #handleComplete(character, buffer) {
    this.#emit(SessionEventTypes.ROMAJI_MATCHED, {
      romaji: buffer.value,
      isPartial: false
    });
    this.#question = this.#question.advance();
    this.#inputBuffer = new InputBuffer;
    this.#emit(SessionEventTypes.CHARACTER_COMPLETED, {
      character,
      duration: Date.now() - this.#startTime.getTime()
    });
    this.#emit(SessionEventTypes.SPEECH_REQUESTED, {
      text: character.kana
    });
    const skippedChars = this.#skipPunctuation();
    for (const skippedChar of skippedChars) {
      this.#emit(SessionEventTypes.CHARACTER_COMPLETED, {
        character: skippedChar,
        duration: Date.now() - this.#startTime.getTime(),
        skipped: true
      });
    }
    if (this.#question.isCompleted()) {
      this.#handleSessionComplete();
    }
  }
  #handlePartial(buffer) {
    this.#inputBuffer = buffer;
    this.#emit(SessionEventTypes.ROMAJI_MATCHED, {
      romaji: buffer.value,
      isPartial: true
    });
  }
  #handleMismatch(character, key) {
    this.#mistakes++;
    this.#emit(SessionEventTypes.CHARACTER_MISTAKEN, {
      expected: character.romaji,
      actual: key
    });
    this.#inputBuffer = new InputBuffer;
  }
  #handleSessionComplete() {
    const endTime = new Date;
    const totalTime = endTime.getTime() - this.#startTime.getTime();
    const correctKeystrokes = this.#totalKeystrokes - this.#mistakes;
    const accuracy = this.#totalKeystrokes > 0 ? correctKeystrokes / this.#totalKeystrokes : 1;
    this.#emit(SessionEventTypes.SESSION_COMPLETED, {
      totalTime,
      accuracy,
      totalKeystrokes: this.#totalKeystrokes,
      mistakes: this.#mistakes
    });
  }
  getCurrentCharacter() {
    return this.#question.getCurrentCharacter();
  }
  getHintRomaji() {
    const char = this.getCurrentCharacter();
    if (!char || char.romaji.length === 0) {
      return "";
    }
    return char.romaji[0];
  }
  getProgress() {
    return this.#question.getProgress();
  }
  handleDirectInput(input) {
    if (!input || this.#question.isCompleted()) {
      return { matchedCount: 0, consumedLength: 0 };
    }
    let matchedCount = 0;
    let consumedLength = 0;
    while (consumedLength < input.length && !this.#question.isCompleted()) {
      const currentChar = this.#question.getCurrentCharacter();
      if (!currentChar) {
        break;
      }
      const expectedKana = currentChar.kana;
      const expectedDisplay = currentChar.display;
      const remainingInput = input.substring(consumedLength);
      let matched = false;
      let matchLength = 0;
      if (remainingInput.startsWith(expectedDisplay)) {
        matched = true;
        matchLength = expectedDisplay.length;
      } else if (remainingInput.startsWith(expectedKana)) {
        matched = true;
        matchLength = expectedKana.length;
      }
      if (matched) {
        this.#totalKeystrokes++;
        this.#question = this.#question.advance();
        this.#emit(SessionEventTypes.CHARACTER_COMPLETED, {
          character: currentChar,
          duration: Date.now() - this.#startTime.getTime()
        });
        this.#emit(SessionEventTypes.SPEECH_REQUESTED, {
          text: currentChar.kana
        });
        const skippedChars = this.#skipPunctuation();
        for (const skippedChar of skippedChars) {
          this.#emit(SessionEventTypes.CHARACTER_COMPLETED, {
            character: skippedChar,
            duration: Date.now() - this.#startTime.getTime(),
            skipped: true
          });
        }
        matchedCount++;
        consumedLength += matchLength;
      } else {
        break;
      }
    }
    if (this.#question.isCompleted()) {
      this.#handleSessionComplete();
    }
    return { matchedCount, consumedLength };
  }
}
var init_TypingSession = __esm(() => {
  init_InputBuffer();
  init_EventTypes();
});

// src/domain/RomajiMap.js
function getRomajiOptions(kana) {
  return ROMAJI_MAP[kana] || [];
}
function isPartialMatch(input, romajiOptions) {
  return romajiOptions.some((romaji) => romaji.startsWith(input));
}
function isExactMatch(input, romajiOptions) {
  return romajiOptions.includes(input);
}
function isPunctuation(kana) {
  return PUNCTUATION.includes(kana);
}
function isSokuon(char) {
  return SOKUON.includes(char);
}
function getLeadingConsonant(romaji) {
  if (romaji.startsWith("ch"))
    return "c";
  if (romaji.startsWith("sh"))
    return "s";
  if (romaji.startsWith("ts"))
    return "t";
  if (romaji.startsWith("th"))
    return "t";
  if (romaji.startsWith("dh"))
    return "d";
  const first = romaji[0];
  const vowels = ["a", "i", "u", "e", "o"];
  return vowels.includes(first) ? null : first;
}
function isSokuonPattern(kana) {
  return kana.length >= 2 && SOKUON.includes(kana[0]);
}
function getSokuonRomajiOptions(sokuonKana) {
  if (!isSokuonPattern(sokuonKana)) {
    return [];
  }
  const following = sokuonKana.slice(1);
  const baseRomaji = getRomajiOptions(following);
  if (baseRomaji.length === 0) {
    return [];
  }
  const options = [];
  for (const romaji of baseRomaji) {
    const consonant = getLeadingConsonant(romaji);
    if (consonant) {
      options.push(consonant + romaji);
    }
  }
  const smallTsuOptions = ["xtu", "ltu"];
  for (const tsu of smallTsuOptions) {
    for (const romaji of baseRomaji) {
      options.push(tsu + romaji);
    }
  }
  return options;
}
var ROMAJI_MAP, SOKUON, PUNCTUATION;
var init_RomajiMap = __esm(() => {
  ROMAJI_MAP = {
    "あ": ["a"],
    "い": ["i"],
    "う": ["u"],
    "え": ["e"],
    "お": ["o"],
    "ア": ["a"],
    "イ": ["i"],
    "ウ": ["u"],
    "エ": ["e"],
    "オ": ["o"],
    "か": ["ka"],
    "き": ["ki"],
    "く": ["ku"],
    "け": ["ke"],
    "こ": ["ko"],
    "カ": ["ka"],
    "キ": ["ki"],
    "ク": ["ku"],
    "ケ": ["ke"],
    "コ": ["ko"],
    "さ": ["sa"],
    "し": ["si", "shi"],
    "す": ["su"],
    "せ": ["se"],
    "そ": ["so"],
    "サ": ["sa"],
    "シ": ["si", "shi"],
    "ス": ["su"],
    "セ": ["se"],
    "ソ": ["so"],
    "た": ["ta"],
    "ち": ["ti", "chi"],
    "つ": ["tu", "tsu"],
    "て": ["te"],
    "と": ["to"],
    "タ": ["ta"],
    "チ": ["ti", "chi"],
    "ツ": ["tu", "tsu"],
    "テ": ["te"],
    "ト": ["to"],
    "な": ["na"],
    "に": ["ni"],
    "ぬ": ["nu"],
    "ね": ["ne"],
    "の": ["no"],
    "ナ": ["na"],
    "ニ": ["ni"],
    "ヌ": ["nu"],
    "ネ": ["ne"],
    "ノ": ["no"],
    "は": ["ha"],
    "ひ": ["hi"],
    "ふ": ["hu", "fu"],
    "へ": ["he"],
    "ほ": ["ho"],
    "ハ": ["ha"],
    "ヒ": ["hi"],
    "フ": ["hu", "fu"],
    "ヘ": ["he"],
    "ホ": ["ho"],
    "ま": ["ma"],
    "み": ["mi"],
    "む": ["mu"],
    "め": ["me"],
    "も": ["mo"],
    "マ": ["ma"],
    "ミ": ["mi"],
    "ム": ["mu"],
    "メ": ["me"],
    "モ": ["mo"],
    "や": ["ya"],
    "ゆ": ["yu"],
    "よ": ["yo"],
    "ヤ": ["ya"],
    "ユ": ["yu"],
    "ヨ": ["yo"],
    "ら": ["ra"],
    "り": ["ri"],
    "る": ["ru"],
    "れ": ["re"],
    "ろ": ["ro"],
    "ラ": ["ra"],
    "リ": ["ri"],
    "ル": ["ru"],
    "レ": ["re"],
    "ロ": ["ro"],
    "わ": ["wa"],
    "を": ["wo"],
    "ん": ["nn", "n"],
    "ワ": ["wa"],
    "ヲ": ["wo"],
    "ン": ["nn", "n"],
    "が": ["ga"],
    "ぎ": ["gi"],
    "ぐ": ["gu"],
    "げ": ["ge"],
    "ご": ["go"],
    "ガ": ["ga"],
    "ギ": ["gi"],
    "グ": ["gu"],
    "ゲ": ["ge"],
    "ゴ": ["go"],
    "ざ": ["za"],
    "じ": ["zi", "ji"],
    "ず": ["zu"],
    "ぜ": ["ze"],
    "ぞ": ["zo"],
    "ザ": ["za"],
    "ジ": ["zi", "ji"],
    "ズ": ["zu"],
    "ゼ": ["ze"],
    "ゾ": ["zo"],
    "だ": ["da"],
    "ぢ": ["di"],
    "づ": ["du", "dzu"],
    "で": ["de"],
    "ど": ["do"],
    "ダ": ["da"],
    "ヂ": ["di"],
    "ヅ": ["du", "dzu"],
    "デ": ["de"],
    "ド": ["do"],
    "ば": ["ba"],
    "び": ["bi"],
    "ぶ": ["bu"],
    "べ": ["be"],
    "ぼ": ["bo"],
    "バ": ["ba"],
    "ビ": ["bi"],
    "ブ": ["bu"],
    "ベ": ["be"],
    "ボ": ["bo"],
    "ぱ": ["pa"],
    "ぴ": ["pi"],
    "ぷ": ["pu"],
    "ぺ": ["pe"],
    "ぽ": ["po"],
    "パ": ["pa"],
    "ピ": ["pi"],
    "プ": ["pu"],
    "ペ": ["pe"],
    "ポ": ["po"],
    "きゃ": ["kya"],
    "きゅ": ["kyu"],
    "きょ": ["kyo"],
    "しゃ": ["sya", "sha"],
    "しゅ": ["syu", "shu"],
    "しょ": ["syo", "sho"],
    "ちゃ": ["tya", "cha"],
    "ちゅ": ["tyu", "chu"],
    "ちょ": ["tyo", "cho"],
    "にゃ": ["nya"],
    "にゅ": ["nyu"],
    "にょ": ["nyo"],
    "ひゃ": ["hya"],
    "ひゅ": ["hyu"],
    "ひょ": ["hyo"],
    "みゃ": ["mya"],
    "みゅ": ["myu"],
    "みょ": ["myo"],
    "りゃ": ["rya"],
    "りゅ": ["ryu"],
    "りょ": ["ryo"],
    "ぎゃ": ["gya"],
    "ぎゅ": ["gyu"],
    "ぎょ": ["gyo"],
    "じゃ": ["zya", "ja", "jya"],
    "じゅ": ["zyu", "ju", "jyu"],
    "じょ": ["zyo", "jo", "jyo"],
    "びゃ": ["bya"],
    "びゅ": ["byu"],
    "びょ": ["byo"],
    "ぴゃ": ["pya"],
    "ぴゅ": ["pyu"],
    "ぴょ": ["pyo"],
    "っ": ["xtu", "ltu", "xtsu", "ltsu"],
    "ッ": ["xtu", "ltu", "xtsu", "ltsu"],
    "ぁ": ["xa", "la"],
    "ぃ": ["xi", "li"],
    "ぅ": ["xu", "lu"],
    "ぇ": ["xe", "le"],
    "ぉ": ["xo", "lo"],
    "ゃ": ["xya", "lya"],
    "ゅ": ["xyu", "lyu"],
    "ょ": ["xyo", "lyo"],
    "、": [","],
    "。": ["."],
    "？": ["?"],
    "！": ["!"],
    "「": ["["],
    "」": ["]"],
    "ー": ["-"],
    "〜": ["~"],
    "ティ": ["thi", "texi", "teli"],
    "ディ": ["dhi", "dexi", "deli"],
    "ファ": ["fa", "huxa", "hula"],
    "フィ": ["fi", "huxi", "huli"],
    "フェ": ["fe", "huxe", "hule"],
    "フォ": ["fo", "huxo", "hulo"],
    "ウィ": ["wi", "uxi", "uli"],
    "ウェ": ["we", "uxe", "ule"],
    "ウォ": ["wo", "uxo", "ulo"],
    "ヴァ": ["va", "vuxa"],
    "ヴィ": ["vi", "vuxi"],
    "ヴ": ["vu"],
    "ヴェ": ["ve", "vuxe"],
    "ヴォ": ["vo", "vuxo"],
    "ゐ": ["wi"],
    "ヰ": ["wi"],
    "ゑ": ["we"],
    "ヱ": ["we"]
  };
  SOKUON = ["っ", "ッ"];
  PUNCTUATION = [
    "、",
    "。",
    "？",
    "！",
    "「",
    "」",
    "（",
    "）",
    "(",
    ")",
    "ー",
    "〜",
    "～",
    "*"
  ];
});

// src/domain/Character.js
class Character {
  #kana;
  #romaji;
  #state;
  #display;
  constructor(kana, state = CharacterState.PENDING, romajiOverride = null, display = null) {
    this.#kana = kana;
    this.#display = display || kana;
    if (romajiOverride) {
      this.#romaji = romajiOverride;
    } else if (isSokuonPattern(kana)) {
      this.#romaji = getSokuonRomajiOptions(kana);
    } else {
      this.#romaji = getRomajiOptions(kana);
    }
    this.#state = state;
  }
  get kana() {
    return this.#kana;
  }
  get romaji() {
    return this.#romaji;
  }
  get state() {
    return this.#state;
  }
  get display() {
    return this.#display;
  }
  setCurrent() {
    return new Character(this.#kana, CharacterState.CURRENT, this.#romaji, this.#display);
  }
  setCompleted() {
    return new Character(this.#kana, CharacterState.COMPLETED, this.#romaji, this.#display);
  }
  matchesRomaji(input) {
    return isExactMatch(input, this.#romaji);
  }
  isPartialMatch(input) {
    return isPartialMatch(input, this.#romaji);
  }
  isPunctuation() {
    return isPunctuation(this.#kana);
  }
  matchesKana(input) {
    return this.#kana === input;
  }
  matchesDisplay(input) {
    return this.#display === input;
  }
}
var CharacterState;
var init_Character = __esm(() => {
  init_RomajiMap();
  CharacterState = {
    PENDING: "pending",
    CURRENT: "current",
    COMPLETED: "completed"
  };
});

// src/domain/Question.js
var exports_Question = {};
__export(exports_Question, {
  Question: () => Question
});
function getNextUnit(text, startIndex) {
  if (startIndex >= text.length) {
    return null;
  }
  if (startIndex + 1 < text.length) {
    const twoChars = text.slice(startIndex, startIndex + 2);
    if (YOUON_LIST.includes(twoChars) || ROMAJI_MAP[twoChars]) {
      return twoChars;
    }
  }
  return text[startIndex];
}
function canMergeWithSokuon(kana) {
  const romaji = getRomajiOptions(kana);
  if (romaji.length === 0)
    return false;
  const vowels = ["a", "i", "u", "e", "o"];
  return romaji.some((r) => !vowels.includes(r[0]));
}
function parseText(text) {
  const result = [];
  let i = 0;
  while (i < text.length) {
    if (isSokuon(text[i]) && i + 1 < text.length) {
      const nextUnit = getNextUnit(text, i + 1);
      if (nextUnit && canMergeWithSokuon(nextUnit)) {
        result.push(text[i] + nextUnit);
        i += 1 + nextUnit.length;
        continue;
      }
    }
    if (i + 1 < text.length) {
      const twoChars = text.slice(i, i + 2);
      if (YOUON_LIST.includes(twoChars) || ROMAJI_MAP[twoChars]) {
        result.push(twoChars);
        i += 2;
        continue;
      }
    }
    result.push(text[i]);
    i += 1;
  }
  return result;
}
function isN(kana) {
  return kana === "ん" || kana === "ン";
}
function requiresNNBefore(kana) {
  return REQUIRES_NN_BEFORE.includes(kana);
}

class Question {
  #text;
  #characters;
  #currentIndex;
  constructor(text, characters, currentIndex = 0) {
    this.#text = text;
    this.#characters = characters;
    this.#currentIndex = currentIndex;
  }
  static fromText(text) {
    const kanaList = parseText(text);
    const characters = kanaList.map((kana, index, arr) => {
      let romajiOverride = null;
      if (isN(kana)) {
        if (index === arr.length - 1) {
          romajiOverride = ["n", "nn"];
        } else {
          const nextKana = arr[index + 1];
          if (requiresNNBefore(nextKana)) {
            romajiOverride = ["nn", "n'"];
          }
        }
      }
      const char = new Character(kana, CharacterState.PENDING, romajiOverride);
      return index === 0 ? char.setCurrent() : char;
    });
    return new Question(text, characters, 0);
  }
  static fromQuestionData(data) {
    const characters = data.characters.map((charData, index) => {
      const char = new Character(charData.kana, CharacterState.PENDING, charData.romaji, charData.display);
      return index === 0 ? char.setCurrent() : char;
    });
    const question = new Question(data.text, characters, 0);
    question._id = data.id;
    question._displayCharacters = data.characters;
    question._source = data.source;
    question._metadata = data.metadata;
    return question;
  }
  get id() {
    return this._id;
  }
  get displayCharacters() {
    return this._displayCharacters;
  }
  get source() {
    return this._source;
  }
  get metadata() {
    return this._metadata;
  }
  get text() {
    return this.#text;
  }
  get characters() {
    return this.#characters;
  }
  get currentIndex() {
    return this.#currentIndex;
  }
  getCurrentCharacter() {
    if (this.#currentIndex >= this.#characters.length) {
      return null;
    }
    return this.#characters[this.#currentIndex];
  }
  advance() {
    if (this.isCompleted()) {
      return this;
    }
    const newCharacters = this.#characters.map((char, index) => {
      if (index === this.#currentIndex) {
        return char.setCompleted();
      } else if (index === this.#currentIndex + 1) {
        return char.setCurrent();
      }
      return char;
    });
    return new Question(this.#text, newCharacters, this.#currentIndex + 1);
  }
  isCompleted() {
    return this.#currentIndex >= this.#characters.length;
  }
  getProgress() {
    if (this.#characters.length === 0) {
      return 1;
    }
    return this.#currentIndex / this.#characters.length;
  }
}
var YOUON_LIST, REQUIRES_NN_BEFORE;
var init_Question = __esm(() => {
  init_Character();
  init_RomajiMap();
  YOUON_LIST = [
    "きゃ",
    "きゅ",
    "きょ",
    "しゃ",
    "しゅ",
    "しょ",
    "ちゃ",
    "ちゅ",
    "ちょ",
    "にゃ",
    "にゅ",
    "にょ",
    "ひゃ",
    "ひゅ",
    "ひょ",
    "みゃ",
    "みゅ",
    "みょ",
    "りゃ",
    "りゅ",
    "りょ",
    "ぎゃ",
    "ぎゅ",
    "ぎょ",
    "じゃ",
    "じゅ",
    "じょ",
    "びゃ",
    "びゅ",
    "びょ",
    "ぴゃ",
    "ぴゅ",
    "ぴょ",
    "キャ",
    "キュ",
    "キョ",
    "シャ",
    "シュ",
    "ショ",
    "チャ",
    "チュ",
    "チョ",
    "ニャ",
    "ニュ",
    "ニョ",
    "ヒャ",
    "ヒュ",
    "ヒョ",
    "ミャ",
    "ミュ",
    "ミョ",
    "リャ",
    "リュ",
    "リョ",
    "ギャ",
    "ギュ",
    "ギョ",
    "ジャ",
    "ジュ",
    "ジョ",
    "ビャ",
    "ビュ",
    "ビョ",
    "ピャ",
    "ピュ",
    "ピョ",
    "ティ",
    "ディ",
    "ファ",
    "フィ",
    "フェ",
    "フォ",
    "ウィ",
    "ウェ",
    "ウォ",
    "ヴァ",
    "ヴィ",
    "ヴェ",
    "ヴォ"
  ];
  REQUIRES_NN_BEFORE = [
    "な",
    "に",
    "ぬ",
    "ね",
    "の",
    "にゃ",
    "にゅ",
    "にょ",
    "あ",
    "い",
    "う",
    "え",
    "お",
    "や",
    "ゆ",
    "よ",
    "ナ",
    "ニ",
    "ヌ",
    "ネ",
    "ノ",
    "ニャ",
    "ニュ",
    "ニョ",
    "ア",
    "イ",
    "ウ",
    "エ",
    "オ",
    "ヤ",
    "ユ",
    "ヨ"
  ];
});

// src/store/Store.js
class Store {
  #state;
  #listeners;
  #reducer;
  constructor(reducer, initialState) {
    this.#state = initialState;
    this.#listeners = new Set;
    this.#reducer = reducer;
  }
  getState() {
    return this.#state;
  }
  dispatch(action) {
    if (!action || typeof action.type !== "string") {
      throw new Error("Action must have a type property");
    }
    const prevState = this.#state;
    this.#state = this.#reducer(this.#state, action);
    if (prevState !== this.#state) {
      this.#notify(action);
    }
  }
  subscribe(listener) {
    if (typeof listener !== "function") {
      throw new Error("Listener must be a function");
    }
    this.#listeners.add(listener);
    return () => {
      this.#listeners.delete(listener);
    };
  }
  #notify(action) {
    this.#listeners.forEach((listener) => {
      try {
        listener(this.#state, action);
      } catch (error) {
        console.error("Store listener error:", error);
      }
    });
  }
  getListenerCount() {
    return this.#listeners.size;
  }
}

// src/store/actions.js
var ActionTypes = {
  SET_PRACTICE_MODE: "SET_PRACTICE_MODE",
  SET_INPUT_MODE: "SET_INPUT_MODE",
  TOGGLE_ROMAJI_HINT: "TOGGLE_ROMAJI_HINT",
  TOGGLE_KEYBOARD: "TOGGLE_KEYBOARD",
  SET_FILTER: "SET_FILTER",
  START_LOADING: "START_LOADING",
  LOAD_QUESTION_SUCCESS: "LOAD_QUESTION_SUCCESS",
  LOAD_QUESTION_FAILURE: "LOAD_QUESTION_FAILURE",
  COMPLETE_SESSION: "COMPLETE_SESSION",
  RESET_SESSION: "RESET_SESSION"
};
var actions = {
  setPracticeMode: (mode) => ({
    type: ActionTypes.SET_PRACTICE_MODE,
    payload: mode
  }),
  setInputMode: (mode) => ({
    type: ActionTypes.SET_INPUT_MODE,
    payload: mode
  }),
  toggleRomajiHint: () => ({
    type: ActionTypes.TOGGLE_ROMAJI_HINT
  }),
  toggleKeyboard: () => ({
    type: ActionTypes.TOGGLE_KEYBOARD
  }),
  setFilter: (key, value) => ({
    type: ActionTypes.SET_FILTER,
    payload: { key, value }
  }),
  startLoading: () => ({
    type: ActionTypes.START_LOADING
  }),
  loadQuestionSuccess: (question) => ({
    type: ActionTypes.LOAD_QUESTION_SUCCESS,
    payload: question
  }),
  loadQuestionFailure: (error) => ({
    type: ActionTypes.LOAD_QUESTION_FAILURE,
    payload: error
  }),
  completeSession: (result) => ({
    type: ActionTypes.COMPLETE_SESSION,
    payload: result
  }),
  resetSession: () => ({
    type: ActionTypes.RESET_SESSION
  })
};

// src/store/reducer.js
function appReducer(state, action) {
  switch (action.type) {
    case ActionTypes.SET_PRACTICE_MODE:
      return {
        ...state,
        practiceMode: action.payload
      };
    case ActionTypes.SET_INPUT_MODE:
      return {
        ...state,
        inputMode: action.payload
      };
    case ActionTypes.TOGGLE_ROMAJI_HINT:
      return {
        ...state,
        uiSettings: {
          ...state.uiSettings,
          showRomajiHint: !state.uiSettings.showRomajiHint
        }
      };
    case ActionTypes.TOGGLE_KEYBOARD:
      return {
        ...state,
        uiSettings: {
          ...state.uiSettings,
          showKeyboard: !state.uiSettings.showKeyboard
        }
      };
    case ActionTypes.SET_FILTER:
      return {
        ...state,
        filters: {
          ...state.filters,
          [action.payload.key]: action.payload.value
        }
      };
    case ActionTypes.START_LOADING:
      return {
        ...state,
        status: "loading",
        error: null
      };
    case ActionTypes.LOAD_QUESTION_SUCCESS:
      return {
        ...state,
        status: "practicing",
        currentQuestion: action.payload,
        error: null
      };
    case ActionTypes.LOAD_QUESTION_FAILURE:
      return {
        ...state,
        status: "error",
        error: action.payload
      };
    case ActionTypes.COMPLETE_SESSION:
      return {
        ...state,
        status: "completed",
        result: action.payload
      };
    case ActionTypes.RESET_SESSION:
      return {
        ...state,
        status: "idle",
        currentQuestion: null,
        result: null,
        error: null
      };
    default:
      return state;
  }
}

// src/store/AppState.js
var initialState = {
  practiceMode: "question",
  inputMode: "romaji",
  uiSettings: {
    showRomajiHint: true,
    showKeyboard: true
  },
  filters: {
    jlpt: "all"
  },
  status: "idle",
  currentQuestion: null,
  result: null,
  error: null
};

// src/modes/PracticeMode.js
init_TypingSession();
init_EventTypes();
class PracticeMode {
  static get id() {
    throw new Error("Must implement static id getter");
  }
  static get displayName() {
    throw new Error("Must implement static displayName getter");
  }
  static get description() {
    return "";
  }
  static get requiresQuestionLoader() {
    return false;
  }
  static get supportedInputModes() {
    return ["romaji", "direct"];
  }
  constructor(dependencies) {
    if (new.target === PracticeMode) {
      throw new Error("PracticeMode is abstract and cannot be instantiated directly");
    }
    this.store = dependencies.store;
    this.questionLoader = dependencies.questionLoader;
    this.speechService = dependencies.speechService;
    this.session = null;
  }
  async initialize() {
    throw new Error("Must implement initialize()");
  }
  async loadNextQuestion() {
    throw new Error("Must implement loadNextQuestion()");
  }
  createSession(question) {
    this.session = new TypingSession(question);
    return this.session;
  }
  setupSessionListeners(session) {
    session.on(SessionEventTypes.SPEECH_REQUESTED, (e) => {
      this.speechService?.speak(e.text);
    });
    session.on(SessionEventTypes.SESSION_COMPLETED, (e) => {
      this.onSessionCompleted(e);
    });
    session.on(SessionEventTypes.CHARACTER_MISTAKEN, (e) => {
      this.onCharacterMistaken(e);
    });
  }
  onCharacterCompleted(event) {}
  onSessionCompleted(event) {
    this.store.dispatch(actions.completeSession(event));
  }
  onCharacterMistaken(event) {}
  dispose() {
    this.session = null;
  }
  getUIConfig() {
    return {
      showFilters: false,
      showSourceLink: false
    };
  }
}

// src/modes/QuestionMode.js
init_Question();
class QuestionMode extends PracticeMode {
  static get id() {
    return "question";
  }
  static get displayName() {
    return "題庫模式";
  }
  static get description() {
    return "從卡片庫中隨機選取例句練習";
  }
  static get requiresQuestionLoader() {
    return true;
  }
  async initialize() {
    if (!this.questionLoader) {
      throw new Error("QuestionMode requires a QuestionLoader");
    }
    if (!this.questionLoader.isLoaded()) {
      this.store.dispatch(actions.startLoading());
      await this.questionLoader.load();
    }
  }
  async loadNextQuestion() {
    const state = this.store.getState();
    const filters = state.filters;
    const questionData = this.questionLoader.getRandomQuestion(filters);
    if (!questionData) {
      throw new Error("找不到符合條件的題目");
    }
    this.store.dispatch(actions.loadQuestionSuccess(questionData));
    return Question.fromQuestionData(questionData);
  }
  getUIConfig() {
    return {
      showFilters: true,
      showSourceLink: true
    };
  }
}

// src/modes/KanaMode.js
init_Question();
var PRACTICE_TEXTS = [
  "あいうえお",
  "かきくけこ",
  "さしすせそ",
  "たちつてと",
  "なにぬねの",
  "はひふへほ",
  "まみむめも",
  "やゆよ",
  "らりるれろ",
  "わをん",
  "がぎぐげご",
  "ざじずぜぞ",
  "だぢづでど",
  "ばびぶべぼ",
  "ぱぴぷぺぽ",
  "きゃきゅきょ",
  "しゃしゅしょ",
  "ちゃちゅちょ",
  "こんにちは",
  "ありがとう",
  "おはよう",
  "さようなら",
  "いただきます",
  "ごちそうさま"
];

class KanaMode extends PracticeMode {
  static get id() {
    return "kana";
  }
  static get displayName() {
    return "假名模式";
  }
  static get description() {
    return "練習基礎假名輸入";
  }
  static get requiresQuestionLoader() {
    return false;
  }
  async initialize() {}
  async loadNextQuestion() {
    const text = this.#getRandomText();
    this.store.dispatch(actions.loadQuestionSuccess({ text }));
    return Question.fromText(text);
  }
  #getRandomText() {
    const index = Math.floor(Math.random() * PRACTICE_TEXTS.length);
    return PRACTICE_TEXTS[index];
  }
  getUIConfig() {
    return {
      showFilters: false,
      showSourceLink: false
    };
  }
  static getPracticeTexts() {
    return [...PRACTICE_TEXTS];
  }
}

// src/modes/ModeRegistry.js
class ModeRegistryClass {
  #modes = new Map;
  #currentMode = null;
  #dependencies = null;
  constructor() {
    this.register(QuestionMode);
    this.register(KanaMode);
  }
  register(ModeClass) {
    if (!ModeClass.id) {
      throw new Error("Mode class must have a static id property");
    }
    this.#modes.set(ModeClass.id, ModeClass);
  }
  unregister(modeId) {
    this.#modes.delete(modeId);
  }
  setDependencies(dependencies) {
    this.#dependencies = dependencies;
  }
  getAvailableModes() {
    return Array.from(this.#modes.values()).map((ModeClass) => ({
      id: ModeClass.id,
      displayName: ModeClass.displayName,
      description: ModeClass.description
    }));
  }
  hasMode(modeId) {
    return this.#modes.has(modeId);
  }
  getModeClass(modeId) {
    return this.#modes.get(modeId);
  }
  async switchMode(modeId) {
    if (!this.#dependencies) {
      throw new Error("Dependencies not set. Call setDependencies() first.");
    }
    if (this.#currentMode) {
      this.#currentMode.dispose();
      this.#currentMode = null;
    }
    const ModeClass = this.#modes.get(modeId);
    if (!ModeClass) {
      throw new Error(`Unknown mode: ${modeId}`);
    }
    this.#currentMode = new ModeClass(this.#dependencies);
    await this.#currentMode.initialize();
    return this.#currentMode;
  }
  getCurrentMode() {
    return this.#currentMode;
  }
  getCurrentModeId() {
    if (!this.#currentMode)
      return null;
    return this.#currentMode.constructor.id;
  }
  reset() {
    if (this.#currentMode) {
      this.#currentMode.dispose();
      this.#currentMode = null;
    }
    this.#dependencies = null;
  }
}
var modeRegistry = new ModeRegistryClass;

// src/input/InputHandler.js
class InputHandler {
  #session = null;
  #onUpdate = null;
  constructor() {
    if (new.target === InputHandler) {
      throw new Error("InputHandler is abstract and cannot be instantiated directly");
    }
    this.isActive = false;
  }
  setSession(session) {
    this.#session = session;
  }
  get session() {
    return this.#session;
  }
  setUpdateCallback(callback) {
    this.#onUpdate = callback;
  }
  triggerUpdate() {
    if (this.#onUpdate) {
      this.#onUpdate();
    }
  }
  activate() {
    this.isActive = true;
  }
  deactivate() {
    this.isActive = false;
  }
  dispose() {
    this.deactivate();
    this.#session = null;
    this.#onUpdate = null;
  }
  updateHighlight() {}
}

// src/input/RomajiInputHandler.js
class RomajiInputHandler extends InputHandler {
  #keyboardRenderer;
  #boundHandler = null;
  constructor(keyboardRenderer = null) {
    super();
    this.#keyboardRenderer = keyboardRenderer;
  }
  activate() {
    this.deactivate();
    super.activate();
    if (typeof document === "undefined")
      return;
    this.#boundHandler = this.#handleKeyDown.bind(this);
    document.addEventListener("keydown", this.#boundHandler);
  }
  deactivate() {
    super.deactivate();
    if (this.#boundHandler && typeof document !== "undefined") {
      document.removeEventListener("keydown", this.#boundHandler);
      this.#boundHandler = null;
    }
  }
  #handleKeyDown(event) {
    if (!this.isActive || !this.session)
      return;
    if (event.ctrlKey || event.altKey || event.metaKey)
      return;
    if (event.key.length !== 1)
      return;
    event.preventDefault();
    const key = event.key.toLowerCase();
    this.#keyboardRenderer?.showKeyPress(key);
    this.session.handleKeyPress(key);
    this.triggerUpdate();
  }
  updateHighlight() {
    if (!this.session || !this.#keyboardRenderer)
      return;
    const hint = this.session.getHintRomaji();
    let nextKey = null;
    if (hint) {
      for (const char of hint) {
        if (/[a-z]/i.test(char)) {
          nextKey = char.toLowerCase();
          break;
        }
      }
    }
    this.#keyboardRenderer.highlightKey(nextKey);
  }
  dispose() {
    this.deactivate();
    this.#keyboardRenderer?.highlightKey(null);
    super.dispose();
  }
  setKeyboardRenderer(renderer) {
    this.#keyboardRenderer = renderer;
  }
}

// src/input/DirectInputHandler.js
class DirectInputHandler extends InputHandler {
  #inputElement;
  #boundInputHandler = null;
  #boundCompositionHandler = null;
  constructor(inputElement = null) {
    super();
    this.#inputElement = inputElement;
  }
  setInputElement(element) {
    this.#inputElement = element;
  }
  activate() {
    this.deactivate();
    super.activate();
    if (!this.#inputElement) {
      console.warn("DirectInputHandler: Input element not set");
      return;
    }
    this.#boundInputHandler = this.#handleInput.bind(this);
    this.#boundCompositionHandler = this.#handleInput.bind(this);
    this.#inputElement.addEventListener("input", this.#boundInputHandler);
    this.#inputElement.addEventListener("compositionend", this.#boundCompositionHandler);
    this.#inputElement.value = "";
    setTimeout(() => {
      this.#inputElement?.focus();
    }, 100);
  }
  deactivate() {
    super.deactivate();
    if (this.#inputElement) {
      if (this.#boundInputHandler) {
        this.#inputElement.removeEventListener("input", this.#boundInputHandler);
      }
      if (this.#boundCompositionHandler) {
        this.#inputElement.removeEventListener("compositionend", this.#boundCompositionHandler);
      }
    }
    this.#boundInputHandler = null;
    this.#boundCompositionHandler = null;
  }
  #handleInput(event) {
    if (!this.isActive || !this.session || !this.#inputElement)
      return;
    const value = this.#inputElement.value;
    if (!value)
      return;
    const result = this.session.handleDirectInput(value);
    if (result.matchedCount > 0) {
      this.#inputElement.value = value.substring(result.consumedLength);
      this.triggerUpdate();
    }
  }
  dispose() {
    this.deactivate();
    if (this.#inputElement) {
      this.#inputElement.value = "";
    }
    super.dispose();
  }
  focus() {
    this.#inputElement?.focus();
  }
  getInputElement() {
    return this.#inputElement;
  }
}

// src/input/InputHandlerFactory.js
class InputHandlerFactory {
  #keyboardRenderer;
  #mobileInputElement;
  constructor(options = {}) {
    this.#keyboardRenderer = options.keyboardRenderer || null;
    this.#mobileInputElement = options.mobileInputElement || null;
  }
  setKeyboardRenderer(renderer) {
    this.#keyboardRenderer = renderer;
  }
  setMobileInputElement(element) {
    this.#mobileInputElement = element;
  }
  create(mode) {
    switch (mode) {
      case "romaji":
        return new RomajiInputHandler(this.#keyboardRenderer);
      case "direct":
        return new DirectInputHandler(this.#mobileInputElement);
      default:
        throw new Error(`Unknown input mode: ${mode}`);
    }
  }
  static getSupportedModes() {
    return ["romaji", "direct"];
  }
}

// src/renderers/TextRenderer.js
class TextRenderer {
  #container;
  constructor(container) {
    this.#container = container;
  }
  render(question, questionData = null) {
    if (!this.#container || !question)
      return;
    const characters = question.characters;
    let html;
    if (questionData?.characters) {
      html = questionData.characters.map((charData, index) => {
        const char = characters[index];
        const stateClass = char ? `char-${char.state}` : "char-pending";
        return `<span class="char ${stateClass}" data-index="${index}">${charData.display}</span>`;
      }).join("");
    } else {
      html = characters.map((char, index) => {
        const stateClass = `char-${char.state}`;
        return `<span class="char ${stateClass}" data-index="${index}">${char.kana}</span>`;
      }).join("");
    }
    this.#container.innerHTML = html;
    this.#scrollToCurrentChar(question.currentIndex);
  }
  #scrollToCurrentChar(currentIndex) {
    const currentChar = this.#container?.querySelector(`[data-index="${currentIndex}"]`);
    if (!currentChar)
      return;
    const containerRect = this.#container.parentElement?.getBoundingClientRect();
    if (!containerRect)
      return;
    const containerCenter = containerRect.width / 3;
    const charOffset = currentChar.offsetLeft;
    const scrollOffset = Math.max(0, charOffset - containerCenter);
    this.#container.style.transform = `translateX(-${scrollOffset}px)`;
  }
  clear() {
    if (this.#container) {
      this.#container.innerHTML = "";
      this.#container.style.transform = "";
    }
  }
  getContainer() {
    return this.#container;
  }
}

// src/renderers/RomajiRenderer.js
class RomajiRenderer {
  #container;
  constructor(container) {
    this.#container = container;
  }
  render(question) {
    if (!this.#container || !question)
      return;
    const characters = question.characters;
    const html = characters.map((char, index) => {
      const stateClass = `romaji-${char.state}`;
      const romaji = char.romaji[0] || "";
      return `<span class="romaji ${stateClass}" data-index="${index}">${romaji}</span>`;
    }).join("");
    this.#container.innerHTML = html;
    this.#scrollToCurrentChar(question.currentIndex);
  }
  #scrollToCurrentChar(currentIndex) {
    const currentRomaji = this.#container?.querySelector(`[data-index="${currentIndex}"]`);
    if (!currentRomaji)
      return;
    const containerRect = this.#container.parentElement?.getBoundingClientRect();
    if (!containerRect)
      return;
    const containerCenter = containerRect.width / 3;
    const romajiOffset = currentRomaji.offsetLeft;
    const scrollOffset = Math.max(0, romajiOffset - containerCenter);
    this.#container.style.transform = `translateX(-${scrollOffset}px)`;
  }
  clear() {
    if (this.#container) {
      this.#container.innerHTML = "";
      this.#container.style.transform = "";
    }
  }
  getContainer() {
    return this.#container;
  }
}

// src/i18n/translations.js
var translations = {
  "zh-TW": {
    pageTitle: "日文輸入練習",
    siteName: "日文學習卡片盒",
    backToCards: "← 返回卡片盒",
    mobileNotice: "請使用桌面瀏覽器搭配實體鍵盤進行練習",
    backButton: "返回卡片盒",
    jlptLabel: "JLPT 等級：",
    jlptAll: "全部",
    nextQuestion: "下一題",
    mobileMode: "手機模式",
    keyboardMode: "鍵盤模式",
    kanaMode: "假名模式",
    questionMode: "題庫模式",
    hideHint: "隱藏提示",
    showHint: "顯示提示",
    inputHint: "使用實體鍵盤輸入羅馬拼音",
    mobileInputPlaceholder: "ここに入力",
    mobileInputHint: "日本語入力で直接かなを入力",
    loading: "載入中...",
    loadingQuestions: "載入題庫中...",
    complete: "完成！",
    accuracy: "準確率",
    time: "時間",
    keystrokes: "按鍵數",
    viewSourceCard: "查看來源卡片：",
    retry: "重新開始",
    initFailed: "應用程式初始化失敗",
    reload: "重新載入"
  },
  en: {
    pageTitle: "Japanese Typing Practice",
    siteName: "Japanese Learning Cards",
    backToCards: "← Back to Cards",
    mobileNotice: "Please use a desktop browser with a physical keyboard",
    backButton: "Back to Cards",
    jlptLabel: "JLPT Level:",
    jlptAll: "All",
    nextQuestion: "Next",
    mobileMode: "Mobile Mode",
    keyboardMode: "Keyboard Mode",
    kanaMode: "Kana Mode",
    questionMode: "Question Mode",
    hideHint: "Hide Hint",
    showHint: "Show Hint",
    inputHint: "Type romaji using your keyboard",
    mobileInputPlaceholder: "Type here",
    mobileInputHint: "Input kana directly using Japanese IME",
    loading: "Loading...",
    loadingQuestions: "Loading questions...",
    complete: "Complete!",
    accuracy: "Accuracy",
    time: "Time",
    keystrokes: "Keystrokes",
    viewSourceCard: "View source card:",
    retry: "Retry",
    initFailed: "Failed to initialize application",
    reload: "Reload"
  },
  ja: {
    pageTitle: "日本語入力練習",
    siteName: "日本語学習カード",
    backToCards: "← カードへ戻る",
    mobileNotice: "デスクトップブラウザと物理キーボードをご使用ください",
    backButton: "カードへ戻る",
    jlptLabel: "JLPTレベル：",
    jlptAll: "すべて",
    nextQuestion: "次へ",
    mobileMode: "スマホモード",
    keyboardMode: "キーボードモード",
    kanaMode: "かなモード",
    questionMode: "問題モード",
    hideHint: "ヒントを隠す",
    showHint: "ヒントを表示",
    inputHint: "キーボードでローマ字を入力",
    mobileInputPlaceholder: "ここに入力",
    mobileInputHint: "日本語入力で直接かなを入力",
    loading: "読み込み中...",
    loadingQuestions: "問題を読み込み中...",
    complete: "完了！",
    accuracy: "正確率",
    time: "時間",
    keystrokes: "キー数",
    viewSourceCard: "ソースカードを見る：",
    retry: "やり直す",
    initFailed: "アプリの初期化に失敗しました",
    reload: "再読み込み"
  }
};

// src/i18n/I18nService.js
var Languages = {
  ZH_TW: "zh-TW",
  EN: "en",
  JA: "ja"
};
var STORAGE_KEY = "practice_language";
var SUPPORTED_LANGUAGES = Object.values(Languages);
var DEFAULT_LANGUAGE = Languages.ZH_TW;

class I18nService {
  #currentLanguage;
  #listeners = [];
  constructor() {
    this.#currentLanguage = this.#detectLanguage();
  }
  #detectLanguage() {
    if (typeof window === "undefined") {
      return DEFAULT_LANGUAGE;
    }
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && SUPPORTED_LANGUAGES.includes(saved)) {
      return saved;
    }
    const urlParams = new URLSearchParams(window.location.search);
    const urlLang = urlParams.get("lang");
    if (urlLang && SUPPORTED_LANGUAGES.includes(urlLang)) {
      return urlLang;
    }
    const browserLang = navigator.language || navigator.userLanguage;
    if (browserLang) {
      if (SUPPORTED_LANGUAGES.includes(browserLang)) {
        return browserLang;
      }
      const prefix = browserLang.split("-")[0];
      const matched = SUPPORTED_LANGUAGES.find((lang) => lang.startsWith(prefix) || lang === prefix);
      if (matched) {
        return matched;
      }
    }
    return DEFAULT_LANGUAGE;
  }
  getLanguage() {
    return this.#currentLanguage;
  }
  getSupportedLanguages() {
    return [...SUPPORTED_LANGUAGES];
  }
  setLanguage(lang) {
    if (!SUPPORTED_LANGUAGES.includes(lang)) {
      console.warn(`Unsupported language: ${lang}`);
      return;
    }
    this.#currentLanguage = lang;
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY, lang);
    }
    if (typeof window !== "undefined") {
      const url = new URL(window.location);
      if (lang !== DEFAULT_LANGUAGE) {
        url.searchParams.set("lang", lang);
      } else {
        url.searchParams.delete("lang");
      }
      window.history.replaceState({}, "", url);
    }
    this.#listeners.forEach((callback) => callback(lang));
  }
  t(key, params = {}) {
    const langTranslations = translations[this.#currentLanguage];
    if (!langTranslations) {
      console.warn(`No translations for language: ${this.#currentLanguage}`);
      return key;
    }
    let text = langTranslations[key];
    if (text === undefined) {
      text = translations[DEFAULT_LANGUAGE]?.[key];
      if (text === undefined) {
        console.warn(`Missing translation for key: ${key}`);
        return key;
      }
    }
    Object.keys(params).forEach((param) => {
      text = text.replace(new RegExp(`{{${param}}}`, "g"), params[param]);
    });
    return text;
  }
  subscribe(callback) {
    this.#listeners.push(callback);
    return () => {
      const index = this.#listeners.indexOf(callback);
      if (index > -1) {
        this.#listeners.splice(index, 1);
      }
    };
  }
  getLanguageName(lang) {
    const names = {
      [Languages.ZH_TW]: "繁體中文",
      [Languages.EN]: "English",
      [Languages.JA]: "日本語"
    };
    return names[lang] || lang;
  }
}
var i18n = new I18nService;
// src/renderers/ResultRenderer.js
class ResultRenderer {
  #container;
  #basePath;
  #onNextQuestion = null;
  constructor(container, basePath = "") {
    this.#container = container;
    this.#basePath = basePath;
  }
  setNextQuestionCallback(callback) {
    this.#onNextQuestion = callback;
  }
  render(stats, questionData = null) {
    if (!this.#container)
      return;
    const accuracy = Math.round(stats.accuracy * 100);
    const timeInSeconds = (stats.totalTime / 1000).toFixed(1);
    let sourceLink = "";
    if (questionData?.source) {
      const fullPath = this.#basePath + questionData.source.path;
      sourceLink = `
        <a href="${fullPath}" class="source-link" target="_blank">
          ${i18n.t("viewSourceCard")}${questionData.source.title} →
        </a>
      `;
    }
    const nextButton = this.#onNextQuestion ? `<button class="next-btn" id="next-question-btn">${i18n.t("nextQuestion")}</button>` : "";
    this.#container.innerHTML = `
      <div class="result-box">
        <h2>${i18n.t("complete")}</h2>
        <div class="result-stats">
          <div class="stat">
            <span class="stat-value">${accuracy}%</span>
            <span class="stat-label">${i18n.t("accuracy")}</span>
          </div>
          <div class="stat">
            <span class="stat-value">${timeInSeconds}s</span>
            <span class="stat-label">${i18n.t("time")}</span>
          </div>
          <div class="stat">
            <span class="stat-value">${stats.totalKeystrokes}</span>
            <span class="stat-label">${i18n.t("keystrokes")}</span>
          </div>
        </div>
        ${sourceLink}
        <div class="result-actions">
          ${nextButton}
          <button class="retry-btn" onclick="location.reload()">${i18n.t("retry")}</button>
        </div>
      </div>
    `;
    this.#container.style.display = "flex";
    this.#bindNextButton();
  }
  #bindNextButton() {
    if (!this.#onNextQuestion)
      return;
    const nextBtn = this.#container?.querySelector("#next-question-btn");
    if (nextBtn) {
      nextBtn.addEventListener("click", () => this.#onNextQuestion());
    }
  }
  hide() {
    if (this.#container) {
      this.#container.style.display = "none";
    }
  }
  dispose() {
    this.#onNextQuestion = null;
  }
  getContainer() {
    return this.#container;
  }
}

// src/effects/FlashEffect.js
class FlashEffect {
  #container;
  #successClass;
  #errorClass;
  #duration;
  constructor(container, options = {}) {
    this.#container = container;
    this.#successClass = options.successClass || "flash-success";
    this.#errorClass = options.errorClass || "flash-error";
    this.#duration = options.duration || 200;
  }
  flashSuccess() {
    this.#flash(this.#successClass);
  }
  flashError() {
    this.#flash(this.#errorClass);
  }
  #flash(className) {
    if (!this.#container)
      return;
    this.#container.classList.add(className);
    setTimeout(() => {
      this.#container?.classList.remove(className);
    }, this.#duration);
  }
  setContainer(container) {
    this.#container = container;
  }
  getContainer() {
    return this.#container;
  }
}

// src/ui/KeyboardRenderer.js
class KeyboardRenderer {
  #container;
  #currentHighlight;
  constructor(container) {
    this.#container = container;
    this.#currentHighlight = null;
  }
  highlightKey(key) {
    if (this.#currentHighlight) {
      this.#currentHighlight.classList.remove("key-target");
    }
    if (!key) {
      this.#currentHighlight = null;
      return;
    }
    const keyElement = this.#container.querySelector(`[data-key="${key}"]`);
    if (keyElement) {
      keyElement.classList.add("key-target");
      this.#currentHighlight = keyElement;
    }
  }
  showKeyPress(key) {
    const keyElement = this.#container.querySelector(`[data-key="${key}"]`);
    if (!keyElement)
      return;
    keyElement.classList.add("key-pressed");
    setTimeout(() => {
      keyElement.classList.remove("key-pressed");
    }, 100);
  }
  clearHighlights() {
    const allKeys = this.#container.querySelectorAll(".key");
    allKeys.forEach((key) => {
      key.classList.remove("key-target", "key-pressed");
    });
    this.#currentHighlight = null;
  }
}

// src/services/QuestionLoader.js
class QuestionLoader {
  constructor(dataUrl) {
    if (!dataUrl) {
      const pathname = window.location.pathname;
      const match = pathname.match(/^(.*?)\/[^\/]+\/?$/);
      const basePath = match ? match[1] : "";
      dataUrl = `${basePath}/data/questions.json`;
    }
    this.dataUrl = dataUrl;
    this.basePath = this.dataUrl.replace(/\/[^\/]+$/, "");
    this.questionBank = null;
    this.index = null;
    this.loadedBundles = new Set;
    this.loadingPromises = new Map;
    this.recentIds = new Set;
    this.maxRecentHistory = 10;
    this.useProgressiveLoading = false;
  }
  async loadIndex() {
    if (this.index) {
      return this.index;
    }
    const indexUrl = `${this.basePath}/questions-index.json`;
    try {
      const response = await fetch(indexUrl);
      if (!response.ok) {
        return null;
      }
      this.index = await response.json();
      console.log(`索引檔載入完成: ${Object.keys(this.index.bundles).length} 個分包`);
      return this.index;
    } catch (error) {
      console.log("索引檔不存在，使用傳統載入模式");
      return null;
    }
  }
  async loadInitial() {
    const index = await this.loadIndex();
    if (index) {
      this.useProgressiveLoading = true;
      this.questionBank = {
        version: index.version,
        generated: index.generated,
        questions: [],
        stats: index.stats
      };
      await this.loadBundle("init");
      console.log(`初始載入完成: ${this.questionBank.questions.length} 題`);
      return this.questionBank;
    }
    return this.loadLegacy();
  }
  async loadBundle(bundleKey) {
    if (this.loadedBundles.has(bundleKey)) {
      return;
    }
    if (this.loadingPromises.has(bundleKey)) {
      return this.loadingPromises.get(bundleKey);
    }
    if (!this.index) {
      throw new Error("索引檔尚未載入");
    }
    const bundleInfo = this.index.bundles[bundleKey];
    if (!bundleInfo) {
      console.warn(`分包不存在: ${bundleKey}`);
      return;
    }
    const bundleUrl = `${this.basePath}/${bundleInfo.path}`;
    const promise = (async () => {
      try {
        const response = await fetch(bundleUrl);
        if (!response.ok) {
          throw new Error(`載入分包失敗: ${response.status}`);
        }
        const data = await response.json();
        this.mergeQuestions(data.questions);
        this.loadedBundles.add(bundleKey);
        console.log(`分包載入完成: ${bundleKey} (${data.questions.length} 題)`);
      } catch (error) {
        console.error(`載入分包 ${bundleKey} 失敗:`, error);
        throw error;
      } finally {
        this.loadingPromises.delete(bundleKey);
      }
    })();
    this.loadingPromises.set(bundleKey, promise);
    return promise;
  }
  mergeQuestions(newQuestions) {
    if (!this.questionBank) {
      return;
    }
    const existingIds = new Set(this.questionBank.questions.map((q) => q.id));
    const uniqueNew = newQuestions.filter((q) => !existingIds.has(q.id));
    this.questionBank.questions.push(...uniqueNew);
  }
  async loadInBackground(priority) {
    for (const level of priority) {
      if (!this.loadedBundles.has(level) && this.index?.bundles[level]) {
        try {
          await this.loadBundle(level);
        } catch (error) {
          console.warn(`背景載入 ${level} 失敗，稍後重試`);
        }
      }
    }
  }
  isLevelLoaded(jlpt) {
    return this.loadedBundles.has(jlpt);
  }
  getLoadingStatus() {
    const bundleCount = this.index ? Object.keys(this.index.bundles).length : 1;
    return {
      loadedBundles: [...this.loadedBundles],
      totalQuestions: this.questionBank?.questions.length || 0,
      isFullyLoaded: this.loadedBundles.size >= bundleCount
    };
  }
  async loadLegacy() {
    try {
      const response = await fetch(this.dataUrl);
      if (!response.ok) {
        throw new Error(`載入題庫失敗: ${response.status} ${response.statusText}`);
      }
      this.questionBank = await response.json();
      this.loadedBundles.add("legacy");
      console.log(`題庫載入完成（傳統模式）: ${this.questionBank.questions.length} 題`);
      return this.questionBank;
    } catch (error) {
      console.error("題庫載入錯誤:", error);
      throw error;
    }
  }
  async load() {
    if (this.questionBank) {
      return this.questionBank;
    }
    return this.loadInitial();
  }
  isLoaded() {
    return this.questionBank !== null;
  }
  getAllQuestions() {
    return this.questionBank?.questions || [];
  }
  filterQuestions(filters = {}) {
    let questions = this.getAllQuestions();
    if (filters.jlpt && filters.jlpt !== "all") {
      questions = questions.filter((q) => q.source.jlpt === filters.jlpt);
    }
    if (filters.category && filters.category !== "all") {
      questions = questions.filter((q) => q.source.category === filters.category);
    }
    if (filters.difficulty && filters.difficulty !== "all") {
      questions = questions.filter((q) => q.metadata.difficulty === filters.difficulty);
    }
    return questions;
  }
  getRandomQuestion(filters = {}) {
    const questions = this.filterQuestions(filters);
    if (questions.length === 0) {
      return null;
    }
    let available = questions.filter((q) => !this.recentIds.has(q.id));
    if (available.length === 0) {
      this.recentIds.clear();
      available = questions;
    }
    const index = Math.floor(Math.random() * available.length);
    const selected = available[index];
    this.recentIds.add(selected.id);
    if (this.recentIds.size > this.maxRecentHistory) {
      const firstId = this.recentIds.values().next().value;
      this.recentIds.delete(firstId);
    }
    return selected;
  }
  getQuestionById(id) {
    return this.getAllQuestions().find((q) => q.id === id) || null;
  }
  getStats() {
    return this.questionBank?.stats || null;
  }
  getJlptLevels() {
    const stats = this.getStats();
    if (!stats?.byJlpt) {
      return ["n5", "n4", "n3", "n2", "n1"];
    }
    return Object.keys(stats.byJlpt).sort();
  }
  getCategories() {
    const stats = this.getStats();
    if (!stats?.byCategory) {
      return [];
    }
    return Object.keys(stats.byCategory).sort();
  }
  resetHistory() {
    this.recentIds.clear();
  }
}
var questionLoader = new QuestionLoader;

// src/services/SpeechService.js
class SpeechService {
  #lang;
  #rate;
  #speechSynthesis;
  constructor(options = {}) {
    this.#lang = options.lang || "ja-JP";
    this.#rate = options.rate || 1;
    this.#speechSynthesis = options.speechSynthesis;
  }
  get lang() {
    return this.#lang;
  }
  isSupported() {
    return this.#speechSynthesis !== undefined && this.#speechSynthesis !== null;
  }
  speak(text) {
    return new Promise((resolve, reject) => {
      if (!this.isSupported()) {
        resolve();
        return;
      }
      const utterance = this.#createUtterance(text);
      utterance.lang = this.#lang;
      utterance.rate = this.#rate;
      utterance.onend = () => resolve();
      utterance.onerror = (event) => reject(event);
      this.#speechSynthesis.speak(utterance);
    });
  }
  cancel() {
    if (this.isSupported()) {
      this.#speechSynthesis.cancel();
    }
  }
  #createUtterance(text) {
    if (typeof SpeechSynthesisUtterance !== "undefined") {
      return new SpeechSynthesisUtterance(text);
    }
    return {
      text,
      lang: "",
      rate: 1,
      onend: null,
      onerror: null
    };
  }
}

// src/services/PersistenceService.js
var STORAGE_KEYS = {
  inputMode: "practice-input-mode",
  showRomajiHint: "practice-show-hint",
  jlptFilter: "practice-jlpt-filter"
};

class PersistenceService {
  #storage;
  constructor(storage = null) {
    this.#storage = storage || (typeof localStorage !== "undefined" ? localStorage : null);
  }
  load() {
    if (!this.#storage)
      return null;
    try {
      const inputMode = this.#storage.getItem(STORAGE_KEYS.inputMode);
      const showRomajiHint = this.#storage.getItem(STORAGE_KEYS.showRomajiHint);
      const jlptFilter = this.#storage.getItem(STORAGE_KEYS.jlptFilter);
      return {
        inputMode: inputMode || "romaji",
        showRomajiHint: showRomajiHint !== "false",
        filters: {
          jlpt: jlptFilter || "all"
        }
      };
    } catch (error) {
      console.warn("Failed to load settings from localStorage:", error);
      return null;
    }
  }
  save(settings) {
    if (!this.#storage)
      return;
    try {
      if (settings.inputMode !== undefined) {
        this.#storage.setItem(STORAGE_KEYS.inputMode, settings.inputMode);
      }
      if (settings.showRomajiHint !== undefined) {
        this.#storage.setItem(STORAGE_KEYS.showRomajiHint, settings.showRomajiHint ? "true" : "false");
      }
      if (settings.filters?.jlpt !== undefined) {
        this.#storage.setItem(STORAGE_KEYS.jlptFilter, settings.filters.jlpt);
      }
    } catch (error) {
      console.warn("Failed to save settings to localStorage:", error);
    }
  }
  clear() {
    if (!this.#storage)
      return;
    try {
      Object.values(STORAGE_KEYS).forEach((key) => {
        this.#storage.removeItem(key);
      });
    } catch (error) {
      console.warn("Failed to clear settings from localStorage:", error);
    }
  }
  get(key) {
    if (!this.#storage)
      return null;
    const storageKey = STORAGE_KEYS[key];
    if (!storageKey)
      return null;
    try {
      return this.#storage.getItem(storageKey);
    } catch (error) {
      return null;
    }
  }
  set(key, value) {
    if (!this.#storage)
      return;
    const storageKey = STORAGE_KEYS[key];
    if (!storageKey)
      return;
    try {
      this.#storage.setItem(storageKey, value);
    } catch (error) {
      console.warn(`Failed to save ${key} to localStorage:`, error);
    }
  }
}

// src/App.js
init_EventTypes();

class App {
  #store;
  #elements;
  #renderers = {};
  #inputHandler = null;
  #inputHandlerFactory;
  #currentSession = null;
  #flashEffect;
  #persistence;
  #keyboardRenderer;
  #questionLoader;
  constructor(elements) {
    this.#elements = elements;
    this.#store = new Store(appReducer, initialState);
    this.#questionLoader = new QuestionLoader;
    const speechService = new SpeechService;
    this.#persistence = new PersistenceService;
    modeRegistry.setDependencies({
      store: this.#store,
      questionLoader: this.#questionLoader,
      speechService
    });
    this.#setupRenderers();
    this.#keyboardRenderer = new KeyboardRenderer(elements.keyboardContainer);
    this.#inputHandlerFactory = new InputHandlerFactory({
      keyboardRenderer: this.#keyboardRenderer,
      mobileInputElement: elements.mobileInputElement
    });
    this.#flashEffect = new FlashEffect(elements.textContainer);
    this.#subscribeToStore();
  }
  #setupRenderers() {
    this.#renderers.text = new TextRenderer(this.#elements.textContainer);
    this.#renderers.romaji = new RomajiRenderer(this.#elements.romajiContainer);
    this.#renderers.result = new ResultRenderer(this.#elements.resultContainer, this.#detectBasePath());
  }
  #detectBasePath() {
    if (typeof window === "undefined")
      return "";
    const pathname = window.location.pathname;
    const match = pathname.match(/^(.*?)\/[^\/]+\/?$/);
    return match ? match[1] : "";
  }
  #subscribeToStore() {
    this.#store.subscribe((state, action) => {
      this.#handleStateChange(state, action);
    });
  }
  #handleStateChange(state, action) {
    switch (action.type) {
      case "COMPLETE_SESSION":
        this.#showResult(state.result, state.currentQuestion);
        break;
      case "TOGGLE_ROMAJI_HINT":
        this.#updateHintVisibility(state.uiSettings.showRomajiHint);
        break;
      case "TOGGLE_KEYBOARD":
        this.#updateKeyboardVisibility(state.uiSettings.showKeyboard);
        break;
    }
  }
  async initialize() {
    const savedSettings = this.#persistence.load();
    if (savedSettings) {
      if (savedSettings.inputMode && savedSettings.inputMode !== "romaji") {
        this.#store.dispatch(actions.setInputMode(savedSettings.inputMode));
      }
      if (savedSettings.filters?.jlpt) {
        this.#store.dispatch(actions.setFilter("jlpt", savedSettings.filters.jlpt));
      }
      if (savedSettings.showRomajiHint === false) {
        this.#store.dispatch(actions.toggleRomajiHint());
      }
      if (savedSettings.showKeyboard === false) {
        this.#store.dispatch(actions.toggleKeyboard());
      }
    }
    const urlParams = this.#getUrlParams();
    if (urlParams.input === "direct" || urlParams.input === "mobile") {
      this.#store.dispatch(actions.setInputMode("direct"));
    }
    if (urlParams.text) {
      await this.#startWithText(urlParams.text);
    } else {
      const modeId = urlParams.mode === "kana" ? "kana" : "question";
      await this.switchPracticeMode(modeId);
    }
    this.#applyUISettings();
  }
  #getUrlParams() {
    if (typeof window === "undefined")
      return {};
    const params = new URLSearchParams(window.location.search);
    return {
      text: params.get("text"),
      mode: params.get("mode"),
      input: params.get("input")
    };
  }
  async#startWithText(text) {
    const { Question: Question2 } = await Promise.resolve().then(() => (init_Question(), exports_Question));
    const question = Question2.fromText(text);
    this.#store.dispatch(actions.loadQuestionSuccess({ text }));
    this.#startSession(question);
  }
  async switchPracticeMode(modeId) {
    try {
      this.#store.dispatch(actions.setPracticeMode(modeId));
      await modeRegistry.switchMode(modeId);
      await this.loadNextQuestion();
    } catch (error) {
      console.error("Switch mode failed:", error);
      this.#store.dispatch(actions.loadQuestionFailure(error.message));
    }
  }
  switchInputMode(mode) {
    this.#store.dispatch(actions.setInputMode(mode));
    this.#persistence.save({ inputMode: mode });
    this.#updateUrlParam("input", mode === "direct" ? "direct" : null);
    this.#updateInputModeUI(mode);
    this.loadNextQuestion();
  }
  setFilter(key, value) {
    this.#store.dispatch(actions.setFilter(key, value));
    this.#persistence.save({ filters: { [key]: value } });
    this.loadNextQuestion();
  }
  toggleRomajiHint() {
    this.#store.dispatch(actions.toggleRomajiHint());
    const state = this.#store.getState();
    this.#persistence.save({ showRomajiHint: state.uiSettings.showRomajiHint });
  }
  toggleKeyboard() {
    const state = this.#store.getState();
    if (state.inputMode === "romaji") {
      this.#store.dispatch(actions.toggleKeyboard());
      const newState = this.#store.getState();
      this.#persistence.save({ showKeyboard: newState.uiSettings.showKeyboard });
    }
  }
  async loadNextQuestion() {
    const mode = modeRegistry.getCurrentMode();
    if (!mode)
      return;
    this.#cleanupCurrentSession();
    try {
      this.#store.dispatch(actions.startLoading());
      this.#renderers.result.hide();
      const question = await mode.loadNextQuestion();
      this.#startSession(question);
    } catch (error) {
      console.error("Load question failed:", error);
      this.#store.dispatch(actions.loadQuestionFailure(error.message));
    }
  }
  #startSession(question) {
    const mode = modeRegistry.getCurrentMode();
    const session = mode ? mode.createSession(question) : this.#createDefaultSession(question);
    this.#currentSession = session;
    if (mode) {
      mode.setupSessionListeners(session);
    }
    session.on(SessionEventTypes.CHARACTER_COMPLETED, () => {
      this.#flashEffect.flashSuccess();
      this.#render();
    });
    session.on(SessionEventTypes.CHARACTER_MISTAKEN, () => {
      this.#flashEffect.flashError();
    });
    session.on(SessionEventTypes.ROMAJI_MATCHED, (e) => {
      this.#updateBufferDisplay(e.romaji);
    });
    if (!mode) {
      session.on(SessionEventTypes.SESSION_COMPLETED, (e) => {
        this.#store.dispatch(actions.completeSession(e));
      });
    }
    this.#switchInputHandler(this.#store.getState().inputMode);
    this.#render();
  }
  async#createDefaultSession(question) {
    const { TypingSession: TypingSession2 } = await Promise.resolve().then(() => (init_TypingSession(), exports_TypingSession));
    return new TypingSession2(question);
  }
  #cleanupCurrentSession() {
    if (this.#inputHandler) {
      this.#inputHandler.dispose();
      this.#inputHandler = null;
    }
    this.#currentSession = null;
  }
  #switchInputHandler(mode) {
    if (this.#inputHandler) {
      this.#inputHandler.dispose();
    }
    this.#inputHandler = this.#inputHandlerFactory.create(mode);
    this.#inputHandler.setSession(this.#currentSession);
    this.#inputHandler.setUpdateCallback(() => this.#render());
    this.#inputHandler.activate();
    this.#updateInputModeUI(mode);
  }
  #updateInputModeUI(mode) {
    const container = this.#elements.container;
    const body = typeof document !== "undefined" ? document.body : null;
    const inputSection = typeof document !== "undefined" ? document.getElementById("mobile-input-section") : null;
    if (mode === "direct") {
      container?.classList.add("mode-direct");
      body?.classList.add("mode-direct");
      if (inputSection)
        inputSection.style.display = "block";
      this.#updateKeyboardVisibility(false);
    } else {
      container?.classList.remove("mode-direct");
      body?.classList.remove("mode-direct");
      if (inputSection)
        inputSection.style.display = "none";
      const state = this.#store.getState();
      this.#updateKeyboardVisibility(state.uiSettings.showKeyboard);
    }
  }
  #updateKeyboardVisibility(show) {
    const keyboard = this.#elements.keyboardContainer;
    if (keyboard) {
      keyboard.style.display = show ? "" : "none";
    }
  }
  #updateHintVisibility(show) {
    const container = this.#elements.container;
    if (container) {
      container.classList.toggle("hide-romaji-hint", !show);
    }
  }
  #applyUISettings() {
    const state = this.#store.getState();
    this.#updateHintVisibility(state.uiSettings.showRomajiHint);
    this.#updateInputModeUI(state.inputMode);
  }
  #render() {
    if (!this.#currentSession)
      return;
    const state = this.#store.getState();
    const question = this.#currentSession.question;
    this.#renderers.text.render(question, state.currentQuestion);
    this.#renderers.romaji.render(question);
    if (this.#inputHandler?.updateHighlight) {
      this.#inputHandler.updateHighlight();
    }
  }
  #updateBufferDisplay(value) {
    const buffer = this.#elements.bufferDisplay;
    if (buffer) {
      buffer.textContent = value;
    }
  }
  #showResult(stats, questionData) {
    this.#renderers.result.setNextQuestionCallback(() => this.loadNextQuestion());
    this.#renderers.result.render(stats, questionData);
  }
  #updateUrlParam(key, value) {
    if (typeof window === "undefined")
      return;
    const url = new URL(window.location);
    if (value) {
      url.searchParams.set(key, value);
    } else {
      url.searchParams.delete(key);
    }
    window.history.replaceState({}, "", url);
  }
  getStore() {
    return this.#store;
  }
  getState() {
    return this.#store.getState();
  }
  getQuestionLoader() {
    return this.#questionLoader;
  }
  dispose() {
    this.#cleanupCurrentSession();
    Object.values(this.#renderers).forEach((r) => r.dispose?.());
    modeRegistry.reset();
  }
}

// src/main.js
var app = null;
function createControlPanel(appInstance) {
  const container = document.querySelector(".practice-container");
  if (!container)
    return;
  if (document.getElementById("practice-controls"))
    return;
  const state = appInstance.getState();
  const inputModeText = state.inputMode === "romaji" ? i18n.t("mobileMode") : i18n.t("keyboardMode");
  const hintBtnText = state.uiSettings.showRomajiHint ? i18n.t("hideHint") : i18n.t("showHint");
  const practiceModeText = state.practiceMode === "question" ? i18n.t("kanaMode") : i18n.t("questionMode");
  const jlptDisplayStyle = state.practiceMode === "kana" ? "none" : "";
  const currentLang = i18n.getLanguage();
  const langOptions = i18n.getSupportedLanguages().map((lang) => {
    const selected = lang === currentLang ? "selected" : "";
    return `<option value="${lang}" ${selected}>${i18n.getLanguageName(lang)}</option>`;
  }).join("");
  const controlPanel = document.createElement("div");
  controlPanel.id = "practice-controls";
  controlPanel.className = "practice-controls" + (state.practiceMode === "kana" ? " controls-centered" : "");
  controlPanel.innerHTML = `
    <div class="control-group" id="jlpt-filter-group" style="display: ${jlptDisplayStyle}">
      <label for="jlpt-filter">${i18n.t("jlptLabel")}</label>
      <select id="jlpt-filter">
        <option value="all">${i18n.t("jlptAll")}</option>
        <option value="n5">N5</option>
        <option value="n4">N4</option>
        <option value="n3">N3</option>
        <option value="n2">N2</option>
        <option value="n1">N1</option>
      </select>
    </div>
    <div class="control-group">
      <button id="btn-next" class="control-btn">${i18n.t("nextQuestion")}</button>
      <button id="btn-toggle-practice" class="control-btn secondary">${practiceModeText}</button>
      <button id="btn-toggle-input" class="control-btn secondary">${inputModeText}</button>
      <button id="btn-toggle-hint" class="control-btn secondary">${hintBtnText}</button>
      <select id="lang-selector" class="lang-selector">${langOptions}</select>
    </div>
  `;
  const practiceArea = container.querySelector(".practice-area") || container.firstChild;
  container.insertBefore(controlPanel, practiceArea);
  bindControlPanelEvents(appInstance);
}
function bindControlPanelEvents(appInstance) {
  const jlptFilter = document.getElementById("jlpt-filter");
  if (jlptFilter) {
    const state = appInstance.getState();
    jlptFilter.value = state.filters.jlpt;
    jlptFilter.addEventListener("change", (e) => {
      appInstance.setFilter("jlpt", e.target.value);
    });
  }
  const nextBtn = document.getElementById("btn-next");
  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      appInstance.loadNextQuestion();
    });
  }
  const togglePracticeBtn = document.getElementById("btn-toggle-practice");
  if (togglePracticeBtn) {
    togglePracticeBtn.addEventListener("click", () => {
      const state = appInstance.getState();
      const newMode = state.practiceMode === "question" ? "kana" : "question";
      appInstance.switchPracticeMode(newMode);
      togglePracticeBtn.textContent = newMode === "question" ? i18n.t("kanaMode") : i18n.t("questionMode");
      const jlptGroup = document.getElementById("jlpt-filter-group");
      const controls = document.getElementById("practice-controls");
      if (jlptGroup) {
        jlptGroup.style.display = newMode === "kana" ? "none" : "";
      }
      if (controls) {
        controls.classList.toggle("controls-centered", newMode === "kana");
      }
    });
  }
  const toggleInputBtn = document.getElementById("btn-toggle-input");
  if (toggleInputBtn) {
    toggleInputBtn.addEventListener("click", () => {
      const state = appInstance.getState();
      const newMode = state.inputMode === "romaji" ? "direct" : "romaji";
      appInstance.switchInputMode(newMode);
      toggleInputBtn.textContent = newMode === "romaji" ? i18n.t("mobileMode") : i18n.t("keyboardMode");
    });
  }
  const toggleHintBtn = document.getElementById("btn-toggle-hint");
  if (toggleHintBtn) {
    toggleHintBtn.addEventListener("click", () => {
      appInstance.toggleRomajiHint();
      const state = appInstance.getState();
      toggleHintBtn.textContent = state.uiSettings.showRomajiHint ? i18n.t("hideHint") : i18n.t("showHint");
    });
  }
  const langSelector = document.getElementById("lang-selector");
  if (langSelector) {
    langSelector.addEventListener("change", (e) => {
      i18n.setLanguage(e.target.value);
      location.reload();
    });
  }
}
function updateStaticTexts() {
  document.title = `${i18n.t("pageTitle")} | ${i18n.t("siteName")}`;
  const backLink = document.querySelector(".back-link");
  if (backLink) {
    backLink.textContent = i18n.t("backToCards");
  }
  const mobileNotice = document.querySelector(".mobile-notice p");
  if (mobileNotice) {
    mobileNotice.textContent = i18n.t("mobileNotice");
  }
  const backBtn = document.querySelector(".mobile-notice .back-btn");
  if (backBtn) {
    backBtn.textContent = i18n.t("backButton");
  }
  const practiceTitle = document.querySelector(".practice-title");
  if (practiceTitle) {
    practiceTitle.textContent = i18n.t("pageTitle");
  }
  const mobileInput = document.getElementById("mobile-kana-input");
  if (mobileInput) {
    mobileInput.placeholder = i18n.t("mobileInputPlaceholder");
  }
  const mobileInputHint = document.querySelector(".mobile-input-hint");
  if (mobileInputHint) {
    mobileInputHint.textContent = i18n.t("mobileInputHint");
  }
  const footerHint = document.querySelector(".practice-footer .hint");
  if (footerHint) {
    footerHint.textContent = i18n.t("inputHint");
  }
  document.documentElement.lang = i18n.getLanguage();
}
function showLoading(textContainer) {
  if (textContainer) {
    textContainer.innerHTML = `<span class="loading">${i18n.t("loadingQuestions")}</span>`;
  }
}
function showError(textContainer, message) {
  if (textContainer) {
    textContainer.innerHTML = `
      <div class="error-message">
        <p>${message}</p>
        <button onclick="location.reload()">${i18n.t("reload")}</button>
      </div>
    `;
  }
}
async function init() {
  updateStaticTexts();
  const textContainer = document.getElementById("practice-text");
  const romajiContainer = document.getElementById("practice-romaji");
  const keyboardContainer = document.getElementById("keyboard");
  const container = document.querySelector(".practice-container");
  if (!textContainer || !romajiContainer || !keyboardContainer) {
    console.error("找不到必要的 DOM 元素");
    return;
  }
  let resultContainer = document.getElementById("result-container");
  if (!resultContainer) {
    resultContainer = document.createElement("div");
    resultContainer.id = "result-container";
    resultContainer.className = "result-container";
    resultContainer.style.display = "none";
    container?.appendChild(resultContainer);
  }
  let bufferDisplay = document.getElementById("buffer-display");
  if (!bufferDisplay) {
    bufferDisplay = document.createElement("div");
    bufferDisplay.id = "buffer-display";
    bufferDisplay.className = "buffer-display";
    romajiContainer.parentNode?.insertBefore(bufferDisplay, romajiContainer.nextSibling);
  }
  const mobileInputElement = document.getElementById("mobile-kana-input");
  showLoading(textContainer);
  try {
    app = new App({
      container,
      textContainer,
      romajiContainer,
      resultContainer,
      bufferDisplay,
      keyboardContainer,
      mobileInputElement
    });
    await app.initialize();
    createControlPanel(app);
    console.log("應用程式初始化完成");
  } catch (error) {
    console.error("應用程式初始化失敗:", error);
    showError(textContainer, i18n.t("initFailed"));
  }
  if (typeof window !== "undefined") {
    window.__app = app;
  }
}
if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
}
export {
  init,
  app
};
