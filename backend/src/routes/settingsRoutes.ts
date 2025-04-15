import express, { Request, Response, NextFunction } from 'express';
import { getAllSettings, getSettingByKey, updateSetting, testConnection } from '../controllers/settingsController';

const router = express.Router();

router.get('/', (req: Request, res: Response, next: NextFunction) => {
  getAllSettings(req, res).catch(next);
});

router.get('/:key', (req: Request, res: Response, next: NextFunction) => {
  getSettingByKey(req, res).catch(next);
});

router.post('/', (req: Request, res: Response, next: NextFunction) => {
  updateSetting(req, res).catch(next);
});

router.post('/test-connection', (req: Request, res: Response, next: NextFunction) => {
  testConnection(req, res).catch(next);
});

export default router;
