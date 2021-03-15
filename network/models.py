from django.contrib.auth.models import AbstractUser
from django.contrib.humanize.templatetags.humanize import naturaltime, naturalday
from django.db import models

class User(AbstractUser):

    def serialize(self):
        return {
            "id": self.id,
            "username": self.username,
            "followers": [i.user.username for i in self.followers.all()],
            "following": [i.following_user.username for i in self.following.all()],
            "date_joined_natural": naturalday(self.date_joined)
        }

class Post(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="posts")
    content = models.TextField()    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user}: {self.content}"

class Comment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="comments")
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="comments")
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def serialize(self):
        return {
            "username": self.user.username,
            "content": self.comment,
            "date": naturaltime(self.created_at)
        }

    def __str__(self):
        return self.comment

class Like(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="likes")
    liked_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name="liked")
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="likes")    

    class Meta:
        unique_together = ("liked_by", "post")

    def __str__(self):
        return f"like {self.id}"

class Follow(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="following")
    following_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="followers")

    class Meta:
        unique_together = ("user", "following_user")

    def check_self_follow(self):
        if self.user.id == self.following_user.id:
            return True
        return False

    def __str__(self):
        return f"{self.user} is following {self.following_user}"