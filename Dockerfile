# Use uma imagem base oficial do Node.js
FROM node:18-alpine

# Crie um diretório de trabalho
WORKDIR /app

# Copie o package.json e o package-lock.json para instalar as dependências
COPY package*.json ./

# Instale as dependências
RUN npm install

# Copie o restante do código da aplicação
COPY . .

# Exponha a porta que a aplicação utilizará
EXPOSE 4000

# Comando para iniciar a aplicação
CMD ["npm", "start"]
