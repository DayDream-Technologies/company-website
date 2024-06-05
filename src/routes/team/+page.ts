import type { PageLoad } from './$types';

interface TeamMember {
    name: string;
    role: string;
    image: string;
    bio: string;
}

export const load: PageLoad = async ({ fetch }) => {
    console.log('Fetching team data...');
    const response = await fetch('/api/team');
    const team: TeamMember[] = await response.json();
    console.log('Fetched team data:', team);
    return { team };
};