import Base from '@/core/webview/mixin/base';
import template from './template.html';

class PageRefresh extends Base {
  static is = 'wx-page-refresh';
  static template = template;
  refreshSpinnerElem: HTMLElement;
  refreshInnerElem: HTMLElement;
  refreshControllerElem: HTMLElement;
  constructor() {
    super();
    this.refreshControllerElem = this.shadowRoot?.querySelector('.page-refresh') as HTMLElement;
    this.refreshInnerElem = this.shadowRoot?.querySelector('.page-refresh-inner') as HTMLElement;
    this.refreshSpinnerElem = this.shadowRoot?.querySelector('.page-refresh__spinner') as HTMLElement;
  }
}

export default PageRefresh;
