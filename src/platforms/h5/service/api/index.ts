import apiNames from 'kiple-lib/apis';
import { promisify } from '@/core/service/helpers/promise';
import { wrapper, wrapperUnimplemented } from '@/core/service/helpers/api';
import * as storages from './storage';
import * as device from './device';
import * as route from './route';
import * as ui from './ui';

const apis = { ...storages, ...device, ...route, ...ui };

const kiple = Object.create(null);

apiNames.forEach((name: string) => {
  if (apis[name]) {
    kiple[name] = promisify(name, wrapper(name, apis[name]));
  } else {
    kiple[name] = wrapperUnimplemented(name);
  }
});

export default kiple;

// API 实现的时候，如果是使用同步方法进行，包装的，直接return就可以
// API 实现的时候，如果需要使用异步回调，那么需要传入callbackId，然后调用invokeCallbackHandler
