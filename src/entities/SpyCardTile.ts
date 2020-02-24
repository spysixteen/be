import ESpy from "./ESpy";

export default class SpyCardTile {
    readonly ID: number;

    readonly spy: ESpy;

    public constructor(ID: number, spy: ESpy) {
        this.ID = ID;
        this.spy = spy;
    }
}
