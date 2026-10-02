FROM eclipse-temurin:17-jdk-alpine AS builder
WORKDIR /app
COPY pom.xml .
COPY .mvn .mvn
COPY mvnw .
COPY api-service api-service
COPY processing-service processing-service
COPY delivery-service delivery-service
RUN ./mvnw clean package -DskipTests -pl processing-service -am

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=builder /app/processing-service/target/*.jar app.jar
EXPOSE 8082
ENTRYPOINT ["java", "-jar", "app.jar"]
