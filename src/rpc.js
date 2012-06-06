function Rpc (type, frame, data) {
  this.type = type;
  this.frame = frame;
  this.data = data;
  this.from = undefined;
  this.handled = false;
  this.once = false;
}

Rpc.socket = undefined;
Rpc.io = undefined;

Rpc.queue = [];

/**
 * submit rpc to server
 */
Rpc.prototype.submit = function () {
  this.add();
  Rpc.socket.emit('command', this);
  return this;
};

/**
 * send rpc to all sockets except the one passed
 */
Rpc.prototype.relay = function (socket) {
  var i;
  socket.broadcast.emit('command', this);
  return this;
};

/**
 * send rpc to all players
 */
Rpc.prototype.broadcast = function () {
  Rpc.io.sockets.emit('command', this);
  return this;
};

/**
 * send rpc to a particular socket
 */
Rpc.prototype.send = function (socket) {
  socket.emit('command', this);
  return this;
};

Rpc.prototype.add = function () {
  Rpc.queue.push(this);
  return this;
}

try {
  module.exports = Rpc;
}
catch (e) { }
