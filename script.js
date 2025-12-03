// "Banco de dados" simples usando localStorage.
// NÃO é multi-dispositivo de verdade, mas serve para escola.

let users = JSON.parse(localStorage.getItem("chat_users") || "{}");
// users = { nome: { friends: [nomes], requests: [nomes] } }

let messages = JSON.parse(localStorage.getItem("chat_messages") || "{}");
// messages = { chatId: [ { from, text, time } ] }

let currentUser = null;
let currentChatId = null;

// ----- UTIL -----
function saveUsers() {
  localStorage.setItem("chat_users", JSON.stringify(users));
}

function saveMessages() {
  localStorage.setItem("chat_messages", JSON.stringify(messages));
}

function getChatId(a, b) {
  const pair = [a, b].sort();
  return `${pair[0]}__${pair[1]}`;
}

// ----- REGISTRAR -----
function registerUser() {
  const name = document.getElementById("registerName").value.trim();
  if (!name) {
    alert("Digite um nome para registrar.");
    return;
  }
  if (users[name]) {
    alert("Esse nome já existe. Escolha outro.");
    return;
  }
  users[name] = { friends: [], requests: [] };
  saveUsers();
  alert("Registrado com sucesso! Agora entre com esse nome em 'Entrar'.");
  document.getElementById("registerName").value = "";
}

// ----- LOGIN -----
function loginUser() {
  const name = document.getElementById("loginName").value.trim();
  if (!name) {
    alert("Digite seu nome de login.");
    return;
  }
  if (!users[name]) {
    alert("Esse nome ainda não foi registrado.");
    return;
  }
  currentUser = name;
  document.getElementById("currentUser").textContent = `Logado como: ${name}`;
  document.getElementById("authScreen").classList.add("hidden");
  document.getElementById("mainScreen").classList.remove("hidden");
  document.getElementById("loginName").value = "";
  loadSidebar();
}

// ----- LOGOUT -----
function logout() {
  currentUser = null;
  currentChatId = null;
  document.getElementById("mainScreen").classList.add("hidden");
  document.getElementById("authScreen").classList.remove("hidden");
}

// ----- CARREGAR LISTAS -----
function loadSidebar() {
  if (!currentUser) return;

  const userData = users[currentUser];

  // Amigos
  const friendsList = document.getElementById("friendsList");
  friendsList.innerHTML = "";
  userData.friends.forEach(friend => {
    const item = document.createElement("div");
    item.className = "list-item";
    const span = document.createElement("span");
    span.className = "name";
    span.textContent = friend;
    item.appendChild(span);
    item.onclick = () => openChatWith(friend);
    friendsList.appendChild(item);
  });

  // Pedidos
  const requestsList = document.getElementById("requestsList");
  requestsList.innerHTML = "";
  userData.requests.forEach(fromName => {
    const item = document.createElement("div");
    item.className = "list-item";
    const span = document.createElement("span");
    span.className = "name";
    span.textContent = fromName;
    const btn = document.createElement("button");
    btn.textContent = "Aceitar";
    btn.onclick = (e) => {
      e.stopPropagation();
      acceptFriendRequest(fromName);
    };
    item.appendChild(span);
    item.appendChild(btn);
    requestsList.appendChild(item);
  });
}

// ----- PEDIDOS DE AMIZADE -----
function sendFriendRequest() {
  if (!currentUser) return;
  const friendName = document.getElementById("friendInput").value.trim();
  if (!friendName) return;
  if (friendName === currentUser) {
    alert("Você não pode adicionar você mesmo.");
    return;
  }
  if (!users[friendName]) {
    alert("Esse nome não está registrado.");
    return;
  }
  const userData = users[currentUser];
  if (userData.friends.includes(friendName)) {
    alert("Vocês já são amigos.");
    return;
  }
  const targetData = users[friendName];
  if (!targetData.requests.includes(currentUser)) {
    targetData.requests.push(currentUser);
  }
  saveUsers();
  document.getElementById("friendInput").value = "";
  alert("Pedido de amizade enviado!");
}

function acceptFriendRequest(fromName) {
  if (!currentUser) return;
  const userData = users[currentUser];
  const idx = userData.requests.indexOf(fromName);
  if (idx !== -1) {
    userData.requests.splice(idx, 1);
  }
  if (!userData.friends.includes(fromName)) {
    userData.friends.push(fromName);
  }
  if (!users[fromName].friends.includes(currentUser)) {
    users[fromName].friends.push(currentUser);
  }
  saveUsers();
  loadSidebar();
}

// ----- CHAT -----
function openChatWith(friend) {
  if (!currentUser) return;
  currentChatId = getChatId(currentUser, friend);
  document.getElementById("chatTitle").textContent = `Chat com ${friend}`;
  loadMessages();
}

function loadMessages() {
  const box = document.getElementById("messagesList");
  box.innerHTML = "";
  if (!currentChatId) return;
  const list = messages[currentChatId] || [];
  list.forEach(msg => {
    const div = document.createElement("div");
    div.className = "message " + (msg.from === currentUser ? "sent" : "received");
    const txt = document.createElement("div");
    txt.textContent = msg.text;
    const meta = document.createElement("small");
    meta.textContent = msg.from;
    div.appendChild(txt);
    div.appendChild(meta);
    box.appendChild(div);
  });
  box.scrollTop = box.scrollHeight;
}

function sendMessage() {
  if (!currentUser || !currentChatId) return;
  const input = document.getElementById("messageInput");
  const text = input.value.trim();
  if (!text) return;
  if (!messages[currentChatId]) messages[currentChatId] = [];
  messages[currentChatId].push({
    from: currentUser,
    text
  });
  saveMessages();
  input.value = "";
  loadMessages();
}

// Enter para enviar
document.addEventListener("DOMContentLoaded", () => {
  const msgInput = document.getElementById("messageInput");
  msgInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  });
});
