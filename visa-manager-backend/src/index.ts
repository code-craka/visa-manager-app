import express from 'express';
import authRoutes from './routes/auth';
import clientRoutes from './routes/clients';
import taskRoutes from './routes/tasks';
import notificationRoutes from './routes/notifications';
import dashboardRoutes from './routes/dashboard.js';

const app = express();
const port = 3000;

app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});