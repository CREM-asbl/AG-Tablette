const constructShape = event => {
    let shape = createShape(currentFamily, constructingShape)
    let position = currentPosition(event)
    translateShape(shape, position)
    mainCanvas.appendChild(shape)
}

const constructMode = {
    start: () => {
        mainCanvas.addEventListener('click', constructShape)
    },
    stop: () => {
        mainCanvas.removeEventListener('click', constructShape)
    }
}
