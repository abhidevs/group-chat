function handleCredentialResponse(googleUser) {
  //   console.log(googleUser.credential);
  const { credential } = googleUser;

  axios
    .post(`${backendAPI}/auth/signinwithgoogle`, { credential })
    .then(({ data }) => {
      localStorage.setItem("gc_user", JSON.stringify(data.accessToken));
      localStorage.setItem("gc_user_email", JSON.stringify(data.email));
      window.location.replace("../");
    })
    .catch((err) => {
      alert(err.response?.data?.message || "Something went wrong");
      console.log(err);
    });
}

document.getElementById("g_id_onload").click = function () {
  google.accounts.id.initialize({
    client_id:
      "1004099560185-v610v6f1vsps8q2qnb8v7defp6n7clmt.apps.googleusercontent.com",
    callback: handleCredentialResponse,
  });
  //   google.accounts.id.prompt();
};
