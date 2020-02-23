import RandomNumberGenny from "../helpers/RandomNumberGenny";
import SpyGame from "./SpyGame";

export enum GameType {
    roomPlay = 1,
    internetPlay = 2
}

export default class GameManager {
    RNG: RandomNumberGenny;
    gameList: { [key: string]: SpyGame };

    constructor() {
        this.RNG = new RandomNumberGenny(32);
        this.gameList = {};
    }

    // This will eventually decide between two game types:
    //     "Over the Internet" or "One room"↓↓
    // Right now, we're assuming one room.  ↓↓
    createGame = (
        username: string,
        socketId: string,
        gameType: GameType | null
    ): SpyGame => {
        const ID: string = this.RNG.generate();
        const game: SpyGame = new SpyGame(this, ID);
        game.addUser(username, socketId);
        this.gameList[ID] = game;
        return this.gameList[ID];
    };

    findGame = (ID: string): SpyGame => this.gameList[ID];

    findGameWithSocketId = (socketId: string): SpyGame | undefined => {
        // Iterate over all of our games to see if our socketId
        //     exists in there.
        // THIS CAN BE SLOW, SO USE SPARINGLY.
        return Object.values(this.gameList).find(spyGame =>
            spyGame.findUser(socketId)
        );
    };

    joinGame = (
        username: string,
        socketId: string,
        ID: string
    ): SpyGame | undefined => {
        const game = this.gameList[ID];
        if (game) {
            game.addUser(username, socketId);
        }
        return game;
    };

    leaveGame = (socketId: string, ID: string): number => {
        const game = this.gameList[ID];
        if (game) {
            game.removeUser(socketId);
            return 1;
        }
        return 0;
    };

    removeGame = (ID: string): void => {
        delete this.gameList[ID];
        this.RNG.remove(ID);
    };
}
