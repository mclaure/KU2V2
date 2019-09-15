'use strict';

const mongodb = require("../config/MongoDBdatabase");
const Kudos = require("./schema/Kudos");
const rmq = require("./RabbitMQController");
const mongoose = require("mongoose");

exports.list_kudos = (req, res, next) => {
    Kudos.find({},{_id:0, id:1, idRemitente:1, idDestinatario:1, tema:1})
        .exec()
        .then(docs => {
            return res.status(200).json({ "kudos": docs });
        })
        .catch(err => {
            console.log(err);
        });
};

exports.add_kudos = (req, res, next) => {               
    const item = new Kudos({
        _id: mongoose.Types.ObjectId(),
        id: req.body.id,
        idRemitente: req.body.idRemitente,
        idDestinatario: req.body.idDestinatario,                
        fecha: req.body.fecha,
        lugar: req.body.lugar,    
        tema: req.body.tema,      
        texto: req.body.texto             
    });

     //create message update  
    var idDestinatario = parseInt(req.body.idDestinatario, 10);        
    var message = {};

    item.save()
         .then(result => {
            //Count Kudos
            Kudos.countDocuments({idDestinatario: idDestinatario}, function(err, total) {
             if (err) console.log(err);

                message = JSON.stringify({operation: "add", idDestinatario: idDestinatario, newTotalKudos: total });  
                rmq.sendMessage(message);
                res.status(200).json( { created: true });
            }); 
          })
         .catch(err => {
            console.log(err);
    });   
};

exports.del_kudos = (req, res, next) => {
    const idKudos = parseInt(req.params.id, 10);
    
     //create message update
    var idDestinatario = 0;
    var totalKudos     = 0;
    var message        =  {};

    //find idRemitente
    Kudos.findOne({id:idKudos})
        .exec()
        .then(kudos => {
            idDestinatario = kudos.idDestinatario;

            //Count Kudos
            Kudos.countDocuments({idDestinatario: idDestinatario}, function(err, total) {
                if (err) console.log(err);
                    totalKudos = total;

                    //delete kudos
                    Kudos.deleteOne({id:idKudos})
                    .exec()
                    .then(docs => {
                        total = total - 1;
                        message = JSON.stringify({operation: "delete", idDestinatario: idDestinatario, newTotalKudos: total });  
                        rmq.sendMessage(message);
                        res.status(200).json( { deleted: true });
                    })
                    .catch(err => {
                        console.log(err)
                    });
            });  
        })
        .catch(err => {
            console.log(err);
        });
};