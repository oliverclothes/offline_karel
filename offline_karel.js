

const tab_size = 2
let error_popup_on = true

const constants = {
	pen_size: 5,
	tab_size: tab_size,
	tab_space_string: Array(tab_size + 1).join(" "),
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


const start_state = {
	dims: [7, 4],
	field: [
		"0000000",
		"0000000",
		"0000000",
		"0000000"
	],
	karel: {
		col: 0,
		row: 0,
		dir: constants.right
	}
}

let settings = {
	auto_indent: true,
	mouse_action: "toggle"
}

function setup_field(karel, grid) {
	return {
		karel: karel,
		grid: grid,
		duplicate: () => setup_field(JSON.parse(JSON.stringify(karel)), JSON.parse(JSON.stringify(grid))),
		matches: other_field => {
			//return other_field.karel == karel && JSON.stringify(other_field.grid.grid_data) == JSON.stringify(grid.grid_data)
			return other_field.karel.col == karel.col && other_field.karel.row == karel.row && other_field.karel.dir == karel.dir &&
				 other_field.grid.cols == grid.cols && other_field.grid.rows == grid.rows &&
				 JSON.stringify(other_field.grid.grid_data) == JSON.stringify(grid.grid_data)
		}
	}
}

function blank_field() {
	return setup_field(
		{col: 0, row: 0, dir: constants.right},
		{
			cols: constants.max_cols, rows: constants.max_rows,
			grid_data: JSON.parse(JSON.stringify(Array(constants.max_rows).fill(Array(constants.max_cols).fill(0))))
		}
	)
}

// make it bigger to make it easily resizeable
function generate_field_grid(cols, rows, field_grid_strings) {
	function wrapn(n, max) {
		if (n < 0) {
			return max + n
		}
		return n
	}
	let data = Array(constants.max_rows)
	for (let row = 0; row < rows; row++) {
		// invert vertical so that Karel stays on the bottom as the field size changes
		data[row] = field_grid_strings[rows - row - 1].split("").map(c => c - '0')
		for (let col = cols; col < constants.max_cols; col++) {
			data[row].push(0)
		}
	}
	// let data = Array(rows)
	// for (let row = 0; row < rows; row++) {
	//     // invert vertical so that Karel stays on the bottom as the field size changes
	//     data[row] = field_grid_strings[rows - row - 1].split("").map(c => c - '0')
	// }
	return {
		cols: cols,
		rows: rows,
		grid_data: data
	}
}

function load_challenge(challenge_string) {
	let obj = challenges[challenge_string][0] // default first test case
	return {
		state0: setup_field(
			obj.karel0,
			generate_field_grid(obj.dims[0], obj.dims[1], obj.field0)
		),
		state1: setup_field(
			obj.karel1,
			generate_field_grid(obj.dims[0], obj.dims[1], obj.field1)
		)
	}
}


// set the default to the first style
let style = styles[Object.keys(styles)[0]]
let timeout_ms = 500
// dimensions of the world
let cols = 7
let rows = 4
var canv, ctx
function setup_state() {
	function push_code_stack(line) {
		state.code.stack.push(line)
		let command = state.code.parsed[line]
		let indent
		if(command.type == "fcall") {
			indent = 1
			if (command.id == "drop_line_by_two") {
				console.log("dropper")
			}
		}
		else {
			indent = state.code.indent_level() + 1
		}
		state.code.indent_stack.push(indent)
	}
	function pop_code_stack() {
		state.code.indent_stack.pop()
		return state.code.stack.pop()
	}
	function indent_lvl() {
		if(state.code.indent_stack.length == 0) {
			return 0
		}
		return state.code.indent_stack[state.code.indent_stack.length - 1]
	}
	let state = {
		pen_points: [],
		challenge: "none",
		challenge_obj: null,
		prev_tab: "history",
		code_styled: false,
		run_history: [],
		run_history_pos: 0,
		backup: null,
		code: {
			unparsed: [],
			parsed: [],
			errors: [],
			timer: null,
			timer_f: null,
			initial_pos: -1,
			final_pos: -1,
			pos: 0,
			load: load_code,
			stack: [],
			indent_stack: [],
			indent_level: indent_lvl,
			vars: {},
			fdefs: {},
			push_stack: push_code_stack,
			pop_stack: pop_code_stack
		},
		field: blank_field(),
		controls: {
			play: run_play,
			play_back: run_play_back,
			pause: run_pause,
			rewind: run_rewind,
			fast_forward: run_fast_forward,
			forward: run_forward,
			back: run_back
		},
		initial_field: () => {
			if (state.challenge == "none") {
				return blank_field()
			}
			else {
				return JSON.parse(JSON.stringify(state.challenge_obj.state0))
			}
		},
		reset_karel: () => {
			if (state.challenge == "none") {
				state.field.karel = blank_field().karel
			}
			else {
				state.field.karel = JSON.parse(JSON.stringify(state.challenge_obj.state0.karel))
			}
			refresh()
		},
		field0: () => {
			state.field = state.initial_field()
			refresh()
		},
		field1: () => {
			if (state.challenge != "none") {
				state.field = JSON.parse(JSON.stringify(state.challenge_obj.state1))
				refresh()
			}
			else {
				console.log("ERROR 3214")
			}

		},
		reset_field: () => {
			state.field = state.initial_field()
		},
		field_matches: (field) => {
			return JSON.stringify(field) == JSON.stringify(state.field)
		},
		reset_state: () => {
			// maybe todo ???
			if (state.challenge == "none") {
				state.reset_karel()
			}
			else {
				state.reset_field()
			}
			// state.field.grid = JSON.parse(initial_field.grid_string)
			state.run_history = []
			state.run_history_pos = 0
			state.code.timer = null
			state.code.timer_f = null
			// state.code.initial_pos = 0, // maybe reset doesn't reload code as well?
			state.code.pos = state.code.initial_pos
			state.code.stack = []
			state.code.indent_stack = []
			state.code.vars = {}
		},
		backup_state: () => {
			state.backup = JSON.stringify(state.field)
		},
		restore_state: () => {
			state.field = JSON.parse(state.backup)
			refresh()
		},
		backup_restore: () => {
			let backup = JSON.stringify(state.field)
			if(state.backup) {
				state.restore_state()
			}
			state.backup = backup
		},
		render_history: render_history
	}
	function history_string(command) {
		if(command.type == "call") {
			return command.id + "()"
		}
		else {
			return "-"
		}
	}
	function render_history() {
		let h = state.run_history.map((stuff) => {
			return stuff.pos + " " + history_string(state.code.parsed[stuff.pos])
		})
		return " " + h.slice(0, state.run_history_pos).join("\n ") +
			 "\n>" + h.slice(state.run_history_pos).join("\n ")
	}
	function run_forward() {
		// not sure if this can happen.
		if(state.code.parsed.length == 0) {
			error("SOMEHOW RUNNING BEFORE CODE PROPERLY PARSED")
			return true
		}

		if(state.code.pos == state.code.final_pos) {
			// todo: maybe fix this
			if (state.challenge !== "none") {
				let obj = challenges[state.challenge]
				let res = state.challenge_obj.state1.matches(state.field)
				if (res) {
					popup("Congratulations, Solved")
				}
				else {
					popup("Not correct")

				}
			}
			return true
		}
		
		// there is always a noop code at the end
		if(state.code.pos >= state.code.parsed.length - 1) {
			state.code.pos = state.code.parsed.length - 1
			run_pause()
			return true
		}

		let history_object = {
			pos: state.code.pos,
			stack: JSON.stringify(state.code.stack),
			indent_stack: JSON.stringify(state.code.indent_stack),
			vars: JSON.stringify(state.code.vars)
		}

		let command = state.code.parsed[state.code.pos]

		if(command.type == "call") {
			let err = try_call(command.id)
			if(err) {
				return true
			}
			else {
				state.code.pos++
			}
			
		}
		else if(command.type == "fcall") {
			// TODO maybe? put jumps in code, rather than having a name lookup
			let pos =  state.code.fdefs[command.id] + 1 // the next line
			if(pos != undefined) {
				state.code.push_stack(state.code.pos) // push call position
				state.code.pos = pos
			}
			else {
				error("CALLING NO FUNCTION")
				return true
			}
		}
		else if(command.type == "fdef") {
			// skip function
			state.code.pos = state.code.parsed[state.code.pos].end
		}
		else if(command.type == "for") {
			if(!state.code.vars.hasOwnProperty(command.var)) {
				state.code.vars[command.var] = command.count
			}
			state.code.vars[command.var]--
			if(state.code.vars[command.var] < 0) {
				delete state.code.vars[command.var]
				state.code.pos = command.end
			}
			else {
				state.code.push_stack(state.code.pos)
				state.code.pos++
			}
		}
		else if(command.type == "if" || command.type == "while") {
			let res = try_test(command.test)
			if(res) {
				state.code.push_stack(state.code.pos)
				state.code.pos++
			}
			else {
				state.code.pos = command.end
			}
		}
		else if(command.type == "else") {
			// this code runs when the if test fails
			state.code.push_stack(state.code.pos)
			state.code.pos++
		}
		else {
			// skip over both errors and empty lines
			state.code.pos++
		}
		// whiles jump back to check
		let next_command = state.code.parsed[state.code.pos]
		while(state.code.indent_level() > next_command.indent) {
			let last_line = state.code.stack[state.code.stack.length - 1]
			let last_command = state.code.parsed[last_line]
			state.code.pop_stack()
			if(last_command.type == "fcall") {
				// TODO: this is a bug, should check again if it's at the end of a while, for example
				state.code.pos = last_line + 1
			}
			else if(last_command.type == "while" || last_command.type == "for") {
				state.code.pos = last_line
			}
			else if(last_command.type == "if") {
				if(next_command.type == "else") {
					state.code.pos = next_command.end
				}
			}
			next_command = state.code.parsed[state.code.pos]
		}
		style_code(state.code.pos)
		refresh()
		// TODO: this might push errored stuff into the history
		// that doesn't actually execute, not sure if htat's good or bad
		state.run_history.splice(state.run_history_pos) // maybe not necessary, was for playground
		state.run_history.push(history_object)
		state.run_history_pos++
		return false
	}
	function run_back() {
		if(state.run_history_pos == 0) {
			run_pause()
			return
		}
		let stuff = state.run_history[--state.run_history_pos]
		let command = state.code.parsed[stuff.pos]
		if(command.type == "call") {
			try_undo(command.id)
		}
		state.code.pos = stuff.pos
		state.code.stack = JSON.parse(stuff.stack)
		state.code.indent_stack = JSON.parse(stuff.indent_stack)
		state.code.vars = JSON.parse(stuff.vars)
		refresh()
	}
	function run_rewind() {
		while(state.run_history_pos > 0) {
			run_back()
		}
		refresh()
	}
	function run_fast_forward() {
		for(let limit = 100000; limit > 0; limit--) {
			if(run_forward()) {
				// either an error, or normal completion?
				refresh()
				return
			}
		}
		error("Too many steps, you might have an infinite loop")
		refresh()
	}
	function run_play() {
		state.timer_f = run_forward
		state.timer = setInterval(run_forward, timeout_ms)
		document.getElementById("pause_button").disabled = false
		style_code(state.code.pos)
	}
	function run_play_back() {
		state.timer_f = run_back
		state.timer = setInterval(run_back, timeout_ms)
		document.getElementById("pause_button").disabled = false
	}
	function run_pause() {
		if(state.timer_f) {
			state.timer_f = null
			clearInterval(state.timer)
			document.getElementById("pause_button").disabled = true
		}
	}
	function parse() {

		
		function find_test(str) {
			let split = str.split(":")
			if (split.length > 1) {
				let check = split[0].trim()
				if (check.endsWith("()")) {
					let func = check.substring(0, check.length - 2)
					if (constants.conditions[func]) {
						return func
					}
				}
				else if (check == "True" || check == "False") {
					return check
				}
			}
		}
		
		function is_space(c) {
			return c == " " || c == "\t"
		}
		// changed from jumps to stack implementation
		let spaces = state.code.unparsed.map((line) => {
			// does a kind  of tabs to spaces conversion to calculate indent
			let sps = 0
			while (sps < line.length && is_space(line[sps])) {
				if (line[sps] == "\t") {
					let extra = constants.tab_size - (sps % constants.tab_size)
					sps += extra
				}
				else {
					sps++
				}
			}
			return sps
		})
		let indents = []
		let indent_stack = [0]
		// todo: make sure code is indented back to margin if it isn't already
		// maybe do this after code is edited  in field by user
		for(let i = 0; i < spaces.length; i++) {
			if(spaces[i] > indent_stack[indent_stack.length - 1]) {
				indent_stack.push(spaces[i])
			}
			else if(indent_stack.length > 1) {
				while(spaces[i] <= indent_stack[indent_stack.length - 2]) {
					indent_stack.pop()
				}
			}
			indents[i] = indent_stack.length - 1
		}
		function find_block_end(start) {
			let res
			for(res = start + 1; res < spaces.length && (spaces[res] > spaces[start] || state.code.unparsed[res].trim == ""); res++);
			res--
			while(res > 0 && state.code.unparsed[res].trim() == "") {
				res--
			}
			return res + 1
		}
		state.code.parsed = []
		state.code.errors = []
		state.code.fdefs = {}
		for(let i = 0; i < state.code.unparsed.length; i++) {
			let line = state.code.unparsed[i].trim()
			let index = line.length - 2
			
			if(line == "" || line.startsWith("#")) {
				res = {type: "noop"}
			}
			else if(line.substring(index) == "()" && constants.functions[line.substring(0, index)]) {
				if(constants.functions[line.substring(0, index)]) {
					res = {type: "call", id: line.substring(0, index)}
				}
				else {
					res = {type: "error"}
				}
			}
			else if(line.startsWith("if ")) {
				let test = find_test(line.substring(3))
				if(test) {
					res = {type: "if", test: test, end: find_block_end(i)}
				}
				else {
					res = {type: "error"}
				}
			}
			else if(line.startsWith("else")) {
				res = {type: "else", end: find_block_end(i)}
			}
			else if(line.startsWith("for ")) {
				let words = line.split(" ")
				if(words.length == 4 && words[3].length >= 9) {
					let num_string = (words[3]).substring(6, words[3].length - 2)
					let count = parseInt(num_string)
					res = {type: "for", var: words[1], count: count, end: find_block_end(i)}
				}
				else {
					res = {type: "error"}
				}
				console.log("forrr")
			}
			else if(line.startsWith("while ")) {
				let test = find_test(line.substring(6))
				if(test) {
					res = {type: "while", test: test, end: find_block_end(i)}
				}
				else {
					res = {type: "error"}
				}
			}
			else if(line.startsWith("def ")) {
				let id = line.substring(4, line.length - 3)
				res = {type: "fdef", id: id, end: find_block_end(i)}
				state.code.fdefs[id] = i
			}
			else if(line.endsWith("()")) {
				let id = line.substring(0, line.length - 2)
				res = {type: "fcall", id: id}
			}
			else {
				res = {type: "error"}
			}
			res["indent"] = indents[i]
			state.code.parsed.push(res)
			if (res.type == "error") {
				state.code.errors.push([i, line])
			}
		}

		// todo: find errors, like no indented code after a colon
		// and calling functions that don't exist

		// indent check
		// let parsed = state.code.parsed
		// for (let i = 0; i < parsed.length; i++) {
		//     if (parsed[i].type == "while" || parsed[i].type == "for" || parsed[i].type == "if" || parsed[i].type == "fdef") {
		//         let error = true
		//         let j
		//         for (j = i + 1; j < parsed.length && parsed[j].type == "noop"; j++) {
		//         }

		//         if (j == parsed.length) {
		//             state.code.errors.push([i, "no code after " + parsed[i].type])
		//         }
		//         // else if (parsed[j].type != "fcall" && parsed[j].type != "call" && parsed[i].indent >= parsed[j].indent) {
		//         //     state.code.errors.push([i, "no indent after " + parsed[i].type])
		//         // }
		//     }
		// }
	}
	function load_code(code) {
		state.code.unparsed = code.split("\n")
		parse()
		state.code.initial_pos = -1
		// find first line
		for(let i = 0; i < state.code.parsed.length; i++) {
			let line = state.code.parsed[i]
			if(line.indent == 0 && line.type != "fdef" && line.type != "noop" && line.type != "error") {
				state.code.initial_pos = i
				break
			}
		}
		state.code.final_pos = state.code.parsed.length - 1
		if(state.code.initial_pos == -1) {
			let i = state.code.fdefs["main"]
			if(i != undefined) {
				state.code.initial_pos =  i
				state.code.final_pos = state.code.parsed[i].end
			}
			else {
				state.code.initial_pos = 0
			}
		}
		state.code.pos = state.code.initial_pos
	}
	return state
}
var state = setup_state()
function popup(msg, title="") {
	state.timer_f = null
	clearInterval(state.timer)
	if(error_popup_on) {
		let md = document.getElementById("message_div")
		md.innerHTML = "<h3>" + title + "</h3>" + msg
		md.style.display = "block"
		document.getElementById("popup_div").style.display = "block"
	}
}
function error(msg) {
	console.log("ERROR - " + msg)
	popup(msg, "Error")
}
function draw(img, col, row, dir = constants.right) {
	if(dir == constants.down) {
		angle = Math.PI / 2;
	}
	else if(dir == constants.left) {
		angle = Math.PI;
	}
	else if(dir == constants.up){
		angle = Math.PI * 3 / 2;
	}
	else {
		angle = 0;
	}
	ctx.save()
	ctx.translate(style.imgw * (col + .5), style.imgh * (rows - row - .5))
	ctx.rotate(angle)
	ctx.translate(-.5 * img.width, -.5 * img.height)
	ctx.drawImage(img, 0, 0)
	ctx.restore()
}
function draw_count(font, col, row, count) {
	draw(font.img_border, col, row)
	let digits = count.toString().split("").map((d) => parseInt(d))
	
	ctx.fillStyle = font.bg

	let w = digits.length * font.width
	let x0 = (col + .5) * style.imgw - w / 2
	let y0 = (rows - row - .5) * style.imgh - font.height / 2
	// const border = 1
	// let digit = 2
	// ctx.fillRect(x0 - border, y0 - border, w + 2 * border, font.height + 2 * border)
	for(let i = 0; i < digits.length; i++) {
		ctx.drawImage(font.img_numbers, digits[i] * font.width, 0, font.width, font.height,
			x0 + i * font.width, y0, font.width, font.height)
	}
	// ctx.drawImage(style.beeper, 0, 0, style.imgw, style.imgh,
	//     col * style.imgw, row * style.imgh, style.imgw, style.imgh)
	
	ctx.fillStyle = style.bg
}
function draw_grid() {
	for(let row = 0; row < rows; row++) {
		for(let col = 0; col < cols; col++) {
			if(state.field.grid.grid_data[row][col] == 0) {
				draw(style.empty, col, row)
			}
		}
	}
}
function draw_beepers() {
	for(let row = 0; row < rows; row++) {
		for(let col = 0; col < cols; col++) {
			if(state.field.grid.grid_data[row][col] > 0) {
				draw(style.beeper, col, row)
			}
		}
	}
}
function draw_karel() {
	draw(style.karel, state.field.karel.col, state.field.karel.row, state.field.karel.dir)
}
function draw_numbers() {
	for(let row = 0; row < rows; row++) {
		for(let col = 0; col < cols; col++) {
			let n = state.field.grid.grid_data[row][col]
			if(n > 1) {
				draw_count(style.font, col, row, n)
			}
		}
	}
}
function try_undo(id) {
	let karel = state.field.karel
	let grid = state.field.grid.grid_data
	// might add error check later
	if(id == "move") {
		if(karel.dir == constants.right) {
			karel.col -= 1
		}
		else if(karel.dir == constants.down) {
			karel.row += 1
		}
		else if(karel.dir == constants.left) {
			karel.col += 1
		}
		else if(karel.dir == constants.up) {
			karel.row -= 1
		}
		else {
			error_msg("issue 850")
		}
	}
	else if(id == "turn_left") {
		karel.dir = (karel.dir + 1) % 4
	}
	else if(id == "put_beeper") {
		if(grid[karel.row][karel.col] == 0) {
			error("NO BEEPERS TO UNDO PUT")
			return true
		}
		grid[karel.row][karel.col]--
	}
	else if(id == "pick_beeper") {
		grid[karel.row][karel.col]++
	}
}
function front_is_clear() {
	let karel = state.field.karel
	if(karel.dir == constants.right && karel.col >= cols - 1) {
		return false
	}
	else if(karel.dir == constants.down && karel.row <= 0) {
		return false
	}
	else if(karel.dir == constants.left && karel.col <= 0) {
		return false
	}
	else if(karel.dir == constants.up && karel.row >= rows - 1) {
		return false
	}
	return true

}
function try_call(id) {
	let karel = state.field.karel
	let grid = state.field.grid.grid_data
	if(id == "move") {
		if(!front_is_clear()) {
			error("FRONT IS NOT CLEAR")
			return true
		}
		if(karel.dir == constants.right) {
			karel.col += 1
		}
		else if(karel.dir == constants.down) {
			karel.row -= 1
		}
		else if(karel.dir == constants.left) {
			karel.col -= 1
		}
		else if(karel.dir == constants.up) {
			karel.row += 1
		}
		else {
			error_msg("issue 905")
		}
		
	}
	else if(id == "turn_left") {
		karel.dir = (karel.dir + 3) % 4
	}
	else if(id == "put_beeper") {
		grid[karel.row][karel.col]++
	}
	else if(id == "pick_beeper") {
		if(grid[karel.row][karel.col] == 0) {
			error("NO BEEPERS TO PICK")
			return true
		}
		grid[karel.row][karel.col]--
	}
}
function try_test(test) {
	let karel = state.field.karel
	let grid = state.field.grid.grid_data
	if(test == "True") {
		return true
	}
	else if(test == "False") {
		return false
	}
	else if(test == "front_is_clear") {
		return front_is_clear()
	}
	else if(test == "front_is_blocked") {
		return !front_is_clear()
	}
	else if(test == "beepers_present") {
		return grid[karel.row][karel.col] > 0
	}
	else if(test == "no_beepers_present") {
		return grid[karel.row][karel.col] == 0
	}
	else if(test == "front_is_blocked") {
		return !front_is_clear()
	}
	else if(test == "left_is_clear") {
		karel.dir--
		res = front_is_clear()
		karel.dir++
		return res
	}
	else if(test == "left_is_blocked") {
		karel.dir--
		res = !front_is_clear()
		karel.dir++
		return res
	}
	else if(test == "right_is_clear") {
		karel.dir++
		res = front_is_clear()
		karel.dir--
		return res
	}
	else if(test == "right_is_blocked") {
		karel.dir++
		res = !front_is_clear()
		karel.dir--
		return res
	}
	else if(test == "facing_north") {
		return karel.dir == constants.up
	}
	else if(test == "not_facing_north") {
		return karel.dir !== constants.up
	}
	else if(test == "facing_south") {
		return karel.dir == constants.down
	}
	else if(test == "not_facing_south") {
		return karel.dir !== constants.down
	}
	else if(test == "facing_east") {
		return karel.dir == constants.right
	}
	else if(test == "not_facing_east") {
		return karel.dir !== constants.right
	}
	else if(test == "facing_west") {
		return karel.dir == constants.left
	}
	else if(test == "not_facing_west") {
		return karel.dir !== constants.left
	}
// //beepers_in_bag()	no_beepers_in_bag()	Does Karel have any beepers in its bag?
}
// add to code and run
function execute_call(id) {
	let err = try_call(id)
	if(!err) {
		refresh()
	}
}
function click_box(col, row) {
	let grid = state.field.grid.grid_data
	let karel = state.field.karel
	if (settings.mouse_action == "kmove") {
		karel.col = col
		karel.row = row
	}
	else if (settings.mouse_action == "add") {
		grid[row][col] += 1
	}
	else if (settings.mouse_action == "toggle" && grid[row][col] > 0) {
		grid[row][col] -= 1
	}
	else if(grid[row][col] > 0) {
		grid[row][col] = 0
	}
	else {
		grid[row][col] = 1
	}
	refresh()
}
function hotkey(str) {
	if(str == "w") {
		execute_call("pick_beeper")
	}
	if(str == "s") {
		execute_call("put_beeper")
	}
	if(str == "d") {
		execute_call("move")
	}
	if(str == "a") {
		execute_call("turn_left")
	}
	if(str == "u") {
		undo()
	}
	if(str == "r") {
		redo()
	}
}
function draw_points(ps) {
	let temp = ctx.fillStyle
	ctx.fillStyle = "black"
	ctx.stroke
	
	ctx.beginPath()
	//ctx.arc(x, y, constants.pen_size, 0, 2 * Math.PI)
	for (let point of ps) {
			// convert from col/row to pixel
			let x = point[0] * canv.width / cols
			let y = (rows - point[1]) * canv.height / rows
			ctx.lineTo(x, y)

			
			// ctx.fillRect(25, 25, 100, 100)
			// ctx.fillRect(point[0], point[1], 100, 100)
			
		}
		ctx.stroke()
		ctx.fillStyle = temp
}
function redraw() {
	ctx.fillRect(0, 0, canv.width, canv.height)
	draw_grid()
	draw_karel()
	draw_beepers()
	draw_numbers()

	if (settings.mouse_action == "pen") {
		state.pen_points.forEach(draw_points)
	}
}
function refresh() {
	let ta = document.getElementById("ta1")
	let tab = document.getElementById("id_title").value
	if(tab == "history") {
		ta.value = state.render_history()
	}
	else if(tab == "code" && state.code_styled) {
		style_code(state.code.pos)
	}
	redraw()
}
function load_all_images() {
	var counter = 0
	function waiter() {
		counter--
		if(counter == 0) {
			refresh()
		}
	}
	Object.keys(styles).forEach((id) => {
		counter += 3
		if(styles[id].font.img_border == null) {
			styles[id].font.img_border = new Image()
			styles[id].font.img_border.src = styles[id].font.base64_border
			styles[id].font.img_numbers = new Image()
			styles[id].font.img_numbers.src = styles[id].font.base64_numbers
		}
		styles[id].empty.src = styles[id].empty_img
		styles[id].beeper.src = styles[id].beeper_img
		styles[id].karel.src = styles[id].karel_img
		styles[id].empty.addEventListener('load', waiter)
		styles[id].beeper.addEventListener('load', waiter)
		styles[id].karel.addEventListener('load', waiter)
	})

}
function setup() {
	canv = document.getElementById("canv1")
	ctx = canv.getContext("2d")
	
	ctx.imageSmoothingEnabled = false

	canv.addEventListener('mousedown', function(e) {
		const rect = canv.getBoundingClientRect()
		const col = cols * (e.clientX - rect.left) / rect.width
		const row = rows * (rect.bottom - e.clientY) / rect.height

		
		if (settings.mouse_action == "pen") {
			// pen points relative to dots on grid
			state.pen_points.push([[col, row]])
			draw_points([col, row])
		}
		else if (settings.mouse_action == "kturn") {
			let karel = state.field.karel
			let dx = col - karel.col - .5
			let dy = row - karel.row - .5
			if (Math.abs(dx) > Math.abs(dy)) {
				if (dx > 0) {
					karel.dir = constants.right
				}
				else {
					karel.dir = constants.left
				}
			}
			else {
				// positive y is up
				if (dy > 0) {
					karel.dir = constants.up
				}
				else {
					karel.dir = constants.down
				}
			}
			refresh()
		}
		else {
			click_box(Math.floor(col), Math.floor(row))
		}
	})

	canv.addEventListener('mouseup', function(e) {
		// if (state.pen_points.length > 1 && state.pen_points.slice(-1)[0] == []) {
		//     state.pen_points.pop()
		// }
	})
	canv.addEventListener('mousemove', function(e) {
		var flags = e.buttons !== undefined ? e.buttons : e.which
		primary_mouse_down = (flags & 1) === 1
		if (primary_mouse_down && settings.mouse_action == "pen") {
			const rect = canv.getBoundingClientRect()
			const col = cols * (e.clientX - rect.left) / rect.width
			const row = rows * (rect.bottom - e.clientY) / rect.height
			// pen points relative to dots on grid
			let top = state.pen_points.slice(-1)[0]
			top.push([col, row])
			draw_points(top)
		}

	})

	// keypress everywhere but text area
	onkeypress = function(e) {
		e = e || window.event
		var charCode = (typeof e.which == "number") ? e.which : e.keyCode
		
		if (charCode > 0) {
			hotkey(String.fromCharCode(charCode))
		}
	}

	function insertAtCursor(myField, myValue) {
		if (myField.selectionStart || myField.selectionStart == '0') {
			var startPos = myField.selectionStart;
			var endPos = myField.selectionEnd;
			myField.value = myField.value.substring(0, startPos)
				+ myValue
				+ myField.value.substring(endPos, myField.value.length);
		}
		else {
			myField.value += myValue;
		}
	}

	
	function tab_out(ta) {
		//MOZILLA and others
		if (ta.selectionStart || ta.selectionStart == '0') {
			let pre0 = ta.value.slice(0, ta.selectionStart)
			let post = ta.value.slice(ta.selectionEnd)
			let mid0 = ta.value.slice(ta.selectionStart, ta.selectionEnd)
			if (pre0.indexOf("\n") < 0) {
				pre1 = "\t" + pre0
			}
			else {
				pre1 = pre0.split("\n").slice(0, -1).join("\n") + "\n\t" + pre0.split("\n").slice(-1)[0]
			}
			if (mid0 == "") {
				pre1 = pre0
				mid1 = "\t"
				ta.value = pre1 + mid1 + post
				ta.setSelectionRange(pre1.length + mid1.length , pre1.length + mid1.length)
			}
			// else if (mid0.indexOf("\n") < 0) {
			//     mid1 = "\t"
			//     ta.value = pre1 + mid1 + post
			//     ta.setSelectionRange(pre1.length + mid1.length , pre1.length + mid1.length)
			// }
			else {
				mid1 = mid0.split("\n").join("\n\t")
				ta.value = pre1 + mid1 + post
				ta.setSelectionRange(pre1.length, pre1.length + mid1.length)
			}
			// if (mid0 == "") {
			//     pre1 = pre0
			//     mid1 = "\t"
			//     ta.value = pre1 + mid1 + post
			//     ta.setSelectionRange(pre1.length + mid1.length , pre1.length + mid1.length)
			// }
			// else {
			//     pre1 = pre0.split("\n").slice(0, -1).join("\n") + "\n\t" + pre0.split("\n").slice(-1)[0]
			//     mid1 = mid0.split("\n").join("\n\t")
			//     ta.value = pre1 + mid1 + post
			//     ta.setSelectionRange(pre1.length, pre1.length + mid1.length)
			// }
		} else {
			ta.value += "\t"
		}
	}

	function tab_in(ta) {
		function tab_remover(str) {
			if (str.startsWith("\t")) {
				return str.slice(1)
			}
			return str
		}
		let pre = ta.value.substring(0, ta.selectionStart).split("\n")                 
		let mid = ta.value.substring(ta.selectionStart, ta.selectionEnd).split("\n")
		if (pre.length == 1) {
			pre1 = tab_remover(pre[0])
		}  
		else {
			pre1 = pre.slice(0, -1).join("\n") + "\n" + tab_remover(pre.slice(-1)[0])  
		}  
		if (mid.length == 1) {
			mid1 = mid[0]
		}
		else {
			mid1 = mid[0] +"\n" + mid.slice(1).map(tab_remover).join("\n")
		}
		ta.value = pre1 + mid1 + ta.value.substring(ta.selectionEnd)
		ta.setSelectionRange(pre1.length, pre1.length + mid1.length)
	}

	let ta1 = document.getElementById("ta1")
	ta1.style.tabSize = "" + constants.tab_size
	ta1.onkeydown = function(e) {
		if (e.key == "Tab") {
			e.preventDefault()
			if (e.shiftKey) {
				tab_in(ta1)
			}
			else {
				tab_out(ta1)
			}
		}
		else if(e.key == "Enter") {
			if (settings.auto_indent && ta1.selectionStart == ta1.selectionEnd) {
				let pos = ta1.selectionStart
				const spaceRegex = /\n([\ \t]*)[^\n]+$/
				let matches = spaceRegex.exec(ta1.value.slice(0, pos))
				if (matches.length > 1) {
					e.preventDefault()
					let ws = matches[1]
					ta1.value = ta1.value.slice(0, pos) + "\n" + ws + ta1.value.slice(pos)
					ta1.setSelectionRange(pos + ws.length + 1, pos + ws.length + 1)
				}
			}
		}

	}
	ta1.onkeypress = function(e) {
		console.log(e)
		e.stopPropagation()
	}


	let ss = document.getElementById("style_switcher")
	ss.innerHTML = Object.keys(styles).map((id) => '<option value="' + id + '">' + id + '</option>').join("\n")

	load_all_images()
	change_tab()
	change_fps()
	change_style()
	
	ta1.value = "# calls main\nmain()\n\ndef main():\n\tmove()"
	change_code()

	// there has to be a better way
	window.addEventListener('mousemove', resize_canvas)
}

function update_ui_to_field() {
	document.getElementById("col_field").value = "" + cols
	document.getElementById("row_field").value = "" + rows
	if (state.challenge == "none") {
		document.getElementById("col_field").disabled = false
		document.getElementById("row_field").disabled = false
	}
	else {
		document.getElementById("col_field").disabled = true
		document.getElementById("row_field").disabled = true
	}
}

// function load_field_state(dims, field, karel) {
//     cols = dims[0]
//     rows = dims[1]
//     data = JSON.parse(JSON.stringify(Array(constants.max_rows).fill(Array(constants.max_cols).fill(0))))
//     for (let row = 0; row < rows; row++) {
//         for (let col = 0; col < cols; col++) {
//             data[row][col] = state.field.grid.grid_data[row][col]
//         }
//     }
//     state.field.grid = {
//         cols: constants.max_cols,
//         rows: constants.max_rows,
//         grid_data: data
//     }
//     update_ui_to_field()
// }

// function resize_grid(dims) {

// }

function set_challenge() {
	let challenge = document.getElementById("challenge_switcher").value
	state.challenge = challenge
	if (challenge == "none") {
		//load_state(start_state.dims, start_state.field, start_state.karel)
		// juste enable column/row setting ui fields
		update_ui_to_field()

		// just copy current field
	}
	else {
		state.challenge_obj = load_challenge(challenge)
		state.reset_field()
		let test = challenges[challenge][0]

		// maybe cols and rows is if the grid displayed is different from the grid data?
		// otherwise not in state variable?
		cols = test.dims[0]
		rows = test.dims[1]
		
		state.field0() // = state.initial_field() // challenges[challenge][0])

		
		refresh() // I guess refresh the field... or something?
		// taken from setting col function
		change_style() // to refresh things?
	}
	update_ui_to_field()
}
function change_tab() {
	let old_state
	let tab = document.getElementById("id_title").value
	let ta = document.getElementById("ta1")
	// backup
	if(state.prev_tab == "code") {
		if(!state.code_styled) {
			state.code.unparsed = ta.value.split("\n")
		}
	}
	
	if(state.prev_tab == "playground" && (tab == "code" || tab == "history") ||
		tab == "playground" && (state.prev_tab == "code" || state.prev_tab == "history")) {
		state.backup_restore()
	}
	
	if(tab == "code") {
		ta.disabled = false
		ta.value = state.code.unparsed.join("\n")
		ta.style.display = "block"
	}
	else if(tab == "history") {
		ta.disabled = true
		ta.value = state.render_history()
		ta.style.display = "block"
	}
	else if(tab == "playground") {
		ta.style.display = "none"
		document.getElementById("td1").width = 0
	}

	if(tab == "playground") {
		constants.playground_buttons.forEach((id) => {
			document.getElementById(id).style.display = "inline-block"
		})
		constants.code_buttons.forEach((id) => {
			document.getElementById(id).style.display = "none"
		})
	}
	else {
		constants.code_buttons.forEach((id) => {
			document.getElementById(id).style.display = "inline-block"
		})
		constants.playground_buttons.forEach((id) => {
			document.getElementById(id).style.display = "none"
		})
	}
	state.prev_tab = tab
	// rewrites text area
	refresh()
}
// function style_code(marker = -1) {
//     let errors = []
//     let res = []
//     for(let i = 0; i < state.code.unparsed.length; i++) {
//         if(i == marker) {
//             symbol = "> " //➡️
//         }
//         else if(state.code.parsed[i].type == "error") {
//             symbol = "X " //❌
//             errors.push([i + 1, state.code.unparsed[i]])
//         }
//         else {
//             symbol = "* " //🔹✅
//             // symbol = "* " //🔹
//         }
//         res.push(symbol + state.code.unparsed[i])
//     }
//     document.getElementById("ta1").value = res.join("\n")
//     state.code_styled = true

//     // maybe todo: maybe change a bit
//     if (errors.length > 0) {
//         let error_msg = errors.map(x => "Line " + x[0] + ": " + x[1]).join("<br>")
//         error(error_msg)
//     }

// }
function style_code(marker = -1) {
	let res = []
	for(let i = 0; i < state.code.unparsed.length; i++) {
		if(i == marker) {
			symbol = "> " //➡️
		}
		else if(state.code.parsed[i].type == "error") {
			symbol = "X " //❌
		}
		else {
			symbol = "* " //🔹✅
			// symbol = "* " //🔹
		}
		res.push(symbol + state.code.unparsed[i])
	}
	document.getElementById("ta1").value = res.join("\n")
	state.code_styled = true

	// maybe todo: maybe change a bit
	if (state.code.errors.length > 0) {
		let error_msg = state.code.errors.map(x => "Line " + x[0] + ": " + x[1]).join("<br>")
		error(error_msg)
	}

}
function unstyle_code() {
	if(state.code_styled) {
		let ta = document.getElementById("ta1")
		ta.value = state.code.unparsed.join("\n")
		state.code_styled = false
	}
}
function edit_code() {
	unstyle_code()
}
function change_code() {
	let tab = document.getElementById("id_title").value
	let ta = document.getElementById("ta1")
	if(tab == "code") {
		// state.reset()

		// CODE "CLEANING"
		let lines = ta.value.split("\n")
		// set indentation of blank lines to be the same as last line
		for(let i = 1; i < lines.length; i++) {
			if(lines[i].trim() == "") {
				let j
				for(j = 0; j < lines[i-1].length && lines[i-1].charAt(j) == " "; j++);
				lines[i] = lines[i-1].substring(0, j)
			}
		}
		// require it end in newline at base indentation level
		// (one reason is for a required noop when needing to loop back for a while loop)
		if(lines[lines.length - 1].trim() == "") {
			lines.length = lines.length - 1
		}
		lines.push("")
		ta.value = lines.join("\n")
		state.code.load(ta.value)

		// TODO maybe if it's worth it, allow modifying code while retaining state
		state.reset_state()
	}
}
function resize_canvas() {
	const margins = 10
	const max_h = document.documentElement.clientHeight * .8
	console.log("resizing the canvas")
	const rect = document.getElementById("canvas_holder").getBoundingClientRect()
	let h = Math.min(max_h, rect.width)
	if (rect.width / h > cols / rows) {
		// height limited
		canv.style.width = (h * cols / rows - margins) + "px"
		canv.style.height = (h - margins) + "px"
	}
	else {
		canv.style.width = (rect.width - margins) + "px"
		canv.style.height = (rect.width * rows / cols - margins) + "px"
	}

}
function change_style() {
	style = styles[document.getElementById("style_switcher").value]
	canv.width = style.imgw * cols
	canv.height = style.imgh * rows
	// canv.style.aspectRatio = cols + "/" + rows
	resize_canvas()

	ctx.fillStyle = style.bg
	refresh()
}
function change_fps() {
	timeout_ms = 10000 / document.getElementById("fps_field").value
	if(state.timer_f) {
		clearInterval(state.timer)
		state.timer = setInterval(state.timer_f, timeout_ms)
	}
}
// cols and rows might not be used much, since they used to be broken
function change_cols() {
	cols = parseInt(document.getElementById("col_field").value)
	state.reset_state() // might not need this at some point
	change_style() // to refresh things?
}
function change_rows() {
	rows = parseInt(document.getElementById("row_field").value)
	// if(state.field.krow >= rows) {
	//     state.field.krow = rows - 1
	// }
	state.reset_state() // might not need this at some point
	change_style() // to refresh things?
}
function blurs() {
	let tab = document.getElementById("id_title").value
	if(tab == "code") {
		style_code()
	}
}
function close_popup() {
	document.getElementById("popup_div").style.display = "none"
	document.getElementById("message_div").style.display = "none"
}
function warning_toggle() {
	error_popup_on = document.getElementById("warn").checked
}
function indent_toggle() {
	settings.auto_indent = document.getElementById("indenter").checked
}
function set_mouse_action() {
	settings.mouse_action = document.getElementById("mouse_action").value
	
	// if keeping old drawing
	// redraw()
	// but now just erasing everything
	if (settings.mouse_action == "pen") {
		state.pen_points = []
	}
	// to erase pen points when turning off drawing
	redraw()
}
function load_state(str) {
	if (state.challenge == "none") {

	}
	else if (str == "start") {
		state.field0()
	}
	else if (str == "end") {
		state.field1()
	}
}
