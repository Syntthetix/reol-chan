const format = require('pg-format');
const pg = require('pg');
const fs = require('fs');

const { Command } = require('discord.js-commando');
const { addAlbum, addSong, populate } = require("../../modules/discography");
const { DISCOGRAPHY_ID } = require('../../constants.js');

module.exports = class InstagramCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'discography',
			group: 'admin',
			memberName: 'discography',
			description: '',
			details: '',
			args: [
				{
				key: 'action',
				prompt: '',
				type: 'string',
				default: '',
				infinite: false,
				wait: 1
			}, {
        key: 'type',
        prompt: '',
        type: 'string',
        default: '',
        infinite: false,
        wait: 1
      }, {
        key: 'details',
        prompt: '',
        type: 'string',
        default: '',
        infinite: false,
        wait: 1
      }]
		});
	};

  hasPermission(msg) {
    return this.client.isOwner(msg.author);
  }

	async run(msg, args) {
    if (args.action === 'add') {
      msg.reply(`Adding ${args.type}..`);
      if (args.type === 'album') {
        // add album, details: year,title,type,link,image
        const [year, title, type, link, image] = args.details.split(";");

        if (year === undefined || title === undefined || type === undefined || link === undefined || image === undefined) {
          catchErrors("Invalid parameters. Details must be in the format year;title;type;link;image.");
        } else {
          if (process.env.DATABASE_URL) {
            pg.connect(process.env.DATABASE_URL, (err, pg_client) => {
              if (err) catchErrors(err);
              addAlbum(pg_client, { year, title, type, link, image });
            })
          } else {
            var pg_client = new pg.Client();
            pg_client.connect((err) => {
              if (err) catchErrors(err);
              addAlbum(pg_client, { year, title, type, link, image });
            })
          }
        }
      } else if (args.type === 'song') {
        // add song, details: year,title,index,link,albumId
        const [year, title, index, link, albumId] = args.details.split(";");

        if (year === undefined || title === undefined || link === undefined) {
          catchErrors("Invalid parameters. Details must be in the format year;title;link;albumId.");
        } else {
          if (process.env.DATABASE_URL) {
            pg.connect(process.env.DATABASE_URL, (err, pg_client) => {
              if (err) catchErrors(err);
              addSong(pg_client, { year, title, index, link, albumId });
            })
          } else {
            var pg_client = new pg.Client();
            pg_client.connect((err) => {
              if (err) catchErrors(err);
              addSong(pg_client, { year, title, index, link, albumId });
            })
          }
        }
      }  else {
        msg.reply('Invalid type. Must be either "album" or "song".');
      }
    } else if (args.action === 'populate') {
      if (process.env.DATABASE_URL) {
        const pg_client = await pg.connect(process.env.DATABASE_URL);
        populate(pg_client, this.client);
      } else {
        var pg_client = new pg.Client();
        await pg_client.connect();
        populate(pg_client, this.client);
      }
    } else if (args.action === 'seed') {
      await fs.readFile('discography.json', async (err, data) => {
        const discogData = JSON.parse(data);
        let pg_client;

        if (process.env.DATABASE_URL) {
          pg_client = await pg.connect(process.env.DATABASE_URL);
        } else {
          pg_client = new pg.Client();
          await pg_client.connect();
        }
        await pg_client.query('TRUNCATE TABLE albums, songs RESTART IDENTITY');
        await Promise.all(Object.entries(discogData).map(async ([year, elements]) => {
          // insert albums;
          if (elements.albums) {
            const albumsToEnter = elements.albums.map(album => {
              const temp = album.split(";");
              return [year, temp[0], temp[1], temp[2], temp[3]];
            });
            await pg_client.query(format('INSERT INTO albums(year, title, type, image, link) VALUES %L', albumsToEnter));
          }

          // insert songs;
          if (elements.songs) {
            const songsToEnter = elements.songs.map(song => {
              const temp = song.split(";");
              return [year, temp[0], temp[1], temp[2], temp[3]];
            });

            await pg_client.query(format('INSERT INTO songs(year, title, link, "albumId", index) VALUES %L', songsToEnter));
          }

          return true;
        }));
      });
    }
	};
}