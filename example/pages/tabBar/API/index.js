Page({
  data: {
    list: [
      {
        id: 'page',
        name: '界面',
        open: false,
        pages: [
          {
            name: '设置导航条',
            url: 'set-navigation-bar',
          },
          {
            name: '页面跳转',
            url: 'navigator',
          },
          {
            name: '设置TabBar',
            url: 'set-tabbar',
          },
          {
            name: '下拉刷新',
            url: 'pull-down-refresh',
          },
          {
            name: '创建动画',
            url: 'animation',
          },
          {
            name: '创建绘画',
            url: 'canvas',
          },
          {
            name: '节点信息',
            url: 'get-node-info',
          },
          {
            name: '节点布局交互状态',
            url: 'intersection-observer',
          },
          {
            name: '显示操作菜单',
            url: 'action-sheet',
          },
          {
            name: '显示模态弹窗',
            url: 'modal',
          },
          {
            name: '显示加载提示框',
            url: 'show-loading',
          },
          {
            name: '显示消息提示框',
            url: 'toast',
          },
        ],
      },
      {
        id: 'device',
        name: '设备',
        open: false,
        pages: [
          {
            name: '获取手机网络状态',
            url: 'get-network-type',
          },
          {
            name: '获取手机系统信息',
            url: 'get-system-info',
          },
          {
            name: '打电话',
            url: 'make-phone-call',
          },
        ],
      },
      {
        id: 'network',
        name: '网络',
        open: false,
        pages: [
          {
            name: '发起一个请求',
            url: 'request',
          },
          {
            name: '上传文件',
            url: 'upload-file',
          },
          {
            name: '下载文件',
            url: 'download-file',
          },
        ],
      },
      {
        id: 'websocket',
        name: 'websocket',
        open: false,
        pages: [
          {
            name: 'socketTask',
            url: 'websocket-socketTask',
          },
          {
            name: '全局websocket',
            url: 'websocket-global',
          },
        ],
      },
      {
        id: 'media',
        name: '媒体',
        open: false,
        pages: [
          {
            name: '图片',
            url: 'image',
          },
          {
            name: '音频',
            url: 'audio',
          },
          {
            name: '视频',
            url: 'video',
          },
        ],
      },
      {
        id: 'location',
        name: '位置',
        open: false,
        pages: [
          {
            name: '获取当前位置',
            url: 'get-location',
          },
          {
            name: '使用地图查看位置',
            url: 'open-location',
          },
          {
            name: '使用地图选择位置',
            url: 'choose-location',
          },
          {
            name: '地图控制',
            url: 'map',
          },
        ],
      },
      {
        id: 'storage',
        name: '数据',
        open: false,
        pages: [
          {
            name: '数据存储（key-value）',
            url: 'storage',
          },
        ],
      },
    ],
  },
  goDetailPage(e) {
    const url = e.target.dataset.url;
    console.log(url);
    kiple.navigateTo({
      url: 'pages/api/' + url + '/' + url,
    });
  },
  triggerCollapse(e) {
    const index = Number(e.target.dataset.index);
    this.setData({
      list: this.data.list.map((item, idx) => {
        item.open = idx === index ? !item.open : false;
        return item;
      }),
    });
  },
});
