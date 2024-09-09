import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

const client = new SecretManagerServiceClient();

export async function loadSecretsToEnvironment(environment: string, projectName: string){
  // this is only needed for local development after mapping the secrets to environment variables in Cloud Build
  if (environment != 'local') {
    return;
  }
  // the list of secres to load, get the promise for each secret
  const secretsPromises = secrets.map((secret) => {
    const secretName = `${environment}-${secret}`;
    const secretPromise = getSecretPromise(projectName, secretName, secret);
    return secretPromise;
  });
  // wait for all the promises to resolve
  const secretsResults = await Promise.all(secretsPromises);
}

async function getSecretPromise(projectName: string, secretName: string, secretVariableName: string): Promise<any> {
  return client.accessSecretVersion({
    name: `projects/${projectName}/secrets/${secretName}/versions/latest`,
  }).then((version) => {
    const payload = version[0].payload.data.toString();
    process.env[secretVariableName] = payload;
  }).catch((err) => {
    this.logger.error('getSecretPromise', err);
    throw new Error(`Error getting secret ${secretName}: ${err}`);
  });
}

const secrets = [
  'SFDC_PASSWORD',
  'SFDC_SECURITY_TOKEN',
  'AUTH0_CLIENT_SECRET',
  'AUTH0_M2M_CLIENT_SECRET',
  'AUTH0_MGMT_CLIENT_SECRET',
  'SFDC_CLIENT_SECRET',
  'SFMC_CLIENT_SECRET',
  'STRIPE_SECRET_KEY',
  'JWT_SECRET',
  'AVALARA_PASSWORD',
]