/**
 * 仅供 Button,View,Navigator 使用，提供 hover-class 效果
 */
const Hover = (Base: typeof HTMLElement) => {
  class Hover extends Base {
    static is = 'wx-hover';
    private hovering = false;
    private _hoverTouch = false;
    private _hoverStartTimer: any;
    static get properties() {
      return {
        hoverClass: { type: String, value: 'none', observer: '_hoverClassChange' },
        hoverStopPropagation: { type: Boolean, value: false },
        hoverStartTime: { type: Number, value: 50 }, // hover 延时生效事件
        hoverStayTime: { type: Number, value: 400 }, // hover 效果，延时消失时间
      };
    }
    constructor() {
      super();
    }
    _hoverClassChange = (oldValue: string, newValue: string) => {
      if (newValue && oldValue && newValue === 'none') {
        this._unbindHover();
      }
      if (newValue && newValue !== 'none') {
        this._unbindHover();
        this._bindHover();
      }
    };
    private _bindHover = () => {
      this.addEventListener('touchstart', this._hoverTouchStart.bind(this));
      this.addEventListener('touchend', this._hoverTouchEnd.bind(this));
      this.addEventListener('touchcancel', this._hoverCancel.bind(this));
      this.addEventListener('touchmove', this._hoverCancel.bind(this)); // move事件的时候，移除hover效果
    };
    private _unbindHover = () => {
      this.removeEventListener('touchstart', this._hoverTouchStart.bind(this));
      this.removeEventListener('touchend', this._hoverTouchEnd.bind(this));
      this.removeEventListener('touchcancel', this._hoverCancel.bind(this));
      this.removeEventListener('touchmove', this._hoverCancel.bind(this));
    };
    private _hoverTouchStart = () => {
      const _this: any = this;
      if (!_this.hoverClass || _this.hoverClass === 'none' || _this.disabled) {
        return;
      }
      this._hoverTouch = true;
      this._hoverStartTimer = setTimeout(() => {
        this.hovering = true;
        this.classList.toggle((this as any).hoverClass, true);
        if (!this._hoverTouch) {
          // 防止在 hoverStartTime 时间内触发了 touchend,touchcancel,touchmove
          this._hoverReset();
        }
      }, _this.hoverStartTime);
    };
    private _hoverTouchEnd = () => {
      this._hoverTouch = false;
      if (this.hovering) {
        this._unbindHover();
        this._hoverReset();
      }
    };
    private _hoverCancel = () => {
      this._hoverTouch = false;
      // cancel 的时候，直接移除 hover 效果
      this.hovering = false;
      clearTimeout(this._hoverStartTimer);
      this.classList.toggle((this as any).hoverClass, false);
    };
    private _hoverReset = () => {
      requestAnimationFrame(() => {
        clearTimeout(this._hoverStartTimer);
        this._hoverStartTimer = setTimeout(() => {
          this.hovering = false;
          this.classList.toggle((this as any).hoverClass, false);
        }, (this as any).hoverStayTime);
      });
    };
  }

  return Hover;
};

export default Hover;
