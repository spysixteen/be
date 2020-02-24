import RandomNumberGenny from "./RandomNumberGenny";
import SpyCardTile from "../entities/SpyCardTile";
import ESpy from "../entities/ESpy";

export default (): SpyCardTile[] => {
    const RNG = new RandomNumberGenny(10, 0, 25);

    const assassin = Number(RNG.generate());
    const blue = new Array(8).fill(0).map(() => Number(RNG.generate()));
    const red = new Array(9).fill(0).map(() => Number(RNG.generate()));

    return new Array(25).fill(0).map((val, id) => {
        let tile = ESpy.NONE;
        if (blue.includes(id)) tile = ESpy.BLUE;
        if (red.includes(id)) tile = ESpy.RED;
        if (id === assassin) tile = ESpy.ASSASSIN;
        return new SpyCardTile(id, tile);
    });
};
