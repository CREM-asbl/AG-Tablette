angular.module('AG', [])

.directive('actionButton',function(){
    return{
        restrict : 'AC',
//         templateUrl : 'js/interface/action-button/action-button.html',
        link : function(scope,element,attr){
            element.bind('click',function(){
                alert('click');
            });
        }
    };
})