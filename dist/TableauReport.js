'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _propTypes = require('prop-types');

var _propTypes2 = _interopRequireDefault(_propTypes);

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _es6Promise = require('es6-promise');

var _shallowequal = require('shallowequal');

var _shallowequal2 = _interopRequireDefault(_shallowequal);

var _tokenizeUrl = require('./tokenizeUrl');

var _tokenizeUrl2 = _interopRequireDefault(_tokenizeUrl);

require('./tableau-2.7.0');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var propTypes = {
  filters: _propTypes2.default.object,
  url: _propTypes2.default.string.isRequired,
  parameters: _propTypes2.default.object,
  options: _propTypes2.default.object,
  token: _propTypes2.default.string,
  onLoad: _propTypes2.default.func,
  query: _propTypes2.default.string,
  verbose: _propTypes2.default.bool
};

var defaultProps = {
  loading: false,
  verbose: false,
  parameters: {},
  filters: {},
  options: {},
  query: '?:embed=yes&:comments=no&:toolbar=yes&:refresh=yes'
};

var TableauReport = function (_React$Component) {
  _inherits(TableauReport, _React$Component);

  function TableauReport(props) {
    _classCallCheck(this, TableauReport);

    var _this = _possibleConstructorReturn(this, (TableauReport.__proto__ || Object.getPrototypeOf(TableauReport)).call(this, props));

    _this.state = {
      filters: props.filters,
      parameters: props.parameters
    };
    return _this;
  }

  _createClass(TableauReport, [{
    key: 'componentDidMount',
    value: function componentDidMount() {
      this.initTableau();
    }
  }, {
    key: 'logInfo',
    value: function logInfo(message, obj) {
      if (!this.props.verbose) return;

      console.log(message, obj);
    }
  }, {
    key: 'UNSAFE_componentWillReceiveProps',
    value: function UNSAFE_componentWillReceiveProps(nextProps) {
      var isReportChanged = nextProps.url !== this.props.url;
      var isFiltersChanged = !(0, _shallowequal2.default)(this.props.filters, nextProps.filters, this.compareArrays);
      var isParametersChanged = !(0, _shallowequal2.default)(this.props.parameters, nextProps.parameters);
      var isLoading = this.state.loading;

      // Only report is changed - re-initialize
      if (isReportChanged) {
        this.initTableau(nextProps.url);
      }

      // Only filters are changed, apply via the API
      if (!isReportChanged && isFiltersChanged && !isLoading && this.sheet) {
        this.applyFilters(nextProps.filters);
      }

      // Only parameters are changed, apply via the API
      if (!isReportChanged && isParametersChanged && !isLoading && this.sheet) {
        this.applyParameters(nextProps.parameters);
      }

      // token change, validate it.
      if (nextProps.token !== this.props.token) {
        this.setState({ didInvalidateToken: false });
      }
    }

    /**
     * Compares the values of filters to see if they are the same.
     * @param  {Array<Number>} a
     * @param  {Array<Number>} b
     * @return {Boolean}
     */

  }, {
    key: 'compareArrays',
    value: function compareArrays(a, b) {
      if (Array.isArray(a) && Array.isArray(b)) {
        return a.sort().toString() === b.sort().toString();
      }

      return undefined;
    }

    /**
     * Execute a callback when an array of promises complete, regardless of
     * whether any throw an error.
     */

  }, {
    key: 'onComplete',
    value: function onComplete(promises, cb) {
      _es6Promise.Promise.all(promises).then(function () {
        return cb();
      }, function () {
        return cb();
      });
    }

    /**
     * Returns a vizUrl, tokenizing it if a token is passed and immediately
     * invalidating it to prevent it from being used more than once.
     */

  }, {
    key: 'getUrl',
    value: function getUrl(nextUrl) {
      var newUrl = nextUrl || this.props.url;
      var _props = this.props,
          token = _props.token,
          query = _props.query;

      var parsed = _url2.default.parse(newUrl, true);

      if (!this.state.didInvalidateToken && token) {
        this.invalidateToken();
        return (0, _tokenizeUrl2.default)(newUrl, token) + query;
      }

      return parsed.protocol + '//' + parsed.host + parsed.pathname + query;
    }
  }, {
    key: 'invalidateToken',
    value: function invalidateToken() {
      this.setState({ didInvalidateToken: true });
    }

    /**
     * Asynchronously applies filters to the worksheet, excluding those that have
     * already been applied, which is determined by checking against state.
     * @param  {Object} filters
     * @param  {Boolean} force
     * @return {void}
     */

  }, {
    key: 'applyFilters',
    value: function applyFilters(filters) {
      var _this2 = this;

      var force = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

      var REPLACE = window.tableau.FilterUpdateType.REPLACE;
      var promises = [];

      this.setState({ loading: true });

      if (!this.sheet) {
        this.logInfo('this.sheet not initialized!');
        return;
      }

      try {
        for (var key in filters) {
          var shouldClearFilter = (!filters[key] || !filters[key].length) && this.state.filters.hasOwnProperty(key) && this.state.filters[key].length;

          if (shouldClearFilter) {
            this.logInfo('Clearing out filter', { filterKey: key, value: filters[key] });
            promises.push(this.sheet.clearFilterAsync(key));
          } else if (filters[key].length && (force || !this.state.filters.hasOwnProperty(key) || !this.compareArrays(this.state.filters[key], filters[key]))) {
            this.logInfo('Applying filter', { filterKey: key, value: filters[key] });
            promises.push(this.sheet.applyFilterAsync(key, filters[key], REPLACE));
          } else {
            this.logInfo('Ignoring filter', { filterKey: key, value: filters[key] });
          }
        }

        this.onComplete(promises, function () {
          _this2.setState({ loading: false, filters: filters });
        });
      } catch (e) {
        this.logInfo('error applying filters', e);
        this.onComplete(promises, function () {
          _this2.setState({ loading: false });
        });
      }
    }
  }, {
    key: 'applyParameters',
    value: function applyParameters(parameters) {
      var _this3 = this;

      var promises = [];

      try {
        for (var key in parameters) {
          if (!this.state.parameters.hasOwnProperty(key) || this.state.parameters[key] !== parameters[key]) {
            var val = parameters[key];
            // Ensure that parameters are applied only when we have a workbook
            if (this.workbook && this.workbook.changeParameterValueAsync) {
              promises.push(this.workbook.changeParameterValueAsync(key, val));
            }
          }
        }

        this.onComplete(promises, function () {
          return _this3.setState({ loading: false, parameters: parameters });
        });
      } catch (e) {
        this.logInfo('error applying parameters', e);
        this.onComplete(promises, function () {
          return _this3.setState({ loading: false });
        });
      }
    }

    /**
     * Initialize the viz via the Tableau JS API.
     * @return {void}
     */

  }, {
    key: 'initTableau',
    value: function initTableau(nextUrl) {
      var _this4 = this;

      try {
        var _props2 = this.props,
            filters = _props2.filters,
            parameters = _props2.parameters;

        var vizUrl = this.getUrl(nextUrl);

        var options = _extends({}, filters, parameters, this.props.options, {
          onFirstInteractive: function onFirstInteractive() {
            _this4.workbook = _this4.viz.getWorkbook();
            _this4.sheet = _this4.workbook.getActiveSheet();

            // If child sheets exist, choose them.
            var hasChildSheets = typeof _this4.sheet.getWorksheets !== 'undefined';
            if (hasChildSheets) {
              var childSheets = _this4.sheet.getWorksheets();

              if (childSheets && childSheets.length) {
                _this4.sheet = childSheets[0];
              }
            }

            _this4.props.onLoad && _this4.props.onLoad(new Date());

            // Apply the filters with values when the sheet is loaded
            var validFilters = Object.fromEntries(Object.entries(filters).filter(function (_ref) {
              var _ref2 = _slicedToArray(_ref, 2),
                  _ = _ref2[0],
                  v = _ref2[1];

              return !!v.length;
            }));
            validFilters && _this4.applyFilters(validFilters, true);
          }
        });

        // cleanup
        if (this.viz) {
          this.viz.dispose();
          this.viz = null;
        }

        this.logInfo('Instantiating Tableau.Viz', { vizUrl: vizUrl, options: options });
        this.viz = new window.tableau.Viz(this.container, vizUrl, options);
      } catch (e) {
        this.logInfo('Error Initializing Tableau', e);
      }
    }
  }, {
    key: 'render',
    value: function render() {
      var _this5 = this;

      return _react2.default.createElement('div', { ref: function ref(c) {
          return _this5.container = c;
        } });
    }
  }]);

  return TableauReport;
}(_react2.default.Component);

TableauReport.propTypes = propTypes;
TableauReport.defaultProps = defaultProps;

exports.default = TableauReport;
module.exports = exports['default'];