const selectors = {
  link: 'link[href]',
  img: 'img[src]',
  script: 'script[src]',
};

export default tag => ($) => {
  const selector = selectors[tag];
  if (!selector) {
    throw new Error(`unkown selector: ${tag}`);
  }
  return $(selector).map((i, e) => $(e)).get();
};
