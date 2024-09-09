# MyUSS API
The MyUss API is used by MyUSS front-end applications to interact with United Site Services back end systems.
## Developer Setup
### NestJS
Install the Nest CLI to get started 

```npm i -g @nestjs/cli```
### Redis
The MyUSS API uses hosted Redis caching.  For local development, it is useful to have Redis running in a Docker container
https://redis.io/docs/getting-started/install-stack/docker/

Use the following command to start the container with RedisInsight available on http://localhost:8001

```docker run -d --name redis-stack -p 6379:6379 -p 8001:8001 redis/redis-stack:latest```

### DevOps
https://cloud.google.com/run/docs/reference/yaml/v1

Command line to create a new deployment

```gcloud deploy releases create myuss-api-<TAG_NAME> --project=uss-portal-devops --delivery-pipeline=myuss-api-pipeline --region=us-central1 --source=./gcp-config --images=myuss-api-image=us-central1-docker.pkg.dev/uss-portal-devops/myuss-api/myuss-api:<TAG_NAME>```

Update the CD pipeline
```gcloud deploy apply --file=gcp-config/deploy/clouddeploy.yaml --region=us-central1 --project=uss-portal-devops```
### Secrets Management
MyUSS uses GCP Secrets Manager to store sensitive information and load it as envrionment variables at runtime in Cloud Run, following best practices:

https://cloud.google.com/secret-manager/docs/best-practices
https://cloud.google.com/run/docs/configuring/services/secrets

## Updating Secrets
The secrets loader always pulls the "latest" version of the secret, regardless of its status.  When updating secrets, always ensure that the version with the highest version number is the correct value.

## Firestore Setup
gcloud alpha firestore databases create \
--database=myuss-{env} \
--location=nam5 \
--type=firestore-native

Grant access to the specific database for the service account
gcloud projects add-iam-policy-binding uss-portal-prod \
--member='serviceAccount:myuss-api@uss-portal-prod.iam.gserviceaccount.com' \
--role='roles/datastore.user' \
--condition='expression=resource.name=="projects/uss-portal-prod/databases/myuss",title=back-end-access-prod,description="Access production Firestore database"'

## Cloud Build

https://cloud.google.com/build/docs/securing-builds/configure-user-specified-service-accounts
