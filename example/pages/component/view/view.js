Page({
  data: { a: 22 },
  test() {
    this.setData({ a: this.data.a+1 });
  },
});
