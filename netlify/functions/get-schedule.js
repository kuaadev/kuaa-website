const fetch = require('node-fetch');

exports.handler = async function (event, context) {
    const spinitronApiKey = process.env.SPINITRON_API_KEY;

    if (!spinitronApiKey) {
        return { statusCode: 500, body: JSON.stringify({ error: "API key not configured." }) };
    }

    let allPersonas = [];
    // Added `&active=true` to the URL to fetch only active personas.
    let url = `https://spinitron.com/api/personas?access-token=${spinitronApiKey}&station=kuaa&count=100&active=true`;

    try {
        while (url) {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Spinitron API error: ${response.statusText}`);

            const data = await response.json();

            if (data.items) {
                allPersonas = allPersonas.concat(data.items);
            }

            url = data._links && data._links.next ? data._links.next.href : null;
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ items: allPersonas })
        };

    } catch (error) {
        console.error("Error in get-schedule function:", error);
        return { statusCode: 500, body: JSON.stringify({ error: "An internal error occurred." }) };
    }
};