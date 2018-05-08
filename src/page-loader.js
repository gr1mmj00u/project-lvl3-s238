import axios from 'axios';
import mzfs from 'mz/fs';
import Listr from 'listr';
import url from 'url';
import path from 'path';
import cheerio from 'cheerio';
import debug from 'debug';

const log = debug('page-loader:main');

const selectors = {
  img: 'src',
  script: 'src',
  link: 'href',
};

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
  log(`Log resourse:
    link = %s;
    dir = %s;
    fileName = %s`, link, dir, fileName);
  const fullFileName = path.resolve(dir, fileName);

  return {
    title: link,
    task: () => axios.get(link, { responseType: 'arraybuffer' })
      .catch((e) => {
        log(e);
        throw new Error(`Resource by (${link}) was not saved.`);
      })
      .then(response => mzfs.writeFile(fullFileName, response.data))
      .then(() => path.parse(fullFileName)),
  };
};

const getTagsObjects = ($, tags) => tags.reduce((acc, tag) => {
  const elements = $(tag).get();
  return [...acc, ...elements];
}, []);

const parsePage = (data, hostLink, assetsFolder, assetsFolderPath) => {
  const $ = cheerio.load(data);
  const tagObjects = getTagsObjects($, ['img', 'script', 'link']);

  const tasks = tagObjects.reduce((acc, e) => {
    const attribute = selectors[e.name];
    const ref = $(e).attr(attribute);
    const { host } = url.parse(ref);

    if (host) {
      return acc;
    }

    const fileName = getFileName(ref);
    const link = url.resolve(hostLink, ref);
    const newLink = path.resolve('/', assetsFolder, fileName);

    log('New link %s', newLink);

    $(e).attr(attribute, newLink);

    return [...acc, loadResource(link, assetsFolderPath, fileName)];
  }, []);

  const loadResourseTasks = new Listr(tasks);
  const promiseListr = Promise.resolve(loadResourseTasks.run());

  return mzfs.mkdir(assetsFolderPath)
    .then(() => promiseListr)
    .then(() => $.html());
};

export default (link, dir) => {
  const { protocol, host } = url.parse(link);
  const rootLink = url.format({ protocol, host });

  const pageName = getFileName(link, 'html');
  const fullPageName = path.resolve(dir, pageName);

  const assetsFolder = `${getFileName(link)}_files`;
  const assetsFolderPath = path.resolve(dir, assetsFolder);

  if (!mzfs.existsSync(dir)) {
    return Promise.reject(new Error(`Folder (${dir}) does not exists.`));
  }

  return axios.get(link, { responseType: 'arraybuffer' })
    .catch((e) => {
      log(e);
      throw new Error(`Resource by (${link}) was not saved.`);
    })
    .then(response => mzfs.writeFile(fullPageName, response.data))
    .then(() => mzfs.readFile(fullPageName, 'utf-8'))
    .then(data => parsePage(data, rootLink, assetsFolder, assetsFolderPath))
    .then(html => mzfs.writeFile(fullPageName, html));
};
