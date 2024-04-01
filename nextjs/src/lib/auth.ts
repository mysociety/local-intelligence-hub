export function authenticationHeaders() {
  const token = localStorage.getItem("jwt");
  return {
    authorization: token ? `JWT ${token}` : "",
  };
}