VENV := venv

setup-dev:
	python3 -m venv $(VENV)
	$(VENV)/bin/pip install -e ".[dev]"

dev:  # loads .env (OLLAMA_HOST / MODEL overrides); the local daemon holds the cloud signin
	set -a && . ./.env && set +a && $(VENV)/bin/uvicorn app.server:app --reload --port 8000

test:
	$(VENV)/bin/pytest -v

lint:
	$(VENV)/bin/ruff check app tests

clean:
	rm -rf $(VENV) .pytest_cache **/__pycache__
