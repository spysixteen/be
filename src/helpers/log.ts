const log = (...args: any[]) => {
    const padZero = (val: number, length: number) =>
        String(val).padStart(length, "0");

    const date = new Date();
    const sec = date.getSeconds();
    const min = date.getMinutes();
    const hour = date.getHours();
    const day = date.getDate();
    const month = date.getMonth();
    const year = date.getFullYear();
    const dateString = `[${year}:${padZero(month, 2)}:${padZero(
        day,
        2
    )} ${padZero(hour, 2)}:${padZero(min, 2)}:${padZero(sec, 2)}]`;

    console.log(dateString, args);
};
export default log;
