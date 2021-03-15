# Network

A single page Twitter-like social network website for making posts and following users.

This project's source code includes 2 folders, a manage.py file which manages the whole application and an sqlite database file. Below are the **main files** under those folders.

network/:
* admin.py -> manages the content of the django admin panel.
* models.py -> stores the models of the application.
* urls.py -> stores the urls under this specific application
* views.py -> A view function, or view for short, is a Python function that takes a Web request and returns a Web response.([source](https://docs.djangoproject.com/en/3.1/topics/http/views/))
* the *static* and *templates* subfolders are for HTML and CSS source files.

static/network/:
* styles.css -> the styling code of the application
* index.js -> this is the main part of the application where it requests and accepts a json data from an api and present it to the user. It also manipulates the DOM dynamically to switch views. In this application the api is django application itself.

project4/:
* contains the application configuration files like *settings.py* and *urls.py*.
