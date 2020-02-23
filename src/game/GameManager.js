const RandomNumberGenny = require("../helpers/RandomNumberGenny");
const SpyGame = require("./SpyGame");

module.exports = class GameManager {
    constructor() {
        this.RNG = new RandomNumberGenny(32);
        this.gameList = {};
    }

    // This will eventually decide between two game types:
    //     "Over the Internet" or "One room"↓↓
    // Right now, we're assuming one room.  ↓↓
    createGame = (username, socketId, gameType) => {
        const ID = this.RNG.generate();
        const game = new SpyGame(this, ID);
        game.addUser(username, socketId);
        this.gameList[ID] = game;
        return [ID, this.gameList[ID]];
    };

    findGame = ID => [ID, this.gameList[ID]];

    findGameWithSocketId = socketId => {
        // Iterate over all of our games to see if our socketId
        //     exists in there.
        // THIS CAN BE SLOW, SO USE SPARINGLY.
        return Object.values(this.gameList).find(spyGame =>
            spyGame.findUser(socketId)
        );
    };

    joinGame = (username, socketId, ID) => {
        const game = this.gameList[ID];
        if (game) {
            game.addUser(username, socketId);
        }
        return [ID, game];
    };

    leaveGame = (socketId, ID) => {
        const game = this.gameList[ID];
        if (game) {
            game.removeUser(socketId);
            return 1;
        }
        return null;
    };

    removeGame = ID => {
        delete this.gameList[ID];
        this.RNG.remove(ID);
    };
};
