export const cubesKit = {
  name: 'Cubes',
  families: {
    'Cube 1': {
      color: '#801f00',
      opacity: 1,
      shapeTemplates: [
        {
          name: 'Cube 1',
          new2: `18.30127018 36.60254036`,
          path: `L 43.30127018 25 L 86.60254036 0 V -50 L 43.30127018 -75 L 0 -50 Z
                 M 43.30127018 -25 V 25
                 M 43.30127018 -25 L 86.60254036 -50
                 M 43.30127018 -25 L 0 -50
                 `,
        },
      ],
    },
    'Cube 2': {
      color: '#801f00',
      opacity: 1,
      shapeTemplates: [
        {
          name: 'Cube 2',
          path: `H 50 L 71.650635094 -12.5 V -62.5 H 21.650635094 L 0 -50 Z
            M 50 -50 V 0
            M 50 -50 L 71.650635094 -62.5
            M 50 -50 H 0`,
        },
      ],
    },
  },
};
