import * as path from 'path';
import * as fs from 'fs-extra';

export const transformConfig = (currentPath: string, resolvePath: string): { [key: string]: Object } => {
  let targetPath = !/.json$/.test(currentPath) ? `${currentPath}.json` : currentPath;

  const enterPath = path.resolve(resolvePath, './', targetPath);
  const enterCode = fs.readFileSync(enterPath).toString();

  const pageJson = JSON.parse(enterCode);

  return { [currentPath]: pageJson };
};
