/**
 * QuestionLoader - 題目載入服務
 *
 * 從靜態 JSON 檔案載入題庫，提供隨機選取和篩選功能
 */

/**
 * @typedef {Object} QuestionSource
 * @property {string} path - 來源卡片路徑
 * @property {string} title - 卡片標題
 * @property {string} category - 分類
 * @property {string} jlpt - JLPT 等級
 */

/**
 * @typedef {Object} QuestionMetadata
 * @property {number} characterCount - 字元數
 * @property {string} difficulty - 難度 (easy/medium/hard)
 * @property {boolean} hasKanji - 是否包含漢字
 */

/**
 * @typedef {Object} QuestionCharacter
 * @property {string} display - 顯示文字
 * @property {string} kana - 假名讀音
 * @property {string[]} romaji - 可接受的羅馬字輸入
 */

/**
 * @typedef {Object} Question
 * @property {string} id - 題目 ID
 * @property {string} text - 題目文字
 * @property {QuestionCharacter[]} characters - 字元分解
 * @property {QuestionSource} source - 來源資訊
 * @property {QuestionMetadata} metadata - 元資料
 */

/**
 * @typedef {Object} QuestionBank
 * @property {string} version - 版本
 * @property {string} generated - 產生時間
 * @property {Question[]} questions - 題目列表
 * @property {Object} stats - 統計資訊
 */

export class QuestionLoader {
  /**
   * @param {string} [dataUrl] - 題庫檔案路徑（預設自動偵測）
   */
  constructor(dataUrl) {
    // 自動偵測 baseURL（支援子目錄部署如 GitHub Pages）
    if (!dataUrl) {
      // 從當前頁面 URL 推斷根路徑
      // 例如：/japanese_learning_blog/practice/ → /japanese_learning_blog/
      const pathname = window.location.pathname;
      // 找到 /practice/ 或類似的頁面路徑，取其父目錄
      const match = pathname.match(/^(.*?)\/[^\/]+\/?$/);
      const basePath = match ? match[1] : '';
      dataUrl = `${basePath}/data/questions.json`;
    }
    this.dataUrl = dataUrl;
    /** @type {QuestionBank|null} */
    this.questionBank = null;
    /** @type {Set<string>} */
    this.recentIds = new Set();
    this.maxRecentHistory = 10;
  }

  /**
   * 載入題庫
   * @returns {Promise<QuestionBank>}
   */
  async load() {
    if (this.questionBank) {
      return this.questionBank;
    }

    try {
      const response = await fetch(this.dataUrl);

      if (!response.ok) {
        throw new Error(`載入題庫失敗: ${response.status} ${response.statusText}`);
      }

      this.questionBank = await response.json();
      console.log(`題庫載入完成: ${this.questionBank.questions.length} 題`);

      return this.questionBank;
    } catch (error) {
      console.error('題庫載入錯誤:', error);
      throw error;
    }
  }

  /**
   * 檢查題庫是否已載入
   * @returns {boolean}
   */
  isLoaded() {
    return this.questionBank !== null;
  }

  /**
   * 取得所有題目
   * @returns {Question[]}
   */
  getAllQuestions() {
    return this.questionBank?.questions || [];
  }

  /**
   * 依條件篩選題目
   * @param {Object} [filters={}] - 篩選條件
   * @param {string} [filters.jlpt] - JLPT 等級 (n5, n4, n3, n2, n1)
   * @param {string} [filters.category] - 分類
   * @param {string} [filters.difficulty] - 難度
   * @returns {Question[]}
   */
  filterQuestions(filters = {}) {
    let questions = this.getAllQuestions();

    if (filters.jlpt && filters.jlpt !== 'all') {
      questions = questions.filter(q => q.source.jlpt === filters.jlpt);
    }

    if (filters.category && filters.category !== 'all') {
      questions = questions.filter(q => q.source.category === filters.category);
    }

    if (filters.difficulty && filters.difficulty !== 'all') {
      questions = questions.filter(q => q.metadata.difficulty === filters.difficulty);
    }

    return questions;
  }

  /**
   * 隨機選取一題
   * @param {Object} [filters={}] - 篩選條件
   * @returns {Question|null}
   */
  getRandomQuestion(filters = {}) {
    const questions = this.filterQuestions(filters);

    if (questions.length === 0) {
      return null;
    }

    // 過濾掉最近使用過的題目
    let available = questions.filter(q => !this.recentIds.has(q.id));

    // 如果所有題目都用過，重置歷史
    if (available.length === 0) {
      this.recentIds.clear();
      available = questions;
    }

    // 隨機選取
    const index = Math.floor(Math.random() * available.length);
    const selected = available[index];

    // 記錄已使用
    this.recentIds.add(selected.id);
    if (this.recentIds.size > this.maxRecentHistory) {
      const firstId = this.recentIds.values().next().value;
      this.recentIds.delete(firstId);
    }

    return selected;
  }

  /**
   * 依 ID 取得題目
   * @param {string} id - 題目 ID
   * @returns {Question|null}
   */
  getQuestionById(id) {
    return this.getAllQuestions().find(q => q.id === id) || null;
  }

  /**
   * 取得統計資訊
   * @returns {Object|null}
   */
  getStats() {
    return this.questionBank?.stats || null;
  }

  /**
   * 取得所有 JLPT 等級
   * @returns {string[]}
   */
  getJlptLevels() {
    const stats = this.getStats();
    if (!stats?.byJlpt) {
      return ['n5', 'n4', 'n3', 'n2', 'n1'];
    }
    return Object.keys(stats.byJlpt).sort();
  }

  /**
   * 取得所有分類
   * @returns {string[]}
   */
  getCategories() {
    const stats = this.getStats();
    if (!stats?.byCategory) {
      return [];
    }
    return Object.keys(stats.byCategory).sort();
  }

  /**
   * 重置歷史記錄
   */
  resetHistory() {
    this.recentIds.clear();
  }
}

// 建立預設實例
export const questionLoader = new QuestionLoader();
