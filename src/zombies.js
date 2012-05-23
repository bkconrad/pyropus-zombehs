var Zombies = (function () {
    // shared
  var io

    // client
    , canvas
    , context
    , socket

    // server
  ;

  function initShared () {
  }

  function initClient (_canvas, _io) {
    io = _io;
    canvas = _canvas;
    context = canvas.getContext('2d');

    clientConnect();
  }

  function initServer (_io) {
    io = _io;
    io.sockets.on('connection', serverHandler);
  }

  function serverHandler (socket) {
    socket.emit('news', { hello: 'world' });
    socket.on('my other event', function (data) {
      console.log(data);
    });
  }

  function setClientHandlers () {
    if(!socket)
      throw Error("Not connected");

    socket.on('news', function () {
      context.fillText("Hello!", 20, 20);
    });
  }

  function clientConnect () {
    socket = io.connect(document.origin);
    setClientHandlers();
  }

  return {
    initClient: initClient,
    initServer: initServer
  };
})();

try {
  module.exports = Zombies;
} catch (e) { }
