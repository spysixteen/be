module.exports = class RandomNumberGenny {
    constructor(base) {
        this.uniqueNumbers = {}
        this.base = base
    }

    generate = () => {
        let looping = true
        let rand
        while (looping) {
            rand = (Math.floor(Math.random() * 900000000) + 100000000).toString(
                this.base
            )
            if (!this.uniqueNumbers[rand]) {
                looping = false
                this.uniqueNumbers[rand] = true
            }
        }
        return rand
    }

    remove = id => {
        this.uniqueNumbers[id] = false;
    }
}
