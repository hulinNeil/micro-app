//react-dom/diff.js

import { isSameText, isTextNode } from '@/util';
import { PATCHES_TYPE } from './patches-type';

export interface IPatch {
  type: string;
  nodeList?: IVirtualDom[]; // 当子元素长度大于原来的时候，需要添加剩余的所有子集
  attrs?: { [key: string]: string }; // 属性发生变化
  contentText?: string; // 文字发生变化
  node?: IVirtualDom | null; // 原来节点和新的节点标签不一样
}

// 一层一层从前往后的记录dom树发生了的变化
// 第二个子节点发生的变化，永远比第一个子节点的 key 值大
// 对于子节点的 diff， 采用的是先 add 再 remove 或者 replace 的方式，感觉会出问题
export interface IPatches {
  [key: number]: IPatch[];
}

const diffHelper = {
  Index: 0,
  diffAttr: (oldAttr: Object, newAttr: Object) => {
    let patches = {};
    for (let key in oldAttr) {
      if (oldAttr[key] !== newAttr[key]) {
        // 新的值和老的值不相等，此时需要将新的值赋值给 patches， 如果新值是删除了，那么传递 undefined 回去，也会导致老的属性发生删除
        patches[key] = newAttr[key];
      }
    }
    // 新增属性
    for (let key in newAttr) {
      if (!oldAttr.hasOwnProperty(key)) {
        patches[key] = newAttr[key];
      }
    }

    return patches;
  },
  diffChildren: (oldChild: IVirtualDom[], newChild: IVirtualDom[], patches: IPatches) => {
    oldChild = oldChild.flat();
    newChild = newChild.flat();
    if (newChild.length > oldChild.length) {
      // 有新节点产生
      patches[diffHelper.Index] = patches[diffHelper.Index] || [];
      patches[diffHelper.Index].push({
        type: PATCHES_TYPE.ADD,
        nodeList: newChild.slice(oldChild.length),
      });
    }
    oldChild.forEach((children, index) => {
      diffHelper.Index += 1; // 每次进行子节点的遍历，都需要修改节点的标记
      getPatches(children, newChild[index], diffHelper.Index, patches);
    });
  },
};

export const diff = (oldTree: IVirtualDom, newTree: IVirtualDom) => {
  // 当前节点的标志 每次调用Diff，从0重新计数
  diffHelper.Index = 0;
  let patches: IPatches = {};

  // 进行深度优先遍历
  getPatches(oldTree, newTree, diffHelper.Index, patches);

  // 返回补丁对象
  return patches;
};

/**
 * 当节点为 null 的时候，说明是条件渲染的节点
 */
function getPatches(oldNode: IVirtualDom | null, newNode: IVirtualDom | null, index: number, patches: IPatches) {
  let currentPatches: IPatch[] = [];
  if (isSameText(oldNode, newNode)) {
    return;
  }
  if (!['string', 'number', 'boolean', 'object'].includes(typeof newNode)) {
    // 如果不存在新节点，发生了移除，产生一个关于 Remove 的 patch 补丁
    currentPatches.push({
      type: PATCHES_TYPE.REMOVE,
    });
  } else if (isTextNode(oldNode) && isTextNode(newNode)) {
    // 都是纯文本节点 如果内容不同，产生一个关于 contentText 的 patch
    if (oldNode !== newNode) {
      currentPatches.push({
        type: PATCHES_TYPE.TEXT,
        contentText: String(newNode),
      });
    }
  } else if (newNode && oldNode && oldNode.tag === newNode.tag) {
    // 如果节点类型相同，比较属性差异，如若属性不同，产生一个关于属性的 patch 补丁
    let attrs = diffHelper.diffAttr(oldNode.props, newNode.props);
    // 有attr差异
    if (Object.keys(attrs).length > 0) {
      currentPatches.push({
        type: PATCHES_TYPE.ATTRS,
        attrs: attrs,
      });
    }

    // 如果存在孩子节点，处理孩子节点
    diffHelper.diffChildren(oldNode.children, newNode.children, patches);
  } else {
    // 如果节点类型不同，说明发生了替换
    currentPatches.push({
      type: PATCHES_TYPE.REPLACE,
      node: newNode,
    });
  }

  // 如果当前节点存在补丁，则将该补丁信息填入传入的patches对象中
  if (currentPatches.length) {
    patches[index] = patches[index] ? patches[index].concat(currentPatches) : currentPatches;
  }
}
