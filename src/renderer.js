var Renderer = (function () {
  var context
    , sprites = []
    , physics
    , width
    , height
    , offset = { x: 0, y: 0}
    ;

  var spritesheet = new anima.SpriteSheet({
    width: 32,
    height: 32,
    sprites: [
      { name: 'stand' },
      { name: 'walk_1'},
      { name: 'walk_2'},
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

  anima.Sprite.prototype.drawSelf = function () {
      var halfWidth = this._ent.width / 2;
      var halfHeight = this._ent.height / 2;
      this.draw(this._ent.x - halfWidth, this._ent.y - halfHeight, context);
  };

  function center (pos) {
    offset.x = pos.x;
    offset.y = pos.y;
  }

  function render (deltaTime) {
    var i;
    clear();

    context.save();
    context.translate(width/2 - offset.x, height/2 - offset.y);

    for (i in sprites) {
      if (sprites[i]) {
        sprites[i].animate(deltaTime / 1000);
        sprites[i].drawSelf();
      }
    }

    context.restore();
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

  function add (ent) {
    var i = 0;

    while (sprites[i]) {
      i++;
    }

    sprites[i] = new anima.Sprite(image);
    sprites[i].id = i;
    sprites[i]._ent = ent;
    sprites[i].addAnimation('walk', walk);
    sprites[i].animate(0);
    sprites[i].pause();
    return sprites[i];
  }

  function drop (sprite) {
    sprites[sprite.id] = undefined;
  }

  return {
    init: init,
    add: add,
    drop: drop,
    center: center,
    render: render
  };

})();
