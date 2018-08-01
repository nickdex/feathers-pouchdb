'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.computeLimit = computeLimit;
exports.convertQuery = convertQuery;
exports.convertSort = convertSort;
exports.extractMetadata = extractMetadata;

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function computeLimit(limit, paginate) {
  var lower = !_lodash2.default.isUndefined(limit) ? parseInt(limit) : paginate.default;
  var upper = _lodash2.default.isNumber(paginate.max) ? paginate.max : Number.MAX_VALUE;
  return Math.min(lower, upper);
}

function convertQuery(feathersQuery) {
  var mangoQuery = {
    selector: {}
  };
  for (var queryField in feathersQuery) {
    switch (queryField) {
      case '$select':
        mangoQuery.fields = feathersQuery[queryField];
        break;

      case '$index':
        mangoQuery.use_index = feathersQuery[queryField];
        break;

      case '$sort':
        mangoQuery.sort = convertSort(feathersQuery[queryField]);
        break;

      case '$skip':
        mangoQuery.skip = parseInt(feathersQuery[queryField]);
        break;

      case '$limit':
        mangoQuery.limit = parseInt(feathersQuery[queryField]);
        break;

      default:
        mangoQuery.selector[queryField] = feathersQuery[queryField];
        break;
    }
  }
  return mangoQuery;
}

function convertSort(feathersSort) {
  var mangoSort = [];
  for (var sortField in feathersSort) {
    if (feathersSort[sortField] < 0) {
      mangoSort.push(_defineProperty({}, sortField, 'desc'));
      continue;
    }
    if (feathersSort[sortField] > 0) {
      mangoSort.push(_defineProperty({}, sortField, 'asc'));
      continue;
    }
  }
  return mangoSort;
}

function extractMetadata(pouchdbResponse) {
  var metadata = _lodash2.default.pick(pouchdbResponse, ['id', 'rev']);
  return _lodash2.default.mapKeys(metadata, function (value, key) {
    return '_' + key;
  });
}