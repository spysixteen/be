module.exports = (range, usedIndices) => val => {
  while (true) {
    const rand = Math.floor(Math.random() * range);
    if (!usedIndices.includes(rand)) {
      usedIndices.push(rand);
      return rand;
    }
  }
};
