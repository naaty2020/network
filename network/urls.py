from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
    path("post", views.editOrPost, name="post"),
    path("all-posts", views.allPosts, name="allposts"),
    path("following", views.followingPosts, name="followingposts"),
    path("user/<str:name>", views.profile, name="profile"),
    path("user-post/<int:id>", views.userPosts, name="userposts"),
    path("comments/<int:id>", views.comments, name="comments"),
    path("follow", views.follow, name="follow"),
    path("like", views.like, name="like")
]
