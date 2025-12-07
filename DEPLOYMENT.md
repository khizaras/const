# Deployment Guide

## Production Deployment Checklist

### 1. Environment Configuration

Create a production `.env` file with secure values:

```env
# Production Database
MYSQL_HOST=your-production-db-host
MYSQL_PORT=3306
MYSQL_USER=procore_user
MYSQL_PASSWORD=strong-random-password-here
MYSQL_DB=procore_production

# Production Server
NODE_ENV=production
PORT=5000
JWT_SECRET=generate-a-strong-64-char-random-secret-here

# Optional: Production URLs
API_BASE_URL=https://api.yourdomain.com
CLIENT_URL=https://app.yourdomain.com
```

### 2. Database Setup

**On Production Server:**

```bash
# Connect to MySQL
mysql -u root -p

# Create production database
CREATE DATABASE procore_production CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Create dedicated user with limited privileges
CREATE USER 'procore_user'@'localhost' IDENTIFIED BY 'your-strong-password';
GRANT SELECT, INSERT, UPDATE, DELETE ON procore_production.* TO 'procore_user'@'localhost';
FLUSH PRIVILEGES;

# Import schema
mysql -u procore_user -p procore_production < server/db/schema.sql
```

### 3. Build Frontend

```bash
# Install production dependencies only
npm install --production

# Build optimized frontend bundle
npm run client:build

# Output will be in dist/
```

### 4. Server Deployment Options

#### Option A: Traditional VPS/VM (Ubuntu/Debian)

**Install Node.js 18+:**

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Install PM2 for process management:**

```bash
sudo npm install -g pm2
```

**Deploy application:**

```bash
# Clone repository
git clone https://github.com/khizaras/const.git
cd const

# Install dependencies
npm install --production

# Build frontend
npm run client:build

# Start with PM2
pm2 start server/src/index.js --name procore-api
pm2 save
pm2 startup
```

**Configure Nginx as reverse proxy:**

```nginx
# /etc/nginx/sites-available/procore
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend (serve built files)
    location / {
        root /path/to/procore/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

**Enable SSL with Let's Encrypt:**

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

#### Option B: Docker Deployment

**Create Dockerfile:**

```dockerfile
# Multi-stage build
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --production=false

COPY . .
RUN npm run client:build

FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/docs ./docs

EXPOSE 5000
CMD ["node", "server/src/index.js"]
```

**Create docker-compose.yml:**

```yaml
version: "3.8"

services:
  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: procore_production
      MYSQL_USER: procore_user
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
    volumes:
      - mysql_data:/var/lib/mysql
      - ./server/db/schema.sql:/docker-entrypoint-initdb.d/schema.sql
    ports:
      - "3306:3306"
    networks:
      - procore-network

  api:
    build: .
    environment:
      NODE_ENV: production
      MYSQL_HOST: db
      MYSQL_USER: procore_user
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
      MYSQL_DB: procore_production
      JWT_SECRET: ${JWT_SECRET}
      PORT: 5000
    depends_on:
      - db
    ports:
      - "5000:5000"
    networks:
      - procore-network
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./dist:/usr/share/nginx/html
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - api
    networks:
      - procore-network

volumes:
  mysql_data:

networks:
  procore-network:
    driver: bridge
```

**Deploy with Docker:**

```bash
docker-compose up -d
```

#### Option C: Cloud Platforms

**AWS (Elastic Beanstalk + RDS):**

1. Create RDS MySQL instance
2. Create Elastic Beanstalk application (Node.js platform)
3. Configure environment variables in EB console
4. Deploy using EB CLI: `eb deploy`

**Azure (App Service + Azure Database for MySQL):**

1. Create Azure Database for MySQL
2. Create App Service (Node.js 18 LTS)
3. Configure app settings in Azure Portal
4. Deploy via GitHub Actions or Azure CLI

**Google Cloud (App Engine + Cloud SQL):**

1. Create Cloud SQL MySQL instance
2. Configure app.yaml for App Engine
3. Deploy: `gcloud app deploy`

**Heroku:**

```bash
# Add Heroku remote
heroku create your-app-name

# Add MySQL addon
heroku addons:create jawsdb:kitefin

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-secret

# Deploy
git push heroku master
```

### 5. Security Hardening

**Update server configuration:**

```javascript
// server/src/app.js
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  })
);
```

**Enable rate limiting:**

```bash
npm install express-rate-limit
```

```javascript
const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

app.use("/api/", limiter);
```

### 6. Monitoring & Logging

**Install production logging:**

```bash
npm install pino-pretty
```

**Configure log rotation:**

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

**Health check endpoint:**

```javascript
// Add to server/src/routes/index.js
router.get("/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});
```

### 7. Backup Strategy

**Automated MySQL backups:**

```bash
# Create backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u procore_user -p procore_production > backup_$DATE.sql
gzip backup_$DATE.sql
aws s3 cp backup_$DATE.sql.gz s3://your-backup-bucket/

# Add to crontab (daily at 2 AM)
0 2 * * * /path/to/backup-script.sh
```

### 8. Performance Optimization

**Enable gzip compression:**

```javascript
const compression = require("compression");
app.use(compression());
```

**Database connection pooling:**

```javascript
// Already configured in server/src/db/pool.js
// Adjust pool size for production
connectionLimit: 20,
```

**Frontend caching:**

```nginx
# Add to nginx.conf
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 9. Post-Deployment Testing

**Verify deployment:**

```bash
# Check API health
curl https://api.yourdomain.com/api/health

# Test authentication
curl -X POST https://api.yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"organizationId":1,"email":"test@example.com","password":"test"}'
```

**Monitor logs:**

```bash
pm2 logs procore-api
# or
docker-compose logs -f api
```

### 10. Rollback Plan

**Quick rollback with PM2:**

```bash
# List deployments
pm2 deploy production list

# Revert to previous version
pm2 deploy production revert 1
```

**Docker rollback:**

```bash
# Tag and keep previous image
docker tag procore-api:latest procore-api:previous

# Rollback
docker-compose down
docker-compose up -d --force-recreate
```

---

## Environment Variables Reference

| Variable         | Required | Default     | Description                       |
| ---------------- | -------- | ----------- | --------------------------------- |
| `NODE_ENV`       | Yes      | development | Environment mode                  |
| `PORT`           | Yes      | 5000        | API server port                   |
| `MYSQL_HOST`     | Yes      | localhost   | Database host                     |
| `MYSQL_PORT`     | No       | 3306        | Database port                     |
| `MYSQL_USER`     | Yes      | -           | Database user                     |
| `MYSQL_PASSWORD` | Yes      | -           | Database password                 |
| `MYSQL_DB`       | Yes      | procore     | Database name                     |
| `JWT_SECRET`     | Yes      | -           | JWT signing secret (min 16 chars) |
| `API_BASE_URL`   | No       | /api        | Backend API base URL              |
| `CLIENT_URL`     | No       | -           | Frontend app URL for CORS         |

## Support & Troubleshooting

**Common Issues:**

1. **Cannot connect to database**

   - Verify MySQL is running: `systemctl status mysql`
   - Check credentials in .env file
   - Ensure database exists and user has permissions

2. **Port already in use**

   - Find process: `lsof -i :5000`
   - Kill process or change PORT in .env

3. **JWT authentication fails**

   - Verify JWT_SECRET is set and matches between deployments
   - Check token expiration settings

4. **Frontend build fails**
   - Clear node_modules: `rm -rf node_modules && npm install`
   - Verify Node version: `node --version` (should be 18+)

For additional support, check the GitHub repository or contact the development team.
