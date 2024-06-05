import type { PageLoad } from './$types';

interface Project {
    name: string;
    description: string;
    details: string;
    image: string;
}

export const load: PageLoad = async ({ fetch }) => {
    console.log('Fetching projects data...');
    const response = await fetch('/api/projects');
    const projects: Project[] = await response.json();
    console.log('Fetched projects data:', projects);
    return { projects };
};