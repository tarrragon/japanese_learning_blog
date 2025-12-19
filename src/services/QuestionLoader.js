/**
 * QuestionLoader - 題目載入服務
 *
 * 從靜態 JSON 檔案載入題庫，支援漸進式載入和篩選功能
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

/**
 * @typedef {Object} BundleInfo
 * @property {string} path - 檔案路徑
 * @property {number} count - 題目數量
 * @property {string[]} [jlpt] - 包含的 JLPT 等級
 * @property {string} [description] - 描述
 */

/**
 * @typedef {Object} QuestionIndex
 * @property {string} version - 版本
 * @property {string} generated - 產生時間
 * @property {Object.<string, BundleInfo>} bundles - 分包資訊
 * @property {Object} stats - 統計資訊
 */

export class QuestionLoader {
  /**
   * @param {string} [dataUrl] - 題庫檔案路徑（預設自動偵測）
   */
  constructor(dataUrl) {
    // 自動偵測 baseURL（支援子目錄部署如 GitHub Pages）
    if (!dataUrl) {
      const pathname = window.location.pathname;
      const match = pathname.match(/^(.*?)\/[^\/]+\/?$/);
      const basePath = match ? match[1] : '';
      dataUrl = `${basePath}/data/questions.json`;
    }
    this.dataUrl = dataUrl;
    this.basePath = this.dataUrl.replace(/\/[^\/]+$/, '');

    /** @type {QuestionBank|null} */
    this.questionBank = null;
    /** @type {QuestionIndex|null} */
    this.index = null;
    /** @type {Set<string>} */
    this.loadedBundles = new Set();
    /** @type {Map<string, Promise<void>>} */
    this.loadingPromises = new Map();
    /** @type {Set<string>} */
    this.recentIds = new Set();
    this.maxRecentHistory = 10;
    /** @type {boolean} */
    this.useProgressiveLoading = false;
  }

  /**
   * 載入索引檔
   * @returns {Promise<QuestionIndex|null>}
   */
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
      console.log('索引檔不存在，使用傳統載入模式');
      return null;
    }
  }

  /**
   * 載入初始分包（快速啟動）
   * @returns {Promise<QuestionBank>}
   */
  async loadInitial() {
    // 嘗試載入索引
    const index = await this.loadIndex();

    if (index) {
      // 使用漸進式載入
      this.useProgressiveLoading = true;

      // 初始化 questionBank
      this.questionBank = {
        version: index.version,
        generated: index.generated,
        questions: [],
        stats: index.stats,
      };

      // 載入初始包
      await this.loadBundle('init');
      console.log(`初始載入完成: ${this.questionBank.questions.length} 題`);

      return this.questionBank;
    }

    // 回退到傳統模式
    return this.loadLegacy();
  }

  /**
   * 載入指定分包
   * @param {string} bundleKey - 分包名稱 (init, n5, n4, n3, n2)
   * @returns {Promise<void>}
   */
  async loadBundle(bundleKey) {
    // 已載入則跳過
    if (this.loadedBundles.has(bundleKey)) {
      return;
    }

    // 正在載入則等待
    if (this.loadingPromises.has(bundleKey)) {
      return this.loadingPromises.get(bundleKey);
    }

    if (!this.index) {
      throw new Error('索引檔尚未載入');
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

  /**
   * 合併題目（去重）
   * @param {Question[]} newQuestions
   */
  mergeQuestions(newQuestions) {
    if (!this.questionBank) {
      return;
    }

    const existingIds = new Set(this.questionBank.questions.map(q => q.id));
    const uniqueNew = newQuestions.filter(q => !existingIds.has(q.id));
    this.questionBank.questions.push(...uniqueNew);
  }

  /**
   * 背景載入剩餘分包
   * @param {string[]} priority - 優先載入順序
   */
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

  /**
   * 檢查指定等級是否已載入
   * @param {string} jlpt - JLPT 等級
   * @returns {boolean}
   */
  isLevelLoaded(jlpt) {
    return this.loadedBundles.has(jlpt);
  }

  /**
   * 取得載入狀態
   * @returns {{loadedBundles: string[], totalQuestions: number, isFullyLoaded: boolean}}
   */
  getLoadingStatus() {
    const bundleCount = this.index ? Object.keys(this.index.bundles).length : 1;
    return {
      loadedBundles: [...this.loadedBundles],
      totalQuestions: this.questionBank?.questions.length || 0,
      isFullyLoaded: this.loadedBundles.size >= bundleCount,
    };
  }

  /**
   * 傳統載入（完整檔案）
   * @returns {Promise<QuestionBank>}
   */
  async loadLegacy() {
    try {
      const response = await fetch(this.dataUrl);

      if (!response.ok) {
        throw new Error(`載入題庫失敗: ${response.status} ${response.statusText}`);
      }

      this.questionBank = await response.json();
      this.loadedBundles.add('legacy');
      console.log(`題庫載入完成（傳統模式）: ${this.questionBank.questions.length} 題`);

      return this.questionBank;
    } catch (error) {
      console.error('題庫載入錯誤:', error);
      throw error;
    }
  }

  /**
   * 載入題庫（自動選擇模式）
   * @returns {Promise<QuestionBank>}
   */
  async load() {
    if (this.questionBank) {
      return this.questionBank;
    }

    // 嘗試漸進式載入
    return this.loadInitial();
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
