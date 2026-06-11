# nodes-connector React Native demo

Expo demo for the `nodes-connector/react-native` entrypoint.

## Run

From this folder:

```bash
npm install
npx expo start --host lan --port 8082
```

Open the project with Expo Go using the QR code from the terminal.

If port `8081` is busy, keep using `8082`.

## Gestures

- Drag the background to pan.
- Long press the background to add a node.
- Long press a node to start a connection.
- Tap another node to finish the connection.
- Use `+`, `-`, and `reset` to control zoom.
