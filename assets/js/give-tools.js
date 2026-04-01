const donationKey = "ncc_demo_donations";
const campaignTarget = 50000;

function getDonations() {
  return JSON.parse(localStorage.getItem(donationKey) || "[]");
}

function saveDonations(items) {
  localStorage.setItem(donationKey, JSON.stringify(items));
}

function renderDonations() {
  const progress = document.querySelector("[data-campaign-progress]");
  const amountNode = document.querySelector("[data-campaign-amount]");
  const listNode = document.querySelector("[data-donation-history]");
  if (!progress || !amountNode || !listNode) {
    return;
  }

  const donations = getDonations();
  const total = donations.reduce((sum, item) => sum + item.amount, 0);
  const percentage = Math.min(100, Math.round((total / campaignTarget) * 100));

  progress.value = percentage;
  amountNode.textContent = "$" + total.toLocaleString() + " raised of $" + campaignTarget.toLocaleString();
  listNode.innerHTML = donations
    .slice(0, 8)
    .map((item) => "<li>" + item.name + " gave $" + item.amount + " (" + item.purpose + ")</li>")
    .join("");
}

function initGiveTools() {
  const form = document.querySelector("[data-donation-form]");
  if (!form) {
    return;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const name = String(data.get("name") || "Anonymous");
    const amount = Number(data.get("amount") || 0);
    const purpose = String(data.get("purpose") || "General");
    if (!Number.isFinite(amount) || amount <= 0) {
      return;
    }
    const donations = getDonations();
    donations.unshift({
      name,
      amount,
      purpose,
      createdAt: new Date().toISOString()
    });
    saveDonations(donations);
    form.reset();
    renderDonations();
  });

  renderDonations();
}

initGiveTools();
