const mongoose = require("mongoose");

mongoose.connect("mongodb://svc:Password123@localhost:27017/kudos"
                ,{ 
                    useNewUrlParser: true 
                });

const mongodb = mongoose.connection;

mongodb.on('error', console.error.bind(console, 'connection error:'));

mongodb.once('open', function() {
  console.log("Connected to MongoDB database");
});

module.exports = mongodb;