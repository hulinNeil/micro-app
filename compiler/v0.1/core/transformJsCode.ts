import * as babel from '@babel/core';
import * as presetEnv from '@babel/preset-env';
import * as path from 'path';
import * as fs from 'fs-extra';
import transformRequireCode from '../plugins/transformRequireCode';
import getIdentifier from '../plugins/getIdentifier';

const generateJs = (path: string, code: string) => {
  /^\.\//.test(path) && (path = path.split('./')[1]);

  const result = `define("${path}", function(require, module, exports, window,document,frames,self,location,navigator,localStorage,history,Caches,screen,alert,confirm,prompt,fetch,XMLHttpRequest,WebSocket,webkit,ttJSCore,Reporter,print){${code}});\n`;
  return result;
};

const hasRequired: string[] = [];

/**
 * 根据路径，生成编译后的js文件,步骤:
 * 1. 根据path，生成ast
 * 2. 分析ast，得到该文件中引用了哪些外部js
 * 3. 先编译外部js在编译当前js
 */
export const transformJsCode = (currentPath: string, resolvePath: string) => {
  !/.js$/.test(currentPath) && (currentPath += '.js');

  if (hasRequired.includes(currentPath)) {
    return {};
  }

  const enterPath = path.resolve(resolvePath, /.js/.test(resolvePath) ? '../' : './', currentPath);
  const enterCode = fs.readFileSync(enterPath).toString();

  const result = {};
  const requireContents: string[] = [];
  const output = babel.transformSync(enterCode, { presets: [presetEnv], plugins: [transformRequireCode(requireContents)], filename: enterPath, sourceMaps:true });

  if (requireContents.length) {
    const childPath = path.join(currentPath, '../', requireContents[0]).replace(/\\/g, '/');
    Object.assign(result, transformJsCode(childPath, resolvePath));
  }

  if (output && output.code) {
    result[currentPath] = generateJs(currentPath, output.code);
    hasRequired.push(currentPath);
  }

  return result;
};

export const getGlobalData = (text: string) => {
  const identifiers: string[] = [];
  babel.transformSync(text, { presets: [presetEnv], ast: true, plugins: [getIdentifier(identifiers)] });
  return identifiers;
};
