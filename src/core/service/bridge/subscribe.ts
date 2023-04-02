import { getCurrentPages } from '@/core/service/page/page';
import { onAppRoute } from 'kiple-platform/service/api/route';
import { getComponentById, onComponentPropsChange, registerComponent } from '@/core/service/page/component';

interface PageEvent {
  eventName: string;
  data: Object;
  componentId?: number;
}

const onWebviewEvent = ({ eventName, data, componentId }: PageEvent, pageId: number) => {
  console.log(`Invoke event \`${eventName}\` in page: ${pageId}${componentId ? ', component: ' + componentId : ''}`);
  const pages = getCurrentPages();
  const curPage = pages.find((item) => item.__webviewId__ === pageId);
  if (curPage && !componentId) {
    curPage[eventName] && curPage[eventName].call(curPage, data);
  } else if (componentId) {
    const component = getComponentById(componentId);
    component && component.page.__triggerElementEvent__(eventName, data);
  }
};

export default function initSubscribe(subscribe: ServiceJSBridge['subscribe']) {
  // 监听到页面触发事件
  subscribe('PAGE_EVENT', onWebviewEvent);

  // 监听到注册组件
  subscribe('registerComponent', registerComponent);
  // 监听到组件 props 变化
  subscribe('onComponentPropsChange', onComponentPropsChange);

  // 监听 view 层触发的路由跳转事件,一般由tab切换，或者 navigate 组件触发
  subscribe('onRouteChange', (args: { type: string; options: any }) => {
    onAppRoute(args.type, args.options);
  });

  // app 进入后台
  subscribe('onAppEnterBackground', () => {
    KipleServiceJSBridge.emit('onAppEnterBackground');
  });

  // app 进入前台
  subscribe('onAppEnterForeground', () => {
    KipleServiceJSBridge.emit('onAppEnterForeground');
  });
}
