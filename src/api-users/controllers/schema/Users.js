const mongoose = require("mongoose");

const usersSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    id: Number,
    userName: String,
    fullName: String,   
    kudosQTY: Number
});

var usersModel = mongoose.model("Users", usersSchema);

module.exports = usersModel;