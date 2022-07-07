import { ASTElement, IForCode, IGenCode } from '.';
import generateFromAST, { getData } from './generateFromAST';
import transformFor from './transformFor';

const getIfCode = (variateName: string, ast: ASTElement, indexKey?: string, itemKey?: string) => {
  const result: IForCode = { code: '', variates: [] };
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

const getElifCode = (variateName: string, ast?: ASTElement[] | ASTElement, indexKey?: string, itemKey?: string) => {
  const result: IForCode = { code: '', variates: [] };

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

const getElseCode = (variateName: string, ast?: ASTElement, indexKey?: string, itemKey?: string) => {
  const result: IForCode = { code: '', variates: [] };
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
const transformIf = (data: IGenCode['conditional'], indexKey?: string, itemKey?: string): IForCode => {
  const result: IForCode = { code: '', variates: [] };

  // 合并含有相同 variateName 的数据
  const conditionals: IGenCode['conditional'] = [];
  data.forEach((item) => {
    if (conditionals.length === 0) {
      conditionals.push(item);
      return;
    }
    const lastConditional = conditionals[conditionals.length - 1];
    if (item.variateName !== lastConditional.variateName) {
      conditionals.push(item);
    } else {
      // 需要根据 key 的值判断下，是 else 的话 需要是一个数组
      if (item.elif) {
        if (lastConditional.elif) {
          lastConditional.elif.push(item.elif[0]);
        } else {
          lastConditional.elif = item.elif;
        }
      } else {
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

export default transformIf;
