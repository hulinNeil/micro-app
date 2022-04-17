import { urlStringify } from '@/util';

interface IBridge {
  exec: (actionName: string, args: { [key: string]: any }) => any;
  execSync: (actionName: string, args: { [key: string]: any }) => any;
  callbackFromNative: (callbackId: number, result: IResult) => void;
}

interface IInvokeCallback {
  [key: number]: {
    success: Function;
    fail: Function;
  };
}

interface IResult {
  status: number;
  data: any;
  message?: string;
}

enum Status {
  FAIL = -1,
  SUCCESS = 1,
}

const commandPrefix = 'kiple://';
let invokeCallbackId = 1;
const invokeCallbacks: IInvokeCallback = {};

const jsBridge: IBridge = {
  exec: (actionName, args) => {
    const { success, fail, complete, ...argsObj } = args || {};
    invokeCallbacks[invokeCallbackId] = { success, fail };
    // 需要将callbackId发送给native，native处理结果后将call bridge.callbackFromNative 通知前端
    argsObj.__callbackId__ = invokeCallbackId++;
    const argString = urlStringify(argsObj);
    window.prompt(commandPrefix + actionName + '?' + argString);
  },
  execSync: (actionName, args) => {
    const argString = urlStringify(args);
    return window.prompt(commandPrefix + actionName + '?' + argString);
  },
  callbackFromNative(callbackId: number, result: IResult) {
    const callback = invokeCallbacks[callbackId];
    if (callback) {
      if (result.status === Status.SUCCESS) {
        callback.success && callback.success(result.data);
      } else {
        callback.fail && callback.fail(result.message);
      }
      delete invokeCallbacks[callbackId];
    }
  },
};

export default jsBridge;
