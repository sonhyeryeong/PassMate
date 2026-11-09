FROM maven:3.9.9-eclipse-temurin-17 AS build
WORKDIR /build
COPY pom.xml .
COPY src/main src/main
RUN mvn -B -ntp -DskipTests package

FROM eclipse-temurin:17-jre
ENV SPRING_PROFILES_ACTIVE=postgres,staging
WORKDIR /app
COPY --from=build /build/target/passmate-*.jar /app/passmate.jar
USER 10001
ENTRYPOINT ["java", "-jar", "/app/passmate.jar"]
