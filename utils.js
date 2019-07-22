/**
 * Randomize array element order in-place.
 * Using Durstenfeld shuffle algorithm.
 * 
 * https://stackoverflow.com/a/12646864/2734389
 * 
 */
function shuffleArray(array, rng) {
    if (rng === undefined) rng = Math.random.bind(Math);
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(rng() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}


// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.
debounce = function(func, wait, immediate) {
	var timeout;
	return function() {
		var context = this, args = arguments;
		var later = function() {
			timeout = null;
			if (!immediate) func.apply(context, args);
		};
		var callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) func.apply(context, args);
	};
};