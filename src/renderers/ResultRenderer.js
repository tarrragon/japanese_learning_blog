/**
 * ResultRenderer - 結果顯示渲染器
 *
 * 負責顯示練習完成後的結果統計
 */

export class ResultRenderer {
  #container;
  #basePath;
  #onNextQuestion = null;

  /**
   * @param {HTMLElement} container - 結果容器元素
   * @param {string} [basePath=''] - 網站根路徑（支援子目錄部署）
   */
  constructor(container, basePath = '') {
    this.#container = container;
    this.#basePath = basePath;
  }

  /**
   * 設定下一題回調
   * @param {Function} callback
   */
  setNextQuestionCallback(callback) {
    this.#onNextQuestion = callback;
  }

  /**
   * 顯示結果
   * @param {Object} stats - 統計資料
   * @param {number} stats.accuracy - 準確率 (0-1)
   * @param {number} stats.totalTime - 總時間（毫秒）
   * @param {number} stats.totalKeystrokes - 總按鍵數
   * @param {Object} [questionData] - 題目資料（用於顯示來源連結）
   */
  render(stats, questionData = null) {
    if (!this.#container) return;

    const accuracy = Math.round(stats.accuracy * 100);
    const timeInSeconds = (stats.totalTime / 1000).toFixed(1);

    // 來源連結
    let sourceLink = '';
    if (questionData?.source) {
      const fullPath = this.#basePath + questionData.source.path;
      sourceLink = `
        <a href="${fullPath}" class="source-link" target="_blank">
          查看來源卡片：${questionData.source.title} →
        </a>
      `;
    }

    // 下一題按鈕
    const nextButton = this.#onNextQuestion
      ? `<button class="next-btn" id="next-question-btn">下一題</button>`
      : '';

    this.#container.innerHTML = `
      <div class="result-box">
        <h2>完成！</h2>
        <div class="result-stats">
          <div class="stat">
            <span class="stat-value">${accuracy}%</span>
            <span class="stat-label">準確率</span>
          </div>
          <div class="stat">
            <span class="stat-value">${timeInSeconds}s</span>
            <span class="stat-label">時間</span>
          </div>
          <div class="stat">
            <span class="stat-value">${stats.totalKeystrokes}</span>
            <span class="stat-label">按鍵數</span>
          </div>
        </div>
        ${sourceLink}
        <div class="result-actions">
          ${nextButton}
          <button class="retry-btn" onclick="location.reload()">重新開始</button>
        </div>
      </div>
    `;

    this.#container.style.display = 'flex';
    this.#bindNextButton();
  }

  /**
   * 綁定下一題按鈕事件
   * @private
   */
  #bindNextButton() {
    if (!this.#onNextQuestion) return;

    const nextBtn = this.#container?.querySelector('#next-question-btn');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.#onNextQuestion());
    }
  }

  /**
   * 隱藏結果
   */
  hide() {
    if (this.#container) {
      this.#container.style.display = 'none';
    }
  }

  /**
   * 清理資源
   */
  dispose() {
    this.#onNextQuestion = null;
  }

  /**
   * 取得容器元素（用於測試）
   * @returns {HTMLElement | null}
   */
  getContainer() {
    return this.#container;
  }
}
