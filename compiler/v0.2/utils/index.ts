import * as fs from 'fs-extra';
import * as path from 'path';
import { createHmac } from 'crypto';

export const appRoot = fs.realpathSync(process.cwd());

export const resolveApp = (relativePath: string) => path.resolve(appRoot, relativePath);

export const getResolvePath = (...pathSegments: string[]) => path.resolve(...pathSegments);

// 获取相对路径
export const getRelativePathString = (...pathSegments: [string, string]) => path.relative(...pathSegments);

// 获取文件内容
export const getFileContent = (path: string) => {
  try {
    return fs.readFileSync(path).toString();
  } catch (error) {
    console.log('get page config error', error);
  }
  return null;
};

// 判断文件是否存在
export const fileIsExist = (filePath: string) => fs.existsSync(filePath);

// 判断文件夹是否存在，不存在则创建
export const checkFolder = (folderPath: string) => {
  const isExist = fs.existsSync(folderPath);
  if (!isExist) {
    fs.mkdirSync(folderPath);
  }
};

// 获取绝对路径
export const getRelativePath = (targetPath: string, curPath: string) => {
  let result = path.relative(targetPath, curPath);
  result = result.replace(/\\/g, '/').replace('../', '');
  return result;
};

// 处理文件夹路径转换驼峰命名
// case: aa/bb/cc.js; aa/bb/cc-dd.js
export const getUpperCasePath = (path: string) => {
  const paths = path.split('/');
  let result = '';
  paths.forEach((item) => {
    item = item.toLowerCase();
    if (~item.indexOf('-')) {
      item = item.replace(/-[a-z]/g, (e) => {
        return e[1].toUpperCase();
      });
    }
    result += item.slice(0, 1).toUpperCase() + item.slice(1);
  });
  return result.split('.')[0];
};

export const getHashCode = (name: string, date: number): string => {
  const hash = createHmac('sha256', 'test')
    .update(name + date)
    .digest('hex');
  const hashArray = hash.match(/[a-z].{7}/);
  return hashArray ? hashArray[0] : 'k' + hash.substr(0, 7);
};

export const getFileHash = (fileName: string, _this: any) => {
  if (/\.wxml/.test(fileName)) {
    fileName = fileName.split('.wxml')[0];
  }
  if (/\.wxss/.test(fileName)) {
    fileName = fileName.split('.wxss')[0];
  }

  const appJson = Array.from(_this.getModuleIds())[0];
  const time = _this.getModuleInfo(appJson).meta.time;
  return getHashCode(fileName, time);
};

export const debounce = (fn: Function, wait: number) => {
  let timer: any;
  return function (this: any) {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      fn.apply(this, arguments);
      timer = null;
    }, wait);
  };
};
