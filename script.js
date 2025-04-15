let totalPoints = parseInt(localStorage.getItem('points')) || 0;
let totalReferrals = parseInt(localStorage.getItem('referrals')) || 0;
const completedTasks = JSON.parse(localStorage.getItem('completedTasks') || '{}');

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

  localStorage.setItem("points", totalPoints);
  localStorage.setItem("completedTasks", JSON.stringify(completedTasks));

  document.getElementById("totalPoints").innerText = totalPoints;

  const buttons = document.querySelectorAll(`button[onclick="completeTask('${taskId}')"]`);
  buttons.forEach((btn) => {
    btn.innerText = "Completed";
    btn.disabled = true;
  });
}

function setReferralLink() {
  const user = window.Telegram.WebApp.initDataUnsafe.user;
  const username = user?.username || 'user';
  const refInput = document.getElementById('refLink');
  refInput.value = `https://nadwallet.vercel.app/?ref=${username}`;
}

function copyReferralLink() {
  const refInput = document.getElementById('refLink');
  refInput.select();
  document.execCommand('copy');
  alert('Referral link copied!');
}

function getReferralFromURL() {
  const params = new URLSearchParams(window.location.search);
  const referrer = params.get('ref');
  if (referrer) {
    localStorage.setItem('referrer', referrer);
    console.log("Referral detected from:", referrer);
  }
}

function rewardReferrer() {
  const alreadyRewarded = localStorage.getItem('refRewarded');
  const referrer = localStorage.getItem('referrer');

  if (referrer && !alreadyRewarded) {
    console.log(`Awarding 100 ND to referrer: ${referrer}`);
    localStorage.setItem('refRewarded', 'true');
    alert(`Thanks for joining! ${referrer} will receive 100 ND.`);
  }
}

// On Load
window.addEventListener('load', () => {
  Telegram.WebApp.ready();
  setReferralLink();
  getReferralFromURL();
  rewardReferrer();

  // Show stored points and referrals
  document.getElementById("totalPoints").innerText = totalPoints;
  document.getElementById("totalReferrals").innerText = totalReferrals;

  // Update task buttons if already completed
  Object.keys(completedTasks).forEach(taskId => {
    const buttons = document.querySelectorAll(`button[onclick="completeTask('${taskId}')"]`);
    buttons.forEach((btn) => {
      btn.innerText = "Completed";
      btn.disabled = true;
    });
  });
});
console.log(window.Telegram.WebApp.initDataUnsafe.user);
