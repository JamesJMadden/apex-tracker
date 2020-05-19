'use strict';

const setAccountStats = require( './apex-api/profile-stats' ).setAccountStats;
const setAccountDailyStats = require( './apex-api/daily-stats' ).setAccountDailyStats;
const setSessionStats = require( './apex-api/match-stats' ).setSessionStats;
const listDatabases = require( './api/main' ).listDatabases;

const morgan = require( 'morgan' );
const compression = require( 'compression' );
const bodyParser = require( 'body-parser' );
const cors = require( 'cors' );
const errorHandler = require( 'errorhandler' );


// REQUIRES
// -------------------------------------------------------------------------------------------------
const express = require( 'express' ),
	fs = require( 'fs' ),
	MongoClient = require('mongodb').MongoClient;


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
const platform = '5',
	platformUserIdentifier = config.ApexAPI.originId,
	segmentType = 'legend';


/**
 *
 *
 * @return {Promise<void>}
 * ============================================================================================== */
const main = async () => {
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
};

main().catch( console.error );

setAccountStats( app, client, { platformUserIdentifier, segmentType, platform, expiryDate } );
setAccountDailyStats( app, client, { segmentType, platformUserIdentifier, platform } );
setSessionStats( app, client, request, { segmentType, platformUserIdentifier, platform } );

app.listen( port, () => console.log( `Listening on port ${ port }` ) );