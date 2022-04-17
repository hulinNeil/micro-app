import Base from '@/core/webview/mixin/base';
import template from './template.html';

class Page extends Base {
  static is = 'wx-page';
  static template = template;
  constructor() {
    super();
  }
}

export default Page;
