@echo off
set DATABASE_URL=postgresql://lifexp:lifexp_password@localhost:5438/lifexp?schema=public
set REDIS_URL=redis://localhost:6388
set APP_SECRET=chave-de-teste-para-desenvolvimento-local-minimo-32-caracteres
set JWT_ACCESS_SECRET=chave-acesso-teste-desenvolvimento-local-32-car
set JWT_REFRESH_SECRET=chave-refresh-teste-desenvolvimento-local-32-car
set NODE_ENV=development
set PORT=3333
set API_BASE_URL=http://localhost:3333
set WEB_URL=http://localhost:5173
set FRONTEND_URL=http://localhost:5173
set CORS_ORIGIN=http://localhost:5173
set SESSION_COOKIE_SECURE=false
set EMAIL_ENABLED=false
set PUSH_ENABLED=false
set SUBSCRIPTION_ENABLED=false
cd /d "C:\Users\alex1\Desktop\LifeXP\apps\api"
node dist/index.js
