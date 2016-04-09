var DiscSimulator = DiscSimulator || {};

DiscSimulator.Circle = function(x, y, radius) {
  this.x = x;
  this.y = y;
  this.radius = radius;
};

DiscSimulator.Vector = function(x, y, startx = 0, starty = 0) {
  this.x = x - startx;
  this.y = y - starty;
  this.startx = startx;
  this.starty = starty;

  this.length = function() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  };

  this.normalize = function() {
    var len = this.length();
    this.x /= len;
    this.y /= len;
  };

  this.normalVector = function() {
    return new Vector(this.y, -this.x);
  };
};

DiscSimulator.Vector.dot = function(vec1, vec2) {
  return vec1.x * vec2.x + vec1.y * vec2.y
};

DiscSimulator.createDisc = function(x, y, radius) {
  var circle = new createjs.Shape();
  circle.graphics.beginStroke("blue").drawCircle(0, 0, radius);

  var cross = new createjs.Shape();
  cross.graphics.beginStroke("red").moveTo(0, -radius).lineTo(0, radius);
  cross.graphics.beginStroke("green").moveTo(-radius, 0).lineTo(radius, 0);

  var disc = new createjs.Container();
  disc.x = x;
  disc.y = y;
  disc.addChild(circle, cross);
  return disc;
};

DiscSimulator.createArm = function(x, y, width, length) {
  var arm = new createjs.Shape();
  arm.graphics.beginStroke("black").rect(-width / 2, -width / 2, width, length);

  arm.x = x;
  arm.y = y;
  return arm;
};

DiscSimulator.intersection = function(circle1, circle2) {
  var a, dx, dy, d, h, rx, ry;
  var x2, y2;

  // dx and dy are the vertical and horizontal distances
  // between the circle centers.
  dx = circle2.x - circle1.x;
  dy = circle2.y - circle1.y;

  // Determine the straight-line distance between the centers.
  d = Math.sqrt((dy * dy) + (dx * dx));

  // Check for solvability.
  if (d > (circle1.radius + circle2.radius)) {
    // no solution. circles do not intersect.
    return false;
  }

  if (d < Math.abs(circle1.radius - circle2.radius)) {
    // no solution. one circle is contained in the other.
    return false;
  }

  // 'point 2' is the point where the line through the circle
  // intersection points crosses the line between the circle centers.

  // Determine the distance from point 0 to point 2.
  a = ((circle1.radius * circle1.radius) -
    (circle2.radius * circle2.radius) +
    (d * d)) / (2.0 * d);

  // Determine the coordinates of point 2.
  x2 = circle1.x + (dx * a / d);
  y2 = circle1.y + (dy * a / d);

  // Determine the distance from point 2 to either of the intersection points.
  h = Math.sqrt((circle1.radius * circle1.radius) - (a * a));

  // Now determine the offsets of the intersection points from point 2.
  rx = -dy * (h / d);
  ry = dx * (h / d);

  // Determine the absolute intersection points.
  var xi = x2 + rx;
  var xi_prime = x2 - rx;
  var yi = y2 + ry;
  var yi_prime = y2 - ry;

  return [xi, yi, xi_prime, yi_prime];
};

DiscSimulator.calulateArmArcIntersections = function(x, y) {
  var v = new DiscSimulator.Vector(x, y);
  var c = new DiscSimulator.Circle(0, 0, v.length());

  return this.intersection(c, this.armCircle);
};

DiscSimulator.drawIntersections = function(pts) {
  var p1 = new createjs.Shape();
  var p2 = new createjs.Shape();
  p1.graphics.beginFill("red").drawCircle(pts[0], pts[1], 5);
  p2.graphics.beginFill("red").drawCircle(pts[2], pts[3], 5);

  this.stage.addChild(p1);
  this.stage.addChild(p2);
  this.stage.update();
};

DiscSimulator.rotate = function(angleX, angleY) {
  TweenLite.to(this.disc, 2, {
    rotation: angleX,
    ease: Linear.easeNone,
    onUpdate: this.stage.update,
    onUpdateScope: this.stage
  });

  TweenLite.to(this.arm, 2, {
    rotation: angleY,
    ease: Linear.easeNone,
    onUpdate: this.stage.update,
    onUpdateScope: this.stage
  });
};

DiscSimulator.init = function() {
  this.stage = new createjs.Stage("canvas");
  this.stage.scaleY = -1;
  this.stage.regX = -this.stage.canvas.width / 2;
  this.stage.regY = this.stage.canvas.height / 2 - 80;

  this.disc = this.createDisc(0, 0, 300);
  this.arm = this.createArm(0, -465, 20, 490);

  this.stage.addChild(this.disc, this.arm);
  this.stage.update();

  this.armCircle = new DiscSimulator.Circle(0, -465, 465);
  this.armVector = new DiscSimulator.Vector(0, 0, 0, -465);
};

DiscSimulator.xMove = document.getElementById("xValue");
DiscSimulator.yMove = document.getElementById("yValue");
DiscSimulator.moveToButton = document.getElementById("moveToButton");

DiscSimulator.moveToButton.addEventListener("click", function() {
  var point = new createjs.Shape();
  point.graphics.beginFill("red").drawCircle(0, 0, 5);

  point.x = DiscSimulator.xMove.value;
  point.y = DiscSimulator.yMove.value;

  DiscSimulator.disc.removeChildAt(2);
  DiscSimulator.disc.addChildAt(point, 2);

  var pts = DiscSimulator.calulateArmArcIntersections(point.x, point.y);

  var intersectionPoint;
  var sign;

  if (point.x > 0) {
    intersectionPoint = {
      x: pts[0],
      y: pts[1]
    };

    sign = -1;
  } else {
    intersectionPoint = {
      x: pts[2],
      y: pts[3]
    };

    sign = 1;
  }

  var u = new DiscSimulator.Vector(point.x, point.y);
  var v = new DiscSimulator.Vector(intersectionPoint.x, intersectionPoint.y);

  var dot = DiscSimulator.Vector.dot(u, v);
  var alpha = Math.acos(dot / (u.length() * v.length())) * 180 / Math.PI * sign;

  var w = new DiscSimulator.Vector(intersectionPoint.x, intersectionPoint.y, 0, DiscSimulator.arm.y);

  dot = DiscSimulator.Vector.dot(w, DiscSimulator.armVector);
  var beta = Math.acos(dot / (w.length() * DiscSimulator.armVector.length())) * 180 / Math.PI * sign;

  DiscSimulator.rotate(alpha, beta);
});

DiscSimulator.init();
