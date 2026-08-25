// ======================================================
// PENGUIN ADVENTURE - ACCOUNT SYSTEM
// ======================================================

const ACCOUNT_STORAGE_KEY = "penguinAdventureAccount";

// Generate a random player code
function generatePlayerCode() {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  let code = "";

  for (let i = 0; i < 6; i++) {
    code += characters[
      Math.floor(Math.random() * characters.length)
    ];
  }

  return "PENG-" + code;
}


// Get existing account or create a new one
function loadAccount() {

  const saved = localStorage.getItem(
    ACCOUNT_STORAGE_KEY
  );

  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (error) {
      console.log("Creating a new account.");
    }
  }

  const account = {
    playerCode: generatePlayerCode(),
    username: "Penguin Player",
    createdAt: Date.now()
  };

  localStorage.setItem(
    ACCOUNT_STORAGE_KEY,
    JSON.stringify(account)
  );

  return account;
}


// Save account
function saveAccount(account) {

  localStorage.setItem(
    ACCOUNT_STORAGE_KEY,
    JSON.stringify(account)
  );
}


// Get the player's account
const playerAccount = loadAccount();


// Display the player's code
function showPlayerCode() {

  alert(
    "🐧 Your Penguin Adventure Player Code:\n\n" +
    playerAccount.playerCode +
    "\n\nGive this code to your friends!"
  );
}


// Change username
function setUsername(name) {

  if (!name || name.trim() === "") {
    return;
  }

  playerAccount.username =
    name.trim().substring(0, 20);

  saveAccount(playerAccount);
}


// Get account information
function getAccount() {

  return playerAccount;
}
