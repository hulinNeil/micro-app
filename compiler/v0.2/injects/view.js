export const createElement = window.core.createElement;
export const __AppCssCode__ = (window.__AppCssCode__ = {});
export const __AppTemplateCode__ = {};

const BASE_DEVICE_WIDTH = 750;
var deviceWidth = window.innerWidth || 375;

const rpx2px = (rpx) => {
  if (rpx === 0) {
    return 0;
  }
  rpx = (rpx / BASE_DEVICE_WIDTH) * deviceWidth;
  rpx = Math.floor(rpx);
  return rpx;
};

// 将 style 插入到对应的 page 中
export const setCssToHead = (word, path) => {
  return (parentEl) => {
    var cssText = '';
    var style = document.createElement('style');
    var head = document.head || document.getElementsByTagName('head')[0];
    word.forEach(function (text) {
      if (typeof text === 'number') {
        cssText += rpx2px(text) + 'px';
      } else if (typeof text === 'string') {
        cssText += text;
      }
    });
    if (cssText) {
      style.setAttribute('path', path);
      style.appendChild(document.createTextNode(cssText));
      if (parentEl && parentEl.children[0]) {
        parentEl.insertBefore(style, parentEl.children[0]);
      } else {
        head.appendChild(style);
      }
    }
  };
};

export const _concat = (...arg) => {
  return ''.concat(...arg);
};

export const __renderTemplate = (pageVariable, data) => {
  if (!__AppTemplateCode__[pageVariable]) {
    throw new Error(`Can not use template when not import ${pageVariable.split('_')[1]}.`);
  }
  return __AppTemplateCode__[pageVariable](data);
};
