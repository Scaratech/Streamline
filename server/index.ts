import { WebSocket, WebSocketServer} from 'ws';

import { config } from 'dotenv';

import { createSocket } from 'dgram';
import { createServer, createConnection } from 'net';

config();

const PORT = process.env.PORT;
const AUTH = process.env.AUTH;

if (!PORT || !AUTH) {
    console.error(`[ERROR] Double check your env file a value isnt defined`);
    process.exit(1);
}

const wss = new WebSocketServer({ 
    port: parseInt(PORT) 
});

console.log(`[INFO] Server started on ws://localhost:${PORT}`);

wss.on('connection', (ws: WebSocket) => {
    console.log('[INFO] Client connected');

    ws.on('message', (message: string) => {
        try {
            const data = JSON.parse(message);

            if (data.auth !== AUTH) {
                ws.send(JSON.stringify({ 
                    error: '[ERROR] Authentication failed' 
                }));

                ws.close();
                return;
            }

            Object.keys(data.config).forEach((opt) => {
                const { protocol, port } = data.config[opt];
                
                if (protocol === 'tcp') {
                    createTcpServer(opt, port);
                }

                if (protocol === 'udp') {
                    createUdpServer(opt, port);
                }
            });
        } catch (err) {
            console.error('[ERROR] Handling message:', err);
        }
    });

    ws.on('close', () => {
        console.log('[INFO] Client disconnected');
    });
});

function createTcpServer(clientPort: string, serverPort: string) {
    const server = createServer((socket) => {
        const proxy = createConnection(parseInt(serverPort), 'localhost', () => {
            socket.pipe(proxy);
            proxy.pipe(socket);
        });

        proxy.on('error', (err) => {
            console.error(`[ERROR] (TCP): ${err}`);
        });

        socket.on('error', (err) => {
            console.error(`[ERROR] (TCP): ${err}`);
            proxy.destroy();
        });
    });

    server.listen(parseInt(clientPort), () => {
        console.log(`[INFO] (TCP) server listening on port: ${clientPort}`);
    });
}

function createUdpServer(clientPort: string, serverPort: string) {
    const server = createSocket('udp4');

    server.on('error', (err) => {
        console.error(`[ERROR] (UDP): ${err}`);
    });

    server.on('message', (msg) => {
        const client = createSocket('udp4');

        client.send(msg, 0, msg.length, parseInt(serverPort), 'localhost', (err) => {
            if (err) {
                console.error(`[ERROR] (UDP): ${err}`);
            }

            client.close();
        });
    });

    server.bind(parseInt(clientPort), () => {
        console.log(`[INFO] (UDP) server listening on port: ${clientPort}`);
    });
}
