import app from './src/app.js';
import config from './src/config/config.js';
import connectDB from './src/db/db.js';


connectDB();

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
