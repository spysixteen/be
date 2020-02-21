const randomUniqueNumber = require("./randomUniqueNumber");

const randomInt = range => Math.floor(Math.random() * range);

exports.getSpyCard = () => {
  const usedIndicies = [];

  const assassin = randomInt(25);
  usedIndicies.push(assassin);

  const blue = new Array(8).fill(0).map(randomUniqueNumber(25, usedIndicies));
  const red = new Array(9).fill(0).map(randomUniqueNumber(25, usedIndicies));

  return new Array(25).fill(0).map((val, i) => {
    if (blue.includes(i)) return 1;
    if (red.includes(i)) return 2;
    if (i === assassin) return 3;
    else return 0;
  });
};
