import * as htmlparser2 from 'htmlparser2';
import generateFromAST, { getData } from './generateFromAST';

describe('Data Binding', () => {
  test('parser data', () => {
    const data = '{{src}}/path';
    const result = getData(data);
    expect(result.variates[0]).toEqual('src');
  });
});

describe('Parser Component', () => {
  test('Image: simple path', () => {
    const image = '<image src="/static/test.jpg"></image>';
    const ast: any[] = htmlparser2.parseDOM(image);
    const result = generateFromAST(ast[0]);
    expect(result.code).toEqual(`createElement('wx-image',{${JSON.stringify('src')}:${JSON.stringify('/static/test.jpg')}},)`);
  });
});
