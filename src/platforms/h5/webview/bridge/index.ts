import EventEmitter from '@/util/event';
import initSubscribe from './subscribe';

const customEmitter = new EventEmitter();

export const on = customEmitter.on.bind(customEmitter);
export const off = customEmitter.off.bind(customEmitter);
export const emit = customEmitter.emit.bind(customEmitter);

/**
 * 向 View 层发送事件(自定义事件)
 * @param event
 * @param args
 * @param pageId
 */
export const publishHandler = (event: string, args: any, pageId: number) => {
  window.serviceJSBridge && window.serviceJSBridge.subscribeHandler(event, args, pageId);
};

/**
 * 接收 Service 层事件(通常由 Service 层调用，并暴露至全局 UniServiceJSBridge 对象中)
 * @param event
 * @param args
 * @param pageId
 */
export const subscribeHandler = (event: string, args: any, pageId: number) => {
  emit('service.' + event, args, pageId);
};

/**
 * 向 View 层发送Page事件(Page包裹的事件)
 * @param eventName
 * @param data
 * @param nodeId
 */
export const publishPageEvent = (eventName: string, data: any, pageId: number, componentId?: number) => {
  publishHandler('PAGE_EVENT', { eventName, data, componentId }, pageId);
};

// 订阅事件，传递callback
export function subscribe(event: string, callback: EventListener) {
  return on('service.' + event, callback);
}

// 初始化需要订阅的函数
initSubscribe(subscribe);
