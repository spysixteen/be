import express from "express";
import cors from "cors";
import helmet from "helmet";

const server = express();
server.use(helmet());
server.use(express.json());
server.use(cors());

server.get("/", (req, res) => {
    res.status(200).json({ Hello: "World!" });
});

export default server;
