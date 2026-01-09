# 🚀 Quick Start & Production Deployment Guide

## 📋 Pre-Deployment Checklist

- [ ] Generate new JWT_SECRET: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- [ ] Copy `.env.example` to `.env` and update all values
- [ ] Update database credentials (password, host, port)
- [ ] Configure API keys (Tomorrow.io, OpenWeather, Google)
- [ ] Test locally: `docker-compose up`
- [ ] Run tests: `npm test` (expect 8/8 pass)
- [ ] Check vulnerabilities: `npm audit` (expect 0)
- [ ] If using GitHub: Configure GitHub Secrets
- [ ] If using secret manager: Upload secrets securely

---

## 🔄 Development Workflow

### Setup (One-time)

```bash
# Backend
cd backend
npm install
cp .env.example .env
# Edit .env with your values

# Frontend
cd ../frontend
npm install

# ML Service
cd ../ml_model
pip install -r requirements.txt
```

### Running Services

**Option 1: Docker (Recommended)**
```bash
docker-compose up -d
# Services start automatically:
# - MySQL: localhost:3306
# - Backend: localhost:5000
# - Frontend: localhost:5173
# - ML API: localhost:5001
```

**Option 2: Manual**
```bash
# Terminal 1: Backend
cd backend && npm start

# Terminal 2: Frontend
cd frontend && npm run dev

# Terminal 3: ML Service
cd ml_model && python lstm_api_server.py

# Terminal 4: MySQL
docker run --name mysql -p 3306:3306 -e MYSQL_ROOT_PASSWORD=root mysql:8.0
```

---

## 🧪 Testing

```bash
# Run all tests
cd backend && npm test

# Run specific test file
npm test -- weatherForecast.predict.test.js

# Run with coverage
npm test -- --coverage

# Linting
npm run lint          # Check
npm run lint:fix      # Auto-fix
```

---

## 🔐 Secrets Management

### GitHub Actions Setup

1. Go to `Settings` → `Secrets and variables` → `Actions`
2. Click `New repository secret`
3. Add these secrets:

```
JWT_SECRET=<your-generated-secret-here>
DB_PASSWORD=<strong-password-here>
TOMORROW_API_KEY=<your-api-key>
OPENWEATHER_API_KEY=<your-api-key>
GOOGLE_CLIENT_SECRET=<your-secret>
CORS_ORIGIN=https://your-domain.com
```

### Local Development

```bash
# Create .env file (NEVER commit this)
cp backend/.env.example backend/.env

# Edit with your secrets
nano backend/.env

# Verify it's in .gitignore
grep ".env" backend/.gitignore
```

### Production Deployment

**Using Environment Variables:**
```bash
export JWT_SECRET="<secret>"
export DB_PASSWORD="<password>"
npm start
```

**Using Docker:**
```bash
docker-compose --env-file .env.production up -d
chmod 600 .env.production  # Secure file
```

---

## 📦 Docker & Deployment

### Build Images
```bash
# Backend
docker build -t weather-backend:latest backend/

# ML Service
docker build -t weather-ml:latest ml_model/

# Using docker-compose
docker-compose build
```

### Run Services
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Health Checks
```bash
# Backend health
curl http://localhost:5000/health

# ML API health
curl http://localhost:5001/health

# Database connection
docker-compose exec backend npm test
```

---

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/verify` - Verify token

### Weather Data
- `GET /api/weather` - Get all weather data
- `GET /api/weather/:cityId` - Get weather for city
- `POST /api/weather` - Create weather record

### Forecasts & Predictions
- `POST /api/weather/forecasts/generate/:cityId` - Generate LSTM predictions
- `GET /api/weather/forecasts/:cityId` - Get forecasts for city
- `GET /api/weather/forecasts/accuracy/:cityId` - Get accuracy stats

### Cities
- `GET /api/cities` - List all cities
- `GET /api/cities/:id` - Get city details
- `POST /api/cities` - Create city (admin)

### Admin
- `GET /api/admin/dashboard` - Admin dashboard stats
- `GET /api/admin/users` - List users (admin)

---

## 📊 Monitoring & Debugging

### Check Service Status
```bash
# Using docker-compose
docker-compose ps

# Check logs
docker-compose logs backend
docker-compose logs ml-api
docker-compose logs mysql

# Real-time logs
docker-compose logs -f
```

### Database Access
```bash
# Connect to MySQL
docker-compose exec mysql mysql -uroot -p

# Run migrations
docker-compose exec backend npm run migrate
```

### Performance Testing
```bash
# Load test (example with Apache Bench)
ab -n 1000 -c 10 http://localhost:5000/api/weather

# Or use Artillery
npm install -g artillery
artillery quick --count 100 --num 1000 http://localhost:5000/
```

---

## 🔍 Security Best Practices

✅ **DO:**
- Rotate JWT_SECRET every 90 days
- Keep `.env` files out of version control
- Use strong database passwords
- Enable HTTPS/TLS in production
- Monitor access logs
- Keep dependencies updated (`npm audit fix`)
- Use environment variables for sensitive data
- Implement rate limiting (already done: 100 req/15min)
- Add security headers (already done: Helmet.js)

❌ **DON'T:**
- Commit `.env` files
- Share secrets in code or comments
- Use weak passwords
- Log sensitive information
- Disable CORS security
- Leave default credentials

---

## 🚨 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Or change port in .env
PORT=8000
```

### Database Connection Error
```bash
# Check MySQL is running
docker-compose ps | grep mysql

# Restart database
docker-compose restart mysql

# Verify credentials in .env
cat backend/.env | grep DATABASE
```

### LSTM Server Not Responding
```bash
# Check ML service
curl http://localhost:5001/health

# Restart ML service
docker-compose restart ml-api

# Check requirements installed
cd ml_model && pip install -r requirements.txt
```

### Tests Failing
```bash
# Clear Jest cache
npm test -- --clearCache

# Run with verbose output
npm test -- --verbose

# Run specific test
npm test -- weatherForecast.predict.test.js
```

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| [SECRETS_MANAGEMENT.md](SECRETS_MANAGEMENT.md) | How to handle and rotate secrets |
| [COMPLETION_SUMMARY.md](COMPLETION_SUMMARY.md) | Project completion status |
| [REVIEW_GUIDE_LAO.md](REVIEW_GUIDE_LAO.md) | Review checklist (Lao language) |
| [HANDOVER.md](HANDOVER.md) | Detailed handover documentation |
| [backend/.env.example](backend/.env.example) | Environment variable template |

---

## 🎯 CI/CD Pipeline

### GitHub Actions Workflow
Located in: `.github/workflows/ci-cd.yml`

**Jobs:**
1. **test** - Lint, test, and audit on every push
2. **security** - Scan for vulnerabilities
3. **quality** - Check code quality metrics
4. **notify** - Send build status notification

### Running Locally
```bash
# Simulate CI pipeline
npm run lint          # Check linting
npm test              # Run tests
npm audit             # Check vulnerabilities
```

---

## 📞 Support

- **Issues**: Check `backend/tests/` for test examples
- **Configuration**: See `backend/.env.example`
- **Security**: Read `SECRETS_MANAGEMENT.md`
- **Review**: Check `REVIEW_GUIDE_LAO.md`

---

**Last Updated**: January 2025
**Status**: ✅ Production Ready
