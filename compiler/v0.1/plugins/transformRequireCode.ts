export default (requireContent: string[]) => () => {
  return {
    visitor: {
      CallExpression(path: any) {
        if (path.node.callee.name === 'require') {
          const _arguments = path.node.arguments;
          const requirePath = _arguments[0].value;
          console.log('key', path.node.callee.name, '; value', requirePath);
          requireContent.push(requirePath);
        }
      },
    },
  };
};
