import * as fs from 'fs-extra';
import * as path from 'path';

export const appRoot = fs.realpathSync(process.cwd());

export const resolveApp = (relativePath: string) => path.resolve(appRoot, relativePath);

export const getUpperCasePath = (path: string) => {
  const paths = path.split('/');
  let result = '';
  paths.forEach((item) => {
    item = item.toLowerCase();
    result += item.slice(0, 1).toUpperCase() + item.slice(1);
  });
  return result;
};
