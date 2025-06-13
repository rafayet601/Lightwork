# Security Configuration Guide

This guide explains how to properly secure the Lightwork fitness application for production deployment.

## 🔒 Authentication Security

### Environment Variables (Required for Production)

Create a `.env.local` file in your project root with the following variables:

```bash
# NextAuth Configuration (REQUIRED)
NEXTAUTH_SECRET="your-very-secure-secret-key-minimum-32-characters-long"
NEXTAUTH_URL="https://yourdomain.com"  # Your production URL

# Database Configuration
DATABASE_URL="postgresql://username:password@host:port/database"  # Use PostgreSQL for production

# OAuth Providers (Optional - enable as needed)
GITHUB_ID="your-github-oauth-app-id"
GITHUB_SECRET="your-github-oauth-app-secret"

GOOGLE_ID="your-google-oauth-client-id" 
GOOGLE_SECRET="your-google-oauth-client-secret"

# Production Settings
NODE_ENV="production"
```

### Generating Secure Secrets

**NEXTAUTH_SECRET**: Generate a secure random string:
```bash
# Option 1: Using OpenSSL
openssl rand -base64 32

# Option 2: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Option 3: Online generator (use only for development)
# Visit: https://generate-secret.vercel.app/32
```

## 🛡️ Security Features Implemented

### 1. JWT Token Security
- ✅ Consistent secret generation for JWT tokens
- ✅ Secure cookie configuration with `httpOnly` and `secure` flags
- ✅ Proper domain configuration for production
- ✅ Session lifetime management (24 hours with 1-hour refresh)

### 2. Authentication Flow
- ✅ Client-side authentication to prevent server-side JWT issues
- ✅ Secure redirect handling
- ✅ Graceful error handling and user feedback
- ✅ Session validation and renewal

### 3. API Security
- ✅ Rate limiting on API endpoints
- ✅ Input validation and sanitization
- ✅ Proper error handling without information leakage
- ✅ Database query protection

### 4. Development vs Production
- ✅ Development-only credentials provider (automatically disabled in production)
- ✅ Enhanced logging in development only
- ✅ Secure defaults for production environment

## 🚀 Production Deployment Checklist

### Before Deploying:

1. **Environment Variables**
   - [ ] Set `NEXTAUTH_SECRET` to a secure random string
   - [ ] Set `NEXTAUTH_URL` to your production domain
   - [ ] Configure production database URL
   - [ ] Set `NODE_ENV=production`

2. **Database Security**
   - [ ] Use PostgreSQL or another production-grade database
   - [ ] Enable SSL connections
   - [ ] Implement database backups
   - [ ] Use connection pooling

3. **OAuth Providers**
   - [ ] Configure OAuth apps for production domains
   - [ ] Set up proper redirect URLs
   - [ ] Use separate OAuth apps for staging/production

4. **Security Headers**
   - [ ] Configure HTTPS/SSL certificates
   - [ ] Set up security headers (CSP, HSTS, etc.)
   - [ ] Enable secure cookies

### Recommended Security Enhancements:

1. **Additional Authentication**
   ```bash
   # Add two-factor authentication
   npm install @auth/prisma-adapter qrcode
   ```

2. **Rate Limiting** (Enhanced)
   ```bash
   # Use Redis for production rate limiting
   npm install @upstash/redis
   ```

3. **Security Monitoring**
   ```bash
   # Add security monitoring
   npm install @sentry/nextjs
   ```

## 🔐 OAuth Provider Setup

### GitHub OAuth App
1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Create new OAuth App with:
   - Homepage URL: `https://yourdomain.com`
   - Authorization callback URL: `https://yourdomain.com/api/auth/callback/github`

### Google OAuth Setup
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create/select project > APIs & Services > Credentials
3. Create OAuth 2.0 Client ID with:
   - Authorized redirect URIs: `https://yourdomain.com/api/auth/callback/google`

## 🛠️ Development Security

For development, the application automatically:
- Uses a consistent generated secret to avoid JWT issues
- Enables enhanced logging for debugging
- Provides a demo credentials provider (`demo-user` / `password`)

**⚠️ Development credentials are automatically disabled in production.**

## 📊 Security Best Practices

### 1. Session Management
- Sessions expire after 24 hours
- Automatic session refresh every hour
- Secure cookie configuration
- Proper logout handling

### 2. Data Protection
- Input validation on all API endpoints
- SQL injection prevention with Prisma ORM
- XSS protection with proper sanitization
- CSRF protection via NextAuth

### 3. Error Handling
- No sensitive information in error messages
- Proper logging for security events
- Graceful degradation for auth failures

### 4. Database Security
- Parameterized queries only
- Principle of least privilege for database access
- Regular security updates

## 🚨 Security Incidents

If you discover a security vulnerability:
1. **DO NOT** create a public issue
2. Email security concerns to: [your-security-email]
3. Include detailed information about the vulnerability
4. Allow time for patch development before disclosure

## 📱 Mobile App Security

When building mobile applications:
- Use deep linking for OAuth callbacks
- Implement biometric authentication
- Use secure storage for tokens
- Enable certificate pinning

## 🔄 Regular Maintenance

- [ ] Update dependencies monthly
- [ ] Monitor security advisories
- [ ] Review access logs regularly
- [ ] Audit user permissions quarterly
- [ ] Test backup/recovery procedures

---

## Quick Start (Secure Development)

1. **Clone and install:**
   ```bash
   git clone [repository-url]
   cd lightwork
   npm install
   ```

2. **Set up environment:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

3. **Initialize database:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Start securely:**
   ```bash
   npm run dev
   ```

The application will automatically use secure defaults for development while being production-ready with proper environment variables. 