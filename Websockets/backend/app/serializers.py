from rest_framework import serializers
from .models import Room, Message

from django.contrib.auth.models import User
from rest_framework import serializers

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'password']

    def create(self, validated_data):
        user = User(
            username=validated_data['username']
        )
        user.set_password(validated_data['password'])
        user.save()
        return user

from rest_framework import serializers
from .models import Room

class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = ['id', 'name', 'owner', 'members']
        read_only_fields = ['owner', 'members']  # Make these fields read-only

    def create(self, validated_data):
        request = self.context.get('request')
        owner = request.user  # Get the user from the request context

        # Remove owner from validated_data to avoid conflict
        validated_data.pop('owner', None)  # This ensures 'owner' is not part of validated_data

        # Create the room instance without requiring members
        room = Room.objects.create(owner=owner, **validated_data)

        # Automatically add the owner to members
        room.members.add(owner)

        return room

class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ['id', 'room', 'user', 'content', 'timestamp']