from ollama import Client

client = Client()  # talks to your local Ollama daemon
reply = client.chat(
    "qwen3-coder-next:cloud",  # fast, non-reasoning → snappy re-runs
    messages=[{"role": "user", "content": "Give me a one-sentence fun fact."}],
    options={"temperature": 1.6},  # sampling temperature: each run can differ
)
print(reply["message"]["content"])
