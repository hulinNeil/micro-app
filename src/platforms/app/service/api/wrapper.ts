import { isSyncApi } from '@/core/service/helpers/promise';
import jsBridge from './jsBridge';

// 包装 API,调用 kiple.bridge
export const wrapper = (apiName: string) => {
  return (...args: any[]) => {
    // 如果是同步的API,直接返回调用的结果, 如果不是返回 undefined
    if (isSyncApi(apiName)) {
      return jsBridge.execSync(apiName, { params: args });
    }
    let argsObj = {};
    if (args.length) {
      argsObj = args[0];
    }
    return jsBridge.exec(apiName, argsObj);
  };
};
