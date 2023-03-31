import { WrapperPage } from './index';
import { WrapperComponent } from './component';

export interface IPageOptions {
  data?: { [key: string]: any };
  onLoad?: (query: Object) => void; // 页面加载时触发,可以传入初始化的数据
  onShow?: Function; // 页面显示时触发
  onReady?: Function; // 页面初次渲染完成时触发
  onHide?: Function; // 页面隐藏时触发
  onUnload?: Function; // 页面卸载时触发
  onShareAppMessage?: Function; // 点击右上角分享时触发
  onTitleClick?: Function; // 点击页面标题触发
  onPullDownRefresh?: Function; // 下来刷新完成时触发事件
  onPullIntercept?: Function; // 下拉中断时触发
  onTabItemTap?: Function; //点击 tabItem 时触发
  onPageScroll?: (object: { scrollHeight: number; scrollTop: number }) => void; // 页面滚动时触发
  onReachBottom?: Function; //上拉触底时触发。
  [key: string]: any;
}

export interface IAppOptions {
  onLaunch?: Function; // 小程序初始化时触发
  onShow?: Function; // 小程序启动或者切换到前台时触发
  onHide?: Function; // 小程序切换到后台时触发
  onError?: Function; // 错误监听函数
  globalData?: any; // 小程序的全局data
}

export interface IAppPage {
  page: WrapperPage; // 页面逻辑
  route: string; // 页面路径
  webviewId: number;
}

export interface IAppComponent {
  page: WrapperComponent; // 页面逻辑
  route: string; // 页面路径
  webviewId: number;
}

export interface IRegisterComponent {
  route: string;
  componentId: number;
  props: object;
}

export interface IComponentOptions {
  properties?: { [key: string]: any }; // 组件的对外属性，是属性名到属性设置的映射表 - Done
  data?: { [key: string]: any }; // 组件的内部数据，和 properties 一同用于组件的模板渲染, 微信小程序中 props如果和data有相同字段，以props为准 - Done
  observers?: { [key: string]: Function }; // 组件数据字段监听器，用于监听 properties 和 data 的变化
  methods?: { [key: string]: Function }; // 组件的方法，包括事件响应函数和任意的自定义方法
  behaviors?: Array; // 类似于mixins和traits的组件间代码复用机制
  relations?: { [key: string]: any }; // 组件间关系定义
  lifetimes?: {
    created?: Function; //	在组件实例刚刚被创建时执行 - Done
    attached?: Function; //	在组件实例进入页面节点树时执行
    ready?: Function; //	在组件在视图层布局完成后执行
    moved?: Function; //	在组件实例被移动到节点树另一个位置时执行
    detached?: Function; //	在组件实例被从页面节点树移除时执行
    error?: (e: Error) => void; //	每当组件方法抛出错误时执行
  };
  pageLifetimes?: {
    show?: Function; //	组件所在的页面被展示时执行
    hide?: Function; //	组件所在的页面被隐藏时执行
    resize?: (e: { [key: string]: number }) => void; //	组件所在的页面尺寸变化时执行
    routeDone?: Function; //	在组件实例被从页面节点树移除时执行
  };
}
