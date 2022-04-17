import * as fs from 'fs-extra';
import { generateServiceFile, generateFrameFile, generateConfigFile } from './core/generateService';
import { transformJsCode } from './core/transformJsCode';
import { transformStyle } from './core/transformStyle';
import { transformTemplate } from './core/transformTemplate';
import { transformConfig } from './core/transformConfig';
import { resolveApp } from './utils';

const startTime = new Date().getTime();
const appJsonPath = resolveApp('example/app.json');

const appJson = JSON.parse(fs.readFileSync(appJsonPath).toString());

const pages: string[] = [...appJson.pages, 'app'];
const appServiceData = {};
const appViewData = {};
const appStyle = {};
appJson.page = {};

try {
  pages.forEach((item) => {
    Object.assign(appServiceData, transformJsCode(item, resolveApp('example')));
    Object.assign(appViewData, transformTemplate(item, resolveApp('example')));
    Object.assign(appStyle, transformStyle(item, resolveApp('example')));
    Object.assign(appJson.page, transformConfig(item, resolveApp('example')));
  });
  generateServiceFile(appServiceData);
  generateFrameFile(appViewData, appStyle);
  generateConfigFile(appJson);
} catch (error) {
  console.error('error:', error);
}

const endTime = new Date().getTime();
console.log('==========时间差===================', endTime - startTime);
