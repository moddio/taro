var CrashColliders = require("crash-colliders");

var cc = new CrashColliders({});

var crash = {};
crash.b2Vec2 = cc.Vector;
crash.Box = cc.Box;
crash.createBody = cc.createBody;
crash.onCollision = cc.onCollision;