# Running Locally

```
npm i && npm run serve-local
```

# Deploying

1. Build and push the docker image. You will want to use your own Dockerhub repository.
```
docker login
docker build . -t jaredcnance/eks-demo:latest
docker push jaredcnance/eks-demo
```

2. Apply the configuration to your cluster.
```
kubectl apply -f kubernetes/deployment.yaml
kubectl apply -f kubernetes/service.yaml
kubectl get deployment eks-demo
```

3. To test, naviagate to your ELB endpoint for the cluster:

```
curl http://<endpoint>.<region>.elb.amazonaws.com/ping
```

4. To update, re-build, push changes and delete the running pod.

```
docker build . -t jaredcnance/eks-demo:latest
docker push jaredcnance/eks-demo
kubectl delete pod ... 
```