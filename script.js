let totalPoints = 0;
let totalReferrals = 0;
const completedTasks = {};

function switchTab(tab) {
  document.getElementById("walletSection").classList.add("hidden");
  document.getElementById("tasksSection").classList.add("hidden");

  document.getElementById("walletTab").classList.remove("active");
  document.getElementById("tasksTab").classList.remove("active");

  document.getElementById(tab + "Section").classList.remove("hidden");
  document.getElementById(tab + "Tab").classList.add("active");
}

document.getElementById("walletTab").onclick = () => switchTab("wallet");
document.getElementById("tasksTab").onclick = () => switchTab("tasks");

function completeTask(taskId) {
  if (completedTasks[taskId]) return;

  let points = 0;

  switch (taskId) {
    case "telegram":
      // add verification logic here later
      points = 100;
      break;
    case "twitterFollow":
      points = 100;
      break;
    case "retweet":
      points = 50;
      break;
  }

  totalPoints += points;
  completedTasks[taskId] = true;

  document.getElementById("totalPoints").innerText = totalPoints;

  const buttons = document.querySelectorAll(`button[onclick="completeTask('${taskId}')"]`);
  buttons.forEach((btn) => {
    btn.innerText = "Completed";
    btn.disabled = true;
  });
}

function showReferral() {
  totalReferrals += 1;
  totalPoints += 100;

  document.getElementById("referralBox").classList.remove("hidden");
  document.getElementById("totalReferrals").innerText = totalReferrals;
  document.getElementById("totalPoints").innerText = totalPoints;
}
