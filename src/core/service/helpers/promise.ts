import { isFn } from '@/util/util';

const SYNC_API_RE = /Sync$/;

interface IOptions {
  success?: Function;
  fail?: Function;
  complete?: Function;
}

export const isSyncApi = (name: string): boolean => {
  const result = SYNC_API_RE.test(name);
  return result;
};

export function shouldPromise(apiName: string) {
  if (isSyncApi(apiName)) {
    return false;
  }
  return true;
}

export const promisify = (apiName: string, api: Function) => {
  if (!shouldPromise(apiName)) {
    return api;
  }
  return (options: IOptions = {}, ...params: any) => {
    // 如果含有 callback, 就不走 promise 的逻辑
    if (isFn(options.success) || isFn(options.fail) || isFn(options.complete)) {
      return api(options, ...params);
    }

    return new Promise((resolve, reject) => {
      const _options = Object.assign({}, options, { success: resolve, fail: reject });
      api(_options, ...params);
    });
  };
};
