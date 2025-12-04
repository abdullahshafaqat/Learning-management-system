import app from './app.js';
import config from './config/config.js';
import connectDB from './db/db.js';



connectDB();

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
