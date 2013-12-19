angular.module('AG', ['canvas'])

.directive('actionButton',function(){
    return{
        restrict : 'AC',
        link : function(scope,element,attr){
            element.bind('click',function(){
                alert('click');
            });
        }
    };
})

.directive('toolbarItem',function(){
    var contexte;
    return{
        restrict : 'C',
        link : function(scope,element,attr){
            element.bind('click',function(){
                alert('click');
            });
            contexte = element[0].getContext("2d");
            contexte.fillRect(50,50,200,50);
        }
    };
})