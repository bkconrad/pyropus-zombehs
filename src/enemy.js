var SimplePhysics = require ('./simplephysics'),
    Renderer = require('./renderer');
var Enemy = function (ent) {
  SimplePhysics.add(ent);

};

Enemy.prototype = {
  ent: undefined,
  sprite: undefined,
  id: undefined
};
