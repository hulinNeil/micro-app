const storage = [
  'setStorage',
  'setStorageSync',
  'getStorage',
  'getStorageSync',
  'getStorageInfo',
  'getStorageInfoSync',
  'removeStorage',
  'removeStorageSync',
  'clearStorage',
  'clearStorageSync',
];

const device = ['getSystemInfo', 'getSystemInfoSync', 'canIUse'];

const route = ['navigateTo', 'redirectTo', 'reLaunch', 'switchTab', 'navigateBack'];

const navigationBar = ['setNavigationBarTitle', 'setNavigationBarColor', 'showNavigationBarLoading', 'hideNavigationBarLoading'];
const refresh = ['startPullDownRefresh', 'stopPullDownRefresh'];

const ui = [...navigationBar, ...refresh];

const apis = [...storage, ...device, ...route, ...ui];

export default apis;
