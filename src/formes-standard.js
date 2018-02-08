function getStdShape(family) {
    //définition avec une longueur de 50px et construit à l'origine
    //1: triangle équilatéral
    //2: carré
    //3: cercle
    //Maintenant comment bien exploiter ces définitions et créer les autres 
    //le souci est la gestion de la position lors de la construction
    // => différencier définition et construction ?
    // exemple carré std = construction d'un carré de 50x50  
    let shape = ''
    switch (family) {
        case 1:
            shape = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
            shape.setAttribute('points', '25,7.5 50,50 0,50')
            shape.setAttribute('fill', 'yellow')
            // shape = `<polygon points="25,11 45,45 5,45" stroke="black" stroke-width="2" fill="yellow" />`
            break
        case 2:
            shape = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
            shape.setAttribute('x', 0)
            shape.setAttribute('y', 0)
            shape.setAttribute('width', 50)
            shape.setAttribute('height', 50)
            shape.setAttribute('fill', 'red')
            // shape = `<rect x="5" y="5" width="40" height="40" stroke="black" stroke-width="2" fill="red" />`
            break
        case 3:
            shape = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
            shape.setAttribute('cx', 25)
            shape.setAttribute('cy', 25)
            shape.setAttribute('r', 25)
            shape.setAttribute('fill', 'green')
            // shape = `<circle cx="25" cy="25" r="20" stroke="black" stroke-width="2" fill="green" />`
            break
    }
    shape.setAttribute('stroke-width', 2)
    shape.setAttribute('stroke', 'black')
    shape.setAttribute('opacity', .75)

    //les fonctions suivantes ne sont pas 'propres' car avec this est dépendant du contexte
    // faut-il créer une fonction getCG(shape) à part par exemple ? 
    // ou alors une classe mais du coup, pas trop de données pour canvas-button ?
    shape.getCG = function () {
        let box = this.getBoundingClientRect()
        let cx = box.x + box.width / 2
        let cy = box.y + box.height / 2
        return { x: cx, y: cy }
    }

    shape.resetTransform = function () { this.removeAttribute('transform') }

    shape.updateTransform = function () {
        this.setAttribute('transform', `translate(${this.translate.x},${this.translate.y}) rotate(${this.angle}, ${this.center.x}, ${this.center.y})`)
    }

    shape.translate = function (point) {
        this.translate.x += point.x
        this.translate.y += point.y

    }

    shape.select = function () { this.setAttribute('stroke', 'magenta') }

    shape.unselect = function () { this.setAttribute('stroke', 'black') }

    return shape
}
