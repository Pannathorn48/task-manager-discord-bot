import 'dotenv/config';
import { ChatInputCommandInteraction, Client, GatewayIntentBits, REST, Routes } from 'discord.js';
import { MainHandler } from '@/infrastructure/handlers/MainHandler.js';

export async function startBot(handler : MainHandler) {
  const token = process.env.TOKEN ?? '';
  const appId = process.env.APP_ID ?? '';

  if (!token || !appId) {
    console.warn('TOKEN or APP_ID missing, bot will not start.');
    return;
  }

  const client = new Client({ intents: [GatewayIntentBits.Guilds] });



  client.once('clientReady', () => {
    console.log(`Logged in as ${client.user?.tag}`);
  });
  const definitions : string[]= [];

  // Register Each Command
  handler.handlers.forEach((value, key) => {
    definitions.push(value.getSlashCommand().toJSON());
    console.log('Registered /' + value.getSlashCommand().name + ' command');
  });

  const rest = new REST({ version: '10' }).setToken(token);
  await rest.put(Routes.applicationCommands(appId), { body: definitions });


  console.log('Registered all command');

  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    
    try {
      if (!handler.handlers.has(interaction.commandName)) {
        await interaction.reply({
          content: 'Unknown command!',
          ephemeral: true
        });
        return;
      }
      await handler.handlers.get(interaction.commandName)!.handleInteraction(interaction);
    } catch (error) {
      console.error('Error handling interaction:', error);
      
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: 'An error occurred while processing your command.',
          ephemeral: true
        });
      }
    }
  });

  await client.login(token);
}
