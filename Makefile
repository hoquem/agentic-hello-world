VENV := venv

setup-dev:
	python3 -m venv $(VENV)
	$(VENV)/bin/pip install -e ".[dev]"

# Serve on :8420 (port 8000 collides with workspace-mcp). .env is optional —
# config defaults to the local daemon + model; .env just overrides them.
dev:
	set -a; [ -f .env ] && . ./.env; set +a; $(VENV)/bin/uvicorn app.server:app --reload --port 8420

test:
	$(VENV)/bin/pytest -v

lint:
	$(VENV)/bin/ruff check app tests

clean:
	rm -rf $(VENV) .pytest_cache **/__pycache__
