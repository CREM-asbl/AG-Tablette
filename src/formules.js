const calculateAngle = (start, end, center) => {
    return Math.atan2(start.x - center.x, start.y - center.y) - Math.atan2(end.x - center.x, end.y - center.y)
}