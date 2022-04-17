import 'kiple-platform/webview/components';
import '@/core/webview/components';
import { createElement } from '@/core/webview/parser/render';
import '@/webview.css';

class KipleApp {
  constructor() {
    this._init();
  }
  createElement = createElement;
  _init() {
    document.documentElement.style.setProperty('--app-height', window.innerHeight + 'px');

    // 将 viewJSBridge 挂载到全局
    // 在 H5 直接使用 window.viewJSBridge 进行事件通讯
    // 在 App 中使用 webview.evalJS('window.viewJSBridge(xxx)') 进行事件通讯
    window.viewJSBridge = {
      subscribe: KipleViewJSBridge.subscribe,
      publishHandler: KipleViewJSBridge.publishHandler,
      subscribeHandler: KipleViewJSBridge.subscribeHandler,
    };
  }
}

(window as any).core = new KipleApp();
