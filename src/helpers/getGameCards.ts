import RandomNumberGenny from "./RandomNumberGenny";
import GameCard from "../entities/GameCard";
import ESpy from "../entities/ESpy";

// Make a Set to ensure we have no duplicated values
const cardSet: Set<string> = new Set([
    "chick",
    "nut",
    "car",
    "chocolate",
    "film",
    "square",
    "net",
    "plastic",
    "knife",
    "kiwi",
    "dinosaur",
    "telescope",
    "mouse",
    "watch",
    "tap",
    "ghost",
    "post",
    "point",
    "play",
    "witch",
    "torch",
    "ivory",
    "calf",
    "school",
    "ruler",
    "key",
    "stadium",
    "yard",
    "grace",
    "pupil",
    "fly",
    "pass",
    "day",
    "doctor",
    "plate",
    "screen",
    "life",
    "paper",
    "death",
    "hollywood",
    "vet",
    "tokyo",
    "water",
    "phoenix",
    "bugle",
    "mug",
    "bar",
    "wizard",
    "noah",
    "sign",
    "hamburger",
    "parrot",
    "bicycle",
    "tornado",
    "virus",
    "map",
    "battle",
    "battleship",
    "snake",
    "sticker",
    "valentine",
    "cloud",
    "steam",
    "beard",
    "bunk",
    "second",
    "chain",
    "werewolf",
    "roll",
    "powder",
    "glacier",
    "musketeer",
    "mosquito",
    "craft",
    "ranch",
    "lip",
    "saddle",
    "bucket",
    "jail",
    "ant",
    "pocket",
    "lace",
    "break",
    "cuckoo",
    "flat",
    "tin",
    "cherry",
    "christmas",
    "moses",
    "team"
]);

// Then, make an Array from the Set,
//     so we can grab values by index
const cardArray = Array.from(cardSet);

export default (): GameCard[] => {
    const RNG = new RandomNumberGenny(10, 0, cardArray.length);
    const indexArray = new Array(25).fill(0);
    return indexArray
        .map(() => Number(RNG.generate()))
        .map(
            (val, id) =>
                new GameCard(id, cardArray[val], ESpy.NONE, false, false)
        );
};
