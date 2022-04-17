import { initComponent } from '@/platforms/h5/webview/page/component';
import { isFn, isPlainObject, isStr } from '@/util';
import { addEvent, applyEvent } from './event';
import { CreateIVirtualDomFunc } from './render.d';

/**
 * 设置组件的属性，绑定事件监听
 * @param dom {HTMLElement} DOM节点
 * @param key {string} 属性名
 * @param value {any} 属性值
 */
export const setProperty = (dom: HTMLElement, key: string, value: any) => {
  if (/(bind|catch):?(.+)/.test(key)) {
    applyEvent(dom, key, value);
  } else if (/(on):?(.+)/.test(key) && isStr(value)) {
    // 如果是 on 且 value 是 function，则认为是内部组件
    addEvent(dom, key, value);
  } else if (key === 'style' && value) {
    // TODO style 属性需要进行 rpx2px 的转换
    if (isStr(value)) {
      dom.style.cssText = value;
    } else {
      Object.assign(dom.style, value);
    }
  } else if (/data-/.test(key)) {
    // 处理自定义属性，常用来进行 view 通知 service 的数据
    const customKey = key
      .replace('data-', '')
      .toLocaleLowerCase()
      .replace(/-[a-z]/g, (e) => e[1].toLocaleUpperCase());
    dom.dataset[customKey] = value;
  } else if (value !== undefined) {
    // 直接朝dome中进行赋值，可以使用Object.defineProperty在元素中进行监听需要的属性变化
    key = key.replace(/-[a-z]/g, (e) => e[1].toLocaleUpperCase());
    dom[key] = value;
  }
};

/**
 * 根据虚拟dom，生成真实dom
 * @param virtualDom 虚拟DOM树
 * @param hash 每个页面的hash值，用于区分css的样式隔离
 * @returns 真实 dom 树
 */
export const createDomTree = (virtualDom: IVirtualDom | null, hash?: string): HTMLElement | Text | Comment | null => {
  const paramType = typeof virtualDom;
  if (virtualDom && isPlainObject(virtualDom)) {
    if (isStr(virtualDom.tag)) {
      const dom = document.createElement(virtualDom.tag as string);
      if (virtualDom.props && virtualDom.props.__isComponent__) {
        initComponent(virtualDom, dom);
      }
      if (hash) {
        dom.setAttribute(hash, '');
      }
      if (virtualDom.props) {
        for (let key in virtualDom.props) {
          setProperty(dom, key, virtualDom.props[key]);
        }
      }
      //递归处理子节点,将子节点插入到dom里面
      if (virtualDom.children && virtualDom.children.length > 0) {
        virtualDom.children.forEach((item) => {
          // 存在 child 是数组的情况: for循环
          if (Array.isArray(item)) {
            item.forEach((_item) => render(_item, dom, hash));
          } else {
            render(item, dom, hash);
          }
        });
      }
      return dom;
    } else if (isFn(virtualDom.tag)) {
      // 简单的处理函数组件，小程序只生成简单的函数组件，暂时不进行复杂的处理
      const _virtualDom = (virtualDom.tag as CreateIVirtualDomFunc)(virtualDom.props);
      const dom = createDomTree(_virtualDom, hash);
      return dom;
    }
  } else if (virtualDom === null) {
    return document.createComment('');
  } else if (['string', 'number', 'boolean', 'object'].includes(paramType)) {
    return document.createTextNode(String(virtualDom));
  }
  return null;
};

/**
 * 根据虚拟dom，和父节点，渲染页面
 */
export const render = (virtualDom: IVirtualDom, container: Element, hash?: string) => {
  // 根据虚拟DOM转换为真实DOM
  const dom = createDomTree(virtualDom, hash);
  // 将真实DOM添加到容器DOM中
  if (dom) {
    container.appendChild(dom);
  }
};

/**
 * 创建虚拟dom，所有的页面元素都需要调用这个方法
 */
export const createElement = (tag: string, props: any, ...children: any[]): IVirtualDom => {
  children = children.flat();
  return { tag, props, children };
};

/**
 * 通过render函数和page的Data，生成虚拟dom(类似于react中的函数组件+props)
 * @param render {Function} 页面的渲染函数
 * @param data {Object} 页面的状态数据
 */
export const createVirtualDom = (render: Function, data: Object): IVirtualDom => {
  return render(data);
};
