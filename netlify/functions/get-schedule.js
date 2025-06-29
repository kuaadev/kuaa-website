const fetch = require('node-fetch');

exports.handler = async function (event, context) {
    const spinitronApiKey = process.env.SPINITRON_API_KEY;
    if (!spinitronApiKey) {
        return { statusCode: 500, body: JSON.stringify({ error: "API key not configured." }) };
    }

    try {
        // Step 1: Fetch all active personas
        let personas = [];
        let personaUrl = `https://spinitron.com/api/personas?access-token=${spinitronApiKey}&station=kuaa&active=true&count=100`;
        while (personaUrl) {
            const response = await fetch(personaUrl);
            if (!response.ok) throw new Error(`Persona fetch error: ${response.statusText}`);
            const data = await response.json();
            personas = personas.concat(data.items);
            personaUrl = data._links?.next?.href;
        }

        // Step 2: Collect all unique show URLs
        const uniqueShowUrls = new Set();
        personas.forEach(persona => {
            if (persona._links?.shows) {
                persona._links.shows.forEach(showLink => {
                    uniqueShowUrls.add(showLink.href);
                });
            }
        });

        // Step 3: Fetch details for every unique show concurrently
        const showPromises = Array.from(uniqueShowUrls).map(url => fetch(url));
        const showResponses = await Promise.all(showPromises);

        // Step 4: Process the responses into detailed JSON objects
        const detailedShowsJson = await Promise.all(
            showResponses.map(res => (res.ok ? res.json() : null))
        );

        const finalSchedule = [];
        detailedShowsJson.forEach(show => {
            if (show) {
                const persona = personas.find(p => p._links?.shows?.some(s => s.href.includes(`/shows/${show.id}`)));

                // --- THIS IS THE CORRECTED PART ---
                // We now correctly include the days and start_time from the detailed 'show' object
                finalSchedule.push({
                    id: show.id,
                    title: show.title,
                    days: show.days, // This was missing
                    start_time: show.start_time, // This was missing
                    duration: show.duration,
                    persona_name: persona ? persona.name : 'KUAA'
                });
            }
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ items: finalSchedule })
        };

    } catch (error) {
        console.error("Error in get-schedule function:", error.message);
        return { statusCode: 500, body: JSON.stringify({ error: "An internal error occurred." }) };
    }
};