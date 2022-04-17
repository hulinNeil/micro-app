import apiNames from 'kiple-lib/apis';
import { promisify } from '@/core/service/helpers/promise';
import { wrapperUnimplemented } from '@/core/service/helpers/api';
import { wrapper } from './wrapper';
import jsBridge from './jsBridge';

const apis = ['setStorage', 'getStorage', 'getToken', 'pay'];

const kiple = Object.create({ bridge: jsBridge });

apiNames.forEach((name: string) => {
  if (apis.includes(name)) {
    kiple[name] = promisify(name, wrapper(name));
  } else {
    kiple[name] = wrapperUnimplemented(name);
  }
});

if (!(window as any).kiple) {
  Object.assign(window, { kiple });
}

export default kiple;
