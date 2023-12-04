export const cubesKit = {
  name: 'Cubes',
  families: [
    {
      name: 'Cube 1',
      fillColor: '#f46c2e',
      fillOpacity: 1,
      shapeTemplates: [
        {
          name: 'Cube 1',
          path: `L 43.30127018 25 L 86.60254036 0 V -50 L 43.30127018 -75 L 0 -50 Z
                 M 43.30127018 -25 V 25
                 M 43.30127018 -25 L 86.60254036 -50
                 M 43.30127018 -25 L 0 -50
                 `
        }
      ]
    },
    {
      name: 'Cube 2',
      fillColor: '#f46c2e',
      fillOpacity: 1,
      shapeTemplates: [
        {
          name: 'Cube 2',
          path: `H 50 L 71.650635094 -12.5 V -62.5 H 21.650635094 L 0 -50 Z
            M 50 -50 V 0
            M 50 -50 L 71.650635094 -62.5
            M 50 -50 H 0`
        }
      ]
    }
  ]
}
