import axios from 'axios';
import fs from 'mz/fs';
import Listr from 'listr';
import url from 'url';
import path from 'path';
import cheerio from 'cheerio';
import debug from 'debug';
import 'babel-polyfill';

const log = debug('page-loader:main');

const selectors = {
  img: 'src',
  script: 'src',
  link: 'href',
};

export const getFileName = (link, ext = '') => {
  const { host, path: pathLink } = url.parse(link);
  const { name, dir, ext: fileExt } = path.parse(pathLink || '');
  const parseUrl = (host)
    ? `${host}${path.resolve(dir, name)}`
    : `${path.resolve(dir, name)}`;

  const extention = (ext) ? `.${ext}` : fileExt;

  const fileName = parseUrl.match(/(\w*)/g)
    .filter(e => e)
    .join('-');

  return `${fileName}${extention}`;
};

const getTagsObjects = ($, tags) => tags.reduce((acc, tag) => [...acc, ...$(tag).get()], []);

const loadResource = (link, dir, fileName) => {
  log(`Log resourse:
    link = %s;
    dir = %s;
    fileName = %s`, link, dir, fileName);

  const fullFileName = path.resolve(dir, fileName);

  return {
    title: link,
    task: async () => {
      try {
        const response = await axios.get(link, { responseType: 'arraybuffer' });
        await fs.writeFile(fullFileName, response.data);
        return path.parse(fullFileName);
      } catch (err) {
        throw new Error(`Resource by (${link}) was not saved.`);
      }
    },
  };
};

const parsePage = async (data, hostLink, assetsFolder, assetsFolderPath) => {
  const $ = cheerio.load(data);
  const tagObjects = getTagsObjects($, ['img', 'script', 'link']);
  const uniqResources = [];

  const tasks = tagObjects.reduce((acc, e) => {
    const attribute = selectors[e.name];
    const ref = $(e).attr(attribute) || '';
    const { host } = url.parse(ref);

    if (host || !ref) {
      return acc;
    }

    const fileName = getFileName(ref);
    const link = url.resolve(hostLink, ref);
    const newLink = `.${path.resolve('/', assetsFolder, fileName)}`;

    log('New link %s', newLink);

    $(e).attr(attribute, newLink);

    if (uniqResources.find(l => l === newLink)) {
      return acc;
    }

    uniqResources.push(newLink);

    return [...acc, loadResource(link, assetsFolderPath, fileName)];
  }, []);

  const loadResourseTasks = new Listr(tasks, { concurrent: true });

  if (!fs.existsSync(assetsFolderPath)) {
    await fs.mkdir(assetsFolderPath);
  }

  await loadResourseTasks.run();

  return $.html();
};

export default async (link, dir) => {
  const { protocol, host } = url.parse(link);
  const rootLink = url.format({ protocol, host });

  const pageName = getFileName(link, 'html');
  const fullPageName = path.resolve(dir, pageName);

  const assetsFolder = `${getFileName(link)}_files`;
  const assetsFolderPath = path.resolve(dir, assetsFolder);

  try {
    if (!fs.existsSync(dir)) {
      throw new Error(`Folder (${dir}) does not exists.`);
    }

    const page = await axios.get(link, { responseType: 'arraybuffer' });

    await fs.writeFile(fullPageName, page.data);

    const html = await parsePage(page.data, rootLink, assetsFolder, assetsFolderPath);

    return fs.writeFile(fullPageName, html);
  } catch (err) {
    log(err);
    throw err;
  }
};
