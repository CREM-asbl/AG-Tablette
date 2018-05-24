import { createShape } from '../formes-standard'
import { currentPosition } from '../formules'
import { translateShape } from './translate'

const constructShape = event => {
    let shape = createShape(currentFamily, constructingShape)
    let position = currentPosition(event)
    translateShape(shape, position)
    mainCanvas.appendChild(shape)
}

export const constructMode = {
    start: () => {
        mainCanvas.addEventListener('click', constructShape)
    },
    stop: () => {
        mainCanvas.removeEventListener('click', constructShape)
    }
}
