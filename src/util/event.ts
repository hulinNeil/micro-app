interface ListenerObj {
  listener: Function;
  once: boolean;
}

const isValidListener = (listener: Function | ListenerObj): boolean => {
  if (typeof listener === 'function') {
    return true;
  } else if (listener && typeof listener === 'object') {
    return isValidListener(listener.listener);
  } else {
    return false;
  }
};

const indexOf = (array: any[], item: any) => {
  var result = -1;
  item = typeof item === 'object' ? item.listener : item;

  for (var i = 0, len = array.length; i < len; i++) {
    if (array[i].listener === item) {
      result = i;
      break;
    }
  }

  return result;
};

/* 
 TODO: 需要设置最大的监听数量？
*/
class EventEmitter {
  static VERSION = '1.0.0';
  __events = {};
  /**
   * 添加事件
   * @param  {String} eventName 事件名称
   * @param  {Function} listener 监听器函数
   * @return {Object} 可链式调用
   */
  on = (eventName: string, listener: Function | ListenerObj) => {
    if (!eventName || !listener) return;

    if (!isValidListener(listener)) {
      throw new TypeError('listener must be a function');
    }

    var events = this.__events;
    var listeners = (events[eventName] = events[eventName] || []);
    var listenerIsWrapped = typeof listener === 'object';

    // 不重复添加事件
    if (indexOf(listeners, listener) === -1) {
      listeners.push(
        listenerIsWrapped
          ? listener
          : {
              listener: listener,
              once: false,
            }
      );
    }

    return this;
  };
  /**
   * 添加事件，该事件只能被执行一次
   * @param  {String} eventName 事件名称
   * @param  {Function} listener 监听器函数
   * @return {Object} 可链式调用
   */
  once = (eventName: string, listener: Function) => {
    return this.on(eventName, {
      listener: listener,
      once: true,
    });
  };
  /**
   * 删除事件
   * @param  {String} eventName 事件名称
   * @param  {Function} listener 监听器函数
   * @return {Object} 可链式调用
   */
  off = (eventName: string, listener: Function) => {
    var listeners = this.__events[eventName];
    if (!listeners) return;

    var index;
    for (var i = 0, len = listeners.length; i < len; i++) {
      if (listeners[i] && listeners[i].listener === listener) {
        index = i;
        break;
      }
    }

    if (typeof index !== 'undefined') {
      listeners.splice(index, 1, null);
    }

    return this;
  };

  /**
   * 触发事件
   * @param  {String} eventName 事件名称
   * @param  {Array} args 传入监听器函数的参数，使用数组形式传入
   * @return {Object} 可链式调用
   */
  emit = (eventName: string, ...args: any[]) => {
    var listeners = this.__events[eventName];
    if (!listeners) return;

    for (var i = 0; i < listeners.length; i++) {
      var listener = listeners[i];
      if (listener) {
        listener.listener.call(this, ...args);
        if (listener.once) {
          this.off(eventName, listener.listener);
        }
      }
    }

    return this;
  };
  /**
   * 删除某一个类型的所有事件或者所有事件
   * @param  {String[]} eventName 事件名称
   */
  allOff = (eventName: string) => {
    if (eventName && this.__events[eventName]) {
      this.__events[eventName] = [];
    } else {
      this.__events = {};
    }
  };
}

export default EventEmitter;
