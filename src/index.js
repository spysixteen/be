const socket = require("socket.io");
const server = require("./server");
const app = require("./app/index");
const log = require("./helpers/log");

// PORT we will listen on
const PORT = process.env.PORT || 2019;

// Create serverInstance so we can connect via webSocket
const serverInstance = server.listen(PORT, () =>
    console.log(`\n=== Listening on post ${PORT} ===\n`)
);

// Connect via webSocket
const io = socket(serverInstance);
io.on("connection", app(io));
log("io socket ready");
