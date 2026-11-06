FROM node:22-bookworm

WORKDIR /app
ENV CI=true \
    PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

COPY package.json package-lock.json ./
RUN npm ci --include=dev \
    && npx playwright install --with-deps chromium \
    && npm cache clean --force

COPY playwright.config.ts tsconfig.json allurerc.mjs run_tests.mjs run_parallel.mjs ./
COPY core/ ./core/
COPY apps/ ./apps/
RUN mkdir -p /app/reports

ENTRYPOINT ["node", "run_tests.mjs"]
