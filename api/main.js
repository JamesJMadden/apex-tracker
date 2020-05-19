'use strict';

const fs = require( 'fs' ),
	schedule = require( 'node-schedule' ),
	request = require( 'request' ),
	config = JSON.parse( fs.readFileSync( './config.json' ) );


/**
 *
 * @function listDatabases
 *
 * @description lists available databases
 *
 * @return {Promise<void>}
 * ============================================================================================== */
const listDatabases = async client => {

	let databasesList = await client.db().admin().listDatabases();

	console.log("Databases:");

	databasesList.databases.forEach(db => console.log(` - ${db.name}`));
};


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
const makeRequest = ( uri, res, callback ) => {
	let options = {
		uri: config.ApexAPI.API + uri,
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
};


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
const createCronJob = ( expiryDate, func ) => {

	schedule.scheduleJob( expiryDate, () => {

		console.log( `Running Cron Job @ ${expiryDate} for ${func && func.name}` );

		func && func();
	} );
};

module.exports = { listDatabases, makeRequest, createCronJob };