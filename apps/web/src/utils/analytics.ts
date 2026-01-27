import posthog from 'posthog-js';

export const initAnalytics = () => {
  const apiKey = import.meta.env.VITE_POSTHOG_KEY;
  const apiHost = import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com';

  if (apiKey) {
    posthog.init(apiKey, {
      api_host: apiHost,
      person_profiles: 'identified_only', // or 'always' to create profiles for anonymous users
    });
  }
};

export const captureEvent = (eventName: string, properties?: Record<string, any>) => {
  if (import.meta.env.VITE_POSTHOG_KEY) {
    posthog.capture(eventName, properties);
  } else {
    console.log(`[Analytics] ${eventName}`, properties);
  }
};
