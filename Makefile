SERVICE = communication-service
.PHONY: build venv

commands:
	@grep '^[^#[:space:]].*:' Makefile | grep -v commands

restart:
	npm i && npm run build && cd ../.. && docker compose restart $(SERVICE)

logs:
	cd ../.. && docker compose logs --no-log-prefix -f --tail 300 $(SERVICE) | pino-pretty --ignore 'pid,req,res,contextUserId,contextTransactionId,contextTenantId,contextProjectId,contextInternalTransactionId,contextSessionId,context'

up:
	npm i && npm run build && cd ../.. && docker compose up $(SERVICE) -d

stop:
	cd ../.. && docker compose stop $(SERVICE)

rm:
	cd ../.. && docker compose rm $(SERVICE)

build:
	cd ../.. && docker compose up $(SERVICE) --build -d

local:
	npm run start:local

pr:
	@./../../scripts/pull_request.sh

commit:
	@./../../scripts/commit.sh $(filter-out $@,$(MAKECMDGOALS))

update:
	npm ls --json | jq -r '.dependencies | keys[] | select(contains("@montara-io"))' | xargs -I {} npm i {}@latest

venv:
	test -d venv || ( \
		python -m venv .venv; \
		source venv/bin/activate; \
		pip install pip-tools; \
	)

compile:
	pip-compile requirements.in

clean:
	cd ../.. && docker compose stop $(SERVICE) && docker compose rm $(SERVICE) && rm -rf services/$(SERVICE)/data && docker compose up -d $(SERVICE)

%:
	@: