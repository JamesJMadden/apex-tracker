'use strict';


// REQUIRES
// -------------------------------------------------------------------------------------------------
const express = require( 'express' ),
	request = require( 'request' ),
	fs = require( 'fs' ),
	schedule = require( 'node-schedule' ),
	MongoClient = require('mongodb').MongoClient,
	ObjectID = require('mongodb').ObjectID;


// GLOBAL VARIABLES
// -------------------------------------------------------------------------------------------------
const app = express(),
	port = process.env.PORT || 5000,
	config = JSON.parse( fs.readFileSync( './config.json' ) );

let client,
	expiryDate = new Date();

expiryDate = expiryDate.setMinutes( expiryDate.getMinutes() + 5 );


// APEX API OPTIONS
// -------------------------------------------------------------------------------------------------
let platform = '5',
	platformUserIdentifier = config.ApexAPI.originId,
	segmentType = 'legend';


/**
 *
 * @return {Promise<void>}
 * ============================================================================================== */
async function main(){
	/**
	 * Connection URI. Update <username>, <password>, and <your-cluster-url> to reflect your cluster.
	 * See https://docs.mongodb.com/ecosystem/drivers/node/ for more details
	 */
	const mongoUri = `mongodb+srv://${config.MongoClient.username}:${encodeURI( config.MongoClient.password )}@${config.MongoClient.clusterurl}/test?retryWrites=true&w=majority`;

	client = new MongoClient( mongoUri, { useNewUrlParser: true } );

	try {
		// Connect to the MongoDB cluster
		await client.connect();

		// Make the appropriate DB calls
		await listDatabases( client );

	} catch (e) {
		console.error(e);

		await client.close();
	}
}


/**
 *
 * @function createCronJob
 *
 * @description Create a cron job
 *
 * @param expiryDate
 * @param func
 *
 * @return {Promise<void>}
 * ============================================================================================== */
function createCronJob( expiryDate, func ) {

	schedule.scheduleJob( expiryDate, () => {

		console.log( `Running Cron Job @ ${expiryDate} for ${func && func.name}` );

		func && func();
	} );
}


/**
 *
 * @function listDatabases
 *
 * @description lists available databases
 *
 * @return {Promise<void>}
 * ============================================================================================== */
async function listDatabases(){

	let databasesList = await client.db().admin().listDatabases();

	console.log("Databases:");

	databasesList.databases.forEach(db => console.log(` - ${db.name}`));
}


/**
 *
 * @function makeRequest
 *
 * @description makes request to supplied route on the Apex API
 *
 * @param uri
 * @param res
 * @param callback
 * ============================================================================================== */
function makeRequest( uri, res, callback ) {
	let options = {
		uri: config.ApexAPI.API  + uri,
		method: 'GET',
		json: true,
		headers: {
			'TRN-Api-Key': config.ApexAPI.APIKey
		}
	};

	request( options, ( error, response, body ) => {

		res.send( body );

		if ( callback && !error ) callback( body );
	} );
}


/**
 *
 * @function setAccountStats
 *
 * @description Get account stats and save to DB
 * ============================================================================================== */
function setAccountStats() {

	app.get( '/express_backend/stats', ( req, res ) => {

		makeRequest( `/profile/${platform}/${platformUserIdentifier}/segments/${segmentType}`, res, ( body ) => {

			if ( client.isConnected() ) {

				if ( body.data ) {


					// SAVE/UPDATE LEGENDS CURRENT STATS
					// -----------------------------------------------------------------------------
					body.data.forEach( legend => {

						let obj = Object.assign( legend.metadata );

						obj.stats = legend.stats;

						client.db( 'ApexLegends' ).collection( 'Legends' ).replaceOne( { name: obj.name }, {
							$set: obj,
							$currentDate: { lastModified: true }
						}, { upsert: true }, ( err, res ) => {

							if ( err ) return console.log( err );

							console.log( `saved legend stats to database: ${obj.name}`, res.upsertedId && res.upsertedId._id, new ObjectID() );
						} );

						expiryDate = legend.expiryDate;
					} );
				}

				createCronJob( expiryDate, setAccountStats );

			} else console.log( "client not connected to database while fetching legend stats" );
		} );
	} );
}


/**
 *
 * @function setAccountDailyStats
 *
 * @description Get account stats and save to DB
 * ============================================================================================== */
function setAccountDailyStats() {

	app.get( '/express_backend/stats_daily', ( req, res ) => {

		makeRequest( `/profile/${platform}/${platformUserIdentifier}/segments/${segmentType}`, res, ( body ) => {

			if ( client.isConnected() ) {

				if ( body.data ) {

					let obj = {};

					body.data.forEach( ( legend ) => {
						obj[ legend.metadata.name ] = {
							stats: legend.stats
						};
					} );

					client.db( 'ApexLegends' ).collection( 'LegendsDaily' ).insert( {
						createdAt: new Date().getTime(),
						data: obj
					}, {}, ( err, res ) => {
						console.log( `Record added as ${res}` );
					} );
				}

			} else console.log( "client not connected to database while fetching legend stats" );
		} );
	} );
}


/**
 *
 * @function setSessionStats
 *
 * @description Get session stats with recent matches and save to DB
 * ============================================================================================== */
function setSessionStats() {

	request({
		url: 'http://localhost:5000/express_backend/session', //on 3000 put your port no.
		method: 'POST',
		json: {
			template: template.toLowerCase(),
			obj: mailObj
		}
	}, function (error, response, body) {
		console.log({error: error, response: response, body: body});
	});

	app.get( '/express_backend/session', ( req, res ) => {

		makeRequest( `/profile/${platform}/${platformUserIdentifier}/sessions`, res, ( body ) => {

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
}

main().catch(console.error);

app.listen( port, () => console.log( `Listening on port ${ port }` ) );

setAccountStats();