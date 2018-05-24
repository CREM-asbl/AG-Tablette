export let currentSelectedShape = {}

const selectShape = (shape) => { 
    shape.setAttribute('stroke', 'magenta') 
    currentSelectedShape = shape
}

export const unselectShape = () => { 
    if (!currentSelectedShape) { return }
    currentSelectedShape.setAttribute('stroke', 'black')
    currentSelectedShape = null
}


const selectShapeOperation = event => {
    let shape = event.target.id === "svg" ? null : event.target
    if (shape) {
        selectShape(shape)
        selectMode.stop()
        selectMode.complete()
    }
}

export const selectMode = {
    start: () => mainCanvas.addEventListener('click', selectShapeOperation),
    stop: () => mainCanvas.removeEventListener('click', selectShapeOperation)
}