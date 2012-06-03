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
   * send event to all sockets except the one passed
   */
  Event.prototype.relay = function (socket) {
    var i;
    socket.broadcast.emit('command', this);
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
    this.socket = data.socket || null;

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

  /**
   * reserve a spot for this player without adding him to the player list
   */
  Player.prototype.reserve = function () {
    players[this.id] = true;
  }

  Player.prototype.add = function () {
    players[this.id] = this;
    this.sprite = renderer.add(this.ent);
  };

  Player.prototype.serialize = function () {
    return {
      id: this.id,
      ent: this.ent,
      sprite: this.sprite,
      name: this.name
    };
  };

  Player.prototype.drop = function () {
    var i;
    physics.drop(this.ent);
    renderer.drop(this.sprite);
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
    , me_
    , lastDigest
    , serverDigest
    , lastFrame

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
    lastFrame = 0;

    clientConnect();

    setInterval(loop, interval);

    // digest testing
    /*
    setInterval(function () {
      socket.emit('digest');
      lastDigest = null;
      serverDigest = null;
    }, 5000);
    */
  }

  function me (player) {
    if (player) {
      me_ = player;
    }
    
    return me_;
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

    // synchronize watches
    socket.emit('time', { frame: frameCount });

    // send player list to new player
    for (i = 0; i < players.length; i++) {
      if (players[i])
        new Event('join', false, players[i].serialize()).send(socket);
    }

    player = new Player();
    player.reserve();

    socket.pid = player.id;

    // relay the join message to all players but the new one
    ev = new Event('join', false, player.serialize());
    ev.relay(socket);

    // tell new player who he is
    ev.data.identity = true;
    ev.send(socket);

    ev.data.socket = socket;
    ev.add();

    socket.on('command', function () {
      // TODO: something
    });

    socket.on('digest', function (data) {
      var targetFrame = frameCount + (200 - (frameCount % 100));
      var ev = new Event('digest', targetFrame);
      ev.from = socket.pid;
      ev.add().send(socket);
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

    socket.on('digest check', function (data) {
      serverDigest = data;
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

    if (!isServer) {
      now = new Date().getTime();
      renderer.render(now - lastFrame);
      lastFrame = now;
    }
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

        if (ev.data.identity) {
          me(players[ev.data.id]);
          console.log("found myself", me());
        }

      break;

      case 'part':
        players[ev.data.id].drop();
      break;

      case 'digest':
        if (isServer) {
          if (players[ev.from].socket)
            players[ev.from].socket.emit('digest check', {
              digest: physics.digest(),
              frame: frameCount
            });
          else
            console.log(players[ev.from]);
        } else {
          lastDigest = {
              digest: physics.digest(),
              frame: frameCount
          };

          if (serverDigest)
            console.log('check', lastDigest, serverDigest);
        }
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
