import WebSocket from 'ws';

import { readFileSync } from 'node:fs';
import * as dotenv from 'dotenv';

import { createSocket } from 'node:dgram';
import { createServer, createConnection } from 'net';

dotenv.config();

const HOST = process.env.HOST;
const AUTH = process.env.AUTH;
const CONFIG = process.env.CONFIG;

if (!CONFIG || !HOST || !AUTH) {
    console.error('[ERROR] Double check your env file a value isnt defined');
    process.exit(1);
}

let config;

try {
    config = JSON.parse(readFileSync(CONFIG, 'utf-8'));
} catch (err) {
    console.error('[ERROR] Reading/parsing CONFIG resulted in:', err);
    process.exit(1);
}

const ws = new WebSocket(HOST);

ws.on('open', () => {
    console.log('[INFO] Connected to server');

    const msg = {
        auth: AUTH,
        config: config,
    };

    ws.send(JSON.stringify(msg));
});

ws.on('message', (data: string) => {
    const res = JSON.parse(data);

    if (res.error) {
        console.log('[ERROR] ', res.error);
    }
});

ws.on('close', () => {
    console.log('[INFO] Disconnected from server');
});

function forwardTraffic(port: string, protocol: string) {
    if (protocol === 'tcp') {
        createServer((socket: any) => {
            const proxy = createConnection({ port: parseInt(port), host: 'localhost' }, () => {
                socket.pipe(proxy);
                proxy.pipe(socket);
            });

            socket.on('error', (err: any) => {
                console.error(`[ERROR] on (TCP) socket: ${err}`);
                proxy.destroy();
            });

            proxy.on('error', (err: any) => {
                console.error(`[ERROR] on (TCP) connection: ${err}`);
                socket.destroy();
            });
        });

        console.log(`[INFO] Forwarding (TCP) traffic to ${port}`);
    }

    if (protocol === 'udp') {
        const server = createSocket('udp4');

        server.on('message', (msg: any) => {
            const server = createSocket('udp4');

            server.send(msg, 0, msg.length, parseInt(port), 'localhost', (err: any) => {
                if (err) {
                    console.error(`[ERROR] (UDP): ${err}`);
                }

                server.close();
            });
        });

        console.log(`Forwarding UDP traffic to ${port}`);
    }
}

Object.keys(config).forEach((opt) => {
    const { protocol, port } = config[opt];
    forwardTraffic(port, protocol);
});
