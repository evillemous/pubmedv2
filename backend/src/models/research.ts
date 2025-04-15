import pool from '../config/database';

interface ResearchProject {
  id?: string;
  title: string;
  type: string;
  population: string;
  outcomes: string;
  journal: string;
  manuscript?: string;
  stats?: any;
  created_at?: Date;
  updated_at?: Date;
}

export const getProjects = async (): Promise<ResearchProject[]> => {
  const result = await pool.query('SELECT * FROM research_projects ORDER BY created_at DESC');
  return result.rows;
};

export const getProject = async (id: string): Promise<ResearchProject | null> => {
  const result = await pool.query('SELECT * FROM research_projects WHERE id = $1', [id]);
  return result.rows.length > 0 ? result.rows[0] : null;
};

export const createProject = async (project: ResearchProject): Promise<ResearchProject> => {
  const { title, type, population, outcomes, journal, manuscript, stats } = project;
  const result = await pool.query(
    'INSERT INTO research_projects (title, type, population, outcomes, journal, manuscript, stats) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
    [title, type, population, outcomes, journal, manuscript || null, stats || null]
  );
  return result.rows[0];
};

export const updateProject = async (id: string, project: Partial<ResearchProject>): Promise<ResearchProject | null> => {
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(project)) {
    if (key !== 'id' && key !== 'created_at' && key !== 'updated_at') {
      updates.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  }

  updates.push(`updated_at = now()`);
  
  values.push(id);

  if (updates.length === 1) { // Only updated_at
    return null;
  }

  const query = `
    UPDATE research_projects 
    SET ${updates.join(', ')} 
    WHERE id = $${paramIndex} 
    RETURNING *
  `;

  const result = await pool.query(query, values);
  return result.rows.length > 0 ? result.rows[0] : null;
};

export const deleteProject = async (id: string): Promise<boolean> => {
  const result = await pool.query('DELETE FROM research_projects WHERE id = $1', [id]);
  return result.rowCount !== null && result.rowCount > 0;
};
