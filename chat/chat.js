const sendMsgForm = document.getElementById("sendMsgForm");

const backendAPI = "http://localhost:3000/api";
const localStorageKey = "gc_user";

function setAuthHeader() {
  const token = JSON.parse(localStorage.getItem(localStorageKey)) || null;
  if (token) axios.defaults.headers.common["authorization"] = `Bearer ${token}`;
}

window.addEventListener("DOMContentLoaded", (e) => {
  setAuthHeader();
});

sendMsgForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  const formData = new FormData(sendMsgForm);
  let message = formData.get("message");
  if (message === "") return;

  axios
    .post(`${backendAPI}/chat/send-message`, { message })
    .then((res) => {
      sendMsgForm.reset();
      console.log(res.data);
    })
    .catch((err) => {
      alert(err.response.data.message || "Something went wrong");
      console.log(err.response);
    });
});
