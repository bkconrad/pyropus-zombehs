var Zombies = require('./src/zombies');
document.addEventListener('DOMContentLoaded', function () {

  Zombies.initClient(io);

});
