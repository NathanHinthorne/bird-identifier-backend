import express, { Router } from 'express';

import { birdRouter } from './birds';
// Import additional routers here

const openRoutes: Router = express.Router();

openRoutes.use('/birds', birdRouter);
// Use additional routers here

export { openRoutes };
