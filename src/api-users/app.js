const express = require("express");
const bodyparser = require("body-parser");
const cors = require("cors");
const routes = require("./routes/routes");

const app = express();
app.use(cors());
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({extended:false}));
routes(app);

module.exports = app;