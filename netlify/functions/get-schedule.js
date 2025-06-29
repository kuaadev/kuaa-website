const fetch = require('node-fetch');

exports.handler = async function (event, context) {
    const spinitronApiKey = process.env.SPINITRON_API_KEY;
    if (!spinitronApiKey) {
        return { statusCode: 500, body: JSON.stringify({ error: "API key not configured." }) };
    }

    try {
        // Step 1: Fetch all active personas, handling pagination
        let personas = [];
        let personaUrl = `https://spinitron.com/api/personas?access-token=${spinitronApiKey}&station=kuaa&active=true&count=100`;
        while (personaUrl) {
            const response = await fetch(personaUrl);
            if (!response.ok) throw new Error(`Persona fetch error: ${response.statusText}`);
            const data = await response.json();
            personas = personas.concat(data.items);
            personaUrl = data._links?.next?.href;
        }

        // Step 2: Collect all unique show URLs from every persona
        const uniqueShowUrls = new Set();
        personas.forEach(persona => {
            if (persona._links?.shows) {
                persona._links.shows.forEach(showLink => {
                    uniqueShowUrls.add(showLink.href);
                });
            }
        });

        // Step 3: Fetch details for every unique show concurrently for performance
        const showPromises = Array.from(uniqueShowUrls).map(url => fetch(url));
        const showResponses = await Promise.all(showPromises);

        // Step 4: Process the responses and create a clean, final schedule array
        const detailedShowsJson = await Promise.all(showResponses.map(res => res.ok ? res.json() : null));

        const finalSchedule = [];
        detailedShowsJson.forEach(show => {
            if (show) {
                // Find the persona for this show to get the DJ name
                const persona = personas.find(p => p._links?.shows?.some(s => s.href.includes(`/shows/${show.id}`)));

                // Add the clean show object to our final list
                finalSchedule.push({
                    id: show.id,
                    title: show.title,
                    start_time: show.start_time,
                    days: show.days,
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