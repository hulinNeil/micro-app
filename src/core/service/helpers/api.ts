import { isFn } from '@/util/util';
import { isSyncApi } from './promise';

interface IInvokeCallback {
  [key: number]: {
    name: string; //  `api.${apiName}.${callbackId}`
    keepAlive?: boolean; // TODO 是否保持存活
    callback: Function;
    start?: string; // TODO 需要打点记录API的性能?
    end?: string;
  };
}

let invokeCallbackId = 1;
const invokeCallbacks: IInvokeCallback = {};

// 含有Callback的API的调用,都需要经过这个函数
export const invokeCallbackHandler = (callbackId: number, res: any) => {
  if (typeof callbackId === 'number') {
    const invokeCallback = invokeCallbacks[callbackId];
    if (invokeCallback) {
      // TODO: 如果需要 keep alive,就不需要删除
      delete invokeCallbacks[callbackId];
      return invokeCallback.callback(res);
    }
  }
  return res;
};

export const createInvokeCallback = (apiName: string, params: any = {}): { params: any; callbackId: number } => {
  const { success, fail, complete } = params;

  const hasSuccess = isFn(success);
  const hasFail = isFn(fail);
  const hasComplete = isFn(complete);

  const invokeCallback = (res: { [key: string]: any }) => {
    res.errMsg = res.errMsg || `${apiName}:ok`;

    if (res.errMsg.includes(`${apiName}:ok`)) {
      hasSuccess && success(res);
    } else if (res.errMsg.includes(`${apiName}:fail`)) {
      hasFail && fail(res);
    }
    hasComplete && complete(res);
  };

  const callbackId = invokeCallbackId++;
  invokeCallbacks[callbackId] = {
    name: `api.${apiName}.${callbackId}`,
    callback: invokeCallback,
  };

  return { params, callbackId };
};

// 包装已定义的API,并将其存入内存,以便异步进行调用
export const wrapper = (apiName: string, invokeMethod: Function) => {
  if (!isFn(invokeMethod)) {
    return invokeMethod;
  }
  return (...args: any[]) => {
    // 如果是同步的API,直接返回调用的结果，如果不是永远返回 undefined
    if (isSyncApi(apiName)) {
      return invokeMethod.apply(null, args);
    }
    let argsObj = {};
    if (args.length) {
      argsObj = args[0];
    }
    const { params, callbackId } = createInvokeCallback(apiName, argsObj);
    // 调用API,并传入callbackId，在API内部，当逻辑完成使用callbackId，调用invokeCallbackHandler完成回调
    let res = invokeMethod(params, callbackId);
    if (res) {
      // 如果res存在，说明是使用同步方式封装的API,需要在内存中删除调用记录
      res = invokeCallbackHandler(callbackId, res);
    }
    return res;
  };
};

export const wrapperUnimplemented = (apiName: string) => () => {
  console.error('API `' + apiName + '` is not yet implemented.');
};
