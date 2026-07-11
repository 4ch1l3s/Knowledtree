# syntax=docker/dockerfile:1

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

RUN apt-get update \
    && apt-get install -y --no-install-recommends nodejs npm \
    && npm install --global yarn@1.22.22 \
    && rm -rf /var/lib/apt/lists/*

RUN dotnet tool install --tool-path /tools Volo.Abp.Cli --version 9.0.4

COPY . .

WORKDIR /src/src/Knowledtree.Web
RUN yarn install --frozen-lockfile \
    && /tools/abp install-libs

WORKDIR /src
RUN dotnet restore src/Knowledtree.Web/Knowledtree.Web.csproj --runtime linux-x64 \
    && dotnet publish src/Knowledtree.Web/Knowledtree.Web.csproj \
        --configuration Release \
        --no-restore \
        --runtime linux-x64 \
        --self-contained false \
        --output /app/publish \
        /p:UseAppHost=false \
        /p:SkipLocalDatabaseStart=true

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app

COPY --from=build /app/publish .

RUN mkdir -p /app/Logs \
    && chown -R "$APP_UID:$APP_UID" /app

USER $APP_UID

EXPOSE 10000

ENTRYPOINT ["sh", "-c", "exec dotnet Knowledtree.Web.dll --urls http://0.0.0.0:${PORT:-10000}"]
