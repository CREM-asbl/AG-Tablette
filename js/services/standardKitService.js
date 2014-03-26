angular.module('AG')

.factory('standardKitService',function($http){
//    var kit = {};
//    $http.get('data/kitStd.json')
//         .success(function(data){
//             kit = data;
//    });
    var selectedShape;
    
    return {
        
        getStandardShape : function(famille, forme){
            if (famille == 1)
            {
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
                    }
                };
            }else if (famille == 2){
                return {
                    x : 10,
                    y : 50,
                    setCoordonnees : function(x,y){
                        this.x = x;
                        this.y = y;
                    },
                    paint : function(graphic){
                        graphic.fillStyle = "yellow";
                        graphic.beginPath();
                        graphic.moveTo(this.x,this.y);
                        graphic.lineTo(this.x+40,this.y);
                        graphic.lineTo(this.x+20,this.y-40);
                        graphic.closePath();
                        graphic.fill();
                        graphic.stroke();
                    }
                };
            }
        },
        
        setSelectedShape : function(famille,forme){
            selectedShape  = this.getStandardShape(famille,forme);
        },
        
        getSelectedShape : function(){
            return selectedShape;
        }
    };
});