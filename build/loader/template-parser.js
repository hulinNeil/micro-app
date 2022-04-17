'use strict';

var htmlparser2 = require('htmlparser2');
var babel = require('@babel/core');

function _interopNamespace(e) {
  if (e && e.__esModule) return e;
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () {
            return e[k];
          }
        });
      }
    });
  }
  n['default'] = e;
  return Object.freeze(n);
}

var htmlparser2__namespace = /*#__PURE__*/_interopNamespace(htmlparser2);
var babel__namespace = /*#__PURE__*/_interopNamespace(babel);

/**
 *babel 插件，获取语句中的全局变量
 */
const getIdentifier = (identifiers) => () => {
    return {
        visitor: {
            Identifier(path) {
                const name = path.node.name;
                if (path.key !== 'property') {
                    identifiers.push(name);
                }
            },
        },
    };
};

const getGlobalData = (text) => {
    const identifiers = [];
    babel__namespace.transformSync(text, { ast: true, code: false, plugins: [getIdentifier(identifiers)] });
    return identifiers;
};
/**
 * 获取上一个兄弟节点
 */
const getPrev = (ast) => {
    let prev = null;
    if (ast && ast.prev) {
        prev = ast.prev;
    }
    if (prev && prev.type !== 'tag') {
        prev = getPrev(prev);
    }
    return prev;
};

/**
 * 根据字符串，返回字符串中的静态字符和变量
 */
const getData = (text) => {
    const result = { values: [], variates: [] };
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
    }
    else if (text) {
        result.values.push(JSON.stringify(text));
    }
    return result;
};
/**
 * 根据 ast 生成 render 所需的 code.
 *
 * 如果 属性中含有 k:for="{{}}" 那么需要将当前的节点使用函数返回结果
 */
let arrayCount = 0;
let conditionalCount = 0;
const generateFromAST = (htmlAST) => {
    let result = { variates: [], code: '', arrayElements: {}, conditional: [] };
    if (htmlAST.type === 'tag') {
        // 需要判断下，html 是否是 k:if,k:else, k:elif
        if (htmlAST.attribs && (htmlAST.attribs['k:if'] || htmlAST.attribs.hasOwnProperty('k:else') || htmlAST.attribs['k:elif'])) {
            let key = '';
            if (htmlAST.attribs['k:if']) {
                key = 'if';
                conditionalCount += 1;
                result.code = `conditional${conditionalCount}`;
            }
            else {
                // 只有同级的else才加入到数组中，不是的话直接忽略
                const prev = getPrev(htmlAST);
                if (prev && prev.attribs && (prev.attribs['k:if'] || prev.attribs['k:elif'])) {
                    key = htmlAST.attribs['k:elif'] ? 'elif' : 'else';
                }
            }
            if (key) {
                result.conditional.push({ variateName: `conditional${conditionalCount}`, [key]: key === 'elif' ? [htmlAST] : htmlAST });
            }
            return result;
        }
        // 需要判断下，htmlAST.attribs 是否存在 k:for, 如果存在的话，这一块就跳过
        if (htmlAST.attribs && htmlAST.attribs['k:for']) {
            arrayCount += 1;
            result.arrayElements[`array${arrayCount}`] = htmlAST;
            result.code = `array${arrayCount}`;
            return result;
        }
        let children = [];
        // 处理 children
        if (htmlAST.children && htmlAST.children.length) {
            htmlAST.children.forEach((element) => {
                if (htmlAST.name === 'text' && element.name && element.name !== 'text') {
                    // 如果组件时 text， 那么子元素只能是文字或者 text 元素
                    return;
                }
                var _result = generateFromAST(element);
                if (_result.variates.length) {
                    _result.variates.forEach((item) => {
                        if (!result.variates.includes(item)) {
                            result.variates.push(item);
                        }
                    });
                }
                // 合并子集中的含有的for循环，待会统一交给外部处理
                if (Object.keys(_result.arrayElements)) {
                    Object.assign(result.arrayElements, _result.arrayElements);
                }
                // 合并子集中的含有的 if 语句，待会统一交给外部处理
                if (_result.conditional.length) {
                    result.conditional.push(..._result.conditional);
                }
                // 如果 code 不存在，那么直接 return ==> 处理 html 中的注释
                if (!_result.code) {
                    return;
                }
                if (typeof _result.code === 'string') {
                    children.push(_result.code);
                }
                else if (Array.isArray(_result.code)) {
                    children.push(..._result.code);
                }
            });
        }
        // 处理属性
        let attribs = null;
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
                }
                else {
                    attribs += `${JSON.stringify(key)}:${value || true}`;
                }
            }
        }
        // 如果是 build 框架，那么不需要加 wx 前缀，如果是 build 项目需要加上 wx 前缀
        const prefix = process.env.BUILD_TYPE && process.env.BUILD_TYPE === 'framework' ? '' : 'wx-';
        attribs = attribs ? `{${attribs}}` : null;
        result.code = `createElement('${prefix}${htmlAST.name}',${attribs},${children.join(',')})`;
    }
    else if (htmlAST.type === 'text') {
        // 需要使用正则解析 {{data}}
        const dataString = getData(htmlAST.data.replace(/(^\s+)|(\s+$)/gi, ''));
        result.code = dataString.values.length > 1 ? `_concat(${dataString.values})` : dataString.values[0];
        // result.code = dataString.values;
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

const getIfCode = (variateName, ast, indexKey, itemKey) => {
    const result = { code: '', variates: [] };
    const conditionalString = ast.attribs['k:if'];
    const conditional = getData(conditionalString);
    delete ast.attribs['k:if'];
    const _result = generateFromAST(ast);
    //处理 for 循环语句
    const arrayCodes = transformFor(_result.arrayElements, indexKey, itemKey);
    result.variates.push(...conditional.variates, ..._result.variates, ...arrayCodes.variates);
    result.code = `if(${conditional.values[0]}){
    ${arrayCodes.code}
    ${variateName} = ${_result.code}
  }`;
    return result;
};
const getElifCode = (variateName, ast, indexKey, itemKey) => {
    const result = { code: '', variates: [] };
    if (!ast || !Array.isArray(ast)) {
        return result;
    }
    const code = ast.map((item) => {
        const conditionalString = item.attribs['k:elif'];
        const conditional = getData(conditionalString).values[0];
        delete item.attribs['k:elif'];
        const _result = generateFromAST(item);
        //处理 for 循环语句
        const arrayCodes = transformFor(_result.arrayElements, indexKey, itemKey);
        result.variates.push(..._result.variates, ...arrayCodes.variates);
        return `else if(${conditional}){
      ${arrayCodes.code}
      ${variateName} = ${_result.code}
    }`;
    });
    result.code = code.join('');
    return result;
};
const getElseCode = (variateName, ast, indexKey, itemKey) => {
    const result = { code: '', variates: [] };
    if (!ast) {
        return result;
    }
    delete ast.attribs['k:else'];
    const _result = generateFromAST(ast);
    //处理 for 循环语句
    const arrayCodes = transformFor(_result.arrayElements, indexKey, itemKey);
    result.variates.push(..._result.variates, ...arrayCodes.variates);
    result.code = `else{
    ${arrayCodes.code}
    ${variateName} = ${_result.code}
  }`;
    return result;
};
/**
 * 处理 k:if,k:else, k:elif
 * @param data {Array} 需要进行条件渲染的 ast 元素
 * @param indexKey {String} 当前逻辑如果处于一个列表循环里面, 需要传入 indexKey, 以确保当前逻辑结束, 上个循环的 index 变量没有发生变化
 * @param itemKey {String} 当前逻辑如果处于一个列表循环里面, 需要传入 itemKey, 以确保当前逻辑结束, 上个循环的 item 变量没有发生变化
 */
const transformIf = (data, indexKey, itemKey) => {
    const result = { code: '', variates: [] };
    // 合并含有相同 variateName 的数据
    const conditionals = [];
    data.forEach((item) => {
        if (conditionals.length === 0) {
            conditionals.push(item);
            return;
        }
        const lastConditional = conditionals[conditionals.length - 1];
        if (item.variateName !== lastConditional.variateName) {
            conditionals.push(item);
        }
        else {
            // 需要根据 key 的值判断下，是 else 的话 需要是一个数组
            if (item.elif) {
                if (lastConditional.elif) {
                    lastConditional.elif.push(item.elif[0]);
                }
                else {
                    lastConditional.elif = item.elif;
                }
            }
            else {
                Object.assign(lastConditional, item);
            }
        }
    });
    // 遍历 conditionals， 生成 code
    conditionals.forEach((conditional) => {
        if (!conditional.if) {
            return;
        }
        const ifCode = getIfCode(conditional.variateName, conditional.if, indexKey, itemKey);
        const elseCode = getElseCode(conditional.variateName, conditional.else, indexKey, itemKey);
        const elifCode = getElifCode(conditional.variateName, conditional.elif, indexKey, itemKey);
        result.variates.push(...ifCode.variates, ...elifCode.variates, ...elseCode.variates);
        const code = `
    var ${conditional.variateName} = null;
    ${ifCode.code}${elifCode.code}${elseCode.code}
    `;
        result.code += code;
    });
    return result;
};

/**
 * 处理k:for的元素
 * @param arrayElements {Object} 需要循环渲染的 ast 元素
 * @param indexKey {String} 当前逻辑如果处于一个列表循环里面, 需要传入 indexKey, 以确保当前逻辑结束, 上个循环的 index 变量没有发生变化
 * @param itemKey {String} 当前逻辑如果处于一个列表循环里面, 需要传入 itemKey, 以确保当前逻辑结束, 上个循环的 item 变量没有发生变化
 */
const transformFor = (arrayElements, indexKey, itemKey) => {
    const result = { code: '', variates: [] };
    const keys = Object.keys(arrayElements);
    keys.forEach((key) => {
        // 先获取 k:for 的值，解析它，然后将其从 ast 中删除
        var listString = arrayElements[key].attribs['k:for'];
        const list = getData(listString).values[0];
        const index = arrayElements[key].attribs['k:for-index'] || 'index';
        const item = arrayElements[key].attribs['k:for-item'] || 'item';
        delete arrayElements[key].attribs['k:for'];
        delete arrayElements[key].attribs['k:for-item'];
        delete arrayElements[key].attribs['k:for-index'];
        // 解析当前节点
        const _result = generateFromAST(arrayElements[key]);
        // 解析当前节点下面的 for 循环
        const subCode = transformFor(_result.arrayElements, index, item);
        // 处理当前节点下面的 if 判断语句
        const conditionalCodes = transformIf(_result.conditional, index, item);
        // 合并所有的变量
        _result.variates = _result.variates.filter((variate) => variate !== item && variate !== index);
        subCode.variates = subCode.variates.filter((variate) => variate !== item && variate !== index);
        conditionalCodes.variates = conditionalCodes.variates.filter((variate) => variate !== item && variate !== index);
        result.variates.push(...getData(listString).variates, ..._result.variates, ...subCode.variates, ...conditionalCodes.variates);
        var code = `
      var ${key} = [];
      {
        const newList = ${list} || [];
        for(let _index = 0; _index < newList.length; _index++){
          var ${item} = newList[_index];
          var ${index} = _index;
          ${conditionalCodes.code}${subCode.code}
          ${key}.push(${_result.code}) 
        }
      }
      ${indexKey === index ? `${index} = _index` : ''}
      ${itemKey === item ? `${item} = newList[_index]` : ''}
    `;
        result.code += code;
    });
    return result;
};

/**
 * 负责解析框架的所有模板 .html 文件
 */
const parserKml = (source) => {
    const ast = htmlparser2__namespace.parseDOM(source);
    let { code, variates, arrayElements, conditional } = generateFromAST(ast[0]); // 需要生成 code 和 code 中使用的变量
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

module.exports = parserKml;
