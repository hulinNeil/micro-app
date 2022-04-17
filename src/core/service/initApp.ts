import { require as customRequire } from '@/core/service/helpers/require';
import { registerPage } from '@/core/service/page/page';
import { getAppEntryData, getH5EntryData } from '@/util';

let __webviewId__ = 0; // 记录service层创建的webviewId

// 创建空的webview,并返回对应的Id
export const createPreloadWebview = () => {
  __webviewId__++;
  if (PLATFORM === 'h5') {
    KipleServiceJSBridge.publishHandler('CREATE_PAGE', null, __webviewId__);
  } else if (PLATFORM === 'App') {
    plus.webview.create('file://_www/view.html', __webviewId__);
  }

  return __webviewId__;
};

export const getPreloadWebviewId = () => __webviewId__;

/*
 * 小程序的入口，初始化小程序
 * 暂定H5中: service.js 和 webview.js 运行在一起，不将 service.js 运行在 worker 中.
 * 暂定webview中: service.js 运行在一个含有 service.html 的 webview 中, webview.js 运行在每个渲染层的 webview 中
 */
export const initApp = () => {
  let route = '';
  let query;

  if (PLATFORM === 'h5') {
    const h5EntryData = getH5EntryData();
    route = h5EntryData.route;
    query = h5EntryData.query;
  } else if (PLATFORM === 'App') {
    const appEntryData = getAppEntryData();
    route = appEntryData.route;
    query = appEntryData.query;
  } else {
    throw new Error(`The current environment [${PLATFORM}] is not registered.`);
  }

  if (!route) {
    route = window.__wxConfig.entryPagePath;
  }

  // 创建 H5 的页面容器
  if (PLATFORM === 'h5') {
    KipleServiceJSBridge.publishHandler('CREATE_APP', null, 0);
  }

  // 创建 Page
  var webviewId = createPreloadWebview();

  customRequire('app.js');

  registerPage(route, webviewId, query);
};
