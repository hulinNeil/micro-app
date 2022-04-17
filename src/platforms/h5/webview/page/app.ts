/**
 * 初始化 App，使用 wx-app 替换 div#app 元素，在 wx-app 中处理 app.css, tabBar
 */
export const initApp = () => {
  const rootEl: any = document.getElementById('app');
  if (!rootEl) {
    throw Error('No Root Element');
  }
  rootEl.parentNode.replaceChild(document.createElement('wx-app'), rootEl);
};
