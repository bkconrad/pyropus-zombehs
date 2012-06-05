var Models = {
  fighter: {
    spriteSheet: {
      width: 32,
      height: 32,
      sprites: [
        { name: 'stand' },
        { name: 'walk_1'},
        { name: 'walk_2'},
      ]
    },
    animations: {
      walk: [
        { sprite: 'walk_1', time: 0.2 },
        { sprite: 'stand', time: 0.2 },
        { sprite: 'walk_2', time: 0.2 },
        { sprite: 'stand', time: 0.2 }
      ]
    },
    image: 'fighter.gif'
  },
  tree: {
    static: true,
    image: 'tree.gif'
  }
};

var src;
for (var m in Models) {
  src = Models[m].image;
  Models[m].image = new Image();
  Models[m].image.src = src;
}
