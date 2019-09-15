const mongoose = require("mongoose");

mongoose.connect("mongodb://ku2:Password123@localhost:27017/user"
                ,{ 
                    useNewUrlParser: true,
                    useUnifiedTopology: true
                });

const mongodb = mongoose.connection;

mongodb.on('error', console.error.bind(console, 'connection error:'));

mongodb.once('open', function() {
  console.log("Connected to MongoDB users database");
});

module.exports = mongodb;