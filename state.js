/*

This state object 

functions
	load_code(code): loads, parses, etc the code
	reset_field: resets to the initial state,
	reset_karel: (maybe remove later) reset karel to initial position?
	reset_state: resets the code state
	backup_state: backup the field
	restore_state: restore the field
	backup_restore: store the current field as a backup, and load the backed up state (if any)

	field0, field1: initial and final state for challenges
	field_matches(other): check if the field matches another field
	render_history: show code execution history, maybe?

*/
function setup_state() {
	function push_code_stack(line) {
		state.code.stack.push(line)
		// let command = state.code.parsed[line]
		let indent
		
		// if(command.type == "fcall") {
		// 	indent = 1
		// }
		// else {
		// }
		indent = state.code.indent_level() + 1



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
	function history_string(command) {
		if(command.type == "call") {
			return command.fname + "()"
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
			let err = try_call(command.fname)
			if(err) {
				return true
			}
			else {
				state.code.pos++
			}
			
		}
		else if(command.type == "fcall") {
			// TODO maybe? put jumps in code, rather than having a name lookup
			let pos =  state.code.fdefs[command.fname] + 1 // the next line
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
			// can no longer run code outside of functions
			error("at a function definition")
			// state.code.push_stack(state.code.pos)
			// state.code.pos++
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
			try_undo(command.fname)
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
				error("oh no...")
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
	
	function load_code(code) {
		state.code.unparsed = ("main()\n" + code).split("\n")
		let parsing = code_parser(state.code.unparsed)
		state.code.parsed = parsing.parsed
		state.code.errors = parsing.errors
		state.code.fdefs = parsing.fdefs

		// // find first line
		// for(let i = 0; i < state.code.parsed.length; i++) {
		// 	let line = state.code.parsed[i]
		// 	if(line.indent == 0 && line.type != "fdef" && line.type != "noop" && line.type != "error") {
		// 		state.code.initial_pos = i
		// 		break
		// 	}
		// }
		// state.code.final_pos = state.code.parsed.length - 1
		// if(state.code.initial_pos == -1) {
		// 	let i = state.code.fdefs["main"]
		// 	if(i != undefined) {
		// 		state.code.initial_pos =  i
		// 		state.code.final_pos = state.code.parsed[i].end
		// 	}
		// 	else {
		// 		state.code.initial_pos = 0
		// 	}
		// }
		// let main_pos = state.code.fdefs["main"]
		// state.code.initial_pos = main_pos
		// state.code.final_pos = state.code.parsed[main_pos].end
		
		// start at zero, which is the call to main
		state.code.initial_pos = 0
		state.code.final_pos = 1
		state.code.pos = 0
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
			if (state.challenge == "none") {
				return blank_field()
			}
			else {
				return JSON.parse(JSON.stringify(state.challenge_obj.state0))
			}
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
			state.field = state.field0
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
		render_history: render_history,
		load_code: load_code
	}

	return state
}

