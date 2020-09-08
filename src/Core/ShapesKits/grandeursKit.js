export const grandeursKit = {
  name: 'Formes standard',
  families: {
    'Famille du triangle équilatéral': {
      color: '#FF0',
      shapes: [
        {
          name: 'Triangle équilatéral',
          segments: [
            {
              vertexes: [
                { x: 25, y: -43.3012701892 },
                { x: 0, y: 0 },
              ],
            },
            {
              vertexes: [
                { x: 0, y: 0 },
                { x: 50, y: 0 },
              ],
            },
            {
              vertexes: [
                { x: 50, y: 0 },
                { x: 25, y: -43.3012701892 },
              ],
            },
          ],
        },

        {
          name: 'Triangle isocèle',
          segments: [
            {
              vertexes: [
                { x: 25, y: -14.433756729747 },
                { x: 0, y: 0 },
              ],
            },
            {
              vertexes: [
                { x: 0, y: 0 },
                { x: 50, y: 0 },
              ],
            },
            {
              vertexes: [
                { x: 50, y: 0 },
                { x: 25, y: -14.433756729747 },
              ],
            },
          ],
        },

        {
          name: 'Triangle rectangle',
          segments: [
            {
              vertexes: [
                { x: 0, y: -43.3012701892 },
                { x: 0, y: 0 },
              ],
            },
            {
              vertexes: [
                { x: 0, y: 0 },
                { x: 25, y: 0 },
              ],
            },
            {
              vertexes: [
                { x: 25, y: 0 },
                { x: 0, y: -43.3012701892 },
              ],
            },
          ],
        },

        {
          name: 'Losange',
          segments: [
            {
              vertexes: [
                { x: -25, y: -43.3012701892 },
                { x: 0, y: 0 },
              ],
            },
            {
              vertexes: [
                { x: 0, y: 0 },
                { x: 50, y: 0 },
              ],
            },
            {
              vertexes: [
                { x: 50, y: 0 },
                { x: 25, y: -43.3012701892 },
              ],
            },
            {
              vertexes: [
                { x: 25, y: -43.3012701892 },
                { x: -25, y: -43.3012701892 },
              ],
            },
          ],
        },

        {
          name: 'Trapèze rectangle',
          segments: [
            {
              vertexes: [
                { x: 25, y: -43.3012701892 },
                { x: 0, y: -43.3012701892 },
              ],
            },
            {
              vertexes: [
                { x: 0, y: -43.3012701892 },
                { x: 0, y: 0 },
              ],
            },
            {
              vertexes: [
                { x: 0, y: 0 },
                { x: 50, y: 0 },
              ],
            },
            {
              vertexes: [
                { x: 50, y: 0 },
                { x: 25, y: -43.3012701892 },
              ],
            },
          ],
        },

        {
          name: 'Trapèze isocèle',
          segments: [
            {
              vertexes: [
                { x: 25, y: -43.3012701892 },
                { x: 0, y: 0 },
              ],
            },
            {
              vertexes: [
                { x: 0, y: 0 },
                { x: 100, y: 0 },
              ],
            },
            {
              vertexes: [
                { x: 100, y: 0 },
                { x: 75, y: -43.3012701892 },
              ],
            },
            {
              vertexes: [
                { x: 75, y: -43.3012701892 },
                { x: 25, y: -43.3012701892 },
              ],
            },
          ],
        },

        {
          name: 'Hexagone régulier',
          segments: [
            {
              vertexes: [
                { x: 0, y: -86.6025403784 },
                { x: -25, y: -43.3012701892 },
              ],
            },
            {
              vertexes: [
                { x: -25, y: -43.3012701892 },
                { x: 0, y: 0 },
              ],
            },
            {
              vertexes: [
                { x: 0, y: 0 },
                { x: 50, y: 0 },
              ],
            },
            {
              vertexes: [
                { x: 50, y: 0 },
                { x: 75, y: -43.3012701892 },
              ],
            },
            {
              vertexes: [
                { x: 75, y: -43.3012701892 },
                { x: 50, y: -86.6025403784 },
              ],
            },
            {
              vertexes: [
                { x: 50, y: -86.6025403784 },
                { x: 0, y: -86.6025403784 },
              ],
            },
          ],
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
          segments: [
            {
              vertexes: [
                { x: 0, y: 0 },
                { x: 50, y: 0 },
              ],
            },
            {
              vertexes: [
                { x: 50, y: 0 },
                { x: 50, y: -50 },
              ],
            },
            {
              vertexes: [
                { x: 50, y: -50 },
                { x: 0, y: -50 },
              ],
            },
            {
              vertexes: [
                { x: 0, y: -50 },
                { x: 0, y: 0 },
              ],
            },
          ],
        },

        {
          name: 'Triangle rectangle isocèle 1',
          segments: [
            {
              vertexes: [
                { x: 0, y: 0 },
                { x: 50, y: 0 },
              ],
            },
            {
              vertexes: [
                { x: 50, y: 0 },
                { x: 25, y: -25 },
              ],
            },
            {
              vertexes: [
                { x: 25, y: -25 },
                { x: 0, y: 0 },
              ],
            },
          ],
        },

        {
          name: 'Triangle rectangle isocèle 2',
          segments: [
            {
              vertexes: [
                { x: 0, y: 0 },
                { x: 50, y: 0 },
              ],
            },
            {
              vertexes: [
                { x: 50, y: 0 },
                { x: 0, y: -50 },
              ],
            },
            {
              vertexes: [
                { x: 0, y: -50 },
                { x: 0, y: 0 },
              ],
            },
          ],
        },

        {
          name: 'Triangle rectangle',
          segments: [
            {
              vertexes: [
                { x: 0, y: 0 },
                { x: 25, y: 0 },
              ],
            },
            {
              vertexes: [
                { x: 25, y: 0 },
                { x: 25, y: -50 },
              ],
            },
            {
              vertexes: [
                { x: 25, y: -50 },
                { x: 0, y: 0 },
              ],
            },
          ],
        },

        {
          name: 'Parallélogramme',
          segments: [
            {
              vertexes: [
                { x: 0, y: 0 },
                { x: 50, y: 0 },
              ],
            },
            {
              vertexes: [
                { x: 50, y: 0 },
                { x: 0, y: -50 },
              ],
            },
            {
              vertexes: [
                { x: 0, y: -50 },
                { x: -50, y: -50 },
              ],
            },
            {
              vertexes: [
                { x: -50, y: -50 },
                { x: 0, y: 0 },
              ],
            },
          ],
        },

        {
          name: 'Octogone régulier',
          segments: [
            {
              vertexes: [
                { x: 0, y: 0 },
                { x: 50, y: 0 },
              ],
            },
            {
              vertexes: [
                { x: 50, y: 0 },
                { x: 85.355339059329, y: -35.355339059329 },
              ],
            },
            {
              vertexes: [
                { x: 85.355339059329, y: -35.355339059329 },
                { x: 85.355339059329, y: -85.355339059329 },
              ],
            },
            {
              vertexes: [
                { x: 85.355339059329, y: -85.355339059329 },
                { x: 50, y: -120.710678118658 },
              ],
            },
            {
              vertexes: [
                { x: 50, y: -120.710678118658 },
                { x: 0, y: -120.710678118658 },
              ],
            },
            {
              vertexes: [
                { x: 0, y: -120.710678118658 },
                { x: -35.355339059329, y: -85.355339059329 },
              ],
            },
            {
              vertexes: [
                { x: -35.355339059329, y: -85.355339059329 },
                { x: -35.355339059329, y: -35.355339059329 },
              ],
            },
            {
              vertexes: [
                { x: -35.355339059329, y: -35.355339059329 },
                { x: 0, y: 0 },
              ],
            },
          ],
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
          segments: [
            {
              vertexes: [
                { x: 0, y: 0 },
                { x: 50, y: 0 },
              ],
            },
            {
              vertexes: [
                { x: 50, y: 0 },
                { x: 65.450849718737, y: -47.55282581475 },
              ],
            },
            {
              vertexes: [
                { x: 65.450849718737, y: -47.55282581475 },
                { x: 25, y: -76.94208842935 },
              ],
            },
            {
              vertexes: [
                { x: 25, y: -76.94208842935 },
                { x: -15.450849718737, y: -47.55282581475 },
              ],
            },
            {
              vertexes: [
                { x: -15.450849718737, y: -47.55282581475 },
                { x: 0, y: 0 },
              ],
            },
          ],
        },

        {
          name: 'Triangle isocèle 1',
          segments: [
            {
              vertexes: [
                { x: 0, y: 0 },
                { x: 50, y: 0 },
              ],
            },
            {
              vertexes: [
                { x: 50, y: 0 },
                { x: 25, y: -34.40954801175 },
              ],
            },
            {
              vertexes: [
                { x: 25, y: -34.40954801175 },
                { x: 0, y: 0 },
              ],
            },
          ],
        },

        {
          name: 'Triangle isocèle 2',
          segments: [
            {
              vertexes: [
                { x: 0, y: 0 },
                { x: 50, y: 0 },
              ],
            },
            {
              vertexes: [
                { x: 50, y: 0 },
                { x: 25, y: -76.9420884294 },
              ],
            },
            {
              vertexes: [
                { x: 25, y: -76.9420884294 },
                { x: 0, y: 0 },
              ],
            },
          ],
        },

        {
          name: 'Triangle obtusangle',
          segments: [
            {
              vertexes: [
                { x: 0, y: 0 },
                { x: 80.9016994375, y: 0 },
              ],
            },
            {
              vertexes: [
                { x: 80.9016994375, y: 0 },
                { x: 40.4508497187, y: -29.3892626146 },
              ],
            },
            {
              vertexes: [
                { x: 40.4508497187, y: -29.3892626146 },
                { x: 0, y: 0 },
              ],
            },
          ],
        },

        {
          name: 'Petit losange',
          segments: [
            {
              vertexes: [
                { x: 0, y: 0 },
                { x: 50, y: 0 },
              ],
            },
            {
              vertexes: [
                { x: 50, y: 0 },
                { x: 90.4508497187, y: -29.3892626146 },
              ],
            },
            {
              vertexes: [
                { x: 90.4508497187, y: -29.3892626146 },
                { x: 40.4508497187, y: -29.3892626146 },
              ],
            },
            {
              vertexes: [
                { x: 40.4508497187, y: -29.3892626146 },
                { x: 0, y: 0 },
              ],
            },
          ],
        },

        {
          name: 'Décagone régulier',
          segments: [
            {
              vertexes: [
                { x: 0, y: 0 },
                { x: 50, y: 0 },
              ],
            },
            {
              vertexes: [
                { x: 50, y: 0 },
                { x: 90.4508497187, y: -29.3892626146 },
              ],
            },
            {
              vertexes: [
                { x: 90.4508497187, y: -29.3892626146 },
                { x: 105.9016994374, y: -76.9420884294 },
              ],
            },
            {
              vertexes: [
                { x: 105.9016994374, y: -76.9420884294 },
                { x: 90.4508497187, y: -124.4949142442 },
              ],
            },
            {
              vertexes: [
                { x: 90.4508497187, y: -124.4949142442 },
                { x: 50, y: -153.8841768588 },
              ],
            },
            {
              vertexes: [
                { x: 50, y: -153.8841768588 },
                { x: 0, y: -153.8841768588 },
              ],
            },
            {
              vertexes: [
                { x: 0, y: -153.8841768588 },
                { x: -40.4508497187, y: -124.4949142442 },
              ],
            },
            {
              vertexes: [
                { x: -40.4508497187, y: -124.4949142442 },
                { x: -55.9016994374, y: -76.9420884294 },
              ],
            },
            {
              vertexes: [
                { x: -55.9016994374, y: -76.9420884294 },
                { x: -40.4508497187, y: -29.3892626146 },
              ],
            },
            {
              vertexes: [
                { x: -40.4508497187, y: -29.3892626146 },
                { x: 0, y: 0 },
              ],
            },
          ],
        },
      ],
    },

    /*
      Attention: le dessin du cercle commence au zéro trigonométrique. Lorsque
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
          segments: [
            {
              vertexes: [
                { x: 50, y: 0 },
                { x: 50, y: 0 },
              ],
              arcCenter: { x: 0, y: 0 },
            },
          ],
        },

        {
          //Circonscrit au pentagone -> rayon = 42.53254041760199.
          name: 'Disque 2',
          color: '#0F0',
          segments: [
            {
              vertexes: [
                { x: 42.53254041760199, y: 0 },
                { x: 42.53254041760199, y: 0 },
              ],
              arcCenter: { x: 0, y: 0 },
            },
          ],
        },

        {
          //Circonscrit au carré -> rayon = 35.35533905932738.
          name: 'Disque 3',
          color: '#F00',
          segments: [
            {
              vertexes: [
                { x: 35.35533905932738, y: 0 },
                { x: 35.35533905932738, y: 0 },
              ],
              arcCenter: { x: 0, y: 0 },
            },
          ],
        },

        {
          //Circonscrit au triangle équilatéral -> rayon = 28.86751345948129.
          name: 'Disque 4',
          color: '#FF0',
          segments: [
            {
              vertexes: [
                { x: 28.86751345948129, y: 0 },
                { x: 28.86751345948129, y: 0 },
              ],
              arcCenter: { x: 0, y: 0 },
            },
          ],
        },

        {
          name: 'Segment 1',
          color: '#0F0',
          segments: [
            {
              vertexes: [
                { x: 0, y: 0 },
                { x: 50, y: 0 },
              ],
            },
          ],
        },

        {
          name: 'Segment 2',
          color: '#0F0',
          segments: [
            {
              vertexes: [
                { x: 0, y: 0 },
                { x: 50, y: 50 },
              ],
            },
          ],
        },

        {
          name: 'Segment 3',
          color: '#0F0',
          segments: [
            {
              vertexes: [
                { x: 0, y: 0 },
                { x: 0, y: -43.3012701892 },
              ],
            },
          ],
        },
      ],
    },
  },
};
