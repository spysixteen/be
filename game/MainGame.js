const TurnClass = require("./TurnClass")

module.exports = ({
    _cards,
    _spyCard,
    _blueTeam,
    _blueLeader,
    _redTeam,
    _redLeader
  }) => {
    /*
      Card: {
          id: index,
          text: word,
          spy: 0, 1, 2, or 3
          checked: whether we've checked the card or not
      }
      */
    let cards = _cards.map(val => ({ ...val, checked: false }));
  
    /*
      SpyCard: {
          id: index,
          tile: 0, 1, 2, or 3
      }
      */
    let spyCard = _spyCard;
  
    // Array of team socket ids
    let blueSnipers = _blueSnipers;
    let redSnipers = _redSnipers;
  
    // socket ids of the team leaders
    let blueLeader = _blueLeader;
    let redLeader = _redLeader;
  
    // 0 = red, 1 = blue
    let turn = 0
  
    // State of game: setup, play, complete
    let state = "setup";
  
    const confirmGame = () => {
      const redTotal = cards.reduce(
        (prev, curr) => (curr === 2 ? ++prev : prev),
        0
      );
      const blueTotal = cards.reduce(
        (prev, curr) => (curr === 1 ? ++prev : prev),
        0
      );
  
      if (blueTotal === 8) return winGame(1);
      if (redTotal === 9) return winGame(0);
      else {
        if (turn) {
            turn = 0;
            redSniper = redSniper+1 >= redTeam.length
        }
        return {
          state
        };
      }
    };
  
    const loseGame = turn => {
      state = "complete";
      return {
        state,
        victory: turn ? redTeam : blueTeam,
        defeat: turn ? blueTeam : redTeam,
        message: "The Assassin! Sneaky Pest."
      };
    };
  
    const getCards = () => cards;
    const getState = () => state;
  
    const checkCard = id => {
      if (state !== "play") return;
      cards[id].spy = spyCard[id].tile;
      cards[id].checked = true;
      if (cards[id].spy === 3) return loseGame(turn);
      else return confirmGame();
    };
  
    return {};
  };
  