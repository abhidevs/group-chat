const loginForm = document.getElementById("loginForm");

const backendAPI = "http://localhost:3000/api";

loginForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  const formData = new FormData(loginForm);

  let email = formData.get("email");
  let password = formData.get("password");

  axios
    .post(`${backendAPI}/auth/login`, { email, password })
    .then((res) => {
      alert("Logged in successfully");
      loginForm.reset();
      console.log(res.data);
    })
    .catch((err) => {
      // alert(err.response.data.message);
      alert("Something went wrong");
      console.log(err.response);
    });
});
