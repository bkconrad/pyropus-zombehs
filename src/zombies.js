var Zombies = {
  // shared
  io: undefined,

  // client
  canvas: undefined,
  context: undefined,
  socket: undefined,

  // server

  initShared: function () {
  },

  initClient: function (canvas, io) {
    this.io = io;
    this.canvas = canvas;
    this.context = this.canvas.getContext('2d');
    this.context.fillText("Hello!", 20, 20);

    this.clientConnect();
  },

  initServer: function (io) {
    this.io = io;
    this.io.sockets.on('connection', this.serverHandler);
  },

  serverHandler: function (socket) {
    socket.emit('news', { hello: 'world' });
    socket.on('my other event', function (data) {
      console.log(data);
    });
  },

  clientHandlers: function () {
  },

  clientConnect: function () {
    this.socket = io.connect(document.origin);
  }
};

try {
  module.exports = Zombies;
} catch (e) { }
