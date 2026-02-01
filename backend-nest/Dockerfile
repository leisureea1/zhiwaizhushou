# ==========================================
# 构建阶段
# ==========================================
FROM node:18-alpine AS builder

WORKDIR /app

# 复制依赖文件
COPY package*.json ./
COPY prisma ./prisma/

# 安装依赖
RUN npm ci

# 复制源代码
COPY . .

# 生成 Prisma Client
RUN npx prisma generate

# 构建应用
RUN npm run build

# ==========================================
# 生产阶段
# ==========================================
FROM node:18-alpine AS production

WORKDIR /app

# 设置环境变量
ENV NODE_ENV=production

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# 复制依赖文件并安装生产依赖
COPY package*.json ./
RUN npm ci --only=production

# 复制 Prisma schema 和生成的客户端
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# 复制构建产物
COPY --from=builder /app/dist ./dist

# 创建上传目录
RUN mkdir -p uploads && chown -R nestjs:nodejs uploads

# 切换到非 root 用户
USER nestjs

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["node", "dist/main"]
