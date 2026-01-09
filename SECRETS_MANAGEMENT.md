# Secrets Management Guide (ຄູ່ມືຄຸ້ມຄວາມລັບ)

## ວິທີການຫມັ່ນ & ຈັດການ Secrets ຢ່າງປອດໄພ

### 1. ສ້າງ JWT_SECRET ໃໝ່

```bash
# Generate a strong random secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Output example:
# a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6...
```

### 2. ລົບ secrets ຈາກ version control

```bash
# ຖ້າ .env ຖືກ commit ລົງໄປແລ້ວ (ບໍ່ຄວນ):

# Remove from git history (BFG tool)
bfg --delete-files .env

# Or use git-filter-repo
git filter-repo --path .env --invert-paths

# Verify and push force
git push origin --force --all
```

### 3. Store secrets in GitHub (ຖ້າໃຊ້ GitHub)

#### ສຳລັບ Repository Secrets (environment variables ສຳລັບ CI/CD):

1. ໄປທີ່ Settings → Secrets and variables → Actions
2. ກົດ "New repository secret"
3. ເພີ່ມ secrets ຕໍ່ໄປນີ້:

```
JWT_SECRET=<your-generated-secret>
DB_PASSWORD=<strong-password>
TOMORROW_API_KEY=<your-key>
OPENWEATHER_API_KEY=<your-key>
GOOGLE_CLIENT_SECRET=<your-secret>
```

#### ສຳລັບ Environments (production, staging, development):

1. ໄປທີ່ Settings → Environments
2. ສ້າງ environment: `development`, `staging`, `production`
3. ເພີ່ມ secrets ແຕ່ລະ environment
4. ກຳນົດ deployment branch rules

### 4. Local Development (.env file)

ສຳລັບພາກພື້ນ development ທີ່ຮູບທ້ອງ:

```bash
# Copy from example
cp backend/.env.example backend/.env

# Edit with real values (NEVER commit this)
nano backend/.env

# Ensure .env is in .gitignore
grep ".env" backend/.gitignore
# Output should show: .env
```

### 5. Production Deployment

#### Option A: Environment Variables (권장)

```bash
# Export variables before starting
export JWT_SECRET="your-secret"
export DATABASE_PASSWORD="your-password"
export GOOGLE_CLIENT_SECRET="your-secret"

# Start the app
npm start
```

#### Option B: Secret Manager (AWS Secrets Manager, HashiCorp Vault)

```bash
# Using AWS Secrets Manager
aws secretsmanager get-secret-value \
  --secret-id weather-app-secrets \
  --region us-east-1 \
  | jq -r '.SecretString | fromjson | to_entries | .[] | "\(.key)=\(.value)"' \
  > /tmp/.env

# Source it
source /tmp/.env
npm start

# Clean up
rm /tmp/.env
```

#### Option C: Docker Environment File

```bash
# Create a secure .env file for production
cat > .env.production << EOF
JWT_SECRET=<your-secret>
DATABASE_PASSWORD=<password>
GOOGLE_CLIENT_SECRET=<secret>
TOMORROW_API_KEY=<key>
EOF

# Run with docker-compose
docker-compose --env-file .env.production up -d

# Keep this file secure (chmod 600)
chmod 600 .env.production

# Never commit it
echo ".env.production" >> .gitignore
```

### 6. Rotate Secrets Periodically

#### Checklist for secret rotation:

```bash
# 1. Generate new secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 2. Update in GitHub Secrets
# Go to Settings → Secrets and update each one

# 3. Update production environment
# - Update secret manager / environment variables
# - Restart application with new secrets

# 4. Test application
curl -X GET http://localhost:5000/api/auth/verify \
  -H "Authorization: Bearer <old-token>"
# Should fail if token was signed with old secret

# 5. Document rotation
# Log the rotation date and which secrets were rotated

# Schedule: Every 90 days for JWT_SECRET
# Schedule: Every 180 days for API keys (if rotation-supported)
```

### 7. Security Best Practices

```
✅ DO:
- Use strong, random secrets (min 32 characters)
- Rotate secrets every 90 days (JWT_SECRET)
- Store secrets in secure secret manager
- Use different secrets for dev/staging/production
- Audit secret access logs
- Revoke exposed secrets immediately

❌ DON'T:
- Commit .env files to git
- Share secrets in Slack/Email
- Use weak passwords
- Reuse secrets across environments
- Log secrets in error messages
- Store secrets in code comments
```

### 8. Checking for Exposed Secrets

```bash
# Search for exposed secrets in repo
git log --all --oneline -- '*.env' '*.key' '*.pem'

# Check git history for leaked credentials
git log -p | grep -i "password\|secret\|api.key"

# Use tools like git-secrets
brew install git-secrets
git secrets --install
git secrets --register-aws
git secrets --scan
```

### 9. CI/CD Integration

#### GitHub Actions Example:

```yaml
# In .github/workflows/ci-cd.yml
env:
  JWT_SECRET: ${{ secrets.JWT_SECRET }}
  DB_PASSWORD: ${{ secrets.DB_PASSWORD }}
  GOOGLE_CLIENT_SECRET: ${{ secrets.GOOGLE_CLIENT_SECRET }}

steps:
  - name: Test with secrets
    run: |
      cd backend
      npm test
```

### 10. Audit & Monitoring

```bash
# Monitor secret usage
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=EventName,AttributeValue=GetSecretValue

# Check secret manager access logs
# Set up CloudWatch alarms for suspicious access

# Regular audits
# - Who accessed what secrets?
# - When was the last rotation?
# - Are all old secrets revoked?
```

### Summary (ສະຫຼຸບ)

| Task | Frequency | Tool |
|------|-----------|------|
| Rotate JWT_SECRET | 90 days | GitHub Secrets / Secret Manager |
| Rotate API Keys | 180 days | API provider dashboard |
| Audit access | Monthly | CloudTrail / Secret Manager logs |
| Check for leaks | Weekly | git-secrets / TruffleHog |
| Update .env | As needed | Text editor (never commit) |

---

**ສຳຄັນ:** Secrets ບໍ່ຄວນເກັບຢູ່ repository ເລີ່ມແຕ່ຕົ້ນ!
