import * as path from 'path';
import * as fs from 'fs-extra';
import * as htmlparser2 from 'htmlparser2';
import { ASTElement, IDataString, IGenCode } from '.';
import { getUpperCasePath } from './../utils';
import { getGlobalData } from './transformJsCode';

const hasRequired: string[] = [];

/**
 * 根据字符串，返回字符串中的静态字符和变量
 */
const getData = (text: string): IDataString => {
  const result: IDataString = { values: [], variates: [] };

  const reg = /{{.+?}}/gi;
  const matchData = text.match(reg);
  if (matchData) {
    const firstTarget = matchData[0];
    const splitData = text.split(firstTarget);
    if (splitData[0]) {
      result.values.push(JSON.stringify(text.split(firstTarget)[0]));
    }
    result.values.push(firstTarget.replace(/^{{|}}$/g, ''));
    // 需要分析语句中的全局变量，然后将全局变量放到 variates 中
    const variates = getGlobalData(firstTarget.replace(/^{{|}}$/g, ''));
    result.variates.push(...variates);
    if (splitData[1]) {
      const nextData = getData(splitData[1]);
      result.variates.push(...nextData.variates);
      result.values.push(...nextData.values);
    }
  } else if (text) {
    result.values.push(JSON.stringify(text));
  }

  return result;
};

/**
 * 根据 ast 生成 render 所需的 code
 */
const generateFromAST = (htmlAST: ASTElement): IGenCode => {
  let result: IGenCode = { variates: [], code: '' };

  if (htmlAST.type === 'tag') {
    let children: string[] = [];
    if (htmlAST.children && htmlAST.children.length) {
      htmlAST.children.forEach((element) => {
        var _result = generateFromAST(element);
        if (_result.variates.length) {
          _result.variates.forEach((item) => {
            if (!result.variates.includes(item)) {
              result.variates.push(item);
            }
          });
        }
        if (typeof _result.code === 'string') {
          children.push(_result.code);
        } else if (Array.isArray(_result.code)) {
          children.push(..._result.code);
        }
      });
    }
    let attribs: null | string = null;
    if (Object.keys(htmlAST.attribs).length) {
      attribs = '';
      for (const key in htmlAST.attribs) {
        const dataString = getData(htmlAST.attribs[key]);
        if (dataString.variates.length) {
          dataString.variates.forEach((item) => {
            if (!result.variates.includes(item)) {
              result.variates.push(item);
            }
          });
        }
        const value = dataString.variates.length > 1 ? `''.concat(${dataString.values.join(',')})` : dataString.values[0];
        attribs += attribs ? ',' : '';
        if (key === 'class') {
          attribs += `className:${value}`;
        } else {
          attribs += `${key}:${value}`;
        }
      }
    }
    attribs = attribs ? `{${attribs}}` : null;
    result.code = `createElement('wx-${htmlAST.name}',${attribs},${children.join(',')})`;
  } else if (htmlAST.type === 'text') {
    // 需要使用正则解析 {{data}}
    const dataString = getData(htmlAST.data.replace(/(^\s+)|(\s+$)/gi, ''));
    result.code = dataString.values;
    if (dataString.variates.length) {
      dataString.variates.forEach((item) => {
        if (!result.variates.includes(item)) {
          result.variates.push(item);
        }
      });
    }
  }

  return result;
};

/**
 * 根据路径，生成编译后的js文件,步骤:
 * 1. 根据path，生成ast
 * 2. 分析ast，得到该文件中引用了哪些外部js
 * 3. 先编译外部js在编译当前js
 */
export const transformTemplate = (currentPath: string, resolvePath: string): { [key: string]: { moduleName: string; code: string } } => {
  let targetPath = !/.wxml$/.test(currentPath) ? `${currentPath}.wxml` : currentPath;

  if (hasRequired.includes(targetPath)) {
    return {};
  }

  const enterPath = path.resolve(resolvePath, './', targetPath);
  if (!fs.existsSync(enterPath)) {
    return {};
  }
  const enterCode = fs.readFileSync(enterPath).toString();

  const ast = htmlparser2.parseDOM(enterCode);

  const { code, variates } = generateFromAST(ast[0] as any); // 需要生成 code 和 code 中使用的变量

  const moduleName = getUpperCasePath(currentPath);

  const result = `
  var ${moduleName} = (pageData) => {
    ${variates.map((item) => `var ${item} = pageData['${item}'];\n`).join('')}
    return ${Array.isArray(code) ? code.join(',') : code}
  };
  `;

  return {
    [currentPath]: {
      code: result,
      moduleName,
    },
  };
};
