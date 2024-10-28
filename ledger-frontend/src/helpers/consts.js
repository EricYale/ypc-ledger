const API_URL = process.env.NODE_ENV === "development" ?
    "http://localhost:1337" :
    window.location.origin;

const CHIP_COLOR_FILTERS = {
    "white": "contrast(0.3) saturate(0) brightness(1.5)",
    "red": "inherit",
    "blue": "hue-rotate(240deg)",
    "green": "hue-rotate(125deg) brightness(75%)",
    "black": "contrast(100) saturate(0)",
}

export { API_URL, CHIP_COLOR_FILTERS };
