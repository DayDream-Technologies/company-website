const tst = document.querySelector('.menu_bar');
const dropdown = document.querySelector('.dropdown');

tst.addEventListener('click', event => {
    if (dropdown.style.display === 'none') {
        dropdown.style.display = 'grid';
        dropdown.style.gridTemplateColumns = '1fr';
        dropdown.style.gridTemplateRows = 'repeat(4, 50px)';
        dropdown.style.background = '#787d7a';
        dropdown.style.justifyItems = 'center';
        dropdown.style.alignItems = 'center';
        dropdown.style.width = '100%';
        dropdown.style.listStyleType = 'none';
        dropdown.style.position = 'fixed';
        dropdown.style.zIndex = '9999';
    }else{
        dropdown.style.display = 'none';
    }
})

// Function to handle dropdown visibility on resize
const handleResize = () => {
    if (window.innerWidth > 650) {
        dropdown.style.display = 'none'; // Ensure dropdown is hidden on larger screens
    }
};

// Initial check on page load
handleResize();

// Add resize event listener
window.addEventListener('resize', handleResize);

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

const projects = [
    {
        title: "Project Y",
        description: "Web Development",
        link: "home.html",
        image: "../static/main/images/proj-y.jpg"
    },
    {
        title: "Project X",
        description: "App Design",
        link: "home.html",
        image: "../static/main/images/proj-x.jpg"
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
    if (document.getElementById('team-container')) {
        renderTeamMembers();
    }
    if (document.getElementById('projects-container')) {
        renderProjects();
    }
});
