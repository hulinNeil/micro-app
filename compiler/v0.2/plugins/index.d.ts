export interface IPageModule {
  path: string;
  moduleName: string;
  cssModuleName: string;
  resolvePath?: string;
}

export interface IConfig {
  global: { window: IConfig['window'] };
  window?: { [key: string]: any };
  entryPagePath: string;
  pages: string[];
  page: { [key: string]: any };
}
