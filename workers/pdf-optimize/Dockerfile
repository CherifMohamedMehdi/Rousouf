FROM node:22-alpine
RUN apk add --no-cache qpdf ca-certificates
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY index.cjs ./

CMD ["node", "index.cjs"]
