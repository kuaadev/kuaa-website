const fetch = require('node-fetch');

exports.handler = async function (event, context) {
    const spinitronApiKey = process.env.SPINITRON_API_KEY;

    if (!spinitronApiKey) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Spinitron API key is not configured." })
        };
    }

    let allShows = [];
    // Start with the first page
    let url = `https://spinitron.com/api/shows?access-token=${spinitronApiKey}&station=kuaa&count=100&with=personas`;

    try {
        while (url) {
            const response = await fetch(url);
            if (!response.ok) {
                // If any page request fails, return the error
                return {
                    statusCode: response.status,
                    body: JSON.stringify({ error: `Spinitron API error: ${response.statusText}` })
                };
            }

            const data = await response.json();

            // Add the shows from the current page to our main array
            if (data.items) {
                allShows = allShows.concat(data.items);
            }

            // Spinitron uses a '_links' object for pagination.
            // Check if there is a 'next' page URL and continue the loop if so.
            // If not, set the URL to null to end the loop.
            url = data._links && data._links.next ? data._links.next.href : null;
        }

        // Now, return the complete list of all shows from all pages
        return {
            statusCode: 200,
            // We reconstruct the object to match the original structure, but with all items.
            body: JSON.stringify({ items: allShows })
        };

    } catch (error) {
        console.error("Error in schedule function:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "An internal error occurred." })
        };
    }
};