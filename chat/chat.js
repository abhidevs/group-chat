const sendMsgForm = document.getElementById("sendMsgForm");
const msgList = document.getElementById("msgList");

const backendAPI = "http://localhost:3000/api";
const localStorageKeyForToken = "gc_user";
const localStorageKeyForUserEmail = "gc_user_email";

function setAuthHeader() {
  const token =
    JSON.parse(localStorage.getItem(localStorageKeyForToken)) || null;
  if (token) axios.defaults.headers.common["authorization"] = `Bearer ${token}`;
}

function getAllMessages() {
  axios
    .get(`${backendAPI}/chat/message/all`)
    .then((res) => {
      console.log(res.data);
      listAllMessages(res.data.messages);
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

window.addEventListener("DOMContentLoaded", (e) => {
  setAuthHeader();
  getAllMessages();
});

sendMsgForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  const formData = new FormData(sendMsgForm);
  let message = formData.get("message");
  if (message === "") return;

  axios
    .post(`${backendAPI}/chat/message`, { message })
    .then((res) => {
      sendMsgForm.reset();
      console.log(res.data);
    })
    .catch((err) => {
      alert(err.response.data.message || "Something went wrong");
      console.log(err.response);
    });
});
