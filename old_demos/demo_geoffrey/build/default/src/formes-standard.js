var pathPolygonReg=function(a,b){for(var c='M 0 '+b,d=2*Math.PI/a,e=0,f=b,g=0;g<a-1;g++)nextAngle=d*g,console.log(nextAngle),e+=b*Math.cos(nextAngle),f-=b*Math.sin(nextAngle),c+=' L '+e+' '+f;return c+=' Z',c},stdShapes={"Triangle équilatéral":{color:'yellow',shapes:{TriangEqui:'M 25 7.5 L 50 50 H 0 Z',PTriangIso:'M 25 28.33 L 50 50 H 0 Z',TriangRect:'M 25 7.5 L 50 50 H 25 25 Z',Losange:'M 0 7.5 H 50 L 75 50 H 25 Z',TrapRect:'M 25 7.5 L 50 50 H 0 V 7.5 Z',TrapIso:'M 25 7.5 H 75 L 100 50 H 0 Z',HexaReg:'M 25 7.5 H 75 L 100 50 L 75 92.5 H 25 L 0 50Z',GTriangIso:'M 0 50 H 50 L 25 -43.3 Z',PLosan:'M 0 50 L 50 50 L 93.30 25 L 43.30 25 Z',DodecaReg:'M 0 50 L 50 50 L 93.30127018922194 25 L 118.30127018922195 -18.301270189221928 L 118.30127018922195 -68.30127018922192 L 93.30127018922197 -111.60254037844386 L 50.00000000000004 -136.60254037844388 L 4.263256414560601e-14 -136.60254037844388 L -43.301270189221896 -111.60254037844389 L -68.30127018922192 -68.30127018922197 L -68.30127018922194 -18.301270189221967 L -43.30127018922197 24.999999999999986 Z',PDisque:'M 25 0 A 1 1 0 0 0 25 60 A 1 1 0 0 0 25 0 Z',GDisque:'M 25 7.5 A 1 1 0 0 0 75 92.5 A 1 1 0 0 0 25 7.5 Z'}},Carré:{color:'red',shapes:{Carre:'M 0 0 H 50 V 50 H 0 Z',TriangIso:'M 0 60 H 50 L 25 0 Z',PTriangRectIso:'M 25 25 L 50 50 H 0 Z',TriangRectIso:'M 0 0 V 50 H 25 Z',PTriangRect:'M 25 0 V 50 H 0 Z',Parallelogram:'M 0 0 H 50 L 100 50 H 50 Z',Losan:'M 35 0 H 85 L 50 35 H 0 Z',OctoReg:'M 35 0 H 85 L 120 35 V 85 L 85 120 H 35 L 0 85 V 35 Z',Disque:'M 0 0 A 1 1 0 0 0 50 50 A 1 1 0 0 0 0 0 Z'}},"Pentagone régulier":{color:'green',shapes:{PentaReg:'M 0 50 H 50 L 65.45 2.45 L 25 -26.93 L -15.45 2.45 Z',TriangIso:'M 0 50 H 50 L 25 15.6 Z',GTriangIso:'M 0 50 H 50 L 25 -26.94 Z',TriangObtu:'M 0 50 H 50 L 65.45 2.45 Z',PLosan:'M 0 50 H 50 L 90.45 20.61 H 40.45 Z',DecaReg:'M 0 50 H 50 L 90.45 20.61 L 105.9 -27.55 L 90.45 -75.10 L 50 -104.49 L 0 -104.49 L -40.45 -75.10 L -55.9 -27.55 L -40.45 20.61 Z',Disque:'M 0 50 A 1 1 0 0 0 50 -104.49 A 1 1 0 0 0 0 50 Z'}}},getFirstFamilyShape=function(a){var b='';return'Triangle \xE9quilat\xE9ral'===a?b='TriangEqui':'Carr\xE9'===a?b='Carre':'Pentagone r\xE9gulier'===a?b='PentaReg':void 0,b},createShape=function(a,b){var c=stdShapes[a],d=document.createElementNS('http://www.w3.org/2000/svg','path');return d.setAttribute('d',c.shapes[b]),d.setAttribute('fill',c.color),d.setAttribute('stroke-width',2),d.setAttribute('stroke','black'),d.setAttribute('opacity',.75),d},getCGShape=function(a){var b=a.getBoundingClientRect(),c=b.x+b.width/2,d=b.y+b.height/2;return{x:c,y:d}},updateTransformShape=function(a){var b=[];if(a.removeAttribute('transform'),a.translate&&b.push('translate('+a.translate.x+','+a.translate.y+')'),a.angle){var c=getCGShape(a);b.push('rotate('+a.angle+', '+c.x+', '+c.y+')')}b.length&&a.setAttribute('transform',b.join(' '))},selectShape=function(a){a.setAttribute('stroke','magenta')},unselectShape=function(a){a.setAttribute('stroke','black')},translateShape=function(a,b){a.translate={x:b.x-25,y:b.y-25},updateTransformShape(a)},rotateShape=function(a,b){a.angle=a.angle+b||b,updateTransformShape(a)};