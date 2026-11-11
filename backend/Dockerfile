FROM node:22-bookworm-slim
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev && npm cache clean --force
COPY server.mjs ./
ENV FRAMEWORK_ROOT=/framework
EXPOSE 3000
USER node
CMD ["node", "server.mjs"]
