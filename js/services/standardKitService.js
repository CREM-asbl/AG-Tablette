angular.module('AG')

.factory('standardKitService',function(){
    return {
        getStandardShape : function(famille, forme){
            return {
                x : 10,
                y : 50,
                setCoordonnees : function(x,y){
                    this.x = x;
                    this.y = y;
                },
                paint : function(graphic){
                    graphic.fillStyle = "red";
                    graphic.beginPath();
                    graphic.moveTo(this.x,this.y);
                    graphic.lineTo(this.x+40,this.y);
                    graphic.lineTo(this.x+40,this.y-40);
                    graphic.lineTo(this.x, this.y-40);
                    graphic.closePath();
                    graphic.fill();
                    graphic.stroke();
//                    graphic.fillRect(this.x,this.y,30,30);
                }
            };
        }
    };
});