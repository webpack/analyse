# syntax=docker/dockerfile:1

# Two ways to run this repository in a container:
#
#   docker build -t webpack-analyse .          # static site behind nginx
#   docker build -t webpack-analyse-dev --target dev .   # webpack dev server
#
# See the "Docker" section of README.md for the run commands.

# Pinned to the version .nvmrc and `engines.node` ask for. `engine-strict` in
# .npmrc aborts the install on any other one, so this cannot drift silently.
ARG NODE_VERSION=24.20.0
ARG NGINX_VERSION=1.29-alpine

FROM node:${NODE_VERSION}-alpine AS deps
WORKDIR /app
# Only the manifests, so a source edit does not invalidate the install layer.
# .npmrc has to come along: it carries the engine-strict flag the install is
# expected to run under.
COPY package.json package-lock.json .npmrc ./
# `npm ci` rather than `npm install`: it fails on a package-lock.json that does
# not match package.json instead of quietly rewriting it, which is what CI does.
RUN npm ci

# Development: the webpack dev server, for editing the app with the source
# bind-mounted over /app. Not the default target.
FROM deps AS dev
COPY . .
EXPOSE 8080
# --host 0.0.0.0 because the server has to answer on the container's external
# interface; the default 127.0.0.1 is only reachable from inside the container.
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

FROM deps AS build
COPY . .
# The published site is built with long-term caching and the analytics snippet,
# matching the GitHub Pages deploy. A self-hosted copy that should not report to
# webpack's analytics property can drop the second flag:
#   docker build --build-arg WEBPACK_ENV=--env\ longTermCaching .
ARG WEBPACK_ENV="--env longTermCaching --env googleAnalytics"
RUN npx webpack --mode production ${WEBPACK_ENV}

# Runtime: the built site is static, so nothing of Node ships in the final
# image. The app routes on the URL hash, so no history-API rewrite is needed
# either and nginx can serve the directory as it is.
FROM nginx:${NGINX_VERSION} AS runtime
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
# 127.0.0.1 rather than localhost, so the check does not depend on how the
# resolver orders IPv4 and IPv6.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
	CMD wget -q --spider http://127.0.0.1/ || exit 1
