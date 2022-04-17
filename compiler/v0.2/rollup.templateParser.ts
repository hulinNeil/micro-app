import * as rollup from 'rollup';
import { resolveApp } from './utils';
const ts = require('rollup-plugin-typescript2');

const tsPlugin = ts({
  tsconfig: resolveApp('tsconfig.json'), // 导入本地ts配置
});

// 用于导出 template-parser, 供 webpack 调用
const options = {
  input: 'compiler/v0.2/core/template-parser.ts',
  output: {
    file: 'build/loader/template-parser.js',
    sourcemap: false,
    format: 'cjs',
    exports: 'auto',
  },
  plugins: [tsPlugin],
};

const build = async () => {
  const startTime = new Date().getTime();

  // create a bundle
  const bundle: any = await rollup.rollup(options as any);

  // write the bundle to disk
  await bundle.write(options.output);

  console.log('编译 html-parser 文件成功, 耗时：', new Date().getTime() - startTime);
};

try {
  build();
} catch (error) {
  console.log('Build html-parser Error', error);
}
