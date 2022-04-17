import PageRefresh from './index';
import { publishPageEvent } from '../../bridge';
import { PageFactory } from '../../page/page';

interface RefreshData {
  state: null | 'pulling' | 'reached' | 'aborting' | 'refreshing' | 'restoring';
  offset: number;
  startY?: number;
  deltaY?: number;
  touchId: number | null;
  canRefresh?: boolean;
  distance: number | null;
}

const PULLING = 'pulling';
const REACHED = 'reached';

const ABORTING = 'aborting';
const REFRESHING = 'refreshing';
const RESTORING = 'restoring';

/**
 * 仅供 Body 使用，提供下拉刷新效果
 */
const Refresh = (Base: typeof HTMLElement) => {
  class Refresh extends Base {
    static is = 'wx-refresh';
    refreshOptions = {
      color: '#2BD009',
      height: 70,
      range: 150,
      offset: 0,
    };
    refreshData: RefreshData = { touchId: null, offset: 0, distance: null, state: null };
    pageRefresh!: PageRefresh;
    static get properties() {
      return {
        enablePullDownRefresh: { type: Boolean, value: false, observer: '_onEnableChange' },
      };
    }
    constructor() {
      super();
    }
    _onEnableChange(_: boolean, enable: boolean) {
      if (enable && !this.pageRefresh) {
        const currentPage = PageFactory.getCurrentPage();
        this.pageRefresh = document.createElement('wx-page-refresh') as PageRefresh;
        // 如果是 transparent header, 需要添加新属性, 保证下拉框位置正确
        if (currentPage.enableTransparentTitle) {
          this.pageRefresh.classList.add('page-refresh-transparent');
        }
        (this.parentElement as HTMLElement).appendChild(this.pageRefresh);

        this.addEventListener('touchstart', this._touchstart.bind(this));
        this.addEventListener('touchmove', this._touchmove.bind(this));
        this.addEventListener('touchend', this._touchend.bind(this));

        KipleViewJSBridge.on(`onPullDownRefreshChange.${currentPage.__webviewId__}`, (status: 'start' | 'stop') => {
          if (status === 'stop') {
            this._restoring();
          } else if (status === 'start') {
            if (!this.refreshData.state) {
              this.refreshData.state = REFRESHING;
              this._toggleClass('add');
              setTimeout(() => {
                this._refreshing();
              }, 50);
            }
          }
        });
      }
    }
    /**
     * 修改 refresh 组件的 class
     */
    _toggleClass(type: 'add' | 'remove') {
      if (!this.refreshData.state) {
        return;
      }
      const elem = this.pageRefresh;
      if (elem) {
        elem.classList[type]('page-refresh--' + this.refreshData.state);
      }
    }
    /**
     * 判断当前滑动的event是否和滑动开始的event是一组滑动事件，并计算已经滑动的距离
     */
    processDeltaY(evt: TouchEvent, identifier: number, startY: number) {
      const touch = Array.prototype.slice.call(evt.changedTouches).filter((touch) => touch.identifier === identifier)[0];
      if (!touch) {
        return false;
      }
      (evt as any).deltaY = touch.pageY - startY;
      return true;
    }
    /**
     * 开始滑动,记录滑动的初始位置，判断组件当前的状态是否允许再次进行下拉刷新;
     * 如果state有值,说明正处于刷新,本次滑动不能触发下拉刷新.
     */
    _touchstart(event: TouchEvent) {
      const touch = event.changedTouches[0];
      this.refreshData.touchId = touch.identifier;
      this.refreshData.startY = touch.pageY;
      if (this.refreshData.state && [ABORTING, REFRESHING, RESTORING].includes(this.refreshData.state)) {
        this.refreshData.canRefresh = false;
      } else {
        this.refreshData.canRefresh = true;
      }
    }
    /**
     * 滑动中,开始判断是否需要修改组件,并处理滑动需要的值，修改 state 状态，修改组件的样式
     */
    _touchmove(event: TouchEvent) {
      if (!this.refreshData.canRefresh) {
        return;
      }

      if (this.refreshData.touchId === null || !this.processDeltaY(event, this.refreshData.touchId, this.refreshData.startY || 0)) {
        return;
      }

      if ((document.documentElement.scrollTop || document.body.scrollTop) !== 0) {
        this.refreshData.touchId = null;
        return;
      }

      let { deltaY } = event as any;
      if (deltaY < 0 && !this.refreshData.state) {
        return;
      }

      // 处于下拉状态，则阻止页面滚动
      event.preventDefault();

      if (this.refreshData.distance === null) {
        this.refreshData.offset = deltaY;
        this.refreshData.state = PULLING;
        this._toggleClass('add');
      }

      deltaY = deltaY - this.refreshData.offset;
      if (deltaY < 0) {
        deltaY = 0;
      }

      this.refreshData.distance = deltaY;

      const reached = deltaY >= this.refreshOptions.range && this.refreshData.state !== REACHED;
      const pulling = deltaY < this.refreshOptions.range && this.refreshData.state !== PULLING;

      // 如果已经达成下拉的距离，那么需要重置，如果没有，状态变为已完成
      if (reached || pulling) {
        this._toggleClass('remove');
        this.refreshData.state = this.refreshData.state === REACHED ? PULLING : REACHED;
        this._toggleClass('add');
      }

      this._pulling(deltaY);
    }
    /**
     * 滑动结束，判断是恢复组件位置还是显示持续刷新
     */
    _touchend(event: TouchEvent) {
      if (this.refreshData.touchId === null || !this.processDeltaY(event, this.refreshData.touchId, this.refreshData.startY || 0)) {
        return;
      }

      if (this.refreshData.state === null) {
        return;
      }

      if (this.refreshData.state === PULLING) {
        this._toggleClass('remove');
        this.refreshData.state = ABORTING;
        this._toggleClass('add');
        this._aborting(() => {
          this._toggleClass('remove');
          this.refreshData.state = this.refreshData.distance = null;
          this.refreshData.offset = 0;
        });
      } else if (this.refreshData.state === REACHED) {
        this._toggleClass('remove');
        this.refreshData.state = REFRESHING;
        this._toggleClass('add');
        this._refreshing();
      }
    }
    /**
     * 下拉中，修改组件的位置
     */
    _pulling(deltaY: number) {
      const elem = this.pageRefresh.refreshControllerElem;
      if (!elem) {
        return;
      }

      const style = elem.style;

      let rotate = deltaY / this.refreshOptions.range;

      if (rotate > 1) {
        rotate = 1;
      } else {
        rotate = rotate * rotate * rotate;
      }

      const y = Math.round(deltaY / (this.refreshOptions.range / this.refreshOptions.height));

      const transform = y ? 'translate3d(-50%, ' + y + 'px, 0)' : '';

      style.webkitTransform = transform;
      style.clip = 'rect(' + (45 - y) + 'px,45px,45px,-5px)';

      this.pageRefresh.refreshInnerElem.style.webkitTransform = 'rotate(' + 360 * rotate + 'deg)';
    }
    /**
     * 当达到临界点，释放下拉，触发事件，通知 Service 层触发 onPullDownRefresh 事件
     */
    _refreshing() {
      const elem = this.pageRefresh.refreshControllerElem;
      if (!elem) {
        return;
      }

      const style = elem.style;
      style.webkitTransition = '-webkit-transform 0.2s';
      style.webkitTransform = 'translate3d(-50%, ' + this.refreshOptions.height + 'px, 0)';

      // 开始通知 Service 层触发 onPullDownRefresh 事件
      const currentPageId = PageFactory.getCurrentWebviewId();
      publishPageEvent('onPullDownRefresh', {}, currentPageId);
    }
    /**
     * 当未达到临界点，释放下拉，触发事件
     */
    _aborting(callback: Function) {
      const elem = this.pageRefresh.refreshControllerElem;
      if (!elem) {
        return;
      }

      const style = elem.style;

      // 处于动画的状态，那么就需要将组件返回原来的位置
      if (style.webkitTransform) {
        style.webkitTransition = '-webkit-transform 0.3s';
        style.webkitTransform = 'translate3d(-50%, 0, 0)';
        const abortTransitionEnd = function () {
          timeout && clearTimeout(timeout);
          elem.removeEventListener('webkitTransitionEnd', abortTransitionEnd);
          style.webkitTransition = '';
          callback();
        };
        elem.addEventListener('webkitTransitionEnd', abortTransitionEnd);
        const timeout = setTimeout(abortTransitionEnd, 350); // 部分手机，部分情况webkitTransitionEnd不触发
      } else {
        callback();
      }
    }
    /**
     * 使用 api 停止下拉刷新，恢复组件至初始状态
     */
    _restoring() {
      if (this.refreshData.state !== REFRESHING) {
        return;
      }
      this._toggleClass('remove');
      this.refreshData.state = RESTORING;
      this._toggleClass('add');

      const elem = this.pageRefresh.refreshControllerElem;
      if (!elem) {
        return;
      }

      const style = elem.style;
      style.webkitTransition = '-webkit-transform 0.3s';
      style.webkitTransform += ' scale(0.01)';

      const restoreTransitionEnd = () => {
        timeout && clearTimeout(timeout);
        elem.removeEventListener('webkitTransitionEnd', restoreTransitionEnd);
        style.webkitTransition = '';
        style.webkitTransform = 'translate3d(-50%, 0, 0)';
        this._toggleClass('remove');
        this.refreshData.state = this.refreshData.distance = null;
        this.refreshData.offset = 0;
      };

      elem.addEventListener('webkitTransitionEnd', restoreTransitionEnd);
      const timeout = setTimeout(restoreTransitionEnd, 350); // 部分手机，部分情况webkitTransitionEnd不触发
    }
  }

  return Refresh;
};

export default Refresh;
