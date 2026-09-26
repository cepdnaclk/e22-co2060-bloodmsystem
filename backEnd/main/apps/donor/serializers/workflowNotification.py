from rest_framework import serializers

from ..models.workflowNotification import WorkflowNotification


class WorkflowNotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkflowNotification
        fields = ["id", "event_type", "message", "is_read", "metadata", "created_at"]
        read_only_fields = fields


class WorkflowNotificationMarkReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkflowNotification
        fields = ["is_read"]
