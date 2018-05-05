#!/usr/bin/env node
import commander from 'commander';
import pageLoader from '..';

commander
  .version('1.0.2')
  .description('Compares two configuration files and shows a difference.')
  .option('-o, --output [dir]', 'output dir', process.cwd())
  .arguments('<url>')
  .action((url, options) => {
    if (typeof url === 'undefined') {
      console.error('no url parameter!');
      process.exit(1);
    }
    pageLoader(url, options.output);
  });
commander.parse(process.argv);
