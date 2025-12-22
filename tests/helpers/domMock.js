/**
 * DOM Element Mock Factory
 *
 * 提供模擬 DOM 元素的工具
 * 用於測試渲染器和 UI 元件
 */

/**
 * 建立模擬的 classList
 * @returns {Object}
 */
export function createMockClassList() {
  const classes = new Set();
  return {
    _classes: classes,
    add(...names) {
      names.forEach((n) => classes.add(n));
    },
    remove(...names) {
      names.forEach((n) => classes.delete(n));
    },
    contains(name) {
      return classes.has(name);
    },
    toggle(name, force) {
      if (force !== undefined) {
        if (force) {
          classes.add(name);
          return true;
        } else {
          classes.delete(name);
          return false;
        }
      }
      if (classes.has(name)) {
        classes.delete(name);
        return false;
      }
      classes.add(name);
      return true;
    },
    get length() {
      return classes.size;
    },
    item(index) {
      return [...classes][index] ?? null;
    },
    toString() {
      return [...classes].join(' ');
    },
  };
}

/**
 * 建立模擬的 DOM 元素
 * @param {string} tagName - 標籤名稱
 * @returns {Object}
 */
export function createMockElement(tagName = 'div') {
  const children = [];
  const eventListeners = new Map();

  return {
    tagName: tagName.toUpperCase(),
    innerHTML: '',
    textContent: '',
    innerText: '',
    style: {
      display: '',
      transform: '',
      opacity: '',
      visibility: '',
    },
    classList: createMockClassList(),
    parentElement: null,
    children,
    childNodes: children,

    querySelector(selector) {
      return null;
    },
    querySelectorAll(selector) {
      return [];
    },
    getElementById(id) {
      return null;
    },
    getElementsByClassName(className) {
      return [];
    },
    getElementsByTagName(tagName) {
      return [];
    },

    appendChild(child) {
      children.push(child);
      child.parentElement = this;
      return child;
    },
    removeChild(child) {
      const index = children.indexOf(child);
      if (index > -1) {
        children.splice(index, 1);
        child.parentElement = null;
      }
      return child;
    },
    insertBefore(newChild, refChild) {
      const index = children.indexOf(refChild);
      if (index > -1) {
        children.splice(index, 0, newChild);
      } else {
        children.push(newChild);
      }
      newChild.parentElement = this;
      return newChild;
    },

    addEventListener(event, handler) {
      if (!eventListeners.has(event)) {
        eventListeners.set(event, []);
      }
      eventListeners.get(event).push(handler);
    },
    removeEventListener(event, handler) {
      if (eventListeners.has(event)) {
        const handlers = eventListeners.get(event);
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    },
    dispatchEvent(event) {
      const handlers = eventListeners.get(event.type) || [];
      handlers.forEach((h) => h(event));
      return true;
    },

    focus() {},
    blur() {},
    click() {},

    getAttribute(name) {
      return this[`_attr_${name}`] ?? null;
    },
    setAttribute(name, value) {
      this[`_attr_${name}`] = String(value);
    },
    removeAttribute(name) {
      delete this[`_attr_${name}`];
    },
    hasAttribute(name) {
      return `_attr_${name}` in this;
    },

    getBoundingClientRect() {
      return {
        top: 0,
        left: 0,
        right: 800,
        bottom: 600,
        width: 800,
        height: 600,
        x: 0,
        y: 0,
      };
    },
  };
}

/**
 * 建立模擬的 document
 * @returns {Object}
 */
export function createMockDocument() {
  const body = createMockElement('body');
  const eventListeners = new Map();

  return {
    body,
    documentElement: createMockElement('html'),

    createElement(tagName) {
      return createMockElement(tagName);
    },
    createTextNode(text) {
      return { nodeType: 3, textContent: text };
    },

    getElementById(id) {
      return null;
    },
    querySelector(selector) {
      return null;
    },
    querySelectorAll(selector) {
      return [];
    },
    getElementsByClassName(className) {
      return [];
    },
    getElementsByTagName(tagName) {
      return [];
    },

    addEventListener(event, handler) {
      if (!eventListeners.has(event)) {
        eventListeners.set(event, []);
      }
      eventListeners.get(event).push(handler);
    },
    removeEventListener(event, handler) {
      if (eventListeners.has(event)) {
        const handlers = eventListeners.get(event);
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    },

    activeElement: null,
  };
}

/**
 * 建立 App 測試用的完整 DOM 元素集
 * @returns {Object}
 */
export function createMockAppElements() {
  return {
    container: createMockElement('div'),
    textContainer: createMockElement('div'),
    romajiContainer: createMockElement('div'),
    resultContainer: createMockElement('div'),
    bufferDisplay: createMockElement('span'),
    keyboardContainer: createMockElement('div'),
    mobileInputElement: createMockElement('input'),
  };
}

/**
 * 建立 UI 測試用的 DOM 結構
 * 模擬所有受模式影響的 UI 元件
 * @returns {Object}
 */
export function createMockUIDOM() {
  return {
    container: {
      classList: createMockClassList(),
    },
    body: {
      classList: createMockClassList(),
    },
    mobileInputSection: {
      style: { display: 'none' },
    },
    keyboard: {
      style: { display: '' },
    },
    romajiWrapper: {
      style: { display: '' },
    },
  };
}
