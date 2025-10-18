# ---------- Base builder (installs deps) ----------
FROM node:20-alpine AS deps
WORKDIR /app

# If you have a package-lock.json, keep npm. If you use yarn/pnpm, adjust.
COPY package*.json ./
RUN npm ci --omit=dev

# ---------- Runtime image ----------
FROM node:20-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy app source
COPY . .

# Security: run as non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Healthcheck (optional but nice). If you have a /health route, use it.
# Replace /health with your actual health endpoint.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:3001/health || exit 1

# Expose the app port (matches your .env PORT)
EXPOSE 3001

# Start command. Change if your service uses a different entry (e.g. dist/index.js).
# Common cases:
#  - "node src/server.js"
#  - "node index.js"
#  - "npm start" (if start script is set properly)
CMD ["npm", "start"]
