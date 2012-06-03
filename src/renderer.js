var Renderer = (function () {
  var context
    , physics
    , width
    , height
    , sprite
    ;

  function render (deltaTime) {
    var i;
    clear();
    sprite.animate(deltaTime / 1000);

    for (i in physics.entList) {
      if (physics.entList[i]) {
        renderEntity(physics.entList[i]);
      }
    }
  }

  function renderEntity (ent) {
    var halfWidth = ent.width / 2;
    var halfHeight = ent.height / 2;
    sprite.draw(ent.x - halfWidth, ent.y - halfHeight, context);
  }

  function init (_context, _physics) {
    context = _context;
    physics = _physics;
    width = context.canvas.clientWidth;
    height = context.canvas.clientHeight;

    var spritesheet = new anima.SpriteSheet({
      width: 32,
      height: 32,
      sprites: [
      { name: 'stand' },
      { name: 'walk_1', x: 0, y: 1},
      { name: 'walk_2', x: 0, y: 1},
      ]
    });

    var walk = new anima.Animation([
      { sprite: 'walk_1', time: 0.2 },
      { sprite: 'stand', time: 0.2 },
      { sprite: 'walk_2', time: 0.2 },
      { sprite: 'stand', time: 0.2 }
      ], spritesheet);

    var image = new Image();
    image.src = 'fighter.gif';

    sprite = new anima.Sprite(image);
    sprite.addAnimation('walk', walk);
    sprite.animate(0);
  }

  function clear () {
    context.clearRect(0, 0, width, height);
  }

  return {
    init: init,
    render: render
  };

})();
