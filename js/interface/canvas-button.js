angular.module('AG')

.directive('canvasButton',function(standardKitService){
    return{
        restrict : 'C',
        link : function(scope,element,attr){
            var canvas = element[0];
            var graphic = canvas.getContext('2d');
            
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            
            standardKitService.getStandardShape(1,1)
                    .paint(graphic);
            
            element.on('click', function(){
               alert('constructShape'); 
            });
        }
    };
});