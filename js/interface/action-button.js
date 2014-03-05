angular.module('AG')

.directive('actionButton',function(){
    return{
        restrict : 'AC',
        scope : {action : '@'},
        link : function(scope,element,attr){
            element.bind('click',function(){
                alert(scope.action);
            });
        }
    };
});