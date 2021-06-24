const Header = (props) => {
	return (
		<div className="header">
			<img src="/icon.png" alt="Logo" width="40px" />
			<h2>McBroken</h2>
			{props.location && (
				<span className="last-update">
					last update {props.lastUpdate}, searching near {props.location.name}
				</span>
			)}
		</div>
	);
};

export default Header;
