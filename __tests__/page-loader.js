import fs from 'mz/fs';
import os from 'os';
import path from 'path';
import nock from 'nock';
import axios from 'axios';
import debug from 'debug';
import httpAdapter from 'axios/lib/adapters/http';
import pageLoader from '../src';
import { getFileName } from '../src/page-loader';

const getFullPath = file => path.resolve(__dirname, file);
const log = debug('page-loader:test');

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
  nock(host)
    .get('/src/img/image3.png')
    .reply(404);
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
    log('Save page => %s', e.toString());
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
    const cssData = await fs.readFile(path.resolve(assetsPath, 'src-css-test.css'), 'utf-8');
    const jsData = await fs.readFile(path.resolve(assetsPath, 'src-js-test.js'), 'utf-8');
    const jpegData = await fs.readFile(path.resolve(assetsPath, 'src-img-image1.jpg'), 'utf-8');
    const pngData = await fs.readFile(path.resolve(assetsPath, 'src-img-image2.png'), 'utf-8');

    expect(cssData).toBe(css);
    expect(jsData).toBe(js);
    expect(jpegData).toBe(jpeg);
    expect(pngData).toBe(png);
  } catch (e) {
    log('Save files => %s', e.toString());
    expect(e).toMatch('error');
  }
});

test('404 status', async () => {
  try {
    const tempPath = await fs.mkdtemp(path.join(tmpdir, 'foo-'));
    await pageLoader(path.resolve(host, '/src/img/image3.png'), tempPath);
  } catch (e) {
    log('404 status => %s', e.toString());
    expect(e.message).toMatch('Resource by (/src/img/image3.png) was not saved.');
  }
});

test('Output dir is not exist', async () => {
  try {
    await pageLoader(path.resolve(host, '/src/img/image3.png'), './test/folder/');
  } catch (e) {
    log('Output dir is not exist => %s', e.toString());
    expect(e.message).toMatch('Folder (./test/folder/) does not exists.');
  }
});
