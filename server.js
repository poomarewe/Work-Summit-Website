import app from './server/app.js';

const port = Number(process.env.PORT || 3001);

app.listen(port, () => {
  console.log(`API server listening on http://localhost:${port}`);
});
