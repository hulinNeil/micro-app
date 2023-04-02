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
    bb:{a:!2,b:2},
    cc:[1,2,['new data']]
  },

  observers: {
    'mm,a,bb.a,cc[2]': (e, a,c,d) => {
      console.log('====e', e, a,c,d);
    },
  },

  lifetimes: {
    created() {
      this.observers = null;
      console.log('组件初始化-created', this.data.mm, this.properties.a, this.data.a);
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
