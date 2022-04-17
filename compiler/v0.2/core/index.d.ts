export interface ASTElement {
  type: 'tag' | 'text' | 'style';
  name: string;
  attribs: { [key: string]: any };
  data: string;
  parent: ASTElement | void;
  prev: ASTElement;
  children: ASTElement[];
  __pageVariable__: string; // 当前 page 的路径驼峰变量
  __pagePath__: string;
  __pageRoute__: string; // 当前 page 的路由路径
  __rootPath__: string; // 入口文件的路径：app.json 的路径
  __rollup__: any; // rollup 实例
}

export interface IDataString {
  variates: string[];
  values: string[];
}

export interface Conditional {
  variateName: string; // if,elif,else 有相同的 variateName
  if?: ASTElement;
  elif?: ASTElement[];
  else?: ASTElement;
}

interface IGenCode {
  variates: string[];
  code: string;
  arrayElements: { [key: string]: ASTElement };
  conditional: Conditional[]; // 条件语句使用有序的数组进行存档，方便遍历的时候获取
}

interface IForCode {
  variates: string[];
  code: string;
}
