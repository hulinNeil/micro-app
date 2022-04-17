import { Page } from './page';
import { publishPageEvent } from '../bridge';

let scrollListener: any = false;

const initScrollEvent = (page: Page) => {
  // 当页面显示的时候，如果已经存在 scroll 事件监听，都需要移除它
  if (scrollListener) {
    document.removeEventListener('scroll', scrollListener);
  }

  // 获取
  const { enableTransparentTitle, enablePageScroll, enablePageReachBottom } = page;

  // page 是渐变 title,或有监听滑动事件,滑动到底部事件,才进行 scroll 事件的监听
  if (enableTransparentTitle || enablePageScroll || enablePageReachBottom) {
    scrollListener = () => {
      const scrollTop = window.pageYOffset;
      if (enablePageScroll) {
        // 向 Service 发送 onPageScroll 事件
        publishPageEvent('onPageScroll', { scrollTop }, page.__webviewId__);
      }
      if (enableTransparentTitle) {
        // 向 header 组件发送 scroll
        KipleViewJSBridge.emit('onPageScroll', { scrollTop });
      }
    };

    requestAnimationFrame(function () {
      document.addEventListener('scroll', scrollListener);
    });
  }
};

export default initScrollEvent;
