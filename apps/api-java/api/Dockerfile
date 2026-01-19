# ---------- build ----------
FROM eclipse-temurin:21-jdk AS builder
WORKDIR /app

# Copy Maven wrapper + pom first for layer caching
COPY mvnw ./
COPY .mvn .mvn
COPY pom.xml ./

# Download deps (cache)
RUN ./mvnw -q -DskipTests dependency:go-offline

# Copy source and build
COPY src src
RUN ./mvnw -q -DskipTests package

# ---------- run ----------
FROM eclipse-temurin:21-jre
WORKDIR /app

# Copy the built jar
COPY --from=builder /app/target/*.jar app.jar

EXPOSE 8080
ENV JAVA_OPTS=""
CMD ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
