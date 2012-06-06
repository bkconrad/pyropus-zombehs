function SceneObject (x, y, type) {
  this.ent = { x: x, y: y, width: 32, height: 32};
  this.type = type;
}

SceneObject.prototype = {
  ent: {},
  type: 'typeless',
  add: function () {
    renderer.add(this.ent, this.type);
    console.log('added', this);
  }
};

try {
  module.exports = SceneObject;
}
catch (e) { }
