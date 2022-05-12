function handleCredentialResponse(googleUser) {
  console.log(googleUser);
  var profile = googleUser.getBasicProfile();
  console.log("ID: " + profile.getId()); // Do not send to your backend! Use an ID token instead.
  console.log("Name: " + profile.getName());
  console.log("Image URL: " + profile.getImageUrl());
  console.log("Email: " + profile.getEmail()); // This is null if the 'email' scope is not present.
}

document.getElementById("g_id_onload").click = function () {
  google.accounts.id.initialize({
    client_id:
      "1004099560185-v610v6f1vsps8q2qnb8v7defp6n7clmt.apps.googleusercontent.com",
    callback: handleCredentialResponse,
  });
  google.accounts.id.prompt();
};
