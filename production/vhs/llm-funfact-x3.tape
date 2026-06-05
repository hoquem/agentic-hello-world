# Non-determinism: the same LLM call, run 3x -> a different answer each time.
# Pairs side-by-side with print-x3.mp4 in the editor.
# Run from the repo root:  vhs production/vhs/llm-funfact-x3.tape
# Requires: local Ollama daemon running + signed in, kimi-k2.6:cloud pulled.
Output production/vhs/llm-funfact-x3.mp4

Set Shell "bash"
Set FontSize 28
Set Width 900
Set Height 720
Set Padding 40
Set Theme "Catppuccin Mocha"
Set TypingSpeed 45ms

# Hidden setup so the on-screen command stays clean: `python fun_fact.py`
Hide
Type "cd production/code && source ../../venv/bin/activate && clear"
Enter
Show

Type "python fun_fact.py"
Enter
Sleep 8s
Type "python fun_fact.py"
Enter
Sleep 8s
Type "python fun_fact.py"
Enter
Sleep 8s
