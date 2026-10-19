let isAuthenticated = true;
let isAdmin = false;
let hasPermission = true;

let canProceed = isAuthenticated && (isAdmin || hasPermission);

console.log(canProceed);
