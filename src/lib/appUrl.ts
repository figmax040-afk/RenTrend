// Base URL used in links inside outgoing emails. Set VITE_APP_URL once Lendy has its own domain;
// otherwise links point at whichever deployment the user is on.
export const APP_URL = (import.meta.env.VITE_APP_URL || window.location.origin).replace(/\/$/, "");
