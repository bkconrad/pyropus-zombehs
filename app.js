var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')
  , Zombies = require(__dirname + '/src/zombies')
  ;

app.listen(1234);

function handler (req, res) {

  var url
    , extension
    , baseFolder
    , jsFolders = { 'src': true, 'lib':true }
    , folder = "/public";

  // ignore query string
  url = req.url.split("?")[0]; 

  extension = url.split(".")[1]; 

  // default request
  if (url == "/")
    url = "/index.html";

  // assumes leading '/'
  baseFolder = req.url.split('/')[1];

  // see if request is in source folders
  if (extension == "js" && baseFolder in jsFolders) {
    folder = '';
  }

  fs.readFile(__dirname + folder + url,
  function (err, data) {
    if (err) {
      console.log(err);
      res.writeHead(500);
      return res.end('Error loading ' + url);
    }

    res.writeHead(200);
    res.end(data);
  });
}

Zombies.initServer(io);
