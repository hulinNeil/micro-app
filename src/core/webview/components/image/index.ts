import { getRealPath } from '@/util/path';
import Base from '@/core/webview/mixin/base';
import { PageFactory } from 'kiple-platform/webview/page/page';
import template from './template.html';

class _Image extends Base {
  static is = 'wx-image';
  static template = template;
  imageWrapper: HTMLElement;
  contentPath: string;
  static get properties(): any {
    return {
      src: { type: String, observer: 'srcChanged', reflectToAttribute: true },
      mode: { type: String, value: 'scaleToFill', observer: 'modeChanged' },
      lazyLoad: { type: Boolean, observer: 'lazyLoadChanged' },
    };
  }
  constructor() {
    super();
    // 获取背景图片的容器
    this.imageWrapper = this.shadowRoot?.querySelector('div') as HTMLElement;
    this.contentPath = '';
  }

  setStyle() {
    let size = 'auto';
    let position = '';
    const repeat = 'no-repeat';

    switch ((this as any).mode) {
      case 'aspectFit':
        size = 'contain';
        position = 'center center';
        break;
      case 'aspectFill':
        size = 'cover';
        position = 'center center';
        break;
      case 'widthFix':
      case 'heightFix':
        size = '100% 100%';
        break;
      case 'top':
        position = 'center top';
        break;
      case 'bottom':
        position = 'center bottom';
        break;
      case 'center':
        position = 'center center';
        break;
      case 'left':
        position = 'left center';
        break;
      case 'right':
        position = 'right center';
        break;
      case 'top left':
        position = 'left top';
        break;
      case 'top right':
        position = 'right top';
        break;
      case 'bottom left':
        position = 'left bottom';
        break;
      case 'bottom right':
        position = 'right bottom';
        break;
      default:
        size = '100% 100%';
        position = '0% 0%';
        break;
    }

    const style = {
      backgroundImage: this.contentPath ? `url("${this.contentPath}")` : 'none',
      backgroundPosition: position,
      backgroundSize: size,
      backgroundRepeat: repeat,
    };
    Object.assign(this.imageWrapper.style, style);
  }

  srcChanged(_: string, newValue: string) {
    const src = getRealPath(newValue, PageFactory.getCurrentWebviewRoute());

    if (src && src !== this.contentPath) {
      const img = new Image();
      this.contentPath = src;
      img.onload = () => {
        this.setStyle();
        this.triggerEvent('load', { width: img.width, height: img.height });
      };
      img.onerror = () => {
        this.triggerEvent('error', { errMsg: `GET ${src} 404 (Not Found)` });
      };
      img.src = src;
    }
  }
}

export default _Image;
