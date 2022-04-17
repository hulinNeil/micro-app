import * as fs from 'fs-extra';
import { resolveApp } from '../utils';

const serviceFile = resolveApp('dist/service-test.js');
const viewFile = resolveApp('dist/frames-test.js');
const configFile = resolveApp('dist/app-config.js');

export const generateServiceFile = (data: Object) => {
  let fileStr = '';
  for (const key in data) {
    if (data[key]) {
      fileStr += data[key];
    }
  }
  fileStr += `\nrequire('app.js');\n initApp();`;
  fs.outputFileSync(serviceFile, fileStr);
};

export const generateConfigFile = (data: { [key: string]: any }) => {
  data.entryPagePath = data.entryPagePath ? data.entryPagePath : data.pages[0];
  data.global = { window: data.window };
  delete data.window;
  const fileStr = `window.__wxConfig = ${JSON.stringify(data)}`;
  fs.outputFileSync(configFile, fileStr);
};

const test = `

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

const setCssToHead = (word, path) => {
  return () => {
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
      head.appendChild(style);
    }
  };
};
`;

export const generateFrameFile = (data: { [key: string]: { moduleName: string; code: string } }, styles: { [key: string]: string }) => {
  let fileStr = `
var createElement = window.core.createElement;
var __AppCssCode__ = {};
  `;
  const pages = [];
  for (const key in data) {
    const page = data[key];
    if (page) {
      fileStr += page.code;
      pages.push(`${JSON.stringify(key)}:{render: ${page.moduleName}}`);
    }
  }
  fileStr += `window.app = {${pages.join(',')}}`;
  fileStr += test;

  for (const key in styles) {
    const style = styles[key];
    if (style) {
      fileStr += `__AppCssCode__['${key}'] = ${style};\n`;
    }
  }

  fs.outputFileSync(viewFile, fileStr);
};
