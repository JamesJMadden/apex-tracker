'use strict';

const makeRequest = require( '../api/main' ).makeRequest,
	createCronJob = require( '../api/main' ).createCronJob,
	express = require( 'express' ),
	router = express.Router();


/**
 *
 * @function setSessionStats
 *
 * @description Get session stats with recent matches and save to DB
 * ============================================================================================== */
const setSessionStats = ( app, client, request, options ) => {

	let expiryDate = options.expiryDate,
		mailObj, template;

	request( {
		url: 'http://localhost:5000/session', //on 3000 put your port no.
		method: 'POST',
		json: {
			template: template.toLowerCase(),
			obj: mailObj
		}
	}, function (error, response, body) {
		console.log({error: error, response: response, body: body});
	} );

	return app.get( '/session', ( req, res ) => {

		makeRequest( `/profile/${options.platform}/${options.platformUserIdentifier}/sessions`, res, ( body ) => {

			if ( body.data ) body.data.items.forEach( item => {

				item.matches && item.matches.forEach( match => {

					let obj = {
						id: match.id,
						name: match.metadata.character.displayValue,
						imageUrl: match.metadata.characterIconUrl.value,
						bgImageUrl: match.metadata.legendBigImageUrl.value,
						date: match.metadata.endDate.value,
						stats: {
							kills: match.stats.kills && match.stats.kills.value,
							damage: match.stats.damage && match.stats.damage.value,
							season4Wins: match.stats.season4Wins && match.stats.season4Wins.value,
							rank: {
								rankScoreChange: match.stats.rankScoreChange.value,
								rankScore: match.stats.rankScore.value,
								rank: match.stats.rankScore.metadata.rankScoreInfo
							}
						}
					};

					// SAVE MATCHE TO DB
					if ( client.isConnected() )
						client.db( 'ApexLegends' ).collection( 'Matches' ).updateOne(
							{ id: obj.id },
							{
								$set: obj ,
								$currentDate: { lastModified: true }
							},
							{ upsert: true }, ( err, res ) => {

								if ( err ) return console.log( err );

								console.log( 'saved match to database: ' + obj.id );
							} );

					else console.log( "client not connected to database while fetching matches", res.upsertedId && res.upsertedId._id );
				} );

				expiryDate = item.expiryDate;
			} );

			createCronJob( expiryDate, setSessionStats );
		} );
	} );
};

module.exports = { setSessionStats };
