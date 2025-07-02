import fetch from 'node-fetch';

export async function handler() {
    const repo = 'kuaadev/kuaa-website'; // Change if needed
    const path = 'data/listeners.json';
    const token = process.env.GITHUB_TOKEN;

    const headers = {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github+json',
    };

    try {
        // Get the file from GitHub
        const res = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
            method: 'GET',
            headers,
        });

        if (!res.ok) {
            const text = await res.text();
            return {
                statusCode: res.status,
                body: JSON.stringify({ error: `GitHub API error: ${text}` }),
            };
        }

        const fileData = await res.json();

        // Decode base64 content
        const content = Buffer.from(fileData.content, 'base64').toString();

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: content,
        };
    } catch (error) {
        console.error('Error fetching listener log:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error' }),
        };
    }
}
