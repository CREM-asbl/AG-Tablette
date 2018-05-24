import { updateTransformShape } from '../formes-standard'
import { selectMode, currentSelectedShape, unselectShape } from './select'
import { currentPosition } from '../formules'

export const translateShape = (shape, position) => {
    shape.translate = { x: position.x - 25, y: position.y - 25 }
    updateTransformShape(shape)
}

export const translateMode = {

    run: event => {
        let position = currentPosition(event)
        translateShape(currentSelectedShape, position)
        event.preventDefault()
    },

    reset: event => {
        translateMode.stop()
        translateMode.start()
    },

    next: () => {
        mainCanvas.addEventListener('mousemove', translateMode.run)
        mainCanvas.addEventListener('touchmove', translateMode.run)
        mainCanvas.addEventListener('click', translateMode.reset)
        mainCanvas.addEventListener('touchend', translateMode.reset)
    },

    start: () => {
        selectMode.complete = translateMode.next
        selectMode.start()
    },

    stop: () => {
        unselectShape()
        selectMode.stop()
        mainCanvas.removeEventListener('mousemove', translateMode.run)
        mainCanvas.removeEventListener('touchmove', translateMode.run)
        mainCanvas.removeEventListener('click', translateMode.reset)
        mainCanvas.removeEventListener('touchend', translateMode.reset)
    }
}

