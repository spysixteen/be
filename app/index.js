const log = require("../helpers/log")

module.exports = io => socket => {
    log("socket Connection")
    log(socket.id)
}