# Finna App Helm Chart

A production-ready Helm chart for deploying [Finna App](https://github.com/acarmisc/finna-app) to Kubernetes.

## ✅ Features

- **Simple & Maintainable**: Minimal Helm chart with sensible defaults
- **Secure by Default**: Non-root containers, resource limits, security contexts
- **Production Ready**: Health checks, proper probes, rolling updates
- **Environment Agnostic**: Works with any Kubernetes cluster

## 🚀 Quick Start

### Prerequisites

1. **Kubernetes cluster** (1.20+)
2. **Helm** (3.0+)
3. **Existing PostgreSQL database**
4. **Ingress controller** configured

### Install

```bash
# Add Helm repository (if published)
helm repo add finna-app https://acarmisc.github.io/finna-app-helm
helm repo update

# Install to your namespace
helm install finna-app finna-app/finna-app \
  --namespace finna-app-staging \
  --create-namespace \
  --set existingSecret="your-secret-name" \
  --set existingConfigMap="your-configmap-name"
```

### Or install from source

```bash
git clone https://github.com/acarmisc/finna-app-helm.git
cd finna-app-helm

helm install finna-app . \
  --namespace finna-app-staging \
  --create-namespace \
  -f values-staging.yaml
```

## 📦 Configuration

### Required Secrets

Create a Kubernetes secret with your database and JWT configuration:

```bash
kubectl create secret generic finops-secret \
  --from-literal=PG_DSN='postgres://user:password@host:port/database?sslmode=require' \
  --from-literal=JWT_SECRET='your-very-secure-jwt-secret'
```

### Required ConfigMap

```bash
kubectl create configmap finops-config \
  --from-literal=ENVIRONMENT='staging' \
  --from-literal=LOG_LEVEL='INFO'
```

### Values Reference

| Parameter | Description | Default |
|-----------|-------------|---------|
| `replicaCount` | Number of pods | `1` |
| `image.repository` | Container image | `ghcr.io/acarmisc/finops-api` |
| `image.tag` | Image tag | `v0.4.2` |
| `image.pullPolicy` | Image pull policy | `Always` |
| `existingSecret` | Existing secret name | `finops-secret` |
| `existingConfigMap` | Existing configmap name | `finops-config` |
| `service.type` | Service type | `ClusterIP` |
| `service.port` | Service port | `80` |

### Custom Values Example

Create `values-staging.yaml`:
```yaml
replicaCount: 1
existingSecret: "finops-secret"
existingConfigMap: "finops-config"

resources:
  requests:
    cpu: 250m
    memory: 256Mi
  limits:
    cpu: 500m
    memory: 512Mi
```

## 🔒 Security

- **Non-root containers**: Runs as UID 1000
- **Resource limits**: Prevents resource exhaustion
- **Read-only filesystem**: Where possible
- **Capability dropping**: All Linux capabilities dropped
- **No privilege escalation**: Security context enforced
- **Network policies**: Ready for network isolation

## 🛡️ Ingress Configuration

Example ingress (separate from this chart):

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: finna-api
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  ingressClassName: traefik
  rules:
  - host: finna-app.yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: finna-app
            port:
              number: 80
  tls:
  - hosts:
    - finna-app.yourdomain.com
    secretName: finna-app-tls
```

## 📈 Monitoring

The chart includes health endpoints:
- **Liveness**: `/healthz`
- **Readiness**: `/healthz`
- **Startup**: `/healthz`

Configure your monitoring system to scrape these endpoints.

## 🔄 Upgrading

```bash
# Upgrade to new version
helm upgrade finna-app . \
  --namespace finna-app-staging \
  --set image.tag=v0.5.0

# Rollback if needed
helm rollback finna-app 1
```

## 🧪 Testing

```bash
# Verify deployment
kubectl get pods -n finna-app-staging

# Check logs
kubectl logs -l app.kubernetes.io/name=finna-app -n finna-app-staging

# Test health endpoint
kubectl port-forward svc/finna-app 8080:80 -n finna-app-staging
curl http://localhost:8080/healthz
```

## 📝 License

MIT License - See [LICENSE](LICENSE) for details.

## 🤝 Contributing

Contributions welcome! Please open issues or pull requests.

## 📬 Support

For questions or issues, please open a GitHub issue.
