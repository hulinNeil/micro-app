import { IForCode, IGenCode } from '.';
import generateFromAST, { getData } from './generateFromAST';
import transformIf from './transformIf';

/**
 * 处理 k:for 的元素
 * @param {Object} arrayElements 需要循环渲染的 ast 元素
 * @param {String} indexKey 当前逻辑如果处于一个列表循环里面, 需要传入 indexKey, 以确保当前逻辑结束, 上个循环的 index 变量没有发生变化
 * @param {String} itemKey 当前逻辑如果处于一个列表循环里面, 需要传入 itemKey, 以确保当前逻辑结束, 上个循环的 item 变量没有发生变化
 */
const transformFor = (arrayElements: IGenCode['arrayElements'], indexKey?: string, itemKey?: string): IForCode => {
  const result: IForCode = { code: '', variates: [] };
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

export default transformFor;
