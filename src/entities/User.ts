export enum ETeam {
    NONE = 0,
    BLUE,
    RED,
    ASSASSIN
}

export default class User {
    readonly username: string;

    readonly socketId: string;

    public overwatch: boolean;

    public team: ETeam;

    public constructor(
        username: string,
        socketId: string,
        overwatch?: boolean,
        team?: ETeam
    ) {
        this.username = username;
        this.socketId = socketId;
        this.overwatch = overwatch || false;
        this.team = team || ETeam.NONE;
    }
}
