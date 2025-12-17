<!-- IMPORTANTE, PARA VISUALIZAR LA DOCUMENTACION DEL PROYECTO INSTALAR LA EXTENCION: Markdown Preview Mermaid -->
<!-- PARA VISUALIZAR PRECIONAR: CTRL + SHIFT + V -->

# 🛒 Sistema Don Charo - Guía de Instalación y Configuración

Sistema de Gestión Integral para comercios minoristas con soporte offline, multi-moneda y roles diferenciados.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![React](https://img.shields.io/badge/React-18-61dafb.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-009688.svg)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-2196f3.svg)

---

## 📋 Tabla de Contenidos

1. [Descripción General](#-descripción-general)
2. [Características Principales](#-características-principales)
3. [Requisitos Previos](#-requisitos-previos)
4. [Instalación Paso a Paso](#-instalación-paso-a-paso)
5. [Configuración](#-configuración)
6. [Ejecución del Sistema](#-ejecución-del-sistema)
7. [Usuarios por Defecto](#-usuarios-por-defecto)
8. [Despliegue en Producción](#-despliegue-en-producción)
9. [Troubleshooting](#-troubleshooting)
10. [Comandos Útiles](#-comandos-útiles)

---

## 🎯 Descripción General

El **Sistema Don Charo** es una solución completa de gestión que incluye:

- **Punto de Venta (POS)** con código de barras y búsqueda inteligente
- **Gestión de Inventario** con alertas automáticas
- **Reportes Estadísticos** con gráficos interactivos  
- **Modo Offline Completo** con sincronización automática
- **Multi-moneda** (ARS, USD, BRL) con cotización en tiempo real
- **Multi-usuario** con 3 roles diferenciados

---

## ✨ Características Principales

### 🚀 Rendimiento
- Debounce de 200ms en búsquedas
- Scroll Infinito (50 productos por carga)
- Paginación optimizada
- Memoización de componentes React

### 🔒 Seguridad
- Autenticación JWT (HMAC-SHA256)
- Contraseñas hasheadas con Bcrypt (12 rounds)
- Validación de roles en backend
- CORS configurado
- Protección contra SQL Injection

### 📴 Modo Offline
- Funcionamiento completo sin internet
- IndexedDB para almacenamiento local
- Sincronización automática al reconectar
- Cola de ventas pendientes

---

## 💻 Requisitos Previos

### Software Requerido

| Software | Versión Mínima | Comando de verificación |
|----------|----------------|-------------------------|
| Python | 3.9 | `python --version` |
| Node.js | 16.0 | `node --version` |
| npm | 8.0 | `npm --version` |
| PostgreSQL | 14 | `psql --version` |
| Git | 2.0 | `git --version` |

---

## 🚀 Instalación Paso a Paso

### 1️⃣ Clonar el Repositorio

```bash
git clone https://github.com/Jony110x/Don-Charo.git
cd Don-Charo
```

---

### 2️⃣ Configurar la Base de Datos

#### Instalar PostgreSQL

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib -y
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

#### Crear Base de Datos

```bash
# Conectarse a PostgreSQL
sudo -u postgres psql
```

```sql

-- Crear base de datos
CREATE DATABASE don_charo;

\q
```


---

### 3️⃣ Configurar el Backend

```bash
cd backend

# Crear entorno virtual
python3 -m venv venv

# Activar entorno virtual
source venv/bin/activate  # Linux/macOS
# venv\Scripts\activate   # Windows

# Instalar dependencias
pip install --upgrade pip
pip install -r requirements.txt
```

#### Archivo requirements.txt

```txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
sqlalchemy==2.0.23
psycopg2-binary==2.9.9
pydantic==2.5.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6
python-dotenv==1.0.0
```

---

### 4️⃣ Configurar el Frontend

```bash
cd ../frontend

# Instalar Node.js (si no está instalado)
# Ubuntu: curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt-get install -y nodejs
# macOS: brew install node@18

# Instalar dependencias
npm install
```

---

## 🎬 Ejecución del Sistema

### Método 1: Manual (Desarrollo)

#### Terminal 1 - Backend:
```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### Terminal 2 - Frontend:
```bash
cd frontend
npm start
```

**URLs:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- Docs (Swagger): http://localhost:8000/docs

---

### Método 2: Script Automático

#### Linux/macOS (start.sh):

```bash
#!/bin/bash
echo "🚀 Iniciando Sistema Don Charo..."

# Backend
cd backend
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

sleep 3

# Frontend
cd ../frontend
npm start &
FRONTEND_PID=$!

echo "✅ Sistema iniciado!"
echo "Frontend: http://localhost:5173"
echo "Backend: http://localhost:8000"

trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
```

```bash
chmod +x start.sh
./start.sh
```

#### Windows (start.bat):

```batch
@echo off
start "Backend" cmd /k "cd backend && venv\Scripts\activate && uvicorn main:app --reload"
timeout /t 3 /nobreak >nul
start "Frontend" cmd /k "cd frontend && npm start"
pause
```

---

## 👥 Usuarios por Defecto

| Rol | Usuario | Contraseña | Permisos |
|-----|---------|------------|----------|
| SUPERADMIN | `pepe` | `1234` | Acceso total |
| ADMIN | `admin` | `admin123` | Dashboard, Stock, Reportes |
| CAJERO | `cajero` | `cajero123` | Solo Ventas |

**⚠️ CAMBIAR CONTRASEÑAS EN PRODUCCIÓN**

---

## 🚀 Despliegue en Producción

### Con Docker Compose (Recomendado)

#### docker-compose.yml

```yaml
version: '3.8'

services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: don_charo
      POSTGRES_USER: doncharo_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://doncharo_user:${DB_PASSWORD}@db:5432/don_charo
      SECRET_KEY: ${SECRET_KEY}
    depends_on:
      - db
    ports:
      - "8000:8000"

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

```bash
# Crear .env
echo "DB_PASSWORD=password_seguro" > .env
echo "SECRET_KEY=$(python -c 'import secrets; print(secrets.token_urlsafe(32))')" >> .env

# Iniciar
docker-compose up -d

# Ver logs
docker-compose logs -f
```

---

## 🔧 Troubleshooting

### Backend no inicia

```bash
# Verificar entorno virtual activo
which python

# Reinstalar dependencias
pip install -r requirements.txt

# Ver logs detallados
uvicorn main:app --reload --log-level debug
```

### Frontend no conecta

```bash
# Verificar backend corriendo
curl http://localhost:8000/docs

# Verificar VITE_API_URL
cat frontend/.env

# Limpiar caché
cd frontend
rm -rf node_modules/.vite
npm start
```

### Error de PostgreSQL

```bash
# Verificar servicio
sudo systemctl status postgresql

# Probar conexión
psql -U doncharo_user -d don_charo

# Ver logs
sudo tail -f /var/log/postgresql/postgresql-15-main.log
```

---

## 🛠️ Comandos Útiles

### Backend

```bash
# Activar entorno virtual
source venv/bin/activate

# Iniciar servidor
uvicorn main:app --reload

# Ver logs
tail -f logs/app.log
```

### Frontend

```bash
# Desarrollo
npm start

# Build producción
npm run build

# Preview build
npm run preview
```

### Base de Datos

```bash
# Backup
pg_dump -U doncharo_user don_charo > backup.sql

# Restaurar
psql -U doncharo_user don_charo < backup.sql

# Ver conexiones
SELECT * FROM pg_stat_activity;
```

---

## 📁 Estructura del Proyecto

```
sistema-don-charo/
├── backend/
│   ├── main.py
│   ├── models.py
│   ├── routes/
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   └── utils/
│   ├── package.json
│   └── .env
├── docs/
│   └── MANUAL_USUARIO.docx
├── README.md
└── docker-compose.yml
```

---

## ✅ Checklist de Instalación

```
☐ Python 3.9+ instalado
☐ Node.js 16+ instalado
☐ PostgreSQL 14+ instalado
☐ Repositorio clonado
☐ Base de datos creada
☐ Tablas creadas
☐ Usuarios insertados
☐ Backend configurado (.env)
☐ Frontend configurado (.env)
☐ Dependencias instaladas
☐ Backend inicia correctamente
☐ Frontend inicia correctamente
☐ Login funciona
☐ Ventas funcionan
☐ Modo offline funciona
```

---

## 📞 Soporte

- **Email**: jonathanbenedetich20@hotmail.com  /  maxitomasini13@gmail.com
- **Issues**: GitHub Issues
- **Documentación**: Ver carpeta `/docs`

---

**¡Gracias por usar el Sistema Don Charo!** 🎉

*Última actualización: Diciembre 2025*