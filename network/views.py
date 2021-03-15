import json

from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.core import serializers
from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, HttpResponseBadRequest, JsonResponse
from django.shortcuts import render
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required

from .models import *


def index(request):
    return render(request, "network/index.html")


def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")

def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("login"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")

@csrf_exempt
def editOrPost(request):
    if request.method == "POST":
        data = json.loads(request.body)
        try:
            post = Post(user=request.user, content=data.get("content"))
            post.save()
        except:
            return JsonResponse({"error": "Something went wrong!"}, status=400)
        return JsonResponse({"message": "Successful"}, status=200)
    elif request.method == "PUT":
        data = json.loads(request.body)
        try:
            p = Post.objects.get(pk=int(data.get("post_id")))
            p.content = data.get("content")
            p.save()
        except:
            return JsonResponse({"error": "Something went wrong!"}, status=400)
        return JsonResponse({"message": "Successful"}, status=200)
    else:
        return JsonResponse({"error": "POST or PUT request required."}, status=400)

def allPosts(request):
    if request.method != "GET":
        return JsonResponse({"error": "GET request required."}, status=400)
    
    posts = Post.objects.all()
    page = request.GET.get('page')
    ret = paginate(posts, page)
    if request.user.is_authenticated:
        post_ids = [tmp.post.id for tmp in request.user.liked.all()]
        ret.append({"user_liked": post_ids})    
    return JsonResponse(ret, safe=False)

def userPosts(request, id):
    if request.method != "GET":
        return JsonResponse({"error": "GET request required."}, status=400)
    
    posts = User.objects.get(pk=id).posts.all()
    page = request.GET.get('page')
    ret = paginate(posts, page)
    if request.user.is_authenticated:
        post_ids = [tmp.post.id for tmp in request.user.liked.all()]
        ret.append({"user_liked": post_ids})
    return JsonResponse(ret, safe=False)

def profile(request, name):
    if request.method != "GET":
        return JsonResponse({"error": "GET request required."}, status=400)
    return JsonResponse(User.objects.get(username=name).serialize(), safe=False)

@login_required
@csrf_exempt
def comments(request, id):
    if request.method == "GET":
        post = Post.objects.get(pk=id)
        comments = Comment.objects.filter(post=post)
        return JsonResponse([comment.serialize() for comment in comments], safe=False)
    elif request.method == "POST":
        data = json.loads(request.body)        
        comment = Comment(user=request.user, post=Post.objects.get(pk=id), comment=data.get("content"))
        comment.save()
        return JsonResponse({"message": "Successful"}, status=200)
    else:
        return JsonResponse({"error": "GET or POST request required."}, status=400)

@login_required
def followingPosts(request):
    if request.method != "GET":
        return JsonResponse({"error": "GET request required."}, status=400)

    temp = request.user.following.all()
    followings = [i.following_user for i in temp]
    posts = Post.objects.filter(user__in=followings)
    page = request.GET.get('page')
    ret = paginate(posts, page)
    if request.user.is_authenticated:
        post_ids = [tmp.post.id for tmp in request.user.liked.all()]
        ret.append({"user_liked": post_ids})    
    return JsonResponse(ret, safe=False)
    
@csrf_exempt
def follow(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST request required."}, status=400)

    data = json.loads(request.body)    
    following = User.objects.get(pk=data.get("user_id"))
    try:
        follow = Follow(user=request.user, following_user=following)
        if follow.check_self_follow():
            return JsonResponse({"error": "You are following yoursef."}, status=400)
        follow.save()
    except IntegrityError:
        Follow.objects.get(user=request.user, following_user=following).delete()
    finally:        
        return JsonResponse({"message": "Successful"}, status=200)

@csrf_exempt
def like(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST request required."}, status=400)

    data = json.loads(request.body)
    owner = User.objects.get(pk=data.get("user_id"))
    posted = Post.objects.get(pk=data.get("post_id"))
    try:
        like = Like(user=owner, liked_by=request.user, post=posted)
        like.save()
    except IntegrityError:
        Like.objects.get(liked_by=request.user, post=posted).delete()
    finally:
        return JsonResponse({"message": "Successful"}, status=200)

def paginate(posts, page):
    paginator = Paginator(posts, 10)
    ret = []
    try:
        post = paginator.page(page)
    except PageNotAnInteger:
        post = paginator.page(1)
    except EmptyPage:
        post = paginator.page(paginator.num_pages)
    ret = [serialize(p) for p in post]
    ser_paginator = {"has_previous": post.has_previous(),
                     "previous_page_number": post.previous_page_number() if post.has_previous() else None,
                     "number": post.number,
                     "num_pages": post.paginator.num_pages,
                     "has_next": post.has_next(),
                     "next_page_number": post.next_page_number() if post.has_next() else None,
                     }
    ret.append({"post_pag": ser_paginator})
    return ret

def serialize(posts):
    return {
        "id": posts.id,
        "user_id": posts.user.id,
        "username": posts.user.username,
        "content": posts.content,
        "likes": posts.likes.count(),
        "comments": posts.comments.count(),
        "date_created_natural": naturaltime(posts.created_at)
    }