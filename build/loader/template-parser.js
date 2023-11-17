'use strict';

var htmlparser2 = require('htmlparser2');
var babel = require('@babel/core');
var domhandler = require('domhandler');
var fs = require('fs-extra');
var path = require('path');
require('crypto');

function _interopNamespace(e) {
    if (e && e.__esModule) return e;
    var n = Object.create(null);
    if (e) {
        Object.keys(e).forEach(function (k) {
            if (k !== 'default') {
                var d = Object.getOwnPropertyDescriptor(e, k);
                Object.defineProperty(n, k, d.get ? d : {
                    enumerable: true,
                    get: function () { return e[k]; }
                });
            }
        });
    }
    n["default"] = e;
    return Object.freeze(n);
}

var htmlparser2__namespace = /*#__PURE__*/_interopNamespace(htmlparser2);
var babel__namespace = /*#__PURE__*/_interopNamespace(babel);
var fs__namespace = /*#__PURE__*/_interopNamespace(fs);
var path__namespace = /*#__PURE__*/_interopNamespace(path);

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
/**
 *babel 插件，获取 template 语句中, data 属性包含的全局变量
 */
const getTempIdentifier = (identifiers) => () => {
    return {
        visitor: {
            Identifier(path) {
                const name = path.node.name;
                if (['value', 'argument'].includes(path.key)) {
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
const getTempGlobalData = (text) => {
    const identifiers = [];
    babel__namespace.transformSync(text, { ast: true, code: false, plugins: [getTempIdentifier(identifiers)] });
    return identifiers;
};
/**
 * 解析字符串
 * @param {String} htmlString 需要解析的文件内容
 * @param {Object} params 文件的相关信息，如文件路径，app.json路径，rollup实例
 * @return 解析后的 ast 节点
 */
const htmlParser = (htmlString, params) => {
    const { pageVariable, pageRoute, pagePath, rootPath, rollup } = params;
    class CustomDomHandler extends domhandler.DomHandler {
        addNode(node) {
            node.__pageVariable__ = pageVariable;
            node.__pageRoute__ = pageRoute;
            node.__pagePath__ = pagePath;
            node.__rootPath__ = rootPath;
            node.__rollup__ = rollup;
            super.addNode(node);
        }
    }
    var handler = new CustomDomHandler(undefined, {});
    new htmlparser2__namespace.Parser(handler, { recognizeSelfClosing: true }).end(htmlString);
    return handler.root.children;
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
 * 处理 AST 树中的 children
 * @param htmlAST {ASTElement} 需要处理的 ast 节点
 * @param result {IGenCode} 当前节点的父级节点处理后的 result 结果，用于将当前的 ast 节点的特殊语法/变量保存传递出去
 * @return {Array} ast 节点处理后的 code 字符串
 */
const transformASTChildren = (htmlAST, result) => {
    const children = [];
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
            // 合并子集中的含有的 for 循环，待会统一交给外部处理
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
            children.push(_result.code);
        });
    }
    return children;
};

fs__namespace.realpathSync(process.cwd());
const getResolvePath = (...pathSegments) => path__namespace.resolve(...pathSegments);
// 获取文件内容
const getFileContent = (path) => {
    try {
        return fs__namespace.readFileSync(path).toString();
    }
    catch (error) {
        console.log('get page config error', error);
    }
    return null;
};
// 获取绝对路径
const getRelativePath = (targetPath, curPath) => {
    let result = path__namespace.relative(targetPath, curPath);
    result = result.replace(/\\/g, '/').replace('../', '');
    return result;
};

const templates = {};
/**
 * 处理页面中的 template 标签: `<template is="header" data="{{title:'view'}}" />`
 * @param {ASTElement} htmlAST 需要处理的template节点
 */
const transformImportTemplate = (htmlAST) => {
    let result = { variates: [], code: '', arrayElements: {}, conditional: [] };
    const { is, data } = htmlAST.attribs;
    // 判断 is 是否存在
    if (!is) {
        throw new Error('页面[`' + htmlAST.__pageRoute__ + '`]中 template `is` 属性不能为空');
    }
    if (!templates[htmlAST.__pageVariable__]) {
        throw new Error(`不可以在页面[\`${htmlAST.__pageRoute__}\`]使用未导入的 template 模板: ${is}.`);
    }
    // 如果 is 是静态字符串，需要校验是否导入了对应模板，如果是模板语法，最终在 render 的时候进行二次校验
    const isStaticString = !/{{.+?}}/gi.test(is);
    if (isStaticString && !templates[htmlAST.__pageVariable__].includes(is)) {
        throw new Error(`不可以在页面[\`${htmlAST.__pageRoute__}\`]使用未导入的 template 模板: ${is}.`);
    }
    // 处理 is 数据格式
    const dataString = getData(is);
    if (dataString.variates.length) {
        dataString.variates.forEach((item) => {
            if (!result.variates.includes(item)) {
                result.variates.push(item);
            }
        });
    }
    const _is = dataString.values.length > 1 ? `_concat(${dataString.values})` : dataString.values[0];
    // 处理 data 数据
    const _data = data ? data.replace('{{', '{').replace('}}', '}') : undefined;
    result.variates = getTempGlobalData('var testVariable = ' + _data);
    const templateName = dataString.variates.length === 0 ? `'${htmlAST.__pageVariable__}_${is}'` : `_concat('${htmlAST.__pageVariable__}_', ${_is})`;
    result.code = `__renderTemplate(${templateName},${_data})`;
    return result;
};

/**
 * 处理页面中的 template 标签: `<include src="./footer.wxml"/>`
 *
 * 可以将目标文件除了 template/wxs 外的整个代码引入，相当于是拷贝到 include 位置,支持在里面写 page 的变量
 * @param {ASTElement} htmlAST 需要处理的template节点
 */
const transformIncludeTemplate = (htmlAST) => {
    let result = { variates: [], code: '', arrayElements: {}, conditional: [] };
    let { src } = htmlAST.attribs;
    if (!src) {
        throw new Error('页面[`' + htmlAST.__pageRoute__ + '`]中 template `src` 属性不能为空');
    }
    if (!~src.indexOf('.wxml')) {
        src = src + '.wxml';
    }
    if (src[0] === '/') {
        src = getResolvePath(htmlAST.__rootPath__, '../', '.' + src);
        src = getRelativePath(htmlAST.__pagePath__, src);
    }
    const resolvePath = getResolvePath(htmlAST.__pagePath__, '../', src);
    let templateCont = getFileContent(resolvePath);
    if (!templateCont) {
        throw new Error(`请选择正确的 template 路径: ${resolvePath}`);
    }
    if (/\<(template|wxs)/gi.test(templateCont)) {
        throw new Error(`页面[\`${htmlAST.__pageRoute__}\`]的include模板[\`${src}\`]不能含有 template/wxs.`);
    }
    const { __pageRoute__, __pageVariable__, __pagePath__, __rootPath__, __rollup__ } = htmlAST;
    const ast = htmlParser(templateCont, {
        pageVariable: __pageVariable__,
        pagePath: __pagePath__,
        pageRoute: __pageRoute__,
        rootPath: __rootPath__,
        rollup: __rollup__,
    });
    // 添加文件监听
    htmlAST.__rollup__.addWatchFile(resolvePath);
    const codeArray = [];
    for (let index = 0; index < ast.length; index++) {
        if (ast[index] && ast[index].type === 'tag') {
            const _result = generateFromAST(ast[index]);
            result.variates.push(..._result.variates);
            result.conditional.push(..._result.conditional);
            Object.assign(result.arrayElements, _result.arrayElements);
            codeArray.push(_result.code);
        }
    }
    result.code = codeArray.length > 1 ? `[${codeArray.join(',')}]` : codeArray[0];
    return result;
};

const view = ['cover-image', 'cover-view', 'scroll-view', 'swiper', 'swiper-item', 'view'];

const base = ['icon', 'text', 'progress', 'rich-text'];

const form = ['form', 'button'];

const media = ['image', 'video'];

const other = ['navigator', 'canvas', 'include', 'import', 'template', 'block'];

const components = [...view, ...base, ...form, ...media, ...other];

// 保存所有页面的路径信息
let allPages = {};
new Date().getTime();

/**
 * 根据字符串，返回字符串中的静态字符和变量
 */
const getData = (text) => {
    const result = { values: [], variates: [] };
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
    }
    else if (text) {
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
const generateFromAST = (htmlAST) => {
    let result = { variates: [], code: '', arrayElements: {}, conditional: [] };
    if (htmlAST.type === 'tag') {
        // 判断是 import template 模板
        if (htmlAST.name === 'template' && !process.env.BUILD_TYPE && process.env.BUILD_TYPE !== 'framework') {
            // 模板源文件
            if (htmlAST.attribs.name) {
                const children = transformASTChildren(htmlAST, result);
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
        if (htmlAST.name === 'slot') {
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
            }
            else {
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
        const children = transformASTChildren(htmlAST, result);
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
        // 校验标签是内置组件、自定义组件(在编译项目的时候校验)
        if (!process.env.BUILD_TYPE && process.env.BUILD_TYPE !== 'framework') {
            if (!components.includes(htmlAST.name)) {
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
    }
    else if (htmlAST.type === 'text') {
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

const getIfCode = (variateName, ast, indexKey, itemKey) => {
    const result = { code: '', variates: [] };
    const conditionalString = ast.attribs['wx:if'];
    const conditional = getData(conditionalString);
    delete ast.attribs['wx:if'];
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
        const conditionalString = item.attribs['wx:elif'];
        const conditional = getData(conditionalString).values[0];
        delete item.attribs['wx:elif'];
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
    delete ast.attribs['wx:else'];
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
 * 处理 wx:if, wx:else, wx:elif
 * @param {Array} data 需要进行条件渲染的 ast 元素
 * @param {String} indexKey 当前逻辑如果处于一个列表循环里面, 需要传入 indexKey, 以确保当前逻辑结束, 上个循环的 index 变量没有发生变化
 * @param {String} itemKey 当前逻辑如果处于一个列表循环里面, 需要传入 itemKey, 以确保当前逻辑结束, 上个循环的 item 变量没有发生变化
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
 * 处理 wx:for 的元素
 * @param {Object} arrayElements 需要循环渲染的 ast 元素
 * @param {String} indexKey 当前逻辑如果处于一个列表循环里面, 需要传入 indexKey, 以确保当前逻辑结束, 上个循环的 index 变量没有发生变化
 * @param {String} itemKey 当前逻辑如果处于一个列表循环里面, 需要传入 itemKey, 以确保当前逻辑结束, 上个循环的 item 变量没有发生变化
 */
const transformFor = (arrayElements, indexKey, itemKey) => {
    const result = { code: '', variates: [] };
    const keys = Object.keys(arrayElements);
    keys.forEach((key) => {
        // 先获取 wx:for 的值，解析它，然后将其从 ast 中删除
        var listString = arrayElements[key].attribs['wx:for'];
        const list = getData(listString).values[0];
        const index = arrayElements[key].attribs['wx:for-index'] || 'index';
        const item = arrayElements[key].attribs['wx:for-item'] || 'item';
        delete arrayElements[key].attribs['wx:for'];
        delete arrayElements[key].attribs['wx:for-item'];
        delete arrayElements[key].attribs['wx:for-index'];
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
 * 负责解析框架的所有模板 .tpl 文件, 导出文件在 webpack 中调用
 * @param {String} source 文件内容
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
