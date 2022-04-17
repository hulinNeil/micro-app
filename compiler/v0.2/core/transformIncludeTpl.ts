import { ASTElement, IGenCode } from '.';
import { getFileContent, getRelativePath, getResolvePath } from '../utils';
import generateFromAST from './generateFromAST';
import { htmlParser } from './helper';

/**
 * 处理页面中的 template 标签: `<include src="./footer.kml"/>`
 * 
 * 可以将目标文件除了 template/wxs 外的整个代码引入，相当于是拷贝到 include 位置,支持在里面写 page 的变量
 * @param {ASTElement} htmlAST 需要处理的template节点
 */
const transformIncludeTemplate = (htmlAST: ASTElement): IGenCode => {
  let result: IGenCode = { variates: [], code: '', arrayElements: {}, conditional: [] };
  let { src } = htmlAST.attribs;

  if (!src) {
    throw new Error('页面[`' + htmlAST.__pageRoute__ + '`]中 template `src` 属性不能为空');
  }

  if (!~src.indexOf('.kml')) {
    src = src + '.kml';
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
      const _result = generateFromAST(ast[index] as any);
      result.variates.push(..._result.variates);
      result.conditional.push(..._result.conditional);
      Object.assign(result.arrayElements, _result.arrayElements);
      codeArray.push(_result.code);
    }
  }
  result.code = codeArray.length > 1 ? `[${codeArray.join(',')}]` : codeArray[0];

  return result;
};

export default transformIncludeTemplate;
