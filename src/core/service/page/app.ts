import { IAppOptions } from './index.d';

let globApp: WrapperApp;
let globPageRegisterPath = '';

export const checkPageInPagesJson = (e: string) => (window.__wxConfig.page[e] ? true : false);

/**
 * 修改当前的正在注册的 page/component 的路由路径
 * 需要判断当前路径是否是已经在 config 的 page 里面，存在的话才进行修改
 */
export const setGlobPageRegisterPath = (e: string) => {
  if (checkPageInPagesJson(e)) {
    globPageRegisterPath = e;
  }
};

export const getGlobPageRegisterPath = () => globPageRegisterPath;

class WrapperApp {
  [x: string]: any;
  constructor(options: IAppOptions) {
    for (const key in options) {
      if (key !== 'globalData') {
        if (typeof options[key] === 'function') {
          this[key] = options[key];
        }
      } else {
        this[key] = JSON.parse(JSON.stringify(options[key]));
      }
    }
    this.init();
    this.__callAppLifeTime__('onLaunch');
    this.__callAppLifeTime__('onShow');
  }
  __callAppLifeTime__(name: string) {
    this[name] && this[name]();
  }
  init() {
    KipleServiceJSBridge.on('onAppEnterBackground', () => {
      this.__callAppLifeTime__('onHide');
    });
    KipleServiceJSBridge.on('onAppEnterForeground', () => {
      this.__callAppLifeTime__('onShow');
    });
  }
}

/**
 * 注册小程序。接受一个 Object 参数，其指定小程序的生命周期回调，全局data等
 * @param {IAppOptions} Options
 */
export const App = (options: IAppOptions) => {
  globApp = new WrapperApp(options);
};

export const getApp = () => globApp;
