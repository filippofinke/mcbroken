const LocationForm = (props) => {
	return (
		<div className="location">
			<div className="form">
				<input type="text" onKeyPress={props.updateLocation} placeholder="Please insert your city" />
				<p>or</p>
				<button onClick={props.getCurrentLocation}>Get my location</button>
				<br />
				<br />
				<p>This way I can show the closest McDonalds to you!</p>
			</div>
		</div>
	);
};

export default LocationForm;
