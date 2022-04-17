import EventEmitter from '@/util/event';
import initSubscribe from './subscribe';

const customEmitter = new EventEmitter();

export const on = customEmitter.on.bind(customEmitter);
export const off = customEmitter.off.bind(customEmitter);
export const emit = customEmitter.emit.bind(customEmitter);

/**
 * 向 Service 层发送事件
 * @param event
 * @param args
 * @param pageId
 */
export const publishHandler = (event: string, args: any, pageId: number) => {
  window.viewJSBridge && window.viewJSBridge.subscribeHandler(event, args, pageId);
};

/**
 * 接收 View 层事件
 * @param event
 * @param args
 * @param pageId
 */
export const subscribeHandler = (event: string, args: any, pageId: number) => {
  console.log(`Invoke custom event \`${event}\` in page: ${pageId}`);
  emit('view.' + event, args, pageId);
};

// 订阅事件，传递callback
export function subscribe(event: string, callback: EventListener) {
  return on('view.' + event, callback);
}

// 初始化需要订阅的函数
initSubscribe(subscribe);
