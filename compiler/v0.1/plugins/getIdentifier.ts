export default (identifiers: string[]) => () => {
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
