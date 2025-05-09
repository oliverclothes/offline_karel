
const constants = {
	pen_size: 5,
	tab_size: 2,
	max_rows: 100,
	max_cols: 100,
	// directions
	right: 0,
	down: 1,
	left: 2,
	up: 3,
	functions: {
		'move': true,
		'turn_left': true,
		'put_beeper': true,
		'pick_beeper': true
	},
	conditions: {
		'front_is_clear': true,
		'front_is_blocked': true,
		'beepers_present': true,
		'no_beepers_present': true,
		'left_is_clear': true,
		'left_is_blocked': true,
		'right_is_clear': true,
		'right_is_blocked': true,
//beepers_in_bag()	no_beepers_in_bag()	Does Karel have any beepers in its bag?
		'facing_north': true,
		'not_facing_north': true,
		'facing_south': true,
		'not_facing_south': true,
		'facing_east': true,
		'not_facing_east': true,
		'facing_west': true,
		'not_facing_west': true
	},
	playground_buttons: [
		"move_button",
		"turn_button",
		"put_button",
		"pick_button",
		"reset_button"
	],
	code_buttons: [
		"rewind_button",
		"play_back_button",
		"back_button",
		"pause_button",
		"forward_button",
		"play_button",
		"fast_forward_button"
	]
}
