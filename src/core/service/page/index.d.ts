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
