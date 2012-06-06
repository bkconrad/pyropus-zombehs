function require (file) {
  console.log('including', file, 'in', require.path);
  var oldPath = require.path;

  // ignore trailing .js
  file = file.split('.js')[0];

  var pathParts = file.split('/');
  var filename = pathParts.pop();

  console.log(pathParts);

  // trim leading './' or '/'
  if (pathParts[0] == '' || pathParts[0] == '.') {
    pathParts.splice(0,1);
  }

  // the change in require.path from this 'require'
  var deltaPath = pathParts.length > 0 ? pathParts.join('/') + '/' : '';

  var fullPath = require.path + deltaPath + filename + '.js';

  if (fullPath in require.cache)
    return require.cache[fullPath];

  // build new path by adding directories in the filename given
  require.path = require.path + deltaPath;

  console.log(fullPath);
  var xhr = new XMLHttpRequest ();
  xhr.open('GET', fullPath, false);
  xhr.send();

  var prologue = 'var exports = {}; var module = { exports: exports };';
  var epilogue = 'return module';
  var lambda = new Function ('require', prologue + xhr.response + epilogue);

  var exports = lambda(require).exports;

  require.cache[fullPath] = exports;
  require.path = oldPath;
  return exports;
};

require.cache = {};
require.path = '/';
