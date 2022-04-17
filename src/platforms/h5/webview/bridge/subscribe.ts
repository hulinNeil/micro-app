import { createPage, renderPage } from '../page/page';
import { initApp } from '../page/app';
import onNavigationBarChange from '../page/navigationBar';
import onRouteChange from '../page/route';
import { renderComponent } from '../page/component';

export default function initSubscribe(subscribe: ViewJSBridge['subscribe']) {
  subscribe('pageScrollTo', (e: any) => {
    console.log('通过api触发页面返回顶部', e);
  });

  console.log('--这里的引入模式有问题，循环引用，导致这里的renderPage为undefined，而函数里面的renderPage却又存在--', renderPage);
  subscribe('CREATE_APP', initApp);
  subscribe('CREATE_PAGE', (args: any, webviewId: number) => {
    createPage(webviewId);
  });
  subscribe('RENDER_PAGE', (args: any, webviewId: number) => {
    renderPage(args, webviewId);
  });
  subscribe('RE_RENDER_PAGE', (args: any, webviewId: number) => {
    renderPage(args, webviewId);
  });
  subscribe('RENDER_COMPONENT', (options: any, webviewId: number) => {
    renderComponent(options, webviewId);
  });
  subscribe('RE_RENDER_COMPONENT', (options: any, webviewId: number) => {
    renderComponent(options, webviewId);
  });

  subscribe('onRouteChange', onRouteChange);
  subscribe('onNavigationBarChange', onNavigationBarChange);
  subscribe('onPullDownRefreshChange', (data: { status: 'start' | 'stop' }, webviewId: number) => {
    KipleViewJSBridge.emit(`onPullDownRefreshChange.${webviewId}`, data.status);
  });
}
