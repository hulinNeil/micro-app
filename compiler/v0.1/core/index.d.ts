export interface ASTElement {
  type: 'tag' | 'text';
  name: string;
  attribs: { [key: string]: any };
  data: string;
  parent: ASTElement | void;
  children: ASTElement[];
}

export interface IDataString {
  variates: string[];
  values: string[];
}

interface IGenCode {
  variates: string[];
  code: string | string[];
}
