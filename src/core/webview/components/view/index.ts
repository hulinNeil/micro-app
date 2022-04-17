import Base from '@/core/webview/mixin/base';
import Hover from '@/core/webview/mixin/hover';
import template from './template.html';

class View extends Hover(Base) {
  static is = 'wx-view';
  static template = template;
  constructor() {
    super();
  }
}

export default View;
