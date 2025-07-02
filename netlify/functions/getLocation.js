// netlify/functions/getLocation.js

import fetch from 'node-fetch';

export async function handler(event, context) {
    const ip =
        event.headers['x-forwarded-for']?.split(',')[0] ||
        event.headers['client-ip'] ||
        '0.0.0.0';

    try {
        // --- STEP 1: Look up IP geolocation ---
        const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,city,lat,lon`);
        const data = await geoRes.json();

        if (data.status !== 'success') {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Failed to look up IP location' }),
            };
        }

        const visitor = {
            city: data.city,
            country: data.country,
            lat: data.lat,
            lon: data.lon,
            timestamp: new Date().toISOString(),
            ip,
        };

        // --- STEP 2: Log to GitHub repo ---
        await logVisitor(visitor);

        return {
            statusCode: 200,
            body: JSON.stringify(visitor),
        };
    } catch (err) {
        console.error('Location fetch error:', err);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error' }),
        };
    }
}

// 🔐 GitHub Logging Helper
async function logVisitor(visitor) {
    const repo = 'kuaadev/kuaa-website'; // CHANGE if needed
    const path = 'data/listeners.json';
    const token = process.env.GITHUB_TOKEN;

    const headers = {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
    };

    // Step 1: Read existing JSON and SHA
    const res = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
        method: 'GET',
        headers,
    });

    if (!res.ok) {
        throw new Error('Could not fetch listeners.json from GitHub');
    }

    const fileData = await res.json();
    const existingLog = JSON.parse(Buffer.from(fileData.content, 'base64').toString());

    // Step 2: Append and re-encode
    const updatedLog = [...existingLog.slice(-99), visitor]; // Keep last 100 only
    const updatedContent = Buffer.from(JSON.stringify(updatedLog, null, 2)).toString('base64');

    // Step 3: Push new commit
    const commitRes = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
            message: 'Log new listener location',
            content: updatedContent,
            sha: fileData.sha,
        }),
    });

    if (!commitRes.ok) {
        const errText = await commitRes.text();
        throw new Error('GitHub commit failed: ' + errText);
    }

    console.log('✔ Visitor logged to GitHub');
}
