import json
from channels.generic.websocket import AsyncWebsocketConsumer

# Store active users and game states
active_users_by_room = {}
game_states = {}  # Stores player assignments and game status

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f'chat_{self.room_name}'

        user = self.scope['user']
        self.username = user.username if user.is_authenticated else 'Anonymous'

        # Add user to active users list
        if self.room_group_name not in active_users_by_room:
            active_users_by_room[self.room_group_name] = set()

        active_users_by_room[self.room_group_name].add(self.username)

        # Ensure room state exists
        if self.room_group_name not in game_states:
            game_states[self.room_group_name] = {
                "players": [],
                "started": False
            }

        if len(game_states[self.room_group_name]["players"]) < 2:
            game_states[self.room_group_name]["players"].append(self.username)

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        print(self.username, "connected to", self.room_group_name)
        await self.accept()

        # Notify all clients about the updated user list
        await self.update_user_list()

    async def disconnect(self, close_code):
        # Remove user from active users list
        if self.room_group_name in active_users_by_room:
            active_users_by_room[self.room_group_name].discard(self.username)
            if not active_users_by_room[self.room_group_name]:  
                del active_users_by_room[self.room_group_name]  

        # Remove from game state
        if self.room_group_name in game_states:
            game_states[self.room_group_name]["players"].remove(self.username)
            if not game_states[self.room_group_name]["players"]:
                del game_states[self.room_group_name]

        # Leave room group
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

        # Notify all clients about the updated user list
        await self.update_user_list()

    async def receive(self, text_data):
        """Handles incoming messages and determines their type."""
        text_data_json = json.loads(text_data)
        print("Received message:", text_data_json)

        message_type = text_data_json.get("type")

        if message_type == "chat_message":
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "chat_message",
                    "message": text_data_json["message"],
                    "user": self.username
                }
            )
        if message_type == "start_game":
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "start_game",
                    "user": self.username,
                    "message": text_data_json["message"]
                }
            )
        if message_type == "move":
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "move",
                    "user": self.username,
                    "message": text_data_json["message"]
                }
            )

    async def chat_message(self, event):
        """Handles and sends chat messages to the frontend."""
        await self.send(text_data=json.dumps({
            "type": "chat_message",
            "message": event["message"],
            "user": event["user"],
        }))

    async def update_user_list(self):
        """Notify all clients about the updated user list."""
        user_list = list(active_users_by_room.get(self.room_group_name, []))

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "user_list_update",
                "users": user_list
            }
        )

    async def user_list_update(self, event):
        """Send the updated user list to the client."""
        await self.send(text_data=json.dumps({
            "type": "user_list",
            "users": event["users"],
            "count": len(event["users"])
        }))

    async def start_game(self, event):
        """Start the game and send the updated game state to the client."""
        await self.send(text_data=json.dumps({
            "type": "start_game",
            "user": event["user"],
            "message": event["message"]
        }))
    
    async def move(self, event):
        """Send the updated game state to the client."""
        await self.send(text_data=json.dumps({
            "type": "move",
            "user": event["user"],
            "message": event["message"]
        }))