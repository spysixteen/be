const log = (...args: any[]) => {
    const date = new Date();
    const sec = date.getSeconds();
    const getSec = (sec: number) => (sec < 10 ? `0${sec}` : `${sec}`);
    const min = date.getMinutes();
    const getMin = (min: number) => (min < 10 ? `0${min}` : `${min}`);
    const hour = date.getHours();
    const getHour = (hour: number) => (hour < 10 ? `0${hour}` : `${hour}`);
    const day = date.getDate();
    const getDay = (day: number) => (day < 10 ? `0${day}` : `${day}`);
    const month = date.getMonth();
    const getMonth = (month: number) => (month < 10 ? `0${month}` : `${month}`);
    const year = date.getFullYear();
    const dateString = `[${year}:${getMonth(month)}:${getDay(day)} ${getHour(
        hour
    )}:${getMin(min)}:${getSec(sec)}]`;

    console.log(dateString, args);
};
export default log;
