'use strict';


// REQUIRES
// -------------------------------------------------------------------------------------------------
const express = require( 'express' ),
	request = require( 'request' ),
	fs = require( 'fs' ),
	schedule = require( 'schedule' ),
	MongoClient = require('mongodb').MongoClient,
	ObjectID = require('mongodb').ObjectID;


// GLOBAL VARIABLES
// -------------------------------------------------------------------------------------------------
const app = express(),
	port = process.env.PORT || 5000,
	config = JSON.parse( fs.readFileSync( './config.json' ) );

let client;

let getStatsFromApiCron = schedule.scheduleJob('00 59 23 * *', function(){
	console.log('The answer to life, the universe, and everything!');
} );


/**
 *
 * @param client
 * @return {Promise<void>}
 */
async function listDatabases(){

	let databasesList = await client.db().admin().listDatabases();

	console.log("Databases:");

	databasesList.databases.forEach(db => console.log(` - ${db.name}`));
}


/**
 *
 * @return {Promise<void>}
 */
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

main().catch(console.error);

app.listen( port, () => console.log( `Listening on port ${ port }` ) );


// APEX API OPTIONS
// -------------------------------------------------------------------------------------------------
let platform = '5',
	platformUserIdentifier = config.ApexAPI.originId,
	segmentType = 'legend';


/**
 *
 * @param uri
 * @param res
 * @param callback
 */
function genReqOptions( uri, res, callback ) {
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


// ROUTES
// -------------------------------------------------------------------------------------------------
// GET ORIGIN PROFILE DATA
// app.get( '/express_backend/profile', ( req, res ) => {
//
// 	genReqOptions( `/profile/${platform}/${platformUserIdentifier}`, res, ( body ) => {
//
// 		if ( body.data ) body.data.segments.forEach( segment => {
//
// 			let obj = Object.assign( segment.metadata, { stats: segment.stats } );
//
// 			if ( segment.type === 'legend' && client.isConnected() )
// 				client.db( 'ApexLegends' ).collection( 'Legends' ).insertOne( obj, ( err, res ) => {
//
// 					if ( err ) return console.log( err );
//
// 					console.log( 'saved legend to database' );
// 				} );
//
// 			else console.log( "client not connected to database while fetching profile" );
// 		} );
// 	} );
// } );

// GET APEX ACCOUNT STATS
app.get( '/express_backend/stats', ( req, res ) => {

	genReqOptions( `/profile/${platform}/${platformUserIdentifier}/segments/${segmentType}`, res, ( body ) => {

		if ( body.data ) body.data.forEach( legend => {

			let obj = Object.assign( legend.metadata );

			if ( client.isConnected() ) {

				client.db( 'ApexLegends' ).collection( 'Legends' ).replaceOne( { name: obj.name }, {
					$set: obj ,
					$currentDate: { lastModified: true }
				}, { upsert: true }, ( err, res ) => {

					if ( err ) return console.log( err );

					console.log( 'saved legend stats to database: ' + obj.name, res.upsertedId && res.upsertedId._id, new ObjectID() );
				} );
			}

			else console.log( "client not connected to database while fetching legend stats" );
		} );
	} );
} );

// GET SESSION STATS WITH RECENT MATCHES
app.get( '/express_backend/session', ( req, res ) => {

	genReqOptions( `/profile/${platform}/${platformUserIdentifier}/sessions`, res, ( body ) => {

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
		} );
	} );
} );

// GET PLAYER STATS
// app.get( '/express_backend/player', ( req, res ) => {
//
// 	genReqOptions( `/search`, res, ( body ) => {
//
// 		// if ( body.data ) body.data.segments.forEach( segment => {
// 		//
// 		// 	let obj = Object.assign( segment.metadata, { stats: segment.stats } );
// 		//
// 		// 	if ( segment.type === 'legend' && client.isConnected() )
// 		// 		client.db( 'ApexLegends' ).collection( 'Matches' ).insertOne( obj, ( err, res ) => {
// 		//
// 		// 			if ( err ) return console.log( err );
// 		//
// 		// 			console.log( 'saved to database' );
// 		// 		} );
// 		// } );
// 	} );
// } );
