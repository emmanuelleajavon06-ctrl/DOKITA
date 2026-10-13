/** URL du backend NestJS, lue à l'exécution (variable API_URL du service web). */
export const apiBase = (): string => (process.env.API_URL ?? "http://localhost:4000").replace(/\/$/, "");
