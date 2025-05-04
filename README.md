# Offline Karel extended

![image](https://github.com/user-attachments/assets/feb8d596-149f-40a0-956a-6aa3207709d6)

Adding challenges to offline karel.

Many bugs discovered and present. One possibly from nested loops? Might try to fix them eventually.

### Sorting Challenge Partial Solution

Here is a partial solution to sort that just leaves the beepers on the third line (but does not crash):
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





## BUGGY CODE BELOW

BUGS discovered when attempting sorting problem:
Bug 1: crashes upon calling "drop_line_by_two"
Bug 2: if you insert "move()" in the first line of "drop_line_by_two" it fails to exit the loop at the wall

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

# freezes on this function
def drop_line_by_two():
 	while front_is_clear():
		move()
		turn_left()
		if beepers_present():
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


 
