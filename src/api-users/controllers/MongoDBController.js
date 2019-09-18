'use strict';

const mongodb = require("../config/MongoDBdatabase");
const User = require("./schema/Users");
const rmq = require("./RabbitMQController");
const mongoose = require("mongoose");
const opts = {
    errorEventName:'error',
    logDirectory:'../../logfiles/api-users',
    fileNamePattern:'api-users-<DATE>.log',
    dateFormat:'YYYYMMDDHHmmss',
    timestampFormat:'YYYY-MM-DD HH:mm:ss.SSS'
};
const log = require('simple-node-logger').createRollingFileLogger(opts);

exports.list_users = (req, res, next) => {
    var startPage = parseInt(req.query.startPage) || 0;
    var pageSize = parseInt(req.query.pageSize) || 0;
    var query = {};

    if(pageSize < 0 || pageSize === 0) {
        log.info('[/api/users/list] Invalid pageSize ', pageSize);        
        var response = {"error" : true, "message" : "invalid page number, should start with 1"};
        return res.json(response);
    }

    query.skip = pageSize * (startPage - 1);
    query.limit = pageSize;

    User.find({},{_id:0, id:1, userName:1, fullName:1, kudosQTY:1}, query)
        .exec()
        .then(users => {
            log.info('[/api/users/list] list of users was sent successfully.');  
            return res.status(200).json({ "users": users });
        })
        .catch(err => {
            log.info('[/api/users/list] there was an error sending list of users error: ', err);
            console.log(err);
        });
};

exports.find_users = (req, res, next) => {
    var userName = req.query.userName || '';
    var fullName = req.query.fullName || '';   
    var startPage = parseInt(req.query.startPage) || 1;
    var pageSize = parseInt(req.query.pageSize) || 10;
    var query = {};

    if(pageSize < 0 || pageSize === 0) {
        log.info('[/api/users/find] Invalid pageSize ', pageSize);
        var response = {"error" : true, "message" : "invalid page number, should start with 1"};
        return res.json(response);
    }     
  
    query.skip = pageSize * (startPage - 1);
    query.limit = pageSize;

    //TODO: include "soundex" capability during searching
    User.find({$or:[{userName:userName},{fullName:fullName}]},{_id:0, id:1, userName:1, fullName:1, kudosQTY:1}, query)
        .exec()
        .then(users => {
            log.info('[/api/users/find] list of users was sent successfully.');              
            return res.status(200).json({ "users": users });
        })
        .catch(err => {
            log.info('[/api/users/find] there was an error sending list of users error: ', err);            
            console.log(err);
        });
};

exports.user_detail = (req, res, next) => {
    var userId = parseInt(req.query.id) || 0;

    if(userId === 0) {
        log.info('[/api/users/detail] User with id ', req.query.id, ' was not found');
        var response = {"error" : true, "message" : "User Not found"};
        return res.json(response);
    }     

    User.find({ id: userId },{_id:0, id:1, userName:1, fullName:1, kudosQTY:1})
        .exec()
        .then(users => {
            //TODO We need to add kudos information
            log.info('[/api/users/detail] user details were sent successfully.');                 
            return res.status(200).json({ "users": users });
        })
        .catch(err => {
            log.info('[/api/users/detail] there was an error sending user details: ', err);              
            console.log(err);
        });
};

exports.add_user = (req, res, next) => {               
    var item = new User({
        _id: mongoose.Types.ObjectId(),
        id: req.body.id,
        userName: req.body.username,
        fullName: req.body.fullname,                
        kudosQTY: 0          
    });

    User.findOne({ userName: req.body.username })
        .exec()
        .then(users => {
            if(users) 
            {
                log.info('[/api/users/add] user ', req.body.username, ' already exists', );  
                res.status(303).json( { userAlreadyExists: true });
            }
            else
            {
                item.save()
                .then(result => {
                    log.info('[/api/users/add] user ', req.body.username, ' was created successfully');  
                    res.status(200).json( { userCreated: true });
                })
                .catch(err => {
                    console.log(err);
            });  
            }
        })
        .catch(err => {
            log.info('[/api/users/add] there was an error adding user error: ', err);              
            console.log(err);
        }); 
};

exports.del_user = (req, res, next) => {
    const idUser = parseInt(req.params.id, 10);
    
     //create message update
    var message = JSON.stringify({ operation: "delete", idDestinatario: idUser });

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
                    log.info('[/api/users/del] user ', idUser, ' was deleted successfully');
                    rmq.sendMessage(message);
                    res.status(200).json( { userDeleted: true });
                })
                .catch(err => {
                    log.info('[/api/users/del] there was an error deleting user with: ', err);                     
                    console.log(err)
                });
            }
            else 
            {
                log.info('[/api/users/del] user ', idUser, ' was not found');
                res.status(300).json( { userNotFound: true });
            } 
        })
        .catch(err => {
            log.info('[/api/users/del] there was an error searching the user: ', err);     
            console.log(err);
        });
};

exports.user_update = (req, res, next) => {
    const idUser = parseInt(req.params.id, 10) || 0;
    const total = parseInt(req.params.total, 10) || 0;    

    if(idUser === 0) return res.status(300).json( { userNotFound: true });

    User.findOne({ id: idUser })
    .exec()
    .then(users => {
        if(users)
        {
            User.updateOne({ id: idUser },{ $set: {kudosQTY: total}})
            .exec()
            .then(users => {
                log.info('[/api/users/:id/update/kudosQTY/:total] user ', idUser, ' information updated'); 
                return res.status(200).json( { userUpdated: true });
            })
            .catch(err => {
                log.info('[/api/users/:id/update/kudosQTY/:total] there was an error updating the user: ', err);     
                console.log(err);
            });      
        }
        else 
        {
            log.info('[/api/users/:id/update/kudosQTY/:total] user ', idUser, ' was not found');
            res.status(300).json( { userNotFound: true });
        } 
    })
    .catch(err => {
        log.info('[/api/users/:id/update/kudosQTY/:total] there was an error updating the user: ', err);     
        console.log(err);
    });              
};