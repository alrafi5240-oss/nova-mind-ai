# Production Deployment Guide - NOVA MIND AI

## Overview

This guide covers production-ready deployment of NOVA MIND AI backend with:
- Rate limiting protection
- Optional API authentication
- Optimized OpenAI API usage
- Comprehensive logging
- Docker containerization

---

## Pre-Deployment Checklist

- [ ] OPENAI_API_KEY obtained and validated
- [ ] Environment set to "production"
- [ ] LOG_LEVEL set to "INFO" or "WARNING"
- [ ] DEBUG set to "false"
- [ ] All sensitive variables in .env (not in code)
- [ ] Rate limiting configured (if needed)
- [ ] Authentication enabled (if needed)
- [ ] TLS/HTTPS configured (if behind proxy)
- [ ] Firewall rules configured
- [ ] Backup strategy in place
- [ ] Monitoring/alerting configured

---

## Deployment Options

### Option 1: Render (Recommended for Beginners)

#### Step 1: Prepare Repository

```bash
# Create .env file (don't commit!)
cp .env.example .env
# Edit .env with your values
```

#### Step 2: Create Render Service

1. Go to [render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `nova-mind-api`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn src.main:app --host 0.0.0.0 --port 8000`
5. Add environment variables:
   - `OPENAI_API_KEY` (paste key)
   - `ENVIRONMENT` = `production`
   - `LOG_LEVEL` = `INFO`
   - `DEBUG` = `false`
6. Click "Create Web Service"

#### Step 3: Monitor Deployment

```bash
# View logs
# In Render dashboard: Logs tab

# Test endpoint
curl https://your-service.onrender.com/v1/health
```

**Pros**: Easy, free tier available, managed deployment
**Cons**: Cold starts, limited resources on free tier

---

### Option 2: Docker on VPS (DigitalOcean / Linode / AWS)

#### Step 1: Prepare VPS

```bash
# SSH into VPS
ssh root@your_vps_ip

# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

#### Step 2: Clone Repository

```bash
# Clone your repo
git clone https://github.com/yourusername/nova-mind-backend.git
cd nova-mind-backend

# Create .env with production values
cp .env.example .env
nano .env  # Edit with your values
```

#### Step 3: Build and Run with Docker Compose

```bash
# Build Docker image
docker-compose build

# Start service
docker-compose up -d

# Check logs
docker-compose logs -f

# Verify health
curl http://localhost:8000/v1/health
```

#### Step 4: Setup Nginx Reverse Proxy

```bash
# Install Nginx
apt install -y nginx

# Create config
cat > /etc/nginx/sites-available/novamind << 'EOF'
server {
    listen 80;
    server_name your-domain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/ssl/certs/your-cert.crt;
    ssl_certificate_key /etc/ssl/private/your-key.key;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF

# Enable site
ln -s /etc/nginx/sites-available/novamind /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

#### Step 5: Setup SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Get certificate
certbot certonly --standalone -d your-domain.com

# Auto-renewal
systemctl enable certbot.timer
```

**Pros**: Full control, better performance, cheaper at scale
**Cons**: Requires VPS management skills

---

### Option 3: AWS Lambda (For Serverless)

#### Requirements

- AWS account
- AWS CLI configured
- Zappa installed (`pip install zappa`)

#### Deployment

```bash
# Initialize Zappa
zappa init

# Deploy to production
zappa deploy production

# Monitor
zappa status production
zappa tail production
```

**Pros**: Auto-scaling, pay-per-use, minimal ops
**Cons**: Cold starts, limited customization, cost can spike

---

## Environment Variables for Production

```env
# Required
OPENAI_API_KEY=sk_xxxxx

# Recommended
ENVIRONMENT=production
LOG_LEVEL=INFO
DEBUG=false
OPENAI_TEMPERATURE=0.7

# Optional (Security)
REQUIRE_AUTH=true
API_KEY=your_strong_secret_key_here
```

---

## Rate Limiting

Current limits (configurable in `src/middleware/rate_limit.py`):

```
60 requests per 60 seconds per IP address
```

To modify:

```python
# In src/middleware/rate_limit.py
RATE_LIMIT_WINDOW = 60  # seconds
RATE_LIMIT_MAX_REQUESTS = 60  # per window
```

---

## Authentication

### Enable API Key Authentication

```env
REQUIRE_AUTH=true
API_KEY=your_super_secret_key_here
```

### Usage

**With Bearer Token:**
```bash
curl -H "Authorization: Bearer your_super_secret_key_here" \
  http://your-api.com/v1/chat \
  -d '{"message": "Hello"}'
```

**With X-API-Key Header:**
```bash
curl -H "X-API-Key: your_super_secret_key_here" \
  http://your-api.com/v1/chat \
  -d '{"message": "Hello"}'
```

---

## Logging

### Log Levels

- **DEBUG**: Detailed development info, not for production
- **INFO**: Important events (default for production)
- **WARNING**: Warnings, fewer messages
- **ERROR**: Error events only

### Log Files

```
logs/
├── app.log          # All events
└── error.log        # Errors only
```

Logs rotate automatically at 10MB with 5 backup files.

### Monitor Logs

```bash
# Watch live logs
tail -f logs/app.log

# Search logs
grep "ERROR" logs/error.log

# Check API usage
grep "OpenAI response" logs/app.log | wc -l
```

---

## Performance Optimization

### API Cost Reduction

Default optimizations enabled:
- History reduced from 10 to 5 messages
- Automatic message optimization
- Token estimation and tracking

### Monitor Costs

Check logs for token usage:
```bash
grep "estimated_tokens" logs/app.log
```

### Further Optimization

1. **Reduce temperature** (more deterministic = cheaper in some cases)
2. **Use shorter system prompts**
3. **Implement caching** (for repeated questions)
4. **Batch requests** when possible

---

## Security Best Practices

### 1. Environment Variables

```bash
# ✓ Good: Use .env file (gitignored)
# ✗ Bad: Hardcoded keys in code

# Ensure .env is gitignored
echo ".env" >> .gitignore
```

### 2. API Keys

```bash
# ✓ Good: Strong random key
API_KEY=$(openssl rand -hex 32)

# ✗ Bad: Simple password
API_KEY=123456
```

### 3. HTTPS Only

```nginx
# In Nginx config
return 301 https://$server_name$request_uri;
```

### 4. Rate Limiting

Already configured to prevent abuse.

### 5. CORS

Current config allows all origins. Restrict if needed:

```python
# In main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-domain.com"],  # Restrict
    allow_credentials=True,
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)
```

---

## Monitoring & Health Checks

### Health Endpoint

```bash
curl http://your-api.com/v1/health

# Response:
# {"status":"ok","version":"1.0.0"}
```

### Set Up Monitoring

**Option 1: Cron Job**
```bash
# Check every 5 minutes
*/5 * * * * curl -f http://localhost:8000/v1/health || echo "API DOWN" | mail -s "API Alert" admin@example.com
```

**Option 2: Uptime Robot**
- Visit [uptimerobot.com](https://uptimerobot.com)
- Add monitor: `http://your-api.com/v1/health`
- Get alerts if down

**Option 3: Application Monitoring**
- [DataDog](https://www.datadoghq.com/)
- [New Relic](https://newrelic.com/)
- [Sentry](https://sentry.io/) (for errors)

---

## Backup & Disaster Recovery

### Conversation Memory

Currently in-memory (lost on restart). For production:

1. **Add database** (PostgreSQL recommended)
   ```python
   # Future enhancement
   # Replace in-memory with database storage
   ```

2. **Regular backups**
   ```bash
   # Backup logs daily
   0 2 * * * tar -czf logs-$(date +%Y%m%d).tar.gz logs/
   ```

### Application Code

```bash
# Keep Git history
git init
git add .
git commit -m "Production snapshot"

# Push to GitHub
git push origin main
```

---

## Troubleshooting

### API Not Responding

```bash
# Check service status
docker-compose ps

# View logs
docker-compose logs -f

# Restart
docker-compose restart
```

### Rate Limited Errors

```bash
# Check current limits
grep "Rate limit" logs/app.log

# Increase limits in:
# src/middleware/rate_limit.py
RATE_LIMIT_MAX_REQUESTS = 120  # Increase
```

### High Costs

```bash
# Check token usage
grep "estimated_tokens" logs/app.log | tail -20

# Reduce history size in:
# src/services/openai_optimizer.py
MAX_HISTORY_MESSAGES = 3  # Reduce
```

### SSL Certificate Issues

```bash
# Check certificate
openssl x509 -in /etc/ssl/certs/your-cert.crt -text -noout

# Renew
certbot renew --force-renewal
```

---

## Scaling Considerations

As traffic grows:

1. **Load Balancer** (nginx, HAProxy)
2. **Multiple API Instances** (Docker swarm, Kubernetes)
3. **Database** (PostgreSQL, MongoDB)
4. **Cache Layer** (Redis)
5. **Message Queue** (for async processing)

---

## Maintenance

### Regular Tasks

- [ ] Monitor logs daily
- [ ] Check API health (hourly)
- [ ] Review costs (weekly)
- [ ] Update dependencies (monthly)
- [ ] Rotate API keys (quarterly)
- [ ] Review security (quarterly)

### Update Dependencies

```bash
pip list --outdated
pip install --upgrade <package>
pip freeze > requirements.txt
docker-compose build && docker-compose up -d
```

---

## Support & Resources

- **OpenAI API Docs**: https://platform.openai.com/docs
- **FastAPI Docs**: https://fastapi.tiangolo.com
- **Docker Docs**: https://docs.docker.com
- **GitHub Issues**: Report bugs or request features

---

## Summary

**Your NOVA MIND AI backend is production-ready!**

✅ Rate limiting enabled
✅ Optional authentication
✅ Optimized API usage
✅ Comprehensive logging
✅ Multiple deployment options
✅ Security best practices
✅ Monitoring setup
✅ Scaling ready

**Choose your deployment platform and deploy! 🚀**
