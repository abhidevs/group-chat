const loginForm = document.getElementById("loginForm");

const backendAPI = "http://localhost:3000/api";
const localStorageKeyForToken = "gc_user";
const localStorageKeyForUserEmail = "gc_user_email";

loginForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  const formData = new FormData(loginForm);

  let email = formData.get("email");
  let password = formData.get("password");

  axios
    .post(`${backendAPI}/auth/login`, { email, password })
    .then(({ data }) => {
      alert("Logged in successfully");
      loginForm.reset();
      localStorage.setItem(localStorageKeyForToken, JSON.stringify(data.accessToken));
      localStorage.setItem(localStorageKeyForUserEmail, JSON.stringify(data.email));
      // console.log(res.data);
      window.location.replace("../");
    })
    .catch((err) => {
      alert(err.response.data.message);
      // alert("Something went wrong");
      console.log(err.response);
    });
});
