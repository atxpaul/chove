FROM nginx:latest
WORKDIR /usr/share/nginx/html/
COPY index.html index.html
COPY css css
COPY js js
COPY img img