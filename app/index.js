const log = require("../helpers/log");
const { grabCards } = require("./cardList");
const { getSpyCard } = require("./getSpyCard");
const formatAllUsers = require("../helpers/formatAllUsers");

module.exports = io => {
  let state = "setup";
  let gameCards = [];
  let lockCards = false;
  let spyCard = [];
  let lockSpyCard = false;
  let clickedCard = null;
  let allUsers = [];
  let blueOverwatch = {};
  let redOverwatch = {};
  let ping = null;
  let pong = null;

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

    const getGameInfo = username => {
      return {
        state,
        gameCards,
        spyCard: isOverwatch(username) ? spyCard : [],
        clickedCard,
        allUsers,
        lockCards,
        lockSpyCard,
        totalOverwatch: getTotalOverWatch()
      };
    };
    const sendAllGameInfo = () => {
      allUsers.forEach(user => {
        io.to(`${user.socketId}`).emit("gameinfo", getGameInfo(user.username));
      });
    };

    // ========================PINGPONG========================= //
    socket.on("clientping", () => socket.emit("serverpong"));
    socket.on("clientpong", () => {
      log("Ponged by ${socket.id}");
      pong = socket.id;
    });
    const testPing = socketId => {
      ping = socketId;
      io.to(socketId).emit("serverping");
      return new Promise(res => setTimeout(() => res(ping === pong), 3000));
    };

    // ========================LOGIN=========================== //
    let pinging = false;
    const logging = async (username, socket) => {
      if (pinging) return;
      pinging = true;
      if (!username.trim().length) return;
      const index = allUsers.findIndex(soc => soc.username === username);
      if (index !== -1) {
        const socketId = allUsers[index].socketId;
        const inUse = await testPing(socketId);
        log(socketId, inUse);
        if (inUse) {
          log(`Username ${username} already in use!`);
          socket.emit("logagain", false);
          ping = null;
          pong = null;
          return (pinging = false);
        } else {
          allUsers = allUsers.map(soc =>
            soc.username === username ? { username, socketId: socket.id } : soc
          );
        }
      } else allUsers.push({ username, socketId: socket.id });
      log("Logging in");
      socket.emit("loggedin", username);
      socket.broadcast.emit("newuser", formatAllUsers(allUsers));
      sendAllGameInfo();
      pinging = false;
    };
    socket.on("login", username => logging(username, socket));
    socket.on("re-login", username => logging(username, socket));

    // =========================OVERWATCH========================== //

    socket.on("selectoverwatch", ({ username, isBlue }) => {
      if (state !== "setup") return;
      if (
        (isBlue && blueOverwatch.socketId) ||
        (!isBlue && redOverwatch.socketId)
      ) {
        log("overwatch already assigned");
        log(blueOverwatch, redOverwatch);
        return socket.emit(
          "overwatchassigned",
          `${isBlue ? "Blue" : "Red"} Overwatch is already assigned`
        );
      }
      const user = allUsers.find(
        soc => soc.username === username && soc.socketId === socket.id
      );
      if (!user) return socket.emit("logagain", false);
      if (
        blueOverwatch.username === username ||
        redOverwatch.username === username
      )
        return socket.emit(
          "overwatchassigned",
          "You are already assigned to an overwatch"
        );
      log("We overwatchin' now");
      if (isBlue) blueOverwatch = user;
      else redOverwatch = user;
      log(blueOverwatch, redOverwatch);
      socket.emit("assignedoverwatch", {
        username,
        overwatch: isBlue ? "blue" : "red"
      });
      socket.broadcast.emit(
        "newoverwatch",
        `New ${isBlue ? "blue" : "red"} overwatch: ${username}`
      );
      sendAllGameInfo();
    });

    socket.on("nooverwatch", user => {
      if (state !== "setup") return;
      if (blueOverwatch.socketId === socket.id) blueOverwatch = {};
      if (redOverwatch.socketId === socket.id) redOverwatch = {};
      socket.emit("assignedoverwatch", {
        username: user.username,
        overwatch: false
      });
      socket.emit("securespycard");
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
