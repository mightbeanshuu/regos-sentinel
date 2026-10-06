# --- console: React + TypeScript, built into the API's wwwroot ---------------------------------
FROM node:20-alpine AS web
WORKDIR /web
COPY web/package.json web/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY web/ ./
RUN mkdir -p /src/Surveillance.Api && npx tsc --noEmit && npx vite build --outDir /out/wwwroot

# --- API: .NET 8 -------------------------------------------------------------------------------
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY Directory.Build.props Surveillance.sln ./
COPY src/Surveillance.Core/Surveillance.Core.csproj src/Surveillance.Core/
COPY src/Surveillance.Api/Surveillance.Api.csproj src/Surveillance.Api/
RUN dotnet restore src/Surveillance.Api/Surveillance.Api.csproj
COPY src/ src/
RUN dotnet publish src/Surveillance.Api/Surveillance.Api.csproj -c Release -o /app --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app ./
COPY --from=web /out/wwwroot ./wwwroot
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
USER app
ENTRYPOINT ["dotnet", "Surveillance.Api.dll"]
