Page({
  onLoad(e) {
    console.log('获取传递的数据', e);
    // TODO: 当setNavigationBarTitle完成后，修改 page title = e
    if (e && e.title) {
      wx.setNavigationBarTitle({
        title: `navigator-${e.title}`,
      });
    }
  },
});
