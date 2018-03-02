const currentPosition = event => {
    return event.touches ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : { x: event.clientX, y: event.clientY }
}

const calculateAngle = (origin, start, end) => {
    let angle =  Math.atan2(start.x - origin.x, start.y - origin.y) - Math.atan2(end.x - origin.x, end.y - origin.y)
    return angle * 180 / Math.PI
}