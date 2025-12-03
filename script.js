// 1) SUA CONFIG DO FIREBASE AQUI
const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_PROJETO.firebaseapp.com",
  projectId: "SEU_PROJETO",
  storageBucket: "SEU_PROJETO.appspot.com",
  messagingSenderId: "123456789",
  appId: "SUA_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

let currentUser = '';
let currentChat = '';
let unsubscribeChats = null;

// ---------- REGISTRAR (CRIAR CONTA) ----------
async function registerUser() {
  const name = document.getElementById('registerName').value.trim();
  if (!name) {
    alert('Digite um nome para registrar!');
    return;
  }

  try {
    const doc = await db.collection('users').doc(name).get();
    if (doc.exists) {
      alert('Esse nome já existe, escolha outro.');
      return;
    }

    // cria conta anônima só pra ter sessão
    await auth.signInAnonymously();

    await db.collection('users').doc(name).set({
      name,
      friends: {},
      groups: [],
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    alert('Registrado com sucesso! Agora use esse nome na parte de ENTRAR.');
    document.getElementById('registerName').value = '';
    await auth.signOut();
  } catch (e) {
    alert('Erro ao registrar: ' + e.message);
  }
}

// ---------- LOGIN (ENTRAR COM NOME JÁ REGISTRADO) ----------
async function loginUser() {
  const name = document.getElementById('loginName').value.trim();
  if (!name) {
    alert('Digite seu nome de login!');
    return;
  }

  try {
    const doc = await db.collection('users').doc(name).get();
    if (!doc.exists) {
      alert('Esse nome ainda não foi registrado. Use primeiro a parte de REGISTRAR.');
      return;
    }

    await auth.signInAnonymously();
    currentUser = name;

    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('mainScreen').classList.remove('hidden');
    document.getElementById('currentUser').textContent = name;

    loadChats();
  } catch (e) {
    alert('Erro ao entrar: ' + e.message);
  }
}

// ---------- LOGOUT ----------
function logout() {
  if (unsubscribeChats) unsubscribeChats();
  auth.signOut();
  currentUser = '';
  currentChat = '';
  document.getElementById('mainScreen').classList.add('hidden');
  document.getElementById('loginScreen').classList.remove('hidden');
  document.getElementById('loginName').value = '';
}

// ---------- CARREGAR AMIGOS / GRUPOS ----------
async function loadChats() {
  const snap = await db.collection('users').doc(currentUser).get();
  const data = snap.data() || {};

  const friendsList = document.getElementById('friendsList');
  friendsList.innerHTML = '';
  Object.keys(data.friends || {}).forEach(friendId => {
    const div = document.createElement('div');
    div.className = 'chat-item';
    div.textContent = friendId;
    div.onclick = () => openChat(friendId);
    friendsList.appendChild(div);
  });

  const groupsList = document.getElementById('groupsList');
  groupsList.innerHTML = '';
  (data.groups || []).forEach(groupId => {
    const div = document.createElement('div');
    div.className = 'chat-item';
    div.textContent = '👥 ' + groupId;
    div.onclick = () => openChat(groupId);
    groupsList.appendChild(div);
  });
}

// ---------- ADICIONAR AMIGO (apenas exemplo simples) ----------
async function addFriend() {
  const friend = document.getElementById('searchFriend').value.trim();
  if (!friend || friend === currentUser) return;

  const friendDoc = await db.collection('users').doc(friend).get();
  if (!friendDoc.exists) {
    alert('Esse nome não está registrado.');
    return;
  }

  await db.collection('users').doc(currentUser).set({
    friends: { [friend]: true }
  }, { merge: true });

  await db.collection('users').doc(friend).set({
    friends: { [currentUser]: true }
  }, { merge: true });

  document.getElementById('searchFriend').value = '';
  loadChats();
}

// ---------- ABRIR CHAT ----------
function openChat(chatId) {
  currentChat = chatId;
  document.getElementById('chatHeader').textContent = chatId;

  if (unsubscribeChats) unsubscribeChats();

  const list = document.getElementById('messagesList');
  list.innerHTML = '';

  const ref = db.collection('chats').doc(chatId).collection('messages');
  unsubscribeChats = ref.orderBy('timestamp').onSnapshot(snap => {
    list.innerHTML = '';
    snap.forEach(doc => {
      const msg = doc.data();
      const div = document.createElement('div');
      div.className = 'message ' + (msg.sender === currentUser ? 'sent' : 'received');
      div.innerHTML = `<strong>${msg.sender}:</strong> ${msg.text}`;
      list.appendChild(div);
    });
    list.scrollTop = list.scrollHeight;
  });
}

// ---------- ENVIAR MENSAGEM ----------
async function sendMessage() {
  const input = document.getElementById('messageInput');
  const text = input.value.trim();
  if (!text || !currentChat) return;

  await db.collection('chats').doc(currentChat).collection('messages').add({
    sender: currentUser,
    text,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  });

  input.value = '';
}

document.getElementById('messageInput').addEventListener('keypress', e => {
  if (e.key === 'Enter') sendMessage();
});
