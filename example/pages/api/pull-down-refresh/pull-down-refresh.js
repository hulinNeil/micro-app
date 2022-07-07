Page({
  data: {
    count: 0,
  },
  onPullDownRefresh() {
    setTimeout(() => {
      wx.stopPullDownRefresh();
      this.setData({ count: this.data.count + 1 });
    }, 1000);
  },
  startRefresh() {
    wx.startPullDownRefresh();
  },
});
