FROM mcr.microsoft.com/dotnet/sdk:9.0-alpine AS build
WORKDIR /src

# Restore dependencies first (layer caching)
COPY EcosferServices.csproj ./
RUN dotnet restore --runtime linux-musl-x64

# Copy source and publish
COPY . .
RUN dotnet publish -c Release -o /app/publish --runtime linux-musl-x64 --no-restore --self-contained false

# Production image
FROM mcr.microsoft.com/dotnet/aspnet:9.0-alpine AS runtime
WORKDIR /app

# Security: non-root user
RUN addgroup -S ecosfer && adduser -S ecosfer -G ecosfer

COPY --from=build --chown=ecosfer:ecosfer /app/publish .

USER ecosfer

ENV ASPNETCORE_URLS=http://+:5100
EXPOSE 5100

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5100/health || exit 1

ENTRYPOINT ["dotnet", "EcosferServices.dll"]
