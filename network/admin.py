from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import User, Follow, Like, Post, Comment

# Register your models here.
admin.site.register(User, UserAdmin)
admin.site.register(Follow)
admin.site.register(Like)
admin.site.register(Post)
admin.site.register(Comment)