var Renderer = (function () {

  try {
    if (!(this.constructor === window.constructor)) {
      return false;
    }
  }
  catch (e) { return false; }

  var context
    , sprites = []
    , width
    , height
    , offset = { x: 0, y: 0}
    , running = false
    ;

  var anima, Models;

  function init () {
    anima = require('../lib/anima/anima');
    Models = require('./models');

    var canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 400;
    document.body.appendChild(canvas);
    context = canvas.getContext('2d');
    width = context.canvas.clientWidth;
    height = context.canvas.clientHeight;

    anima.Sprite.prototype.drawSelf = function () {
        var halfWidth = this._ent.width / 2;
        var halfHeight = this._ent.height / 2;
        if (this.static) {
          context.drawImage(this._image, 0, 0, this._ent.width, this._ent.height, this._ent.x - halfWidth, this._ent.y - halfHeight, this._ent.width, this._ent.height)
        } else {
          this.draw(this._ent.x - halfWidth, this._ent.y - halfHeight, context);
        }
    };
  }

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

  function clear () {
    context.clearRect(0, 0, width, height);
  }

  function add (ent, type) {
    var i = 0, j;

    while (sprites[i]) {
      i++;
    }

    sprites[i] = new anima.Sprite(Models[type].image);
    sprites[i].id = i;
    sprites[i]._ent = ent;
    sprites[i].static = Models[type].static;
    sprites[i].type = type;
    
    if (!Models[type].static) {
      for (j in Models[type].animations) {
        sprites[i].addAnimation(j, new anima.Animation(Models[type].animations[j], new anima.SpriteSheet(Models[type].spriteSheet)));
      }
      sprites[i].animate(0);
    }
    sprites[i].pause();

    return sprites[i];
  }

  function drop (sprite) {
    sprites[sprite.id] = undefined;
  }

  return {
    add: add,
    drop: drop,
    center: center,
    sprites: sprites,
    init: init,
    render: render
  };

})();

module.exports = Renderer
