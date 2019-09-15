const mongoose = require("mongoose");

const kudosSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    id: Number,
    remitente: String,
    destinatario : String,
    fecha: Date,
    lugar: String,
    tema: String,
    texto: String
});

var KudosModel = mongoose.model("Kudos", kudosSchema);

module.exports = KudosModel;