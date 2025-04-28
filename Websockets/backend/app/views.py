from rest_framework import generics, permissions
from .models import Room, Message
from .serializers import RoomSerializer, MessageSerializer, UserRegistrationSerializer

class UserRegistrationAPI(generics.CreateAPIView):
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]

class RoomCreateAPI(generics.CreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    queryset = Room.objects.all()
    serializer_class = RoomSerializer

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

class RoomJoinAPI(generics.UpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    queryset = Room.objects.all()
    serializer_class = RoomSerializer

    def perform_update(self, serializer):
        room = self.get_object()
        room.members.add(self.request.user)
        room.save()

class MessageCreateAPI(generics.CreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    queryset = Message.objects.all()
    serializer_class = MessageSerializer

class MessageListAPI(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        room_id = self.kwargs['room_id']
        return Message.objects.filter(room__id=room_id)