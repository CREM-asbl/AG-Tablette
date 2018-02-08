const calculateAngle = (start, end, center) => {
    let angle =  Math.atan2(start.x - center.x, start.y - center.y) - Math.atan2(end.x - center.x, end.y - center.y)
    return angle * 180 / Math.PI
}