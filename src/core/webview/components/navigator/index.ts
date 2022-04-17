import Base from '@/core/webview/mixin/base';
import Hover from '@/core/webview/mixin/hover';
import template from './template.html';

const types = {
  navigate: 'navigateTo',
  redirect: 'redirectTo',
  switchTab: 'switchTab',
  reLaunch: 'reLaunch',
  navigateBack: 'navigateBack',
};

class Navigator extends Hover(Base) {
  static is = 'wx-navigator';
  static template = template;
  static get properties(): any {
    return {
      url: { type: String, value: '' },
      openType: { type: String, value: 'navigate', reflectToAttribute: true },
      delta: { type: Number, value: 0 },
      hoverStartTime: { type: Number, value: 50 },
      hoverStayTime: { type: Number, value: 600 },
      hoverClass: { type: String, value: 'navigator-hover', observer: '_hoverClassChange', initObserver: true },
    };
  }
  constructor() {
    super();
    this.addEventListener('click', () => {
      const { openType, url, delta } = this as any;
      KipleViewJSBridge.publishHandler('onRouteChange', { type: types[openType], options: { url, delta } }, 0);
    });
  }
}

export default Navigator;
