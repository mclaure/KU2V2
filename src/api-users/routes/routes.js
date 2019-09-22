'use strict';

module.exports = function(app) {

  var mongodb = require('../controllers/MongoDBController');  

  //   *********** USUARIOS ***********
  app.route('/api/users/list')
    .get(mongodb.list_users);  
  
  app.route('/api/users/add')
    .post(mongodb.add_user);     
  
  app.route('/api/users/del/:id')
    .delete(mongodb.del_user);   

  app.route('/api/users/find')
    .get(mongodb.find_users);

  app.route('/api/users/detail')
    .get(mongodb.user_detail);

  app.route('/api/users/:id/update/kudosQTY/:total')
    .put(mongodb.user_update);         
 
  app.route('/api-users-docs.json')
    .get((req, res) => {
          res.setHeader('Content-Type', 'application/json');
          res.sendFile(__dirname + '/api-users-docs.json');
    });
};