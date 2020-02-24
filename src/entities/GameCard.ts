import { ESpy } from "./ESpy";

export default class GameCard {
    readonly ID: number;

    readonly text: string;

    public spy: ESpy;

    public clicked: boolean;

    public revealed: boolean;

    public constructor(
        ID: number,
        text: string,
        spy: ESpy,
        clicked: boolean,
        revealed: boolean
    ) {
        this.ID = ID;
        this.text = text;
        this.spy = spy;
        this.clicked = clicked;
        this.revealed = revealed;
    }
}
