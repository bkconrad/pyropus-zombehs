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
    var halfWidth = ent.width / 2;
    var halfHeight = ent.height / 2;
    context.fillRect(ent.x - halfWidth, ent.y - halfHeight, ent.width, ent.height);
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
