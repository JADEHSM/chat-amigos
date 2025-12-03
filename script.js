let users = JSON.parse(localStorage.getItem('users')) || {};
let currentUser = '';
let currentChat = '';
let friends = {};
let groups = {};
let messages = {};

function login() {
    const name = document.getElementById('username').value.trim();
    if (!name || users[name]) return alert('Nome já existe ou vazio!');
    currentUser = name;
    users[name] = { friends: {}, requests: {} };
    friends[name] = true;
    localStorage.setItem('users', JSON.stringify(users));
    document.getElementById('login').classList.add('hidden');
    document.getElementById('main').classList.remove('hidden');
    document.getElementById('userDisplay').textContent = name;
    updateLists();
}

function logout() {
    currentUser = '';
    document.getElementById('main').classList.add('hidden');
    document.getElementById('login').classList.remove('hidden');
    document.getElementById('username').value = '';
}

function addFriendRequest() {
    const friend = document.getElementById('addFriend').value.trim();
    if (!friend || friend === currentUser || users[friend]) return alert('Nome inválido!');
    users[currentUser].requests[friend] = true;
    alert(`Pedido enviado para ${friend}`);
    document.getElementById('addFriend').value = '';
    localStorage.setItem('users', JSON.stringify(users));
}

function acceptRequest(friend) {
    users[currentUser].friends[friend] = true;
    delete users[currentUser].requests[friend];
    delete users[friend].requests[currentUser];
    localStorage.setItem('users', JSON.stringify(users));
    updateLists();
}

function createGroup() {
    const name = prompt('Nome do grupo:');
    if (name) {
        groups[name] = Object.keys(users[currentUser].friends);
        updateLists();
    }
}

function updateLists() {
    const friendsList = document.getElementById('friendsList');
    friendsList.innerHTML = '';
    Object.keys(users[currentUser]?.friends || {}).forEach(friend => {
        const div = document.createElement('div');
        div.className = 'friend';
        div.textContent = friend;
        div.onclick = () => openChat(friend);
        friendsList.appendChild(div);
    });
    
    const requestsList = document.getElementById('friendsList');
    Object.keys(users[currentUser]?.requests || {}).forEach(req => {
        const div = document.createElement('div');
        div.textContent = `${req} (pedido)`;
        const acceptBtn = document.createElement('button');
        acceptBtn.textContent = 'Aceitar';
        acceptBtn.onclick = () => acceptRequest(req);
        div.appendChild(acceptBtn);
        friendsList.appendChild(div);
    });
    
    const groupsList = document.getElementById('groupsList');
    groupsList.innerHTML = '';
    Object.keys(groups).forEach(group => {
        const div = document.createElement('div');
        div.className = 'group';
        div.textContent = group;
        div.onclick = () => openChat(group);
        groupsList.appendChild(div);
    });
}

function openChat(target) {
    currentChat = target;
    document.getElementById('chatHeader').textContent = target;
    const msgs = document.getElementById('messages');
    msgs.innerHTML = messages[currentChat] ? messages[currentChat].map(m => `<div>${m}</div>`).join('') : '';
}

function sendMessage() {
    const msg = document.getElementById('messageInput').value.trim();
    if (!msg || !currentChat) return;
    if (!messages[currentChat]) messages[currentChat] = [];
    messages[currentChat].push(`${currentUser}: ${msg}`);
    document.getElementById('messageInput').value = '';
    openChat(currentChat); // Atualiza chat
    localStorage.setItem('messages', JSON.stringify(messages));
}

document.getElementById('messageInput').addEventListener('keypress', e => {
    if (e.key === 'Enter') sendMessage();
});
