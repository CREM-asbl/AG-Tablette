/**
 * Edit the HTML to fit the window size.
 */

//shows the app
App.divs.main.style.display = "block";

//set canvas fixed size
App.canvas.setAttribute("width", App.divs.canvas.clientWidth);
App.canvas.setAttribute("height", App.divs.canvas.clientHeight);

//when the window is resized, update canvas size
window.onresize = function(e){ /* temporaire ?*/
	App.canvas.setAttribute("width", App.divs.canvas.clientWidth);
	App.canvas.setAttribute("height", App.divs.canvas.clientHeight);
};

App.start();
