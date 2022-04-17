Page({
  data: {
    count: 0,
  },
  onPullDownRefresh() {
    setTimeout(() => {
      kiple.stopPullDownRefresh();
      this.setData({ count: this.data.count + 1 });
    }, 1000);
  },
  startRefresh() {
    kiple.startPullDownRefresh();
  },
});
