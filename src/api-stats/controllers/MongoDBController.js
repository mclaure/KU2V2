'use strict';

const mongodb = require("../config/MongoDBdatabase");
const Kudos = require("./schema/Kudos");
const mongoose = require("mongoose");

exports.deleteAllKudos = (id) => {
               
    Kudos.deleteMany({idDestinatario: id})
        .exec()
        .then(docs => {
            console.log(" [x] Kudos from User [%d] where deleted", id);
        })
        .catch(err => {
            console.log(err);
        });
};