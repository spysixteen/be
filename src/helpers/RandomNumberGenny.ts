export default class RandomNumberGenny {
    private uniqueNumbers: { [key: string]: boolean };

    private base: number;

    private lowRange: number;

    private highRange: number;

    constructor(base: number, lowRange: number, highRange: number) {
        this.uniqueNumbers = {};
        this.base = base;
        this.lowRange = lowRange;
        this.highRange = highRange;
    }

    generate = (): string => {
        let looping = true;
        let rand = "";
        while (looping) {
            rand = (
                Math.floor(Math.random() * this.highRange) + this.lowRange
            ).toString(this.base);

            if (!this.uniqueNumbers[rand]) {
                looping = false;
                this.uniqueNumbers[rand] = true;
            }
        }
        return rand;
    };

    remove = (id: string): boolean => delete this.uniqueNumbers[id];
}
