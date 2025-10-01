export const sseEventFormat = (eventName: string, data: string): string => {
  let sseMessage = "";
  sseMessage += `event: ${eventName}\n`;
  sseMessage += `data: ${data}\n`;
  sseMessage += `\n`;
  return sseMessage;
};
