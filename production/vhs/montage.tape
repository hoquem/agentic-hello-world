# Cold-open montage: three first programs, one line each, identical output.
# Run from the repo root:  vhs production/vhs/montage.tape
Output production/vhs/montage.mp4

Set Shell "bash"
Set FontSize 36
Set Width 1920
Set Height 1080
Set Padding 50
Set Theme "Catppuccin Mocha"
Set TypingSpeed 55ms

Hide
Type "cd production/code && clear"
Enter
Show

Type "python3 hello.py"
Sleep 500ms
Enter
Sleep 1200ms

Type "node hello.js"
Sleep 500ms
Enter
Sleep 1200ms

Type "java Hello.java"
Sleep 500ms
Enter
Sleep 2s
