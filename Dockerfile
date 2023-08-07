FROM node:16.18.1-slim as builder

WORKDIR /app/

COPY package*.json /app/

RUN npm install --registry=https://registry.npmmirror.com

COPY ./ /app/

# RUN npm run test:all
# RUN npm run fetch:blocks
RUN npm run build

FROM nginx:1.22.1 as runner

# 设置时间为上海时间
ENV TZ=Asia/Shanghai DEBIAN_FRONTEND=noninteractive

RUN sed -i s/deb.debian.org/mirrors.ustc.edu.cn/g /etc/apt/sources.list

RUN apt update \
  && apt install -y tzdata \
  && ln -fs /usr/share/zoneinfo/${TZ} /etc/localtime \
  && echo ${TZ} > /etc/timezone \
  && dpkg-reconfigure --frontend noninteractive tzdata \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/share/nginx/html/

COPY ./deploy/nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist  /usr/share/nginx/html/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
