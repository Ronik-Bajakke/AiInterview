require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.static('public'));
app.use(express.json());

const API_KEY = process.env.BEYOND_API_KEY;
const API_BASE = process.env.API_BASE || 'https://api.bey.dev/v1';
const AGENT_NAME = 'Beyond Agent 4';

app.get('/api/start-session', async (req, res) => {
    try {
        console.log('Fetching/Creating Agent...');

        let agentId;
        // 1. Ensure Agent Exists
        try {
            const agentsRes = await axios.get(`${API_BASE}/agents?limit=50`, {
                headers: { 'x-api-key': API_KEY }
            });
            const agents = agentsRes.data.data || [];
            console.log("Found agents:", agents.map(a => a.name));
            let agent = agents.find(a => a.name === 'Ronik' || a.name === AGENT_NAME);

            if (agent) {
                agentId = agent.id;
                console.log(`Using existing agent: ${agent.name} (${agentId})`);
            } else {
                console.log(`Creating new agent: ${AGENT_NAME}`);

                // Hardcoded valid avatar ID (Nelly)
                const avatarId = "b5bebaf9-ae80-4e43-b97f-4506136ed926";

                const payload = {
                    name: AGENT_NAME,
                    avatar_id: avatarId,
                    system_prompt: 'You are a helpful assistant.',
                    language: 'en',
                    greeting: "Hello! I am your Beyond Presence agent.",
                    capabilities: [{ type: 'webcam_vision' }],
                    llm: { type: 'openai', model: 'gpt-4o' },
                };
                console.log("Creation Payload:", JSON.stringify(payload, null, 2));

                const createRes = await axios.post(`${API_BASE}/agents`, payload, {
                    headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
                });
                agentId = createRes.data.id || createRes.data.data?.id;
                console.log(`Created new agent: ${agentId}`);
            }
        } catch (err) {
            console.error("Error finding/creating agent:", JSON.stringify(err.response?.data || err.message, null, 2));
            throw err;
        }

        // 2. Start Session via POST /calls (Correct Endpoint)
        console.log(`Starting call for agent ${agentId}`);
        if (!agentId) throw new Error("Agent ID missing");

        try {
            const callRes = await axios.post(`${API_BASE}/calls`, {
                agent_id: agentId,
            }, {
                headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
            });

            const data = callRes.data;
            if (!data.livekit_url || !data.livekit_token) {
                throw new Error("Missing livekit credentials in response");
            }

            console.log('Call started, ID:', data.id);
            res.json({
                url: data.livekit_url,
                token: data.livekit_token,
                room_name: data.id
            });
        } catch (err) {
            console.error("Error starting call:", JSON.stringify(err.response?.data || err.message));
            throw err;
        }

    } catch (error) { // Top level catch
        if (!res.headersSent) {
            console.error('Top Level Error:', error.message);
            res.status(500).json({ error: error.message, details: error.response?.data });
        }
    }
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
