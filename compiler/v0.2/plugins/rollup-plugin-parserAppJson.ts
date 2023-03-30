import * as fs from 'fs-extra';
import { IConfig, IPageModule } from '.';
import { checkFolder, fileIsExist, getFileContent, getHashCode, getRelativePath, getResolvePath, getUpperCasePath, resolveApp } from '../utils';

// 保存所有页面的路径信息
export let allPages: { [path: string]: { type: 'page' | 'component'; enterPath: string; config: any } } = {};

/**
 * 生成 app-config.js
 */
const generateConfigAndComponents = (config: IConfig, appJsonPath: string, _this: any) => {
  config.page = {};
  for (let index = 0; index < config.pages.length; index++) {
    const page = config.pages[index];
    const pageJsonPath = getResolvePath(appJsonPath, '../', page + '.json');

    if (fileIsExist(pageJsonPath)) {
      const pageJsonStringData = getFileContent(pageJsonPath);
      const pageJson = pageJsonStringData ? JSON.parse(pageJsonStringData) : {};
      // 处理自定义组件
      if (pageJson.usingComponents) {
        for (const componentName in pageJson.usingComponents) {
          if (Object.prototype.hasOwnProperty.call(pageJson.usingComponents, componentName)) {
            const componentPath = pageJson.usingComponents[componentName];
            let componentJsonPath;
            if (componentPath[0] === '/') {
              componentJsonPath = getResolvePath(appJsonPath, '..' + componentPath + '.json');
            } else {
              componentJsonPath = getResolvePath(pageJsonPath, '../', componentPath + '.json');
            }
            // 处理 component.json
            if (!fileIsExist(componentJsonPath)) {
              throw new Error(`${page}.json 文件内容错误: ["usingComponents"]["${componentName}"]: "${componentPath}" 未找到`);
            }

            const componentJsonStringData = getFileContent(componentJsonPath);
            const componentJson = componentJsonStringData ? JSON.parse(componentJsonStringData) : {};
            const relativePath = getRelativePath(appJsonPath, componentJsonPath).replace('.json', '');
            config.page[relativePath] = componentJson;
            // 监听页面 json 配置的变化
            _this.addWatchFile(componentJsonPath);
            // 将组件路径统一, 方便渲染时查询
            pageJson.usingComponents[componentName] = relativePath;
            // 处理 component 路径
            if (!allPages[relativePath]) {
              allPages[relativePath] = { type: 'component', enterPath: `${page}.json`, config: componentJson };
            }
          }
        }
      }
      config.page[page] = pageJson;
      // 当页面不存在，或者页面保存时是以组件形式保存的才进行添加
      if (!allPages[page] || allPages[page].type === 'component') {
        allPages[page] = { type: 'page', enterPath: 'app.json', config: pageJson };
      }
    }

    // 监听页面 json 配置的变化
    _this.addWatchFile(pageJsonPath);
  }

  config.entryPagePath = config.entryPagePath ? config.entryPagePath : config.pages[0];
  config.global = { window: config.window };
  delete config.window;

  const source = `window.__wxConfig = ${JSON.stringify(config)}`;
  _this.emitFile({ type: 'asset', fileName: 'app-config.js', source });
};

/**
 * 处理 app.json，批量导入 page js 文件,生成 app-service.js, 同时生成 app-config.js
 */
export const serviceRoot = () => ({
  name: 'transform-config',
  buildStart() {
    // 初次进入，重置页面路径
    allPages = {};
  },
  transform(source: string, fileName: string) {
    if (/app\.json$/.test(fileName)) {
      const config: IConfig = JSON.parse(source);

      // 处理小程序配置文件, 生成 app-config.js, 添加 page.json 中的自定义组件
      generateConfigAndComponents(config, fileName, this);

      // 处理 page js 文件
      var code = `import './app.js';`;
      Object.keys(allPages).forEach((item) => {
        const targetPath = getResolvePath(fileName, '../', item + '.js');

        if (!fileIsExist(targetPath)) {
          (this as any).addWatchFile(targetPath);
          throw new Error(`未找到 ${allPages[item].enterPath} 中的定义的 ${allPages[item].type} "${item}" 对应的 .js 文件`);
        }
        code += `import './${item}';`;
      });

      // 初始化程序
      code += `\ninitApp();`;

      // 拷贝 index.html 到 dist 目录
      checkFolder(resolveApp('dist'));
      fs.copyFileSync(resolveApp('compiler/v0.2/injects/index.html'), resolveApp('dist/index.html'));

      return { code, map: null };
    }
    return null;
  },
});

const curTime = new Date().getTime();
/**
 * 处理 app.json，批量导入 page kml/css 文件
 */
export const viewRoot = () => ({
  name: 'transform-config',
  transform(source: string, fileName: string) {
    if (/app\.json$/.test(fileName)) {
      var code = "import {__AppCssCode__,setCssToHead} from  'inject/view.js';import AppStyle from './app.wxss';";
      const result: IPageModule[] = [];

      // 获取页面的模板和样式
      Object.keys(allPages).forEach((item) => {
        const moduleName = getUpperCasePath(item);
        let cssModuleName = moduleName + 'Style';
        const targetPath = getResolvePath(fileName, '../', item);

        // 只有当page必要的文件都存在时，才进行导入 .wxml
        if (!fileIsExist(targetPath + '.wxml')) {
          (this as any).addWatchFile(targetPath + '.wxml');
          throw new Error(`未找到 ${allPages[item].enterPath} 中的定义的 ${allPages[item].type} "${item}" 对应的 .wxml 文件`);
        }

        code += `import ${moduleName} from './${item}.wxml';`;

        // 判断 .wxss 文件是否存在，存在的话才进行导入，不存在的话加上监听
        if (fileIsExist(targetPath + '.wxss')) {
          code += `import ${cssModuleName} from './${item}.wxss';`;
        } else {
          (this as any).addWatchFile(targetPath + '.wxss');
          cssModuleName = '';
        }

        result.push({ path: item, resolvePath: targetPath, moduleName, cssModuleName });
      });

      const pages: string[] = [];
      result.forEach((item) => {
        const hash = getHashCode(getResolvePath(fileName, '../', item.path), curTime);
        pages.push(`${JSON.stringify(item.path)}:{render: ${item.moduleName}, hash: "${hash}"} `);
      });

      code += `\nwindow.app = {${pages.join(',')}};\n__AppCssCode__['app'] = setCssToHead(AppStyle,'app');`;

      // 转换 css
      result.forEach((item) => {
        if (item.cssModuleName) {
          code += `\n__AppCssCode__['${item.path}'] = setCssToHead(${item.cssModuleName},'${item.path}');`;
        }
      });

      return { code, map: null, meta: { time: curTime } };
    }
    return null;
  },
});
