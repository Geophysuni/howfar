# How Far Did I Run?

Small browser map toy: click a start point, enter a distance (km), and see a **buffer / reach circle** on OpenStreetMap. Optionally lists nearby cities via the Overpass API.

Stack: Leaflet, Bootstrap, vanilla JS.

## Run locally

Open `index.html` in a browser, or serve the folder:

```bash
python -m http.server 8080
# then http://localhost:8080
```

## Files

| File | Role |
|------|------|
| `index.html` | UI |
| `script.js` | Map, buffer, Overpass query |
| `style.css` | Layout |

## Author

Sergey Zhuravlev · geophysuni@gmail.com · [LinkedIn](https://www.linkedin.com/in/sergeydmzhuravlev/)
