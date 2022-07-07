const data = require('./data');
var app = getApp();

const sum = (a, b) => a + b;

console.log(sum(1, 2));

Page({
  data: {
    motto: 'Hello World',
    user: { name: 'Neil' },
    count: 10,
    length: 3,
    name: 'Neil',
  },
  onLoad() {
    console.log('===============', app, data);
  },
  bindViewTap() {
    wx.navigateTo({
      url: 'pages/logs/logs',
    });
  },
  onHide: function onShow() {
    console.log('Page onHide');
  },
  onPageScroll(e) {
    console.log('========监听到页面的滚动事件', e);
  },
  onPullDownRefresh() {
    console.log('触发下拉刷新');
    setTimeout(function () {
      wx.stopPullDownRefresh();
    }, 2000);
  },
  onReachBottom(e) {
    console.log('触发加载更多....', e);
  },
  addFunc() {
    this.setData({ count: ++this.data.count });
  },
  subFunc() {
    this.setData({ count: --this.data.count });
  },
  bindViewTap1() {
    wx.navigateTo({
      url: 'pages/transparent/index',
    });
  },
});
