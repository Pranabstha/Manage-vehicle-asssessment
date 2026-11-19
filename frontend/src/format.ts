export function formatTime(ts: string) {
  return new Date(ts).toLocaleString("en-AU");
}

export function formatSpeed(speed: number) {
  return `${speed.toFixed(1)} km/h`;
}

export function formatPosition(lat: number, lon: number) {
  return `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
}
