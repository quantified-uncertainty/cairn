const SCRY_API_KEY = process.env.EXOPRIORS_API_KEY;
const query = `SELECT title, url, source, published_at 
FROM documents 
WHERE scry.search(content, 'community notes twitter misinformation') 
ORDER BY published_at DESC 
LIMIT 10`;

const response = await fetch('https://exopriors.com/v1/scry/query', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${SCRY_API_KEY}`,
    'Content-Type': 'text/plain'
  },
  body: query
});

const data = await response.json();
console.log(JSON.stringify(data, null, 2));
