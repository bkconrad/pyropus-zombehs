document.addEventListener('DOMContentLoaded', function () {
 
  // create & add canvas
  var canvas = document.createElement("canvas");
  document.body.appendChild(canvas);

  Zombies.initClient(canvas);

});
