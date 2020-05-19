'use strict';

const makeRequest = require( '../api/main' ).makeRequest,
	createCronJob = require( '../api/main' ).createCronJob,
	ObjectID = require( 'mongodb' ).ObjectID,
	express = require( 'express' ),
	router = express.Router();


/**
 *
 * @function setAccountStats
 *
 * @description Get account stats and save to DB
 * ============================================================================================== */
const setAccountStats = ( app, client, options ) => {

	let expiryDate = options.expiryDate;

	return app.get( '/stats', ( req, res ) => {

		makeRequest( `/profile/${options.platform}/${options.platformUserIdentifier}/segments/${options.segmentType}`, res,  body => {

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
};

module.exports = { setAccountStats };