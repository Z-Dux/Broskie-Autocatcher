const { WebhookClient } = require("discord.js");
const config = require("../config");
const checkRarity = require("pokehint/functions/checkRarity");

function format(content) {
  let tokens = [];
  content.forEach((e) => {
    let x = e
      .split(";")
      .map((T) => {
        if (T) T.trim();
        return T;
      })
      .filter((x) => x);
    tokens.push(x[0]);
  });
  return tokens;
}

require("colors");

function log(message) {
  const timestamp = new Date().toISOString().slice(11, -5).cyan; // Extracting time in HH:mm:ss format and colorizing it
  const formattedMessage = `[${timestamp}] ${message}`;

  console.log(formattedMessage);
}
function getRate(initialDate, totalItems) {
  const currentDate = new Date();
  const timeElapsedInSeconds = (currentDate.getTime() - initialDate.getTime()) / 1000;
  const rate = totalItems / timeElapsedInSeconds;
  return rate.toFixed(2);
}
function formatPokemon(content) {
  let str = content; //`Congratulations <@1231528050127016009>! You caught a Level 4 Cacnea Sir<:female:1207734084210532483> (58.60%)!`;
  if (!content.startsWith("Congratulations")) return;
  let mainStr = str.split("!")[1].trim().split(" ");
  let main = str.split("!")[1].trim();
  //Name & level
  let levelIndex = main.split(" ").findIndex((x) => x == "Level") + 2;
  let nameStr = mainStr.slice(levelIndex).join(" ").trim();
  let iv = parseFloat(
    nameStr.substring(nameStr.indexOf(`(`) + 1, nameStr.length - 2)
  );
  nameStr = nameStr.substring(0, nameStr.indexOf(`(`));
  let level = parseInt(mainStr[4]),
    name = nameStr.substring(0, nameStr.indexOf("<"));
  let gender = nameStr.includes("female")
    ? `female`
    : nameStr.includes("male")
    ? `male`
    : `none`;
  return {
    name: name.trim(),
    level: level,
    gender: gender,
    iv: iv,
    shiny: str.includes("✨") || str.includes(":sparkles:"),
  };
}
checkRarity;
const colors = {
  Legendary: "#34eba4",
  Mythical: "#fc030b",
  "Ultra Beast": "#9803fc",
  Regional: "DarkButNotBlack",
  Event: "#fc5a03",
  Regular: "#23272A",
  "Rare IV": "#cae3da",
  Shiny: "#fce803",
};
function logHook(embeds) {
  if (embeds.length <= 0) return;
  let hook = new WebhookClient({
    url: config.webhook,
  });
  hook.send({
    username: `Broskie`,
    avatarURL: `https://cdn.discordapp.com/attachments/1231473880590450749/1232724335580549230/stranger-by-the-shore-shun-hashimoto.gif?ex=662a7f80&is=66292e00&hm=a11086dd6093d58548b91802a294e96330aff95e9722c752b342048a832e03fb&`,
    embeds: embeds,
  });
}
function chunk(array, size) {
  const chunkedArray = [];
  for (let i = 0; i < array.length; i += size) {
    chunkedArray.push(array.slice(i, i + size));
  }
  return chunkedArray;
}

async function getGuilds(bot) {
  let def;
  let guildsWithMembers = [];
  let both = false;
  for (let guild of bot.guilds.cache.values()) {
    let p2, p2ass;
    try {
      p2ass = await guild.members.fetch("854233015475109888");
    } catch (error) {}
    try {
      p2 = await guild.members.fetch("716390085896962058");
    } catch (error) {}

    // Add properties to guild object
    guild.hasP2 = !!p2;
    guild.hasAssistant = !!p2ass;

    guildsWithMembers.push(guild);

    // Check if both members exist and a default guild is not set yet
    if (p2 && p2ass && !def && !both) {
      def = guild;
      both = true;
    }
    if ((p2 || p2ass) && (!def && !both)) def = guild;
  }
  if(!def) def = guildsWithMembers[0]

  // Return array with guilds and the default guild (if found)
  return [guildsWithMembers, def];
}
function commatize(number) {
  let numStr = number.toString();
  let formattedNumber = "";

  for (let i = numStr.length - 1, count = 0; i >= 0; i--) {
    formattedNumber = numStr[i] + formattedNumber;
    count++;
    if (count % 3 === 0 && i !== 0) {
      formattedNumber = "," + formattedNumber;
    }
  }
  return formattedNumber;
}
module.exports = {
  format,
  log,
  formatPokemon,
  logHook,
  colors,
  chunk,
  getGuilds,
  commatize,
  getRate
};
