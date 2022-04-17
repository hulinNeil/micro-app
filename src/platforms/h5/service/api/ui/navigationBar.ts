export interface INavigationBarParams {
  backgroundColor?: string;
  color?: 'black' | 'white';
  titleText?: string;
  loading?: boolean;
}

interface INavigationBar {
  frontColor: string; // 仅支持 #ffffff 和 #000000
  backgroundColor: string;
  title: string;
}

const setNavigationBar = (type: string, args?: INavigationBar) => {
  const navigationBar: INavigationBarParams = {};
  const { frontColor, backgroundColor, title } = args || {};
  const pages = getCurrentPages();
  const __webviewId__ = pages[pages.length - 1].__webviewId__;

  switch (type) {
    case 'setNavigationBarColor':
      if (frontColor) {
        navigationBar.color = frontColor === '#000000' ? 'black' : 'white';
      }
      if (backgroundColor) {
        navigationBar.backgroundColor = backgroundColor;
      }
      break;
    case 'showNavigationBarLoading':
      navigationBar.loading = true;
      break;
    case 'hideNavigationBarLoading':
      navigationBar.loading = false;
      break;
    case 'setNavigationBarTitle':
      navigationBar.titleText = title;
      break;
  }

  if (Object.keys(navigationBar).length) {
    // 通知 View 层修改 header
    KipleServiceJSBridge.publishHandler('onNavigationBarChange', navigationBar, __webviewId__);
  }
  return { errMsg: type + ':ok' };
};

export const setNavigationBarColor = (args: INavigationBar) => {
  return setNavigationBar('setNavigationBarColor', args);
};

export const showNavigationBarLoading = () => {
  return setNavigationBar('showNavigationBarLoading');
};

export const hideNavigationBarLoading = () => {
  return setNavigationBar('hideNavigationBarLoading');
};

export const setNavigationBarTitle = (args: INavigationBar) => {
  return setNavigationBar('setNavigationBarTitle', args);
};
