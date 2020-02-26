import socket from "socket.io";
import server from "./server";
import app from "./app/index";
import log from "./helpers/log";

// PORT we will listen on
const PORT = process.env.PORT || 2019;

// Create serverInstance so we can connect via webSocket
const serverInstance = server.listen(PORT, () =>
    /* eslint-disable */
    console.log(`\n=== Listening on post ${PORT} ===\n`)
);

// Connect via webSocket
const io = socket(serverInstance, {origins: "*:*"});
io.on("connection", app(io));
log("io socket ready");
