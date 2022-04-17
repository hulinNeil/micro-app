Page({
  data: {
    hasSetText: false,
    hasSetBg: false,
  },
  setText() {
    this.data.hasSetText = !this.data.hasSetText;
    kiple.setNavigationBarTitle({
      title: this.data.hasSetText ? '自定义文字' : '默认导航栏',
    });
  },
  setBg() {
    this.data.hasSetBg = !this.data.hasSetBg;
    kiple.setNavigationBarColor({
      frontColor: this.data.hasSetBg ? '#ffffff' : '#000000',
      backgroundColor: this.data.hasSetBg ? '#007AFF' : '#F8F8F8',
    });
  },
});
