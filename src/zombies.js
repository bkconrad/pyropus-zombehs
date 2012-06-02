var Zombies = (function () {

  function Event (type, frame, data) {
    this.type = type;
    this.frame = frame || frameCount + 2;
    this.data = data || null;
    this.from = null;
  }

  /**
   * submit event to server
   */
  Event.prototype.submit = function () {
    socket.emit('command', this);
    return this;
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
    return this;
  };

  /**
   * send event to all players
   */
  Event.prototype.broadcast = function () {
    io.sockets.emit('command', this);
    return this;
  };

  /**
   * send event to a particular socket
   */
  Event.prototype.send = function (socket) {
    socket.emit('command', this);
    return this;
  };

  Event.prototype.add = function () {
    eventQueue.push(this);
    return this;
  }

  function Player (data) {
    var i;
    data = data || {};
    if (data.id >= 0) {
      this.id = data.id;
    } else {
      for (i = 0; i < players.length; i++) {
        if (players[i] == undefined)
          break;
      }
      this.id = i;
    }

    this.name = data.name || "player" + new Date().getTime();

    if (data.ent) {
      this.ent = physics.create(data.ent);
    } else {
      this.ent = physics.create({
        x: Math.random() * 200,
        y: Math.random() * 200,
        xvel: (Math.random() - .5) * 10,
        yvel: (Math.random() - .5) * 10,
        width: Math.random() * 20,
        height: Math.random() * 20,
        static: Math.random() > .5
      });
    }
  }

  Player.prototype.add = function () {
    players[this.id] = this;
  };

  Player.prototype.drop = function () {
    var i;
    physics.drop(this.ent);
    players[this.id] = undefined;
  };

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
      , i
      , player
      ;

    socket.emit('time', { frame: frameCount });

    for (i = 0; i < players.length; i++) {
      if (players[i])
        new Event('join', false, players[i]).send(socket);
    }

    player = new Player();

    socket.pid = player.id;

    ev = new Event('join', false, player);
    ev.broadcast();
    ev.add();

    socket.on('command', function () {
      // TODO: something
    });

    socket.on('disconnect', function () {
      new Event('part', false, { id: socket.pid }).add().broadcast();
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
      new Event(data.type, data.frame, data.data).add();
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
        new Player (ev.data).add();
      break;

      case 'part':
        players[ev.data.id].drop();
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
