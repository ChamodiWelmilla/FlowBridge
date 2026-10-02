FROM eclipse-temurin:17-jdk-alpine AS builder
WORKDIR /app
COPY pom.xml .
COPY .mvn .mvn
COPY mvnw .
COPY api-service api-service
COPY processing-service processing-service
COPY delivery-service delivery-service
RUN ./mvnw clean package -DskipTests -pl delivery-service -am

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=builder /app/delivery-service/target/*.jar app.jar
EXPOSE 8083
ENTRYPOINT ["java", "-jar", "app.jar"]
