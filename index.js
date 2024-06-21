process.title = "Broskie";
const fs = require("fs");
const path = require("path");
require("colors");
const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  MessagePayload,
} = require("discord.js");
const wait = require("node:timers/promises").setTimeout;
const started = new Date();
const { Autocatcher } = require("./autocatcher");
const { prefix, owners } = require("./config");
const config = require("./config");
const { log, chunk, getGuilds, commatize, getRate } = require("./utils/utils");

const poketwo = "716390085896962058";
const p2Filter = (p2Msg) => p2Msg.author.id == poketwo;

const bot = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
  ],
});
let autocatchers = [],
  tokens = [];
global.acs = autocatchers;
bot.on("ready", async () => {
  log(`Connected as ${bot.user.tag}`.green);
});
bot.login(config.token);
let acs = autocatchers;

async function statRow(i, userId, defId) {
  if (!defId)
    await i.deferReply({
      ephemeral: true,
    });
  else
    await i
      .update({
        content: `Loading new guild...`,
        embeds: [],
      })
      .catch(async (err) => {
        await i.editReply({
          content: `Refreshing...`,
          embeds: [],
        });
      });
  let id = userId || i.values[0].split("-")[1].trim();
  let ac = autocatchers.find((x) => x.client.user.id == id);
//let ac = autocatchers.find((x) => x.client.user.id == id);
  if (ac && ac.client.user) {
    const embed = new EmbedBuilder();
    embed
      .setTitle(
        `${
          ac.client.user.globalName || ac.client.user.displayName || `User`
        }'s stats`
      )
      .setColor(ac.client.user.hexAccentColor)
      .setThumbnail(ac.client.user.displayAvatarURL({ format: `png` }));
    let statStr = ``;
    statStr += `• Balance: `.cyan + `${commatize(ac.stats.tcoins)}\n`.blue;
    statStr += `• Coins: `.cyan + `${commatize(ac.stats.coins)}\n`.blue;
    statStr += `• Total: `.cyan + `${ac.stats.catches}\n`.blue;
    statStr += `• Legendaries: `.cyan + `${ac.stats.legs}\n`.green;
    statStr += `• Mythicals: `.cyan + `${ac.stats.myths}\n`.green;
    statStr += `• Ultreal Beasts: `.cyan + `${ac.stats.ubs}\n`.green;
    statStr += `• IVs: `.cyan + `${ac.stats.ivs}\n`.magenta;
    statStr += `• Events: `.cyan + `${ac.stats.events}\n`.magenta;
    statStr += `• Forms: `.cyan + `${ac.stats.forms}\n`.magenta;
    statStr += `• Shinies: `.cyan + `${ac.stats.shinies}\n`.yellow;
    embed.setDescription(
      `**ID:** \`${ac.client.user.id}\`\n` + "```ansi\n" + statStr + "```"
    );
    embed.setFields([
      {
        name: `__Broskie__`,
        value: `**Uptime:** <t:${Math.floor(ac.init / 1000)}:R>\n**Captcha:** ${
          ac.captcha ? `:grey_exclamation: YES` : `:x:`
        }`,
      },
    ]);
    let guilds = await getGuilds(ac.client);
    let defaultGuildId = defId || (guilds[1] ? guilds[1].id : null);
    let defaultGuild = guilds[0].find((x) => x.id == defaultGuildId);
    if (!defaultGuild) {
      if (defId) {
        await i.editReply({
          content: `Unable to load this command!\n> \`Please check ${ac.client.user.tag}!\``,
          embeds: [],
          ephemeral: true,
          components: [],
        });
      } else
        await i.editReply({
          content: `Unable to load this command!\n> \`Please check ${ac.client.user.tag}!\``,
          embeds: [],
          ephemeral: true,
          components: [],
        });
    }
    // Using Promise.all to await all promises in parallel
    let opts = await Promise.all(
      guilds[0].map(async (x) => {
        let p2;
        try {
          p2 = await x.members.fetch("716390085896962058");
        } catch (error) {}
        let menu = new StringSelectMenuOptionBuilder()
          .setLabel(`${x.name}`)
          .setDescription(
            `${x.hasP2 ? `✌ ` : ``}${x.hasAssistant ? `🤖 ` : ``}Channels: ${
              x.channels.cache.size
            } | Members: ${x.memberCount}`
          )
          .setValue(`setguild-${x.id}-${ac.client.user.id}`);
        if (p2) menu.setEmoji("<:SM_dott:1232763727707902053>");
        if (defaultGuildId === x.id) menu.setDefault(true);
        return menu;
      })
    );
    const guildRow = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("guilds-" + ac.client.user.id)
        .setPlaceholder("Guilds")
        .setOptions(...opts)
    );
    const btnRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`x-say-${ac.client.user.id}`)
        .setLabel(`Say`)
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`x-shards-${ac.client.user.id}`)
        .setLabel(`Shards`)
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`x-mbuy-${ac.client.user.id}`)
        .setLabel(`Market Buy`)
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`x-inc-${ac.client.user.id}`)
        .setLabel(`Incense`)
        .setStyle(ButtonStyle.Secondary)
    );
    const addRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`add-p2-${ac.client.user.id}-${defaultGuild.id}`)
        .setLabel(`Add Poketwo`)
        .setEmoji(`<:poketwo:1233109744936419348>`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(defaultGuild.hasP2),
      new ButtonBuilder()
        .setCustomId(`add-p2ass-${ac.client.user.id}-${defaultGuild.id}`)
        .setLabel(`Add PokeAssistant`)
        .setEmoji(`<:starly:1233109848258777118>`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(defaultGuild.hasAssistant)
    );
    if (defId) {
      await i.editReply({
        content: ``,
        embeds: [embed],
        ephemeral: true,
        components: [guildRow, btnRow, addRow],
      });
    } else
      await i.editReply({
        content: ``,
        embeds: [embed],
        ephemeral: true,
        components: [guildRow, btnRow, addRow],
      });
  } else {
    if (defId) {
      await i.update({
        content: `Unable to find that guy!`,
        ephemeral: true,
      });
    } else
      await i.editReply({
        content: `Unable to find that guy!`,
        ephemeral: true,
      });
  }
}

bot.on("interactionCreate", async (i) => {
  if (i.isStringSelectMenu()) {
    if (i.customId.startsWith("guilds")) {
      const ids = i.values[0].split("-");
      await statRow(i, ids[2], ids[1]);
    }
    if (i.customId.startsWith("pokemenu")) {
      let opts = i.values;
      let page = parseInt(i.customId.split("-")[1]);

      let pokemons = autocatchers.map((x) => x.catches).flat();
      pokemons = pokemons.sort((x, b) => b.iv - x.iv);
      console.log(pokemons.length);
      let strings = pokemons.map((x, i) => {
        return {
          rarity: x.rarity.toLowerCase(),
          str: pokeToString(x, i + 1, x.rarity),
        };
      });
      let options = [
        "Shiny",
        "Legendary",
        "Rare IV",
        "Mythical",
        "Ultra Beast",
        "Event",
        "Regular",
      ];
      strings = strings.filter((x) =>
        opts.map((x) => x.toLowerCase()).includes(x.rarity)
      );
      let pages = chunk(strings, 20);

      let embed = buildPokeMessage(
        pages,
        opts.map((x) => x.toLowerCase()),
        page
      );
      let btnRow = getPokeBtn(i, page.length);
      let menu = getPokeMenu(options, opts, page);
      await i.update({
        embeds: [embed],
        components: [new ActionRowBuilder().addComponents(menu), btnRow],
      });
    }
  }
  if (i.customId.startsWith("statRow")) {
    await statRow(i);
  }
  if (i.customId.startsWith(`statPage`)) {
    statMsg(i, parseInt(i.customId.split("-")[2]));
  }
  if (i.isButton()) {
    if (i.customId.startsWith(`pokemenu`)) {
      let curPage = parseInt(i.customId.split('-')[1])
      let pos = i.customId.split('-')[2]
      let newPage = 0;
      if(pos == `L`) newPage = curPage-1
      else newPage = curPage+1

      let pokemons = autocatchers.map((x) => x.catches).flat();
      pokemons = pokemons.sort((x, b) => b.iv - x.iv);
      let strings = pokemons.map((x, i) => {
        return {
          rarity: x.rarity.toLowerCase(),
          str: pokeToString(x, i + 1, x.rarity),
        };
      });
      let options = [
        "Shiny",
        "Legendary",
        "Rare IV",
        "Mythical",
        "Ultra Beast",
        "Event",
        "Regular",
      ];
      strings = strings.filter((x) =>
        options.map((x) => x.toLowerCase()).includes(x.rarity.toLowerCase())
      );
      let pages = chunk(strings, 20);
      let embed = buildPokeMessage(
        pages,
        options.map((x) => x.toLowerCase()),
        newPage
      );
      let btnRow = getPokeBtn(newPage, pages.length);
      let menu = getPokeMenu(options, [], newPage);

      await i.update({
        embeds: [embed],
        components: [new ActionRowBuilder().addComponents(menu), btnRow],
      });
    }
  }
  if (i.customId.startsWith("x")) {
    let args = i.customId.split("-");
    let selected = i.message.components[0];

    // Check if selected component exists
    if (!selected) {
      return await i.reply({
        content: `ERROR: Component not found.`,
        ephemeral: true,
      });
    }
    let values = selected.components[0]?.data?.options;
    if (!values) {
      return await i.reply({
        content: `ERROR: Options not found.`,
        ephemeral: true,
      });
    }

    let def = values.find((x) => x?.default);
    if (!def) {
      return await i.reply({
        content: `ERROR: Guild not found.`,
        ephemeral: true,
      });
    }
    let guildId = def.value.split("-")[1];
    const modal = new ModalBuilder()
      .setCustomId(`run-${args[1]}-${args[2]}-${guildId}`)
      .setTitle(`Broskie`);
    if (args[1] == `say`) {
      const input = new TextInputBuilder()
        .setCustomId("content")
        .setRequired(true)
        .setPlaceholder(`Use 'p2' for mentioning Poketwo`)
        .setLabel("What do you want the broskie to say?")
        .setStyle(TextInputStyle.Paragraph);
      modal.addComponents(new ActionRowBuilder().addComponents(input));
      await i.showModal(modal);
    } else if (args[1] == `shards`) {
      const input = new TextInputBuilder()
        .setCustomId("amount")
        .setLabel("How many shards?")
        .setPlaceholder(`Number`)
        .setRequired(true)
        .setStyle(TextInputStyle.Short);
      modal.addComponents(new ActionRowBuilder().addComponents(input));
      await i.showModal(modal);
    } else if (args[1] == `mbuy`) {
      const input = new TextInputBuilder()
        .setCustomId("id")
        .setLabel("Market ID")
        .setPlaceholder(`This cannot be undone!`)
        .setRequired(true)
        .setStyle(TextInputStyle.Short);
      modal.addComponents(new ActionRowBuilder().addComponents(input));
      await i.showModal(modal);
    } else if (args[1] == `inc`) {
      const input = new TextInputBuilder()
        .setCustomId("amount")
        .setLabel("How many incenses?")
        .setPlaceholder(`Will start in channel with 'incense' in name...`)
        .setRequired(true)
        .setStyle(TextInputStyle.Short);
      modal.addComponents(new ActionRowBuilder().addComponents(input));
      await i.showModal(modal);
    } else
      await i.reply({
        content: `Okay lil bro you want to send a ${args[1]} to ${guildId}?`,
        ephemeral: true,
      });
  }
  if (i.customId.startsWith("add-")) {
    let args = i.customId.split("-");
    let ids = {
      p2: poketwo,
      p2ass: `854233015475109888`,
    };
    let id = ids[args[1]];
    await i.reply({
      content: `*Adding **${
        id == poketwo ? `Poketwo` : `Poketwo Assistant`
      }** to ${args[3]}...*`,
      ephemeral: true,
    });
    //add-p2-${ac.client.user.id}-${defaultGuild.id}
    let ac = autocatchers.find((x) => x.client.user.id == args[2]);
    if (!ac) return await i.editReply(`Failed to locate broskie!`);
    console.log(`Adding bot...`);
    let res = await ac.addBot(args[3], id);
    if (`location` in res) {
      await i.editReply(`[✅ Added bot!](${res.location})`);
      await statRow(i, ac.client.user.id, args[3]);
    } else await i.editReply(`Unable to add bot!\n\`\`\`\n${res}\`\`\``);
  }
});

bot.on("interactionCreate", async (interaction) => {
  if (!interaction.isModalSubmit()) return;
  if (!owners.includes(interaction.user.id))
    return await interaction.reply({
      content: `You dont own me?`,
      ephemeral: true,
    });
  //customId run-type-userId-guildId
  let args = interaction.customId.split("-");
  //vars
  let ac = autocatchers.find((x) => x.client.user.id == args[2]);
  if (!ac)
    return await interaction.reply({
      content: "That account seems to be offline!",
      ephemeral: true,
    });
  let guild = ac.client.guilds.cache.get(args[3]);
  if (!guild)
    return await interaction.reply({
      content: "Seems like that guild is not available!",
      ephemeral: true,
    });
  let channel =
    guild.channels.cache.find((x) => x.name.startsWith("general")) ||
    guild.channels.cache.find((x) => x.name.startsWith("spam")) ||
    guild.channels.cache.find((x) => x.type == "GUILD_TEXT") ||
    guild.channels.cache.first();
  if (!channel)
    return await interaction.reply({
      content: "Unable to find a channel to execute the command!",
      ephemeral: true,
    });
  //Completed checking vars
  let i = await interaction.reply({ content: "Executing...", ephemeral: true });
  if (args[1] == `say`) {
    let content = interaction.fields.getTextInputValue("content");
    if (content && content.length > 0) {
      channel.send(`${content.replace(/p2/g, `<@${poketwo}>`)}`);
      await i.edit(
        `Delivered your message to \`${channel.name}\` in \`${guild.name}\``
      );
    } else await i.edit(`An error occured...`);
  } else if (args[1] == `shards`) {
    let amount = parseInt(interaction.fields.getTextInputValue("amount"));
    if (isNaN(amount))
      return await i.edit({
        content: `Please provide a valid amount of shards!`,
      });
    channel.send(`<@${poketwo}> buy shards ${amount}`);
    const filter = (f) => f.author.id == poketwo;
    try {
      let msg = await (
        await channel.awaitMessages({
          max: 1,
          time: 10000,
          filter: filter,
          errors: ["time"],
        })
      ).first();
      await msg.clickButton();
      await i.edit(
        `Purchased ${amount} shards in \`${channel.name}\`/\`${guild.name}\``
      );
    } catch (error) {
      await i.edit(`Unable to purchase! Please check if anything's wrong!`);
    }
  } else if (args[1] == `mbuy`) {
    let id = parseInt(interaction.fields.getTextInputValue("id"));
    if (isNaN(id)) return i.edit(`Please provide a valid Market ID!`);
    channel.send(`<@${poketwo}> m buy ${id}`);
    const collectorFilter = (m) => m.author.id == poketwo;
    const collector = channel.createMessageCollector({
      filter: collectorFilter,
      time: 15_000,
    });
    collector.on("collect", async (m) => {
      if (m.content.includes("you want to buy")) {
        await m.clickButton();
        let x = m.content.split(" ").reverse()[1];
        await i.edit(`Purchased \`${id}\` for ${x} coins!`);
        collector.stop();
      } else if (m.content.includes("have enough Pokécoins")) {
        await i.edit(`Insufficient funds? Broskie's broke...`);
        collector.stop();
      } else if (m.content.includes("find that listing!")) {
        await i.edit(`Broskie's trynna buy air?`);
        collector.stop();
      }
    });
  } else if (args[1] == `inc`) {
    let id = parseInt(interaction.fields.getTextInputValue("amount"));
    if (isNaN(id)) return i.edit(`You gotta givme a number?`);
    if (guild.channels.cache.size < id)
      return i.edit(
        `Broskie, that server doesn't even have that many channels!`
      );
    let channels = Array.from(guild.channels.cache.values()).filter((x) =>
      x.name.includes("incense")
    );
    if (channels.length < id) {
      let left = id - channels.length;
      let list = Array.from(guild.channels.cache.values()).filter(
        (x) => !x.name.includes("incense") && x.type == "GUILD_TEXT"
      );
      for (let i = 0; i < left; i++) channels.push(list[i]);
    }
    for (let i = 0; i < channels.length; i++) {
      await channels[i].send(`<@${poketwo}> buy incense`);
      await wait(500);
    }
    await i.edit(
      `✅ Purchased incense on \`${channels.length}\` channels!` +
        "```\n" +
        channels.map((x) => `${x.name}`).join("\n") +
        "```"
    );
  }
});
bot.on("messageCreate", async (message) => {
  if (message.author.bot || !message.content.startsWith(prefix)) return;

  let [command, ...args] = message.content.slice(prefix.length).split(" ");
  command = command.toLowerCase();
  args = args.map((x) => x.toLowerCase());
  if (command == `ping`) {
    let x = new Date().getTime();
    let m = await message.reply("Pinging...");
    await m.edit(`Pinged with **${new Date().getTime() - x}ms!**`);
  }
  if (command == `reload`) {
    stop();
    let logs = await start();
    message.channel.send(
      `✅ Reloaded!\n` + "```ansi\n" + logs.join("\n") + "```"
    );
  } else if (command == "add-token") {
    let x = await message.reply(`*Attempting to add token...*`);
    addToken(message.content.split(" ")[1], (res) => {
      x.edit(
        `${
          res.startsWith("-") ? `❌ Unable to add token!` : `✅ Added token!`
        }\n` +
          "```ansi\n" +
          res +
          "```"
      );
    });
  } else if (command == "stats") {
    await statMsg(message, 0);
  } else if (command == "help") {
    let cmds = [
      [`ping`, `Fetches server latency`],
      [`reload`, `Reloads/Reconnects all broskies`],
      [`add-token`, `Adds a new broskie`],
      [`stats`, `Displays in-depth broskie informations`],
      [`captcha`, `Toggle captcha on/off <id/global>`],
      [`catcher`, `Toggle catcher on/off <id/global>`],
      [`help`, `Shows this?`],
    ];
    let str = cmds
      .map((x) => {
        return `• ${x[0].padEnd(10, ` `)} [-] ${x[1]}`;
      })
      .join("\n");
    const embed = new EmbedBuilder()
      .setTitle(`Broskie`)
      .setColor(`Aqua`)
      .setDescription(`lil bro, I'm on v1...\`\`\`\n${str}\`\`\``);
    message.channel.send({
      embeds: [embed],
    });
  } else if (command == `captcha`) {
    let id = args[0];
    if (!id)
      return message.reply(
        `Please give me an ID or mention if its global!\n\`${prefix}captcha <id/on/off>\``
      );
    id = id.toLowerCase();
    if (args[0] == `on` || args[0] == `off`) {
      let start = args[0] == `on`;
      for (let i = 0; i < autocatchers.length; i++)
        autocatchers[i].captcha = start;
      await message.reply(
        `Successfully toggled **${
          start ? `on` : `off`
        }** in captcha status globally!`
      );
      return;
    }
    id = parseInt(id);
    if (isNaN(id)) return message.reply(`Please give me a valid ID!`);
    let ac = autocatchers.find((x) => x.client.user.id == id);
    if (!ac) return message.reply(`Unable to locate that broskie!`);
    if (args[1]) {
      if (args[1].toLowerCase() == `on`) ac.captcha = false;
      if (args[1].toLowerCase() == `off`) ac.captcha = true;
    }
    message.reply(
      `Captcha has been **toggled __${ac.captcha ? `OFF` : `ON`}__** for ${
        ac.client.user.globalName || ac.client.user.displayName || `User`
      }\n- Captcha URL: 🔗 [Link](https://verify.poketwo.net/captcha/${
        ac.client.user.id
      })`
    );
    ac.captcha = ac.captcha ? false : true;
  } else if (command == `catcher`) {
    let id = args[0];
    if (!id)
      return message.reply(
        `Please give me an ID or mention if its global!\n\`${prefix}catcher <id/start/stop>\``
      );
    id = id.toLowerCase();
    if (args[0] == `start` || args[0] == `stop`) {
      let start = args[0] == `start`;
      for (let i = 0; i < autocatchers.length; i++)
        autocatchers[i].catch = start;
      await message.reply(
        `Successfully **${start ? `started` : `stopped`}** globally!`
      );
      return;
    }
    id = parseInt(id);
    if (isNaN(id)) return message.reply(`Please give me a valid ID!`);
    let ac = autocatchers.find((x) => x.client.user.id == id);
    if (!ac) return message.reply(`Unable to locate that broskie!`);

    if (!args[1])
      return message.reply(
        `Please give provide an option! => \`<start/stop>\``
      );
    args[1] = args[1].toLowerCase();
    if (args[1] == `start` || args[1] == `stop`) {
      let start = args[1] == `start`;
      ac.catch = start;
      await message.reply(
        `Successfully **${start ? `started` : `stopped`}** ${
          ac.client.user.globalName || ac.client.user.displayName || `User`
        }!`
      );
    }
  } else if (command == `pokemons`) {
    let pokemons = autocatchers.map((x) => x.catches).flat();
    pokemons = pokemons.sort((x, b) => b.iv - x.iv);
    let strings = pokemons.map((x, i) => {
      return {
        rarity: x.rarity.toLowerCase(),
        str: pokeToString(x, i + 1, x.rarity),
      };
    });
    let options = [
      "Shiny",
      "Legendary",
      "Rare IV",
      "Mythical",
      "Ultra Beast",
      "Event",
      "Regular",
    ];
    strings = strings.filter((x) =>
      options.map((x) => x.toLowerCase()).includes(x.rarity.toLowerCase())
    );
    let pages = chunk(strings, 20);
    let embed = buildPokeMessage(
      pages,
      options.map((x) => x.toLowerCase()),
      0
    );
    let btnRow = getPokeBtn(0, pages.length);
    let menu = getPokeMenu(options, [], 0);

    await message.channel.send({
      embeds: [embed],
      components: [new ActionRowBuilder().addComponents(menu), btnRow],
    });
  }
});
function getPokeBtn(i, len) {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`pokemenu-${i}-L`)
      .setLabel(`◀`)
      .setDisabled(i == 0)
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`pokemenu-${i}-R`)
      .setLabel(`▶`)
      .setDisabled((len == (i+1) || len == 0) ? true : false)
      .setStyle(ButtonStyle.Secondary)
  );
  return row;
}
function getPokeMenu(options, optis, i) {
  let opts = options.map((x) => {
    return new StringSelectMenuOptionBuilder()
      .setLabel(x)
      .setDescription(`${x} pokemons!`)
      .setValue(x.toLowerCase())
      .setDefault(optis.includes(x.toLowerCase()));
  });
  return new StringSelectMenuBuilder()
    .setCustomId(`pokemenu-${i}`)
    .setPlaceholder(`Filter`)
    .addOptions(...opts)
    .setMaxValues(6);
}
function buildPokeMessage(pages, options, i) {
  console.log(pages, i);
  const embed = new EmbedBuilder()
    .setTitle(`Broskie Autocatcher`)
    .setColor(`LuminousVividPink`)
    .setFooter({ text: `Showing page ${i + 1}/${pages.length}` });
  if (i >= pages.length || i < 0) embed.setDescription(`*No pokemons*`);
  else embed.setDescription(pages[i].map((x) => x.str).join("\n"));

  return embed;
  return {
    embeds: [embed],
    components: [new ActionRowBuilder().addComponents(menu)],
  };
}
function pokeToString(data, i) {
  /* {
    name: name.trim(),
    level: level,
    gender: gender,
    iv: iv,
    shiny: str.includes("✨") || str.includes(":sparkles:"),
    user: string,
    rarity: string
  };*/
  return `\`${i}\`　${data.shiny ? `✨ ` : ``}**${data.name}** \`${
    data.rarity.toLowerCase().includes("IV")
      ? "I"
      : data.rarity.charAt(0).toUpperCase()
  }\` ${
    data.gender == "female"
      ? "♀️"
      : data.gender == "male"
      ? `♂️`
      : `:grey_question:`
  }　•　Lvl. ${data.level}　•　${data.iv}%`;
}
async function genStatMenu() {
  let menus = autocatchers
    .filter((x) => x.client.ws.status == 0)
    .sort(
      (a, b) =>
        b.stats.coins + b.stats.tcoins - (a.stats.coins + a.stats.tcoins)
    )
    .map((ac) => {
      let menu = new StringSelectMenuOptionBuilder()
        .setLabel(
          `${ac.stats.coins == 0 ? `👴` : ``}` +
            (ac.client.user.globalName || ac.client.user.displayName || `User`)
        )
        .setEmoji(
          `${
            ac.client.ws.status == 0 ? `<:SM_dott:1232763727707902053>` : `🔴`
          }`
        )
        .setDescription(
          `Catches: ${ac.stats.catches} | ${(
            Math.abs(ac.stats.lastCatch - new Date()) /
            (1000 * 60)
          ).toFixed(2)}m ago`
        )
        .setValue(`stats-` + ac.client.user.id);
      return menu;
    });
  menus = chunk(menus, 25);
  let rows = menus.map((mns, i) => {
    const select = new StringSelectMenuBuilder()
      .setCustomId("statRow-" + i)
      .setPlaceholder("Broskies?")
      .addOptions(...mns);
    const row = new ActionRowBuilder().addComponents(select);
    return row;
  });
  return rows;
}

async function stop() {
  autocatchers.map((ac) => {
    if (ac) ac.client.destroy();
  });
  autocatchers = [];
  return autocatchers;
}

async function start() {
  let tokenz = fs
    .readFileSync(path.join(__dirname, "data", "tokens.txt"))
    .toString()
    .split("\n");
  console.log(`Loading ${tokenz.length} tokens...`.cyan);
  let logs = await Promise.all(
    tokenz.map((token) => {
      return new Promise((resolve, reject) => {
        console.log(`Logging into ${token}`.gray);
        let loggedIn = false;
        const ac = new Autocatcher(token.trim());
        ac.login();
        ac.start((res) => {
          loggedIn = true;
          resolve(res);
          autocatchers.push(ac);
          tokens.push(token);
        });
        ac.catcher();
        setTimeout(() => {
          if (!loggedIn)
            resolve(
              `- Failed to login into ${
                token.substring(0, token.indexOf(".")) || `_token_`
              }`
            );
        }, 5000);
      });
    })
  );
  return logs;
}

async function addToken(token, callback) {
  const ac = new Autocatcher(token);
  if (tokens.includes(token))
    return callback(`- Autocatcher already exists!`.red);
  ac.login();
  let loggedIn = false;
  ac.start((res) => {
    callback(res);
    loggedIn = true;
    ac.catcher();
    autocatchers.push(ac);
  });
  setTimeout(() => {
    if (!loggedIn)
      callback(
        `- Failed to login into ${
          token.substring(0, token.indexOf(".")) || `_token_`
        } | Invalid Token?`.red
      );
  }, 5000);
  return;
}
(async () => {
  let x = await start();
})();
process.on("unhandledRejection", (error) => {
  console.error("Unhandled promise rejection:", error);
});


async function statMsg(message, page) {
  const embed = new EmbedBuilder().setTitle(`Connected broskies...`);
  let bal = 0,
    catches = 0;
  let str = autocatchers
    .filter((x) => x.client.ws.status == 0)
    .map((x, i) => {
      return {
        name: `**${(
          x.client.user.globalName ||
          x.client.user.displayName ||
          `User`
        ).padEnd(15, ` `)}**`,
        
        catches: x.stats.catches,
        bal: x.stats.coins + x.stats.tcoins,
        ping: `<t:${Math.floor(x.stats.lastCatch / 1000)}:R>${
          x.captcha
            ? `\n• ❕ [Captcha]((https://verify.poketwo.net/captcha/${ac.client.user.id})`
            : ``
        }`,
      };
    })
    .sort((a, b) => b.bal - a.bal)
    .map((x, i) => {
      bal += x.bal;
      catches += x.catches;
      return `- \`${i + 1}\`　${x.name} • **${commatize(
        x.catches
      )}** • \`${commatize(x.bal)}\` • ${x.ping}`;
    });
  let chunks = chunk(str, 20);
  let s =
    `> \`i\`　**Name** • **Catches** • **Balance** • **Ping**\n${`-`.repeat(
      55
    )}\n> **Broskies:** ${commatize(
      autocatchers.length
    )}\n> **Catches:** \`${commatize(catches)}\`\n> **Balance:** \`${commatize(
      bal
    )}\`\n> **Catch Rate:** \`${getRate(
      started,
      catches
    )}\` *P/s*\n${`-`.repeat(55)}\n` + chunks[page || 0].join("\n");
  s = s.length == 0 ? `*None*` : s;
  embed.setDescription(`${s}`);
  embed.setColor("DarkButNotBlack");
  let id = "author" in message ? message.author.id : message.user.id;
  const row = new ActionRowBuilder().setComponents(
    new ButtonBuilder()
      .setCustomId(`statPage-L-${page + 1}-${id}`)
      .setLabel(`◀`)
      .setDisabled(page == 0)
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`statPage-R-${page + 1}-${id}`)
      .setLabel(`▶`)
      .setDisabled(chunks.length == page + 1 ? true : false)
      .setStyle(ButtonStyle.Secondary)
  );
  if ("author" in message)
    message.channel.send({
      embeds: [embed],
      components: [...(await genStatMenu()), row],
    });
  else
    message.update({
      embeds: [embed],
      components: [...(await genStatMenu()), row],
    });
}
