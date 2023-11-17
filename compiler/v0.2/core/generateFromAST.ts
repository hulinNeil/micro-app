import { ASTElement, IDataString, IGenCode } from '.';
import { getGlobalData, getPrev } from './helper';
import transformASTChildren from './transformASTChildren';
import transformImportTemplate from './transformImportTpl';
import transformIncludeTemplate from './transformIncludeTpl';
import componentNames from '../../../lib/components';
import { allPages } from '../plugins/rollup-plugin-parserAppJson';

/**
 * 根据字符串，返回字符串中的静态字符和变量
 */
export const getData = (text: string): IDataString => {
  const result: IDataString = { values: [], variates: [] };

  if (!text) {
    return result;
  }

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

let arrayCount = 0;
let conditionalCount = 0;
/**
 * 解析小程序模板语法的主入口，根据 ast 生成 render 所需的 code.
 *
 * 如果 属性中含有 wx:for="{{}}" 那么需要将当前的节点使用函数返回结果
 */
const generateFromAST = (htmlAST: ASTElement): IGenCode => {
  let result: IGenCode = { variates: [], code: '', arrayElements: {}, conditional: [] };

  if (htmlAST.type === 'tag') {
    // 判断是 import template 模板
    if (htmlAST.name === 'template' && !process.env.BUILD_TYPE && process.env.BUILD_TYPE !== 'framework') {
      // 模板源文件
      if (htmlAST.attribs.name) {
        const children: string[] = transformASTChildren(htmlAST, result);
        result.code = children.length > 1 ? `[${children.join(',')}]` : children[0] || '';
        return result;
      }
      // 页面中的 template 标签
      return transformImportTemplate(htmlAST);
    }
    // 判断是 include template 模板
    if (htmlAST.name === 'include') {
      return transformIncludeTemplate(htmlAST);
    }
    // 判断是自定义组件中的 slot 元素
    if(htmlAST.name === 'slot'){
      result.variates.push('__component_slot');
      result.code = `__component_slot['${htmlAST.attribs.name || 'default'}']`;
      return result;
    }
    // 需要判断下，html 是否是 wx:if,wx:else, wx:elif
    if (htmlAST.attribs && (htmlAST.attribs['wx:if'] || htmlAST.attribs.hasOwnProperty('wx:else') || htmlAST.attribs['wx:elif'])) {
      let key = '';
      if (htmlAST.attribs['wx:if']) {
        key = 'if';
        conditionalCount += 1;
        result.code = `conditional${conditionalCount}`;
      } else {
        // 只有同级的else才加入到数组中，不是的话直接忽略
        const prev = getPrev(htmlAST);
        if (prev && prev.attribs && (prev.attribs['wx:if'] || prev.attribs['wx:elif'])) {
          key = htmlAST.attribs['wx:elif'] ? 'elif' : 'else';
        }
      }
      if (key) {
        result.conditional.push({ variateName: `conditional${conditionalCount}`, [key]: key === 'elif' ? [htmlAST] : htmlAST });
      }

      return result;
    }

    // 需要判断下，htmlAST.attribs 是否存在 wx:for, 如果存在的话，这一块就跳过
    if (htmlAST.attribs && htmlAST.attribs['wx:for']) {
      arrayCount += 1;
      result.arrayElements[`array${arrayCount}`] = htmlAST;
      result.code = `array${arrayCount}`;
      return result;
    }

    const children: string[] = transformASTChildren(htmlAST, result);

    // 处理属性
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
        const value = dataString.values.length > 1 ? `_concat(${dataString.values})` : dataString.values[0];
        attribs += attribs ? ',' : '';
        if (key === 'class') {
          attribs += `className:${value}`;
        } else {
          attribs += `${JSON.stringify(key)}:${value || true}`;
        }
      }
    }

    // 校验标签是内置组件、自定义组件(在编译项目的时候校验)
    if (!process.env.BUILD_TYPE && process.env.BUILD_TYPE !== 'framework') {
      if (!componentNames.includes(htmlAST.name)) {
        const pageConfig = allPages[htmlAST.__pageRoute__.replace('.wxml', '')].config;
        if (!pageConfig.usingComponents || !pageConfig.usingComponents[htmlAST.name]) {
          throw new Error(`${htmlAST.__pageRoute__} 文件内容错误: "${htmlAST.name}" 未定义`);
        }
        const extra = `__isComponent__:true,__route__:'${pageConfig.usingComponents[htmlAST.name]}'`;
        attribs = attribs ? `${attribs},${extra}` : extra;
      }
    }

    // 如果是 build 框架，那么不需要加 wx 前缀，如果是 build 项目需要加上 wx 前缀
    const prefix = process.env.BUILD_TYPE && process.env.BUILD_TYPE === 'framework' ? '' : 'wx-';
    attribs = attribs ? `{${attribs}}` : null;
    result.code = `createElement('${prefix}${htmlAST.name}',${attribs},${children.join(',')})`;
  } else if (htmlAST.type === 'text') {
    // 需要使用正则解析 {{data}}
    const dataString = getData(htmlAST.data.replace(/(^\s+)|(\s+$)/gi, ''));
    result.code = dataString.values.length > 1 ? `_concat(${dataString.values})` : dataString.values[0];
    if (dataString.variates.length) {
      dataString.variates.forEach((item) => {
        if (!result.variates.includes(item)) {
          result.variates.push(item);
        }
      });
    }
  }

  // 如果是 build 框架的html-parser，那么需要处理 style 标签
  if (process.env.BUILD_TYPE && process.env.BUILD_TYPE === 'framework' && htmlAST.type === 'style') {
    result.code = `createElement('style', null, ${JSON.stringify(htmlAST.children[0].data)})`;
  }

  return result;
};

export default generateFromAST;
