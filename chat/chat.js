const sendMsgForm = document.getElementById("sendMsgForm");
const msgList = document.getElementById("msgList");

const backendAPI = "http://localhost:3000/api";
const localStorageKeyForToken = "gc_user";
const localStorageKeyForUserEmail = "gc_user_email";
const localStorageKeyForMessages = "gc_messages";

function setAuthHeader() {
  const token =
    JSON.parse(localStorage.getItem(localStorageKeyForToken)) || null;
  if (token) axios.defaults.headers.common["authorization"] = `Bearer ${token}`;
}

function getAllMessages() {
  const savedMsgs = JSON.parse(
    localStorage.getItem(localStorageKeyForMessages)
  );
  const lastMessageId = savedMsgs?.length ? savedMsgs?.at(-1)?.id : -1;

  axios
    .get(`${backendAPI}/chat/message/new?lastMessageId=${lastMessageId}`)
    .then(({ data: { messages } }) => {
      console.log(messages);
      storeNewMsgsInLocalStorage(messages);
      listAllMessages(messages);
    })
    .catch((err) => {
      alert(
        err.response.data.message ||
          "Something went wrong while loading messages"
      );
      console.log(err.response);
    });
}

function listAllMessages(messages) {
  const userEmail = JSON.parse(
    localStorage.getItem(localStorageKeyForUserEmail)
  );
  // msgList.innerHTML = "";

  messages.forEach((msg) => {
    const li = document.createElement("li");
    const msgType = userEmail === msg?.user?.email ? "sent" : "received";

    li.className = `msg msg-${msgType}`;
    li.innerHTML = `<b>${
      msgType === "sent" ? "You" : msg?.user?.name?.split(" ")[0]
    }:</b> ${msg.message}`;

    msgList.appendChild(li);
  });
}

function storeNewMsgsInLocalStorage(newMessages) {
  const oldMsgs =
    JSON.parse(localStorage.getItem(localStorageKeyForMessages)) || [];
  const allMsgs = [...oldMsgs, ...newMessages];
  localStorage.setItem(localStorageKeyForMessages, JSON.stringify(allMsgs));
}

window.addEventListener("DOMContentLoaded", (e) => {
  setAuthHeader();
  const savedMsgs = JSON.parse(
    localStorage.getItem(localStorageKeyForMessages)
  );
  listAllMessages(savedMsgs);
  setInterval(getAllMessages, 1000);
});

sendMsgForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  const formData = new FormData(sendMsgForm);
  let message = formData.get("message");
  if (message === "") return;
  sendMsgForm.reset();

  axios
    .post(`${backendAPI}/chat/message`, { message })
    .then((res) => {
      console.log(res.data);
    })
    .catch((err) => {
      alert(err.response.data.message || "Something went wrong");
      console.log(err.response);
    });
});
