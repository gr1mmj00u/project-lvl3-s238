import axios from 'axios';
import fs from 'mz/fs';
import url from 'url';
import path from 'path';

export const generateFileName = (link) => {
  const { host, path: pathLink } = url.parse(link);

  const parseUrl = `${host}${pathLink}`;

  const fileName = parseUrl.match(/(\w*)/g)
    .filter(e => e)
    .join('-');

  return `${fileName}.html`;
};

export default (link, dir = `${__dirname}`) => {
  const fileName = generateFileName(link);

  return axios.get(link)
    .then(response => fs.appendFile(path.resolve(dir, fileName), response.data))
    .catch(error => error);
};
