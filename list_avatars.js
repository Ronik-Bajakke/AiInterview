require('dotenv').config();
const axios = require('axios');

const API_KEY = process.env.BEYOND_API_KEY;
const API_BASE = process.env.API_BASE || 'https://api.bey.dev/v1';

async function listAvatars() {
    try {
        const res = await axios.get(`${API_BASE}/avatars`, {
            headers: { 'x-api-key': API_KEY }
        });
        console.log("Avatars:", JSON.stringify(res.data, null, 2));
    } catch (error) {
        console.error("Error:", error.response?.data || error.message);
    }
}

listAvatars();
