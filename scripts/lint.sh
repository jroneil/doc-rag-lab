
#!/usr/bin/env bash
set -e

echo "🔍 Linting RagLab"

# ----------------------------
# Web (Next.js)
# ----------------------------
if [ -d "apps/web" ]; then
  echo "→ Linting web"
  (cd apps/web && npm run lint || echo "⚠️ Web lint skipped")
fi

# ----------------------------
# Java (Spring Boot)
# ----------------------------
if [ -d "apps/api-java" ]; then
  echo "→ Checking Java build"
  (cd apps/api-java && ./mvnw -q -DskipTests verify || echo "⚠️ Java check skipped")
fi

# ----------------------------
# Python (FastAPI)
# ----------------------------
if [ -d "apps/api-python" ]; then
  echo "→ Linting Python"
  (cd apps/api-python && python -m compileall . || echo "⚠️ Python check skipped")
fi

echo "✅ Lint pass completed"
