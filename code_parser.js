/*

Parsing in its own file for the sake of simpplicity.

returns a dictionary of hte form:
{

parsed: an array of dictionaries
example:
{
	type: a type is one of the strings below
		"fdef": user-defined function definition
		"fcall": a call of a user-defined function
		"call": call of a built-in function
		"error": unable to parse the line
		"noop": blank line (or similar)
		and, "if", "else", "for", "while"
	end: line of code that runs after this line??
	indent: the number of spaces that at the start of the line
	fname: function name for "call" or "fcall" or "fdef"
	test: for "if" and "while" it is the name of the built-in function to test
		(or it is "True" or "False" for code like "while True:")

}

errors: an array of dictionaries
fdefs: a dictionary that maps the name of a user-defined function to a line number

}

*/

function code_parser(unparsed) {

	let parsed = []
	let errors = []
	let fdefs = {}

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
	let spaces = unparsed.map((line) => {
		// does a kind  of tabs to spaces conversion to calculate indent
		let sps = 0
		for (let i = 0; i < line.length && is_space(line[i]); i++) {
			if (line[i] == "\t") {
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
		for(res = start + 1; res < spaces.length && (spaces[res] > spaces[start] || unparsed[res].trim == ""); res++);
		res--
		while(res > 0 && unparsed[res].trim() == "") {
			res--
		}
		return res + 1
	}
	for(let i = 0; i < unparsed.length; i++) {
		let line = unparsed[i].trim()
		let index = line.length - 2
		
		if(line == "" || line.startsWith("#")) {
			res = {type: "noop"}
		}
		else if(line.substring(index) == "()" && constants.functions[line.substring(0, index)]) {
			if(constants.functions[line.substring(0, index)]) {
				res = {type: "call", fname: line.substring(0, index)}
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
			let fname = line.substring(4, line.length - 3)
			res = {type: "fdef", fname: fname, end: find_block_end(i)}
			fdefs[fname] = i
		}
		else if(line.endsWith("()")) {
			let fname = line.substring(0, line.length - 2)
			res = {type: "fcall", fname: fname}
		}
		else {
			res = {type: "error"}
		}
		res["indent"] = indents[i]
		parsed.push(res)
		if (res.type == "error") {
			errors.push([i, line])
		}
	}


	// todo: find errors, like no indented code after a colon
	// and calling functions that don't exist

	// indent check
	for (let i = 1; i < parsed.length - 1; i++) {
	    if (parsed[i].type == "while" || parsed[i].type == "for" || parsed[i].type == "if" || parsed[i].type == "else" || parsed[i].type == "fdef") {
			
	        let error = true
	        
			// skip blank lines
			let j
	        for (j = i + 1; j < parsed.length && parsed[j].type == "noop"; j++) {
	        }

	        if (j == parsed.length) {
	            state.code.errors.push([i, "no code after " + parsed[i].type])
	        }
			else if (parsed[i].indent >= parsed[j].indent) {
				error("no indented code after " + parsed[i].type)
				state.code.errors.push([i, "no indented code after " + parsed[i].type])
			}
			// else if (parsed[j].type != "fcall" && parsed[j].type != "call" && parsed[i].indent >= parsed[j].indent) {
			// 	state.code.errors.push([i, "no indent after " + parsed[i].type])
			// }
	    }
	}

	return {
		"parsed": parsed,
		"errors": errors,
		"fdefs": fdefs
	}
}