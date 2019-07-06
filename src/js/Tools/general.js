

export function uniqId() {
    var timestamp = new Date().getTime();
    var randInt = Math.floor(Math.random() * 1000 * 1000);
    var result = timestamp.toString(16) + randInt.toString(16);
    return result;
}
