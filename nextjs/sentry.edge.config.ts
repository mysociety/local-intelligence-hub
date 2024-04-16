// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1,
  debug: false,

  beforeSend(event, hint) {
    console.log('env', process.env.NODE_ENV)

    // Do not send events if in development environment
    if (process.env.NODE_ENV === 'development') {
      console.log('Development issue:', event, hint);
      return null;
    }
    return event;
  }
});
