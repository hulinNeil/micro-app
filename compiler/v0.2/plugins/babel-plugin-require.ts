/**
 *babel 插件，获取语句中的全局变量
 */
const getIdentifier = (identifiers: string[]) => () => {
  return {
    visitor: {
      Identifier(path: any) {
        const name = path.node.name;
        if (path.key !== 'property') {
          identifiers.push(name);
        }
      },
    },
  };
};

export default getIdentifier;

/**
 *babel 插件，获取 template 语句中, data 属性包含的全局变量
 */
export const getTempIdentifier = (identifiers: string[]) => () => {
  return {
    visitor: {
      Identifier(path: any) {
        const name = path.node.name;
        if (['value', 'argument'].includes(path.key)) {
          identifiers.push(name);
        }
      },
    },
  };
};
