const getPagePath = (name: string) => {
  var path = name.match(/(.*)\/([^/]+)?$/);
  return path && path[1] ? path[1] : './';
};

export const getRealRoute = (moduleName: string, curPath: string): string => {
  const path = getPagePath(moduleName);
  const modulePath = (path + '/' + curPath).split('/');
  const dirNames = [];
  for (let index = 0, i = modulePath.length; index < i; index++) {
    var dirName = modulePath[index];
    if (dirName !== '' && dirName !== '.') {
      if (dirName === '..') {
        if (!dirNames.length) {
          throw new Error("Can't find module : " + name);
        }
        dirNames.pop();
      } else {
        dirNames.push(dirName);
      }
    }
  }
  var curPath = dirNames.join('/');
  return curPath;
};

export const getRealPath = (filePath: string, curPath?: string) => {
  const SCHEME_RE = /^([a-z-]+:)?\/\//i;
  const DATA_RE = /^data:.*,.*/;
  const ABSOLUTE_RE = /^\//;
  const RELATIVE_RE = /^(\.|\.\.)\//;

  // 无协议的情况补全 https
  if (filePath.indexOf('//') === 0) {
    filePath = 'https:' + filePath;
  }

  // 网络资源或base64或绝对路径
  if (SCHEME_RE.test(filePath) || DATA_RE.test(filePath) || ABSOLUTE_RE.test(filePath)) {
    return filePath;
  }

  // 处理相对路径
  if (curPath && RELATIVE_RE.test(filePath)) {
    filePath = '/' + getRealRoute(curPath, filePath);
  }

  return filePath;
};
