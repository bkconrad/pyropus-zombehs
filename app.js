var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')

app.listen(1234);

function handler (req, res) {

  var url
    , extension
    , folder = "/public";

  url = req.url.split("?")[0]; 
  extension = url.split(".")[1]; 

  if (url == "/")
    url = "/index.html";

  if (extension == "js")
    folder = "/src";

  fs.readFile(__dirname + folder + url,
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading ' + url);
    }

    res.writeHead(200);
    res.end(data);
  });
}

io.sockets.on('connection', function (socket) {
  socket.emit('news', { hello: 'world' });
  socket.on('my other event', function (data) {
    console.log(data);
  });
});
