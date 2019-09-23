'use strict';
var Faker = require('faker');

function randomInt(low, high) {
  return Math.floor(Math.random() * (high - low + 1) + low)
}

module.exports = {
 generateRandomPayload : function(userContext, events, done) {
    var payload = {
       "id": 0,
       "idRemitente":"idRemitente",
       "idDestinatario":"idDestinatario",
       "fecha":"fecha", 
       "lugar":"lugar", 
       "categoria":"categoria",
       "contenido":"contenido"                             
    };
        
    payload.id =  randomInt(1, 1000000000);  
    payload.idRemitente =  randomInt(1, 1000000000);  
    payload.idDestinatario =  randomInt(1, 1000000000); 
    payload.fecha = Faker.date.recent();
    payload.lugar = Faker.random.locale();
    payload.categoria = Faker.random.word();
    payload.contenido = Faker.random.words();
    userContext.vars.payload = payload;  
    return done();
  },    
  generateRandomPagination : function(userContext, events, done) { 
      userContext.vars.pageSize = randomInt(1, 10);  
      userContext.vars.startPage = randomInt(1, 5);  
      return done();
  },
  generateRandomKudosId : function(userContext, events, done) { 
    userContext.vars.kudosId = randomInt(1, 1000000000);  
    return done();
  },
  generateRandomUserId : function(userContext, events, done) { 
    userContext.vars.userId = randomInt(1, 1000000000);  
    return done();
  }    
};