var Rpc = require('./rpc')
, Player = require('./player')
, SceneObject = require('./sceneobject')
, SimplePhysics = require('./simplephysics');

var Zombies = (function () {
  var KeyMap = {
    65: 'left',
    68: 'right',
    74: 'jump',
    82: 'restore',
    192: 'state'
  };

  var keyStates = [];

  var Dir = {
    UP: 1,
    DOWN: 2,
    LEFT: 3,
    RIGHT: 4
  };

  // shared
  var io
    , physics
    , frameCount
    , isServer
    , interval = 1000/50
    , startTime
    , players
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

  function initShared (_io) {
    physics = SimplePhysics;
    Player.init(physics);
    io = _io;
    frameCount = 1;
    startTime = new Date().getTime();
    players = [];
    candidateState = savedState = serializeState();
  }

  function initClient (_canvas, _io) {
    initShared(_io);
    canvas = _canvas;
    context = canvas.getContext('2d');
    renderer = Renderer;
    Renderer.init(context, physics);

    isServer = false;
    lastFrame = 0;

    clientConnect();

    setInterval(loop, interval);

    window.onkeydown = keyDown;
    window.onkeyup = keyUp;

    for (var i = 0; i < 10; i++) {
      new SceneObject(Math.floor(Math.random() * 100 + 200), Math.floor(Math.random() * 100 + 200), 'tree').add();
    }

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

  function initServer (_io) {
    initShared(_io);
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
        new Rpc('join', false, players[i].serialize()).send(socket);
    }

    player = new Player();
    player.reserve();

    socket.cn = player.cn;

    // relay the join message to all players but the new one
    ev = new Rpc('join', false, player.serialize());
    ev.relay(socket);

    // tell new player who he is
    ev.data.identity = true;
    ev.send(socket);

    ev.data.socket = socket;
    ev.add();

    socket.on('command', function (data) {
      var ev = new Rpc(data.type, data.frame, data.data);
      ev.from = socket.cn;
      if (data.frame < frameCount - minAge) {
        console.log('too old event');
        return;
        // TODO: NACK these events
      }

      ev.relay(socket);
      ev.add();
      console.log('relaying', ev);
    });

    socket.on('state', function () {
      var state = serializeState();
      state.players[socket.cn].identity = true;
      socket.emit('state', state);
    });

    socket.on('digest', function (data) {
      var targetFrame = frameCount + (200 - (frameCount % 100));
      var ev = new Rpc('digest', targetFrame);
      ev.from = socket.cn;
      ev.add().send(socket);
    });

    socket.on('disconnect', function () {
      new Rpc('part', false, { cn: socket.cn }).add().broadcast();
    });

  }

  function setClientHandlers () {
    if(!socket)
      throw Error("Not connected");

    socket.on('state', function (data) {
      candidateState = savedState = data;
      restoreState(savedState);
    });

    socket.on('time', function (data) {
      frameCount = data.frame;
      startTime = new Date().getTime() - interval * frameCount;
    });

    socket.on('error', function () {
      console.log('An error has occured');
    });

    socket.on('command', function (data) {
      var ev = new Rpc(data.type, data.frame, data.data);
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
      if (!checkRpcs()) {
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

  function checkRpcs () {
    var i, j;
    for (i = 0; i < Rpc.queue.length; i++) {

      // event we can no longer process
      if (Rpc.queue[i].frame < savedState.frame) {
        if (!Rpc.queue[i].handled)
          console.log('unhandled dead event!', Rpc.queue[i]);
        Rpc.queue.splice(i, 1);
        i--;
        continue;
      }

      if (Rpc.queue[i].handled || Rpc.queue[i].frame > frameCount) {
        continue;
      }

      if (Rpc.queue[i].frame == frameCount) {
        handleRpc(Rpc.queue[i]);
        Rpc.queue[i].handled = true;
        Rpc.queue[i].once = true;
      }

      // unhandled, old event. need to resimulate
      if (Rpc.queue[i].frame < frameCount) {
        restoreState(savedState);

        console.log("resimulated", players, frameCount);
        return false;
      }

    }

    // made it through without resimulating
    return true;
  }

  function handleRpc (ev) {
    switch (ev.type) {
      case 'join':

        new Player (ev.data).add();

        if (ev.data.identity) {
          me(players[ev.data.cn]);
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
        players[ev.data.cn].drop();
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
            new Rpc('move', false, Dir.LEFT).submit();
          break;

          case 'right':
            new Rpc('move', false, Dir.RIGHT).submit();
          break;

          case 'jump':
            new Rpc('jump', false).submit();
          break;

          case 'restore':
            // force a resimulation
            new Rpc('restore', frameCount - 5).add();
          break;

          case 'state':
            socket.emit('state');
          break;

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
            new Rpc('stop', false).submit();
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
    for (i = 0; i < players.length; i++) {

      // drop player if he exists now, but doesn't in the saved state
      if (players[i] && !state.players[i]) {
        players[i].drop();
      }
    }

    for (i = 0; i < state.players.length; i++) {
      players[state.players[i].cn].update(state.players[i]);
    }

    frameCount = state.frame;

    for (i = 0; i < Rpc.queue.length; i++) {
      // TODO: off by one error?
      if (Rpc.queue[i].frame >= frameCount) {
        Rpc.queue[i].handled = false;
      } else {
        console.log("Too old event!", Rpc.queue[i]);
      }
    }

  }

  return {
    initClient: initClient,
    initServer: initServer,
    players: function () { return players; },
  };
})();

try {
  module.exports = Zombies;
} catch (e) { }
