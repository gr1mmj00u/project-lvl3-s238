import axios from 'axios';
import mzfs from 'mz/fs';
import url from 'url';
import path from 'path';
import cheerio from 'cheerio';

export const getFileName = (link, ext = '') => {
  const { host, path: pathLink } = url.parse(link);
  const { name, dir, ext: fileExt } = path.parse(pathLink);
  const parseUrl = (host)
    ? `${host}${path.resolve(dir, name)}`
    : `${path.resolve(dir, name)}`;

  const extention = (ext) ? `.${ext}` : fileExt;

  const fileName = parseUrl.match(/(\w*)/g)
    .filter(e => e)
    .join('-');

  return `${fileName}${extention}`;
};

const loadResource = (link, dir, fileName) => {
  const fullFileName = path.resolve(dir, fileName);

  return axios.get(link, { responseType: 'arraybuffer' })
    .then(response => mzfs.writeFile(fullFileName, response.data))
    .then(() => path.parse(fullFileName))
    .catch(e => console.log(e));
};

const parsePage = (data, hostLink, assetsFolder, assetsFolderPath) => {
  const $ = cheerio.load(data);

  const getObj = (i, e) => $(e);

  const links = $('link[src]').map(getObj).get();
  const images = $('img[src]').map(getObj).get();
  const scripts = $('script[src]').map(getObj).get();

  const resources = [...links, ...images, ...scripts];

  const localResources = resources.filter((e) => {
    const { host } = url.parse(e.attr('src'));
    return !host;
  });

  const process = (e) => {
    const attr = e.attr('src');
    const fileName = getFileName(attr);
    const link = url.resolve(hostLink, attr);
    const newLink = path.resolve('/', assetsFolder, fileName);

    e.attr('src', newLink);

    return loadResource(link, assetsFolderPath, fileName);
  };

  return mzfs.mkdir(assetsFolderPath)
    .then(() => Promise.all(localResources.map(process)))
    .then(() => $.html());
};

export default (link, dir = `${__dirname}`) => {
  const { protocol, host } = url.parse(link);
  const rootLink = url.format({ protocol, host });

  const pageName = getFileName(link, 'html');
  const fullPageName = path.resolve(dir, pageName);

  const assetsFolder = `${getFileName(link)}_files`;
  const assetsFolderPath = path.resolve(dir, assetsFolder);

  return loadResource(link, dir, pageName)
    .then(data => mzfs.readFile(path.format(data), 'utf-8'))
    .then(data => parsePage(data, rootLink, assetsFolder, assetsFolderPath))
    .then(html => mzfs.writeFile(fullPageName, html))
    .catch(e => console.log(e));
};
