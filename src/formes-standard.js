function getStdShape(family) {
    //définition avec une longueur de 50px et construit à l'origine
    //1: triangle équilatéral
    //2: carré
    //3: cercle
    //Maintenant comment bien exploiter ces définitions et créer les autres 
    //le souci est la gestion de la position lors de la construction
    // => différencier définition et construction ?
    // exemple carré std = construction d'un carré de 50x50  
    let shape = {}
    switch (family) {
        case 1:
            shape = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
            shape.setAttribute('points', '25,7.5 50,50 0,50')
            shape.setAttribute('fill', 'yellow')
            break
        case 2:
            shape = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
            shape.setAttribute('x', 0)
            shape.setAttribute('y', 0)
            shape.setAttribute('width', 50)
            shape.setAttribute('height', 50)
            shape.setAttribute('fill', 'red')
            break
        case 3:
            shape = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
            shape.setAttribute('cx', 25)
            shape.setAttribute('cy', 25)
            shape.setAttribute('r', 25)
            shape.setAttribute('fill', 'green')
            break
    }
    return shape
}
