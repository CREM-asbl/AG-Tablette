angular.module('AG')

//todo standardKitService provisoire à remplacer par gestionnaire de contenu
.directive('canvasMain',function(standardKitService){
   
    return{
        restrict : 'AC',
        link : function(scope,element){
            var canvas = element[0];
            var graphic = canvas.getContext('2d');
            graphic.globalAlpha = 0.5;
            graphic.globalCompositeOperation = "lighter";
            
                       
            function paint(){
                 var forme = standardKitService.getSelectedShape();
                 console.log(forme);
                 if (forme){
                    forme.setCoordonnees(event.clientX-canvas.offsetLeft, event.clientY-canvas.offsetTop);
                    forme.paint(graphic);
                }
            }
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
                      
            element.on('click', function(event){
                paint(event);
            });
            
//            element.on('mousemove',function(event){
//                console.log('('+event.clientX+','+event.clientY+')');
//            });
         }
    };
});