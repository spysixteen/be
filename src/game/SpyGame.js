const { grabCards } = require("../helpers/cardList");
const { getSpyCard } = require("../helpers/getSpyCard");

module.exports = class SpyGame {
    constructor(manager, ID) {
        this.manager = manager;
        this.ID = ID;

        this.state = "setup";
        this.endGameVictor = 0;

        this.gameCards = grabCards(); // Array of 25 cards
        this.lockCards = false;

        this.spyCard = getSpyCard(); // Array of values, 0/1/2/3
        this.lockSpyCard = false;

        this.clickedCard = null;

        this.allUsers = [];
        this.blueOverwatch = null; // socketId of overwatch
        this.redOverwatch = null; // users from allUsers array
    }
    /*
  =========================================================
  Object Structure:

  blue = 1, red = 2, assassin = 3
  this.state = "setup" | "gaming" | "finish"
  endGameVictor = 0 | 1 | 2

  user: {
    username:  string;
    socketId:  string;
    overwatch: 0|1|2 ←←← REMOVE THIS?
  }
  card: {
    id:       number;
    text:     string;
    spy:      0|1|2|3;
    clicked:  bool;
    revealed: bool;
  }

  =========================================================
  */

    findUser = socketId =>
        this.allUsers.find(user => user.socketId === socketId);

    addUser = (username, socketId) => {
        // If it doesn't already exist in our array, add it in!
        if (!this.allUsers.find(user => user.socketId === socketId))
            this.allUsers.push({ username, socketId, overwatch: 0 });
    };

    removeUser = socketId => {
        // If the user is an overwatch, remove them first
        this.removeOverwatch(socketId);
        // Remove user from allUsers.
        this.allUsers = this.allUsers.filter(
            user => user.socketId !== socketId
        );
        // If allUsers becomes empty, removeGame.
        if (!this.allUsers.length) this.manager.removeGame(this.ID);
    };

    isOverwatch = socketId =>
        this.blueOverwatch === socketId || this.redOverwatch === socketId;

    getTotalOverwatch = () =>
        this.blueOverwatch && this.redOverwatch
            ? 2
            : this.blueOverwatch || this.redOverwatch
            ? 1
            : 0;

    getGameInfo = socketId => ({
        state: this.state,
        endGameVictor: this.endGameVictor,
        gameCards: this.gameCards,
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

    becomeOverwatch = socketId => {
        if (this.state !== "setup") return;
        const user = this.findUser(socketId);

        // No user? Return -1
        if (!user) return -1;

        // Already set up as an overwatch? return
        if (user.overwatch) return user.overwatch;

        // Find an open spot if there is one,
        //     and assign it.
        if (!this.blueOverwatch) {
            this.blueOverwatch = socketId;
            user.overwatch = 1;
        } else if (!this.redOverwatch) {
            this.redOverwatch = socketId;
            user.overwatch = 2;
        }

        // If we were assigned, this number will no longer be a zero.
        //     If overwatch is already taken, user.overwatch is zero.
        return user.overwatch;
    };

    removeOverwatch = socketId => {
        if (this.state !== "setup") return;
        const user = this.findUser(socketId);

        // No user? Return 1 for "Yes, we have an error"
        if (!user) return 1;

        user.overwatch = 0;
        if (this.blueOverwatch === socketId) this.blueOverwatch = null;
        if (this.redOverwatch === socketId) this.redOverwatch = null;
        return 0;
    };

    shuffleCards = () => {
        if (!this.lockCards && this.state === "setup")
            this.gameCards = grabCards();
    };

    lockGameCards = () => {
        if (this.state === "setup") this.lockCards = true;
    };

    unlockGameCards = () => {
        if (this.state === "setup") this.lockCards = false;
    };

    shuffleSpyCard = socketId => {
        if (this.state === "setup" && this.isOverwatch(socketId))
            this.spyCard = getSpyCard();
    };

    // To differentiate from the property this.lockSpyCard
    _lockSpyCard = socketId => {
        if (this.state === "setup" && this.isOverwatch(socketId))
            this.lockSpyCard = true;
    };

    unlockSpyCard = socketId => {
        if (this.state === "setup" && this.isOverwatch(socketId))
            this.lockSpyCard = false;
    };

    startGame = () => {
        const missing = [];
        if (!this.lockCards) missing.push("gameCards");
        if (!this.lockSpyCard) missing.push("spyCard");
        if (!this.redOverwatch && !this.blueOverwatch)
            missing.push("overwatch");

        if (missing.length) return missing;
        this.state = "gaming";
    };

    /* 
  ===========================================
  ==                                       ==
  ==              GAMIN' PHASE             ==
  ==                                       ==
  ===========================================
  */

    clickCard = (socketId, clickedCard) => {
        // If we're not gaming,
        //     we ARE overwatch,
        //     or the card is already revealed -> return.
        if (
            this.state !== "gaming" ||
            this.isOverwatch(socketId) ||
            clickedCard.revealed
        )
            return;

        this.gameCards = this.gameCards.map(card =>
            card.id === clickedCard.id
                ? { ...card, clicked: true }
                : { ...card, clicked: false }
        );
        this.clickedCard = this.gameCards[clickedCard.id];
    };

    revealCard = socketId => {
        // If we're not gaming,
        //     we AREN'T overwatch,
        //     or there isn't a clicked card -> return.
        if (
            this.state !== "gaming" ||
            !this.isOverwatch(socketId) ||
            !this.clickedCard
        )
            return;

        const card = this.gameCards[this.clickedCard.id];
        card.spy = this.spyCard[this.clickedCard.id].tile;
        card.clicked = false;
        card.revealed = true;

        // Check if the game has ended. If so, end the game
        const winState = this.checkWin();
        if (winState) this.endGame(winState);
    };

    // Reduce our gameCards array to a single value
    // If the card is revealed and isn't a civilian,
    //     it has a spy value.
    // If we only check the .spy property, we can see
    //     all of the cards that are revealed,
    //     and are the red/blue/assassin type that
    //     we pass in.
    revealedTotal = type =>
        this.gameCards.reduce(
            (prev, curr) => (curr.spy === type ? ++prev : prev),
            0
        );

    checkWin = () => {
        if (this.revealedTotal(1) === 8) return 1;
        if (this.revealedTotal(2) === 9) return 2;
        if (this.revealedTotal(3)) return 3;
        return 0;
    };

    endGame = winState => {
        this.state = "finish";
        this.endGameVictor = winState;
    };

    /* 
  ===========================================
  ==                                       ==
  ==              FINISH PHASE             ==
  ==                                       ==
  ===========================================
  */

    resetGame = () => {
        if (this.state !== "finish") return;

        // Reset all of our values ↓↓
        this.state = "setup";
        this.endGameVictor = 0;

        this.gameCards = grabCards(); // Array of 25 cards
        this.lockCards = false;

        this.spyCard = getSpyCard(); // Array of values, 0/1/2/3
        this.lockSpyCard = false;

        this.clickedCard = null;

        this.blueOverwatch = null; // socketId of overwatch
        this.redOverwatch = null; // users from allUsers array
    };
};
