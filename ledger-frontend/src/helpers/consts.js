const API_URL = process.env.NODE_ENV === "development" ?
    "http://localhost:1337" :
    window.location.origin;

export { API_URL };
