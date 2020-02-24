import { Server, Socket } from "socket.io";
import log from "../helpers/log";
import GameManager from "../game/GameManager";
import SpyGame from "../game/SpyGame";
import GameCard from "../entities/GameCard";
import User from "../entities/User";

export default (io: Server): Function => {
    const gameManager: GameManager = new GameManager();

    return (socket: Socket): void => {
        log("socket Connection");
        log(socket.id);

        const sendAllGameInfo = (spyGame: SpyGame): void => {
            spyGame.AllUsers.forEach((user: User) => {
                io.to(`${user.socketId}`).emit(
                    "gameinfo",
                    spyGame.getGameInfo(user.socketId)
                );
            });
        };

        // =====================CREATING ROOM======================== //
        socket.on("newroom", ({ username }: { username: string }): void => {
            const spyGame = gameManager.createGame(username, socket.id);
            log("Logging in");
            socket.emit("loggedin", {
                user: spyGame.findUser(socket.id),
                roomID: spyGame.getID
            });
            sendAllGameInfo(spyGame);
        });

        // =====================JOINING ROOM======================== //
        socket.on(
            "joinroom",
            ({
                username,
                roomID
            }: {
                username: string;
                roomID: string;
            }): void => {
                const spyGame = gameManager.joinGame(
                    username,
                    socket.id,
                    roomID
                );
                if (spyGame) {
                    log("Logging in");
                    socket.emit("loggedin", {
                        user: spyGame.findUser(socket.id),
                        roomID: spyGame.getID
                    });
                    sendAllGameInfo(spyGame);
                } else
                    socket.emit(
                        "logagain",
                        "The room you're trying to join doesn't exist!"
                    );
            }
        );

        // =========================OVERWATCH========================== //

        socket.on("selectoverwatch", ({ roomID }: { roomID: string }): void => {
            // Get our game.
            // If it doesn't exist or is already going, return.
            const spyGame = gameManager.findGame(roomID);
            if (!spyGame) return;

            // Get our overwatchID
            const overwatchID = spyGame.becomeOverwatch(socket.id);
            if (overwatchID === -1) {
                socket.emit("logagain", "You are not a player in this game!");
                return;
            }
            if (overwatchID === 0) {
                log("overwatch already assigned");
                socket.emit(
                    "overwatchassigned",
                    `Overwatch is already assigned`
                );
                return;
            }
            log("We overwatchin' now");
            socket.emit("assignedoverwatch", spyGame.findUser(socket.id));
            sendAllGameInfo(spyGame);
        });

        socket.on("nooverwatch", ({ roomID }: { roomID: string }): void => {
            // Get our game.
            // If it doesn't exist or is already going, return.
            const spyGame = gameManager.findGame(roomID);
            if (!spyGame) return;

            const error = spyGame.removeOverwatch(socket.id);
            if (error === -1) {
                socket.emit("logagain", "You are not a player in this game!");
                return;
            }
            socket.emit("assignedoverwatch", spyGame.findUser(socket.id));
            sendAllGameInfo(spyGame);
        });

        // =========================CARDS========================== //

        socket.on("getcards", ({ roomID }: { roomID: string }): void => {
            // Get our game.
            // If it doesn't exist or is already going, return.
            const spyGame = gameManager.findGame(roomID);
            if (!spyGame) return;

            spyGame.shuffleCards();
            sendAllGameInfo(spyGame);
        });

        socket.on("confirmcards", ({ roomID }: { roomID: string }): void => {
            // Get our game.
            // If it doesn't exist or is already going, return.
            const spyGame = gameManager.findGame(roomID);
            if (!spyGame) return;

            spyGame.lockGameCards();
            sendAllGameInfo(spyGame);
        });

        // =========================SPYCARDS========================== //

        socket.on("getspycard", ({ roomID }: { roomID: string }): void => {
            // Get our game.
            // If it doesn't exist or is already going, return.
            const spyGame = gameManager.findGame(roomID);
            if (!spyGame) return;

            spyGame.shuffleSpyCard(socket.id);
            sendAllGameInfo(spyGame);
        });

        socket.on("confirmspycard", ({ roomID }: { roomID: string }): void => {
            // Get our game.
            // If it doesn't exist or is already going, return.
            const spyGame = gameManager.findGame(roomID);
            if (!spyGame) return;

            spyGame.golockSpyCard(socket.id);
            sendAllGameInfo(spyGame);
        });

        // ===================STARTING GAME============================ //

        socket.on("startgame", ({ roomID }: { roomID: string }): void => {
            // Get our game.
            // If it doesn't exist or is already going, return.
            const spyGame = gameManager.findGame(roomID);
            if (!spyGame) return;

            // Start the game.
            // If we're missing something, tell the user
            const missing = spyGame.startGame();
            if (missing) socket.emit("gamefail", { missing });
            else {
                log("Starting the game");
                sendAllGameInfo(spyGame);
            }
        });

        // =======================IN THE GAME======================= //
        socket.on(
            "clickcard",
            ({
                roomID,
                clickedCard
            }: {
                roomID: string;
                clickedCard: GameCard;
            }): void => {
                log(clickedCard);
                // Get our game.
                // If it doesn't exist or is already going, return.
                const spyGame = gameManager.findGame(roomID);
                if (!spyGame) return;

                spyGame.clickCard(socket.id, clickedCard);
                sendAllGameInfo(spyGame);
            }
        );

        socket.on("revealcard", ({ roomID }: { roomID: string }): void => {
            // Get our game.
            // If it doesn't exist or is already going, return.
            const spyGame = gameManager.findGame(roomID);
            if (!spyGame) return;

            spyGame.revealCard(socket.id);
            sendAllGameInfo(spyGame);
        });

        socket.on("resetall", ({ roomID }: { roomID: string }): void => {
            // Get our game.
            // If it doesn't exist or is already going, return.
            const spyGame = gameManager.findGame(roomID);
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
