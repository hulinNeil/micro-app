import hexToRgba from '@/util/color';
import Base from '@/core/webview/mixin/base';
import template from './template.html';

export interface PageHeadElement extends HTMLElement {
  navigationBarTextStyle: string;
  navigationBarBackgroundColor: string;
  navigationBarTitleText: string;
  navigationStyle: string;
  coverage: number;
  loading: boolean;
  showBackButton: boolean;
}

class PageHead extends Base {
  static is = 'wx-page-head';
  static template = template;
  static get properties(): any {
    return {
      navigationBarTextStyle: { type: String, value: 'black', observer: '_onNavigationBarChange', initObserver: true },
      navigationBarBackgroundColor: { type: String, value: '#F7F7F7', observer: '_onNavigationBarChange', initObserver: true },
      navigationBarTitleText: { type: String, value: '', observer: '_onNavigationBarChange', initObserver: true },
      navigationStyle: { type: String, value: 'default', observer: '_onNavigationBarChange', initObserver: true },
      coverage: { type: Number, value: 132 }, // 滑动时渐变的区域距离
      loading: { type: Boolean, value: false, reflectToAttribute: true },
      showBackButton: { type: Boolean, value: true, observer: '_setBackButton', initObserver: true },
    };
  }
  placeholderView: HTMLElement;
  backBtn: HTMLElement;
  headView: HTMLElement;
  titleText: HTMLElement;
  oldAlpha: any;
  backgroundRGB: any;
  constructor() {
    super();
    this.backBtn = this.shadowRoot?.querySelector('.uni-page-head-back') as HTMLElement;
    this.titleText = this.shadowRoot?.querySelector('.uni-page-head-bd') as HTMLElement;
    this.placeholderView = this.shadowRoot?.querySelector('.uni-page-head-placeholder') as HTMLElement;
    this.headView = this.shadowRoot?.querySelector('.uni-page-head') as HTMLElement;

    this.backBtn.addEventListener('click', () => {
      // 传递消息给 Service 层; 在 App 中 Service 层直接就是监听 webview 的 back 事件进行事件触发
      KipleViewJSBridge.publishHandler('onRouteChange', { type: 'navigateBack' }, 0);
    });
  }
  _onNavigationBarChange(_: string, newValue: string, name: string) {
    const headerBody = this.shadowRoot?.querySelector('.uni-page-head-bd') as HTMLElement;
    const header = this.shadowRoot?.querySelector('.uni-page-head') as HTMLElement;
    switch (name) {
      case 'navigationBarTextStyle':
        header.style.color = newValue;
        break;
      case 'navigationBarBackgroundColor':
        if ((this as any).navigationStyle === 'transparent' && this.backgroundRGB) {
          this.backgroundRGB = hexToRgba(newValue);
          header.style.backgroundColor = `rgba(${this.backgroundRGB.r}, ${this.backgroundRGB.g}, ${this.backgroundRGB.b}, ${this.oldAlpha})`;
        } else {
          header.style.backgroundColor = newValue;
        }
        break;
      case 'navigationBarTitleText':
        headerBody.innerText = newValue;
        break;
      case 'navigationStyle':
        newValue === 'custom' && this.remove();
        newValue === 'transparent' && this.setTransparent();
        break;
      default:
        break;
    }
  }
  _setBackButton(_: string, newValue: boolean) {
    if (!newValue) {
      this.backBtn.remove();
    }
  }
  setTransparent() {
    // 移除占位的元素
    this.placeholderView.remove();
    // 父元素添加transparent属性
    this.headView.classList.toggle('uni-page-head-transparent', true);
    this.oldAlpha = 0;
    this.backgroundRGB = hexToRgba((this as any).navigationBarBackgroundColor);
    this._onPageScroll({ scrollTop: 0 });
    KipleViewJSBridge.on('onPageScroll', this._onPageScroll.bind(this));
  }
  _onPageScroll({ scrollTop }: { scrollTop: number }) {
    const alpha = Math.min(scrollTop / (this as any).coverage, 1);
    if (this.oldAlpha === 1 && alpha === 1) {
      return;
    }
    this.oldAlpha = alpha;
    // 处理title整体的背景颜色
    this.headView.style.backgroundColor = `rgba(${this.backgroundRGB.r}, ${this.backgroundRGB.g}, ${this.backgroundRGB.b}, ${alpha})`;
    // 处理title 文字
    this.titleText.style.opacity = String(alpha);
    // 处理返回按钮的背景颜色
    if ((this as any).navigationBarTextStyle === 'black') {
      if (alpha > 0.5) {
        this.backBtn.style.color = '#000';
      } else {
        this.backBtn.style.color = '#fff';
      }
    }
    // 处理返回按钮的背景颜色
    this.backBtn.style.backgroundColor = `rgba(0,0,0,${(1 - alpha) / 2})`;
  }
}

export default PageHead;
