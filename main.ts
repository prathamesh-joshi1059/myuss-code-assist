import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { loadSecretsToEnvironment } from './config/configuration';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  // load secrets as environment variables following best practices
  const env = process.env.ENVIRONMENT;
  const projectName = process.env.GCP_PROJECT_NAME;
  if (env && projectName) {
    await loadSecretsToEnvironment(env, projectName);
  }

  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe());
   // Setting up Swagger document 
  const options = new DocumentBuilder()
  .setTitle('MyUSS')
  .setDescription('MyUSS Open API Documentation')
  .addBearerAuth()
  .build()
//enabling versioning
app.enableVersioning({
  defaultVersion: '1',
  type: VersioningType.URI
});

const document = SwaggerModule.createDocument(app, options);

SwaggerModule.setup('api', app, document);
  await app.listen(process.env.PORT || 8090);
}
bootstrap();
