import express, { Request, Response, NextFunction } from 'express';
import { 
  getAllProjects, 
  getProjectById, 
  createNewProject, 
  updateProjectById, 
  deleteProjectById 
} from '../controllers/researchController';

const router = express.Router();

router.get('/', (req: Request, res: Response, next: NextFunction) => {
  getAllProjects(req, res).catch(next);
});

router.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  getProjectById(req, res).catch(next);
});

router.post('/', (req: Request, res: Response, next: NextFunction) => {
  createNewProject(req, res).catch(next);
});

router.put('/:id', (req: Request, res: Response, next: NextFunction) => {
  updateProjectById(req, res).catch(next);
});

router.delete('/:id', (req: Request, res: Response, next: NextFunction) => {
  deleteProjectById(req, res).catch(next);
});

export default router;
