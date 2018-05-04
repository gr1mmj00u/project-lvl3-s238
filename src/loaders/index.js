import renderAst from './ast';
import renderPlain from './plain';
import renderJson from './json';

const renders = {
  ast: renderAst,
  plain: renderPlain,
  json: renderJson,
};

export default format => (data) => {
  const render = renders[format];
  if (!render) {
    throw new Error(`unkown render format: ${format}`);
  }
  return render(data);
};
