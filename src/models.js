// return false unless we're in a sane browser
try {
  if (!(this.constructor === window.constructor)) {
    return { exports: false };
  }
}
catch (e) { return { exports: false }; }

var Models = {
  fighter: {
    spriteSheet: {
      width: 32,
      height: 32,
      sprites: [
        { name: 'stand' },
        { name: 'walk_1'},
        { name: 'walk_2'},
        { name: 'run'},
        { name: 'jump'},
        { name: 'punch_1'},
        { name: 'punch_2'},
        { name: 'punch_3'},
      ]
    },
    animations: {
      walk: [
        { sprite: 'walk_1', time: 0.2 },
        { sprite: 'stand', time: 0.2 },
        { sprite: 'walk_2', time: 0.2 },
        { sprite: 'stand', time: 0.2 }
      ],
      run: [
        { sprite: 'walk_1', time: 0.1 },
        { sprite: 'walk_2', time: 0.1 },
        { sprite: 'run', time: 0.1 },
        { sprite: 'walk_2', time: 0.1 },
        { sprite: 'walk_1', time: 0.1 },
        { sprite: 'stand', time: 0.1 },
      ],
      punch: [
        { sprite: 'punch_1', time: 0.1 },
        { sprite: 'punch_2', time: 0.1 },
        { sprite: 'punch_3', time: 0.2 }
      ]
    },
    image: 'fighter.gif'
  },
  tree: {
    image: 'tree.gif'
  },
  zombie: {
    image: 'zombie.gif'
  }
};

/**
 * Causes browser to begin loading models
 */
Models.util = {};
Models.util.load = function () {
  var src;
  for (var m in Models) {
    if (m === 'util')
      continue;
    src = Models[m].image;
    Models[m].image = new Image();
    Models[m].image.src = src;
  }
}

/**
 * @return float indicating the percentage of images loaded
 */
Models.util.progress = function () {
  var m, count = 0, total = 0;
  for (m in Models) {
    if (m === 'util')
      continue;
    if (Models[m].image.complete === true)
      count += 1;
    total += 1;
  }

  return count / total;
}

module.exports = Models;
