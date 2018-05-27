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
      console.error('No url parameter!');
      process.exit(1);
    }

    (async () => {
      try {
        await pageLoader(url, options.output);
        console.log('Successful page loading!');
      } catch (err) {
        console.error('Oops, something went wrong!');
        console.error(err.toString());
        process.exit(1);
      }
    })();
  });

commander.parse(process.argv);
