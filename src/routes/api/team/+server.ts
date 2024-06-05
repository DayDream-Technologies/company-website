import type { RequestHandler } from '@sveltejs/kit';
import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { ddbDocClient } from '$lib/dynamodb';

export const GET: RequestHandler = async () => {
    console.log('Received GET request for team');
    try {
        const params = {
            TableName: 'TeamMembers',
        };
        const command = new ScanCommand(params);
        const data = await ddbDocClient.send(command);
        console.log('Successfully fetched team data:', data.Items);

        return new Response(JSON.stringify(data.Items), {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        console.error('Error fetching team data:', error);

        return new Response(JSON.stringify({ error: 'Failed to fetch team data' }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
};