// netlify/functions/getLog.js

import fs from 'fs/promises';
import path from 'path';

const LOG_FILE = path.resolve('/tmp/visitor-log.json'); // Temp storage

export async function handler() {
    try {
        const data = await fs.readFile(LOG_FILE, 'utf-8');
        const log = JSON.parse(data);

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(log),
        };
    } catch (err) {
        console.error('Error reading visitor log:', err);

        return {
            statusCode: 404,
            body: JSON.stringify({ error: 'No visitor log found' }),
        };
    }
}
