import * as path from 'path';
import * as fs from 'fs-extra';

const reg = /\d+rpx/gi;

const getCssArray = (text: string): Array<string | number> => {
  const result: Array<string | number> = [];

  while (reg.test(text)) {
    const matchTexts = text.match(reg);
    if (matchTexts) {
      const matchText = matchTexts[0];
      const firstString = text.split(matchText);
      if (firstString[0]) {
        result.push(JSON.stringify(firstString[0]));
      }
      result.push(matchText.split('rpx')[0]);
      text = firstString[1] ? firstString[1] : '';
    }
  }
  result.push(JSON.stringify(text));

  return result;
};

/**
 * 根据路径，生成编译后的js文件,步骤:
 * 1. 根据path，生成ast
 * 2. 分析ast，得到该文件中引用了哪些外部css
 * 3. 先编译外部js在编译当前js
 * 4. 初始阶段暂不考虑 外部css，使用硬编码，将 rpx 抽取出来即可
 */
export const transformStyle = (currentPath: string, resolvePath: string): { [key: string]: string } => {
  let targetPath = !/.css$/.test(currentPath) ? `${currentPath}.css` : currentPath;

  const enterPath = path.resolve(resolvePath, './', targetPath);
  const enterCode = fs.readFileSync(enterPath).toString();

  const arrayCode: Array<string | number> = getCssArray(enterCode);

  const code = `setCssToHead([${arrayCode.join(',')}],'${currentPath}')`;
  return { [currentPath]: code };
};
