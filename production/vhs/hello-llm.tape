# The LLM version in plain Python — same idea, different game.
# Run from the repo root:  vhs production/vhs/hello-llm.tape
# Requires: the local Ollama daemon running + signed in, kimi-k2.6:cloud pulled.
Output production/vhs/hello-llm.mp4

Set Shell "bash"
Set FontSize 30
Set Width 1280
Set Height 720
Set Padding 50
Set Theme "Catppuccin Mocha"
Set TypingSpeed 50ms

Hide
Type "clear"
Enter
Show

# (Optional: cut to the file on screen in the editor before this run.)
Type "venv/bin/python production/code/hello_llm.py"
Sleep 600ms
Enter
Sleep 4s
