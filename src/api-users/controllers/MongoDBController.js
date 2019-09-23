'use strict';

const mongodb = require("../config/MongoDBdatabase");
const User = require("./schema/Users");
const rmq = require("./RabbitMQController");
const mongoose = require("mongoose");
const logger = require('../logger/logger');
const elasticSearch = require("../config/ElasticSearch");
const indexName = 'users';
const indexType = 'user';
elasticSearch.Initialize(indexName);

exports.list_users = (req, res, next) => {
    var startPage = parseInt(req.query.startPage) || 0;
    var pageSize = parseInt(req.query.pageSize) || 0;
    var query = {};
    logger.info('[GET /api/users/list] starting listing users');

    if(pageSize < 0 || pageSize === 0 || startPage < 0) {
        logger.info('[/api/users/list] Invalid pageSize|startPage ' + pageSize);        
        var response = {"error" : true, "message" : "invalid page number, should start with 1"};
        return res.json(response);
    }

    query.skip = pageSize * (startPage - 1);
    query.limit = pageSize;

    User.find({},{_id:0, id:1, userName:1, fullName:1, kudosQTY:1}, query)
        .exec()
        .then(users => {
            logger.info('[GET /api/users/list] listing users succeed [startPage:' + startPage + ', pageSize:' + pageSize + ']');
            return res.status(200).json({ "users": users });
        })
        .catch(err => {
            console.log(err);
            logger.info('[GET /api/users/list] error: ' + err);
        });
};

exports.find_users = (req, res, next) => {
    var userName = req.query.userName || '';
    var fullName = req.query.fullName || '';   
    var startPage = parseInt(req.query.startPage) || 1;
    var pageSize = parseInt(req.query.pageSize) || 10;
    var query = {};

    logger.info('[GET /api/users/find] starting finding users');

    if(pageSize < 0 || pageSize === 0 || startPage < 0) {
        logger.info('[GET /api/users/find] Invalid pageSize|startPage ' + pageSize);
        var response = {"error" : true, "message" : "invalid page number, should start with 1"};
        return res.json(response);
    }     
  
    query.skip = pageSize * (startPage - 1);
    query.limit = pageSize;

    //TODO: include "soundex" capability during searching
    User.find({$or:[{userName:userName},{fullName:fullName}]},{_id:0, id:1, userName:1, fullName:1, kudosQTY:1}, query)
        .exec()
        .then(users => {
            logger.info('[GET /api/users/find] operation succeed for [username: ' + userName + ' fullName: ' + fullName + ', startPage:' + startPage + ', pageSize:' + pageSize + ']');
            return res.status(200).json({ "users": users });
        })
        .catch(err => {         
            console.log(err);
            logger.info('[GET /api/users/find] error: ' + err);
        });
};

exports.user_detail = (req, res, next) => {
    var userId = parseInt(req.query.id) || 0;

    if(userId === 0) {
        var response = {"error" : true, "message" : "User Not found"};
        logger.info('[GET /api/users/detail] user ' + userId + ' not found');
        return res.json(response);
    }     

    User.find({ id: userId },{_id:0, id:1, userName:1, fullName:1, kudosQTY:1})
        .exec()
        .then(users => {
            //TODO We need to add kudos information 
            logger.info('[GET /api/users/detail] operation succeed for userid: '+ userId);             
            return res.status(200).json({ "users": users });
        })
        .catch(err => {             
            console.log(err);
            logger.info('[GET /api/users/detail] error: ' + err);
        });
};

exports.add_user = (req, res, next) => {               
    var userId = parseInt(req.body.id);
    var payload = {
        userName: req.body.username,
        fullName: req.body.fullname,      
    };
    var item = new User({
        _id: mongoose.Types.ObjectId(),
        id: userId,
        userName: payload.userName,
        fullName: payload.fullName,                
        kudosQTY: 0       
    });

    logger.info('[GET /api/users/add] starting adding user: ' + req.body.username);

    //ElasticSearch Index creation
    var newIndex = 'users';

    User.findOne({ userName: req.body.username })
        .exec()
        .then(users => {
            if(users) 
            {
                res.status(303).json( { userAlreadyExists: true });
                logger.info('[GET /api/users/add] user already exists: ' + req.body.username);
            }
            else
            {
                item.save()
                .then(result => {  
                    res.status(200).json( { userCreated: true });
                    logger.info('[GET /api/users/add] user ' + req.body.username + ' created');
                    elasticSearch.addDocument(indexName, userId, indexType, payload);
                })
                .catch(err => {
                    console.log(err);
                    logger.info('[GET /api/users/add] error: ' + err);
            });  
            }
        })
        .catch(err => {            
            console.log(err);
            logger.info('[GET /api/users/add] error: ' + err);
        }); 
};

exports.del_user = (req, res, next) => {
    const idUser = parseInt(req.params.id, 10);
    
     //create message update
    var message = JSON.stringify({ operation: "delete", idDestinatario: idUser });
    logger.info('[GET /api/users/del] starting deleting user: ' + idUser);

    //find User
    User.findOne({ id: idUser })
        .exec()
        .then(users => {
            if(users)
            {
                //Delete User
                User.deleteOne({ id: idUser })
                .exec()
                .then(users => {
                    rmq.sendMessage(message);
                    res.status(200).json( { userDeleted: true });
                    elasticSearch.deleteDocument(indexName, idUser, indexType);
                    logger.info('[GET /api/users/del] user: ' + idUser + ' was deleted.');
                })
                .catch(err => {                     
                    console.log(err);
                    logger.info('[GET /api/users/del] error: ' + err);
                });
            }
            else 
            {
                res.status(300).json( { userNotFound: true });
                logger.info('[GET /api/users/del] user: ' + idUser + ' was not found');
            } 
        })
        .catch(err => {     
            console.log(err);
            logger.info('[GET /api/users/del] error: ' + err);
        });
};

exports.user_update = (req, res, next) => {
    const idUser = parseInt(req.params.id, 10) || 0;
    const total = parseInt(req.params.total, 10) || 0;    

    if(idUser === 0) {
        logger.info('[GET /api/users/update] user: ' + idUser + ' not found');
        return res.status(300).json( { userNotFound: true });
    }

    User.findOne({ id: idUser })
    .exec()
    .then(users => {
        if(users)
        {
            User.updateOne({ id: idUser },{ $set: {kudosQTY: total}})
            .exec()
            .then(users => {
                logger.info('[GET /api/users/update] user: ' +  idUser + ' was successfully updated');
                return res.status(200).json( { userUpdated: true });
            })
            .catch(err => {    
                console.log(err);
                logger.info('[GET /api/users/update] error: ' + err);
            });      
        }
        else 
        {
            logger.info('[GET /api/users/update] user: ' + idUser + ' was not found');
            res.status(300).json( { userNotFound: true });
        } 
    })
    .catch(err => {    
        console.log(err);
        logger.info('[GET /api/users/update] error: ' + err);
    });              
};