const calculateAngle = (origin, start, end) => {
    let angle =  Math.atan2(start.x - origin.x, start.y - origin.y) - Math.atan2(end.x - origin.x, end.y - origin.y)
    return angle * 180 / Math.PI
}