# Finna App Helm Chart

A Helm chart for deploying Finna App to Kubernetes.

## Security Notice

✅ **This chart is safe to commit and share publicly** - it contains no secrets or sensitive configuration.

## Structure

```
finna-app-deployment/
├── Chart.yaml          # Chart metadata
├── values.yaml         # Default values (safe to commit)
├── templates/         # Kubernetes manifests
│   ├── deployment.yaml
│   ├── service.yaml
│   └── _helpers.tpl
├── .gitignore          # Excludes sensitive files
└── README.md           # This file
```

## Deployment

### Prerequisites

1. Existing Kubernetes secrets for database and JWT:
   ```bash
   # These should be created separately in your cluster
   kubectl create secret generic finops-secret \
     --from-literal=PG_DSN='your-postgres-connection-string' \
     --from-literal=JWT_SECRET='your-jwt-secret'
   
   kubectl create configmap finops-config \
     --from-literal=ENVIRONMENT='staging' \
     --from-literal=LOG_LEVEL='INFO'
   ```

2. Existing ingress configuration pointing to the `finops-api` service

### Install

```bash
# For staging (uses values.yaml defaults)
helm install finna-app . --namespace finna-app-staging

# For production (with custom values)
helm install finna-app . \
  --namespace finna-app-production \
  -f values-prod.yaml
```

### Upgrade

```bash
helm upgrade finna-app . \
  --namespace finna-app-staging \
  --set image.tag=v0.5.0
```

## Environment-Specific Configuration

Create environment-specific value files (add to .gitignore):

- `values-staging.yaml` - Staging environment overrides
- `values-prod.yaml` - Production environment overrides

Example `values-prod.yaml`:
```yaml
existingSecret: "finops-secret-prod"
existingConfigMap: "finops-config-prod"
replicaCount: 3
resources:
  limits:
    cpu: 1000m
    memory: 1Gi
```

## Values Reference

| Parameter | Description | Default |
|-----------|-------------|---------|
| `replicaCount` | Number of pods | `1` |
| `image.repository` | Container image | `ghcr.io/acarmisc/finops-api` |
| `image.tag` | Image tag | `v0.4.2` |
| `existingSecret` | Existing secret name | `finops-secret` |
| `existingConfigMap` | Existing configmap name | `finops-config` |

## Security

- Pods run as non-root user (UID 1000)
- Resource limits prevent resource exhaustion
- Read-only root filesystem where possible
- All capabilities dropped
- No privilege escalation allowed

## License

MIT License - see LICENSE file for details.
