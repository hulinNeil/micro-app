import { isFn } from '@/util';
import { publishPageEvent } from 'kiple-platform/webview/bridge';
import { PageFactory } from 'kiple-platform/webview/page/page';

const EventNames = ['tap', 'longtap', 'load', 'error'];
const PrivateEventNames = ['click'];
const PRESS_DELAY = 350; // 手指触摸后，超过 350ms 再离开, longtap事件
const TAP_DISTANCE = 5; // tap事件的移动距离需要小于5px

const addTapEvent = (element: HTMLElement) => {
  let timer: any;
  let firstPosition: any;

  const touchstart = (e: TouchEvent) => {
    firstPosition = { x: e.touches[0].pageX, y: e.touches[0].pageY };
    timer && clearTimeout(timer);
    // 超过350ms，触发长按事件
    timer = setTimeout(() => {
      timer = null;
      // 需要再这里设置一下回调函数，然后改变isLongTap的状态
      const event: any = new Event('wx-longpress', { bubbles: true, composed: true });
      event.detail = firstPosition;
      element.dispatchEvent(event);
    }, PRESS_DELAY);
  };

  const touchmove = (e: TouchEvent) => {
    // 当出现滑动的时候，需要移除监听，以免造成长按事件
    const distanceX = Math.abs(e.changedTouches[0].pageX - firstPosition.x);
    const distanceY = Math.abs(e.changedTouches[0].pageY - firstPosition.y);
    if (distanceX > TAP_DISTANCE || distanceY > TAP_DISTANCE) {
      timer && clearTimeout(timer);
    }
  };

  const touchend = (e: TouchEvent) => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
      const distanceX = Math.abs(e.changedTouches[0].pageX - firstPosition.x);
      const distanceY = Math.abs(e.changedTouches[0].pageY - firstPosition.y);
      if (!(distanceX > TAP_DISTANCE || distanceY > TAP_DISTANCE)) {
        const event: any = new Event('wx-tap', { bubbles: true, composed: true });
        event.detail = { x: e.changedTouches[0].pageX, y: e.changedTouches[0].pageY, sourceEndEvent: e };
        element.dispatchEvent(event);
      }
    }
  };

  element.addEventListener('touchstart', touchstart);
  element.addEventListener('touchmove', touchmove);
  element.addEventListener('touchend', touchend);
  element.addEventListener('touchcancel', touchend);
};

export const addListener = (element: HTMLElement, eventName: string, callback: Function) => {
  // 需要设置一个 __hasTapEvent 属性，用于判断当前元素是否已经绑定了tap事件，如果已经绑定了，那么就不需要再调用addTapEvent方法
  switch (eventName) {
    case 'tap':
      if (!element.__hasTapEvent) {
        element.__hasTapEvent = true;
        addTapEvent(element);
      }
      element.addEventListener('wx-tap', (e: any) => {
        callback.call(element, {
          touches: e.detail.sourceEndEvent.changedTouches,
          changedTouches: e.detail.sourceEndEvent.changedTouches,
          detail: { x: e.detail.x, y: e.detail.y },
          target: e.target,
          timeStamp: e.timeStamp,
        });
      });
      break;
    case 'longtap':
      if (!element.__hasTapEvent) {
        element.__hasTapEvent = true;
        addTapEvent(element);
      }
      element.addEventListener('wx-longpress', (e: any) => {
        callback.call(element, e);
      });
      break;
    default:
      element.addEventListener(eventName, (e: any) => {
        callback.call(element, e);
      });
  }
};

/**
 * 给每个元素绑定事件
 * TODO: 应该是和 react 一样，使用统一的事件分发机制，避免遍历 dom 树
 */
export const applyEvent = (element: HTMLElement, key: string, eventHandleName: string) => {
  const eventNames = /(bind|catch):?(.+)/.exec(key);
  if (eventNames && EventNames.includes(eventNames[2])) {
    const eventName = eventNames[2];
    addListener(element, eventName, (res: any) => {
      const currentPageId = PageFactory.getCurrentWebviewId();
      if (element.getAttribute('disabled')) {
        return;
      }
      // 判断当前元素是否自定义组件里面, 如果是 slot 中的元素是事假如何处理？
      let componentId = 0;
      let parentNode = res.target.parentNode;
      while (parentNode) {
        if (parentNode.tagName && parentNode.tagName.toLocaleLowerCase() === 'wx-page-body') {
          break;
        }
        if (parentNode.__isComponent__) {
          componentId = parentNode.__componentId__;
          break;
        }
        parentNode = parentNode.parentNode;
      }
      publishPageEvent(eventHandleName, res, currentPageId, componentId);
    });
  }
};

/**
 * 处理使用虚拟 dom 创建的内部组件的事件
 */
export const addEvent = (dom: HTMLElement, key: string, value: any) => {
  const eventNames = /(on):?(.+)/.exec(key);
  if (eventNames && PrivateEventNames.includes(eventNames[2].toLocaleLowerCase())) {
    const eventName = eventNames[2].toLocaleLowerCase();
    dom.addEventListener(eventName, (e: any) => {
      let path = e.path;
      if (path) {
        for (const key in path) {
          if (path[key] && path[key]?.nodeName.includes('WX-')) {
            if (path[key][value] && isFn(path[key][value])) {
              path[key][value].call(path[key], {
                target: e.currentTarget,
              });
            }
            break;
          }
        }
      }
    });
  }
};
