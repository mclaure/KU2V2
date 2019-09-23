'use strict';
var Faker = require('faker');

function randomInt(low, high) {
  return Math.floor(Math.random() * (high - low + 1) + low)
}

module.exports = {
  generateRandomPayload : function(userContext, events, done) {
    var payload = {
        "id": 0,
        "username":"username",
        "fullname":"fullname",
      };
    
      payload.id =  randomInt(1, 1000000000);  
      payload.username =  Faker.internet.userName();  
      payload.fullname =  Faker.name.findName(); 
      userContext.vars.payload = payload;  
      return done();
  },

  generateRandomPagination : function(userContext, events, done) { 
      userContext.vars.pageSize = randomInt(1, 10);  
      userContext.vars.startPage = randomInt(1, 5);  
      return done();
  },

  generateRandomPaginationAndData : function(userContext, events, done) { 
    userContext.vars.pageSize = randomInt(1, 10);  
    userContext.vars.startPage = randomInt(1, 5);  
    userContext.vars.fullName = Faker.name.findName();
    userContext.vars.userName = Faker.internet.userName();
    return done();
  },

  generateRandomUserId : function(userContext, events, done) { 
    userContext.vars.userId = randomInt(1, 1000000000);  
    return done();
 }     
};