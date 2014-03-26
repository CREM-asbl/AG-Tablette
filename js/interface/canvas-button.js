angular.module('AG')

.directive('canvasButton',function(standardKitService){
    return{
        restrict : 'C',
        scope : {famille : '@'},
        link : function(scope,element,attr){
            var canvas = element[0];
            var graphic = canvas.getContext('2d');
            
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            
            var figure = standardKitService.getStandardShape(scope.famille,1);
            if(figure){
                figure.paint(graphic);
            }
            
            element.on('click', function(){
               standardKitService.setSelectedShape(scope.famille,1);
            });
        }
    };
});