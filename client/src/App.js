import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

class App extends Component {


	// =============================================================================================
	constructor(props) {
		super(props);

		this.state = { data: null };

		this.saveToBackend = this.saveToBackend.bind(this);
	}


    // =============================================================================================
    render() {

		// TODO: CHECK LOGIN STATUS AND IF NOT LOGGED IN, RETURN SEPARATE MAIN VIEW

        return (
            <div className="App">
				<header className="App-header">
					<img src={logo} className="App-logo" alt="logo" />
					<h1 className="App-title">Welcome to React</h1>
				</header>

				// Render the newly fetched data inside of this.state.data
				<div className="App-intro">
					<div dangerouslySetInnerHTML={ { __html:this.state.data && this.state.data.body } }></div>

					<button onClick={this.saveToBackend.bind( null, 'stats' )}>Get Account Stats</button>
					<button onClick={this.saveToBackend.bind( null, 'stats_daily' )}>Get Account Daily Stats</button>
					<button onClick={this.saveToBackend.bind( null, 'session' )}>Get Session Stats</button>
				</div>
            </div>
   		);
    };


	// =============================================================================================
	componentDidMount( e ) {

	};


	// =============================================================================================
	saveToBackend( endpoint ) {

		// Call our fetch function below once the component mounts
		this.callBackendAPI( endpoint )
			.then(res => {

				console.log( endpoint, res );
			} )
			.catch(err => console.log( `error-${endpoint}`, err ) );
	};


	// Fetches our GET route from the Express server. (Note the route we are fetching matches the GET route from server.js
	// =============================================================================================
	callBackendAPI = async ( endpoint ) => {

		const response = await fetch(`/${endpoint}`);

		await console.log( "callBackendAPI " + endpoint + ": " + response.status, response );

		const body = await response && response.json();

		if ( response.status !== 200 ) {
			throw Error( body.message )
		}

		return body;
	};
}

export default App;