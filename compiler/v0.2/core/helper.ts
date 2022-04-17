import * as babel from '@babel/core';
import * as htmlparser2 from 'htmlparser2';
import { DomHandler } from 'domhandler';
import { ASTElement } from '.';
import getIdentifier, { getTempIdentifier } from '../plugins/babel-plugin-require';

export const getGlobalData = (text: string) => {
  const identifiers: string[] = [];
  babel.transformSync(text, { ast: true, code: false, plugins: [getIdentifier(identifiers)] });
  return identifiers;
};

export const getTempGlobalData = (text: string) => {
  const identifiers: string[] = [];
  babel.transformSync(text, { ast: true, code: false, plugins: [getTempIdentifier(identifiers)] });
  return identifiers;
};

/**
 * 解析字符串
 * @param {String} htmlString 需要解析的文件内容
 * @param {Object} params 文件的相关信息，如文件路径，app.json路径，rollup实例
 * @return 解析后的 ast 节点
 */
export const htmlParser = (
  htmlString: string,
  params: { pageVariable: string; pageRoute: string; pagePath: string; rootPath: string; rollup: any }
) => {
  const { pageVariable, pageRoute, pagePath, rootPath, rollup } = params;
  class CustomDomHandler extends DomHandler {
    addNode(node: any) {
      node.__pageVariable__ = pageVariable;
      node.__pageRoute__ = pageRoute;
      node.__pagePath__ = pagePath;
      node.__rootPath__ = rootPath;
      node.__rollup__ = rollup;
      super.addNode(node);
    }
  }
  var handler = new CustomDomHandler(undefined, {});
  new htmlparser2.Parser(handler, { recognizeSelfClosing: true }).end(htmlString);
  return handler.root.children;
};

/**
 * 获取上一个兄弟节点
 */
export const getPrev = (ast: ASTElement | null): ASTElement | null => {
  let prev: ASTElement | null = null;

  if (ast && ast.prev) {
    prev = ast.prev;
  }

  if (prev && prev.type !== 'tag') {
    prev = getPrev(prev);
  }

  return prev;
};

/**
 * 获取 rollup 加载 app.json 的时间, 用于生成 hash
 */
export const getCurTime = function (this: any) {
  const first = Array.from(this.getModuleIds())[0];
  return this.getModuleInfo(first).meta.time;
};
