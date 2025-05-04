# Offline Karel extended

### You can [try offline karel](https://coproductional.com/oli/offline_karel4.html) on coproductional.com

![image](https://github.com/user-attachments/assets/feb8d596-149f-40a0-956a-6aa3207709d6)

Adding challenges to offline karel.

Many bugs discovered and present. One possibly from nested loops? Might try to fix them eventually.

### Fixed Crashing Bug (partially), Sorting Challenge Solved

It turns out, when I added tabs, there was a bug when you had mixed tabs and spaces in your program.

There still might kind of be... the solution is maybe not correct... And also... there should be error messages rather than crashing for improper indentation... But, basically, that's what causes the crash, improper indentation, which is hard to see when tabs and spaces are mixed.

Here is a solution to the sort beeper piles problem:
```python
# calls main
main()

def main():
	while no_beepers_present():
		one_ups()
		turn_left()
		move()
		turn_left()
		push_right()
		turn_around()
		one_ups()
		turn_around()
		while front_is_clear():
			move()
		turn_left()
		move()
		turn_left()
		# hack to stop the run
		mark_if_nothing()
	pick_beeper()
	turn_left()
	move()
	move()
	turn_right()
	drop_line_by_two()
	turn_around()
	while front_is_clear():
		move()
	turn_left()
	move()
	move()
	turn_left()
	while no_beepers_present():
		move()
	turn_around()
	move()
	turn_around()

# freezes on this function
def drop_line_by_two():
 	while front_is_clear():
		move()
		turn_left()
		while beepers_present():
			pick_beeper()
			turn_around()
			move()
			move()
			put_beeper()
			turn_around()
			move()
			move()
		turn_right()

def mark_if_nothing():
	while no_beepers_present():
		if front_is_blocked():
			turn_left()
			put_beeper()
		else:
			move()
	if facing_north():
		pick_beeper()
		turn_left()
		while front_is_clear():
			move()
		put_beeper()
	else:
		turn_around()
		while front_is_clear():
			move()
	turn_around()

def one_ups():
	while front_is_clear():
		move()
		if beepers_present():
			pick_beeper()
			turn_left()
			move()
			put_beeper()
			turn_around()
			move()
			turn_left()

# grabs a beeper and pulls it next to last beeper
def pull_back():
	pick_beeper()
	turn_around()
	while front_is_clear():
		move()
	turn_around()
	while beepers_present():
		move()
	put_beeper()
	move()

# starts on right, facing left
# pushes all beepers on the line to the right
def push_right():
	while beepers_present():
		move()
	while front_is_clear():
		move()
		if beepers_present():
			pull_back()

def turn_around():
	turn_left()
	turn_left()

def turn_right():
	turn_left()
	turn_left()
	turn_left()
```

### Hospital Challenge

```python
def turn_right():
 turn_left()
 turn_left()
 turn_left()
 
while front_is_clear():
 move()
 if beepers_present():
  turn_left()
  move()
  put_beeper()
  move()
  put_beeper()
  turn_right()
  move()
  put_beeper()
  turn_right()
  move()
  put_beeper()
  move()
  put_beeper()
  turn_left()
```

### Spread Beepers Challenge

```python
main()

def main():
	move()
	pick_beeper()
	while beepers_present():
		pick_beeper()
		drop_at_end()
		turn_around()
		while front_is_clear():
			move()
		turn_around()
		move()
	put_beeper()
	turn_around()
	move()
	turn_around()

def drop_at_end():
	move()
	while beepers_present():
		move()
	put_beeper()

def turn_around():
	turn_left()
	turn_left()
```
