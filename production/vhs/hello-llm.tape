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

# Hidden setup so the on-screen command stays clean: `python hello_llm.py`
Hide
Type "cd production/code && source ../../venv/bin/activate && clear"
Enter
Show

Type "python hello_llm.py"
Sleep 600ms
Enter
Sleep 9s
