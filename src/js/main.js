/********* Begin JS for the dropdown menu *********/
const menu_bar = document.querySelector('.menu_bar');
const dropdown = document.querySelector('.dropdown');

menu_bar.addEventListener('click', event => {
    if (dropdown.style.display === 'none' || dropdown.style.display === '') {
        dropdown.style.display = 'block';
        dropdown.style.maxHeight = '0';
        dropdown.style.transform = 'translateX(100%)';
        dropdown.style.padding = '15px';
        dropdown.style.transition = 'transform 0.1s ease-out, max-height 0s ease-out';
        dropdown.style.position = 'fixed';
        dropdown.style.top = '75px';
        dropdown.style.right = '0';
        dropdown.style.width = '150px';
        dropdown.style.height = 'calc(100vh - 75px)';
        dropdown.style.overflow = 'hidden';
        dropdown.style.borderTop = '1px solid #d8d9da';
        dropdown.style.borderLeft = '1px solid #d8d9da';
        dropdown.style.borderBottom = '1px solid #d8d9da';
        dropdown.style.borderRadius = '7px 0 0 7px';
        dropdown.style.background = '#787a7d';
        dropdown.style.justifyItems = 'center';
        dropdown.style.alignItems = 'center';
        dropdown.style.listStyleType = 'none';
        
        const items = dropdown.querySelectorAll('li');
        items.forEach(item => {
            item.style.marginBottom = '15px';  // Adjust margin as needed for spacing
        });

        setTimeout(function () {
            dropdown.style.transform = 'translateX(0)';
            dropdown.style.maxHeight = 'calc(100vh - 75px)';
        }, 10);
    } else {
        dropdown.style.display = 'none';
        dropdown.style.transform = 'translateX(100%)';
        dropdown.style.maxHeight = '0';
    }
})
/********* End JS for the dropdown menu *********/

// Function to handle dropdown visibility on resize
const handleResize = () => {
    if (window.innerWidth > 800) {
        dropdown.style.display = 'none';
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
        image: "./src/images/default_pic.jpg"
    },
    {
        name: "Member 2",
        role: "Designer",
        linkedin: "https://www.linkedin.com/company/daydream-technologies/",
        image: "./src/images/default_pic.jpg"
    },
    
    // Add more team members as needed
];

const projects = [
    {
        title: "Project Y",
        description: "Web Development",
        link: "home.html",
        image: "./src/images/proj-y.jpg"
    },
    {
        title: "Project X",
        description: "App Design",
        link: "home.html",
        image: "./src/images/proj-x.jpg"
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

/********* Begin JS for the contact form *********/
// JavaScript for additional email validation
const form = document.querySelector('.form');
const email = document.querySelector('#email');

form.addEventListener('submit', function (event) {
    // Simple email regex for validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email.value)) {
        // Prevent form submission if the email is invalid
        event.preventDefault();

        // Set a custom validity message
        email.setCustomValidity('Please enter a valid email address.');
    } else {
        // Reset the custom validity if the input is valid
        email.setCustomValidity('');
    }
});

// Reset custom validity message on every input change
email.addEventListener('input', function () {
    email.setCustomValidity(''); // Reset the custom error on input change
});
/********* End JS for the contact form *********/
