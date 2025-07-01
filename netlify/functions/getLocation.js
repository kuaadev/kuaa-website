// /netlify/functions/getLocation.js

exports.handler = async (event, context) => {
    // Get the visitor's IP address from the request headers
    const ip = event.headers['x-nf-client-connection-ip'] || '8.8.8.8'; // Fallback to Google's DNS IP

    try {
        // Fetch location data from a free geolocation API
        const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,regionName,city,lat,lon`);
        const data = await response.json();

        if (data.status !== 'success') {
            throw new Error(data.message || 'Failed to get location data');
        }

        // Return the location data in a successful response
        return {
            statusCode: 200,
            body: JSON.stringify({
                city: data.city,
                region: data.regionName,
                country: data.country,
                lat: data.lat,
                lon: data.lon,
            }),
        };
    } catch (error) {
        // Return an error response if something goes wrong
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};