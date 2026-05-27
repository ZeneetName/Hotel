FROM nginx:latest

# Копируем все файлы фронтенда в nginx
COPY . /usr/share/nginx/html/

# Копируем конфиг nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
