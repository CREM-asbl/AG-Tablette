const rotateShape = (shape, angle) => {
    shape.angle = shape.angle + angle || angle
    updateTransformShape(shape)
}

const rotationMode = {
    run: event => {
        let position = currentPosition(event)
        let center = getCGShape(currentSelectedShape)
        if (rotationMode.startPosition) {
            let angle = calculateAngle(center, rotationMode.startPosition, position)
            rotateShape(currentSelectedShape, angle)
        }
        rotationMode.startPosition = position
    },

    reset: event => {
        rotationMode.stop()
        rotationMode.start()
    },

    next: () => {
        mainCanvas.addEventListener('mousemove', rotationMode.run)
        mainCanvas.addEventListener('touchmove', rotationMode.run)
        mainCanvas.addEventListener('click', rotationMode.reset)
        mainCanvas.addEventListener('touchend', rotationMode.reset)
    },

    start: () => {
        selectMode.complete = rotationMode.next
        selectMode.start()
    },

    stop: () => {
        unselectShape()
        selectMode.stop()
        mainCanvas.removeEventListener('mousemove', rotationMode.run)
        mainCanvas.removeEventListener('touchmove', rotationMode.run)
        mainCanvas.removeEventListener('click', rotationMode.reset)
        mainCanvas.removeEventListener('touchend', rotationMode.reset)
    }
}

