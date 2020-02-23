const log = require("../helpers/log");
const GameManager = require("../game/GameManager");

module.exports = io => {
    const gameManager = new GameManager();

    return socket => {
        log("socket Connection");
        log(socket.id);

        const sendAllGameInfo = spyGame => {
            spyGame.allUsers.forEach(user => {
                io.to(`${user.socketId}`).emit(
                    "gameinfo",
                    spyGame.getGameInfo(user.socketId)
                );
            });
        };

        // =====================CREATING ROOM======================== //
        socket.on("newroom", ({ username }) => {
            const [ID, spyGame] = gameManager.createGame(username, socket.id);
            log("Logging in");
            socket.emit("loggedin", {
                user: spyGame.findUser(socket.id),
                roomID: ID
            });
            sendAllGameInfo(spyGame);
        });

        // =====================JOINING ROOM======================== //
        socket.on("joinroom", ({ username, roomID }) => {
            const [ID, spyGame] = gameManager.joinGame(
                username,
                socket.id,
                roomID
            );
            if (spyGame) {
                log("Logging in");
                socket.emit("loggedin", {
                    user: spyGame.findUser(socket.id),
                    roomID: ID
                });
                sendAllGameInfo(spyGame);
            } else
                socket.emit(
                    "logagain",
                    "The room you're trying to join doesn't exist!"
                );
        });

        // =========================OVERWATCH========================== //

        socket.on("selectoverwatch", ({ roomID }) => {
            // Get our game.
            // If it doesn't exist or is already going, return.
            const [ID, spyGame] = gameManager.findGame(roomID);
            if (!spyGame) return;

            // Get our overwatchID
            const overwatchID = spyGame.becomeOverwatch(socket.id);
            if (overwatchID === -1) {
                return socket.emit(
                    "logagain",
                    "You are not a player in this game!"
                );
            }
            if (overwatchID === 0) {
                log("overwatch already assigned");
                log(spyGame.blueOverwatch, spyGame.redOverwatch);
                return socket.emit(
                    "overwatchassigned",
                    `Overwatch is already assigned`
                );
            }
            log("We overwatchin' now");
            log(spyGame.blueOverwatch, spyGame.redOverwatch);
            socket.emit("assignedoverwatch", spyGame.findUser(socket.id));
            sendAllGameInfo(spyGame);
        });

        socket.on("nooverwatch", ({ roomID }) => {
            // Get our game.
            // If it doesn't exist or is already going, return.
            const [ID, spyGame] = gameManager.findGame(roomID);
            if (!spyGame) return;

            const error = spyGame.removeOverwatch(socket.id);
            if (error) {
                return socket.emit(
                    "logagain",
                    "You are not a player in this game!"
                );
            }
            socket.emit("assignedoverwatch", spyGame.findUser(socket.id));
            sendAllGameInfo(spyGame);
        });

        // =========================CARDS========================== //

        socket.on("getcards", ({ roomID }) => {
            // Get our game.
            // If it doesn't exist or is already going, return.
            const [ID, spyGame] = gameManager.findGame(roomID);
            if (!spyGame) return;

            spyGame.shuffleCards();
            sendAllGameInfo(spyGame);
        });

        socket.on("confirmcards", ({ roomID }) => {
            // Get our game.
            // If it doesn't exist or is already going, return.
            const [ID, spyGame] = gameManager.findGame(roomID);
            if (!spyGame) return;

            spyGame.lockGameCards();
            sendAllGameInfo(spyGame);
        });

        // =========================SPYCARDS========================== //

        socket.on("getspycard", ({ roomID }) => {
            // Get our game.
            // If it doesn't exist or is already going, return.
            const [ID, spyGame] = gameManager.findGame(roomID);
            if (!spyGame) return;

            spyGame.shuffleSpyCard(socket.id);
            sendAllGameInfo(spyGame);
        });

        socket.on("confirmspycard", ({ roomID }) => {
            // Get our game.
            // If it doesn't exist or is already going, return.
            const [ID, spyGame] = gameManager.findGame(roomID);
            if (!spyGame) return;

            spyGame._lockSpyCard(socket.id);
            sendAllGameInfo(spyGame);
        });

        // ===================STARTING GAME============================ //

        socket.on("startgame", ({ roomID }) => {
            // Get our game.
            // If it doesn't exist or is already going, return.
            const [ID, spyGame] = gameManager.findGame(roomID);
            if (!spyGame) return;

            // Start the game.
            // If we're missing something, tell the user
            const missing = spyGame.startGame();
            if (missing) return socket.emit("gamefail", { missing });

            log("Starting the game");
            sendAllGameInfo(spyGame);
        });

        // =======================IN THE GAME======================= //
        socket.on("clickcard", ({ roomID, clickedCard }) => {
            log(clickedCard);
            // Get our game.
            // If it doesn't exist or is already going, return.
            const [ID, spyGame] = gameManager.findGame(roomID);
            if (!spyGame) return;

            spyGame.clickCard(socket.id, clickedCard);
            sendAllGameInfo(spyGame);
        });

        socket.on("revealcard", ({ roomID }) => {
            // Get our game.
            // If it doesn't exist or is already going, return.
            const [ID, spyGame] = gameManager.findGame(roomID);
            if (!spyGame) return;

            spyGame.revealCard(socket.id);
            sendAllGameInfo(spyGame);
        });

        socket.on("resetall", ({ roomID }) => {
            // Get our game.
            // If it doesn't exist or is already going, return.
            const [ID, spyGame] = gameManager.findGame(roomID);
            if (!spyGame) return;

            spyGame.resetGame();
            sendAllGameInfo(spyGame);
        });

        // =========================DISCONNECT=========================== //

        socket.on("disconnect", () => {
            log(`Goodbye ${socket.id} :wave:`);
            const spyGame = gameManager.findGameWithSocketId(socket.id);
            if (spyGame) spyGame.removeUser(socket.id);
        });
    };
};
