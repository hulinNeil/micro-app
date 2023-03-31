import { isPlainObject } from '@/util/util';
import { require as customRequire } from '../helpers/require';
import { checkPageInPagesJson, getGlobPageRegisterPath } from './app';
import { IAppComponent, IComponentOptions, IRegisterComponent } from './index.d';

const ComponentConfig = {};
const AppComponents: IAppComponent[] = [];

export class WrapperComponent {
  __webviewId__: number;
  __componentId__: number;
  __route__: string;
  data: any;
  properties: any = {};
  lifetimes: object = {};
  observers: object = {};
  methods: object = {};
  constructor(args: IRegisterComponent, webviewId: number) {
    this.__webviewId__ = webviewId;
    this.__componentId__ = args.componentId;
    this.__route__ = args.route;
    const options = ComponentConfig[this.__route__] as IComponentOptions;

    for (const key in options) {
      if (key === 'properties' && options.properties) {
        for (const name in options[key]) {
          this.properties[name] = options.properties[name].value || options.properties[name];
        }
        continue;
      }
      if (['lifetimes', 'methods', 'observers'].includes(key)) {
        for (const name in options[key]) {
          if (typeof options[key][name] === 'function') {
            this[key][name] = options[key][name];
          }
        }
        continue;
      }
      if (typeof options[key] === 'function') {
        this[key] = options[key];
      } else {
        this[key] = JSON.parse(JSON.stringify(options[key]));
      }
    }

    // 触发create生命周期
    this.__callPageLifeTime__('created');

    // 合并 props
    for (const prop in args.props) {
      if (this.properties[prop] !== undefined) {
        this.properties[prop] = args.props[prop];
      }
    }
  }

  __triggerObservers(changedData: Object) {
    const keys = Object.keys(this.observers);
    const _this = this; // 将 this 赋值，方便在 eval 中使用
    if (!keys.length || !changedData) {
      return;
    }
    keys.forEach((key) => {
      // key 可能的情况： ‘key’, 'name.name.name...', 'key1, key2, ...', 'key[1][2][n]','**'
      if (key === '**') {
        this.observers[key].apply(this.__getThis(), []);
        return;
      }
      const splitKeys = key.replace(/\s/g, '').split(','); // 去可能存在的除空格
      for (let index = 0; index < splitKeys.length; index++) {
        if (changedData.hasOwnProperty(splitKeys[index])) {
          this.observers[key].apply(
            _this.__getThis(),
            splitKeys.map((e) => eval('Object.assign({}, _this.data, _this.properties).' + e))
          );
          return;
        }
      }
    });
  }

  __getThis() {
    const exportProps = ['setData', 'data', 'properties', '__webviewId__', '__componentId__', '__route__'];
    const _this = {};
    exportProps.forEach((e) => {
      if (typeof this[e] === 'function') {
        _this[e] = this[e].bind(this); // 如果将 function 暴露出去，function 中的 this 需要是当前实例的 this
      } else {
        _this[e] = this[e];
      }
    });
    return _this;
  }

  __callPageLifeTime__(name: string, query?: any) {
    this.lifetimes[name] && this.lifetimes[name].call(this.__getThis(), query);
    this[name] && this[name](query);
  }

  // 触发组件内，元素注册的事件，eg: bindtap
  __triggerElementEvent__(eventName: string, data: any) {
    this.methods[eventName] && this.methods[eventName].call(this.__getThis(), data);
  }

  public setData(data: Object) {
    Object.assign(this.data, data); // 修改 class 中的 data 状态
    this.__triggerObservers(data); // 出发事件监听器，监听器里面获取到的数据应该是更新后的数据
    const mergeDataProps = Object.assign({}, this.data, this.properties); // 合并数据
    const sendData = { options: { data: mergeDataProps, __componentId__: this.__componentId__ }, route: this.__route__ };
    KipleServiceJSBridge.publishHandler('RE_RENDER_COMPONENT', sendData, this.__webviewId__);
  }
}

export const getComponentById = (componentId: number) => AppComponents.find((item) => item.page.__componentId__ === componentId);

/**
 * 用于注册一个小程序组件，接受一个 object 作为属性，用来指定页面的初始数据、生命周期回调、事件处理等。
 * @param {IComponentOptions} Options
 */
export const Component = (options: IComponentOptions) => {
  const globPageRegisterPath = getGlobPageRegisterPath();
  if (!checkPageInPagesJson(globPageRegisterPath)) {
    throw new Error(`Component register error. ${globPageRegisterPath} has not been declared.`);
  }
  if (!isPlainObject(options)) {
    throw new Error(`Component's option should be an object. please see ${globPageRegisterPath}.js`);
  }
  console.info(`Add Component: ${globPageRegisterPath}`);
  ComponentConfig[globPageRegisterPath] = options;
};

export const registerComponent = (args: IRegisterComponent, webviewId: number) => {
  console.log('create component start.');
  if (!ComponentConfig[args.route]) {
    customRequire(args.route);
  }

  const componentInstance = new WrapperComponent(args, webviewId);
  const appPage = { page: componentInstance, route: args.route, webviewId: webviewId };
  AppComponents.push(appPage as any);
  const mergeDataProps = Object.assign({}, componentInstance.data, componentInstance.properties);
  const options = { options: { data: mergeDataProps, __componentId__: componentInstance.__componentId__ }, route: args.route };

  KipleServiceJSBridge.publishHandler('RENDER_COMPONENT', options, webviewId);
  console.log('create component end.');
};
