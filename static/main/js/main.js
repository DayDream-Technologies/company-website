const teamMembers = [
    {
        name: "Member 1",
        role: "Developer",
        linkedin: "https://www.linkedin.com/company/daydream-technologies/",
        image: "../static/main/images/default_pic.jpg"
    },
    {
        name: "Member 2",
        role: "Designer",
        linkedin: "https://www.linkedin.com/company/daydream-technologies/",
        image: "../static/main/images/default_pic.jpg"
    },
    {
        name: "Member 1",
        role: "Developer",
        linkedin: "https://www.linkedin.com/company/daydream-technologies/",
        image: "../static/main/images/default_pic.jpg"
    },
    {
        name: "Member 2",
        role: "Designer",
        linkedin: "https://www.linkedin.com/company/daydream-technologies/",
        image: "../static/main/images/default_pic.jpg"
    },
    {
        name: "Member 1",
        role: "Developer",
        linkedin: "https://www.linkedin.com/company/daydream-technologies/",
        image: "../static/main/images/default_pic.jpg"
    },
    {
        name: "Member 2",
        role: "Designer",
        linkedin: "https://www.linkedin.com/company/daydream-technologies/",
        image: "../static/main/images/default_pic.jpg"
    },
    // Add more team members here
];

// Function to render team members on the team page
function renderTeamMembers() {
    const teamContainer = document.getElementById('team-container');
    teamContainer.innerHTML = '';  // Clear existing members (if any)

    teamMembers.forEach(member => {
        const memberDiv = document.createElement('div');
        memberDiv.classList.add('team-member');

        memberDiv.innerHTML = `
            <a target="_blank" href="${member.linkedin}" title="${member.name}'s LinkedIn">
                <img src="${member.image}" alt="${member.name}">
            </a>
            <h3>${member.name}</h3>
            <p>Role: ${member.role}</p>
        `;
        
        teamContainer.appendChild(memberDiv);
    });
}

// Call the function to render team members on page load
document.addEventListener('DOMContentLoaded', renderTeamMembers);
