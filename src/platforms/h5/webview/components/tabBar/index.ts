import { publishPageEvent } from '../../bridge';
import Base from '@/core/webview/mixin/base';
import { PageFactory } from '../../page/page';
import template from './template.tpl';
import { history } from '../../page/route';

class App extends Base {
  static is = 'wx-tabbar';
  static templateType = 'tpl';
  static template = template;
  showTabBar = false;
  selectedIndex = 0;
  constructor() {
    const props = Object.assign({ selectIndex: 0 }, window.__wxConfig.tabBar || {});
    super(props);

    const contentView = this.shadowRoot?.querySelector('.uni-tabbar') as HTMLElement;

    contentView.addEventListener('click', (e) => {
      let target = e.target as HTMLElement | null;
      while (target) {
        // 遇到根节点就跳出循环
        if (target.classList.contains('uni-tabbar__item')) {
          this._switchTab(target);
          break;
        } else if (target.classList.contains('uni-tabbar')) {
          break;
        }
        target = target.parentElement;
      }
    });
  }
  connectedCallback() {
    // 初次触发active
    this._onRouteChange(location.pathname);

    // 处理路由的监听
    history.listen(({ location }) => {
      this._onRouteChange(location.pathname);
    });
  }
  _show() {
    this.showTabBar = true;
    this.style.display = 'block';
    (this.parentElement as HTMLElement).classList.toggle('uni-showTabbar', true);
  }
  _hide() {
    this.showTabBar = false;
    this.style.display = 'none';
    (this.parentElement as HTMLElement).classList.toggle('uni-showTabbar', false);
  }
  /**
   * 触发 item 的点击事件
   */
  _switchTab(e: HTMLElement) {
    const index = Number(e.dataset.index);
    const { text, pagePath } = this.__data__.list[index];
    if (index !== this.__data__.selectIndex) {
      KipleViewJSBridge.publishHandler('onRouteChange', { type: 'switchTab', options: { url: pagePath } }, 0);
    } else {
      // 向 Service 发送 onTabItemTap 事件
      const detail = { index, text, pagePath };
      publishPageEvent('onTabItemTap', detail, PageFactory.getCurrentWebviewId());
    }
  }
  /**
   * 路由改变时，决定tabbar显示或是隐藏，同时决定哪个tab高亮
   */
  _onRouteChange(newURL?: string, oldURL?: string) {
    const tabList = window.__wxConfig.tabBar.list.map((item) => item.pagePath);
    if (newURL && newURL[0] === '/') {
      newURL = newURL.replace('/', '');
    }
    if (!newURL) {
      newURL = window.__wxConfig.pages[0];
    }

    const index = tabList.findIndex((item) => item === newURL);

    if (index !== -1) {
      this.setData({ selectIndex: index });
    }

    if (index !== -1 && !this.showTabBar) {
      this._show();
    } else if (index === -1 && this.showTabBar) {
      this._hide();
    }
  }
}

export default App;
