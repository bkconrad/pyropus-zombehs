var Zombies = (function () {
  var KeyMap = {
    65: 'left',
    68: 'right',
    74: 'jump',
    82: 'restore'
  };

  var keyStates = [];

  var Dir = {
    UP: 1,
    DOWN: 2,
    LEFT: 3,
    RIGHT: 4
  };

  function Event (type, frame, data) {
    this.type = type;
    this.frame = frame || frameCount + 2;
    this.data = data || null;
    this.from = me_ != undefined ? me_.id : undefined;
    this.handled = false;
    this.once = false;
  }

  /**
   * submit event to server
   */
  Event.prototype.submit = function () {
    this.add();
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
    this.speed = 100;

    if (data.ent) {
      this.ent = physics.create(data.ent);
    } else {
      this.ent = physics.create({
        x: Math.random() * 200,
        y: Math.random() * 200,
        width: 32,
        height: 32,
        static: false
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

    if (!isServer)
      this.sprite = renderer.add(this.ent);
  };

  Player.prototype.serialize = function () {
    return {
      id: this.id,
      ent: this.ent.serialize(),
      name: this.name
    };
  };

  Player.prototype.drop = function () {
    var i;
    physics.drop(this.ent);
    if (!isServer)
      renderer.drop(this.sprite);
    players[this.id] = undefined;
  };

  /**
   * Update player state from serialized data
   */
  Player.prototype.update = function (data) {
      this.id = data.id;
      this.ent.modify(data.ent);
      this.sprite = data.sprite || this.sprite;
      this.name = data.name;
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
    , savedState
    , candidateState
    , maxAge = 2000
    , minAge = 1000

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
    candidateState = savedState = serializeState();
  }

  function initClient (_canvas, _io, _physics, _renderer) {
    initShared(_io, _physics);
    canvas = _canvas;
    context = canvas.getContext('2d');
    renderer = _renderer;
    Renderer.init(context, physics);

    isServer = false;
    lastFrame = 0;

    clientConnect();

    setInterval(loop, interval);

    window.onkeydown = keyDown;
    window.onkeyup = keyUp;

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

    socket.on('command', function (data) {
      var ev = new Event(data.type, data.frame, data.data);
      ev.from = socket.pid;
      if (data.frame < frameCount - minAge) {
        console.log('too old event');
        return;
        // TODO: NACK these events
      }

      ev.relay(socket);
      ev.add();
      console.log('relaying', ev);
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
      var ev = new Event(data.type, data.frame, data.data);
      ev.from = data.from;
      ev.add();
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
      if (!checkEvents()) {
        continue;
      }

      physics.update(interval);

      if (frameCount > savedState.frame + maxAge) {
        savedState = candidateState;
        candidateState = undefined;
      }

      if (frameCount >= savedState.frame + maxAge - minAge) {
        candidateState = serializeState();
      }

      frameCount++;
    }

    if (!isServer) {
      handleKeys();
      renderer.center(me().ent); 
      now = new Date().getTime();
      renderer.render(now - lastFrame);
      lastFrame = now;
    }
  }

  function checkEvents () {
    var i, j;
    for (i = 0; i < eventQueue.length; i++) {

      // event we can no longer process
      if (eventQueue[i].frame < savedState.frame) {
        console.log('dropping', eventQueue[i], savedState);
        if (!eventQueue[i].handled)
          console.log('unhandled dead event!', eventQueue[i]);
        eventQueue.splice(i, 1);
        i--;
        continue;
      }

      if (eventQueue[i].handled || eventQueue[i].frame > frameCount) {
        continue;
      }

      if (eventQueue[i].frame == frameCount) {
        handleEvent(eventQueue[i]);
        eventQueue[i].handled = true;
        eventQueue[i].once = true;
      }

      // unhandled, old event. need to resimulate
      if (eventQueue[i].frame < frameCount) {
        console.log("resimulating", savedState, eventQueue);
        restoreState(savedState);

        for (j = 0; j < eventQueue.length; j++) {
          // TODO: off by one error?
          if (eventQueue[j].frame >= frameCount) {
            eventQueue[j].handled = false;
          } else {
            console.log("Too old event!", eventQueue[j]);
          }
        }

        console.log("resimulated", players, frameCount);
        return false;
      }

    }

    // made it through without resimulating
    return true;
  }

  function handleEvent (ev) {
    switch (ev.type) {
      case 'join':
        if (ev.once)
          break;

        new Player (ev.data).add();

        if (ev.data.identity) {
          me(players[ev.data.id]);
        }

      break;

      case 'move':
        if (!isServer)
          players[ev.from].sprite.play();

        switch (ev.data) {
          case Dir.LEFT:
            players[ev.from].ent.xvel = -players[ev.from].speed;
          break;
          case Dir.RIGHT:
            players[ev.from].ent.xvel = players[ev.from].speed;
          break;
        }
      break;

      case 'jump':
        if (players[ev.from].ent.supported) {
          players[ev.from].ent.yvel = -(2*players[ev.from].speed);
          players[ev.from].ent.supported = false;
        }
      break;

      case 'stop':
        players[ev.from].ent.xvel = 0;

        if (!isServer)
          players[ev.from].sprite.stop();
      break;

      case 'part':
        if (ev.once)
          break;
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

      case 'restore':
      break;

      default:
        throw Error ("Unhandled event " + ev.type);
    }
  }

  function keyDown (ev) {
    var command = KeyMap[ev.which];
    if (!ev.which in KeyMap) {
      return;
    }

    // only add a new press if it isn't there
    if (!(command in keyStates))
      keyStates[command] =  1;
  }

  function keyUp (ev) {
    var command = KeyMap[ev.which];
    if (!ev.which in KeyMap) {
      return;
    }

    keyStates[command] =  -1;
  }

  function handleKeys () {
    var i;
    for (i in keyStates) {
      // key down this frame
      if (keyStates[i] == 1) {
        switch (i) {
          case 'left':
            new Event('move', false, Dir.LEFT).submit();
          break;

          case 'right':
            new Event('move', false, Dir.RIGHT).submit();
          break;

          case 'jump':
            new Event('jump', false).submit();
          break;

          case 'restore':
            // force a resimulation
            new Event('restore', frameCount - 5).add();
          default:
          break;
        }

        keyStates[i] = 0;
      }

      // key up this frame
      if (keyStates[i] == -1) {
        switch (i) {
          case 'left':
          case 'right':
            new Event('stop', false).submit();
          break;

          default:
          break;
        }

        delete keyStates[i];
      }
    }
  }

  function serializeState() {
    var i
      , result = {};
      ;

    result.players = [];
    for (i = 0; i < players.length; i++) {
      if (typeof players[i] === "object")
        result.players.push(players[i].serialize());
      else
        console.log(typeof players[i]);
    }
    result.frame = frameCount;

    return result;
  }

  function restoreState(state) {
    var i;
    for (i = 0; i < state.players.length; i++) {
      players[state.players[i].id].update(state.players[i]);
    }

    frameCount = state.frame;
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
