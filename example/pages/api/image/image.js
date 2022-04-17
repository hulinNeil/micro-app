Page({
  data: {
    imageList: [],
  },
  chooseImage() {
    this.data.imageList.push('https://res.wx.qq.com/wxdoc/dist/assets/img/0.4cb08bb4.jpg');
    this.setData({
      imageList: this.data.imageList,
    });
    console.log(app);
  },
  removeImage() {
    this.setData({
      imageList: [],
    });
  },
});
