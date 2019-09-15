 'use strict';

var mysql = require("mysql");

//Creates DB connection
var mysqlConn = mysql.createConnection({
    host     : "localhost",
    user     : "root",
    password : "Password123",
    database : "users"
  });

module.exports = mysqlConn;  