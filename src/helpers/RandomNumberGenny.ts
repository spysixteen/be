export default class RandomNumberGenny {
    uniqueNumbers: { [key: string]: boolean };
    base: number;
    constructor(base: number) {
        this.uniqueNumbers = {};
        this.base = base;
    }

    generate = (): string => {
        let looping = true;
        let rand = "";
        while (looping) {
            rand = (Math.floor(Math.random() * 900000000) + 100000000).toString(
                this.base
            );
            if (!this.uniqueNumbers[rand]) {
                looping = false;
                this.uniqueNumbers[rand] = true;
            }
        }
        return rand;
    };

    remove = (id: string) => delete this.uniqueNumbers[id];
}
