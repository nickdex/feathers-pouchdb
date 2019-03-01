'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.default = init;

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _uberproto = require('uberproto');

var _uberproto2 = _interopRequireDefault(_uberproto);

var _crypto = require('crypto');

var _crypto2 = _interopRequireDefault(_crypto);

var _errors = require('@feathersjs/errors');

var _errors2 = _interopRequireDefault(_errors);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _utilities = require('./utilities');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var debug = (0, _debug2.default)('feathers-pouchdb');

var Service = function () {
  function Service(options) {
    _classCallCheck(this, Service);

    if (_lodash2.default.isUndefined(options) || _lodash2.default.isUndefined(options.Model)) {
      throw new Error('PouchDB datastore `Model` needs to be provided');
    }
    this.Model = options.Model;
    this.events = options.events || [];
    this.id = options.id || '_id';
    this.paginate = options.paginate || {};
    this.query = options.query || _defineProperty({}, this.id, { $gte: null });
  }

  _createClass(Service, [{
    key: 'extend',
    value: function extend(object) {
      return _uberproto2.default.extend(object, this);
    }
  }, {
    key: '_find',
    value: function _find(params) {
      params.query = _lodash2.default.isObject(params.query) && !_lodash2.default.isEmpty(params.query) ? params.query : this.query;

      if (_lodash2.default.isArray(params.query.$select) && _lodash2.default.indexOf(params.query.$select, this.id) < 0) {
        params.query.$select.push(this.id);
      }

      return this.Model.find((0, _utilities.convertQuery)(params.query)).then(function (response) {
        return response.docs;
      });
    }
  }, {
    key: 'find',
    value: function find(params) {
      if (!_lodash2.default.isEmpty(this.paginate)) {
        params.paginate = params.paginate || this.paginate;
        if (params.paginate.default) {
          params.query.$limit = (0, _utilities.computeLimit)(params.query.$limit, params.paginate);
          params.query.$skip = parseInt(params.query.$skip) || 0;
        }
      }
      return this._find(params).then(function (records) {
        if (_lodash2.default.isUndefined(params.paginate)) {
          return records;
        }
        return {
          total: records.length,
          limit: params.query.$limit,
          skip: params.query.$skip,
          data: records
        };
      });
    }
  }, {
    key: 'get',
    value: function get(id, params) {
      params.query = _lodash2.default.isObject(params.query) && !_lodash2.default.isEmpty(params.query) ? _lodash2.default.pick(params.query, ['$select', '$index']) : {};

      params.query[this.id] = id;
      params.query.$limit = 1;

      return this._find(params).then(function (records) {
        if (records.length < 1) {
          throw new _errors2.default.NotFound('No record found for id \'' + id + '\'');
        }
        return records[0];
      });
    }
  }, {
    key: 'create',
    value: function create(data, params) {
      var _this = this;

      data = _lodash2.default.cloneDeep(_lodash2.default.isArray(data) ? data : [data]);

      if (_lodash2.default.isNil(data[this.id])) {
        data = data.map(function (item) {
          var time = new Date().getTime().toString(16);
          var random = _crypto2.default.randomBytes(8).toString('hex');
          return _lodash2.default.assign(_defineProperty({}, _this.id, time + random), item);
        });
      }

      return this.Model.bulkDocs(data).then(function (responses) {
        return _lodash2.default.map(responses, function (response, index) {
          if (!response.ok) {
            throw new _errors2.default.BadRequest(response.message);
          }
          return _lodash2.default.assign(data[index], (0, _utilities.extractMetadata)(response));
        });
      }).then(function (records) {
        if (records.length === 1) {
          return records[0];
        }
        return records;
      }).then(select(params, this.id));
    }
  }, {
    key: 'update',
    value: function update(id, data, params) {
      var _this2 = this;

      params.query = _lodash2.default.isObject(params.query) && !_lodash2.default.isEmpty(params.query) ? params.query : this.query;

      var findParams = _lodash2.default.cloneDeep(params);
      findParams.query = _lodash2.default.omit(findParams.query, ['$select', '$sort', '$skip', '$limit']);

      if (id) {
        findParams.query = _lodash2.default.assign(_defineProperty({}, this.id, id), _lodash2.default.pick(findParams.query, ['$index']));
      }

      return this._find(findParams).then(function (records) {
        var operations = _lodash2.default.map(records, function (record) {
          return _lodash2.default.assign(_lodash2.default.clone(data), _lodash2.default.pick(record, ['_id', '_rev']));
        });
        return Promise.all([operations, _this2.Model.bulkDocs(operations)]);
      }).then(function (result) {
        var operations = result[0];
        var responses = result[1];
        return _lodash2.default.map(responses, function (response, index) {
          if (!response.ok) {
            throw new _errors2.default.Conflict(response.message);
          }
          return _lodash2.default.assign(operations[index], (0, _utilities.extractMetadata)(response));
        });
      }).then(function (records) {
        if (records.length < 1) {
          throw new _errors2.default.NotFound('No record found for id \'' + id + '\'');
        }
        if (records.length === 1) {
          return records[0];
        }
        return records;
      }).then(select(params, this.id));
    }
  }, {
    key: 'patch',
    value: function patch(id, data, params) {
      var _this3 = this;

      params.query = _lodash2.default.isObject(params.query) && !_lodash2.default.isEmpty(params.query) ? params.query : this.query;

      var findParams = _lodash2.default.cloneDeep(params);
      findParams.query = _lodash2.default.omit(findParams.query, ['$select', '$sort', '$skip', '$limit']);

      if (id) {
        findParams.query = _lodash2.default.assign(_defineProperty({}, this.id, id), _lodash2.default.pick(findParams.query, ['$index']));
      }

      return this._find(findParams).then(function (records) {
        var operations = _lodash2.default.map(records, function (record) {
          return _lodash2.default.assign(record, data, _lodash2.default.pick(record, ['_id', '_rev']));
        });
        return Promise.all([operations, _this3.Model.bulkDocs(operations)]);
      }).then(function (result) {
        var operations = result[0];
        var responses = result[1];
        return _lodash2.default.map(responses, function (response, index) {
          if (!response.ok) {
            throw new _errors2.default.Conflict(response.message);
          }
          return _lodash2.default.assign(operations[index], (0, _utilities.extractMetadata)(response));
        });
      }).then(function (records) {
        if (records.length < 1) {
          throw new _errors2.default.NotFound('No record found for id \'' + id + '\'');
        }
        if (records.length === 1) {
          return records[0];
        }
        return records;
      }).then(select(params, this.id));
    }
  }, {
    key: 'remove',
    value: function remove(id, params) {
      var _this4 = this;

      params.query = _lodash2.default.isObject(params.query) && !_lodash2.default.isEmpty(params.query) ? params.query : this.query;

      var findParams = _lodash2.default.cloneDeep(params);
      findParams.query = _lodash2.default.omit(findParams.query, ['$select', '$sort', '$skip', '$limit']);

      if (id) {
        findParams.query = _lodash2.default.assign(_defineProperty({}, this.id, id), _lodash2.default.pick(findParams.query, ['$index']));
      }

      return this._find(findParams).then(function (records) {
        var operations = _lodash2.default.map(records, function (record) {
          return _lodash2.default.assign(record, { _deleted: true });
        });
        return Promise.all([operations, _this4.Model.bulkDocs(operations)]);
      }).then(function (result) {
        var operations = result[0];
        var responses = result[1];
        return _lodash2.default.map(responses, function (response, index) {
          if (!response.ok) {
            throw new _errors2.default.Conflict(response.message);
          }
          return _lodash2.default.assign(operations[index], (0, _utilities.extractMetadata)(response));
        });
      }).then(function (records) {
        if (records.length < 1) {
          throw new _errors2.default.NotFound('No record found for id \'' + id + '\'');
        }
        if (records.length === 1) {
          return records[0];
        }
        return records;
      }).then(select(params, this.id));
    }
  }]);

  return Service;
}();

function init(options) {
  debug('Initializing feathers-pouchdb plugin');
  return new Service(options);
}

init.Service = Service;
module.exports = exports['default'];