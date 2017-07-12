# feathers-pouchdb

[![Build Status](https://travis-ci.org/endyjasmi/feathers-pouchdb.png?branch=master)](https://travis-ci.org/endyjasmi/feathers-pouchdb)
[![Code Climate](https://codeclimate.com/github/endyjasmi/feathers-pouchdb/badges/gpa.svg)](https://codeclimate.com/github/endyjasmi/feathers-pouchdb)
[![Test Coverage](https://codeclimate.com/github/endyjasmi/feathers-pouchdb/badges/coverage.svg)](https://codeclimate.com/github/endyjasmi/feathers-pouchdb/coverage)
[![Dependency Status](https://img.shields.io/david/endyjasmi/feathers-pouchdb.svg?style=flat-square)](https://david-dm.org/endyjasmi/feathers-pouchdb)
[![Download Status](https://img.shields.io/npm/dm/feathers-pouchdb.svg?style=flat-square)](https://www.npmjs.com/package/feathers-pouchdb)

> PouchDB feathers service.&#39;

## Installation

```
npm install feathers-pouchdb --save
```

## Documentation

Please refer to the [feathers-pouchdb documentation](http://docs.feathersjs.com/) for more details.

## Complete Example

Here's an example of a Feathers server that uses `feathers-pouchdb`. 

```js
const feathers = require('feathers');
const rest = require('feathers-rest');
const hooks = require('feathers-hooks');
const bodyParser = require('body-parser');
const errorHandler = require('feathers-errors/handler');
const plugin = require('feathers-pouchdb');

// Initialize the application
const app = feathers()
  .configure(rest())
  .configure(hooks())
  // Needed for parsing bodies (login)
  .use(bodyParser.json())
  .use(bodyParser.urlencoded({ extended: true }))
  // Initialize your feathers plugin
  .use('/plugin', plugin())
  .use(errorHandler());

app.listen(3030);

console.log('Feathers app started on 127.0.0.1:3030');
```

## License

Copyright (c) 2016

Licensed under the [MIT license](LICENSE).
