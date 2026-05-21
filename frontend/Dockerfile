FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html main.js api.js styles.css /usr/share/nginx/html/

EXPOSE 80
