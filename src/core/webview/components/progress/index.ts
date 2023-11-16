import Base from '@/core/webview/mixin/base';
import template from './template.tpl';

const VALUES = {
  activeColor: '#09BB07',
  backgroundColor: '#EBEBEB',
  activeMode: 'backwards', // backwards: 动画从头播；forwards：动画从上次结束点接着播
};

class Progress extends Base {
  static is = 'wx-progress';
  static template = template;
  static templateType = 'tpl';
  static get properties(): any {
    return {
      percent: { type: Number, observer: 'percentChanged' },
      activeColor: { type: String, value: VALUES.activeColor },
      backgroundColor: { type: String, value: VALUES.backgroundColor },
      active: { type: Boolean, value: false },
      activeMode: { type: String, value: VALUES.activeMode },
      duration: { type: Number, value: 30 },
    };
  }
  constructor() {
    super();
  }
  data() {
    return { outerBarStyle: {} };
  }
  percentChanged(oldValue: string, newValue: string) {
    console.log(oldValue, newValue, this.getElementProps(), (this as any).__data__);
    let realValue = parseFloat(newValue);
    realValue < 0 && (realValue = 0);
    realValue > 100 && (realValue = 100);
    return realValue;
  }
}

export default Progress;
