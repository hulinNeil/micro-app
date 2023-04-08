import * as rollup from 'rollup';
import * as fs from 'fs-extra';
import parserCss from './plugins/rollup-plugin-css';
import parserKml from './plugins/rollup-plugin-kml';
import { serviceRoot, viewRoot } from './plugins/rollup-plugin-parserAppJson';
import transformJs from './plugins/rollup-plugin-js';
import { resolveApp } from './utils';
const alias = require('@rollup/plugin-alias');
const serve = require('rollup-plugin-serve');
const chokidar = require('chokidar');

let startTime = 0;

/**
 * 使用 rollup 自带的 watch 进行文件夹的监听，优点是效率高，缺点是无法在 kml 编译后，触发 js 的编译
 * （之所以是有这个需求，是因为媒体组件的 src 可能是在 js 中进行的赋值，需要在编译 js 的时候将静态文件编译到 dist 目录）
 */

const watchOptions = [
  {
    input: 'example/app.json',
    plugins: [serviceRoot(), transformJs()],
    watch: {
      include: 'example/**',
    },
    output: {
      file: 'dist/app-service.js',
      sourcemap: true,
      format: 'iife',
    },
  },
  {
    input: 'example/app.json',
    output: {
      file: 'dist/app-view.js',
      format: 'iife',
    },
    treeshake: false,
    watch: {
      include: 'example/**',
    },
    plugins: [
      viewRoot(),
      parserCss(),
      parserKml(),
      alias({
        entries: [{ find: 'inject', replacement: resolveApp('compiler/v0.2/injects') }],
      }),
      serve({
        port: 9091,
        historyApiFallback: true,
        contentBase: 'dist',
      }),
    ],
  },
];

const watcher = rollup.watch(watchOptions as any);

const errorList: any[] = [];

// 监听业务代码
watcher.on('event', (event: any) => {
  switch (event.code) {
    case 'START':
      startTime = new Date().getTime();
      errorList.splice(0);
      break;
    case 'END':
      if (errorList.length === 0) {
        console.log('编译文件结束, 耗时：', new Date().getTime() - startTime);
      }
      startTime = new Date().getTime();
      break;
    case 'ERROR':
      errorList.push(event.error);
      console.error('[Error]', event.error.stack);
      if (event.error.frame) {
        console.error(event.error.frame);
      }
  }

  // 移除最后一个缓存(app.json的缓存)，为了使每次文件发生变化都能进行最外一层的重新刷新, 保持正确的文件依赖引入
  if (event.result && event.result && event.result.cache) {
    event.result.cache.modules.pop();
  }
});

// 监听静态文件
try {
  const files = ['.png', '.jpg', '.svg', '.mp4', '.mov', '.m4v', '.3gp', '.avi', '.m3u8'];
  const watch = chokidar.watch(
    files.map((item) => `example/**/**${item}`),
    { cwd: process.cwd() }
  );

  watch.on('all', (event: string, path: string) => {
    const filePath = resolveApp(path);
    if (['add', 'change'].includes(event)) {
      fs.copySync(filePath, filePath.replace('example', 'dist'));
    }
    if (event === 'unlink') {
      fs.removeSync(filePath.replace('example', 'dist'));
    }
  });
} catch (error) {
  console.log('Build mini App Error', error);
}
