
export const standardKit = {
    'Triangle équilatéral': {
        "color": "#FF0",
        "shapes": [
            {
                name: "Triangle équilatéral",
                steps: [
                    { type: 'moveTo', x: 25, y: -43.3012701892 },
                    { type: 'vertex', x: 25, y: -43.3012701892 },
                    { type: 'segment', x: 0, y: 0 },
                    { type: 'vertex', x: 0, y: 0 },
                    { type: 'segment', x: 50, y: 0 },
                    { type: 'vertex', x: 50, y: 0 },
                    { type: 'segment', x: 25, y: -43.3012701892 }
                ]
            },

            {
                name: "Triangle isocèle", steps: [
                    { type: 'moveTo', x: 25, y: -14.433756729747 },
                    { type: 'vertex', x: 25, y: -14.433756729747 },
                    { type: 'segment', x: 0, y: 0 },
                    { type: 'vertex', x: 0, y: 0 },
                    { type: 'segment', x: 50, y: 0 },
                    { type: 'vertex', x: 50, y: 0 },
                    { type: 'segment', x: 25, y: -14.433756729747 }
                ]
            },

            {
                name: "Triangle rectangle", steps: [
                    { type: 'moveTo', x: 0, y: -43.3012701892 },
                    { type: 'vertex', x: 0, y: -43.3012701892 },
                    { type: 'segment', x: 0, y: 0 },
                    { type: 'vertex', x: 0, y: 0 },
                    { type: 'segment', x: 25, y: 0 },
                    { type: 'vertex', x: 25, y: 0 },
                    { type: 'segment', x: 0, y: -43.3012701892 }
                ]
            },

            {
                name: "Losange",
                steps: [
                    { type: 'moveTo', x: -25, y: -43.3012701892 },
                    { type: 'vertex', x: -25, y: -43.3012701892 },
                    { type: 'segment', x: 0, y: 0 },
                    { type: 'vertex', x: 0, y: 0 },
                    { type: 'segment', x: 50, y: 0 },
                    { type: 'vertex', x: 50, y: 0 },
                    { type: 'segment', x: 25, y: -43.3012701892 },
                    { type: 'vertex', x: 25, y: -43.3012701892 },
                    { type: 'segment', x: -25, y: -43.3012701892 }
                ]
            },

            {
                name: "Trapèze rectangle", steps: [
                    { type: 'moveTo', x: 25, y: -43.3012701892 },
                    { type: 'vertex', x: 25, y: -43.3012701892 },
                    { type: 'segment', x: 0, y: -43.3012701892 },
                    { type: 'vertex', x: 0, y: -43.3012701892 },
                    { type: 'segment', x: 0, y: 0 },
                    { type: 'vertex', x: 0, y: 0 },
                    { type: 'segment', x: 50, y: 0 },
                    { type: 'vertex', x: 50, y: 0 },
                    { type: 'segment', x: 25, y: -43.3012701892 }
                ]
            },

            {
                name: "Trapèze isocèle",
                steps: [
                    { type: 'moveTo', x: 25, y: -43.3012701892 },
                    { type: 'vertex', x: 25, y: -43.3012701892 },
                    { type: 'segment', x: 0, y: 0 },
                    { type: 'vertex', x: 0, y: 0 },
                    { type: 'segment', x: 100, y: 0 },
                    { type: 'vertex', x: 100, y: 0 },
                    { type: 'segment', x: 75, y: -43.3012701892 },
                    { type: 'vertex', x: 75, y: -43.3012701892 },
                    { type: 'segment', x: 25, y: -43.3012701892 }
                ]
            },

            {
                name: "Hexagone régulier", steps: [
                    { type: 'moveTo', x: 0, y: -86.6025403784 },
                    { type: 'vertex', x: 0, y: -86.6025403784 },
                    { type: 'segment', x: -25, y: -43.3012701892 },
                    { type: 'vertex', x: -25, y: -43.3012701892 },
                    { type: 'segment', x: 0, y: 0 },
                    { type: 'vertex', x: 0, y: 0 },
                    { type: 'segment', x: 50, y: 0 },
                    { type: 'vertex', x: 50, y: 0 },
                    { type: 'segment', x: 75, y: -43.3012701892 },
                    { type: 'vertex', x: 75, y: -43.3012701892 },
                    { type: 'segment', x: 50, y: -86.6025403784 },
                    { type: 'vertex', x: 50, y: -86.6025403784 },
                    { type: 'segment', x: 0, y: -86.6025403784 }
                ]
            },
            /*
            {
                name: "Dodécagone régulier", steps: [
                    { type: 'moveTo', x: 0, y: 0 },
                    { type: 'vertex', x: 0, y: 0 },
                    { type: 'segment', x: 50, y: 0 },
                    { type: 'vertex', x: 50, y: 0 },
                    { type: 'segment', x: 93.301270189200, y: -25 },
                    { type: 'vertex', x: 93.301270189200, y: -25 },
                    { type: 'segment', x: 118.301270189200, y: -68.301270189200 },
                    { type: 'vertex', x: 118.301270189200, y: -68.301270189200 },
                    { type: 'segment', x: 118.301270189200, y: -118.301270189200 },
                    { type: 'vertex', x: 118.301270189200, y: -118.301270189200 },
                    { type: 'segment', x: 93.301270189200, y: -161.602540378400 },
                    { type: 'vertex', x: 93.301270189200, y: -161.602540378400 },
                    { type: 'segment', x: 50, y: -186.602540378400 },
                    { type: 'vertex', x: 50, y: -186.602540378400 },
                    { type: 'segment', x: 0, y: -186.602540378400 },
                    { type: 'vertex', x: 0, y: -186.602540378400 },
                    { type: 'segment', x: -43.301270189200, y: -161.602540378400 },
                    { type: 'vertex', x: -43.301270189200, y: -161.602540378400 },
                    { type: 'segment', x: -68.301270189200, y: -118.301270189200 },
                    { type: 'vertex', x: -68.301270189200, y: -118.301270189200 },
                    { type: 'segment', x: -68.301270189200, y: -68.301270189200 },
                    { type: 'vertex', x: -68.301270189200, y: -68.301270189200 },
                    { type: 'segment', x: -43.301270189200, y: -25 },
                    { type: 'vertex', x: -43.301270189200, y: -25 },
                    { type: 'segment', x: 0, y: 0 }
                ]
            },

            {
                name: "Grand triangle isocèle", steps: [
                    { type: 'moveTo', x: 0, y: 0 },
                    { type: 'vertex', x: 0, y: 0 },
                    { type: 'segment', x: 50, y: 0 },
                    { type: 'vertex', x: 50, y: 0 },
                    { type: 'segment', x: 25, y: -93.301270189200 },
                    { type: 'vertex', x: 25, y: -93.301270189200 },
                    { type: 'segment', x: 0, y: 0 }
                ]
            },

            {
                name: "Petit losange", steps: [
                    { type: 'moveTo', x: 0, y: 0 },
                    { type: 'vertex', x: 0, y: 0 },
                    { type: 'segment', x: 50, y: 0 },
                    { type: 'vertex', x: 50, y: 0 },
                    { type: 'segment', x: 93.301270189200, y: -25 },
                    { type: 'vertex', x: 93.301270189200, y: -25 },
                    { type: 'segment', x: 43.301270189200, y: -25 },
                    { type: 'vertex', x: 43.301270189200, y: -25 },
                    { type: 'segment', x: 0, y: 0 }
                ]
            },
            */
        ]
    },

    'Carré': {
        "color": "#F00",
        "shapes": [
            {
                name: "Carré", steps: [
                    { type: 'moveTo', x: 0, y: 0 },
                    { type: 'vertex', x: 0, y: 0 },
                    { type: 'segment', x: 50, y: 0 },
                    { type: 'vertex', x: 50, y: 0 },
                    { type: 'segment', x: 50, y: - 50 },
                    { type: 'vertex', x: 50, y: - 50 },
                    { type: 'segment', x: 0, y: - 50 },
                    { type: 'vertex', x: 0, y: - 50 },
                    { type: 'segment', x: 0, y: 0 }
                ]
            },

            {
                name: "Petit triangle rectangle isocèle", steps: [
                    { type: 'moveTo', x: 0, y: 0 },
                    { type: 'vertex', x: 0, y: 0 },
                    { type: 'segment', x: 50, y: 0 },
                    { type: 'vertex', x: 50, y: 0 },
                    { type: 'segment', x: 25, y: - 25 },
                    { type: 'vertex', x: 25, y: - 25 },
                    { type: 'segment', x: 0, y: 0 }
                ]
            },

            {
                name: "Triangle rectangle isocèle", steps: [
                    { type: 'moveTo', x: 0, y: 0 },
                    { type: 'vertex', x: 0, y: 0 },
                    { type: 'segment', x: 50, y: 0 },
                    { type: 'vertex', x: 50, y: 0 },
                    { type: 'segment', x: 0, y: - 50 },
                    { type: 'vertex', x: 0, y: - 50 },
                    { type: 'segment', x: 0, y: 0 }
                ]
            },

            {
                name: "Petit triangle rectangle", steps: [
                    { type: 'moveTo', x: 0, y: 0 },
                    { type: 'vertex', x: 0, y: 0 },
                    { type: 'segment', x: 25, y: 0 },
                    { type: 'vertex', x: 25, y: 0 },
                    { type: 'segment', x: 25, y: - 50 },
                    { type: 'vertex', x: 25, y: - 50 },
                    { type: 'segment', x: 0, y: 0 }
                ]
            },

            {
                name: "Parallélogramme", steps: [
                    { type: 'moveTo', x: 0, y: 0 },
                    { type: 'vertex', x: 0, y: 0 },
                    { type: 'segment', x: 50, y: 0 },
                    { type: 'vertex', x: 50, y: 0 },
                    { type: 'segment', x: 0, y: - 50 },
                    { type: 'vertex', x: 0, y: - 50 },
                    { type: 'segment', x: -50, y: -50 },
                    { type: 'vertex', x: -50, y: -50 },
                    { type: 'segment', x: 0, y: 0 }
                ]
            },

            {
                name: "Octogone régulier", steps: [
                    { type: 'moveTo', x: 0, y: 0 },
                    { type: 'vertex', x: 0, y: 0 },
                    { type: 'segment', x: 50, y: 0 },
                    { type: 'vertex', x: 50, y: 0 },
                    { type: 'segment', x: 85.355339059329, y: - 35.355339059329 },
                    { type: 'vertex', x: 85.355339059329, y: - 35.355339059329 },
                    { type: 'segment', x: 85.355339059329, y: -85.355339059329 },
                    { type: 'vertex', x: 85.355339059329, y: -85.355339059329 },
                    { type: 'segment', x: 50, y: -120.710678118658 },
                    { type: 'vertex', x: 50, y: -120.710678118658 },
                    { type: 'segment', x: 0, y: -120.710678118658 },
                    { type: 'vertex', x: 0, y: -120.710678118658 },
                    { type: 'segment', x: -35.355339059329, y: -85.355339059329 },
                    { type: 'vertex', x: -35.355339059329, y: -85.355339059329 },
                    { type: 'segment', x: -35.355339059329, y: -35.355339059329 },
                    { type: 'vertex', x: -35.355339059329, y: -35.355339059329 },
                    { type: 'segment', x: 0, y: 0 }
                ]
            },
            /*
            {
                name: "Triangle isocèle", steps: [
                    { type: 'moveTo', x: 0, y: 0 },
                    { type: 'vertex', x: 0, y: 0 },
                    { type: 'segment', x: 50, y: 0 },
                    { type: 'vertex', x: 50, y: 0 },
                    { type: 'segment', x: 25, y: - 60.355339059329 },
                    { type: 'vertex', x: 25, y: - 60.355339059329 },
                    { type: 'segment', x: 0, y: 0 }
                ]
            },

            {
                name: "Petit losange", steps: [
                    { type: 'moveTo', x: 0, y: 0 },
                    { type: 'vertex', x: 0, y: 0 },
                    { type: 'segment', x: 50, y: 0 },
                    { type: 'vertex', x: 50, y: 0 },
                    { type: 'segment', x: 85.355339059329, y: - 35.355339059329 },
                    { type: 'vertex', x: 85.355339059329, y: - 35.355339059329 },
                    { type: 'segment', x: 35.355339059329, y: -35.355339059329 },
                    { type: 'vertex', x: 35.355339059329, y: -35.355339059329 },
                    { type: 'segment', x: 0, y: 0 }
                ]
            },
            */
        ]
    },

    'Pentagone régulier': {
        "color": "#0F0",
        "shapes": [
            {
                name: "Pentagone régulier", steps: [
                    { type: 'moveTo', x: 0, y: 0 },
                    { type: 'vertex', x: 0, y: 0 },
                    { type: 'segment', x: 50, y: 0 },
                    { type: 'vertex', x: 50, y: 0 },
                    { type: 'segment', x: 65.450849718737, y: - 47.552825814750 },
                    { type: 'vertex', x: 65.450849718737, y: - 47.552825814750 },
                    { type: 'segment', x: 25, y: - 76.942088429350 },
                    { type: 'vertex', x: 25, y: - 76.942088429350 },
                    { type: 'segment', x: -15.450849718737, y: - 47.552825814750 },
                    { type: 'vertex', x: -15.450849718737, y: - 47.552825814750 },
                    { type: 'segment', x: 0, y: 0 }
                ]
            },

            {
                name: "Petit triangle isocèle", steps: [
                    { type: 'moveTo', x: 0, y: 0 },
                    { type: 'vertex', x: 0, y: 0 },
                    { type: 'segment', x: 50, y: 0 },
                    { type: 'vertex', x: 50, y: 0 },
                    { type: 'segment', x: 25, y: - 34.409548011750 },
                    { type: 'vertex', x: 25, y: - 34.409548011750 },
                    { type: 'segment', x: 0, y: 0 }
                ]
            },

            {
                name: "Grand triangle isocèle", steps: [
                    { type: 'moveTo', x: 0, y: 0 },
                    { type: 'vertex', x: 0, y: 0 },
                    { type: 'segment', x: 50, y: 0 },
                    { type: 'vertex', x: 50, y: 0 },
                    { type: 'segment', x: 25, y: - 76.942088429400 },
                    { type: 'vertex', x: 25, y: - 76.942088429400 },
                    { type: 'segment', x: 0, y: 0 }
                ]
            },

            {
                name: "Triangle obtusangle", steps: [
                    { type: 'moveTo', x: 0, y: 0 },
                    { type: 'vertex', x: 0, y: 0 },
                    { type: 'segment', x: 105.9016994374, y: - 76.9420884294 },
                    { type: 'vertex', x: 105.9016994374, y: - 76.9420884294 },
                    { type: 'segment', x: 25, y: -76.9420884294 },
                    { type: 'vertex', x: 25, y: -76.9420884294 },
                    { type: 'segment', x: 0, y: 0 }
                ]
            },

            {
                name: "Petit losange", steps: [
                    { type: 'moveTo', x: 0, y: 0 },
                    { type: 'vertex', x: 0, y: 0 },
                    { type: 'segment', x: 50, y: 0 },
                    { type: 'vertex', x: 50, y: 0 },
                    { type: 'segment', x: 90.4508497187, y: - 29.3892626146 },
                    { type: 'vertex', x: 90.4508497187, y: - 29.3892626146 },
                    { type: 'segment', x: 40.4508497187, y: -29.3892626146 },
                    { type: 'vertex', x: 40.4508497187, y: -29.3892626146 },
                    { type: 'segment', x: 0, y: 0 }
                ]
            },

            {
                name: "Décagone régulier", steps: [
                    { type: 'moveTo', x: 0, y: 0 },
                    { type: 'vertex', x: 0, y: 0 },
                    { type: 'segment', x: 50, y: 0 },
                    { type: 'vertex', x: 50, y: 0 },
                    { type: 'segment', x: 90.4508497187, y: - 29.3892626146 },
                    { type: 'vertex', x: 90.4508497187, y: - 29.3892626146 },
                    { type: 'segment', x: 105.9016994374, y: - 76.9420884294 },
                    { type: 'vertex', x: 105.9016994374, y: - 76.9420884294 },
                    { type: 'segment', x: 90.4508497187, y: - 124.4949142442 },
                    { type: 'vertex', x: 90.4508497187, y: - 124.4949142442 },
                    { type: 'segment', x: 50, y: - 153.8841768588 },
                    { type: 'vertex', x: 50, y: - 153.8841768588 },
                    { type: 'segment', x: 0, y: - 153.8841768588 },
                    { type: 'vertex', x: 0, y: - 153.8841768588 },
                    { type: 'segment', x: -40.4508497187, y: - 124.4949142442 },
                    { type: 'vertex', x: -40.4508497187, y: - 124.4949142442 },
                    { type: 'segment', x: -55.9016994374, y: - 76.9420884294 },
                    { type: 'vertex', x: -55.9016994374, y: - 76.9420884294 },
                    { type: 'segment', x: -40.4508497187, y: - 29.3892626146 },
                    { type: 'vertex', x: -40.4508497187, y: - 29.3892626146 },
                    { type: 'segment', x: 0, y: 0 }
                ]
            }
        ]
    },

    'Cercles': {
        "color": "#CCC",
        "shapes": [
            { //Circonscrit à l'hexagone -> rayon = 50.
                name: "Disque 1", steps: [
                    { type: 'moveTo', x: 0, y: 50},
                    { type: 'segment', x: 7.821723252011544, y: 49.38441702975689, isArc: true},
                    { type: 'segment', x: 15.450849718747369, y: 47.552825814757675, isArc: true},
                    { type: 'segment', x: 22.699524986977337, y: 44.550326209418394, isArc: true},
                    { type: 'segment', x: 29.389262614623657, y: 40.45084971874737, isArc: true},
                    { type: 'segment', x: 35.35533905932737, y: 35.35533905932738, isArc: true},
                    { type: 'segment', x: 40.45084971874737, y: 29.389262614623657, isArc: true},
                    { type: 'segment', x: 44.55032620941839, y: 22.699524986977345, isArc: true},
                    { type: 'segment', x: 47.552825814757675, y: 15.450849718747373, isArc: true},
                    { type: 'segment', x: 49.38441702975689, y: 7.821723252011546, isArc: true},
                    { type: 'segment', x: 50, y: 0, isArc: true},
                    { type: 'segment', x: 49.38441702975689, y: -7.821723252011541, isArc: true},
                    { type: 'segment', x: 47.55282581475768, y: -15.450849718747367, isArc: true},
                    { type: 'segment', x: 44.550326209418394, y: -22.699524986977337, isArc: true},
                    { type: 'segment', x: 40.45084971874737, y: -29.38926261462365, isArc: true},
                    { type: 'segment', x: 35.35533905932738, y: -35.35533905932737, isArc: true},
                    { type: 'segment', x: 29.38926261462366, y: -40.450849718747364, isArc: true},
                    { type: 'segment', x: 22.699524986977345, y: -44.55032620941839, isArc: true},
                    { type: 'segment', x: 15.450849718747376, y: -47.552825814757675, isArc: true},
                    { type: 'segment', x: 7.821723252011549, y: -49.38441702975688, isArc: true},
                    { type: 'segment', x: 0, y: -50, isArc: true},
                    { type: 'segment', x: -7.8217232520115365, y: -49.38441702975689, isArc: true},
                    { type: 'segment', x: -15.450849718747364, y: -47.55282581475768, isArc: true},
                    { type: 'segment', x: -22.699524986977334, y: -44.550326209418394, isArc: true},
                    { type: 'segment', x: -29.38926261462365, y: -40.45084971874737, isArc: true},
                    { type: 'segment', x: -35.35533905932737, y: -35.355339059327385, isArc: true},
                    { type: 'segment', x: -40.450849718747364, y: -29.38926261462366, isArc: true},
                    { type: 'segment', x: -44.55032620941839, y: -22.699524986977345, isArc: true},
                    { type: 'segment', x: -47.552825814757675, y: -15.450849718747378, isArc: true},
                    { type: 'segment', x: -49.38441702975688, y: -7.821723252011552, isArc: true},
                    { type: 'segment', x: -50, y: 0, isArc: true},
                    { type: 'segment', x: -49.38441702975689, y: 7.821723252011534, isArc: true},
                    { type: 'segment', x: -47.55282581475768, y: 15.450849718747362, isArc: true},
                    { type: 'segment', x: -44.5503262094184, y: 22.69952498697733, isArc: true},
                    { type: 'segment', x: -40.45084971874738, y: 29.389262614623647, isArc: true},
                    { type: 'segment', x: -35.355339059327385, y: 35.35533905932737, isArc: true},
                    { type: 'segment', x: -29.389262614623668, y: 40.450849718747364, isArc: true},
                    { type: 'segment', x: -22.699524986977348, y: 44.55032620941839, isArc: true},
                    { type: 'segment', x: -15.450849718747381, y: 47.552825814757675, isArc: true},
                    { type: 'segment', x: -7.821723252011556, y: 49.38441702975688, isArc: true},
                    { type: 'segment', x: 0, y: 50, isArc: true}
                ]
            },

            { //Circonscrit au pentagone -> rayon = 42.53254041760199.
                name: "Disque 2", steps: [
                    { type: 'moveTo', x: 0, y: 42.53254041760199},
                    { type: 'segment', x: 6.653555207029557, y: 42.00889426635694, isArc: true},
                    { type: 'segment', x: 13.14327780297833, y: 40.45084971874737, isArc: true},
                    { type: 'segment', x: 19.309369279379595, y: 37.89677100238883, isArc: true},
                    { type: 'segment', x: 24.99999999999999, y: 34.40954801177934, isArc: true},
                    { type: 'segment', x: 30.075047750377273, y: 30.075047750377287, isArc: true},
                    { type: 'segment', x: 34.40954801177933, y: 25.000000000000007, isArc: true},
                    { type: 'segment', x: 37.89677100238882, y: 19.30936927937961, isArc: true},
                    { type: 'segment', x: 40.450849718747364, y: 13.143277802978348, isArc: true},
                    { type: 'segment', x: 42.00889426635693, y: 6.6535552070295765, isArc: true},
                    { type: 'segment', x: 42.53254041760199, y: 0, isArc: true},
                    { type: 'segment', x: 42.00889426635694, y: -6.653555207029555, isArc: true},
                    { type: 'segment', x: 40.45084971874737, y: -13.143277802978329, isArc: true},
                    { type: 'segment', x: 37.89677100238883, y: -19.30936927937959, isArc: true},
                    { type: 'segment', x: 34.40954801177934, y: -24.99999999999999, isArc: true},
                    { type: 'segment', x: 30.075047750377287, y: -30.075047750377273, isArc: true},
                    { type: 'segment', x: 25.000000000000007, y: -34.40954801177933, isArc: true},
                    { type: 'segment', x: 19.30936927937961, y: -37.89677100238882, isArc: true},
                    { type: 'segment', x: 13.143277802978352, y: -40.450849718747364, isArc: true},
                    { type: 'segment', x: 6.653555207029578, y: -42.00889426635693, isArc: true},
                    { type: 'segment', x: 0, y: -42.53254041760199, isArc: true},
                    { type: 'segment', x: -6.653555207029514, y: -42.00889426635695, isArc: true},
                    { type: 'segment', x: -13.143277802978327, y: -40.45084971874737, isArc: true},
                    { type: 'segment', x: -19.309369279379624, y: -37.89677100238881, isArc: true},
                    { type: 'segment', x: -25.000000000000046, y: -34.4095480117793, isArc: true},
                    { type: 'segment', x: -30.07504775037735, y: -30.075047750377212, isArc: true},
                    { type: 'segment', x: -34.409548011779414, y: -24.99999999999989, isArc: true},
                    { type: 'segment', x: -37.8967710023889, y: -19.309369279379446, isArc: true},
                    { type: 'segment', x: -40.450849718747435, y: -13.143277802978137, isArc: true},
                    { type: 'segment', x: -42.008894266356975, y: -6.65355520702932, isArc: true},
                    { type: 'segment', x: -42.53254041760199, y: 0, isArc: true},
                    { type: 'segment', x: -42.00889426635689, y: 6.653555207029886, isArc: true},
                    { type: 'segment', x: -40.45084971874726, y: 13.143277802978682, isArc: true},
                    { type: 'segment', x: -37.89677100238864, y: 19.309369279379954, isArc: true},
                    { type: 'segment', x: -34.40954801177908, y: 25.00000000000035, isArc: true},
                    { type: 'segment', x: -30.07504775037695, y: 30.075047750377617, isArc: true},
                    { type: 'segment', x: -24.999999999999584, y: 34.409548011779634, isArc: true},
                    { type: 'segment', x: -19.309369279379112, y: 37.89677100238907, isArc: true},
                    { type: 'segment', x: -13.143277802977781, y: 40.45084971874755, isArc: true},
                    { type: 'segment', x: -6.653555207028949, y: 42.00889426635703, isArc: true},
                    { type: 'segment', x: 0, y: 42.53254041760199, isArc: true}
                ]
            },

            { //Circonscrit au carré -> rayon = 35.35533905932738.
                name: "Disque 3", steps: [
                    { type: 'moveTo', x: 0, y: 35.35533905932738},
                    { type: 'segment', x: 5.5307935520618505, y: 34.92005616668552, isArc: true},
                    { type: 'segment', x: 10.925400611220521, y: 33.62492559819787, isArc: true},
                    { type: 'segment', x: 16.05098804800515, y: 31.50183776675253, isArc: true},
                    { type: 'segment', x: 20.781346888872665, y: 28.60307014088422, isArc: true},
                    { type: 'segment', x: 24.999999999999996, y: 25.000000000000007, isArc: true},
                    { type: 'segment', x: 28.603070140884213, y: 20.78134688887268, isArc: true},
                    { type: 'segment', x: 31.501837766752523, y: 16.05098804800516, isArc: true},
                    { type: 'segment', x: 33.62492559819787, y: 10.925400611220534, isArc: true},
                    { type: 'segment', x: 34.92005616668551, y: 5.5307935520618665, isArc: true},
                    { type: 'segment', x: 35.35533905932738, y: 0, isArc: true},
                    { type: 'segment', x: 34.92005616668552, y: -5.530793552061849, isArc: true},
                    { type: 'segment', x: 33.62492559819787, y: -10.925400611220518, isArc: true},
                    { type: 'segment', x: 31.50183776675253, y: -16.05098804800515, isArc: true},
                    { type: 'segment', x: 28.60307014088422, y: -20.781346888872665, isArc: true},
                    { type: 'segment', x: 25.000000000000007, y: -24.999999999999996, isArc: true},
                    { type: 'segment', x: 20.78134688887268, y: -28.60307014088421, isArc: true},
                    { type: 'segment', x: 16.050988048005163, y: -31.501837766752523, isArc: true},
                    { type: 'segment', x: 10.925400611220537, y: -33.62492559819787, isArc: true},
                    { type: 'segment', x: 5.530793552061868, y: -34.92005616668551, isArc: true},
                    { type: 'segment', x: 0, y: -35.35533905932738, isArc: true},
                    { type: 'segment', x: -5.530793552061815, y: -34.92005616668552, isArc: true},
                    { type: 'segment', x: -10.925400611220516, y: -33.62492559819787, isArc: true},
                    { type: 'segment', x: -16.050988048005173, y: -31.501837766752516, isArc: true},
                    { type: 'segment', x: -20.78134688887271, y: -28.603070140884185, isArc: true},
                    { type: 'segment', x: -25.000000000000057, y: -24.999999999999943, isArc: true},
                    { type: 'segment', x: -28.603070140884284, y: -20.781346888872584, isArc: true},
                    { type: 'segment', x: -31.50183776675259, y: -16.050988048005024, isArc: true},
                    { type: 'segment', x: -33.62492559819792, y: -10.92540061122036, isArc: true},
                    { type: 'segment', x: -34.92005616668555, y: -5.530793552061653, isArc: true},
                    { type: 'segment', x: -35.35533905932738, y: 0, isArc: true},
                    { type: 'segment', x: -34.92005616668548, y: 5.530793552062123, isArc: true},
                    { type: 'segment', x: -33.62492559819778, y: 10.925400611220812, isArc: true},
                    { type: 'segment', x: -31.501837766752374, y: 16.05098804800545, isArc: true},
                    { type: 'segment', x: -28.603070140884, y: 20.781346888872967, isArc: true},
                    { type: 'segment', x: -24.999999999999723, y: 25.00000000000028, isArc: true},
                    { type: 'segment', x: -20.781346888872328, y: 28.603070140884466, isArc: true},
                    { type: 'segment', x: -16.050988048004747, y: 31.501837766752733, isArc: true},
                    { type: 'segment', x: -10.925400611220063, y: 33.62492559819802, isArc: true},
                    { type: 'segment', x: -5.530793552061345, y: 34.9200561666856, isArc: true},
                    { type: 'segment', x: 0, y: 35.35533905932738, isArc: true}
                ]
            },

            { //Circonscrit au triangle équilatéral -> rayon = 28.86751345948129.
                name: "Disque 4", steps: [
                    { type: 'moveTo', x: 0, y: 28.86751345948129},
                    { type: 'segment', x: 4.515874025075615, y: 28.512106465902882, isArc: true},
                    { type: 'segment', x: 8.920552244327244, y: 27.454636784877735, isArc: true},
                    { type: 'segment', x: 13.105576861708, y: 25.721142829493356, isArc: true},
                    { type: 'segment', x: 16.967898681837568, y: 23.354308974067898, isArc: true},
                    { type: 'segment', x: 20.41241452319315, y: 20.412414523193156, isArc: true},
                    { type: 'segment', x: 23.35430897406789, y: 16.967898681837582, isArc: true},
                    { type: 'segment', x: 25.72114282949335, y: 13.105576861708009, isArc: true},
                    { type: 'segment', x: 27.45463678487773, y: 8.920552244327254, isArc: true},
                    { type: 'segment', x: 28.51210646590288, y: 4.515874025075627, isArc: true},
                    { type: 'segment', x: 28.86751345948129, y: 0, isArc: true},
                    { type: 'segment', x: 28.512106465902882, y: -4.515874025075613, isArc: true},
                    { type: 'segment', x: 27.454636784877735, y: -8.920552244327242, isArc: true},
                    { type: 'segment', x: 25.721142829493356, y: -13.105576861707998, isArc: true},
                    { type: 'segment', x: 23.354308974067898, y: -16.967898681837568, isArc: true},
                    { type: 'segment', x: 20.412414523193156, y: -20.41241452319315, isArc: true},
                    { type: 'segment', x: 16.967898681837582, y: -23.354308974067887, isArc: true},
                    { type: 'segment', x: 13.10557686170801, y: -25.72114282949335, isArc: true},
                    { type: 'segment', x: 8.920552244327258, y: -27.45463678487773, isArc: true},
                    { type: 'segment', x: 4.515874025075629, y: -28.51210646590288, isArc: true},
                    { type: 'segment', x: 0, y: -28.86751345948129, isArc: true},
                    { type: 'segment', x: -4.515874025075585, y: -28.512106465902885, isArc: true},
                    { type: 'segment', x: -8.92055224432724, y: -27.454636784877735, isArc: true},
                    { type: 'segment', x: -13.10557686170802, y: -25.721142829493342, isArc: true},
                    { type: 'segment', x: -16.967898681837607, y: -23.35430897406787, isArc: true},
                    { type: 'segment', x: -20.4124145231932, y: -20.412414523193107, isArc: true},
                    { type: 'segment', x: -23.35430897406795, y: -16.9678986818375, isArc: true},
                    { type: 'segment', x: -25.721142829493402, y: -13.105576861707899, isArc: true},
                    { type: 'segment', x: -27.454636784877778, y: -8.920552244327112, isArc: true},
                    { type: 'segment', x: -28.512106465902907, y: -4.515874025075453, isArc: true},
                    { type: 'segment', x: -28.86751345948129, y: 0, isArc: true},
                    { type: 'segment', x: -28.512106465902846, y: 4.515874025075838, isArc: true},
                    { type: 'segment', x: -27.454636784877657, y: 8.920552244327482, isArc: true},
                    { type: 'segment', x: -25.72114282949323, y: 13.105576861708245, isArc: true},
                    { type: 'segment', x: -23.35430897406772, y: 16.967898681837816, isArc: true},
                    { type: 'segment', x: -20.412414523192925, y: 20.41241452319338, isArc: true},
                    { type: 'segment', x: -16.967898681837294, y: 23.354308974068097, isArc: true},
                    { type: 'segment', x: -13.105576861707673, y: 25.72114282949352, isArc: true},
                    { type: 'segment', x: -8.92055224432687, y: 27.454636784877856, isArc: true},
                    { type: 'segment', x: -4.515874025075202, y: 28.512106465902946, isArc: true},
                    { type: 'segment', x: 0, y: 28.86751345948129, isArc: true}
                ]
            }
        ]
    }

}
