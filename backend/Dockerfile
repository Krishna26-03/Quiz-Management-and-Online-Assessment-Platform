# ---- Build stage: compile the jar with Maven + JDK 21 ----
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
# Copy pom.xml first and pre-fetch dependencies so this layer is cached
# between builds unless pom.xml itself changes (much faster rebuilds).
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn clean package -DskipTests -B

# ---- Run stage: slim JRE-only image, no Maven/JDK bloat ----
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
# Render sets $PORT; Spring Boot reads server.port from application.properties
# (currently hardcoded to 8080) - EXPOSE is informational only, doesn't need to match.
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
