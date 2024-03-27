import posthog from 'posthog-js';

export const triggerCustomEvent = (eventName: string, properties = {}) => {
  posthog.capture(eventName, properties);
};

