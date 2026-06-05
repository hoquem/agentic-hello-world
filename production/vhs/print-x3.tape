# Determinism: the print statement, run 3x -> identical every time.
# Pairs side-by-side with llm-funfact-x3.mp4 in the editor.
# Run from the repo root:  vhs production/vhs/print-x3.tape
Output production/vhs/print-x3.mp4

Set Shell "bash"
Set FontSize 34
Set Width 1920
Set Height 1080
Set Padding 40
Set Theme "Catppuccin Mocha"
Set TypingSpeed 45ms

Hide
Type "cd production/code && clear"
Enter
Show

Type "python3 hello.py"
Enter
Sleep 800ms
Type "python3 hello.py"
Enter
Sleep 800ms
Type "python3 hello.py"
Enter
Sleep 1500ms
