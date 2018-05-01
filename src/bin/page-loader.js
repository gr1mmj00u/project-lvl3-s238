#!/usr/bin/env node
import commander from 'commander';
import pageLoader from '..';

commander
  .version('1.0.1')
  .arguments('<firstConfig> <secondConfig>')
  .description('Compares two configuration files and shows a difference.')
  .option('-o, --output', 'output format')
  .action((dir, url, options) => {
    if (typeof dir === 'undefined') {
      console.error('no firstConfig given!');
      process.exit(1);
    }
    if (typeof url === 'undefined') {
      console.error('no secondConfig given!');
      process.exit(1);
    }

    // console.log([dir, url, options.output]);

    console.log(pageLoader());
    const result = pageLoader(url, dir, options.output);
    console.log(result);
    // const fullPathFirstConfig = path.resolve(process.cwd(), firstConfig);
    // const fullPathSecondConfig = path.resolve(process.cwd(), secondConfig);

    // const diff = gendiff(fullPathFirstConfig, fullPatSecondConfig, options.format);
    // console.log(diff);
  });

commander.parse(process.argv);
