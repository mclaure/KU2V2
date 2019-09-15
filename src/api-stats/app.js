const express = require("express");
const bodyparser = require("body-parser");
const cors = require("cors");
const rmq = require("./controllers/RabbitMQController");

const app = express();
app.use(cors());
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({extended:false}));

//Starts receiving messages
rmq.startReceivingMessages();

module.exports = app;