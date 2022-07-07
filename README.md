## 项目基础 & 结构
### 运行命令
```bash
# 编译器，运行脚本 -- 开发时
$ npm run compiler:v2:watch
# 编译器，运行脚本 -- 打包
$ npm run compiler:v2

# 编译框架中 .tpl 模板的解析函数
$ npm run build:template-parser

# 运行时框架，运行命令
$ npm run dev:h5
$ npm run dev:app
$ npm run build:h5
$ npm run build:app
```

### 项目目录
```
├── src                       # 运行时框架源码
│   ├── core                  # 框架核心代码，H5 和 App 都能使用
│   │   ├── service           # 逻辑层源码文件
│   │   └── webview           # 视图层源码文件
│   ├── platforms             
│   │   ├── h5                # H5 独有的 api/view 实现
│   │   └── app               # App 独有的 api/view 实现
│   ├── utils                 # 一些工具库
│   ├── service.ts            # 打包 service.js 库的入口文件 <逻辑层>
│   ├── webview.ts            # 打包 webview.js 库的入口文件 <视图层>
│   └── webview.css           # 公共的 css 文件 <视图层>
├── build             # 打包运行时框架的 webpack 脚本
├── compiler          # 编译器源码，用于编译小程序工程
├── example           # 示例代码
├── lib               # 允许编译的api的集合
└── ...                 
```

### 打包后的业务代码目录
```
├── static                  # 业务中使用的静态资源，主要是图片
│   ├── a.png          
│   └── b.png      
├── app.config.js           # 业务代码中, app.json 和 page.json 的配置项集合
├── app.service.js          # 业务代码中, page.js 的打包集合, 业务逻辑代码
├── app.service.js.map      # source-map 文件, dev 时只打包业务逻辑代码的 source-map, 方便调试, UI 代码暂时不需要 source-map
├── app.view.js             # 业务代码中, page.wxml 的打包集合, 描述页面样式, 包含 dom 和 css
├── index.html              # 页面的初始入口文件
├── service.js              # 运行时, 基础 api 代码文件
├── webview.css             # 运行时, 全局样式文件
└── webview.js              # 运行时, UI 组件文件
```

### 基础部分
1. 基础 API：需要提供 kiple.xxx() 供 web 调用 native 的能力
2. 基础组件：框架仅允许内置的组件，div等组件不允许使用
3. 框架: 整合基础组件+API,并提供整体的一些调用方式，依次进行页面的渲染
4. 编译器：将页面编译为一个js文件
5. 运行时：先加载框架，然后加载编译后的业务文件

### 运行时的框架
1. 编译基础API，保存为文件 service.js
    - 基础API
    - 生命周期
    - 和 webview.js 进行通讯
    - 需要创建一个全局状态，保存Page.options,通过这个可以知道内存中含有多少个webview
2. 编译基础组件，保存为文件 webview.js
    - 需要将组件编译为 AST, 进行保存
    - 需要一个解析 AST 并进行渲染的函数
    - 和 service.js 进行通讯
3. 创建一个组件管理的框架
    - 注册组件，创建组件，组件的diff
4. 运行时的html执行顺序
    - 加载空的page.html
    - 加载框架
      - 加载组件样式 webview.css(全局样式)
      - 加载组件库 webview.js(组件及组件样式，进行page.html的初始化)
      - 加载能力库 service.js(api)
    - 加载 app-config.js(项目配置等信息)
    - 加载 app-view.js(项目的视图层代码)，这个文件中初始化页面
    - 加载 app-server.js(项目的业务逻辑)
    ```js
    setTimeout(function () {
      if (typeof jSCore === 'object' && typeof jSCore.onDocumentReady === 'function') {
        jSCore.onDocumentReady();
      } else {
        console.log('初始化失败');
      }
    }, 0);
    ```
5. 运行js的顺序
    - 加载完 app-server.js 后, 开始执行App(options)，执行 onDocumentReady，
    - 先执行全局的函数
    - 在执行页面函数，执行onLoad后，确定当前页面的data
    - 获取当前页面的渲染函数，加上初始化的data
    - 执行renderPage函数，传入render和data，父节点，渲染页面
    - 当data发生改变，再次执行renderPage

## 头脑风暴 & 任务
### Other
1. 在H5端，是否应该在worker中运行js，这样的话，就可以和webview中一样，视图层和逻辑层分离
2. 在编译后的UI中，如何绑定状态？
  ```js
    const test = (pageData) => {
      const count = getData('count', pageData); // pageData('count') => 通过一个getData的函数获取，getData 应该是从 Page(options) 中暴露出来的
      return createElement('wx-button', null, count);
    }
  ```


### 这个阶段的任务时处理事件(10.29)
1. 如何处理tap事件和longtap事件? 触发longtap后不能触发tap
2. 如何将tap事件绑定到元素上? 
3. 视图层触发事件后，如何将事件的结果返回到逻辑层? (暂时pending，先处理App的启动，然后开发bridge功能)

### 这个阶段需要处理下jsBridge
1. view和service进行交互
2. 需要初始化bridge的时候，初始化一些需要监听的事件，当监听到view层发送的事件，那么需要触发对应的回调函数
3. setData 修改后，重新渲染页面

### 这个阶段开始重新处理组件的状态
1. Button 组件的disabled属性，在loading和tap的时候
2. 组件的属性绑定，属性变化时的监听
3. 处理 View 组件

### 这个阶段处理App启动
1. 需要将各页面导出方法。绑定到全局对象中
2. 需要有一个全局的变量,保存所有已经开启了的webview
3. app.js 的生命周期
4. page的部分生命周期(onShow,onLoad,onHide,onUnload,没有实现完全，后面统一封装生命周期的方法吧)
5. 路由跳转(先使用html节点全部替换)
6. 系统log使用统一格式
7. 处理用用启动
  ```js
  /**
   * init 的逻辑
   * 1. 通知 view 层执行初始化逻辑：获取入口的path
   * 2. 生成 webviewId,初始值为0，现在变为1（+1），webviewId 是 view 层控制的
   * 3. 根据 path 创建 Page, 将 Page 添加到 webview 的 AppPages 里面
   * 5. 通知 service 层，注册 page，这个时候，如果 AppPages 有page直接使用，没有的话需要引入对应路由的逻辑代码，将将逻辑代码添加到 service 层里面的 AppPages 中
   * 6. 执行 onload 生命周期
   * 7. 通知 view 层渲染页面[RENDER_PAGE]，传递 {data,path},webviewId, view层可以根据data,webviewId,path，获得渲染函数，然后就可以结合data进行渲染了
   * 8. 执行 onShow 生命周期
   * 9. 思考： 创建预加载的 page（webview）应该是谁创建的，这个谁就是维护 webviewId 的那一方
   */
  ```
### 处理页面样式
1. 处理 page 组件，需要有 title,
2. 下拉刷新
3. 渐变的 title
5. body 的高度控制，背景颜色控制
6. 加载页面 css，计算 rpx.
7. title 相关的 api

### 编译器（11.13）
1. 项目结构
    ```
    ├── page                      # 页面的目录，包含所有的页面
    │   ├── page1                 # 页面1,又4个部分组成
    │   │   ├── index.js          # 当前页面逻辑（所有js都编译成 define 模式，路径是相根目录的路径）
    │   │   ├── index.wxss        # 当前页面的样式(解析所有的css，含有rpx的单独拎出来，成为数组的一项)
    │   │   ├── index.wxml        # 当前页面的UI结构(直接生成节点树)
    │   │   └── index.json        # 当前页面的自定义配置
    │   ├── page2        
    │   │   ├── test.js           # 当前页面逻辑（所有js都编译成define模式，路径是相根目录的路径）
    │   │   ├── test.wxss         # 当前页面的样式(解析所有的css，含有rpx的单独拎出来，成为数组的一项)
    │   │   ├── test.wxml         # 当前页面的UI结构(直接生成节点树)
    │   │   └── test.json         # 当前页面的自定义配置    
    │   └── page ...              
    ├── app.wxss                  # 全局样式
    ├── app.js                    # 小程序逻辑
    └── app.json                  # 小程序公共配置
    ```
2. 编译后生成的目录
      ```
      ├── app-frames.js           # 编译后的小程序渲染层
      ├── app-service.js          # 编译后的小程序逻辑层
      └── app-config.js           # 小程序的所有配置
      ```
3.  实现步骤
    - 循环遍历 app.json, 知道整个项目有哪些页面
    - 遍历每个page，需要编译同名称的.js,.css,.wxml,.json文件
    - 编译 .js 文件: 1. 将 es6 编译为es5; 2. 分析文件依赖，先将依赖的 .js 文件进行 define 包裹; 3. 将此.js 进行 define 包裹.
    - 编译 .css 文件: 1. 分析文件依赖2. 通过正则将 rpx 抽出来，然后生成 `setCssToHead([],currentPath,...importPath)`;
    - 编译 .wxml 文件: 1. 直接生成 ast 树，然后踢出div等标签; 2. 根据 ast 树生成 createElement(xxx) 的树结构
    - 编译 .json 文件: 合并到 config.js 中
    - 如何实现source map?
4. 使用 webpack 进行打包
    - webpack 有两个配置，一个是 view 的，一个 service 的
    - 两个配置的入口文件都是 app.json，自定义一个 loader 处理这个文件
    - webpack 的配置应该是代码中生成的，不应该是自己写的静态配置
    - 使用 webpack 是可以，但是感觉并不会减少开发量，每个文件人需要自己处理，但是自带 source map 和dev-server 比较方便
5. 使用 rollup 进行打包（最终方案）
    - 入口就是 app.json, 自定义一个插件处理 app.json，在插件中便利pages，然后批量导入 page.js
    - 每个 page.js 使用 babel 进行编译，生成 code 和 source map（完美解决手动编译 source map 不好插入的问题，也解决了 webpack 方案模块化被重写的问题，性能也比较好）

### tabBar和css模块化
1. css模块化（1.5 end）
    - 获取 css 的 ast，获取到里面的 import 语法
    - 编译 css 的时候，将当前 css 模块依赖的 css 路径添加到单数末尾: ===> 还是使用postcss，直接将 import 的 css 插入到当前代码里面
      ```js
      setCssToHead(currentCssText,currentCssPath,[moduleCss1,...moduleCssN]);
      ```
    - 执行 setCssToHead 时，需要 import 所有的依赖
    - css 中添加 hash
    - 支持字体文件(不用额外处理，暂时只支持 base64或者网络路径)
2. Image 组件
  - 支持网络图片
  - 本地图片处理：相对路径 & 绝对路径(不在rollup里面进行静态资源的编译，直接将静态资源拷贝到编译后的文件夹)
    - 需要将静态资源复制到编译后的目录，根路径位app.json的路径
    - 编译 html 的时候，遇到了 image 标签，需要判断他的 src, 如果是静态字符串，且为本地路径，需要判断路径资源是否存在，存在的话，将其复制到编译后的目录
    - 如果 src 是变量，那么需要将结果收集起来，传递给 js 的编译器， js编译在所有的 js 时，根据 html 返回的值，收集所有 html 中使用到的静态资源，然后编译其到目标目录
3. tabBar
    - 执行 initPage 的时候，需要判断当前 page 是否是 tab page
    - 是的话需要初始化 tabBar 的 UI
    - 当从 tab 页面离开时，需要隐藏 tab 组件，当再次显示 tab 页面的时候，需要显示 tab 组件
    - 目前使用的 hash 路由，组件中使用 window.onhashchange 监听路由发生变化，匹配到路由的使用显示，否则隐藏

### dev 模式的选择, 处理 img src 引发的思考
- 使用 rollup 的 watch 进行代码的编译
  - 优点：速度很快，初次编译只要 650ms, 再次 10ms
  - 缺点：编译 view 层时产生的数据，无法在编译service层时进行传递，view 进行修改后，无法通知编译器进行 service 层的编译
- 使用 rollup.rollup 分开编译
  - 缺点：速度稍慢，初次需要 650ms, 再次 150ms
  - 优点：由于 view 和 service 使用 api 进行分开编译，相当于每次编译都是第一次，所以在参数传递上很好解决
- 最终还是使用 rollup 的 watch 进行编译：
  - 很难做到极致的静态语法分析，即使将 wxml 中使用的变量传递到了 service 的编译器中，但是在 service 层，写法千奇百怪，`this.setData({src:'/static/test.png'})`, 这种可以分析出来，但是如果重写了 setData 就不易处理了，或者使用了js中的内变量对src进行赋值 `this.setData({src: this.path})`也不好处理
  - 再写一个监听器，监听目标目录的静态资源文件（如 .png,.mp4,.gif 等）的变化，然后直接将所有的文件复制到 dist 目录

### 添加示例代码
1. 支持 for 循环
2. 支持 hide 和 display: none

### 细节优化
- page 组件的高度
- 处理文件夹含有-导致编译失败
- 编译器不能监听 json 文件的的改变，从而触发重新编译
- 只有页面 js/wxml 有一个不存在时，需要提示错误，当 css 不存在时，不能出现报错，当添加 css 时，需要被编译器监听到
- css中, ::after, ::before不生效,原因：scope 添加到了伪类后面，`.uni-uploader__input-box::after[ba14242e]`
- button 的 disabled/loading 不能动态修改
- text 组件
  - \n 转义成 <br />
  - 处理字符串转义
  - 目前的 text 文字处理方式是将所有文字使用 span 标签包裹起来，文字 diff 的时候修改 span 的内容，然后在 text 组件中监听文字改变，进行字符串的拼接

### 框架 TODO List
- Build 时，将资源拷贝到编译目录 (completed)
- 处理tabbar的图片 (completed)
- 支持复杂的组件模板，比如video，swiper，需要将.html模板转换为jsx，然后绑定到自定义component中 (completed)
- 使用 key 进行同级的diff
- 事件绑定机制：将同一种类型的事件只绑定一个，像 react 一样进行事件合成和事件绑定，事件派发，冒泡捕获
- WXS 语法支持
- 数据双向绑定
- 丰富Page生命周期函数，事件处理函数

### 组件机制
- import template: 引入模板 -> 使用模板; is 使用变量进行组合；数据只能在data里面传递 - (completed)
- include template: 可以将目标文件除了 template/wxs 外的整个代码引入，相当于是拷贝到 include 位置,支持在里面写 page 的变量 - (completed)
- Component 组件: 含有生命周期的组件，支持组件diff，减少页面渲染次数; slot 语法;

### swiper 组件

### scroll-view 组件

### input 组件

### label 组件

### form 组件

### checkbox 组件

### 处理涉及到UI的API
1. 图片预览
2. showToast
3. showActionSheet

### api做参数检验

### 路由的优化
1. 路由返回的监听，能够返回到正确的页面
2. 各种路由API的实现
  - redirectTo
  - reLaunch
  - switchTab
3. 各种路由组件的实现
4. 路由跳转携带参数
5. 路由修改时，page title 跟着改变
6. 其他
  - 移除Page时，需要删除 style 节点《将page style保存在page实例中，每次page的添加/移除就不用特别处理style了》

### view 层和 service 层分离
使用 h5 的 web worker 进行分层，以达到和客户段相同的分层效果

### 优化 webpack 和 rollup 的逻辑

1. 添加环境变量
2. 根据环境变量进行不同的打包逻辑
3. rollup配置的优化

### 单元测试
