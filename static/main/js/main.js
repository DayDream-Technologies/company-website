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
    // Add more team members as needed
];

function renderTeamMembers() {
    const teamContainer = document.getElementById('team-container');
    teamContainer.innerHTML = '';  // Clear existing members (if any)

    teamMembers.forEach(member => {
        const memberDiv = document.createElement('div');
        memberDiv.classList.add('team-member');

        memberDiv.innerHTML = `
            <div class="card">
                <div class="card-front">
                    <img src="${member.image}" alt="${member.name}">
                    <h3>${member.name}</h3>
                    <p>Role: ${member.role}</p>
                </div>
                <div class="card-back">
                    <a href="${member.linkedin}" target="_blank">LinkedIn Profile</a>
                </div>
            </div>
        `;
        
        teamContainer.appendChild(memberDiv);
    });
}

// Call the function to render team members on page load
document.addEventListener('DOMContentLoaded', renderTeamMembers);
