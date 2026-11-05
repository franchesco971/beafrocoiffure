FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 3000

# Le client Prisma est généré au démarrage : le volume monté sur /app masque tout ce qui est généré au build.
CMD ["sh", "-c", "npx prisma generate && npm run dev -- -H 0.0.0.0"]
