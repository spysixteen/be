import GameManager from "./GameManager";
import User, { ETeam } from "../entities/User";
import getGameCards from "../helpers/getGameCards";
import getSpyCardTiles from "../helpers/getSpyCardTiles";
import GameCard from "../entities/GameCard";
import SpyCardTile from "../entities/SpyCardTile";
import ESpy from "../entities/ESpy";

enum EGameState {
    SETUP = "setup",
    GAMING = "gaming",
    FINISH = "finish"
}

interface IGameInfo {
    state: EGameState;
    endGameVictor: ETeam;
    gameBoard: GameCard[];
    isOverwatch: boolean;
    spyCard: SpyCardTile[];
    clickedCard: GameCard | null;
    allUsers: User[];
    lockCards: boolean;
    lockSpyCard: boolean;
    totalOverwatch: number;
}

export default class SpyGame {
    private manager: GameManager;

    private ID: string;

    private state: EGameState;

    private endGameVictor: ETeam;

    private gameBoard: GameCard[];

    private lockCards: boolean;

    private spyCard: SpyCardTile[];

    private lockSpyCard: boolean;

    private clickedCard: GameCard | null;

    private allUsers: User[];

    public constructor(manager: GameManager, ID: string) {
        this.manager = manager;
        this.ID = ID;

        this.state = EGameState.SETUP;
        this.endGameVictor = ETeam.NONE;

        this.gameBoard = getGameCards(); // Array of 25 cards
        this.lockCards = false;

        this.spyCard = getSpyCardTiles(); // Array of values, 0/1/2/3
        this.lockSpyCard = false;

        this.clickedCard = null;

        this.allUsers = [];
    }
    /*
  =========================================================
  Object Structure:

  card: {
    id:       number;
    text:     string;
    spy:      0|1|2|3;
    clicked:  bool;
    revealed: bool;
  }

  =========================================================
  */

    public get AllUsers(): User[] {
        return this.allUsers;
    }

    public get getID(): string {
        return this.ID;
    }

    findUser = (socketId: string): User | undefined =>
        this.allUsers.find(user => user.socketId === socketId);

    findOverWatch = (team: ETeam): User | undefined =>
        this.allUsers.find(user => user.team === team && user.overwatch);

    addUser = (username: string, socketId: string): void => {
        // If it doesn't already exist in our array, add it in!
        if (!this.allUsers.find(user => user.socketId === socketId))
            this.allUsers.push(new User(username, socketId));
    };

    removeUser = (socketId: string): void => {
        // If the user is an overwatch, remove them first
        this.removeOverwatch(socketId);
        // Remove user from allUsers.
        this.allUsers = this.allUsers.filter(
            user => user.socketId !== socketId
        );
        // If allUsers becomes empty, removeGame.
        if (!this.allUsers.length) this.manager.removeGame(this.ID);
    };

    isOverwatch = (socketId: string): boolean => {
        const checkUser = this.findUser(socketId);
        return checkUser ? checkUser.overwatch : false;
    };

    getTotalOverwatch = (): number =>
        this.allUsers.filter(user => user.overwatch).length;

    getGameInfo = (socketId: string): IGameInfo => ({
        state: this.state,
        endGameVictor: this.endGameVictor,
        gameBoard: this.gameBoard,
        isOverwatch: this.isOverwatch(socketId),
        spyCard: this.isOverwatch(socketId) ? this.spyCard : [],
        clickedCard: this.clickedCard,
        allUsers: this.allUsers,
        lockCards: this.lockCards,
        lockSpyCard: this.lockSpyCard,
        totalOverwatch: this.getTotalOverwatch()
    });

    /* 
  ===========================================
  ==                                       ==
  ==               SETUP PHASE             ==
  ==                                       ==
  ===========================================
  */

    becomeOverwatch = (socketId: string): ETeam | 0 | -1 => {
        if (this.state !== EGameState.SETUP) return 0;
        const user = this.findUser(socketId);

        // No user? Return -1
        if (!user) return -1;
        // Already set up as an overwatch? return their ETeam
        if (user.overwatch) return user.team;

        // Find an open spot if there is one,
        //     and assign it.
        if (!this.findOverWatch(ETeam.BLUE)) {
            user.team = ETeam.BLUE;
            user.overwatch = true;
            return user.team;
        }
        if (!this.findOverWatch(ETeam.RED)) {
            user.team = ETeam.RED;
            user.overwatch = true;
            return user.team;
        }
        // No assignable overwatch? Return 0 '' '
        return 0;
    };

    removeOverwatch = (socketId: string): -1 | undefined => {
        if (this.state !== EGameState.SETUP) return;
        const user = this.findUser(socketId);

        // No user? Return 1 for "Yes, we have an error"
        if (!user) return -1;

        user.overwatch = false;
    };

    shuffleCards = (): void => {
        if (!this.lockCards && this.state === EGameState.SETUP)
            this.gameBoard = getGameCards();
    };

    lockGameCards = (): void => {
        if (this.state === EGameState.SETUP) this.lockCards = true;
    };

    unlockGameCards = (): void => {
        if (this.state === EGameState.SETUP) this.lockCards = false;
    };

    shuffleSpyCard = (socketId: string): void => {
        if (this.state === EGameState.SETUP && this.isOverwatch(socketId))
            this.spyCard = getSpyCardTiles();
    };

    // To differentiate from the property this.lockSpyCard
    golockSpyCard = (socketId: string): void => {
        if (this.state === EGameState.SETUP && this.isOverwatch(socketId))
            this.lockSpyCard = true;
    };

    unlockSpyCard = (socketId: string): void => {
        if (this.state === EGameState.SETUP && this.isOverwatch(socketId))
            this.lockSpyCard = false;
    };

    startGame = (): string[] | undefined => {
        const missing = [];
        if (!this.lockCards) missing.push("gameBoard");
        if (!this.lockSpyCard) missing.push("spyCard");
        if (!this.findOverWatch(ETeam.BLUE) && !this.findOverWatch(ETeam.RED))
            missing.push("overwatch");

        if (missing.length) return missing;
        this.state = EGameState.GAMING;
    };

    /* 
  ===========================================
  ==                                       ==
  ==              GAMIN' PHASE             ==
  ==                                       ==
  ===========================================
  */

    clickCard = (socketId: string, clickedCard: GameCard): void => {
        // If we're not gaming,
        //     we ARE overwatch,
        //     or the card is already revealed -> return.
        if (
            this.state !== EGameState.GAMING ||
            this.isOverwatch(socketId) ||
            clickedCard.revealed
        )
            return;

        this.gameBoard = this.gameBoard.map(card =>
            card.ID === clickedCard.ID
                ? { ...card, clicked: true }
                : { ...card, clicked: false }
        );
        this.clickedCard = this.gameBoard[clickedCard.ID];
    };

    revealCard = (socketId: string): void => {
        // If we're not gaming,
        //     we AREN'T overwatch,
        //     or there isn't a clicked card -> return.
        if (
            this.state !== EGameState.GAMING ||
            !this.isOverwatch(socketId) ||
            !this.clickedCard
        )
            return;

        const card = this.gameBoard[this.clickedCard.ID];
        card.spy = this.spyCard[this.clickedCard.ID].spy;
        card.clicked = false;
        card.revealed = true;

        // Check if the game has ended. If so, end the game
        const winState = this.checkWin();
        if (winState) this.endGame(winState);
    };

    // Reduce our gameBoard array to a single value
    // If the card is revealed and isn't a civilian,
    //     it has a spy value.
    // If we only check the .spy property, we can see
    //     all of the cards that are revealed,
    //     and are the red/blue/assassin type that
    //     we pass in.
    revealedTotal = (type: ESpy): number =>
        this.gameBoard.reduce(
            (prev, curr) => (curr.spy === type ? prev + 1 : prev),
            0
        );

    checkWin = (): 0 | 1 | 2 | 3 => {
        if (this.revealedTotal(1) === 8) return 1;
        if (this.revealedTotal(2) === 9) return 2;
        if (this.revealedTotal(3)) return 3;
        return 0;
    };

    endGame = (winState: ETeam): void => {
        this.state = EGameState.FINISH;
        this.endGameVictor = winState;
    };

    /* 
  ===========================================
  ==                                       ==
  ==              FINISH PHASE             ==
  ==                                       ==
  ===========================================
  */

    resetGame = (): void => {
        if (this.state !== EGameState.FINISH) return;

        // Reset all of our values ↓↓
        this.state = EGameState.SETUP;
        this.endGameVictor = 0;

        this.gameBoard = getGameCards(); // Array of 25 cards
        this.lockCards = false;

        this.spyCard = getSpyCardTiles(); // Array of values, 0/1/2/3
        this.lockSpyCard = false;

        this.clickedCard = null;

        this.allUsers.map(user => {
            if (user.overwatch) {
                return new User(
                    user.username,
                    user.socketId,
                    user.overwatch,
                    user.team
                );
            }
            return user;
        });
    };
}
