export const grandeursKit = {
  name: 'Formes standard',
  families: {
    'Famille du triangle équilatéral': {
      color: '#FF0',
      shapes: [
        {
          name: 'Triangle équilatéral',
          path: 'M 25 -43.3012701892 L 0 0 L 50 0 L 25 -43.3012701892',
        },

        {
          name: 'Triangle isocèle',
          path: 'M 25 -14.433756729747 L 0 0 L 50 0 L 25 -14.433756729747',
        },

        {
          name: 'Triangle rectangle',
          path: 'M 0 -43.3012701892 L 0 0 L 25 0 L 0 -43.3012701892',
        },

        {
          name: 'Losange',
          path:
            'M -25 -43.3012701892 L 0 0 L 50 0 L 25 -43.3012701892 L -25 -43.3012701892',
        },

        {
          name: 'Trapèze rectangle',
          path:
            'M 25 -43.3012701892 L 0 -43.3012701892 L 0 0 L 50 0 L 25 -43.3012701892',
        },

        {
          name: 'Trapèze isocèle',
          path:
            'M 25 -43.3012701892 L 0 0 L 100 0 L 75 -43.3012701892 L 25 -43.3012701892',
        },

        {
          name: 'Hexagone régulier',
          path:
            'M 0 -86.6025403784 L -25 -43.3012701892 L 0 0 L 50 0 L 75 -43.3012701892 L 50 -86.6025403784 L 0 -86.6025403784',
        },
        /*
              {
                  name: "Dodécagone régulier", segments: [
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
                  name: "Grand triangle isocèle", segments: [
                      { type: 'vertex', x: 0, y: 0 },
                      { type: 'segment', x: 50, y: 0 },
                      { type: 'vertex', x: 50, y: 0 },
                      { type: 'segment', x: 25, y: -93.301270189200 },
                      { type: 'vertex', x: 25, y: -93.301270189200 },
                      { type: 'segment', x: 0, y: 0 }
                  ]
              },

              {
                  name: "Petit losange", segments: [
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
      ],
    },

    'Famille du carré': {
      color: '#F00',
      shapes: [
        {
          name: 'Carré',
          path: 'M 0 0 L 50 0 L 50 -50 L 0 -50 L 0 0',
        },

        {
          name: 'Triangle rectangle isocèle 1',
          path: 'M 0 0 L 50 0 L 25 -25 L 0 0',
        },

        {
          name: 'Triangle rectangle isocèle 2',
          path: 'M 0 0 L 50 0 L 0 -50 L 0 0',
        },

        {
          name: 'Triangle rectangle',
          path: 'M 0 0 L 25 0 L 25 -50 L 0 0',
        },

        {
          name: 'Parallélogramme',
          path: 'M 0 0 L 50 0 L 0 -50 L -50 -50 L 0 0',
        },

        {
          name: 'Octogone régulier',
          path:
            'M 0 0 L 50 0 L 85.355339059329 -35.355339059329 L 85.355339059329 -85.355339059329 L 50 -120.710678118658 L 0 -120.710678118658 L -35.355339059329 -85.355339059329 L -35.355339059329 -35.355339059329 L 0 0',
        },
        /*
              {
                  name: "Triangle isocèle", segments: [
                      { type: 'vertex', x: 0, y: 0 },
                      { type: 'segment', x: 50, y: 0 },
                      { type: 'vertex', x: 50, y: 0 },
                      { type: 'segment', x: 25, y: - 60.355339059329 },
                      { type: 'vertex', x: 25, y: - 60.355339059329 },
                      { type: 'segment', x: 0, y: 0 }
                  ]
              },

              {
                  name: "Petit losange", segments: [
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
      ],
    },

    'Famille du pentagone régulier': {
      color: '#0F0',
      shapes: [
        {
          name: 'Pentagone régulier',
          path:
            'M 0 0 L 50 0 L 65.450849718737 -47.55282581475 L 25 -76.94208842935 L -15.450849718737 -47.55282581475 L 0 0Z',
        },

        {
          name: 'Triangle isocèle 1',
          path: 'M 0 0 L 50 0 L 25 -34.40954801175 L 0 0',
        },

        {
          name: 'Triangle isocèle 2',
          path: 'M 0 0 L 50 0 L 25 -76.9420884294 L 0 0',
        },

        {
          name: 'Triangle obtusangle',
          path: 'M 0 0 L 80.9016994375 0 L 40.4508497187 -29.3892626146 L 0 0',
        },

        {
          name: 'Petit losange',
          path:
            'M 0 0 L 50 0 L 90.4508497187 -29.3892626146 L 40.4508497187 -29.3892626146 L 0 0',
        },

        {
          name: 'Décagone régulier',
          path:
            'M 0 0 L 50 0 L 90.4508497187 -29.3892626146 L 105.9016994374 -76.9420884294 L 90.4508497187 -124.4949142442 L 50 -153.8841768588 L 0 -153.8841768588 L -40.4508497187 -124.4949142442 L -55.9016994374 -76.9420884294 L -40.4508497187 -29.3892626146 L 0 0',
        },
      ],
    },

    /*
      Attention: le dessin du cercle commence auéro trigonométrique. Lorsque
      l'on divise le contour du cercle (via l'outil diviser), il y a d'office un
      point qui est placé là où le cercle commence!
      Les cercles doivent également être dessinés dans le sens trigonométrique.
      */
    'Disques et segments': {
      color: '#CCC',
      shapes: [
        {
          //Circonscrit à l'hexagone -> rayon = 50.
          name: 'Disque 1',
          color: '#FF0',
          path: 'M 50 0 A 50 50 0 1 0 -50 0 A 50 50 0 1 0 50 0',
        },

        {
          //Circonscrit au pentagone -> rayon = 42.53254041760199.
          name: 'Disque 2',
          color: '#0F0',
          path:
            'M 42.53254041760199 0 A 42.53254041760199 42.53254041760199 0 1 0 -42.53254041760199 0 A 42.53254041760199 42.53254041760199 0 1 0 42.53254041760199 0',
        },

        {
          //Circonscrit au carré -> rayon = 35.35533905932738.
          name: 'Disque 3',
          color: '#F00',
          path:
            'M 35.35533905932738 0 A 35.35533905932738 35.35533905932738 0 1 0 -35.35533905932738 0 A 35.35533905932738 35.35533905932738 0 1 0 35.35533905932738 0',
        },

        {
          //Circonscrit au triangle équilatéral -> rayon = 28.86751345948129.
          name: 'Disque 4',
          color: '#FF0',
          path:
            'M 28.86751345948129 0 A 28.86751345948129 28.86751345948129 0 1 0 -28.86751345948129 0 A 28.86751345948129 28.86751345948129 0 1 0 28.86751345948129 0',
        },

        {
          name: 'Segment 1',
          color: '#0F0',
          path: 'M 0 0 L 50 0',
        },

        {
          name: 'Segment 2',
          color: '#0F0',
          path: 'M 0 0 L 50 50',
        },

        {
          name: 'Segment 3',
          color: '#0F0',
          path: 'M 0 0 L 0 -43.3012701892',
        },
      ],
    },
  },
};