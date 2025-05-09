

let error_popup_on = true


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
		
		state.field0()

		
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
			state.code.load_code(ta.value)
		}
	}
	
	if(state.prev_tab == "playground" && (tab == "code" || tab == "history") ||
		tab == "playground" && (state.prev_tab == "code" || state.prev_tab == "history")) {
		state.backup_restore()
	}
	
	if(tab == "code") {
		ta.disabled = false
		ta.value = state.code.unparsed.slice(1).join("\n")
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
	for(let i = 1; i < state.code.unparsed.length; i++) {
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
		ta.value = state.code.unparsed.slice(1).join("\n")
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
