//actuellement librairie de manipulation des formes-standard qui centralise les opérations sur les shapes
//le temps de trouver une meilleure solution et pouvoir exploiter les imports javascript

const pathPolygonReg = (n, size) => {
    let path = `M 0 ${size}`
    let angle = 2 * Math.PI / n
    let x = 0
    let y = size

    for (let i = 0; i < n - 1; i++) {
        nextAngle = angle * i
        console.log(nextAngle)
        x += size * Math.cos(nextAngle)
        y -= size * Math.sin(nextAngle)
        path += ` L ${x} ${y}`
    }
    path += ` Z`
    return path
}

//définition avec une longueur de 50px taille d'un canvas-button (bonne idée ?)
//utilisation de path qui est plus souple pour les définitions
//P = petit et G = grand
//premier jet à améliorer et à uniformiser
const stdShapes = {
    'Triangle équilatéral': {
        color: 'yellow',
        shapes: {
            'TriangEqui': 'M 25 7.5 L 50 50 H 0 Z',
            'PTriangIso': 'M 25 28.33 L 50 50 H 0 Z',
            'TriangRect': 'M 25 7.5 L 50 50 H 25 25 Z',
            'Losange': 'M 0 7.5 H 50 L 75 50 H 25 Z',
            'TrapRect': 'M 25 7.5 L 50 50 H 0 V 7.5 Z',
            'TrapIso': 'M 25 7.5 H 75 L 100 50 H 0 Z',
            'HexaReg': 'M 25 7.5 H 75 L 100 50 L 75 92.5 H 25 L 0 50Z',
            'GTriangIso': 'M 0 50 H 50 L 25 -43.3 Z',
            'PLosan': 'M 0 50 L 50 50 L 93.30 25 L 43.30 25 Z',
            'DodecaReg': 'M 0 50 L 50 50 L 93.30127018922194 25 L 118.30127018922195 -18.301270189221928 L 118.30127018922195 -68.30127018922192 L 93.30127018922197 -111.60254037844386 L 50.00000000000004 -136.60254037844388 L 4.263256414560601e-14 -136.60254037844388 L -43.301270189221896 -111.60254037844389 L -68.30127018922192 -68.30127018922197 L -68.30127018922194 -18.301270189221967 L -43.30127018922197 24.999999999999986 Z',
            'PDisque': 'M 25 0 A 1 1 0 0 0 25 60 A 1 1 0 0 0 25 0 Z',
            'GDisque': 'M 25 7.5 A 1 1 0 0 0 75 92.5 A 1 1 0 0 0 25 7.5 Z'
        }
    },
    'Carré': {
        color: 'red',
        shapes: {
            'Carre': 'M 0 0 H 50 V 50 H 0 Z',
            'TriangIso': 'M 0 60 H 50 L 25 0 Z',
            'PTriangRectIso': 'M 25 25 L 50 50 H 0 Z',
            'TriangRectIso': 'M 0 0 V 50 H 25 Z',
            'PTriangRect': 'M 25 0 V 50 H 0 Z',
            'Parallelogram': 'M 0 0 H 50 L 100 50 H 50 Z',
            'Losan': 'M 35 0 H 85 L 50 35 H 0 Z',
            'OctoReg': 'M 35 0 H 85 L 120 35 V 85 L 85 120 H 35 L 0 85 V 35 Z',
            'Disque': 'M 0 0 A 1 1 0 0 0 50 50 A 1 1 0 0 0 0 0 Z'
        }
    },
    'Pentagone régulier': {
        color: 'green',
        shapes: {
            'PentaReg': 'M 0 50 H 50 L 65.45 2.45 L 25 -26.93 L -15.45 2.45 Z',
            'TriangIso': 'M 0 50 H 50 L 25 15.6 Z',
            'GTriangIso': 'M 0 50 H 50 L 25 -26.94 Z',
            'TriangObtu': 'M 0 50 H 50 L 65.45 2.45 Z',
            'PLosan': 'M 0 50 H 50 L 90.45 20.61 H 40.45 Z',
            'DecaReg': 'M 0 50 H 50 L 90.45 20.61 L 105.9 -27.55 L 90.45 -75.10 L 50 -104.49 L 0 -104.49 L -40.45 -75.10 L -55.9 -27.55 L -40.45 20.61 Z',
            'Disque': 'M 0 50 A 1 1 0 0 0 50 -104.49 A 1 1 0 0 0 0 50 Z'
        }
    }
}

const getFirstFamilyShape = (family) => {
    let shape = ''
    switch (family) {
        case 'Triangle équilatéral':
            shape = 'TriangEqui'
            break
        case 'Carré':
            shape = 'Carre'
            break
        case 'Pentagone régulier':
            shape = 'PentaReg'
            break
    }
    return shape
}

const createShape = (family, shape) => {
    let shapesFamily = stdShapes[family]
    let element = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    element.setAttribute('d', shapesFamily.shapes[shape])
    element.setAttribute('fill', shapesFamily.color)
    element.setAttribute('stroke-width', 2)
    element.setAttribute('stroke', 'black')
    element.setAttribute('opacity', .75)
    // shape = `<path d="M 25 7.5 L 50,50 H 0 Z" stroke="black" stroke-width="2" fill="yellow" />`
    return element
}

//à améliorer pour toutes les formes
const getCGShape = (shape) => {
    let box = shape.getBoundingClientRect()
    let cx = box.x + box.width / 2
    let cy = box.y + box.height / 2
    return { x: cx, y: cy }
}

const updateTransformShape = (shape) => {
    let transforms = []
    shape.removeAttribute('transform')
    if (shape.translate) { transforms.push(`translate(${shape.translate.x},${shape.translate.y})`) }
    if (shape.angle) {
        let center = getCGShape(shape)
        transforms.push(`rotate(${shape.angle}, ${center.x}, ${center.y})`)
    }
    if (!transforms.length) { return }
    shape.setAttribute('transform', transforms.join(' '))
}





