import axios from 'axios';

export default (url, dir = `${__dirname}`) => {
  console.log(url, dir);

  axios.get(url)
    .then(response => console.log(response.data))
    .catch(error => console.log(error));
};
