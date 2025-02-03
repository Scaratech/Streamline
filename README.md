# Streamline
A reverse proxy coded in NodeJS and Typescript.

## Server setup
### Building
```sh
$ git clone https://github.com/scaratech/streamline
$ cd streamline/server
$ pnpm i
$ pnpm build
```
### Configuration
`.env`:
```
AUTH=your_password
PORT=port_server_will_bind_to
```
### Starting
```sh
$ pnpm start
```

## Client setup
### Building
```sh
$ git clone https://github.com/scaratech/streamline
$ cd streamline/client
$ pnpm i
$ pnpm build
```
### Configuration
`.env`:
```
HOST=server_host # (Ex. ws://localhost:3000)
AUTH=server_password
CONFIG=path_to_json_config
```
JSON config:
```jsonc
{
    "server_port": { // Port on the server to proxy traffic to
        "protocol": "tcp/udp",
        "port": "" // Port on the client to proxy traffic from
    },

    // Ex. This will serve port 80 on the client to 2020 on the server
    "2020": {
        "protocol": "tcp",
        "port": "80"
    }
}
```
### Starting
```sh
$ pnpm start
```