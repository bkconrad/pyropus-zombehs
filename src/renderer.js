var Renderer = (function () {
  var context
    , physics
    , width
    , height
    ;

  function render () {
    clear();
    var i;
    for (i in physics.entList) {
      renderEntity(physics.entList[i]);
    }
  }

  function renderEntity (ent) {
    context.fillRect(ent.x - 2, ent.y - 2, 5, 5);
  }

  function init (_context, _physics) {
    context = _context;
    physics = _physics;
    width = context.canvas.clientWidth;
    height = context.canvas.clientHeight;
  }

  function clear () {
    context.clearRect(0, 0, width, height);
  }

  return {
    init: init,
    render: render
  };

})();
