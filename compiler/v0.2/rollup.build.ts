import * as rollup from 'rollup';
import parserCss from './plugins/rollup-plugin-css';
import parserKml from './plugins/rollup-plugin-kml';
import { serviceRoot, viewRoot } from './plugins/rollup-plugin-parserAppJson';
import transformJs from './plugins/rollup-plugin-js';
import { resolveApp } from './utils';
const alias = require('@rollup/plugin-alias');

let startTime = new Date().getTime();

const options = [
  {
    input: 'example/app.json',
    plugins: [serviceRoot(), transformJs()],
    output: {
      file: 'dist/app-service.js',
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
    plugins: [
      viewRoot(),
      parserCss(),
      parserKml(),
      alias({
        entries: [{ find: 'inject', replacement: resolveApp('compiler/v0.2/injects') }],
      }),
    ],
  },
];

const build = async () => {
  startTime = new Date().getTime();

  // create a bundle
  const bundle: any = await rollup.rollup(options[0] as any);

  // write the bundle to disk
  await bundle.write(options[0].output);

  let endTime = new Date().getTime();

  console.log('编译 view 文件成功, 耗时：', endTime - startTime);

  // create a bundle
  const bundle1: any = await rollup.rollup(options[1] as any);

  // write the bundle to disk
  await bundle1.write(options[1].output);

  console.log('编译 service 文件成功, 耗时：', new Date().getTime() - endTime);
};

try {
  build();
} catch (error) {
  console.log('Build mini App Error', error);
}
