var Zombies = (function () {

  function Event (type, frame) {
    this.type = type;
    this.frame = frame || frameCount;
    this.from = null;
    this.data = null;
  }

  /**
   * submit event to server
   */
  Event.prototype.submit = function () {
    socket.emit('command', this);
  };

  /**
   * send event to all players except originator
   */
  Event.prototype.relay = function () {
    var s;
    for (s = 0; i < io.sockets.length; i++) {
      if (this.from != io.sockets[s].player.id)
        io.sockets[s].emit('command', this);
    }
  };

  /**
   * send event to all players
   */
  Event.prototype.broadcast = function () {
    io.sockets.emit('command', this);
  };

  /**
   * send event to a particular socket
   */
  Event.prototype.send = function (socket) {
    socket.emit('command', this);
  };

  function Player (data) {
    data = data || {};
    this.id = data.id || Player.id++
    this.name = data.name || "player" + new Date().getTime();
    this.ent = physics.create({
      x: Math.random() * 200,
      y: Math.random() * 200,
      xvel: (Math.random() - .5) * 10,
      yvel: (Math.random() - .5) * 10,
      width: Math.random() * 20,
      height: Math.random() * 20,
      static: Math.random() > .5
    });

    players.push(this);
  }

  Player.id = 1;

    // shared
  var io
    , physics
    , frameCount
    , isServer
    , interval = 1000/50
    , startTime
    , players
    , eventQueue

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
    frameCount = 1;
    startTime = new Date().getTime();
    players = [];
    eventQueue = [];
  }

  function initClient (_canvas, _io, _physics, _renderer) {
    initShared(_io, _physics);
    isServer = false;
    canvas = _canvas;
    context = canvas.getContext('2d');
    renderer = _renderer;
    Renderer.init(context, physics);

    clientConnect();

    setInterval(loop, interval);
  }

  function initServer (_io, _physics) {
    initShared(_io, _physics);
    isServer = true;
    io.sockets.on('connection', serverHandler);

    io.configure(function () {
      io.set('authorization', authHandler);
    });

    setInterval(loop, interval);
  }

  function authHandler (handshakeData, callback) {
    callback(null, true);
  }

  function serverHandler (socket) {

    var ev
      , i;

    socket.emit('time', { frame: frameCount });

    for (i in players) {
      new Event('join', frameCount + 10).send(socket);
    }

    ev = new Event('join', frameCount + 10);
    ev.broadcast();
    eventQueue.push(ev);

    socket.on('command', function () {
      // TODO: something
    });

  }

  function setClientHandlers () {
    if(!socket)
      throw Error("Not connected");

    socket.on('time', function (data) {
      frameCount = data.frame;
      startTime = new Date().getTime() - interval * frameCount;
    });

    socket.on('error', function () {
      console.log('An error has occured');
    });

    socket.on('command', function (data) {
      console.log(data);
      console.log(frameCount);
      eventQueue.push(data);
      console.log(eventQueue);
    });

    socket.on('connect', function () {
    });
  }

  function clientConnect () {
    socket = io.connect(document.origin);
    setClientHandlers();
  }

  function loop () {
    var now = new Date().getTime();

    while (now > startTime + interval * frameCount) {
      checkEvents();
      physics.update(interval);
      frameCount++;
    }

    if (!isServer)
      renderer.render();
  }

  function checkEvents () {
    var i;
    for (i = 0; i < eventQueue.length; i++) {

      if (eventQueue[i].frame > frameCount) {
        // wait for the event to mature
        continue;
      }

      if (eventQueue[i].frame == frameCount) {
        handleEvent(eventQueue[i]);
      }

      if (eventQueue[i].frame < frameCount) {
        // old event, discard for now
      }

      // splice and decrement index
      eventQueue.splice(i, 1);
      i--;
    }
  }

  function handleEvent (ev) {
    switch (ev.type) {
      case 'join':
          new Player (ev.data);
        break;

      default:
        throw Error ("Unhandled event " + ev.type);
    }
  }

  return {
    initClient: initClient,
    initServer: initServer,
    eventQueue: eventQueue
  };
})();

try {
  module.exports = Zombies;
} catch (e) { }
