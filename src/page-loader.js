import axios from 'axios';
import mzfs from 'mz/fs';
import url from 'url';
import path from 'path';
import cheerio from 'cheerio';
import debug from 'debug';

const log = debug('page-loader:main');

export const getFileName = (link, ext = '') => {
  log('getFileName()');
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
  log('loadResourse()');
  const fullFileName = path.resolve(dir, fileName);

  return axios.get(link, { responseType: 'arraybuffer' })
    .then(response => mzfs.writeFile(fullFileName, response.data))
    .then(() => path.parse(fullFileName))
    .catch(e => console.log(e));
};

const getSelector = obj => (tag) => {
  log('getSelector()');
  let selector = '';

  switch (tag) {
    case 'link':
      selector = 'link[href]';
      break;
    case 'img':
      selector = 'img[src]';
      break;
    case 'script':
      selector = 'script[src]';
      break;
    default: return [];
  }

  return obj(selector).map((i, e) => obj(e)).get();
};

const parsePage = (data, hostLink, assetsFolder, assetsFolderPath) => {
  log('parsePage()');
  const $ = cheerio.load(data);
  const selector = getSelector($);

  const links = selector('link');
  const images = selector('img');
  const scripts = selector('script');

  const getFilter = attr => (e) => {
    const { host } = url.parse(e.attr(attr));
    return !host;
  };

  const filteredLinks = links.filter(getFilter('href'));
  const filteredImages = images.filter(getFilter('src'));
  const filteredScripts = scripts.filter(getFilter('src'));

  const load = attr => (e) => {
    const href = e.attr(attr);
    const fileName = getFileName(href);
    const link = url.resolve(hostLink, href);
    const newLink = path.resolve('/', assetsFolder, fileName);

    e.attr(attr, newLink);

    return loadResource(link, assetsFolderPath, fileName);
  };

  const linksPromises = filteredLinks.map(load('href'));
  const imagesPromises = filteredImages.map(load('src'));
  const scriptsPromises = filteredScripts.map(load('src'));

  return mzfs.mkdir(assetsFolderPath)
    .then(() => Promise.all([...linksPromises, ...imagesPromises, ...scriptsPromises]))
    .then(() => $.html());
};

export default (link, dir = `${__dirname}`) => {
  log('pageLoader()');
  const { protocol, host } = url.parse(link);
  const rootLink = url.format({ protocol, host });

  const pageName = getFileName(link, 'html');
  const fullPageName = path.resolve(dir, pageName);

  const assetsFolder = `${getFileName(link)}_files`;
  const assetsFolderPath = path.resolve(dir, assetsFolder);
  log(` Start parameters:
    link = ${link}
    dir = ${dir}
    pageName = ${pageName}
    fullPageName = ${fullPageName}
    assetsFolder = ${assetsFolder}
    assetsFolderPath = ${assetsFolderPath}
  `);
  return loadResource(link, dir, pageName)
    .then(data => mzfs.readFile(path.format(data), 'utf-8'))
    .then(data => parsePage(data, rootLink, assetsFolder, assetsFolderPath))
    .then(html => mzfs.writeFile(fullPageName, html))
    .catch(e => console.log(e));
};
