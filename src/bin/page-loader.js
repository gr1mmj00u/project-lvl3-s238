#!/usr/bin/env node
import commander from 'commander';
import pageLoader from '..';

commander
  .version('1.0.2')
  .arguments('<dir> <url>')
  .description('Compares two configuration files and shows a difference.')
  .option('-o, --output', 'output format')
  .action((dir, url, options) => {
    if (typeof dir === 'undefined') {
      console.error('no dir parameter!');
      process.exit(1);
    }
    if (typeof url === 'undefined') {
      console.error('no url parameter!');
      process.exit(1);
    }
    if (options.output) {
      pageLoader(url, dir);
    } else {
      pageLoader(url);
    }
  });

commander.parse(process.argv);
