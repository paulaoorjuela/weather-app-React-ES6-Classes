import React from "react";
function getWeatherIcon(wmoCode) {
  const icons = new Map([
    [[0], "☀️"],
    [[1], "🌤"],
    [[2], "⛅️"],
    [[3], "☁️"],
    [[45, 48], "🌫"],
    [[51, 56, 61, 66, 80], "🌦"],
    [[53, 55, 63, 65, 57, 67, 81, 82], "🌧"],
    [[71, 73, 75, 77, 85, 86], "🌨"],
    [[95], "🌩"],
    [[96, 99], "⛈"],
  ]);
  const arr = [...icons.keys()].find((key) => key.includes(wmoCode));
  if (!arr) return "NOT FOUND";
  return icons.get(arr);
}

function convertToFlag(countryCode) {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt());
  return String.fromCodePoint(...codePoints);
}

function formatDay(dateStr) {
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
  }).format(new Date(dateStr));
}

class App extends React.Component {
  state = {
    location: "",
    isLoading: false,
    displayLocation: "",
    weather: {},
  };

  fetchWeather = async () => {
    if (this.state.location.length < 2) return this.setState({ weather: {} }); // don't fetch if input is too short
    try {
      this.setState({ isLoading: true });
      // 1) Getting location (geocoding)
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${this.state.location}`
      );
      const geoData = await geoRes.json();
      console.log(geoData);

      if (!geoData.results) throw new Error("Location not found");

      const { latitude, longitude, timezone, name, country_code } =
        geoData.results.at(0);
      this.setState({
        displayLocation: `${name} ${convertToFlag(country_code)}`,
      });

      // 2) Getting actual weather
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&timezone=${timezone}&daily=weathercode,temperature_2m_max,temperature_2m_min`
      );
      const weatherData = await weatherRes.json();
      this.setState({ weather: weatherData.daily });
    } catch (err) {
      console.err(err);
    } finally {
      this.setState({ isLoading: false });
    }
  };

  // handleSearch = () => this.fetchWeather();

  setLocation = (e) => this.setState({ location: e.target.value });

  // is like useEffect with an empty depenecy array []
  componentDidMount() {
    // only runs on mount not reReders
    this.setState({ location: localStorage.getItem("location") || "" });
  }

  // is like useEffect with a depenecy array [location]
  componentDidUpdate(prevProps, prevState) {
    // only runs on rerender
    if (this.state.location !== prevState.location) {
      // fetches the location when it changes / as i type in the input
      this.fetchWeather();
      localStorage.setItem("location", this.state.location);
    }
  }

  render() {
    const date = new Date("june 21 2027");
    date.setDate(date.getDate() + this.state.count);
    return (
      <div className="app">
        <h1>Weather App</h1>
        <Input
          location={this.state.location}
          onChangeLocation={this.setLocation}
        />
        {this.state.isLoading && <p className="loader">Loading...</p>}

        {this.state.weather.weathercode && (
          <Weather
            weather={this.state.weather}
            location={this.state.displayLocation}
          />
        )}
      </div>
    );
  }
}

export default App;

class Input extends React.Component {
  render() {
    return (
      <div>
        <input
          type="text"
          placeholder="Search any location..."
          value={this.props.location}
          onChange={this.props.onChangeLocation}
        />
      </div>
    );
  }
}

class Weather extends React.Component {
  componentWillUnmount() {
    console.log("Weather component is being removed from the DOM");
  }
  render() {
    const {
      temperature_2m_max: max,
      temperature_2m_min: min,
      time: dates,
      weathercode: codes,
    } = this.props.weather;
    return (
      <div>
        <h2>Weather this week for <strong>{this.props.location}</strong></h2>
        <ul className="weather">
          {dates.map((date, i) => (
            <Day
              date={date}
              max={max.at(i)}
              min={min.at(i)}
              code={codes.at(i)}
              key={date}
              isToday={i === 0}
            />
          ))}
        </ul>
      </div>
    );
  }
}

class Day extends React.Component {
  render() {
    const { date, max, min, code, isToday } = this.props;
    return (
      <li className="day">
        <span>{getWeatherIcon(code)}</span>
        <p>{isToday ? "Today" : formatDay(date)}</p>
        <p style={{fontSize: '13px'}}>
          {Math.floor(max)}&deg;C - {Math.ceil(min)}&deg;C
        </p>
      </li>
    );
  }
}
