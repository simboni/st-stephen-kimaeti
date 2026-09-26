# Holy Cross EMS — production image.
#
# Everything runs inside the container: no Node, no PostgreSQL and no build
# tooling is installed on the host. That is what lets the school share a server
# with something already running on it.
#
# Plain `next start` rather than standalone output: the Prisma CLI has to be
# present at boot to apply migrations, and output tracing would drop it.

FROM node:22-alpine AS build
WORKDIR /app
# Prisma's query engine needs OpenSSL on alpine.
RUN apk add --no-cache openssl
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Keep this stable across rebuilds or forms submitted mid-deploy fail with
# "Failed to find Server Action".
ARG NEXT_SERVER_ACTIONS_ENCRYPTION_KEY=""
ENV NEXT_SERVER_ACTIONS_ENCRYPTION_KEY=$NEXT_SERVER_ACTIONS_ENCRYPTION_KEY
# The build must never reach a database — this URL is deliberately dead, and
# the build failing here would mean a page is querying at build time.
ENV DATABASE_URL="postgresql://unused@127.0.0.1:1/unused"
RUN npm run build

FROM node:22-alpine
WORKDIR /app
RUN apk add --no-cache openssl
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/docker-entrypoint.sh /usr/local/bin/entrypoint
RUN chmod +x /usr/local/bin/entrypoint

EXPOSE 3000
ENTRYPOINT ["/usr/local/bin/entrypoint"]
