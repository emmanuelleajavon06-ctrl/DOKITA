FROM node:20-slim AS build
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json ./
RUN npm install --no-audit --no-fund
COPY . .
# Diagnostic clair si le dépôt GitHub est incomplet
RUN if [ ! -f src/main.ts ] || [ ! -f prisma/schema.prisma ]; then \
      echo "=== ERREUR : fichiers manquants dans le dépôt (src/main.ts ou prisma/schema.prisma) ==="; \
      echo "=== Contenu reçu par Docker dans le dossier du service : ==="; ls -la; echo "--- src :"; ls -la src 2>&1; echo "--- prisma :"; ls -la prisma 2>&1; \
      exit 1; fi
RUN npx prisma generate && npm run build

FROM node:20-slim
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app ./
RUN chmod +x entrypoint.sh
USER node
EXPOSE 10000
CMD ["./entrypoint.sh"]
