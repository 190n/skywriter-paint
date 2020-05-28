import asyncio
import json
import time

import skywriter
import websockets

MAX_INTERVAL_S = 0.05

clients = set()
last_timestamp = 0

def move_handler(x, y, z):
    global last_timestamp
    now = time.time()
    if now - last_timestamp < MAX_INTERVAL_S:
        return

    last_timestamp = now

    if clients:
        message = json.dumps({ 'x': x, 'y': y, 'z': z })
        print(message)
        asyncio.run(asyncio.wait([websocket.send(message) for websocket in clients]))

async def position_server(websocket, path):
    clients.add(websocket)
    try:
        async for message in websocket:
            await websocket.send(message)
    finally:
        clients.remove(websocket)

skywriter.move()(move_handler)

start_server = websockets.serve(position_server, '0.0.0.0', 8000)
asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
