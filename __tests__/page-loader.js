import fs from 'mz/fs';
import os from 'os';
import path from 'path';
import nock from 'nock';
import axios from 'axios';
import httpAdapter from 'axios/lib/adapters/http';
import pageLoader from '../src';
import { getFileName } from '../src/page-loader';

const host = 'http://www.hexlet.io';
const tmpdir = os.tmpdir();
const query = '/test/save/page/?test=10&param=20';
const sourcePage = path.resolve(__dirname, '__fixtures__/source.html');
const expectedPage = path.resolve(__dirname, '__fixtures__/expected.html');

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
    const pageLink = `${host}${query}`;

    const tempPath = await fs.mkdtemp(path.join(tmpdir, 'foo-'));
    console.log(tempPath);
    await pageLoader(pageLink);

    const fullfileName = path.resolve('/home/introx/js/project-lvl3-s238/src/', getFileName(pageLink, 'html'));
    console.log(fullfileName);
    //const data = await fs.readFile(fullfileName, 'utf-8');
    const data = await fs.readFile(fullfileName, 'utf-8');

    expect(data).toBe(expected);
  } catch (e) {
    expect(e).toMatch('error');
  }
});
