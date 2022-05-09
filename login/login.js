const loginForm = document.getElementById("loginForm");

const backendAPI = "http://localhost:3000/api";
const localStorageKey = "gc_user";

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
      localStorage.setItem(localStorageKey, JSON.stringify(data.accessToken));
      // console.log(res.data);
      window.location.replace("../");
    })
    .catch((err) => {
      alert(err.response.data.message);
      // alert("Something went wrong");
      console.log(err.response);
    });
});
