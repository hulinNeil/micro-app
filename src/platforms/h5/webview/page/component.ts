import { WrapperComponent } from '@/core/service/page/component';
import { IRegisterComponent } from '@/core/service/page/index.d';
import { diff } from '@/core/webview/parser/diff/diff';
import { patch } from '@/core/webview/parser/diff/patch';
import { createDomTree } from '@/core/webview/parser/render';
import { PageFactory } from './page';

let __componentId__ = 0;
// TODO: 在 h5 中可以直接保存在这里数组中，但是在app中，组件实例是保存在对应的 webview 中的，查找也是应该先查找到对应的webview，然后在找到对应的component
const AppComponents: Component[] = [];

export class Component {
  __componentId__: number;
  __webviewId__: number;
  __route__: string = ''; // eg: 'components/test/test'
  __DOMTree__: HTMLElement | Text | Comment | null = null;
  __VirtualDom__: IVirtualDom | null = null;
  parentNode: HTMLElement; // 一般为自定义组件的根节点，如：<my-component></my-component>
  constructor(parentNode: HTMLElement, webviewId: number, componentId: number) {
    this.__componentId__ = componentId;
    this.__webviewId__ = webviewId;
    (parentNode as any).__componentId__ = componentId;
    this.parentNode = parentNode;
  }
  render = (options: { [key: string]: any }) => {
    // 合并 props 和 data
    this.__VirtualDom__ = window.app[this.__route__].render(options.data);
    // 生成页面 Dom 树
    this.__DOMTree__ = createDomTree(this.__VirtualDom__, window.app[this.__route__].hash);
    if (this.__DOMTree__) {
      this.parentNode.appendChild(this.__DOMTree__);
      // TODO: 触发生命周期函数 attached，ready
    }
  };
  // 组件内部出发更新事件
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
 * 管理 View 层的 Component Stack.
 */
export const ComponentFactory = {
  createCom: (parentNode: HTMLElement, webviewId: number, componentId: number) => {
    var page = new Component(parentNode, webviewId, componentId);
    AppComponents.push(page);
    return page;
  },
  removeCom: (pageIndex: number) => {
    if (pageIndex > -1) {
      AppComponents.splice(pageIndex, 1);
    }
  },
  getComById: (comId: number) => {
    const page = AppComponents.find((page) => page.__componentId__ === comId);
    return page || null;
  },
};

/**
 * 初始化 Component
 */
export const initComponent = (virtualDom: IVirtualDom, parentNode: HTMLElement) => {
  __componentId__++;

  const parentWebview = PageFactory.getPendingPage();
  const __webviewId__ = parentWebview?.__webviewId__ || 1;
  const component = ComponentFactory.createCom(parentNode, __webviewId__, __componentId__);
  const __route__ = virtualDom.props.__route__ || '';
  const props = { ...virtualDom.props };
  delete props.__route__;
  delete props.__isComponent__;

  component.__route__ = __route__;

  const args: IRegisterComponent = { componentId: __componentId__, route: __route__, props };

  // 通知 service 层，执行 Component 的初始化
  KipleViewJSBridge.publishHandler('registerComponent', args, __webviewId__);
};

export const renderComponent = (args: { options: WrapperComponent; route: string }, webviewId: number) => {
  const { options, route } = args;
  const component = ComponentFactory.getComById(options.__componentId__);
  if (!component) {
    throw Error(`Component not register for componentId:${options.__componentId__}`);
  }

  if (!component.__DOMTree__) {
    __AppCssCode__[route] && __AppCssCode__[route](component.parentNode);
    component.render(options);
  } else {
    component.reRender(options);
  }
};
