install:
	npm install
publish:
	npm publish
lint:
	npm run eslint .
pl:
	node dist/bin/page-loader.js
page-loader:
	npm run babel-node -- src/bin/page-loader.js
build:
	npm run build
test:
	npm test
