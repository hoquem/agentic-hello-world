from ollama import Client

client = Client()  # talks to your local Ollama daemon
reply = client.chat(
    "kimi-k2.6:cloud",
    messages=[{"role": "user", "content": "Reply with exactly: Hello World!"}],
)
print(reply["message"]["content"])
