import Base from '@/core/webview/mixin/base';
import Hover from '@/core/webview/mixin/hover';
import template from './template.html';

class Button extends Hover(Base) {
  static is = 'wx-button';
  static template = template;
  static get properties(): any {
    return {
      type: { type: String, value: 'default', reflectToAttribute: true },
      size: { type: String, value: 'default', reflectToAttribute: true },
      disabled: { type: Boolean, value: false, reflectToAttribute: true },
      plain: { type: Boolean, value: false, reflectToAttribute: true },
      loading: { type: Boolean, value: false, reflectToAttribute: true },
      formType: { type: String, value: '' },
      openType: { type: String, value: '' },
      hoverStartTime: { type: Number, value: 20 },
      hoverStayTime: { type: Number, value: 70 },
      hoverClass: { type: String, value: 'button-hover', observer: '_hoverClassChange', initObserver: true },
    };
  }
  constructor() {
    super();
  }
}

export default Button;
