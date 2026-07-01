const DiscordRPC = require('discord-rpc');
const nodeFetch = require('node-fetch');

const clientId = '1521697410265387210';
let rpc = null;
let startTimestamp = null;
let updateInterval = null;
let isGameRunning = false;

function init() {
    if (rpc) return;

    DiscordRPC.register(clientId);
    rpc = new DiscordRPC.Client({ transport: 'ipc' });
    startTimestamp = new Date();

    rpc.on('ready', () => {
        console.log('[Discord RPC] Autopresence active.');
        updateActivity();
    });

    rpc.login({ clientId }).catch(e => {
        console.error('[Discord RPC] Login failed:', e);
        rpc = null;
    });
}

async function updateActivity() {
    if (!rpc) return;

    try {
        let details = 'In the launcher';
        let state = 'Waiting to play';
        let partySize = 0;
        let partyMax = 0;

        if (isGameRunning) {
            details = 'On the server';
            state = 'Playing';
            try {
                // Fetch players connect from api
                const res = await nodeFetch('https://56corpo.com/launcher/Selvania-Launcher-WEB-Folder/launcher/api.php?action=server_status');
                if (res.ok) {
                    const data = await res.json();
                    if (data && typeof data.playersConnect !== 'undefined') {
                        partySize = parseInt(data.playersConnect) || 0;
                        partyMax = 100; // You can adjust maximum capacity as desired
                        state = `Online (${partySize} players)`;
                    }
                }
            } catch (e) {
                console.error('[Discord RPC] Error fetching status:', e);
            }
        }

        const activity = {
            details: details,
            state: state,
            startTimestamp,
            largeImageKey: 'icon',
            largeImageText: 'Survie Avec Tout Le Monde',
            instance: false,
            buttons: [
                { label: 'Discord Server', url: 'https://discord.gg/Y5P72FS33m' },
                { label: 'Download Launcher', url: 'https://satm.56corpo.com/' }
            ]
        };

        if (partyMax > 0) {
            activity.partySize = partySize;
            activity.partyMax = partyMax;
        }

        await rpc.setActivity(activity);
    } catch (e) {
        console.error('[Discord RPC] Error setting activity:', e);
    }
}

function setGameRunning(running) {
    isGameRunning = running;
    // Reset timestamp when game launches to show playtime for the game
    if (running) {
        startTimestamp = new Date();
        // Start polling player count when game is running
        if (!updateInterval) {
            updateInterval = setInterval(updateActivity, 30000); // Update every 30s
        }
    } else {
        startTimestamp = new Date(); // Reset to launcher uptime
        if (updateInterval) {
            clearInterval(updateInterval);
            updateInterval = null;
        }
    }
    updateActivity();
}

module.exports = {
    init,
    setGameRunning
};
