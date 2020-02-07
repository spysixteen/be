const express = require("express")
const cors = require("cors")
const helmet = require("helmet")

const server = express()
server.use(helmet())
server.use(express.json())
server.use(cors())

server.get("/", (req, res) => {
    res.status(200).json({ Hello: "World!" })
})

module.exports = server