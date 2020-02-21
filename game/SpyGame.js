module.exports = class SpyGame {
  constructor() {
    this.state = "setup";

    this.gameCards = [];
    this.lockCards = false;

    this.spyCard = []; // Array of values, 0/1/2/3
    this.lockSpyCard = false;

    this.clickedCard = null;

    this.allUsers = [];
    this.blueOverwatch = null; // socketId of overwatch
    this.redOverwatch = null; // users from allUsers array
  }
  /*
  =========================================================
  Object Structure:

  blue = 1, red = 2

  user: {
    username: string;
    socketId: string;
    overwatch: 0|1|2
  }
  card: {
    id: number;
    text: string;
    spy: 0|1|2|3;
    clicked: bool;
    revealed: bool;
  }

  =========================================================
  */

  addUser = (username, socketId) => {
    // If it doesn't already exist in our array, add it in!
    if (!this.allUsers.find(user => user.socketId === socketId))
      this.allUsers.push({ username, socketId, overwatch: 0 });
  };

  removeUser = socketId =>
    this.allUsers.filter(user => user.socketId !== socketId);

  isOverWatch = socketId =>
    this.blueOverwatch === socketId || this.redOverwatch === socketId;

  getTotalOverWatch = () =>
    this.blueOverwatch && this.redOverwatch
      ? 2
      : this.blueOverwatch || this.redOverwatch
      ? 1
      : 0;

  getGameInfo = socketId => ({
    state = this.state,
    gameCards: this.gameCards,
    spyCard: this.isOverwatch(socketId) ? this.spyCard : [],
    clickedCard: this.clickedCard,
    allUsers: this.allUsers,
    lockCards: this.lockCards,
    lockSpyCard: this.lockSpyCard,
    totalOverwatch: this.getTotalOverWatch()
  });
};
