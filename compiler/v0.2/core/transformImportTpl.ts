import { ASTElement, IGenCode } from '.';
import { getFileContent, getRelativePath, getResolvePath, getUpperCasePath } from '../utils';
import { getData } from './generateFromAST';
import { getTempGlobalData } from './helper';

// 保存已经存在的template模板路径, key:路径变量(PagesApiImageImage);
interface ITemplateStore {
  [pageVariable: string]: string[]; // 保存当前页面的所有name; transformTemplate 中使用 templates[htmlAST.__pageVariable__].names 判断是否导入模板;
}
const templates: ITemplateStore = {};

/**
 * 保存引入的 template 模板: <import src="../../../templates/header/index.kml" />
 * @param {ASTElement} htmlAST 页面模板的 ast 元素
 * @param {String} inputFile app.json 路径
 * @param {String} fileName 页面路径
 */
export const saveImportedTemplate = (htmlAST: ASTElement[], inputFile: string, fileName: string) => {
  const pagePath = getRelativePath(inputFile, fileName);
  const pageVariable = getUpperCasePath(pagePath).split('.')[0];

  let pageEl: any = null;
  const pageTmpConfigs: { src: string; name: string }[] = [];

  for (let index = 0; index < htmlAST.length; index++) {
    if (htmlAST[index] && htmlAST[index].type === 'tag' && (htmlAST[index] as any).name === 'import') {
      let src = htmlAST[index].attribs.src as string;
      if (src) {
        if (!~src.indexOf('.kml')) {
          src = src + '.kml';
        }
        if (src[0] === '/') {
          src = getResolvePath(inputFile, '../', '.' + src);
          src = getRelativePath(fileName, src);
        }
        // 处理引用相同的文件
        if (pageTmpConfigs.find((item) => item.src === src)) {
          continue;
        }

        // 读取src文件，获取template的内容，判断内容是否符合规范：以template包裹，含有name属性
        const resolvePath = getResolvePath(fileName, '../', src);
        let templateCont = getFileContent(resolvePath);
        if (!templateCont) {
          throw new Error(`请选择正确的 template 路径: ${resolvePath}`);
        }
        const _names = templateCont.trim().match(/(?<=\<template.*name=\"|').*?(?=\"|')/i);
        if (!_names) {
          throw new Error(`template 模板格式不正确: ${resolvePath}`);
        }

        // 处理不同 path，相同 name 的 template 引用
        if (pageTmpConfigs.find((item) => item.name === _names[0])) {
          throw new Error('当前页面[`' + htmlAST[index].__pageRoute__ + '`]已包含name=`' + _names[0] + '`的模板引用');
        }
        pageTmpConfigs.push({ src, name: _names[0] });
      }
    } else if (htmlAST[index] && htmlAST[index].type === 'tag') {
      pageEl = htmlAST[index];
      break;
    }
  }

  let importModules = '';
  let useModules = '';
  // 将当前页面产生的 name 添加到全局变量中，当页面解析 template 时使用
  templates[pageVariable] = pageTmpConfigs.map((item) => {
    const moduleName = pageVariable + '_' + item.name;
    importModules += `import ${moduleName} from '${item.src}';`;
    useModules += `__AppTemplateCode__['${moduleName}'] = ${moduleName};`;
    return item.name;
  });

  const importTemplate = `
    ${templates[pageVariable].length ? "import {__AppTemplateCode__} from 'inject/view.js';" : ''}
    ${importModules}
    ${useModules}
  `;

  return [importTemplate, pageEl as ASTElement];
};

/**
 * 处理页面中的 template 标签: `<template is="header" data="{{title:'view'}}" />`
 * @param {ASTElement} htmlAST 需要处理的template节点
 */
const transformImportTemplate = (htmlAST: ASTElement): IGenCode => {
  let result: IGenCode = { variates: [], code: '', arrayElements: {}, conditional: [] };
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

export default transformImportTemplate;
