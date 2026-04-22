import { EmbedBuilder } from 'discord.js';

const WEATHER_IMAGE_BY_TYPE = {
  sun: 'https://openweathermap.org/img/wn/01d@4x.png',
  rain: 'https://openweathermap.org/img/wn/10d@4x.png',
  windy: 'https://openweathermap.org/img/wn/50d@4x.png',
};

function weatherCodeToDescription(code) {
  if (code === 0) {
    return 'Clear';
  }

  if ([1, 2].includes(code)) {
    return 'Partly cloudy';
  }

  if (code === 3) {
    return 'Overcast';
  }

  if ([45, 48].includes(code)) {
    return 'Fog';
  }

  if ([51, 53, 55, 56, 57].includes(code)) {
    return 'Drizzle';
  }

  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
    return 'Rain';
  }

  if ([71, 73, 75, 77, 85, 86].includes(code)) {
    return 'Snow';
  }

  if ([95, 96, 99].includes(code)) {
    return 'Thunderstorm';
  }

  return 'Unknown';
}

function weatherTypeFromCodeAndWind(code, windMph) {
  const rainyCodes = [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99];

  if (rainyCodes.includes(code)) {
    return 'rain';
  }

  if (windMph >= 20) {
    return 'windy';
  }

  return 'sun';
}

function formatPlace(result) {
  const parts = [result.name, result.admin1, result.country].filter(Boolean);
  return parts.join(', ');
}

async function getCoordinates(area) {
  const geocodeUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(area)}&count=1&language=en&format=json`;
  const geocodeResponse = await fetch(geocodeUrl);

  if (!geocodeResponse.ok) {
    throw new Error('geocode request failed');
  }

  const geocodeData = await geocodeResponse.json();
  return geocodeData.results?.[0] ?? null;
}

async function getCurrentWeather(latitude, longitude) {
  const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,wind_speed_10m&temperature_unit=fahrenheit&wind_speed_unit=mph`;
  const forecastResponse = await fetch(forecastUrl);

  if (!forecastResponse.ok) {
    throw new Error('forecast request failed');
  }

  const forecastData = await forecastResponse.json();
  return forecastData.current ?? null;
}

export async function weatherCommand(interaction, area) {
  await interaction.deferReply();

  try {
    const location = await getCoordinates(area);

    if (!location) {
      await interaction.editReply(`No area found for "${area}". Try a larger city or region.`);
      return;
    }

    const current = await getCurrentWeather(location.latitude, location.longitude);

    if (!current) {
      await interaction.editReply('Weather data is unavailable right now. Please try again in a moment.');
      return;
    }

    const weatherType = weatherTypeFromCodeAndWind(current.weather_code, current.wind_speed_10m);
    const weatherDescription = weatherCodeToDescription(current.weather_code);

    const embed = new EmbedBuilder()
      .setTitle(`Current weather: ${formatPlace(location)}`)
      .setDescription(`Type: ${weatherType}`)
      .addFields(
        {
          name: 'Condition',
          value: weatherDescription,
          inline: true,
        },
        {
          name: 'Temperature',
          value: `${Math.round(current.temperature_2m)} F`,
          inline: true,
        },
        {
          name: 'Wind',
          value: `${Math.round(current.wind_speed_10m)} mph`,
          inline: true,
        },
      )
      .setImage(WEATHER_IMAGE_BY_TYPE[weatherType])
      .setFooter({ text: 'Data source: Open-Meteo' })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch {
    await interaction.editReply('Could not fetch weather data right now. Please try again later.');
  }
}