module.exports = log = (...args) => {
    const date = new Date()
    let sec = date.getSeconds()
    sec = sec < 10 ? `0${sec}` : `${sec}`
    let min = date.getMinutes()
    min = min < 10 ? `0${min}` : `${min}`
    let hour = date.getHours()
    hour = hour < 10 ? `0${hour}` : `${hour}`
    let day = date.getDate()
    day = day < 10 ? `0${day}` : `${day}`
    let month = date.getMonth()
    month = month < 10 ? `0${month}` : `${month}`
    let year = date.getFullYear()
    const dateString = `[${year}:${month}:${day} ${hour}:${min}:${sec}]`

    console.log(dateString, args)
}
