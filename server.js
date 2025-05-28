// Websocket server server.js
const WebSocket = require('ws');
const http = require('http');
const url = require('url'); // Für das Parsen der URL bei HTTP-Requests

const PORT = 8080;
const WS_PATH = '/ws'; // Dein bestehender WebSocket-Pfad
const HTTP_SEND_PATH = '/sendmessage'; // Neuer HTTP-Pfad für n8n

const wss = new WebSocket.Server({ noServer: true });
const clients = new Map(); // Speichert: wsSocket -> connectionId
const connections = new Map(); // Speichert: connectionId -> wsSocket (für schnellen Zugriff)
let connectionCounter = 0;

const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);

    // HTTP Route für n8n, um Nachrichten an Clients zu senden
    if (req.method === 'POST' && parsedUrl.pathname === HTTP_SEND_PATH) {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const { targetConnectionId, messagePayload } = JSON.parse(body);
                if (targetConnectionId && messagePayload) {
                    const targetSocket = connections.get(targetConnectionId);
                    if (targetSocket && targetSocket.readyState === WebSocket.OPEN) {
                        targetSocket.send(JSON.stringify(messagePayload));
                        console.log(`Sent message via HTTP to ${targetConnectionId}:`, messagePayload);
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ status: 'success', message: 'Message sent' }));
                    } else {
                        console.log(`Failed to send message: Socket not found or not open for ${targetConnectionId}`);
                        res.writeHead(404, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ status: 'error', message: 'Client not found or connection not open' }));
                    }
                } else {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ status: 'error', message: 'Missing targetConnectionId or messagePayload' }));
                }
            } catch (e) {
                console.error('Error processing /sendmessage request:', e);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'error', message: 'Internal server error' }));
            }
        });
    } else if (parsedUrl.pathname !== WS_PATH) { // Normale HTTP-Antwort für andere Pfade
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('WebSocket server (in Docker) is running. Connect via ws protocol. Use /sendmessage to push via HTTP.\n');
    }
    // WebSocket Upgrade wird separat behandelt
});

server.on('upgrade', (request, socket, head) => {
    // Client-ID aus Query-Parameter lesen
    const parsedUrl = url.parse(request.url, true);
    const clientId = parsedUrl.query && parsedUrl.query.clientId;
    request.clientId = clientId; // Für späteren Zugriff
    if (parsedUrl.pathname === WS_PATH) {
        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request);
        });
    } else {
        console.log(`[WS] Rejected upgrade attempt to ${request.url}. Only ${WS_PATH} is allowed.`);
        socket.destroy();
    }
});

wss.on('connection', (ws, req) => {
    // Persistente Connection-ID: clientId aus Query oder neue generieren
    let connectionId = req.clientId;
    if (!connectionId) {
        connectionId = `docker-client-${++connectionCounter}`;
    }
    clients.set(ws, connectionId);
    connections.set(connectionId, ws); // Wichtig für den Zugriff über ID
    ws.isAlive = true; // Für Ping/Pong

    const clientIp = req.socket.remoteAddress;
    console.log(`[WS] Client [${connectionId}] connected from IP: ${clientIp}`);
    ws.send(JSON.stringify({
        type: 'welcome',
        message: 'Welcome to the Dockerized WebSocket Test Server!',
        connectionId: connectionId
    }));

    ws.on('message', (message) => {
        const receivedMessage = message.toString();
        console.log(`[WS] Received message from [${connectionId}]: ${receivedMessage}`);
        
        try {
            const parsedMessage = JSON.parse(receivedMessage);
            if (parsedMessage.type === 'ping' || receivedMessage === 'ping') {
                // Client hat einen Ping gesendet, als Aktivitätszeichen werten
                ws.isAlive = true; 
                // Antworte mit einfachem 'pong' (plain text, wie vom Client erwartet)
                ws.send('pong');
                return;
            }
        } catch (e) {
            // Nicht-JSON-Nachricht oder Nachricht ohne Typ, normal behandeln
            if (receivedMessage === 'ping') {
                ws.isAlive = true;
                ws.send('pong');
                return;
            }
        }

        ws.send(JSON.stringify({
            type: 'echo',
            originalMessage: receivedMessage,
            response: `Server (Docker) received your message: "${receivedMessage}"`
        }));
    });

    ws.on('close', () => {
        console.log(`[WS] Client [${connectionId}] disconnected.`);
        clients.delete(ws);
        connections.delete(connectionId); // Aufräumen
    });

    ws.on('error', (error) => {
        console.error(`[WS] Error from client [${connectionId}]:`, error);
    });

    ws.on('pong', () => {
        ws.isAlive = true;
    });
});

const interval = setInterval(function ping() {
    wss.clients.forEach(function each(ws) {
        const connectionId = clients.get(ws); // Holen der Connection ID für Logging
        if (ws.isAlive === false) {
            console.log(`[WS] Terminating inactive connection for client [${connectionId || 'unknown'}]`);
            return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping(() => {}); // Sendet einen WebSocket-Protokoll-Ping
        // console.log(`[WS] Sent ping to client [${connectionId || 'unknown'}]`);
    });
}, 30000); // Alle 30 Sekunden

wss.on('close', function close() {
    clearInterval(interval);
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Dockerized HTTP & WebSocket Server started on port ${PORT}`);
    console.log(`WebSocket available at ws://<host_ip>:${PORT}${WS_PATH}`);
    console.log(`HTTP endpoint for sending messages: http://<host_ip>:${PORT}${HTTP_SEND_PATH}`);
});

// Testfunktion: Sende Testdaten an den Client über WebSocket (für n8n-Agent-Simulation)
function sendTestSocketInput(connectionId) {
    const ws = connections.get(connectionId);
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        console.log(`[Test] Keine offene Verbindung für ${connectionId}`);
        return;
    }
    // 1. Test-Message
    ws.send(JSON.stringify({
        type: 'final_answer',
        text: 'Dies ist eine Testnachricht vom Server.'
    }));
    // 2. Test-Suggestion
    ws.send(JSON.stringify({
        type: 'suggestion',
        suggestion: 'Hier ist ein Vorschlag für deine nächste Aktion.'
    }));
    // 3. Zwei Test-Karten für die Spalte "Material"
    ws.send(JSON.stringify({
        type: 'cards',
        column: 'Material',
        cards: [
            {
                title: 'Testkarte 1',
                content: 'Dies ist der Inhalt der ersten Testkarte.'
            },
            {
                title: 'Testkarte 2',
                content: 'Dies ist der Inhalt der zweiten Testkarte.'
            }
        ]
    }));
    console.log(`[Test] Testdaten an ${connectionId} gesendet.`);
}

// Beispiel: Testaufruf über HTTP (z.B. GET /testinput?connectionId=...)
server.on('request', (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    if (parsedUrl.pathname === '/testinput' && req.method === 'GET') {
        const connectionId = parsedUrl.query.connectionId;
        if (connectionId) {
            sendTestSocketInput(connectionId);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'ok', message: 'Testdaten gesendet.' }));
        } else {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'error', message: 'connectionId fehlt.' }));
        }
    }
    // ...existing code...
});