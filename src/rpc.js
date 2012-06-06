function Rpc (type, frame, data) {
  this.type = type;
  this.frame = frame || frameCount + 2;
  this.data = data || null;
  this.from = me_ != undefined ? me_.cn : undefined;
  this.handled = false;
  this.once = false;
}

Rpc.queue = [];

/**
 * submit rpc to server
 */
Rpc.prototype.submit = function () {
  this.add();
  socket.emit('command', this);
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
  io.sockets.emit('command', this);
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
