const sendMsgForm = document.getElementById("sendMsgForm");
const createGroupForm = document.getElementById("createGroupForm");
const addParticipantsForm = document.getElementById("addParticipantsForm");
const msgList = document.getElementById("msgList");
const groupList = document.getElementById("groupList");
const groupName = document.getElementById("groupName");
const openCreateGroupFormBtn = document.getElementById(
  "openCreateGroupFormBtn"
);
const cancelCreateGroupBtn = document.getElementById("cancelCreateGroupBtn");
const selectParticipantsInput = document.getElementById(
  "selectParticipantsInput"
);
const openAddParticipantFormBtn = document.getElementById(
  "openAddParticipantFormBtn"
);
const cancelAddParticipantFormBtn = document.getElementById(
  "cancelAddParticipantFormBtn"
);

const backendAPI = "http://localhost:3000/api";
const localStorageKeyForToken = "gc_user";
const localStorageKeyForUserEmail = "gc_user_email";
const localStorageKeyForMessages = "gc_messages";
const localStorageKeyForGroups = "gc_groups";
let currentGroupId = "";
let allGroups = [];
let allUsers = [];

function setAuthHeader() {
  const token =
    JSON.parse(localStorage.getItem(localStorageKeyForToken)) || null;
  if (token) axios.defaults.headers.common["authorization"] = `Bearer ${token}`;
}

function getNewMessages() {
  const msgData = JSON.parse(localStorage.getItem(localStorageKeyForMessages));
  const lastMessageId = msgData?.lastMessageId || -1;

  axios
    .get(`${backendAPI}/chat/message/new?lastMessageId=${lastMessageId}`)
    .then(({ data: { messages } }) => {
      console.log(messages);
      if (messages?.length) {
        storeNewMsgsInLocalStorage(messages);
        listAllMessages(filterMsgsByRoomId(messages, +currentGroupId));
      }
    })
    .catch((err) => {
      alert(
        err.response?.data?.message ||
          "Something went wrong while loading messages"
      );
      console.log(err);
    });
}

function getMyGroups() {
  axios
    .get(`${backendAPI}/rooms/all`)
    .then(({ data: { rooms } }) => {
      allGroups = rooms;
      storeGroupsInLocalStorage(rooms);
      listAllGroups(rooms);
    })
    .catch((err) => {
      alert(
        err.response?.data?.message ||
          "Something went wrong while loading groups"
      );
      console.log(err);
    });
}

function getUsers() {
  axios
    .get(`${backendAPI}/users/all`)
    .then(({ data: { users } }) => {
      allUsers = users;
      listParticipants(users);
    })
    .catch((err) => {
      alert(
        err.response?.data?.message ||
          "Something went wrong while loading groups"
      );
      console.log(err);
    });
}

function listAllMessages(messages) {
  const userEmail = JSON.parse(
    localStorage.getItem(localStorageKeyForUserEmail)
  );
  // msgList.innerHTML = "";

  messages?.forEach((msg) => {
    const li = document.createElement("li");
    const msgType = userEmail === msg?.user?.email ? "sent" : "received";

    li.className = `msg msg-${msgType}`;
    li.innerHTML = `<b>${
      msgType === "sent" ? "You" : msg?.user?.name?.split(" ")[0]
    }:</b> ${msg.message}`;

    msgList.appendChild(li);
  });
}

function listAllGroups() {
  groupList.innerHTML = "";

  allGroups?.forEach((group) => {
    const li = document.createElement("li");
    li.className = `group`;
    li.id = `gr-${group.id}`;
    li.innerHTML = `<h6>${group.name}</h6>`;
    groupList.appendChild(li);
  });
}

function storeNewMsgsInLocalStorage(newMessages) {
  const msgData =
    JSON.parse(localStorage.getItem(localStorageKeyForMessages)) || {};
  if (!msgData.messages) msgData.messages = {};

  newMessages?.forEach((msg) => {
    let curRoom = msgData.messages[msg.roomId];
    if (!curRoom) msgData.messages[msg.roomId] = {};
    msgData.messages[msg.roomId][msg.id] = msg;

    if (!msgData?.lastMessageId || msgData.lastMessageId < msg.id)
      msgData.lastMessageId = msg.id;
  });

  localStorage.setItem(localStorageKeyForMessages, JSON.stringify(msgData));
}

function storeGroupsInLocalStorage(groups) {
  localStorage.setItem(localStorageKeyForGroups, JSON.stringify(groups));
}

function getMessagesFromLocalStorage() {
  msgList.innerHTML = "";
  const msgData = JSON.parse(localStorage.getItem(localStorageKeyForMessages));

  if (!msgData?.messages || !Object.keys(msgData.messages)) return;
  if (!msgData?.messages[currentGroupId]) return;

  const curMsgs = msgData.messages[currentGroupId];
  const msgsAsArray = Object.keys(curMsgs)?.map((key) => curMsgs[key]);
  listAllMessages(msgsAsArray);
}

function filterMsgsByRoomId(messages, roomId) {
  const all = messages?.filter((msg) => msg.roomId === roomId);
  console.log({ roomId, all });
  return all;
}

function setCurrentGroup(groupId) {
  if (!groupId) return;
  currentGroupId = groupId;
  const curGroup = allGroups.find((grp) => grp.id === groupId);
  groupName.innerHTML = curGroup.name;
}

function loadInitialData() {
  const msgData = JSON.parse(localStorage.getItem(localStorageKeyForMessages));
  const lastMessageId = msgData?.lastMessageId || -1;

  const promise1 = axios.get(`${backendAPI}/rooms/all`);
  const promise2 = axios.get(
    `${backendAPI}/chat/message/new?lastMessageId=${lastMessageId}`
  );

  Promise.all([promise1, promise2]).then(
    ([
      {
        data: { rooms },
      },
      {
        data: { messages },
      },
    ]) => {
      console.log({ rooms, messages });
      allGroups = [...rooms];
      storeGroupsInLocalStorage(allGroups);
      listAllGroups();
      setCurrentGroup(+allGroups?.[0]?.id);

      storeNewMsgsInLocalStorage(messages);
      listAllMessages(filterMsgsByRoomId(messages, +currentGroupId));
    }
  );
}

function listParticipants(participants) {
  participants?.forEach((p) => {
    const option = document.createElement("option");
    option.value = p.id;
    option.innerHTML = `${p.name}`;
    selectParticipantsInput.appendChild(option);
  });
}

window.addEventListener("DOMContentLoaded", (e) => {
  setAuthHeader();
  allGroups = JSON.parse(localStorage.getItem(localStorageKeyForGroups)) || [];
  setCurrentGroup(+allGroups?.[0]?.id);
  getMessagesFromLocalStorage();

  loadInitialData();
  getUsers();
  setInterval(getNewMessages, 2000);
  setInterval(getMyGroups, 10000);
});

sendMsgForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  const formData = new FormData(sendMsgForm);
  let message = formData.get("message");
  if (message === "") return;
  sendMsgForm.reset();

  axios
    .post(`${backendAPI}/chat/message`, { message, roomId: currentGroupId })
    .then((res) => {
      console.log(res.data);
    })
    .catch((err) => {
      alert(err.response?.data?.message || "Something went wrong");
      console.log(err.response);
    });
});

createGroupForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  const formData = new FormData(createGroupForm);
  let name = formData.get("group-name");
  if (name === "") return;

  closeCreateGroupForm();

  axios
    .post(`${backendAPI}/rooms/create`, { name, type: "group" })
    .then(({ data: { room } }) => {
      console.log(room);
      if (room) allGroups.push(room);
      listAllGroups();
    })
    .catch((err) => {
      alert(err.response?.data?.message || "Something went wrong");
      console.log(err.response);
    });
});

addParticipantsForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  let options = selectParticipantsInput.options;
  var selected = [];
  for (var opt of options) {
    if (opt.selected) selected.push(+opt.value);
  }

  console.log(selected);
  if (selected.length === 0) return;
  closeAddParticipantsForm();

  axios
    .post(`${backendAPI}/rooms/add-participants`, {
      participants: selected,
      roomId: currentGroupId,
    })
    .then(({ data }) => {
      console.log(data);
      alert("Added participants successfully");
    })
    .catch((err) => {
      alert(err.response?.data?.message || "Something went wrong");
      console.log(err.response);
    });
});

groupList?.addEventListener("click", (e) => {
  let target = e.target;
  if (target.tagName === "H6") target = target.parentElement;
  if (target.className === "group") {
    setCurrentGroup(+target.id?.split("-")[1]);
    getMessagesFromLocalStorage();
  }
});

addParticipantsForm?.addEventListener("mousedown", (e) => {
  var el = e.target;
  if (el.tagName.toLowerCase() == "option") {
    e.preventDefault();
    el.selected = !el.selected;
    if (el.selected) el.classList.add("selected-option");
    else el.classList.remove("selected-option");
  }
});

openCreateGroupFormBtn?.addEventListener("click", (e) => {
  createGroupForm.style.display = "flex";
  openCreateGroupFormBtn.style.display = "none";
});

function closeCreateGroupForm() {
  createGroupForm.reset();
  createGroupForm.style.display = "none";
  openCreateGroupFormBtn.style.display = "block";
}

cancelCreateGroupBtn?.addEventListener("click", closeCreateGroupForm);

openAddParticipantFormBtn?.addEventListener("click", (e) => {
  addParticipantsForm.style.display = "flex";
  openAddParticipantFormBtn.style.display = "none";
});

function closeAddParticipantsForm() {
  addParticipantsForm.reset();
  let options = selectParticipantsInput.options;
  for (var opt of options) {
    opt.classList.remove("selected-option");
  }
  addParticipantsForm.style.display = "none";
  openAddParticipantFormBtn.style.display = "block";
}

cancelAddParticipantFormBtn?.addEventListener(
  "click",
  closeAddParticipantsForm
);
