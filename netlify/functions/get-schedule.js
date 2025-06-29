const data = await response.json();

// --- ADD THESE TWO LINES ---
console.log('--- RAW DATA FROM SPINITRON API ---');
console.log(JSON.stringify(data, null, 2));

return {
    statusCode: 200,
    body: JSON.stringify(data)
};

const fetch = require('node-fetch');

exports.handler = async function (event, context) {
    const spinitronApiKey = process.env.SPINITRON_API_KEY;

    if (!spinitronApiKey) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Spinitron API key is not configured." })
        };
    }

    // This now correctly includes the `with=personas` parameter to fetch DJ names.
    const spinitronApiUrl = `https://spinitron.com/api/shows?access-token=${spinitronApiKey}&station=kuaa&count=500&with=personas`;

    try {
        const response = await fetch(spinitronApiUrl);

        if (!response.ok) {
            return {
                statusCode: response.status,
                body: JSON.stringify({ error: `Spinitron API error: ${response.statusText}` })
            };
        }

        const data = await response.json();
        return {
            statusCode: 200,
            body: JSON.stringify(data)
        };
    } catch (error) {
        console.error("Error in schedule function:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "An internal error occurred." })
        };
    }
};