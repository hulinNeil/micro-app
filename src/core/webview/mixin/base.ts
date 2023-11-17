import { diff } from '../parser/diff/diff';
import { patch } from '../parser/diff/patch';
import { render } from '../parser/render';
import Property, { IComponentProps } from './property';

type Props = { [key: string]: any };

/**
 * 仅供基础的组件模板,所有组件都可以基于Base进行创建
 */
const BaseWrapper = (Parent: typeof HTMLElement) => {
  class Base extends Parent {
    static is = 'wx-base';
    __VirtualDom__: IVirtualDom | null = null;
    __DOMTree__: HTMLElement | Text | Comment | null = null;
    __data__: any = {}; // 储存组件 props 和组件内部的 data
    static get properties() {
      return {
        hidden: { type: Boolean, reflectToAttribute: true },
      };
    }
    // 每个组件, 如果需要在内部控制组件的展示效果，那么需要传递props, 用于创建__VirtualDom__
    // Base 基类会暴露一个方法，用于子类重新渲染组件
    constructor(props?: Props) {
      super();
      // 将传递的值保存下来，用于 setData 的 Render.
      const elementData = (this as any).data ? (this as any).data() : {};
      this.__data__ = Object.assign({}, this.getElementProps(), elementData, props || {});
      // 开启 attachShadow
      const shadowRoot = this.attachShadow({ mode: 'open' });

      // 创建模板--- 使用字符串
      if ((this.constructor as any).templateType !== 'tpl') {
        const templateNode = document.createElement('template');
        templateNode.innerHTML = (this.constructor as any).template;
        shadowRoot.appendChild(templateNode.content.cloneNode(true));
        return;
      }

      // 创建模板--- 使用模板语法
      this.__VirtualDom__ = (this.constructor as any).template(this.__data__);
      this.__DOMTree__ = shadowRoot as any;
      // 由于模板都含有 template 标签，shadowRoot 就相当于 template 标签了，所以这里直接遍历 child 进行插入即可
      this.__VirtualDom__?.children.forEach((item) => {
        // 存在 child 是数组的情况: for循环
        if (Array.isArray(item)) {
          item.forEach((_item) => render(_item, this.__DOMTree__ as any));
        } else {
          render(item, this.__DOMTree__ as any);
        }
      });
    }

    // 用于模板语法修改组件状态 + 重新渲染
    setData(props: Props) {
      this.__data__ = Object.assign(this.__data__, props || {});
      const newVirtualDom = (this.constructor as any).template(this.__data__);
      if (this.__DOMTree__ && this.__VirtualDom__) {
        const patches = diff(this.__VirtualDom__, newVirtualDom);
        patch(this.__DOMTree__, patches);
        this.__VirtualDom__ = newVirtualDom;
      }
    }

    triggerEvent(eventName: string, detail: any = {}) {
      const event: any = new Event(eventName, { bubbles: false, composed: false });
      event.detail = detail;
      this.dispatchEvent(event);
    }

    // 获取 组件的属性，用于第一次 render jsx
    getElementProps() {
      const props = (this as any).__properties__ as IComponentProps;
      const _props: Props = {};
      for (var key in props) {
        if (props[key].type) {
          _props[key] = props[key].value ? props[key].type(props[key].value) : props[key].type();
        } else {
          _props[key] = props[key].value;
        }
      }
      return _props;
    }
  }

  return Base;
};

const Base = BaseWrapper(Property(HTMLElement));

export default Base;
