import { app } from './App'

export class DrawAPI {

    constructor(upperCanvas, mainCanvas, backgroundCanvas) {
        this.canvas = {
            "upper": upperCanvas,
            "main": mainCanvas,
            "background": backgroundCanvas
        };
        this.upperCtx = this.canvas.upper.getContext("2d");
        this.mainCtx = this.canvas.main.getContext("2d");
        this.backgroundCtx = this.canvas.background.getContext("2d");

		//this.scale = 1; //TODO
	}

    refreshBackground() {
        console.log("refresh background !");
    }

    refreshMain() {
        console.log("refresh main !");

        //Afficher les formes
        app.workspace.shapes.forEach(shape => {
            this.drawShape(shape, this.mainCtx);
        });

    }

    refreshUpper() {
        console.log("refresh upper !");
    }

    drawShape(shape, ctx) {
        ctx.strokeStyle = shape.borderColor;
        ctx.fillStyle = shape.color;

        ctx.translate(shape.x, shape.y);

        ctx.fill(shape.getPath());
		ctx.stroke(shape.getPath());

        ctx.translate(-shape.x, -shape.y);
    }
}
