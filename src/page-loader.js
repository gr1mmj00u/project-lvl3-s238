import axios from 'axios';
import mzfs from 'mz/fs';
import url from 'url';
import path from 'path';
import cheerio from 'cheerio';
import selector from './selector';

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

  const links = selector('link')($);
  const images = selector('img')($);
  const scripts = selector('script')($);

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
