/**
 * Metaforecast GraphQL Client
 *
 * Provides typed access to the Metaforecast API.
 */

const METAFORECAST_API = 'https://metaforecast.org/api/graphql';

/**
 * Search for forecasts matching a query
 */
export async function searchForecasts(query, options = {}) {
  const {
    forecastingPlatforms = null,
    starsThreshold = 2,
    forecastsThreshold = null,
    limit = 10
  } = options;

  const graphqlQuery = `
    query SearchForecasts($input: SearchInput!) {
      searchQuestions(input: $input) {
        id
        title
        description
        url
        fetched
        options {
          name
          probability
        }
        platform {
          id
          label
        }
        qualityIndicators {
          stars
          numForecasters
          numForecasts
        }
      }
    }
  `;

  const variables = {
    input: {
      query,
      forecastingPlatforms,
      starsThreshold,
      forecastsThreshold,
      limit
    }
  };

  try {
    const response = await fetch(METAFORECAST_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Cairn-Wiki/1.0'
      },
      body: JSON.stringify({
        query: graphqlQuery,
        variables
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.errors) {
      throw new Error(`GraphQL error: ${data.errors[0].message}`);
    }

    return data.data.searchQuestions || [];
  } catch (err) {
    throw new Error(`Metaforecast API error: ${err.message}`);
  }
}

/**
 * Get a specific forecast by ID
 */
export async function getForecast(id) {
  const graphqlQuery = `
    query GetQuestion($id: ID!) {
      question(id: $id) {
        id
        title
        description
        url
        fetched
        firstSeen
        options {
          name
          probability
        }
        platform {
          id
          label
        }
        qualityIndicators {
          stars
          numForecasters
          numForecasts
          liquidity
          volume
        }
        history {
          id
          timestamp
          options {
            name
            probability
          }
        }
      }
    }
  `;

  const response = await fetch(METAFORECAST_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Cairn-Wiki/1.0'
    },
    body: JSON.stringify({
      query: graphqlQuery,
      variables: { id }
    })
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();

  if (data.errors) {
    throw new Error(`GraphQL error: ${data.errors[0].message}`);
  }

  return data.data.question;
}

/**
 * Get multiple forecasts by IDs (batched)
 */
export async function getForecastsBatch(ids) {
  // GraphQL doesn't support batch queries easily, so fetch sequentially with rate limiting
  const forecasts = [];

  for (const id of ids) {
    try {
      const forecast = await getForecast(id);
      if (forecast) {
        forecasts.push(forecast);
      }
    } catch (err) {
      console.error(`Failed to fetch forecast ${id}: ${err.message}`);
    }

    // Rate limiting: 1 request per second
    if (ids.indexOf(id) < ids.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return forecasts;
}

/**
 * Score relevance of a forecast to a wiki page
 *
 * @param {Object} page - Page metadata
 * @param {Object} forecast - Forecast data from Metaforecast
 * @param {string} discoveryType - How was this forecast found? (title, tag, phrase)
 * @returns {number} Relevance score (0-1)
 */
export function scoreRelevance(page, forecast, discoveryType) {
  let score = 0;

  // Base score by discovery type
  const baseScores = {
    title: 0.8,
    tag: 0.6,
    phrase: 0.4
  };
  score = baseScores[discoveryType] || 0.5;

  // Boost by quality indicators
  const stars = forecast.qualityIndicators?.stars || 0;
  score += (stars / 5) * 0.2; // Up to +0.2 for 5-star forecasts

  const numForecasters = forecast.qualityIndicators?.numForecasters || 0;
  if (numForecasters > 50) score += 0.1;
  else if (numForecasters > 10) score += 0.05;

  // Penalize if title doesn't overlap with page title
  const pageTitleWords = new Set(
    page.title.toLowerCase().split(/\s+/).filter(w => w.length > 3)
  );
  const forecastTitleWords = new Set(
    forecast.title.toLowerCase().split(/\s+/).filter(w => w.length > 3)
  );

  const overlap = [...pageTitleWords].filter(w => forecastTitleWords.has(w)).length;
  if (overlap === 0 && discoveryType === 'title') {
    score *= 0.7; // Penalize if no word overlap
  } else if (overlap > 0) {
    score += overlap * 0.05; // Bonus for word overlap
  }

  // Penalize if forecast is stale (>6 months)
  if (forecast.fetched) {
    const daysSinceUpdate = (Date.now() - new Date(forecast.fetched)) / (1000 * 60 * 60 * 24);
    if (daysSinceUpdate > 180) score *= 0.8;
  }

  return Math.min(score, 1.0); // Cap at 1.0
}

/**
 * Get list of supported forecasting platforms
 */
export async function getPlatforms() {
  const graphqlQuery = `
    query GetPlatforms {
      platforms {
        id
        label
        lastUpdated
      }
    }
  `;

  const response = await fetch(METAFORECAST_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Cairn-Wiki/1.0'
    },
    body: JSON.stringify({ query: graphqlQuery })
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();

  if (data.errors) {
    throw new Error(`GraphQL error: ${data.errors[0].message}`);
  }

  return data.data.platforms || [];
}
