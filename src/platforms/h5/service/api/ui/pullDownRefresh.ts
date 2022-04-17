const onPullDownRefreshChange = (type: string, status: 'start' | 'stop') => {
  const pages = getCurrentPages();
  const __webviewId__ = pages[pages.length - 1].__webviewId__;

  // 通知 View 层修改 header
  KipleServiceJSBridge.publishHandler('onPullDownRefreshChange', { status }, __webviewId__);

  return { errMsg: type + ':ok' };
};

export const startPullDownRefresh = () => {
  return onPullDownRefreshChange('startPullDownRefresh', 'start');
};

export const stopPullDownRefresh = () => {
  return onPullDownRefreshChange('stopPullDownRefresh', 'stop');
};
