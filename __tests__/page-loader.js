import fs from 'mz/fs';
import os from 'os';
import path from 'path';
import nock from 'nock';
import axios from 'axios';
import httpAdapter from 'axios/lib/adapters/http';
import pageLoader from '../src';
import { generateFileName } from '../src/page-loader';


const host = 'http://www.hexlet.io';
const tmpdir = os.tmpdir();

axios.defaults.host = host;
axios.defaults.adapter = httpAdapter;

test('Page loader', async () => {
  nock(host).get('/test/common/ep/?stas=10&sahse=20')
    .reply(200, 'test data');

  expect.assertions(1);
  try {
    const pageLink = `${host}/test/common/ep/?stas=10&sahse=20`;
    const pathPage = await fs.mkdtemp(path.join(tmpdir, 'foo-'));

    await pageLoader(pageLink, pathPage);
    const fullfileName = path.resolve(pathPage, generateFileName(pageLink));
    const data = await fs.readFile(fullfileName, 'utf-8');
    expect(data).toBe('test data');
  } catch (e) {
    expect(e).toMatch('error');
  }
});
