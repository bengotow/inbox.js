if (!Object.create) {
  var objectCreateConstructor = function() {};
}

function inherits(childClass, superClass) {
  if (Object.create) {
    childClass.prototype = Object.create(superClass.prototype);
  } else {
    objectCreateConstructor.prototype = superClass.prototype;
    childClass.prototype = new objectCreateConstructor();
  }
  defineProperty(childClass.prototype, 'super', INVISIBLE, null, null, superClass);
  defineProperty(childClass, 'super', INVISIBLE, null, null, superClass);
  defineProperty(childClass.prototype, 'constructor', INVISIBLE, null, null, childClass);
}
