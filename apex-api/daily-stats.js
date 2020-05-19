'use strict';

const makeRequest = require( '../api/main' ).makeRequest,
	express = require( 'express' ),
	router = express.Router();


/**
 *
 * @function setAccountDailyStats
 *
 * @description Get account stats and save to DB
 * ============================================================================================== */
const setAccountDailyStats = ( app, client, options ) => {

	return app.get( '/stats_daily', ( req, res ) => {

		makeRequest( `/profile/${options.platform}/${options.platformUserIdentifier}/segments/${options.segmentType}`, res, ( body ) => {

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
};

module.exports = { setAccountDailyStats };