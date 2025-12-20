/**
 * ModeRegistry - 模式註冊表
 *
 * 管理所有練習模式的註冊和切換
 */

import { QuestionMode } from './QuestionMode.js';
import { KanaMode } from './KanaMode.js';

class ModeRegistryClass {
  #modes = new Map();
  #currentMode = null;
  #dependencies = null;

  constructor() {
    // 註冊內建模式
    this.register(QuestionMode);
    this.register(KanaMode);
  }

  /**
   * 註冊新模式
   * @param {typeof import('./PracticeMode.js').PracticeMode} ModeClass - 模式類別
   */
  register(ModeClass) {
    if (!ModeClass.id) {
      throw new Error('Mode class must have a static id property');
    }
    this.#modes.set(ModeClass.id, ModeClass);
  }

  /**
   * 取消註冊模式
   * @param {string} modeId - 模式識別碼
   */
  unregister(modeId) {
    this.#modes.delete(modeId);
  }

  /**
   * 設定依賴注入
   * @param {Object} dependencies
   * @param {import('../store/Store.js').Store} dependencies.store
   * @param {import('../services/QuestionLoader.js').QuestionLoader} dependencies.questionLoader
   * @param {import('../services/SpeechService.js').SpeechService} dependencies.speechService
   */
  setDependencies(dependencies) {
    this.#dependencies = dependencies;
  }

  /**
   * 取得所有可用模式
   * @returns {Array<{id: string, displayName: string, description: string}>}
   */
  getAvailableModes() {
    return Array.from(this.#modes.values()).map((ModeClass) => ({
      id: ModeClass.id,
      displayName: ModeClass.displayName,
      description: ModeClass.description,
    }));
  }

  /**
   * 檢查模式是否存在
   * @param {string} modeId
   * @returns {boolean}
   */
  hasMode(modeId) {
    return this.#modes.has(modeId);
  }

  /**
   * 取得模式類別
   * @param {string} modeId
   * @returns {typeof import('./PracticeMode.js').PracticeMode | undefined}
   */
  getModeClass(modeId) {
    return this.#modes.get(modeId);
  }

  /**
   * 切換到指定模式
   * @param {string} modeId - 模式識別碼
   * @returns {Promise<import('./PracticeMode.js').PracticeMode>}
   */
  async switchMode(modeId) {
    if (!this.#dependencies) {
      throw new Error('Dependencies not set. Call setDependencies() first.');
    }

    // 清理舊模式
    if (this.#currentMode) {
      this.#currentMode.dispose();
      this.#currentMode = null;
    }

    const ModeClass = this.#modes.get(modeId);
    if (!ModeClass) {
      throw new Error(`Unknown mode: ${modeId}`);
    }

    // 建立新模式實例
    this.#currentMode = new ModeClass(this.#dependencies);
    await this.#currentMode.initialize();

    return this.#currentMode;
  }

  /**
   * 取得當前模式
   * @returns {import('./PracticeMode.js').PracticeMode | null}
   */
  getCurrentMode() {
    return this.#currentMode;
  }

  /**
   * 取得當前模式 ID
   * @returns {string | null}
   */
  getCurrentModeId() {
    if (!this.#currentMode) return null;
    return this.#currentMode.constructor.id;
  }

  /**
   * 重置（用於測試）
   */
  reset() {
    if (this.#currentMode) {
      this.#currentMode.dispose();
      this.#currentMode = null;
    }
    this.#dependencies = null;
  }
}

// 匯出單例
export const modeRegistry = new ModeRegistryClass();

// 也匯出類別（用於測試）
export { ModeRegistryClass };
