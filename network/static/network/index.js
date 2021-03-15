var global_user = '';
document.addEventListener('DOMContentLoaded', () => {
    if (location.href === 'http://127.0.0.1:8000/login' || location.href === 'http://127.0.0.1:8000/register')
        return;
    window.onpopstate = function (event) {
        if (event.state.url.startsWith('/all'))
            load_all_posts('/all-posts?page=', event.state.data);
        else if (event.state.url.startsWith('/following'))
            load_all_posts('/following?page=', event.state.data);
        else if (event.state.url === '/user')
            load_user(event.state.data);
        else if (event.state.url === '')
            load_follow(event.state.str, event.state.data);
    }
    load_all_posts('/all-posts?page=');
    toggle_focus(document.querySelector('#all-posts'));
    if (document.querySelector('#user') !== null) {
        global_user = document.querySelector('#user').innerHTML;
        document.querySelector('#left').style.display = 'none';
    }
    else document.querySelector('#left').style.display = 'block';
    document.addEventListener('click', event => {
        const element = event.target;
        if (element.id === "user") {
            load_user(element.innerHTML);
            toggle_focus(element);
        }
        else if (element.id === "all-posts") {
            load_all_posts('/all-posts?page=');
            toggle_focus(element);
        }
        else if (element.id === "following") {
            load_all_posts('/following?page=');
            toggle_focus(element);
        }
    });
    if (document.querySelector('#newpost') !== null)
        document.querySelector('#newpost').onsubmit = () => {
            edit_or_post('POST', document.querySelector('#txtarea').value);
            load_all_posts('/all-posts?page=');
            toggle_focus(document.querySelector('#all-posts'));
            document.querySelector('#txtarea').value = '';
            return false;
        }
});

function load_user(name) {
    history.pushState({ data: name, url: '/user' }, "", name);
    document.querySelector('#post-container').innerHTML = '';
    document.querySelector('#user-list-container').innerHTML = '';
    if (global_user != '') document.querySelector('#newpost').style.display = 'none';
    fetch(`/user/${name}`)
        .then(response => response.json())
        .then(user => add_user(user));
}

function load_all_posts(url, page_number = 1) {
    if (url.startsWith('/all'))
        history.pushState({ data: page_number, url: url }, "", 'all-post');
    else if (url.startsWith('/following'))
        history.pushState({ data: page_number, url: url }, "", 'following');
    if (document.querySelector('#user-list-container') !== null)
        document.querySelector('#user-list-container').innerHTML = '';
    if (!url.startsWith('/user-post')) {
        document.querySelector('#post-container').innerHTML = '';
        document.querySelector('#user-container').innerHTML = '';
        if (global_user != '') document.querySelector('#newpost').style.display = 'block';
    }
    fetch(`${url}${page_number}`)
        .then(response => response.json())
        .then(posts => {
            let liked;
            if (global_user != '')
                liked = posts.pop().user_liked;
            else liked = []
            let pag = posts.pop();
            posts.forEach(post => add_post(post, liked));
            paginate(pag.post_pag, url);
        });
}

function add_post(post, user_liked = []) {
    const container = document.createElement('div');
    const username = document.createElement('div');
    const content = document.createElement('div');
    const likes = document.createElement('div');
    const span = document.createElement('span');
    const btn = document.createElement('button');
    const ic = document.createElement('i');
    const comments = document.createElement('div');
    const comment = document.createElement('div');
    const comments_cont = document.createElement('div');
    const contain = document.createElement('div');
    const contain1 = document.createElement('div');
    const date_created = document.createElement('small');

    container.className = "pt-2 each-post";
    contain1.className = 'pr-3 pl-3 pb-1';
    contain.className = 'pr-3 pl-3';
    container.append(contain1);
    content.id = `content-${post.id}`;
    content.innerHTML = post.content;
    contain.append(content);
    if (global_user == post.username) {
        const edit = document.createElement('button');
        edit.innerHTML = 'Edit';
        edit.className = 'btn btn-primary btn-sm float-right ml-5';
        edit.id = `edit-${post.id}`;
        edit.onclick = () => {
            document.querySelector(`#edit-${post.id}`).disabled = true;
            const con = document.querySelector(`#content-${post.id}`);
            const save = document.createElement('button');
            const txt = document.createElement('textarea');
            txt.value = con.innerHTML;
            txt.className = 'form-control';
            con.style.display = 'none';
            contain.append(txt);
            txt.focus();
            save.innerHTML = 'Save';
            save.className = 'btn btn-primary btn-sm float-right mt-1';
            save.onclick = () => {
                con.style.display = 'block';
                con.innerHTML = txt.value;
                txt.remove();
                edit_or_post('PUT', con.innerHTML, post.id);
                save.remove();
                document.querySelector(`#edit-${post.id}`).disabled = false;
            };
            contain.append(save);
        };
        contain1.append(edit);
    }
    container.append(contain);
    if (user_liked.includes(post.id)) {
        ic.className = 'fa fa-heart';
        ic.style.color = 'red';
    }
    else ic.className = 'fa fa-heart-o';
    ic.id = `like-icon-${post.id}`;
    ic.setAttribute('aria-hidden', 'true');
    btn.className = 'btn btn-default';
    btn.appendChild(ic);
    if (global_user != '')
        btn.onclick = () => {
            fetch('/like', {
                method: 'POST',
                body: JSON.stringify({ user_id: post.user_id, post_id: post.id })
            })
            let num = document.querySelector(`#num-of-likes-${post.id}`);
            if (document.querySelector(`#like-icon-${post.id}`).className === 'fa fa-heart') {
                num.innerHTML = parseInt(num.innerHTML) - 1;
                document.querySelector(`#like-icon-${post.id}`).className = 'fa fa-heart-o';
                document.querySelector(`#like-icon-${post.id}`).style.color = 'black';
            }
            else {
                num.innerHTML = parseInt(num.innerHTML) + 1;
                document.querySelector(`#like-icon-${post.id}`).className = 'fa fa-heart';
                document.querySelector(`#like-icon-${post.id}`).style.color = 'red';
            }
        };
    username.innerHTML = post.username;
    username.id = 'user';
    contain1.append(username);
    likes.append(btn);
    span.innerHTML = post.likes;
    span.id = `num-of-likes-${post.id}`;
    likes.append(span);
    container.append(likes);
    date_created.innerHTML = post.date_created_natural;
    date_created.className = 'text-muted';
    contain1.append(date_created);
    comments.innerHTML = `${post.comments} Comments`;
    comments.className = 'pl-3';
    comments.style.backgroundColor = '#fbfbfb';
    comments.style.cursor = 'pointer';
    let open = true, first = true;
    if (global_user != '')
        comments.onclick = () => {
            if (open) {
                if (first) {
                    load_comments(post.id);
                    first = false;
                }
                else comment.style.display = 'block';
            }
            else {
                comment.style.animationPlayState = 'running';
                comment.onanimationend = () => {
                    comment.style.display = 'none';
                    comment.style.animationPlayState = 'paused';
                }
            }
            open = !open;
        };
    comments_cont.appendChild(comments);
    comments_cont.appendChild(comment);
    container.appendChild(comments_cont);
    comments_cont.id = `com-cont-${post.id}`;
    comment.id = `com-${post.id}`;
    comment.className = 'pl-2 pr-2 coms';
    container.appendChild(document.createElement('hr'));
    document.querySelector('#post-container').append(container);
}

function load_comments(id) {
    const container = document.querySelector(`#com-${id}`);
    const txt = document.createElement('textarea');
    const new_com_con = document.createElement('div');
    const post = document.createElement('button');
    container.innerHTML = '';
    fetch(`/comments/${id}`)
        .then(response => response.json())
        .then(comments => {
            comments.forEach(comment => {
                const name = document.createElement('strong');
                const date = document.createElement('small');
                const content = document.createElement('p');
                name.innerHTML = comment.username;
                name.id = 'user';
                date.innerHTML = comment.date;
                content.innerHTML = comment.content;
                date.className = 'text-muted float-right';
                container.appendChild(date);
                container.appendChild(name);
                container.appendChild(content);
                container.appendChild(document.createElement('hr'));
            });
        });
    new_com_con.append('Comment: ');
    post.className = 'btn btn-primary btn-sm';
    post.innerHTML = 'Post';
    post.onclick = () => {
        if (txt.value == '') return;
        fetch(`/comments/${id}`, {
            method: 'POST',
            body: JSON.stringify({ content: txt.value })
        });
        load_comments(id);
    };
    txt.className = 'form-control mb-1';
    new_com_con.appendChild(txt);
    new_com_con.appendChild(post);
    container.appendChild(new_com_con);
    document.querySelector(`#com-cont-${id}`).appendChild(container);
}

function add_user(user) {
    const container = document.createElement('div');
    const username = document.createElement('h3');
    const followers = document.createElement('button');
    const ul = document.createElement('div');
    const span = document.createElement('span');
    const following = document.createElement('button');
    const date_joined = document.createElement('div');
    const follow = document.createElement('button');

    document.querySelector('#user-container').innerHTML = '';
    container.className = 'row';
    username.innerHTML = user.username;
    username.style.color = 'blue';
    username.className = 'col-sm-3';
    container.append(username);
    ul.className = 'list-group list-group-horizontal-sm col-sm-6 mx-auto row';
    span.innerHTML = user.followers.length;
    span.id = `followers-${user.id}`;
    followers.innerHTML = 'Followers ';
    followers.className = 'btn btn-default border ml-1 col-sm';
    followers.append(span);
    if (global_user != '') {
        followers.onclick = () => load_follow(`${user.username}'s followers`, user.followers);
        following.onclick = () => load_follow(`${user.username} following`, user.following);
    }
    following.innerHTML = `Following ${user.following.length}`;
    following.className = 'btn btn-default border mr-1 col-sm';
    following.id = `following-${user.id}`;
    ul.appendChild(following);
    ul.appendChild(followers);
    container.appendChild(ul);
    if (user.username != global_user && global_user != '') {
        if (user.followers.includes(global_user))
            follow.innerHTML = 'Unfollow';
        else follow.innerHTML = 'Follow';
        follow.className = 'btn btn-primary col-sm-3';
        follow.id = `follow-${user.id}`;
        follow.onclick = () => {
            fetch('/follow', {
                method: 'POST',
                body: JSON.stringify({ user_id: user.id })
            })
            let num = document.querySelector(`#followers-${user.id}`);
            if (document.querySelector(`#follow-${user.id}`).innerHTML === 'Follow') {
                num.innerHTML = parseInt(num.innerHTML) + 1;
                document.querySelector(`#follow-${user.id}`).innerHTML = 'Unfollow';
            }
            else {
                num.innerHTML = parseInt(num.innerHTML) - 1;
                document.querySelector(`#follow-${user.id}`).innerHTML = 'Follow';
            }
        }
        container.append(follow);
    }
    date_joined.innerHTML = `Started on: ${user.date_joined_natural}`;
    document.querySelector('#user-container').appendChild(container);
    document.querySelector('#user-container').append(date_joined);
    load_all_posts(`/user-post/${user.id}?page=`);
}

function load_follow(str, list) {
    history.pushState({ data: list, url: '', str: str }, "", str);
    document.querySelector('#user-list-container').innerHTML = '';
    const ul = document.createElement('ul');
    const heading = document.createElement('h2');
    document.querySelector('#user-container').innerHTML = '';
    document.querySelector('#paginator').innerHTML = '';
    document.querySelector('#left').innerHTML = '';
    document.querySelector('#post-container').innerHTML = '';
    heading.innerHTML = `${str} (${list.length})`;
    document.querySelector('#user-list-container').appendChild(heading);
    ul.className = 'list-group list-group-flush';
    list.forEach(user => {
        const li = document.createElement('li');
        li.innerHTML = user;
        li.id = 'user';
        li.className = 'list-group-item';
        ul.appendChild(li);
    });
    document.querySelector('#user-list-container').appendChild(ul);
}

function paginate(pag, url) {

    document.querySelector('#paginator').innerHTML = '';
    const nav = document.createElement('nav');
    const ull = document.createElement('ul');
    const ulr = document.createElement('ul');
    const pages = document.createElement('div');
    const first_link = document.createElement('span');
    const previous_link = document.createElement('span');
    const next_link = document.createElement('span');
    const last_link = document.createElement('span');

    ulr.className = 'pagination float-right';
    ull.className = 'pagination float-left';
    nav.className = 'mt-3 font-weight-bold';
    nav.id = 'nav-pag';
    if (pag.has_next) {
        next_link.onclick = () => load_all_posts(url, pag.next_page_number);
        last_link.onclick = () => load_all_posts(url, pag.num_pages);
        next_link.innerHTML = 'next &raquo;';
        last_link.innerHTML = 'last';
        next_link.className = 'page-link';
        last_link.className = 'page-link';
        ulr.appendChild(next_link);
        ulr.appendChild(last_link);
    }
    pages.innerHTML = `Page <strong>${pag.number}</strong> of <strong>${pag.num_pages}</strong>`;
    document.querySelector('#page-number').innerHTML = '';
    document.querySelector('#page-number').appendChild(pages);
    if (pag.has_previous) {
        first_link.onclick = () => load_all_posts(url);
        previous_link.onclick = () => load_all_posts(url, pag.previous_page_number);
        first_link.innerHTML = 'first';
        previous_link.innerHTML = '&laquo; previous';
        first_link.className = 'page-link';
        previous_link.className = 'page-link';
        ull.appendChild(first_link);
        ull.appendChild(previous_link);
    }
    nav.appendChild(ull);
    nav.appendChild(ulr);
    document.querySelector('#paginator').appendChild(nav);
}

function edit_or_post(mtd, con, p_id = null) {
    fetch('/post', {
        method: mtd,
        body: JSON.stringify({ content: con, post_id: p_id })
    });
    if (mtd === 'POST')
        load_all_posts('/all-posts?page=');
}

function toggle_focus(element) {
    document.querySelector('#all-posts').style.fontWeight = 'normal';
    if (global_user != '') {
        document.querySelector('#user').style.fontWeight = 'normal';
        document.querySelector('#following').style.fontWeight = 'normal';
    }
    element.style.fontWeight = 'bold';
}