/*global sound: true*/
sound =
(function () {
"use strict";

var AC = window.AudioContext || window.webkitAudioContext,
	soundCheckbox = document.getElementById('sound'),
	ac;

function generateSound (freq, incr, delay, times, vol, type) {
	//based on https://github.com/foumart/JS.13kGames/blob/master/lib/SoundFX.js
	//which is why the parameters are a little odd
	var start, end, osc, gain;

	if (!ac) {
		ac = new AC();
	}
	start = ac.currentTime + 0.01;
	end = start + delay * times / 1000;

	osc = ac.createOscillator();
	gain = ac.createGain();
	osc.type = ['square', 'sawtooth', 'triangle', 'sine'][type || 0];
	gain.gain.value = 0;
	osc.connect(gain);
	gain.connect(ac.destination);
	osc.start();

	osc.frequency.setValueAtTime(freq, start);
	osc.frequency.linearRampToValueAtTime(freq + incr * times, end);
	gain.gain.setValueAtTime(vol, start);
	gain.gain.linearRampToValueAtTime(0, end);
	osc.stop(end + 0.01);
}

function playSound (type) {
	if (!AC || !soundCheckbox.checked) {
		return;
	}
	switch (type) {
	case 'move':
		generateSound(100, -10, 15, 15, 0.7, 2);
		break;
	case 'item':
		generateSound(510, 0, 15, 20, 0.1);
		setTimeout(function () {
			generateSound(2600, 1, 10, 50, 0.2);
		}, 80);
		break;
	case 'ranged':
		generateSound(160, 10, 15, 10, 0.1);
		generateSound(250, -20, 30, 10, 0.1, 1);
		generateSound(1500, -150, 30, 10, 0.1, 1);
		break;
	case 'hit':
		generateSound(100, -10, 10, 25, 0.5);
		generateSound(125, -5, 20, 45, 0.1, 1);
		generateSound(40, 2, 20, 20, 1, 2);
		generateSound(200, -4, 10, 100, 0.25, 2);
		break;
	case 'strong':
		generateSound(220, 15, 20, 15, 0.3, 2);
		break;
	case 'weak':
		generateSound(440, -15, 20, 15, 0.3, 2);
	}
}

return playSound;
})();