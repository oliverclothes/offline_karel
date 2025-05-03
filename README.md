Offline Karel extended.

Trying to add challenges to offline karel.

Many bugs present. Just putting this initial commit in to make it public.

Pasting the code below seems to work to solve the hospital challenge:

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


Pasting the code below seems to work to solve the spead beepers challenge (with a main function and tabs):

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



 
