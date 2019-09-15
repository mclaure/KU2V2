'use strict';

var mysqlConn = require("../config/MySQLdatabase");

exports.updateUserKudos = (id, total) => {
    let sql = "UPDATE user      \
               SET kudosQTY = ? \
               WHERE id = ?;";
               
    let params = [total, id];

    mysqlConn.query(sql, params, function (error, rows, fields) {
        if (error) 
            return console.log(err);
        else 
            return console.log(" [x] kudosQTY updated for User [%d]", id);
    });    
};