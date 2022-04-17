import { PageBodyElement } from '../components/body';
import { PageHeadElement } from '../components/header';
import { diff } from '@/core/webview/parser/diff/diff';
import { patch } from '@/core/webview/parser/diff/patch';
import { createDomTree } from '@/core/webview/parser/render';
import initScrollEvent from './scroll';
import { WrapperPage } from '@/core/service/page/page';

/**
 * 记录已经在 View 层创建的Page
 */
const AppPages: Page[] = [];

// TODO: 需要将这个类拆开，只有h5独有的才放到这里
export class Page {
  __webviewId__: number;
  __route__: string = '';
  __DOMTree__: HTMLElement | Text | Comment | null = null;
  __VirtualDom__: IVirtualDom | null = null;
  __isTabBar__: boolean = false;
  pageConfig: IWindow;
  pendingRender = false;
  enableTransparentTitle: boolean = false;
  enablePageScroll: boolean = false;
  enablePageReachBottom: boolean = false;
  root = document.querySelector('wx-app') || document.body;
  pageContainer: HTMLElement; // TODO?: HTMLElement 属性的值是否应该和小程序一样，每个 node 创建 nodeId，这里仅保存 nodeId，以减少内存开销 
  navigationBar: PageHeadElement;
  webviewBody: PageBodyElement;
  constructor(__webviewId__: number) {
    this.__webviewId__ = __webviewId__;
    this.pageConfig = window.__wxConfig.global.window;
    // 创建容器
    const pageContainer = document.createElement('wx-page');
    this.navigationBar = document.createElement('wx-page-head') as PageHeadElement;
    this.webviewBody = document.createElement('wx-page-body') as PageBodyElement;
    pageContainer.appendChild(this.navigationBar);
    pageContainer.appendChild(this.webviewBody);
    this.pageContainer = pageContainer;
  }
  initScrollEvent = () => initScrollEvent(this);
  resetBackground = () => {
    this.pageContainer.style.backgroundColor = this.pageConfig.backgroundColor || '#ffffff';
  };
  setPullDownRefresh = (options: { [key: string]: any }, webviewConfig: IWindow) => {
    if (options.onPullDownRefresh && webviewConfig.enablePullDownRefresh) {
      this.webviewBody.enablePullDownRefresh = true;
    }
  };
  render = (options: WrapperPage) => {
    const curWindowStyle = this.pageConfig;
    if ((options as any).onPageScroll) {
      this.enablePageScroll = true;
    }
    if ((options as any).onReachBottom) {
      this.enablePageReachBottom = true;
    }
    if (curWindowStyle.navigationStyle === 'transparent') {
      this.enableTransparentTitle = true;
    }

    // 当第一次渲染页面后，需要监听当前 page 的 scroll 事件
    this.initScrollEvent();
    // 设置窗口颜色
    this.resetBackground();
    // 设置title
    Object.assign(this.navigationBar, curWindowStyle);
    // 设置下拉刷新
    this.setPullDownRefresh(options, curWindowStyle);
    // 修改 document title
    document.title = this.navigationBar.navigationBarTitleText;

    this.__VirtualDom__ = window.app[this.__route__].render(options.data);
    // 用来在 create 组件的时候知道这个组件挂载到哪里，然后将组件保存到Page对象的一个数组中，TODO: 需要有更加优雅的实现方式
    this.pendingRender = true;
    // 生成页面 Dom 树
    this.__DOMTree__ = createDomTree(this.__VirtualDom__, window.app[this.__route__].hash);
    this.pendingRender = false;
    if (this.__DOMTree__) {
      this.webviewBody.appendChild(this.__DOMTree__);
      const lastPage = AppPages[AppPages.length - 3]; // 最后一个页面是预加载页面，倒数第二个页面是当前页面，倒数第三个页面才是 lastPage
      // 初次渲染 page， 如果存在上个page，那么就replace
      if (lastPage && lastPage.pageContainer) {
        this.root.replaceChild(this.pageContainer, lastPage.pageContainer);
      } else {
        this.root.insertBefore(this.pageContainer, this.root.firstChild);
      }
    }
  };
  reRender = (options: { [key: string]: any }) => {
    const newVirtualDom = window.app[this.__route__].render(options.data || {});
    const hash = window.app[this.__route__].hash;
    if (this.__DOMTree__ && this.__VirtualDom__) {
      // 这个方案是没有进行 key 的使用的 ！！！
      const patches = diff(this.__VirtualDom__, newVirtualDom);
      patch(this.__DOMTree__, patches, hash);
      this.__VirtualDom__ = newVirtualDom;
    }
  };
}

/**
 * 管理 View 层的 Page Stack.
 */
export const PageFactory = {
  createPage: (webviewId: number) => {
    var page = new Page(webviewId);
    AppPages.push(page);
    return page;
  },
  removePage: (pageIndex: number) => {
    if (pageIndex > -1) {
      AppPages.splice(pageIndex, 1);
    }
  },
  replacePage: (replaceLength: number = 1, currentWebviewId?: number) => {
    let currentPage: Page | undefined;
    if (currentWebviewId !== undefined) {
      currentPage = AppPages.find((item) => item.__webviewId__ === currentWebviewId);
    } else {
      currentPage = PageFactory.getCurrentPage();
    }
    const lastPage = PageFactory.getLastPage(replaceLength);
    if (lastPage && lastPage.pageContainer && currentPage?.pageContainer) {
      lastPage.initScrollEvent();
      lastPage.resetBackground();
      lastPage.root.replaceChild(lastPage.pageContainer, currentPage.pageContainer);
      // 修改 document title
      document.title = lastPage.navigationBar.navigationBarTitleText;
      // 移除页面
      PageFactory.deleteLastPage(replaceLength, 0);
    }
  },
  /* 移除指定长度的页面 */
  deleteLastPage: (delta: number = 1, tabPageLength: number, ignoreTab: Boolean = true) => {
    const index = AppPages.length - tabPageLength - 2;
    if (index < 0) {
      return;
    }
    const lastPage = AppPages[index];
    const tabList = window.__wxConfig.tabBar.list.map((item) => item.pagePath);
    if (!ignoreTab || !tabList.includes(lastPage.__route__)) {
      PageFactory.removePage(index);
    } else {
      tabPageLength += 1;
    }
    delta -= 1;
    if (delta > 0) {
      PageFactory.deleteLastPage(delta, tabPageLength, ignoreTab);
    }
  },
  replacePageIndex: (firstIndex: number, lastIndex: number) => {
    [AppPages[firstIndex], AppPages[lastIndex]] = [AppPages[lastIndex], AppPages[firstIndex]];
  },
  getPage: (webviewId: number) => {
    const page = AppPages.find((page) => page.__webviewId__ === webviewId);
    return page || null;
  },
  getPendingPage: () => {
    const page = AppPages.find((page) => page.pendingRender === true);
    return page || null;
  },
  getPageByRoute: (route: string) => {
    const page = AppPages.find((page) => page.__route__ === route);
    return page || null;
  },
  getCurrentPage: () => {
    const page = PageFactory.getLastPage(0);
    return page;
  },
  getLastPage: (lastIndex: number) => {
    const page = AppPages[AppPages.length - lastIndex - 2];
    return page || null;
  },
  getCurrentWebviewRoute: () => {
    const page = PageFactory.getCurrentPage();
    return page.__route__;
  },
  getCurrentWebviewId: () => {
    const page = PageFactory.getCurrentPage();
    return page.__webviewId__;
  },
  getLastTabPageIndex: () => {
    for (let index = AppPages.length - 1; index >= 0; index--) {
      if (AppPages[index].__isTabBar__) {
        return index;
      }
    }
    return -1;
  },
  getPageIndex: (webviewId?: number) => {
    let index: number;
    if (webviewId) {
      index = AppPages.findIndex((item) => item.__webviewId__ === webviewId);
    } else {
      index = AppPages.length - 2; // 获取当前 Page 的 index
    }
    // AppPages 的长度需要移除最后一个预加载的页面
    return { index, length: AppPages.length - 1 };
  },
};

export const renderPage = (args: { options: WrapperPage; route: string }, webviewId: number) => {
  const { options, route } = args;
  const page = PageFactory.getPage(webviewId);
  if (!page) {
    throw Error(`Page not register for webviewId: ${webviewId}`);
  }

  if (!page.__DOMTree__) {
    page.__route__ = route;
    page.pageConfig = Object.assign({}, window.__wxConfig.global.window, window.__wxConfig.page[route]);
    __AppCssCode__[route] && __AppCssCode__[route](page.pageContainer);
    window.scrollTo(0, 0);

    // 如果事首页，那么需要移除返回按钮 || 页面是 tab 的时候，也需要移除返回按钮
    const tabList = window.__wxConfig.tabBar?.list.map((item) => item.pagePath) || [];
    if (route === window.__wxConfig.entryPagePath || tabList.includes(route)) {
      page.navigationBar.showBackButton = false;
    }

    if (tabList.includes(route)) {
      page.__isTabBar__ = true;
    }

    page.render(options);
  } else {
    page.reRender(options);
  }
};

/**
 * 专用于创建空白 page
 */
export const createPage = (webviewId: number) => {
  PageFactory.createPage(webviewId);
};
