// ValueObject.js
// Base class for all Value Objects sharing same variables
// Ported from Processing to JavaScript

class ValueObject {
  constructor() {
    this.id = 0;
    this.w = 0;
    this.h = 0;
    this.x = 0;
    this.y = 0;
    this.c = null; // color
  }
}

module.exports = ValueObject;


