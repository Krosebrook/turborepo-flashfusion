# 🚀 FlashFusion CI/CD Quick Start Guide

## Prerequisites
- Docker and Docker Compose installed
- Node.js 18+ installed
- GitHub repository with admin access
- Basic knowledge of CI/CD concepts

## 🏃‍♂️ Quick Setup (5 minutes)

### 1. Clone and Setup
```bash
git clone https://github.com/Krosebrook/turborepo-flashfusion.git
cd turborepo-flashfusion
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your API keys
```

### 3. Start Development Environment
```bash
# Start full stack with Docker
docker-compose -f docker-compose.dev.yml up

# OR start locally
npm run dev
```

### 4. Configure GitHub Secrets
In your GitHub repository settings, add these secrets:
```
ANTHROPIC_API_KEY
SUPABASE_URL
SUPABASE_ANON_KEY
DATABASE_URL
SLACK_WEBHOOK_URL (optional)
```

### 5. Test CI/CD
```bash
# Make a change and push
git add .
git commit -m "test: trigger CI/CD pipeline"
git push origin main
```

## 🎯 What You Get

✅ **Automated CI/CD** - 20+ specialized workflow jobs  
✅ **Multi-environment deployments** - Staging, production, preview  
✅ **Security scanning** - SAST, dependency, container, secret scanning  
✅ **Performance monitoring** - Lighthouse, load testing, bundle analysis  
✅ **Containerized infrastructure** - Production-ready Docker setup  
✅ **Monitoring stack** - Prometheus, Grafana dashboards  

## 🔧 Available Commands

```bash
# Development
npm run dev              # Start development servers
npm run build            # Build all packages
npm run test             # Run test suites
npm run lint             # Lint codebase

# Docker
docker-compose up        # Production environment
docker-compose -f docker-compose.dev.yml up  # Development

# CI/CD Management
gh workflow run deploy.yml -f environment=staging
gh workflow run security.yml
gh workflow run performance.yml
```

## 📊 Access Points

- **Web App**: http://localhost:3000
- **API Server**: http://localhost:8080
- **Grafana**: http://localhost:3001 (admin/admin)
- **Prometheus**: http://localhost:9090
- **PgAdmin**: http://localhost:5050 (admin@flashfusion.dev/admin)

## 🔒 Security Features

- **Automated vulnerability scanning** every push
- **Secret detection** with TruffleHog
- **Container security** with Trivy
- **License compliance** checking
- **SAST analysis** with CodeQL

## 📈 Performance Monitoring

- **Lighthouse audits** for web vitals
- **Load testing** with k6
- **Bundle size analysis**
- **Memory profiling**
- **Dependency analysis**

## 🚀 Deployment Strategies

- **Blue-green deployments** for zero downtime
- **Preview environments** for every PR
- **Automated staging** on develop branch
- **Production gates** with approvals

## 🆘 Troubleshooting

### Common Issues
1. **Build failures**: Check package dependencies
2. **Docker issues**: Ensure Docker is running
3. **Environment variables**: Verify .env configuration
4. **Port conflicts**: Check if ports 3000, 8080 are available

### Getting Help
- Check GitHub Actions logs for CI/CD issues
- Review Docker logs: `docker-compose logs`
- Monitor health endpoints: `/health` and `/api/health`

## 🎉 Next Steps

1. **Configure production secrets** in GitHub
2. **Set up Kubernetes cluster** for production deployments
3. **Configure Slack notifications** for team alerts
4. **Review security scan reports** regularly
5. **Monitor performance dashboards** in Grafana

---

**🎯 You're now ready for enterprise-grade CI/CD automation!**