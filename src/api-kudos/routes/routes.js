'use strict';

module.exports = function(app) {

  var redisdb = require('../controllers/RedisDBController');

  //   *********** KUDOS ***********
  app.route('/api/kudos/add')
    .post(redisdb.add_kudos);  

  app.route('/api/kudos/del/:id')
    .delete(redisdb.del_kudos);  

  app.route('/api/kudos/del/all/:userId')
    .delete(redisdb.del_all_kudos);        

  app.route('/api/kudos/list')
    .get(redisdb.list_kudos);            
  
  app.route('/api-kudos-docs.json')
    .get((req, res) => {
          res.setHeader('Content-Type', 'application/json');
          res.sendFile(__dirname + '/api-kudos-docs.json');
    });               
};