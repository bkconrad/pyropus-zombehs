var Zombies = (function () {
    // shared
  var io
    , physics

    // client
    , renderer
    , canvas
    , context
    , socket

    // server
  ;

  function initShared (_io, _physics) {
    physics = _physics;
    io = _io;
  }

  function initClient (_canvas, _io, _physics, _renderer) {
    initShared(_io, _physics);
    canvas = _canvas;
    context = canvas.getContext('2d');
    renderer = _renderer;
    Renderer.init(context, physics);

    clientConnect();

    physics.create({
      x: Math.random(),
      y: Math.random(),
      xvel: Math.random(),
      yvel: Math.random()
    });

    setInterval(loop, 100);
  }

  function initServer (_io, _physics) {
    initShared(_io, _physics);
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

  function loop () {
    physics.update(100);
    renderer.render();
  }

  return {
    initClient: initClient,
    initServer: initServer
  };
})();

try {
  module.exports = Zombies;
} catch (e) { }
