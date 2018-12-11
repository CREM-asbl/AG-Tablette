export const canvasViewCss = `
        #app-canvas-view {
            width: 100%;
            margin: 0px;
            padding: 0px;
            min-width: 500px;
            height: 100%;
        }
        #app-canvas-view > .toolbar {
            display: flex;
            flex-flow: column;
            width: 20%;
            min-width: 180px;
            float:left;
            padding: 4px;
            height: 100%;
            box-sizing: border-box;
            border-right: 1px solid gray;
            background-color: #ddd;
        }

        #app-canvas-view-toolbar-p1 {
            padding-bottom: 16px;
            border-bottom: 1px solid lightslategray;
            margin-bottom: 16px;
        }

        #app-canvas-view-toolbar-p2 {
            flex: 1;
            overflow-y: auto;
        }
`