import { parserUrl } from '@/util';
import { createBrowserHistory } from 'history';
import { PageFactory } from './page';

export const history = createBrowserHistory();

export const location = history.location;

let navigateBackByAPI = false;

// 当执行back操作时，上一个页面又不存在，认为初次进入的二级页面，back到首页
const createEntryPage = () => {
  history.replace('/');
  // 通知service层创建页面
  const route = window.__wxConfig.entryPagePath;
  const navigateType = window.__wxConfig.tabBar && window.__wxConfig.tabBar.list.length > 0 ? 'switchTab' : 'redirectTo';
  KipleViewJSBridge.publishHandler('onRouteChange', { type: navigateType, options: { url: route } }, 0);
};

// 监听路由变化，init 页面内容
history.listen(({ location, action }) => {
  // 如果是通过api的方式进行路由返回的，那么不需要重新 init 页面
  if (navigateBackByAPI) {
    navigateBackByAPI = false;
    return;
  }
  const pagePath = location.pathname.replace(/^\//, '');
  // 如果是浏览器的返回按钮返回，那么需要判断返回的页面是否已经存在于内存中，存在的话，调用内存的page进行显示
  if (action === 'POP') {
    const lastPage = PageFactory.getLastPage(1);
    if (lastPage && lastPage.__route__ === pagePath) {
      PageFactory.replacePage(1);
      return;
    } else if (!lastPage) {
      createEntryPage();
    }
  }
});

interface IRouteChange {
  type: 'navigateTo' | 'redirectTo' | 'reLaunch' | 'switchTab' | 'navigateBack';
  options: {
    url: string;
    delta: number;
  };
}

// 需要校验当前页面返回时，页面集合中时候还有其他页面，如果没有，说明当前页面时第一个页面，点击back时需要进入首页
const navigateBack = (delta: number = 1) => {
  const lastPage = PageFactory.getLastPage(1);
  if (!lastPage) {
    createEntryPage();
    return;
  }

  navigateBackByAPI = true;
  history.go(0 - delta);
  PageFactory.replacePage(delta);
};

// 处理 url 变化，删除多余的页面
const onRouteChange = (data: IRouteChange) => {
  let url = data.options.url;
  url = url && url[0] !== '/' ? '/' + url : url;
  const { route } = parserUrl(url || '');

  switch (data.type) {
    case 'navigateBack':
      navigateBack(data.options.delta);
      break;
    case 'navigateTo':
      history.push(url);
      break;
    case 'redirectTo':
      const curPageIndexInfo = PageFactory.getPageIndex();
      history.replace(url);
      PageFactory.removePage(curPageIndexInfo.index - 1);
      break;
    case 'reLaunch':
      history.replace(url);
      PageFactory.deleteLastPage(PageFactory.getPageIndex().length, 1, false);
      break;
    case 'switchTab':
      // 移除内存中所有非 tabBar 页面
      // 判断之前的 page 中，是否含有 tab 页面，含有的话，直接 back 到那个页面；
      // 判断当前页面是否是 tab 页面，是的话，使用 push 跳转，否则使用 replace 进行跳转
      const nextPage = PageFactory.getPageByRoute(route.replace(/^\//, ''));
      const curPage = PageFactory.getCurrentPage();
      const tabList = window.__wxConfig.tabBar.list.map((item) => item.pagePath);
      const isTabPage = tabList.includes(curPage.__route__);
      if (nextPage) {
        navigateBackByAPI = true;
        const { index, length } = PageFactory.getPageIndex(nextPage.__webviewId__);
        PageFactory.replacePage(length - index - 1, curPage.__webviewId__);
        // 切换内存中Page的顺序, 获取最后一个tab，如果和next page的id不一样，那么需要和最后面的那么tab进行地址交换
        const lastIndex = PageFactory.getPageIndex(nextPage.__webviewId__).index;
        const firstIndex = PageFactory.getLastTabPageIndex();
        if (lastIndex !== firstIndex && firstIndex !== -1 && lastIndex !== -1) {
          PageFactory.replacePageIndex(lastIndex, firstIndex);
        }
      }
      location.search = '';
      if (isTabPage) {
        history.push(route);
      } else {
        history.replace(route);
      }
      // 移除非 tab page
      const length = PageFactory.getPageIndex(curPage.__webviewId__).length;
      PageFactory.deleteLastPage(length, 0);
      break;
    default:
      break;
  }
};

export default onRouteChange;
