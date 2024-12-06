import { NestFactory } from "@nestjs/core";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix("api");
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      const allowedOrigins = {
        dashboards: [process.env.DASHBOARD_URL || "http://localhost:5173"],
        customers: process.env.ALLOWED_CUSTOMER_DOMAINS
          ? JSON.parse(process.env.ALLOWED_CUSTOMER_DOMAINS)
          : {},
      };

      if (allowedOrigins.dashboards.indexOf(origin) !== -1) {
        return callback(null, true);
      }

      console.warn(`Unauthorized origin attempt: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    },
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true, // Important for cookies/auth
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-organization-id",
      "x-project-id",
      "x-api-key",
    ],
  });
  app.useGlobalPipes(new ValidationPipe());

  const config = new DocumentBuilder()
    .setTitle("Feature Flag Service")
    .setDescription("API for managing feature flags")
    .setVersion("1.0")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api", app, document);
  const port = process.env.PORT ?? 5000;
  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}`);
}
bootstrap();
