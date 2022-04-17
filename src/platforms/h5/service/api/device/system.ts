export const getSystemInfoSync = () => {
  const language = navigator.language;
  const SDKVersion = VERSION;
  return { language, SDKVersion };
};

export const getSystemInfo = () => getSystemInfoSync();
