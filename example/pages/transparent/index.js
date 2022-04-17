Page({
  back() {
    kiple.navigateBack();
  },
  onPullDownRefresh() {
    setTimeout(() => {
      kiple.stopPullDownRefresh();
    }, 1000);
  },
});
