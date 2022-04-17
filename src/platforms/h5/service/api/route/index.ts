import { onRouteChange, checkPageInTabList } from '@/core/service/page/page';
import { checkPageInPagesJson } from '@/core/service/page/app';
import { parserUrl } from '@/util';

// TODO: 这个api实现理论上应该是 h5 和 app 通用的，暂时先放到这里，后面在进行文件调整

export interface IRouteParams {
  url?: string;
  delta?: number;
}

const shouldCheckUrlTypes = ['navigateTo', 'redirectTo', 'switchTab', 'reLaunch'];

export const onAppRoute = (type: string, args?: IRouteParams) => {
  const { url } = args || {};
  let { route } = parserUrl(url || '');
  route = route.replace(/^\//, '');

  if (shouldCheckUrlTypes.includes(type)) {
    if (!checkPageInPagesJson(route)) {
      throw new Error(`Page register error. ${route} has not been declared in pages.json.`);
    }
  }

  switch (type) {
    case 'switchTab':
      if (!checkPageInTabList(route)) {
        throw new Error(`can not switch to no-tabBar page`);
      }
      break;
    case 'navigateTo':
    case 'redirectTo':
      if (checkPageInTabList(route)) {
        throw new Error(`can not ${type} a tabbar page`);
      }
      break;
    default:
      break;
  }

  // 新开页面/处理页面栈/处理生命周期
  onRouteChange(type, args || {});

  // 通知 view 层进行路由处理，主要是webview栈的顺序调整和删除多余的Page（H5的url还需要改变）
  KipleServiceJSBridge.publishHandler('onRouteChange', { type, options: args || {} }, 0);

  return {
    errMsg: type + ':ok',
  };
};

export const navigateTo = (args: IRouteParams) => {
  return onAppRoute('navigateTo', args);
};

export const navigateBack = (args?: IRouteParams) => {
  return onAppRoute('navigateBack', args);
};

export const redirectTo = (args: IRouteParams) => {
  return onAppRoute('redirectTo', args);
};

export const reLaunch = (args: IRouteParams) => {
  return onAppRoute('reLaunch', args);
};

export const switchTab = (args: IRouteParams) => {
  return onAppRoute('switchTab', args);
};
