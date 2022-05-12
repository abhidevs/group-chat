const sendMsgForm = document.getElementById("sendMsgForm");
const createGroupForm = document.getElementById("createGroupForm");
const addParticipantsForm = document.getElementById("addParticipantsForm");
const addAdminForm = document.getElementById("addAdminForm");
const removeParticipantForm = document.getElementById("removeParticipantForm");
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
const selectAdminInput = document.getElementById("selectAdminInput");
const selectRemoveParticipantInput = document.getElementById(
  "selectRemoveParticipantInput"
);
const openAddParticipantFormBtn = document.getElementById(
  "openAddParticipantFormBtn"
);
const cancelAddParticipantFormBtn = document.getElementById(
  "cancelAddParticipantFormBtn"
);
const openAddAdminFormBtn = document.getElementById("openAddAdminFormBtn");
const cancelAddAdminFormBtn = document.getElementById("cancelAddAdminFormBtn");
const openRemoveParticipantFormBtn = document.getElementById(
  "openRemoveParticipantFormBtn"
);
const cancelRemoveParticipantFormBtn = document.getElementById(
  "cancelRemoveParticipantFormBtn"
);
const uploadFile = document.getElementById("uploadFile");
const fileInput = document.getElementById("fileInput");
const searchInputType = document.getElementById("searchInputType");
const searchUserInput = document.getElementById("searchUserInput");
const searchParticipantsBtn = document.getElementById("searchParticipantsBtn");
const adminControls = document.getElementById("adminControls");

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
      // console.log(messages);
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
      if (allGroups.length > rooms.length) {
        allGroups = rooms;
        setCurrentGroup(allGroups[0]?.id);
        getMessagesFromLocalStorage();
      } else {
        allGroups = rooms;
      }

      storeGroupsInLocalStorage(rooms);
      listAllGroups(rooms);
      initiateAdminControls();
    })
    .catch((err) => {
      alert(
        err.response?.data?.message ||
          "Something went wrong while loading groups"
      );
      console.log(err);
    });
}

function getParticipants() {
  axios
    .get(`${backendAPI}/rooms/participants?roomId=${currentGroupId}`)
    .then(({ data: { participants } }) => {
      // console.log(participants);
      listParticipants(participants, selectAdminInput);
      listParticipants(participants, selectRemoveParticipantInput);
    })
    .catch((err) => {
      alert(
        err.response?.data?.message ||
          "Something went wrong, can't fetch participants"
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
    }:</b> `;
    const media = msg.media;

    if (media) {
      li.className += ` msg-media`;
      if (media.type === "image") {
        li.innerHTML += `<div class="msg-media-wrapper" ><img src="${media.url}" /></div>`;
      } else if (media.type === "video") {
        li.innerHTML += `<div class="msg-media-wrapper" ><video src="${media.url}" autoplay controls /></div>`;
      }
    } else {
      li.innerHTML += `${msg.message}`;
    }

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
  // console.log({ roomId, all });
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
      setCurrentGroup(+allGroups[0]?.id);
      initiateAdminControls();

      storeNewMsgsInLocalStorage(messages);
      listAllMessages(filterMsgsByRoomId(messages, +currentGroupId));
    }
  );
}

function listParticipants(participants, element) {
  element.innerHTML = "";
  participants?.forEach((p) => {
    const option = document.createElement("option");
    option.value = p.id;
    option.innerHTML = `${p.name}`;
    element.appendChild(option);
  });
}

window.addEventListener("DOMContentLoaded", (e) => {
  setAuthHeader();
  allGroups = JSON.parse(localStorage.getItem(localStorageKeyForGroups)) || [];
  setCurrentGroup(+allGroups[0]?.id);
  getMessagesFromLocalStorage();

  loadInitialData();
  // setInterval(getNewMessages, 2000);
  // setInterval(getMyGroups, 10000);
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

searchInputType?.addEventListener("change", (e) => {
  searchUserInput.type = searchInputType.value;
});

searchParticipantsBtn?.addEventListener("click", (e) => {
  const formData = new FormData(addParticipantsForm);
  let searchBy = formData.get("search-input-type");
  let searchQuery = formData.get("search-user");

  let url = `${backendAPI}/users/search`;

  if (searchBy === "text") url += `?name=${searchQuery}`;
  else if (searchBy === "email") url += `?email=${searchQuery}`;
  else url += `?phone=${searchQuery}`;

  axios
    .get(url)
    .then(({ data: { users } }) => {
      console.log(users);
      allUsers = users;
      listParticipants(users, selectParticipantsInput);
    })
    .catch((err) => {
      alert("Something went wrong");
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

  if (selected.length === 0) return;

  axios
    .post(`${backendAPI}/rooms/participants`, {
      participants: selected,
      roomId: currentGroupId,
    })
    .then(({ data }) => {
      console.log(data);
      alert("Added participants successfully");
      getParticipants();
    })
    .catch((err) => {
      alert(err.response?.data?.message || "Something went wrong");
      console.log(err.response);
    });

  closeAddParticipantsForm();
});

addAdminForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  const selected = selectAdminInput.value;

  axios
    .post(`${backendAPI}/rooms/add-admin`, {
      roomId: currentGroupId,
      userId: selected,
    })
    .then(({ data }) => {
      console.log(data);
      alert("Added admin successfully");
      getParticipants();
    })
    .catch((err) => {
      alert(
        err.response?.data?.message || "Something went wrong while adding admin"
      );
      console.log(err.response);
    });

  closeAddAdminForm();
});

removeParticipantForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  const selected = selectRemoveParticipantInput.value;

  axios
    .delete(
      `${backendAPI}/rooms/participants?roomId=${currentGroupId}&userId=${selected}`
    )
    .then(({ data }) => {
      console.log(data);
      alert("removed participant successfully");
      getParticipants();
    })
    .catch((err) => {
      alert(
        err.response?.data?.message ||
          "Something went wrong while removing participant"
      );
      console.log(err.response);
    });

  closeRemoveParticipantForm();
});

fileInput?.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  let formData = new FormData(uploadFile);
  formData.append("roomId", currentGroupId);

  axios
    .post(`${backendAPI}/chat/media`, formData)
    .then((res) => {
      console.log(res.data);
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
    closeAddParticipantsForm();
    closeAddAdminForm();
    closeRemoveParticipantForm();
    setCurrentGroup(+target.id?.split("-")[1]);
    getMessagesFromLocalStorage();
    initiateAdminControls();
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
  adminControls.style.display = "none";
  groupName.style.display = "none";
});

function closeAddParticipantsForm() {
  addParticipantsForm.reset();
  let options = selectParticipantsInput.options;
  for (var opt of options) {
    opt.classList.remove("selected-option");
  }
  searchUserInput.type = "text";
  selectParticipantsInput.innerHTML = "";
  addParticipantsForm.style.display = "none";
  groupName.style.display = "block";
  adminControls.style.display = "flex";
}

cancelAddParticipantFormBtn?.addEventListener(
  "click",
  closeAddParticipantsForm
);

openAddAdminFormBtn?.addEventListener("click", (e) => {
  addAdminForm.style.display = "flex";
  adminControls.style.display = "none";
  groupName.style.display = "none";
});

function closeAddAdminForm() {
  addAdminForm.reset();
  addAdminForm.style.display = "none";
  groupName.style.display = "block";
  adminControls.style.display = "flex";
}

cancelAddAdminFormBtn?.addEventListener("click", closeAddAdminForm);

openRemoveParticipantFormBtn?.addEventListener("click", (e) => {
  removeParticipantForm.style.display = "flex";
  adminControls.style.display = "none";
  groupName.style.display = "none";
});

function closeRemoveParticipantForm() {
  removeParticipantForm.reset();
  removeParticipantForm.style.display = "none";
  groupName.style.display = "block";
  adminControls.style.display = "flex";
}

cancelRemoveParticipantFormBtn?.addEventListener(
  "click",
  closeRemoveParticipantForm
);

function initiateAdminControls() {
  const curGroup = allGroups.filter((grp) => grp.id == currentGroupId)[0];
  if (curGroup?.participant?.isAdmin) {
    if (
      addParticipantsForm.style.display !== "flex" &&
      addAdminForm.style.display !== "flex" &&
      removeParticipantForm.style.display !== "flex"
    ) {
      adminControls.style.display = "flex";
      getParticipants();
    }
  } else adminControls.style.display = "none";
}
