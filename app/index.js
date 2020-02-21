const log = require("../helpers/log");
const { grabCards } = require("./cardList");
const { getSpyCard } = require("./getSpyCard");
const formatAllUsers = require("../helpers/formatAllUsers");
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

    const getTotalOverWatch = () =>
      blueOverwatch.socketId
        ? redOverwatch.socketId
          ? 2
          : 1
        : redOverwatch.socketId
        ? 1
        : 0;

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

    socket.on("getcards", () => {
      if (!lockCards && state === "setup") {
        log("They're askin' for cards!");
        gameCards = grabCards().map((val, id) => ({
          id,
          text: val,
          spy: 0,
          checked: false,
          revealed: false
        }));
      }
      sendAllGameInfo();
    });

    socket.on("confirmcards", () => {
      if (!lockCards && state === "setup") {
        log("Cards confirmed");
        lockCards = true;
      }
      sendAllGameInfo();
    });

    // =========================SPYCARDS========================== //

    const canChangeSpyCard = username =>
      state === "setup" && !lockSpyCard && isOverwatch(username);

    socket.on("getspycard", username => {
      if (canChangeSpyCard(username)) {
        log("Spy cards, gettin' ready!");
        spyCard = getSpyCard().map((tile, id) => ({ id, tile }));
      }
      sendAllGameInfo();
    });

    socket.on("confirmspycard", username => {
      if (canChangeSpyCard(username) && spyCard.find(val => val.tile === 3)) {
        log("We're setting the spy card");
        lockSpyCard = true;
      }
      sendAllGameInfo();
    });

    // ===================STARTINGGAME============================ //

    socket.on("startgame", () => {
      if (state === "setup") {
        const missing = [];
        if (!gameCards.length) missing.push("gameCards");
        if (!spyCard.length) missing.push("spyCard");
        if (!redOverwatch) missing.push("redOverwatch");
        if (!blueOverwatch) missing.push("blueOverwatch!");

        if (missing.length) io.emit("gamefail", { missing });
        else {
          log("Starting the game");
          state = "gaming";
        }
      }
      sendAllGameInfo();
    });

    // =======================IN THE GAME======================= //
    socket.on("clickcard", ({ username, _clickedCard }) => {
      log(_clickedCard);
      if (
        state === "gaming" &&
        !isOverwatch(username) &&
        !_clickedCard.revealed
      ) {
        log(`Clicked card with id ${_clickedCard.id}`);
        clickedCard = _clickedCard;
        gameCards = gameCards.map(card =>
          card.id === _clickedCard.id
            ? { ...card, checked: true }
            : { ...card, checked: false }
        );
      }
      sendAllGameInfo();
    });

    socket.on("revealcard", username => {
      if (isOverwatch(username) && state === "gaming" && clickedCard) {
        log("revealing card with id " + clickedCard.id);
        gameCards[clickedCard.id].spy = spyCard[clickedCard.id].tile;
        gameCards[clickedCard.id].checked = false;
        gameCards[clickedCard.id].revealed = true;
      }
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
