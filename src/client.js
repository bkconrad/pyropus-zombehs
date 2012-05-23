document.addEventListener('DOMContentLoaded', function () {
 
  // create & add canvas
  var canvas = document.createElement("canvas");
  canvas.width = 600;
  canvas.height = 400;
  document.body.appendChild(canvas);

  Zombies.initClient(canvas, io, SimplePhysics);

});
