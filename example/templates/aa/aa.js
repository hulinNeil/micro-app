// pages/template/aa.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    a: {
      type: String,
      value: '22',
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    mm: 20,
  },

  lifetimes: {
    created() {
      console.log('组件初始化-created', this.data.mm, this.properties.a);
    },
    attached() {
      console.log('组件挂载-attached', this.data.mm, this.properties.a);
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    hh() {
      this.setData({
        mm: Number(this.data.mm) + 1,
      });
    },
  },
});
