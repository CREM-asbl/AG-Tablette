export const geometryKit = {
  name: 'Figures libres',
  families: [
    {
      name: 'Points',
      shapesTemplates: []
    },
    {
      name: 'Lignes',
      shapesTemplates: [
        { name: 'Segment', title: 'Segment' },
        { name: 'ParalleleSegment', title: 'Segment parallèle' },
        { name: 'PerpendicularSegment', title: 'Segment perpendiculaire' },
        { name: 'SemiStraightLine', title: 'Demi-droite' },
        { name: 'ParalleleSemiStraightLine', title: 'Demi-droite parallèle' },
        { name: 'PerpendicularSemiStraightLine', title: 'Demi-droite perpendiculaire' },
        { name: 'StraightLine', title: 'Droite' },
        { name: 'ParalleleStraightLine', title: 'Droite parallèle' },
        { name: 'PerpendicularStraightLine', title: 'Droite perpendiculaire' },
        { name: 'Strip', title: 'Bande' },
        { name: 'Vector', title: 'Vecteur' }
      ]
    },
    {
      name: 'Triangles',
      shapesTemplates: []
    },
    {
      name: 'Quadrilatères',
      shapesTemplates: []
    },
    {
      name: 'Arcs',
      shapesTemplates: []
    }
  ]
}