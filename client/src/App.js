import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

class App extends Component {

    state = {
        data: null
    };


    // =============================================================================================
    render() {
        return (
            <div className="App">
				<header className="App-header">
					<img src={logo} className="App-logo" alt="logo" />
					<h1 className="App-title">Welcome to React</h1>
				</header>

				// Render the newly fetched data inside of this.state.data
				<div className="App-intro"><div dangerouslySetInnerHTML={ { __html:this.state.data && this.state.data.body } }></div></div>
            </div>
   		);
    };


	// =============================================================================================
	componentDidMount() {

    	// Call our fetch function below once the component mounts
		// this.callBackendAPI( 'profile' )
		// 	.then(res => {
		//
		// 		console.log( "profile", res );
		// 	} )
		// 	.catch(err => console.log( "error-profile", err ) );

		// Call our fetch function below once the component mounts
		this.callBackendAPI( 'stats' )
			.then(res => {

				console.log( "stats", res );
			} )
			.catch(err => console.log( "error-stats", err ) );

		// Call our fetch function below once the component mounts
		// this.callBackendAPI( 'player' )
		// 	.then(res => {
		//
		// 		console.log( "player", res );
		// 	} )
		// 	.catch(err => console.log( "error-player", err ) );

		// Call our fetch function below once the component mounts
		this.callBackendAPI( 'session' )
			.then(res => {

				console.log( "session", res );
			} )
			.catch(err => console.log( "error-session", err ) );
	};


	// Fetches our GET route from the Express server. (Note the route we are fetching matches the GET route from server.js
	// =============================================================================================
	callBackendAPI = async ( endpoint ) => {

		const response = await fetch(`/express_backend/${endpoint}`);

		await console.log( "callBackendAPI " + endpoint + ": " + response.status, response );

		const body = await response && response.json();

		if ( response.status !== 200 ) {
			throw Error( body.message )
		}

		return body;
	};
}

export default App;