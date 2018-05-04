import fs from 'mz/fs';
import os from 'os';
import path from 'path';
import nock from 'nock';
import axios from 'axios';
import httpAdapter from 'axios/lib/adapters/http';
import pageLoader from '../src';
import { getFileName } from '../src/page-loader';

const getFullPath = file => path.resolve(__dirname, file);

const tmpdir = os.tmpdir();
const host = 'http://www.hexlet.io';
const query = '/test/save/page/?test=10&param=20';
const pageLink = `${host}${query}`;
const sourcePage = getFullPath('__fixtures__/source.html');
const expectedPage = getFullPath('__fixtures__/expected.html');

axios.defaults.adapter = httpAdapter;

beforeEach(() => {
  nock(host)
    .get(query)
    .replyWithFile(200, sourcePage, { 'Content-Type': 'text/html' });

  nock(host)
    .get('/src/css/test.css')
    .replyWithFile(
      200,
      path.resolve(__dirname, '__fixtures__/src/css/test.css'),
      { 'Content-Type': 'text/css' },
    );

  nock(host)
    .get('/src/js/test.js')
    .replyWithFile(
      200,
      path.resolve(__dirname, '__fixtures__/src/js/test.js'),
      { 'Content-Type': 'application/javascript' },
    );

  nock(host)
    .get('/src/img/image1.jpg')
    .replyWithFile(
      200,
      path.resolve(__dirname, '__fixtures__/src/img/image1.jpg'),
      { 'Content-Type': 'image/jpeg' },
    );

  nock(host)
    .get('/src/img/image2.png')
    .replyWithFile(
      200,
      path.resolve(__dirname, '__fixtures__/src/img/image2.png'),
      { 'Content-Type': 'image/png' },
    );
});

test('Save page', async () => {
  const expected = await fs.readFile(expectedPage, 'utf-8');

  try {
    const tempPath = await fs.mkdtemp(path.join(tmpdir, 'foo-'));
    await pageLoader(pageLink, tempPath);

    const fullfileName = path.resolve(tempPath, getFileName(pageLink, 'html'));
    const data = await fs.readFile(fullfileName, 'utf-8');

    expect(data).toBe(expected);
  } catch (e) {
    expect(e).toMatch('error');
  }
});

test('Save files', async () => {
  const css = await fs.readFile(getFullPath('__fixtures__/src/css/test.css'), 'utf-8');
  const js = await fs.readFile(getFullPath('__fixtures__/src/js/test.js'), 'utf-8');
  const jpeg = await fs.readFile(getFullPath('__fixtures__/src/img/image1.jpg'), 'utf-8');
  const png = await fs.readFile(getFullPath('__fixtures__/src/img/image2.png'), 'utf-8');

  try {
    const tempPath = await fs.mkdtemp(path.join(tmpdir, 'foo-'));
    await pageLoader(pageLink, tempPath);

    const assetsPath = path.resolve(tempPath, `${getFileName(pageLink)}_files`);
    expect(await fs.readFile(path.resolve(assetsPath, 'src-css-test.css'), 'utf-8')).toBe(css);
    expect(await fs.readFile(path.resolve(assetsPath, 'src-js-test.js'), 'utf-8')).toBe(js);
    expect(await fs.readFile(path.resolve(assetsPath, 'src-img-image1.jpg'), 'utf-8')).toBe(jpeg);
    expect(await fs.readFile(path.resolve(assetsPath, 'src-img-image2.png'), 'utf-8')).toBe(png);
  } catch (e) {
    expect(e).toMatch('error');
  }
});
