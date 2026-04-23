/**
 * Keyword-based prayer encouragement when no LLM is configured or the API fails.
 */
function keywordPrayerReply(message) {
  const input = String(message || "").toLowerCase();
  if (input.indexOf("anxious") !== -1 || input.indexOf("fear") !== -1 || input.indexOf("worry") !== -1) {
    return "You are not alone. Take a deep breath. \"Cast all your anxiety on Him because He cares for you.\" (1 Peter 5:7)";
  }
  if (input.indexOf("family") !== -1 || input.indexOf("marriage") !== -1 || input.indexOf("children") !== -1) {
    return "Praying for peace and unity in your home. Ask God for patience, wisdom, and healing conversations this week.";
  }
  if (input.indexOf("health") !== -1 || input.indexOf("sick") !== -1 || input.indexOf("pain") !== -1) {
    return "Praying for strength and healing over your body and mind. May you receive comfort and renewed hope today.";
  }
  if (input.indexOf("job") !== -1 || input.indexOf("money") !== -1 || input.indexOf("work") !== -1) {
    return "Praying for provision and open doors. May God guide your next step and give clarity in every decision.";
  }
  return "Thank you for sharing. I am praying with you now: Lord, bring peace, wisdom, and strength in this situation. Amen.";
}

const DEFAULT_SYSTEM = [
  "You are a caring Christian prayer companion for visitors to New Community Church in Suffolk, Virginia.",
  "Respond briefly (under 120 words), warmly, and Biblically.",
  "Do not claim to be a licensed counselor or give medical/legal advice.",
  "Encourage appropriate professional or pastoral follow-up when someone mentions crisis, abuse, or self-harm.",
  "End with a short prayer or blessing when it fits."
].join(" ");

async function openAiPrayerReply(userMessage) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const system = process.env.PRAYER_AI_SYSTEM_PROMPT || DEFAULT_SYSTEM;
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + apiKey
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: userMessage }
      ],
      max_tokens: 450,
      temperature: 0.65
    })
  });
  if (!response.ok) {
    return null;
  }
  const data = await response.json();
  const text = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
  const trimmed = String(text || "").trim();
  return trimmed || null;
}

module.exports = {
  keywordPrayerReply,
  openAiPrayerReply
};
