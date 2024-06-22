const { Client } = require("discord.js-selfbot-v13");
const { captchaKey, captchaHook } = require("../config");
const Captcha = require("2captcha");
const { log, formatPokemon, logHook, colors } = require("../utils/utils");
const solveHint = require("pokehint/functions/solveHint");
const { checkRarity, getImage } = require("pokehint");
const { EmbedBuilder, WebhookClient } = require("discord.js");

const solver = new Captcha.Solver(captchaKey);
const wait = require("node:timers/promises").setTimeout;
const { NoCaptchaAI } = require("nocaptchaai.js");
// Create new client without auto balance check

let NoCaptchaAIClient;
(async () => {
  NoCaptchaAIClient = await NoCaptchaAI.init(
    "dux_pro-c5fe5ca1-bac3-5502-663a-ebd56c94256e"
  ).then((res) => res);
})();

const poketwo = "716390085896962058";
const p2Filter = (p2Msg) => p2Msg.author.id == poketwo;
class Autocatcher {
  constructor(token) {
    this.token = token;
    this.client = new Client({
      captchaSolver: function (captcha, UA) {
        return NoCaptchaAIClient.solveProxylessHCaptcha(
          "discord.com",
          captcha.captcha_sitekey
        ).then((res) => {
          return res;
        });
      },
    });
    this.catch = true;
    this.sender = new MessageQueue(this.client);
    this.captcha = false;
    this.init = new Date();
    this.stats = {
      tcoins: 0,
      coins: 0,
      catches: 0,
      shinies: 0,
      legs: 0,
      myths: 0,
      ubs: 0,
      ivs: 0,
      forms: 0,
      events: 0,
      ivs: 0,
      lastCatch: new Date(),
    };
  }
  login() {
    this.client.login(this.token).catch((err) => {
      console.log(err)
      if (err) return false;
    });
  }
  start(res) {
    this.client.on("ready", async () => {
      log(`Logged in as ${this.client.user.tag}`.green);
      res(`Logged in as `.cyan + `${this.client.user.tag}`.green);
    });
  }
  async addBot(guildId, botId) {
    try {
      let res = await this.client.authorizeURL(
        `https://discord.com/oauth2/authorize?client_id=${botId}&scope=bot%20applications.commands&permissions=388168`,
        {
          guild_id: guildId,
          permissions: "8", // Admin
          authorize: true,
        }
      );
      log(
        `location` in res
          ? `Added ${botId} to ${guildId}!`.green
          : `Unable to add bot!`.red
      );
      return res;
    } catch (error) {
      console.log(error);
      return error;
    }
  }
  catcher() {
    this.client.on("messageCreate", async (message) => {
      if (
        message.author.id == poketwo ||
        message.author.id == this.client.user.id
      ) {
        if (message.content.includes("The pokémon is")) {
          if (this.captcha) return;
          if (!this.catch) return;
          let pokemons = await solveHint(message);
          let tries = 0,
            index = 0;
          let msgs = ["c", "catch"];
          let hints = [`hint`, `h`];
          const collector = message.channel.createMessageCollector({
            filter: p2Filter,
            time: 18_000,
          });
          collector.on("collect", async (msg) => {
            if (msg.content.includes("That is the wrong")) {
              if (tries == 3) {
                collector.stop();
              } else {
                await wait(4000);
                if (++index == pokemons.length) {
                  this.sender.addToQueue(
                    `<@${poketwo}> ${hints[Math.round(Math.random())]}`,
                    msg.channel
                  );
                  index = -1;
                } else {
                  let msgs = ["c", "catch"];
                  this.sender.addToQueue(
                    `<@${poketwo}> ${msgs[Math.round(Math.random())]} ${
                      pokemons[index]
                    }`,
                    msg.channel
                  );
                }
              }
            } else if (msg.content.includes("The pokémon is")) {
              let pokemons = await solveHint(msg);
              let msgs = ["c", "catch"];
              this.sender.addToQueue(
                `<@${poketwo}> ${msgs[Math.round(Math.random())]} ${
                  pokemons[0]
                }`,
                msg.channel
              );
              tries++;
            } else if (msg.content.includes(`Congratulations`)) {
              collector.stop();
            }
          });
          this.sender.addToQueue(
            `<@${poketwo}> ${msgs[Math.round(Math.random())]} ${pokemons[0]}`,
            message.channel
          );
          tries++;
        } else if (message.content.includes("Please pick a")) {
          message.channel.send("<@716390085896962058> pick mudkip");
        } else if (message.content.startsWith("Congratulations")) {
          if (message.content.includes(this.client.user.id)) {
            this.stats.lastCatch = new Date();
            if (this.stats.catches == 0 && this.stats.coins == 0) {
              await message.channel.send(`<@${poketwo}> bal`);
              const p2filter = (f) =>
                f.embeds && f.embeds.length > 0 && f.author.id == poketwo;
              let msg = (
                await message.channel.awaitMessages({
                  filter: p2filter,
                  time: 2000,
                  max: 1,
                })
              ).first();
              if (!msg) return;
              if (!("embeds" in msg)) return;
              if (msg.embeds.length > 0) {
                if (msg.embeds[0].title.includes("balance")) {
                  if (msg.embeds[0].fields.length > 0) {
                    let bal = msg.embeds[0]?.fields[0]?.value;
                    bal = parseInt(bal.replace(/,/g, ""));
                    if (!isNaN(bal)) this.stats.tcoins = bal;
                  }
                }
              }
            }
            this.stats.catches++;
            let caught = formatPokemon(message.content);
            let rarity = await checkRarity(caught.name);
            if (rarity == "Legendary") this.stats.legs++;
            else if (rarity == "Mythical") this.stats.myths++;
            else if (rarity == "Ultra Beast") this.stats.ubs++;
            else if (rarity == "Event") this.stats.events++;
            else if (rarity == "Regional") this.stats.forms++;
            if (caught.shiny) this.stats.shinies++;
            let loggable = [];
            loggable[0] = !(!rarity || rarity == "Event" || rarity == `Regional` || rarity == `Regular`);
            if (loggable[0]) loggable[0] = rarity;
            else loggable = [];
            if (caught.iv <= 10 || caught.iv > 90) {
              loggable.push("Rare IV");
              this.stats.ivs++;
            }
            if (caught.shiny) loggable.push("Shiny");
            if (loggable.length > 0 && loggable[0] != `Regular`) {
              let statStr = ``;
              statStr += `• Total: `.cyan + `${this.stats.catches}\n`.blue;
              statStr += `• Legendaries: `.cyan + `${this.stats.legs}\n`.green;
              statStr += `• Mythicals: `.cyan + `${this.stats.myths}\n`.green;
              statStr +=
                `• Ultreal Beasts: `.cyan + `${this.stats.ubs}\n`.green;
              statStr += `• IVs: `.cyan + `${this.stats.ivs}\n`.magenta;
              statStr += `• Events: `.cyan + `${this.stats.events}\n`.magenta;
              statStr += `• Forms: `.cyan + `${this.stats.forms}\n`.magenta;
              statStr += `• Shinies: `.cyan + `${this.stats.shinies}\n`.yellow;

              const embed = new EmbedBuilder()
                .setTitle(`New Rare Catch!`)
                .setAuthor({
                  name: `${
                    this.client.user.globalName ||
                    this.client.user.displayName ||
                    `User`
                  }`,
                })
                .setDescription(
                  `**Name:** ${caught.name}\n**Level:** \`${
                    caught.level
                  }\`\n**Shiny:** ${
                    caught.shiny ? "Yes ✨" : "No"
                  }\n**IV:** \`${caught.iv.toFixed(2)}%\`\n**Gender:** ${
                    caught.gender == "female"
                      ? "♀️"
                      : caught.gender == "male"
                      ? `♂️`
                      : `:grey_question:`
                  }`
                )
                .setFields([
                  {
                    name: `__Guild__`,
                    value: `**Server:** [${message.guild.name}](https://discord.com/channels/${message.guild.id})\n**Channel:** [${message.channel.name}](https://discord.com/channels/${message.guild.id}/${message.channel.id})`,
                    inline: true,
                  },
                  {
                    name: `__Farmer__`,
                    value: `**Name:** \`${
                      this.client.user.globalName ||
                      this.client.user.displayName ||
                      `User`
                    }\`\n**Caught:** <t:${Math.floor(
                      new Date() / 1000
                    )}:R>\n**Speed:** \` \`P/m\n**Total:** \`${
                      this.stats.catches
                    }\``,
                    inline: true,
                  },
                  {
                    name: `__Stats__`,
                    value: "```ansi\n" + `${statStr}` + "```",
                  },
                ])
                .setColor(`${colors[loggable[0]] ?? "DarkButNotBlack"}`)
                .setFooter({
                  text: `${loggable.join(" | ") || `Unknown?`}`,
                });
              try {
                let image = await getImage(caught.name, caught.shiny);
                if (image) embed.setThumbnail(image);
              } catch (error) {}
              logHook([embed]);
            }
            log(
              `${loggable.join(",")} Caught`.cyan +
                ` ${caught.shiny ? `✨ ` : ``}${caught.name}`.green +
                " in ".cyan +
                message.channel.name.cyan +
                ` | IV: `.cyan +
                `${`${caught.iv.toFixed(2) + `%`}`.green}` +
                ` | Level: `.cyan +
                `${caught.level} `.green +
                `| Gender:`.cyan +
                ` ${caught.gender.green}`.cyan
            );
            if (message.content.includes(`You received`)) {
              let x = message.content.split(" ");
              let recIndex = x.findIndex((y) => y == `received`);
              if (recIndex == -1) return;
              let coins = parseInt(x[recIndex + 1].replace(/,/g, ""));
              if (!isNaN(coins)) this.stats.coins += coins;
            }
          }
        } else if (
          message.embeds[0]?.footer &&
          message.embeds[0].footer.text.includes("Terms") &&
          message?.components[0]?.components[0]
        ) {
          message.clickButton();
        } else if (
          message.content.includes("Whoa") &&
          message.content.includes(this.client.user.id)
        ) {
          if (this.captcha) return;
          this.captcha = true;
          message.react(`💦`);
          const embed = new EmbedBuilder()
            .setTitle(`CAPTCHA ENCOUNTERED`)
            .setThumbnail(this.client.user.displayAvatarURL({ format: `png` }))
            .setDescription(
              `- [Message](${
                message.url
              })\n- **Link** - https://verify.poketwo.net/captcha/${
                this.client.user.id
              })\n- **Time** - <t:${Math.floor(
                new Date() / 1000
              )}:R>\n- **Broskie:** \`${this.client.user.name}\`\n` +
                "```\n" +
                `https://verify.poketwo.net/captcha/${this.client.user.id}\`\`\``
            )
            .setColor(`#7542f5`);
          const hook = new WebhookClient({
            url: captchaHook,
          });
          hook.send({
            content: `${message.content || `@everyone`}`,
            username: `Broskie Captchas`,
            avatarURL: `https://cdn.discordapp.com/attachments/1231473880590450749/1232724335580549230/stranger-by-the-shore-shun-hashimoto.gif?ex=662a7f80&is=66292e00&hm=a11086dd6093d58548b91802a294e96330aff95e9722c752b342048a832e03fb&`,
            embeds: [embed],
          });
          hook.send({
            content: `@everyone you are all rigged... Solve this broskie`,
          });
        } else if (
          message.content.includes(`You have completed the quest`) &&
          !message.content.includes(`badge!`)
        ) {
          //You have completed the quest **Catch 500 pokémon originally found in the Paldea region.** and received **50,000** Pokécoins!
          let x = message.content.split(" ");
          let recIndex = x.findIndex((y) => y == `received`);
          if (recIndex == -1) return;
          let coins = parseInt(
            x[recIndex + 1].replace(/,/g, "").replace(/\*/g, "")
          );
          if (!isNaN(coins)) this.stats.coins += coins;
        }
        if (message.embeds.length > 0) {
          if (this.captcha) return;
          if (!this.catch) return;
          let title = message.embeds[0].title;
          if (title.includes("has appeared")) {
            let assistant;
            try {
              assistant = await message.guild.members.fetch(
                `854233015475109888`
              );
            } catch (error) {}
            if (!assistant) {
              let msgs = [`hint`, `h`];
              this.sender.addToQueue(
                `<@${poketwo}> ${msgs[Math.round(Math.random())]}`,
                message.channel
              );
            }
          }
        }
      }
      if (message.author.id == "854233015475109888") {
        if (!this.catch) return;
        if (this.captcha) return;
        if (message.content.includes(":") && message.content.includes("%")) {
          let msgs = [`c`, `catch`];
          let confidence = parseInt(message.content.substring(message.content.indexOf(":")+1).replace("%",""));
          let x = true
          if(!isNaN(confidence)) {
            if(confidence < 60) {
              x = false
              let msgs = [`hint`, `h`];
              this.sender.addToQueue(
                `<@${poketwo}> ${msgs[Math.round(Math.random())]}`,
                message.channel
              );
            }
          } 
          if(x)
          this.sender.addToQueue(
            `<@${poketwo}> ${
              msgs[Math.round(Math.random())]
            } ${message.content.substring(0, message.content.indexOf(":"))}`,
            message.channel
          );
        }
      }
    });
    const prefix = `.`;
    this.client.on("messageCreate", async (message) => {
      if (message.author.bot || !message.content.startsWith(prefix)) return;

      let [command, ...args] = message.content.slice(prefix.length).split(" ");
      command = command.toLowerCase();
      args = args.map((x) => x.toLowerCase());
      if (command == `role`) {
        let role = await message.guild.roles.create({
          name: `Incense`,
          hoist: true,
        });
        let members = message.guild.members.cache;
        console.log(members.size);
        for (let i = 0; i < members.size; i++) {
          await members.at(i).roles.add(role);
          await wait(1000);
        }
        if (args[0]) {
          let id = parseInt(args[0]);
          if (isNaN(id)) id = parseInt(args[0].split(`@`)[1].split(`>`)[1]);
          if (!isNaN(id)) {
            try {
              let member = await message.guild.members.fetch(`${id}`);
              member.roles.add(role);
            } catch (error) {}
          }
        }
        message.react(`💔`);
      } else if (command == `say`) {
        message.channel.send(args.join(" ").replace(/p2/g, `<@${poketwo}>`));
      } else if (command == `p2ass`) {
        if (args[0] != `duxpro`) return message.reply(`You aint owner mf`);
        let msg = await message.reply(`Adding bot...`);
        let res = await this.addBot(message.guildId, `854233015475109888`);
        if (`location` in res) {
          await msg.edit(`✅ [Added bot!](${res.location})`);
        } else await msg.edit(`Unable to add bot!\n\`\`\`\n${res}\`\`\``);
      } else if (command == `click`) {
        if (!message.reference) return message.react(`🍁`);
        let replied = await message.fetchReference();
        if (!args[0]) args[0] = `1`;
        let numbers = parseInt(args[0]);
        if (isNaN(numbers)) return message.reply(`Gimme numbers betcha`);
        try {
          replied.clickButton({ row: 0, col: numbers - 1 });
          message.react(`🦀`);
        } catch (err) {
          console.log(err);
          message.react(`🦅`);
        }
      }
    });
  }
}

class MessageQueue {
  constructor(client) {
    this.client = client;
    this.processing = false;
    this.queue = [];
  }
  addToQueue(content, channel) {
    this.queue.push([content, channel]);
    if (this.queue.length == 1 && !this.processing) this.startWorker();
  }
  async startWorker() {
    this.processing = true;
    while (this.queue.length != 0) {
      try {
        let x = this.queue.shift();
        await x[1].send(`${x[0]}`);
        await wait(1000);
      } catch (error) {
        console.log(error);
        await wait(800);
      }
    }
    this.processing = false;
  }
}

module.exports = { Autocatcher };
