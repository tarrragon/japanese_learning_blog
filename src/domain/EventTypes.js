/**
 * Session 事件類型常量
 *
 * 定義 TypingSession 發出的所有事件類型
 * 使用常量避免魔法字串，提高可維護性和 IDE 支援
 */

export const SessionEventTypes = {
  /** 使用者按下任意鍵 */
  KEY_PRESSED: 'KeyPressed',

  /** 輸入匹配部分或完整羅馬字 */
  ROMAJI_MATCHED: 'RomajiMatched',

  /** 完成一個假名字元 */
  CHARACTER_COMPLETED: 'CharacterCompleted',

  /** 輸入錯誤 */
  CHARACTER_MISTAKEN: 'CharacterMistaken',

  /** 需要朗讀字元 */
  SPEECH_REQUESTED: 'SpeechRequested',

  /** 完成整個練習題目 */
  SESSION_COMPLETED: 'SessionCompleted',
};

/**
 * 事件資料結構說明（供 TypeScript/JSDoc 參考）
 *
 * KeyPressed: { key: string, timestamp: number }
 * RomajiMatched: { romaji: string, isPartial: boolean }
 * CharacterCompleted: { character: Character, duration: number, skipped?: boolean }
 * CharacterMistaken: { expected: string[], actual: string }
 * SpeechRequested: { text: string }
 * SessionCompleted: { totalTime: number, accuracy: number, totalKeystrokes: number, mistakes: number }
 */
