// Todo: transformer le js en json quand d'autres kit seront créés

export const standardShapes = {
    'Triangle équilatéral': {
        color: "#FF0",
        shapes: [
            {
                name: "Triangle équilatéral",
                steps: [
                    { type: 'line', x: 25 - 25, y: -43.3012701892 + 14.433756729733 },
                    { type: 'line', x: 0 - 25, y: 0 + 14.433756729733 },
                    { type: 'line', x: 50 - 25, y: 0 + 14.433756729733 },
                    { type: 'line', x: 25 - 25, y: -43.3012701892 + 14.433756729733 }
                ],
                refPoint: { "x": -25, "y": +14.433756729733 }
            },
            {
                name: "Losange",
                steps: [
                    { type: 'line', x: -25 - 12.5, y: -43.3012701892 + 21.650635094600 },
                    { type: 'line', x: 0 - 12.5, y: 0 + 21.650635094600 },
                    { type: 'line', x: 50 - 12.5, y: 0 + 21.650635094600 },
                    { type: 'line', x: 25 - 12.5, y: -43.3012701892 + 21.650635094600 },
                    { type: 'line', x: -25 - 12.5, y: -43.3012701892 + 21.650635094600 }
                ],
                refPoint: { "x": -12.5, "y": +21.650635094600 }
            },

            {
                name: "Trapèze isocèle",
                steps: [
                    { type: 'line', x: 25 - 50, y: -43.3012701892 + 21.650635094600 },
                    { type: 'line', x: 0 - 50, y: 0 + 21.650635094600 },
                    { type: 'line', x: 100 - 50, y: 0 + 21.650635094600 },
                    { type: 'line', x: 75 - 50, y: -43.3012701892 + 21.650635094600 },
                    { type: 'line', x: 25 - 50, y: -43.3012701892 + 21.650635094600 }
                ],
                refPoint: { "x": -50, "y": +21.650635094600 }
            },

            {
                name: "Hexagone régulier", steps: [
                    { type: 'line', x: 0 - 25, y: -86.6025403784 + 43.3012701892 },
                    { type: 'line', x: -25 - 25, y: -43.3012701892 + 43.3012701892 },
                    { type: 'line', x: 0 - 25, y: 0 + 43.3012701892 },
                    { type: 'line', x: 50 - 25, y: 0 + 43.3012701892 },
                    { type: 'line', x: 75 - 25, y: -43.3012701892 + 43.3012701892 },
                    { type: 'line', x: 50 - 25, y: -86.6025403784 + 43.3012701892 },
                    { type: 'line', x: 0 - 25, y: -86.6025403784 + 43.3012701892 }
                ], refPoint: { "x": -25, "y": +43.3012701892 }
            },

            {
                name: "Triangle isocèle", steps: [
                    { type: 'line', x: 25 - 25, y: -14.433756729747 + 4.811252243249 },
                    { type: 'line', x: 0 - 25, y: 0 + 4.811252243249 },
                    { type: 'line', x: 50 - 25, y: 0 + 4.811252243249 },
                    { type: 'line', x: 25 - 25, y: -14.433756729747 + 4.811252243249 }
                ], refPoint: { "x": -25, "y": +4.811252243249 }
            },

            {
                name: "Triangle rectangle", steps: [
                    { type: 'line', x: 0 - 8.3333333333333, y: -43.3012701892 + 14.433756729733 },
                    { type: 'line', x: 0 - 8.3333333333333, y: 0 + 14.433756729733 },
                    { type: 'line', x: 25 - 8.3333333333333, y: 0 + 14.433756729733 },
                    { type: 'line', x: 0 - 8.3333333333333, y: -43.3012701892 + 14.433756729733 }
                ], refPoint: { "x": -8.3333333333333, "y": +14.433756729733 }
            },

            {
                name: "Trapèze rectangle", steps: [
                    { type: 'line', x: 25 - 18.75, y: -43.3012701892 + 21.650635094600 },
                    { type: 'line', x: 0 - 18.75, y: -43.3012701892 + 21.650635094600 },
                    { type: 'line', x: 0 - 18.75, y: 0 + 21.650635094600 },
                    { type: 'line', x: 50 - 18.75, y: 0 + 21.650635094600 },
                    { type: 'line', x: 25 - 18.75, y: -43.3012701892 + 21.650635094600 }
                ], refPoint: { "x": -18.75, "y": +21.650635094600 }
            },

            {
                name: "Dodécagone régulier", steps: [
                    { type: 'line', x: 0 - 25, y: 0 + 93.301270189200 },
                    { type: 'line', x: 50 - 25, y: 0 + 93.301270189200 },
                    { type: 'line', x: 93.301270189200 - 25, y: -25 + 93.301270189200 },
                    { type: 'line', x: 118.301270189200 - 25, y: -68.301270189200 + 93.301270189200 },
                    { type: 'line', x: 118.301270189200 - 25, y: -118.301270189200 + 93.301270189200 },
                    { type: 'line', x: 93.301270189200 - 25, y: -161.602540378400 + 93.301270189200 },
                    { type: 'line', x: 50 - 25, y: -186.602540378400 + 93.301270189200 },
                    { type: 'line', x: 0 - 25, y: -186.602540378400 + 93.301270189200 },
                    { type: 'line', x: -43.301270189200 - 25, y: -161.602540378400 + 93.301270189200 },
                    { type: 'line', x: -68.301270189200 - 25, y: -118.301270189200 + 93.301270189200 },
                    { type: 'line', x: -68.301270189200 - 25, y: -68.301270189200 + 93.301270189200 },
                    { type: 'line', x: -43.301270189200 - 25, y: -25 + 93.301270189200 },
                    { type: 'line', x: 0 - 25, y: 0 + 93.301270189200 }
                ], refPoint: { "x": -25, "y": +93.301270189200 }
            },

            {
                name: "Grand triangle isocèle", steps: [
                    { type: 'line', x: 0 - 25, y: 0 + 31.100423396400 },
                    { type: 'line', x: 50 - 25, y: 0 + 31.100423396400 },
                    { type: 'line', x: 25 - 25, y: -93.301270189200 + 31.100423396400 },
                    { type: 'line', x: 0 - 25, y: 0 + 31.100423396400 }
                ], refPoint: { "x": -25, "y": +31.100423396400 }
            },

            {
                name: "Petit losange", steps: [
                    { type: 'line', x: 0 - 46.650635094600, y: 0 + 12.5 },
                    { type: 'line', x: 50 - 46.650635094600, y: 0 + 12.5 },
                    { type: 'line', x: 93.301270189200 - 46.650635094600, y: -25 + 12.5 },
                    { type: 'line', x: 43.301270189200 - 46.650635094600, y: -25 + 12.5 },
                    { type: 'line', x: 0 - 46.650635094600, y: 0 + 12.5 }
                ], refPoint: { "x": -46.650635094600, "y": +12.5 }
            },

            {
                name: "Petit disque", steps: [
                    { type: 'line', x: 28.867513459466, y: 0 },
                    { type: 'arc', x: 0, y: 0, angle: 2 * Math.PI }
                ], refPoint: { "x": 0, "y": 0 }
            },

            {
                name: "Grand disque", steps: [
                    { type: 'line', x: 50, y: 0 },
                    { type: 'arc', x: 0, y: 0, angle: 2 * Math.PI }
                ], refPoint: { "x": 0, "y": 0 }
            }
        ]
    },

    'Carré': {
        color: '#F00',
        shapes: [
            {
                name: "Carré", steps: [
                    { type: 'line', x: 0 - 25, y: 0 + 25 },
                    { type: 'line', x: 50 - 25, y: 0 + 25 },
                    { type: 'line', x: 50 - 25, y: - 50 + 25 },
                    { type: 'line', x: 0 - 25, y: - 50 + 25 },
                    { type: 'line', x: 0 - 25, y: 0 + 25 }
                ], refPoint: { "x": -25, "y": +25 }
            },

            {
                name: "Triangle isocèle", steps: [
                    { type: 'line', x: 0 - 25, y: 0 + 20.118446353109 },
                    { type: 'line', x: 50 - 25, y: 0 + 20.118446353109 },
                    { type: 'line', x: 25 - 25, y: - 60.355339059329 + 20.118446353109 },
                    { type: 'line', x: 0 - 25, y: 0 + 20.118446353109 }
                ], refPoint: { "x": -25, "y": +20.118446353109 }
            },

            {
                name: "Petit triangle rectangle isocèle", steps: [
                    { type: 'line', x: 0 - 25, y: 0 + 12.5 },
                    { type: 'line', x: 50 - 25, y: 0 + 12.5 },
                    { type: 'line', x: 25 - 25, y: - 25 + 12.5 },
                    { type: 'line', x: 0 - 25, y: 0 + 12.5 }
                ], refPoint: { "x": -25, "y": +12.5 }
            },

            {
                name: "Triangle rectangle isocèle", steps: [
                    { type: 'line', x: 0 - 16.666666666666, y: 0 + 16.666666666666 },
                    { type: 'line', x: 50 - 16.666666666666, y: 0 + 16.666666666666 },
                    { type: 'line', x: 0 - 16.666666666666, y: - 50 + 16.666666666666 },
                    { type: 'line', x: 0 - 16.666666666666, y: 0 + 16.666666666666 }
                ], refPoint: { "x": -16.666666666666, "y": +16.666666666666 }
            },

            {
                name: "Petit triangle rectangle", steps: [
                    { type: 'line', x: 0 - 16.666666666666, y: 0 + 16.666666666666 },
                    { type: 'line', x: 25 - 16.666666666666, y: 0 + 16.666666666666 },
                    { type: 'line', x: 25 - 16.666666666666, y: - 50 + 16.666666666666 },
                    { type: 'line', x: 0 - 16.666666666666, y: 0 + 16.666666666666 }
                ], refPoint: { "x": -16.666666666666, "y": +16.666666666666 }
            },

            {
                name: "Parallélogramme", steps: [
                    { type: 'line', x: 0, y: 0 + 25 },
                    { type: 'line', x: 50, y: 0 + 25 },
                    { type: 'line', x: 0, y: - 50 + 25 },
                    { type: 'line', x: -50, y: -50 + 25 },
                    { type: 'line', x: 0, y: 0 + 25 }
                ], refPoint: { "x": 0, "y": +25 }
            },

            {
                name: "Petit losange", steps: [
                    { type: 'line', x: 0 - 42.677669529664, y: 0 + 17.677669529664 },
                    { type: 'line', x: 50 - 42.677669529664, y: 0 + 17.677669529664 },
                    { type: 'line', x: 85.355339059329 - 42.677669529664, y: - 35.355339059329 + 17.677669529664 },
                    { type: 'line', x: 35.355339059329 - 42.677669529664, y: -35.355339059329 + 17.677669529664 },
                    { type: 'line', x: 0 - 42.677669529664, y: 0 + 17.677669529664 }
                ], refPoint: { "x": -17.677669529664, "y": +17.677669529664 }
            },

            {
                name: "Octogone régulier", steps: [
                    { type: 'line', x: 0 - 25, y: 0 + 60.355339059329 },
                    { type: 'line', x: 50 - 25, y: 0 + 60.355339059329 },
                    { type: 'line', x: 85.355339059329 - 25, y: - 35.355339059329 + 60.355339059329 },
                    { type: 'line', x: 85.355339059329 - 25, y: -85.355339059329 + 60.355339059329 },
                    { type: 'line', x: 50 - 25, y: -120.710678118658 + 60.355339059329 },
                    { type: 'line', x: 0 - 25, y: -120.710678118658 + 60.355339059329 },
                    { type: 'line', x: -35.355339059329 - 25, y: -85.355339059329 + 60.355339059329 },
                    { type: 'line', x: -35.355339059329 - 25, y: -35.355339059329 + 60.355339059329 },
                    { type: 'line', x: 0 - 25, y: 0 + 60.355339059329 }
                ], refPoint: { "x": -25, "y": +60.355339059329 }
            },

            {
                name: "Disque", steps: [
                    { type: 'line', x: 35.355339059327, y: 0  },
                    { type: 'arc', x: 0, y: 0, angle: 2 * Math.PI }
                ], refPoint: { "x": 0, "y": 0 }
            }
        ]
    },

    'Pentagone régulier': {
        color: '#0F0',
        shapes: [
            {
                name: "Pentagone régulier", steps: [
                    { type: 'line', x: 0 - 25, y: 0 + 34.409548011750 },
                    { type: 'line', x: 50 - 25, y: 0 + 34.409548011750 },
                    { type: 'line', x: 65.450849718737 - 25, y: - 47.552825814750 + 34.409548011750 },
                    { type: 'line', x: 25 - 25, y: - 76.942088429350 + 34.409548011750 },
                    { type: 'line', x: -15.450849718737 - 25, y: - 47.552825814750 + 34.409548011750 },
                    { type: 'line', x: 0 - 25, y: 0 + 34.409548011750 }
                ], refPoint: { "x": -25, "y": +34.409548011750 }
            },

            {
                name: "Petit triangle isocèle", steps: [
                    { type: 'line', x: 0 - 25, y: 0 + 11.469849337250 },
                    { type: 'line', x: 50 - 25, y: 0 + 11.469849337250 },
                    { type: 'line', x: 25 - 25, y: - 34.409548011750 + 11.469849337250 },
                    { type: 'line', x: 0 - 25, y: 0 + 11.469849337250 }
                ], refPoint: { "x": -25, "y": +11.469849337250 }
            },

            {
                name: "Grand triangle isocèle", steps: [
                    { type: 'line', x: 0 - 25, y: 0 + 25.647362809800 },
                    { type: 'line', x: 50 - 25, y: 0 + 25.647362809800 },
                    { type: 'line', x: 25 - 25, y: - 76.942088429400 + 25.647362809800 },
                    { type: 'line', x: 0 - 25, y: 0 + 25.647362809800 }
                ], refPoint: { "x": -25, "y": +25.647362809800 }
            },

            {
                name: "Triangle obtusangle", steps: [
                    { type: 'line', x: 0 - 43.63389981246667, y: 0 + 51.2947256196 },
                    { type: 'line', x: 105.9016994374 - 43.63389981246667, y: - 76.9420884294 + 51.2947256196 },
                    { type: 'line', x: 25 - 43.63389981246667, y: -76.9420884294 + 51.2947256196 },
                    { type: 'line', x: 0 - 43.63389981246667, y: 0 + 51.2947256196 }
                ], refPoint: { "x": -43.63389981246667, "y": +51.2947256196 }
            },

            {
                name: "Petit losange", steps: [
                    { type: 'line', x: 0 - 45.225424859350, y: 0 + 14.694631307300 },
                    { type: 'line', x: 50 - 45.225424859350, y: 0 + 14.694631307300 },
                    { type: 'line', x: 90.4508497187 - 45.225424859350, y: - 29.3892626146 + 14.694631307300 },
                    { type: 'line', x: 40.4508497187 - 45.225424859350, y: -29.3892626146 + 14.694631307300 },
                    { type: 'line', x: 0 - 45.225424859350, y: 0 + 14.694631307300 }
                ], refPoint: { "x": -45.225424859350, "y": +14.694631307300 }
            },

            {
                name: "Décagone régulier", steps: [
                    { type: 'line', x: 0 - 25, y: 0 + 76.942088429400 },
                    { type: 'line', x: 50 - 25, y: 0 + 76.942088429400 },
                    { type: 'line', x: 90.4508497187 - 25, y: - 29.3892626146 + 76.942088429400 },
                    { type: 'line', x: 105.9016994374 - 25, y: - 76.9420884294 + 76.942088429400 },
                    { type: 'line', x: 90.4508497187 - 25, y: - 124.4949142442 + 76.942088429400 },
                    { type: 'line', x: 50 - 25, y: - 153.8841768588 + 76.942088429400 },
                    { type: 'line', x: 0 - 25, y: - 153.8841768588 + 76.942088429400 },
                    { type: 'line', x: -40.4508497187 - 25, y: - 124.4949142442 + 76.942088429400 },
                    { type: 'line', x: -55.9016994374 - 25, y: - 76.9420884294 + 76.942088429400 },
                    { type: 'line', x: -40.4508497187 - 25, y: - 29.3892626146 + 76.942088429400 },
                    { type: 'line', x: 0 - 25, y: 0 + 76.942088429400 }
                ], refPoint: { "x": -25, "y": +76.942088429400 }
            },

            {
                name: "Disque", steps: [
                    { type: 'line', x: 42.5325404176, y: 0 },
                    { type: 'arc', x: 0, y: 0, angle: 2 * Math.PI }
                ], refPoint: { "x": 0, "y": 0 }
            }
        ]
    }
}