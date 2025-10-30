// MGRS Conversion Library
window.Mgrs = class Mgrs {
    static latBands = 'CDEFGHJKLMNPQRSTUVWXX';
    static e100kLetters = ['ABCDEFGH', 'JKLMNPQR', 'STUVWXYZ'];
    static n100kLetters = ['ABCDEFGHJKLMNPQRSTUV', 'FGHJKLMNPQRSTUVABCDE'];

    static toMgrs(lat, lon) {
        // Convert lat/lon to UTM first
        const utmCoord = this.latLonToUtm(lat, lon);
        return this.utmToMgrs(utmCoord);
    }

    static toPoint(mgrsString) {
        try {
            // Parse MGRS string
            const parts = mgrsString.trim().split(/\s+/);
            if (parts.length !== 4) {
                throw new Error('Invalid MGRS format');
            }

            const gridZone = parts[0];  // e.g., "17S"
            const squareID = parts[1];  // e.g., "KT"
            const easting = parseInt(parts[2]);   // e.g., "85128"
            const northing = parseInt(parts[3]);  // e.g., "53610"

            // Parse zone and band
            const zone = parseInt(gridZone.slice(0, -1));
            const band = gridZone.slice(-1);

            // Calculate the central meridian of the zone
            const zoneCenterLon = ((zone - 1) * 6 - 180 + 3);

            // Find the band index and calculate base latitude
            const bandIdx = this.latBands.indexOf(band);
            if (bandIdx === -1) throw new Error('Invalid band letter');
            const baseLat = -80 + (bandIdx * 8) + 4; // Center of the latitude band

            // Get the 100km square coordinates
            const e100k = squareID.charAt(0);
            const n100k = squareID.charAt(1);

            // Calculate easting/northing
            const e100kNum = this.e100kLetters[(zone - 1) % 3].indexOf(e100k);
            const n100kNum = this.n100kLetters[(zone - 1) % 2].indexOf(n100k);

            if (e100kNum === -1 || n100kNum === -1) {
                throw new Error('Invalid square identifier');
            }

            // Convert to UTM coordinates
            const utmEasting = ((e100kNum + 1) * 100000) + easting;
            const utmNorthing = (n100kNum * 100000) + northing;

            // Convert UTM to geographic coordinates
            const lon = zoneCenterLon + ((utmEasting - 500000) / 100000);
            let lat = baseLat + ((utmNorthing) / 100000);

            // Adjust latitude based on the hemisphere (N/S)
            if (band < 'N') {
                lat -= 4; // Southern hemisphere adjustment
            }

            return {
                lat: lat,
                lng: lon
            };
        } catch (error) {
            console.error('MGRS conversion error:', error.message);
            throw new Error('Invalid MGRS coordinates');
        }
    }

    static latLonToUtm(lat, lon) {
        const zone = Math.floor((lon + 180) / 6) + 1;
        const band = this.latBands.charAt(Math.floor(lat / 8 + 10));

        // Constants for WGS84
        const a = 6378137; // equatorial radius
        const f = 1 / 298.257223563; // flattening
        const k0 = 0.9996; // scale factor
        const e = Math.sqrt(2 * f - f * f); // eccentricity

        const latRad = lat * Math.PI / 180;
        const lonRad = lon * Math.PI / 180;
        const lonOrigin = (zone - 1) * 6 - 180 + 3;
        const lonOriginRad = lonOrigin * Math.PI / 180;

        const N = a / Math.sqrt(1 - e * e * Math.sin(latRad) * Math.sin(latRad));
        const T = Math.tan(latRad) * Math.tan(latRad);
        const C = e * e * Math.cos(latRad) * Math.cos(latRad) / (1 - e * e);
        const A = Math.cos(latRad) * (lonRad - lonOriginRad);

        const M = a * ((1 - e * e / 4 - 3 * e * e * e * e / 64 - 5 * e * e * e * e * e * e / 256) * latRad
            - (3 * e * e / 8 + 3 * e * e * e * e / 32 + 45 * e * e * e * e * e * e / 1024) * Math.sin(2 * latRad)
            + (15 * e * e * e * e / 256 + 45 * e * e * e * e * e * e / 1024) * Math.sin(4 * latRad)
            - (35 * e * e * e * e * e * e / 3072) * Math.sin(6 * latRad));

        const easting = k0 * N * (A + (1 - T + C) * A * A * A / 6
            + (5 - 18 * T + T * T + 72 * C - 58) * A * A * A * A * A / 120)
            + 500000;

        let northing = k0 * (M + N * Math.tan(latRad) * (A * A / 2
            + (5 - T + 9 * C + 4 * C * C) * A * A * A * A / 24
            + (61 - 58 * T + T * T + 600 * C - 330) * A * A * A * A * A * A / 720));

        if (lat < 0) {
            northing += 10000000;
        }

        return { zone, band, easting, northing };
    }

    static utmToMgrs(utmCoord) {
        const { zone, band, easting, northing } = utmCoord;

        // Get the column letter
        const col = Math.floor(easting / 100000);
        const e100k = this.e100kLetters[(zone - 1) % 3].charAt(col - 1);

        // Get the row letter
        const row = Math.floor(northing / 100000) % 20;
        const n100k = this.n100kLetters[(zone - 1) % 2].charAt(row);

        // Get the numerical part
        const e = Math.floor(easting % 100000);
        const n = Math.floor(northing % 100000);

        // Format the result
        return `${zone}${band} ${e100k}${n100k} ${e.toString().padStart(5, '0')} ${n.toString().padStart(5, '0')}`;
    }
}; 