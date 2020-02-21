const log = require("../helpers/log");
const { getSpyCard } = require("../helpers/getSpyCard");
const GameManager = require("../game/GameManager");

module.exports = io => {
  const gameManager = new GameManager();
  let state = "setup";
  let gameCards = [];
  let lockCards = false;
  let spyCard = [];
  let lockSpyCard = false;
  let clickedCard = null;
  let allUsers = [];
  let blueOverwatch = {};
  let redOverwatch = {};

  return socket => {
    log("socket Connection");
    log(socket.id);

    const isOverwatch = username =>
      blueOverwatch.username === username || redOverwatch.username === username;

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
      socket.emit("loggedin", username);
      sendAllGameInfo(spyGame);
    });

    // =====================JOINING ROOM======================== //
    socket.on("joinroom", ({ username, roomID }) => {
      const [ID, spyGame] = gameManager.joinGame(username, socket.id, roomID);
      if (spyGame) {
        log("Logging in");
        socket.emit("loggedin", username);
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
      if (!spyGame || spyGame.state !== "setup") return;

      // Get our overwatchID
      const overwatchID = spyGame.becomeOverwatch(socket.id);
      if (overwatchID === -1) {
        return socket.emit("logagain", "You are not a player in this game!");
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
      sendAllGameInfo();
    });

    socket.on("nooverwatch", ({ roomID }) => {
      // Get our game.
      // If it doesn't exist or is already going, return.
      const [ID, spyGame] = gameManager.findGame(roomID);
      if (!spyGame || spyGame.state !== "setup") return;

      const error = spyGame.removeOverwatch(socket.id);
      if (error) {
        return socket.emit("logagain", "You are not a player in this game!");
      }
      sendAllGameInfo();
    });

    // =========================CARDS========================== //

    socket.on("getcards", ({ roomID }) => {
      // Get our game.
      // If it doesn't exist or is already going, return.
      const [ID, spyGame] = gameManager.findGame(roomID);
      if (!spyGame || spyGame.state !== "setup") return;

      spyGame.shuffleCards();
      sendAllGameInfo();
    });

    socket.on("confirmcards", ({ roomID }) => {
      // Get our game.
      // If it doesn't exist or is already going, return.
      const [ID, spyGame] = gameManager.findGame(roomID);
      if (!spyGame || spyGame.state !== "setup") return;

      spyGame.lockCards();
      sendAllGameInfo();
    });

    // =========================SPYCARDS========================== //

    socket.on("getspycard", ({ roomID }) => {
      // Get our game.
      // If it doesn't exist or is already going, return.
      const [ID, spyGame] = gameManager.findGame(roomID);
      if (!spyGame || spyGame.state !== "setup") return;

      spyGame.shuffleSpyCard();
      sendAllGameInfo();
    });

    socket.on("confirmspycard", username => {
      // Get our game.
      // If it doesn't exist or is already going, return.
      const [ID, spyGame] = gameManager.findGame(roomID);
      if (!spyGame || spyGame.state !== "setup") return;

      spyGame.lockSpyCard();
      sendAllGameInfo();
    });

    // ===================STARTING GAME============================ //

    socket.on("startgame", ({ roomID }) => {
      // Get our game.
      // If it doesn't exist or is already going, return.
      const [ID, spyGame] = gameManager.findGame(roomID);
      if (!spyGame || spyGame.state !== "setup") return;

      // Start the game.
      // If we're missing something, tell the user
      const missing = spyGame.startGame();
      if (missing) return socket.emit("gamefail", { missing });

      log("Starting the game");
      sendAllGameInfo();
    });

    // =======================IN THE GAME======================= //
    socket.on("clickcard", ({ roomID, clickedCard }) => {
      log(_clickedCard);
      // Get our game.
      // If it doesn't exist or is already going, return.
      const [ID, spyGame] = gameManager.findGame(roomID);
      if (!spyGame || spyGame.state !== "setup") return;

      spyGame.clickCard(socket.id, clickedCard);
      sendAllGameInfo();
    });

    socket.on("revealcard", ({ roomID }) => {
      // Get our game.
      // If it doesn't exist or is already going, return.
      const [ID, spyGame] = gameManager.findGame(roomID);
      if (!spyGame || spyGame.state !== "setup") return;

      spyGame(socket.id);
      sendAllGameInfo();
    });

    socket.on("resetall", password => {
      if (password === "no way dude") {
        io.to(blueOverwatch.socketId).emit("resetall");
        io.to(redOverwatch.socketId).emit("resetall");
        state = "setup";
        gameCards = [];
        lockCards = false;
        spyCard = [];
        lockSpyCard = false;
        clickedCard = null;
        blueOverwatch = {};
        redOverwatch = {};
        ping = null;
        pong = null;
      }
      sendAllGameInfo();
    });

    // =========================DISCONNECT=========================== //

    socket.on("disconnect", () => {
      log(`Goodbye ${socket.id} :wave:`);
      if (blueOverwatch.socketId === socket.id) blueOverwatch = {};
      if (redOverwatch.socketId === socket.id) redOverwatch = {};
      setTimeout(
        () => (allUsers = allUsers.filter(user => user.socketId !== socket.id)),
        5000
      );
      log(allUsers);
    });
  };
};
