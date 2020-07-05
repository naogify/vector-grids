const map = new window.geolonia.Map("#map");

const refresh = () => {
  const zoom = Math.floor(map.getZoom()) + 2;
  const bounds = map.getBounds();
  let { lng: lng1, lat: lat1 } = bounds.getNorthWest();
  let { lng: lng2, lat: lat2 } = bounds.getSouthEast();
  let { lng: lng3, lat: lat3 } = bounds.getNorthEast();
  let { lng: lng4, lat: lat4 } = bounds.getSouthWest();

  const [x1, y1] = tilebelt.pointToTile(lng1, lat1, zoom);
  const [x2, y2] = tilebelt.pointToTile(lng2, lat2, zoom);
  const [x3, y3] = tilebelt.pointToTile(lng3, lat3, zoom);
  const [x4, y4] = tilebelt.pointToTile(lng4, lat4, zoom);

  const min_x = Math.min(x1, x2, x3, x4);
  const max_x = Math.max(x1, x2, x3, x4);
  const min_y = Math.min(y1, y2, y3, y4);
  const max_y = Math.max(y1, y2, y3, y4);

  const geojson = {
    type: "FeatureCollection",
    features: [],
  };

  for (let x = min_x; x < max_x + 1; x++) {
    for (let y = min_y; y < max_y + 1; y++) {
      const geometry = tilebelt.tileToGeoJSON([x, y, zoom]);
      const points = geometry.coordinates[0];
      let l1 = turf.distance(points[0], points[1]);
      let l2 = turf.distance(points[1], points[2]);
      let l3 = turf.distance(points[2], points[3]);
      let l4 = turf.distance(points[3], points[4]);
      let km_l1 = l1;
      let km_l2 = l2;
      let km_l3 = l3;
      let km_l4 = l4;
      let unit = "km";
      if (l1 > 1 && l2 > 1) {
        l1 = (Math.round(l1 * 100) / 100).toString();
        l2 = (Math.round(l2 * 100) / 100).toString();
        l3 = (Math.round(l3 * 100) / 100).toString();
        l4 = (Math.round(l4 * 100) / 100).toString();
      } else if (l1 > 0.01 && l2 > 0.01) {
        l1 = Math.round(1000 * l1).toString();
        l2 = Math.round(1000 * l2).toString();
        l3 = Math.round(1000 * l3).toString();
        l4 = Math.round(1000 * l4).toString();
        unit = "m";
      } else {
        l1 = (Math.round(10000000 * l1) / 100).toString();
        l2 = (Math.round(10000000 * l2) / 100).toString();
        l3 = (Math.round(10000000 * l3) / 100).toString();
        l4 = (Math.round(10000000 * l4) / 100).toString();
        unit = "cm";
      }
      geojson.features.push({
        type: "Feature",
        properties: {
          x,
          y,
          z: zoom,
          l1,
          l2,
          l3,
          l4,
          unit,
          km_l1,
          km_l2,
          km_l3,
          km_l4,
        },
        geometry,
      });
    }
  }
  try {
    map.removeLayer("grids-line");
    map.removeLayer("grids-symbol");
    map.removeSource("grids");
  } catch (error) {
    // nothing
  }
  map.addSource("grids", {
    type: "geojson",
    data: geojson,
  });
  map.addLayer({
    id: "grids-line",
    source: "grids",
    type: "line",
    paint: {
      "line-width": 1,
    },
  });
  map.addLayer({
    id: "grids-symbol",
    source: "grids",
    type: "symbol",
    layout: {
      "text-field": [
        "concat",
        ["get", "z"],
        " / ",
        ["get", "x"],
        " / ",
        ["get", "y"],
        "\ntop: ",
        ["get", "l2"],
        " ",
        ["get", "unit"],
        "\nbottom: ",
        ["get", "l4"],
        " ",
        ["get", "unit"],
        "\nside: ",
        ["get", "l1"],
        " ",
        ["get", "unit"],
      ],
      "text-size": 10,
      "text-font": ["Noto Sans Regular"],
    },
  });

  return zoom;
};

map.on("load", () => {
  let prevZoom = refresh();

  map.on("zoom", (e) => {
    const zoom = Math.floor(map.getZoom()) + 2;
    if (zoom !== prevZoom) {
      prevZoom = refresh();
    }
  });
});
