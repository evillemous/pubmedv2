import { Request, Response } from 'express';
import { getProjects, getProject, createProject, updateProject, deleteProject } from '../models/research';

export const getAllProjects = async (req: Request, res: Response) => {
  try {
    const projects = await getProjects();
    res.json(projects);
  } catch (error: any) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
};

export const getProjectById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const project = await getProject(id);
    
    if (!project) {
      return res.status(404).json({ error: `Project with ID ${id} not found` });
    }
    
    res.json(project);
  } catch (error: any) {
    console.error(`Error fetching project:`, error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
};

export const createNewProject = async (req: Request, res: Response) => {
  try {
    console.log('Creating new project with request body:', JSON.stringify(req.body, null, 2));
    
    const { title, type, population, outcomes, journal } = req.body;
    
    console.log('Extracted fields:', { title, type, population, outcomes, journal });
    
    if (!title || !type || !population || !outcomes || !journal) {
      console.log('Missing required fields:', { 
        title: !!title, 
        type: !!type, 
        population: !!population, 
        outcomes: !!outcomes, 
        journal: !!journal 
      });
      
      return res.status(400).json({ 
        error: 'Missing required fields', 
        required: ['title', 'type', 'population', 'outcomes', 'journal'] 
      });
    }
    
    console.log('All required fields present, creating project in database');
    
    try {
      const project = await createProject({
        title,
        type,
        population,
        outcomes,
        journal,
        manuscript: req.body.manuscript,
        stats: req.body.stats
      });
      
      console.log('Project created successfully:', project);
      res.status(201).json(project);
    } catch (dbError: any) {
      console.error('Database error creating project:', dbError);
      console.error('SQL error details:', dbError.code, dbError.detail, dbError.constraint);
      throw dbError;
    }
  } catch (error: any) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project', message: error.message });
  }
};

export const updateProjectById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, type, population, outcomes, journal, manuscript, stats } = req.body;
    
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (type !== undefined) updateData.type = type;
    if (population !== undefined) updateData.population = population;
    if (outcomes !== undefined) updateData.outcomes = outcomes;
    if (journal !== undefined) updateData.journal = journal;
    if (manuscript !== undefined) updateData.manuscript = manuscript;
    if (stats !== undefined) updateData.stats = stats;
    
    const updatedProject = await updateProject(id, updateData);
    
    if (!updatedProject) {
      return res.status(404).json({ error: `Project with ID ${id} not found or no fields to update` });
    }
    
    res.json(updatedProject);
  } catch (error: any) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
};

export const deleteProjectById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await deleteProject(id);
    
    if (!deleted) {
      return res.status(404).json({ error: `Project with ID ${id} not found` });
    }
    
    res.json({ message: `Project with ID ${id} successfully deleted` });
  } catch (error: any) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
};
