const http = require("http");
const app  = require("./app");

var HTTP_PORT = process.env.PORT || 5000;
const server = http.createServer(app);

//Start listening for requests
server.listen(HTTP_PORT, () => {
    console.log("Users API Server running on port %PORT%".replace("%PORT%",HTTP_PORT))
});