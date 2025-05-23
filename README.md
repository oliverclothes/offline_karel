# This is Going Away Soon

Github is *requiring* me to setup 2FA. Maybe because I linked to an external unlisted website? But I do not use 2FA for security reasons. One time I used it, and my phone broke. I lost all access to the 2FA accounts without notice or any way to fix the problem. I cannot in good conscience tell people to go to account links that I could completely lose access to at any time.

I actually broke the running code due to a couple changes... without completely understanding how it works. I was going to rewrite the code... but two reasons why I decided not to:
1. Due to Github's 2FA requirement, this account will be deleted
2. Based on the traffic numbers, not many people check out this project anyway

I guess I will think about what to do in my spare time. I might not do as much open-source stuff on my own... since I don't think it gets any traffic. But if any projects wants a contributor, I could contribute to any project that has a few people interested.

If you want a working version, go back to the old version of the code. Or you could actually just copy in the code execution code from that into the version now and it would probably work, while retaining the added features. That is what I probably would have done this weekend, or next week, if this 2FA issue didn't come up. Or a complete rewrite. That was actually more what I planned. And maybe record a video of me doing it.

Anyway, good luck to anyone from code in place.

## Offline Karel extended

I am in the process of splitting this project into multiple files and cleaning up the code as much as I can.

We'll see what happens. I actually broke it for a few days or a week. When I added support for tabs... the indentation broke.

Now you need to write code in a main function, that's the only way that it works.

### You can [try offline karel, v1.1](https://coproductional.com/oli/ok_v1.1.html) on coproductional.com

![image](https://github.com/user-attachments/assets/fc6525b6-f0ba-4343-ad1f-5fe2b2e1b7ff)

Adding challenges to offline karel and extending its functionality.

### No Longer Single Development File

The code is getting a bit long... over 1,000 lines in the HTML file... so splitting into multiple files, an HTML, a CSS, and there will be a few JS files.

But will have "releases" where basically, just glue together the files into one HTML file.

This is not strictly necessary, but I will also do a rewrite of the code execution, because there is currently a bug (that I probably just introduced recently), and having smaller, more easily understood files, will help me fix the problem.

### Other Recent Changes

* Football play pen: you can draw and run the code
* Slightly improved the layout... still a bit bad, though. Need to fix mobile
* Added a "Run code" button that goes back to the start state and runs the code. Since the full controls are hard to understand

### Next Steps

* Integrate more challenges
* Maybe improve the look, add a legit Karel-looking skin
* Maybe some kind of share functionality
* Maybe some kind of collaborative thing... but would need to convert it to more client/server probably for that

### Fixed Crashing Bug (partially), Sorting Challenge Solved

It turns out, when I added tabs, there was a bug when you had mixed tabs and spaces in your program.

So I updated it to fix that...

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
