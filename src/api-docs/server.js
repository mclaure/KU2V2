'use strict';

var express = require('express');
var argv = require('minimist')(process.argv.slice(2));
var bodyParser = require('body-parser');

var app = express();
var subpath = express();

app.use(bodyParser.json());
app.use("/v1", subpath);

var swagger = require("swagger-node-express").createNew(subpath);

app.use(express.static('dist'));

swagger.setApiInfo({
        title: "example API",
        description: "API to do something, manage something...",
        termsOfServiceUrl: "",
        contact: "yourname@something.com",
        license: "",
        licenseUrl: ""
});

app.get('/', function (req, res) {
        res.sendFile(__dirname + '/dist/index.html');
});

swagger.configureSwaggerPaths('', 'api-docs', '');

// Configure the API port
var PORT = process.env.PORT || 6060;
var DOMAIN = process.env.DOMAIN || 'localhost';

// Set and display the application URL
var applicationUrl = 'http://' + DOMAIN + ':' + PORT;
console.log('Swagger client running on ' + applicationUrl);

swagger.configure(applicationUrl, '1.0.0');

// Start the web server
app.listen(PORT);
