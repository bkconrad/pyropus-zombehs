var Zombies = {
  _canvas: undefined,
  _context: undefined,

  initClient: function (canvas) {
    _canvas = canvas;
    _context = canvas.getContext('2d');
    _context.fillText("Hello!", 20, 20);
  },

  initServer: function () {
  },
};

try {
  module.exports = Zombies;
} catch (e) { }
