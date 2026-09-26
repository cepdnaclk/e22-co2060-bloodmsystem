from rest_framework.generics import ListAPIView, UpdateAPIView
from rest_framework.permissions import IsAuthenticated

from ..models.workflowNotification import WorkflowNotification
from ..serializers.workflowNotification import (
    WorkflowNotificationMarkReadSerializer,
    WorkflowNotificationSerializer,
)


class WorkflowNotificationListView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = WorkflowNotificationSerializer

    def get_queryset(self):
        qs = WorkflowNotification.objects.filter(user=self.request.user)
        unread = self.request.query_params.get("unread")
        if unread and unread.lower() == "true":
            qs = qs.filter(is_read=False)
        return qs


class WorkflowNotificationMarkReadView(UpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = WorkflowNotificationMarkReadSerializer

    def get_queryset(self):
        return WorkflowNotification.objects.filter(user=self.request.user)
