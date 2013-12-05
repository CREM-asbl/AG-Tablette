angular.module('canvas',[])

.directive('canvas',function(){
    return{
        restrict : 'E',
        link : function(scope,element){
            var canvas = element[0];
            var graphic = canvas.getContext('2d');
            graphic.globalAlpha = 0.5;
            graphic.globalCompositeOperation = "lighter";
            
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
                      
            function draw(){
                graphic.strokeStyle = "magenta";
                graphic.arc(event.clientX-canvas.offsetLeft,event.clientY-canvas.offsetTop,2,0,2*Math.PI,true);
                graphic.stroke();
            }
                    
            element.on('click', function(event){
                draw(event);
            });
         }
    }
})