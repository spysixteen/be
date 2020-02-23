const randomUniqueNumber = require("./randomUniqueNumber");

const randomInt = range => Math.floor(Math.random() * range);

exports.getSpyCard = () => {
  const usedIndicies = [];

  const assassin = randomInt(25);
  usedIndicies.push(assassin);

  const blue = new Array(8).fill(0).map(randomUniqueNumber(25, usedIndicies));
  const red = new Array(9).fill(0).map(randomUniqueNumber(25, usedIndicies));

  return new Array(25).fill(0).map((val, id) => {
    let tile = 0
    if (blue.includes(id)) tile = 1;
    if (red.includes(id)) tile = 2;
    if (id === assassin) tile = 3;
    return {id, tile}
  });
};
