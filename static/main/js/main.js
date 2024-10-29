const teamMembers = [
    {
        name: "Member 1",
        role: "Developer",
        linkedin: "https://www.linkedin.com/company/daydream-technologies/",
        image: "../static/main/images/default-featured-image.png.jpg"
    },
    {
        name: "Member 2",
        role: "Designer",
        linkedin: "https://www.linkedin.com/company/daydream-technologies/",
        image: "../static/main/images/default-featured-image.png.jpg"
    },
    // Add more team members as needed
];

const projects = [
    {
        title: "Project 1",
        description: "Web Development",
        link: "https://example.com/project1",
        image: "../static/main/images/default-featured-image.png.jpg"
    },
    {
        title: "Project 2",
        description: "App Design",
        link: "https://example.com/project2",
        image: "../static/main/images/default-featured-image.png.jpg"
    },
    // Add more projects as needed
];

function renderTeamMembers() {
    const teamContainer = document.getElementById('team-container');
    if (teamContainer) {
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
}

function renderProjects() {
    const projectsContainer = document.getElementById('projects-container');
    if (projectsContainer) {
        projectsContainer.innerHTML = '';  // Clear existing projects (if any)

        projects.forEach(project => {
            const projectDiv = document.createElement('div');
            projectDiv.classList.add('project-card');

            projectDiv.innerHTML = `
                <div class="card">
                    <div class="card-front">
                        <img src="${project.image}" alt="${project.title}">
                        <h3>${project.title}</h3>
                        <p>${project.description}</p>
                    </div>
                    <div class="card-back">
                        <a href="${project.link}" target="_blank">Learn More</a>
                    </div>
                </div>
            `;
            
            projectsContainer.appendChild(projectDiv);
        });
    }
}

// Call the functions to render team members and projects on page load
document.addEventListener('DOMContentLoaded', () => {
    renderTeamMembers();
    renderProjects();
});
