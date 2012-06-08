var Anima = require('../lib/anima/anima')
  , Levels = require('./levels')
  , Models = require('./models');

var Renderer = (function () {

  // return false unless we're in a sane browser
  try {
    if (!(this.constructor === window.constructor)) {
      return false;
    }
  }
  catch (e) { return false; }

  var context
    , sprites = []
    , width = 600
    , height = 400
    , offset = { x: 0, y: 0}
    , running = false
    , _renderCallback = undefined;
    ;

  function loadProgress () {
    return Models.util.progress();
  }

  function loadResources (callback) {
    Models.util.load();
    var interval = setInterval(function () {
      if (loadProgress() < 1)
        return;

      clearInterval(interval);
      callback();
    }, 200);
  }


  function init () {

    var canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    document.body.appendChild(canvas);
    context = canvas.getContext('2d');

    // TODO: move this upstream
    Anima.Sprite.prototype.drawSelf = function () {
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

  function renderCallback (cb) {
    if (cb !== undefined) {
      _renderCallback = cb;
    }

    return _renderCallback;
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

    if (_renderCallback) {
      _renderCallback(context);
    }
  }

  function clear () {
    context.clearRect(0, 0, width, height);
  }

  function mkSprite(ent, type) {
    // TODO: move this upstream
    var j, sprite = new Anima.Sprite(Models[type].image);
    sprite.type = type;
    sprite.static = !Models[type].animations;
    sprite._ent = ent;

    for (j in Models[type].animations) {
      sprite.addAnimation(j, new Anima.Animation(Models[type].animations[j], new Anima.SpriteSheet(Models[type].spriteSheet)));
    }

    if (sprite.static) {
      sprite._ent.width = sprite._image.width;
      sprite._ent.height = sprite._image.height;
    } else {
      sprite.animate(0);
    }

    sprite.pause();
    return sprite;
  }

  function loadLevel (levelName) {
    var i, level = Levels[levelName], sceneObject;

    for (i = 0; i < level.scenery.length; i++) {
      sceneObject = level.scenery[i];
      add ({ x: sceneObject.x, y: sceneObject.y}, sceneObject.model);
    }
  }

  function add (ent, type) {
    var i = 0, j;

    while (sprites[i]) {
      i++;
    }

    sprites[i] = mkSprite(ent, type);
    sprites[i].id = i;

    return sprites[i];
  }

  function drop (sprite) {
    console.log('dropping', sprite);
    sprites[sprite.id] = undefined;
  }

  return {
    add: add,
    center: center,
    drop: drop,
    init: init,
    loadLevel: loadLevel,
    loadResources: loadResources,
    sprites: function () { return sprites; },
    render: render,
    renderCallback: renderCallback
  };

})();

module.exports = Renderer
