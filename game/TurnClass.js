module.exports = (_gameClass, _isBluesTurn) => {
  const gameClass = _gameClass;
  const isBluesTurn = _isBluesTurn;
  let phase = 0;

  let message = null; // string
  let spies = null; // number

  const getTurn = () => ({ isBluesTurn, phase });
  const endPhaseOne = (_message, _spies) => {
    message = _message;
    spies = _spies;
    phase++;
  };
  
  const updateSpies = 
};
