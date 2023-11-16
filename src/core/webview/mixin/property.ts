import { isFn } from '@/util';

export interface IComponentProps {
  [key: string]: {
    type: Function;
    value?: string | number | boolean;
    observer?: string; // 用于监听属性变化的回调函数，如如image组件的src发生变化，需要重新请求图片
    initObserver?: boolean; // 是都再初始化组件的时候(connectedCallback)就执行一次 observer 函数
    reflectToAttribute?: boolean; // 属性是否显示在dom中
  };
}

/**
 * 将组件中properties绑定到组件实例中，并提供变化的监听
 */
const Property = (Base: typeof HTMLElement) => {
  const getParentConstructor = (e: Object) => {
    const parent = Object.getPrototypeOf(e);
    return parent.prototype instanceof Property ? parent : null;
  };

  class Property extends Base {
    __properties__: IComponentProps = {}; // merge 后的属性
    constructor() {
      super();
      this._initProperties();
    }
    connectedCallback() {
      // 初始化的时候进行一次事件的监听, 部分组件需要在创建的时候 就使用初始化的值进行渲染
      for (var key in this.__properties__) {
        this.__properties__[key].observer &&
          this.__properties__[key].initObserver &&
          this.attributeChangedCallback(key, '', this.__properties__[key].value);
      }
    }
    /**
     * 监听属性变化，并进行事件转发
     */
    attributeChangedCallback(name: string, oldValue: any, newValue: any) {
      const observerFunc = this.__properties__[name].observer;
      if (oldValue !== newValue) {
        observerFunc && this[observerFunc] && isFn(this[observerFunc]) && this[observerFunc](oldValue, newValue, name);
      }
    }

    private _initProperties() {
      const props = (this.constructor as any).getMergedProps();
      this._createProperties(props);
    }

    /**
     * 获取当前构造器 merge 后的props
     */
    static getMergedProps(): IComponentProps {
      const props = (this as any).properties;
      const constructorProps = this.getConstructorProps();
      return Object.assign({}, constructorProps, props);
    }
    /**
     * 获取父构造器的属性
     */
    static getConstructorProps(): IComponentProps {
      const mergeProps = Object.create(null);
      const parent = getParentConstructor(this); // 获取父构造器
      if (parent) {
        Object.assign(mergeProps, parent.properties || {});
        Object.assign(mergeProps, parent.getConstructorProps());
      }
      return mergeProps;
    }
    /**
     * 设置元素的属性
     */
    private _createProperties(props: IComponentProps) {
      this.__properties__ = props;
      for (var key in props) {
        this._setProperty(key, props[key].value);
      }
    }
    /**
     * 设置元素的属性的初始值，同时可以监听 properties 发生变化
     */
    private _setProperty(key: string, value: any) {
      if (this.hasOwnProperty(key)) {
        return;
      }
      Object.defineProperty(this, key, {
        get: () => {
          return this.getAttribute(key) || this.__properties__[key].value;
        },
        set: (e) => {
          if (this.__properties__[key].reflectToAttribute) {
            const realValue = this.__properties__[key].type(e);
            realValue && realValue !== 0 ? this.setAttribute(key, e) : this.removeAttribute(key);
          }
          this.attributeChangedCallback(key, this.__properties__[key].value, e);
          this.__properties__[key].value = e;
        },
      });
    }
  }

  return Property;
};

export default Property;
