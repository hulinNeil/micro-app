import * as htmlparser2 from 'htmlparser2';
import generateFromAST from './generateFromAST';
import transformFor from './transformFor';
import transformIf from './transformIf';

/**
 * 负责解析框架的所有模板 .html 文件, 导出文件在 webpack 中调用
 * @param {String} source 文件内容
 */
const parserKml = (source: any) => {
  const ast = htmlparser2.parseDOM(source);
  let { code, variates, arrayElements, conditional } = generateFromAST(ast[0] as any); // 需要生成 code 和 code 中使用的变量

  //处理 for 循环语句
  const arrayCodes = transformFor(arrayElements);
  variates.push(...arrayCodes.variates);

  // 处理 if 判断语句
  const conditionalCodes = transformIf(conditional);
  variates.push(...conditionalCodes.variates);

  variates = Array.from(new Set(variates));

  const result = `
        import { createElement } from '@/core/webview/parser/render';
        const _concat = (...arg) => {
          return ''.concat(...arg);
        };
        var template = (pageData) => {
          ${variates.map((item) => `var ${item} = pageData['${item}'];`).join('\n')}
          ${conditionalCodes.code}${arrayCodes.code}
          return ${Array.isArray(code) ? code.join(',') : code}
        };
        export default template;
        `;
  return result;
};

export default parserKml;
