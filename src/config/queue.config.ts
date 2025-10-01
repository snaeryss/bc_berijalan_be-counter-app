export const QUEUE_CONFIG = {
  AVERAGE_SERVICE_TIME_MINUTES: parseInt(process.env.AVERAGE_SERVICE_TIME || "5"),
  MAX_QUEUE_PER_COUNTER: parseInt(process.env.MAX_QUEUE_PER_COUNTER || "99"),
};