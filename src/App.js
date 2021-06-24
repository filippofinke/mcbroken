import React, { useEffect, useState } from "react";
import Header from "./components/Header.js";
import Footer from "./components/Footer.js";
import LocationForm from "./components/LocationForm";
import { getDistance, getCityFromLatLng, getLatLngFromCity } from "./Utils.js";

function App() {
	let [location, setLocation] = useState(null);
	let [lastUpdate, setLastUpdate] = useState(null);
	let [restaurants, setRestaurants] = useState([]);

	const updateList = async (latitude, longitude, rest = null) => {
		getCityFromLatLng(latitude, longitude).then((name) => {
			let location = {
				latitude,
				longitude,
				name,
			};

			setLocation(location);
			localStorage.setItem("location", JSON.stringify(location));
		});

		let copy = rest || [...restaurants];

		copy.forEach((restaurant) => {
			restaurant.distance = getDistance(restaurant.latitude, restaurant.longitude, latitude, longitude);
		});

		copy.sort((a, b) => {
			if (a.distance > b.distance) return 1;
			if (a.distance < b.distance) return -1;
			return 0;
		});

		setRestaurants(copy);
	};

	const updateLocation = async (event) => {
		if (event.key === "Enter") {
			let { latitude, longitude } = await getLatLngFromCity(event.target.value);
			updateList(latitude, longitude);
		}
	};

	const getCurrentLocation = () => {
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(
				(data) => {
					let {
						coords: { latitude, longitude },
					} = data;
					updateList(latitude, longitude);
				},
				(error) => {
					alert(error.message);
				}
			);
		}
	};

	useEffect(() => {
		fetch("/restaurants")
			.then((r) => r.json())
			.then((rest) => {
				setLastUpdate(
					new Date(rest.updatedAt).toLocaleTimeString([], {
						hour: "2-digit",
						minute: "2-digit",
					})
				);
				let loc = JSON.parse(localStorage.getItem("location"));
				if (loc && loc.latitude && loc.longitude) {
					updateList(loc.latitude, loc.longitude, rest.data);
				} else {
					setRestaurants(rest.data);
				}
			});
		// eslint-disable-next-line
	}, []);

	return (
		<React.Fragment>
			<Header lastUpdate={lastUpdate} location={location} />
			{!location && <LocationForm updateLocation={updateLocation} getCurrentLocation={getCurrentLocation} />}

			<div className="container">
				<div className="restaurants-list">
					{restaurants.map((restaurant) => {
						let address = `${restaurant.latitude},${restaurant.longitude}`;

						let status = "unknown";
						let broken = [];
						if (restaurant.status) {
							for (let mcflurry in restaurant.status) {
								if (!restaurant.status[mcflurry]) {
									broken.push(mcflurry);
								}
							}

							if (broken.length === 0) {
								status = "success";
							} else if (broken.length === Object.keys(restaurant.status).length) {
								status = "error";
							} else {
								status = "warning";
							}
						}

						return (
							<div key={restaurant.rid} className="restaurant">
								<span className={`status ${status}`}></span>
								<h3>{restaurant.name}</h3>
								{broken.length > 0 && (
									<React.Fragment>
										<span className="not-available">McFlurry {broken.join(", ")}</span>
										<br />
									</React.Fragment>
								)}
								<span>
									<a href={`https://maps.apple.com/maps?q=${address}`} target="_blank" rel="noreferrer">
										{restaurant.addressLine1}
									</a>
								</span>
								<br />
								<span>
									<a href={`tel:${restaurant.phone?.split(" ").join("")}`}>{restaurant.phone}</a>
								</span>
							</div>
						);
					})}
				</div>
			</div>

			<Footer />
		</React.Fragment>
	);
}

export default App;
