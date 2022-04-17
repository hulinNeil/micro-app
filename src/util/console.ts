const createLog = (method: string) => {
  // 后面需要加上环境变量，等级，有条件的显示内容
  // 还需要根据条件，只有debug的时候,才使用bind进行绑定，否则都使用apply,统一log输出的位置
  return window.console[method].bind(window.console, '[system]', `[${method}]`);
};

export const log = createLog('log');
export const info = createLog('info');
export const warn = createLog('warn');
export const debug = createLog('debug');
export const error = createLog('error');
