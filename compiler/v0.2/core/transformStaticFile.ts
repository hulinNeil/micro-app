import * as fs from 'fs-extra';

// const files = ['.png', '.jpg', '.svg', '.mp4', '.mov', '.m4v', '.3gp', '.avi', '.m3u8', '.webm'];

import { getRelativePath, getResolvePath, resolveApp } from '../utils';

const transformStaticFile = (files: string[], curPath: string, inputFile: string) => {
  files.forEach((item) => {
    const path = JSON.parse(item);
    let filePath = '';
    if (/^(\.\/)|(\.\.\/)/.test(path)) {
      // 处理相对路径
      filePath = getResolvePath(curPath, '../', path);
    } else if (/^\/(?!\/)/.test(path)) {
      // 处理绝对路径
      filePath = getResolvePath(inputFile, '../', `.${path}`);
    } else {
      // base64 或者 https 或者是其他，直接 return
      return;
    }
    const resolvePath = getRelativePath(inputFile, filePath);
    const resultPath = getResolvePath(resolveApp('./dist'), resolvePath);
    fs.copySync(filePath, resultPath);
  });
};

export default transformStaticFile;
