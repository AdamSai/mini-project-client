import React from 'react';
import { StyleSheet, Text, View, TextInput, Button } from 'react-native';
import { Constants, Location, MapView, Permissions } from 'expo';

export default class App extends React.Component {
	constructor(props) {
		super(props);
		this.state = { loggedin: false, statusBarHeight: Constants.statusBarHeight - 1 };
	}
	componentDidMount = () => {
		navigator.geolocation.getCurrentPosition(
			(position) => {
				this.setState({
					latitude: position.coords.latitude,
					longitude: position.coords.longitude
				});
			},
			(error) => {
				console.log(error);
			}
		);
		console.log(this.state);
	};
	onTextChange = (e, name) => {
		this.setState({
			[name]: e
		});
	};

	login = async () => {
		let { username, password, latitude, longitude, distance } = this.state;
		distance = Number(distance) * 1000;
		try {
			await fetch(
				'https://adsai.dk/api/login',
				makeOptions('POST', {
					username,
					password,
					latitude,
					longitude,
					distance
				})
			)
				.then(handleHttpErrors)
				.then((data) => {
					this.setState({ friends: data.friends, loggedin: true, errorMsg: undefined });
				});
		} catch (err) {
			err.fullError.then((e) =>
				this.setState({
					errorMsg: e.msg
				})
			);
		}
	};

	logout = () => {
		this.setState({
			loggedin: false,
			username: undefined,
			password: undefined,
			distance: undefined
		});
	};

	render() {
		return (
			<View style={{ flex: 1, paddingTop: this.state.statusBarHeight }}>
				<Text>{this.state.errorMsg ? this.state.errorMsg : ''}</Text>
				{this.state.loggedin ? (
					<MapViewer
						friends={this.state.friends}
						longitude={this.state.longitude}
						latitude={this.state.latitude}
						logout={this.logout}
					/>
				) : (
					<LoginForm onTextChange={this.onTextChange} login={this.login} />
				)}
			</View>
		);
	}
}

function LoginForm(props) {
	return (
		<View>
			<Text>Username: </Text>
			<TextInput
				type="text"
				name="username"
				onChangeText={(e) => props.onTextChange(e, 'username')}
				placeholder="Username"
			/>
			<Text>Password: </Text>
			<TextInput
				type="text"
				name="password"
				onChangeText={(e) => props.onTextChange(e, 'password')}
				placeholder="Password"
				secureTextEntry={true}
			/>
			<Text>Distance to find friends in km: </Text>
			<TextInput
				type="number"
				name="distance"
				onChangeText={(e) => props.onTextChange(e, 'distance')}
				placeholder="Distance to find friends within x km"
			/>
			<Button
				onPress={props.login}
				title="Login"
				color="#841584"
				accessibilityLabel="Press the button to login"
			/>
		</View>
	);
}

function MapViewer(props) {
	return (
		<View style={{ flex: 1, paddingTop: props.statusBarHeight }}>
			<MapView
				style={{ flex: 1 }}
				initialRegion={{
					latitude: props.latitude,
					longitude: props.longitude,
					latitudeDelta: 0.0922,
					longitudeDelta: 0.0421
				}}>
				<MapView.Marker
					coordinate={{
						longitude: props.longitude,
						latitude: props.latitude
					}}
					title="This is you :)"
				/>
				{MapFriends(props.friends)}
			</MapView>
			<Button
				onPress={props.logout}
				title="Logout"
				color="#841584"
				accessibilityLabel="Press the button to login"
			/>
		</View>
	);
}

function MapFriends(friendsList) {
	const newList = friendsList.map((friend, index) => {
		return (
			<MapView.Marker
				key={index}
				coordinate={{
					longitude: friend.longitude,
					latitude: friend.latitude
				}}
				title={friend.username}
			/>
		);
	});
	return newList;
}

function makeOptions(method, body) {
	var opts = {
		method: method,
		headers: {
			'Content-type': 'application/json',
			Accept: 'application/json'
		}
	};
	if (body) {
		opts.body = JSON.stringify(body);
	}
	return opts;
}

function handleHttpErrors(res) {
	if (!res.ok) {
		return Promise.reject({ status: res.status, fullError: res.json() });
	}
	return res.json();
}
