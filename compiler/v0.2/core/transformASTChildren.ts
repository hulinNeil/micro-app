import { ASTElement, IGenCode } from '.';
import generateFromAST from './generateFromAST';

/**
 * 处理 AST 树中的 children
 * @param htmlAST {ASTElement} 需要处理的 ast 节点
 * @param result {IGenCode} 当前节点的父级节点处理后的 result 结果，用于将当前的 ast 节点的特殊语法/变量保存传递出去
 * @return {Array} ast 节点处理后的 code 字符串
 */
const transformASTChildren = (htmlAST: ASTElement, result: IGenCode): string[] => {
  const children: string[] = [];

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

export default transformASTChildren;
