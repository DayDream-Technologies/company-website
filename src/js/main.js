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
        name: "Ricardo Rivera",
        linkedin: "https://www.linkedin.com/in/ricardo-rivera-0090931a2/?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app",
        image: "https://media.licdn.com/dms/image/v2/D5603AQEWxpuuQsIRcg/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/1670962545560?e=1737590400&v=beta&t=ay86MyY0gVbliNS1Wno1JzjlymxktOYlyqIzyvTEYrQ",
        team: "management"
    },
    {
        name: "David Wasilewski",
        linkedin: "https://www.linkedin.com/in/david-wasilewski/?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app",
        image: "https://media.licdn.com/dms/image/v2/D4E03AQFvtx7RpqgyBw/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/1729095015171?e=1737590400&v=beta&t=TcyGATLamskb9oaMLq86Co1qHD2lGTElYXG2S94tjOY",
        team: "management"
    },
    {
        name: "Andres Cornide",
        linkedin: "https://www.linkedin.com/company/daydream-technologies/",
        image: "",
        team: "management"
    },
    {
        name: "Gabe Moraru",
        role: "Mobile App Developer",
        linkedin: "https://www.linkedin.com/in/gabe-moraru",
        image: "https://media.licdn.com/dms/image/v2/D5603AQF9BUDyKnHJ_g/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/1718317398583?e=1737590400&v=beta&t=O95KxoB0_lYiiGnQ-k1wQkyGD6kcKJZ3CBSrYs0nigg",
        team: "management"
    },
    {
        name: "Reid Davison",
        linkedin: "https://www.linkedin.com/in/reidddavison/",
        image: "https://media.licdn.com/dms/image/v2/D5603AQGnE_nyBxfQaw/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/1690898317331?e=1737590400&v=beta&t=6JXro648PQMKhKh12CgCXQ3lb0K3uHrEyrVUEAknCus",
        team: "management"
    },
    {
        name: "Srujan Patil",
        linkedin: "https://www.linkedin.com/in/srujan-patil/",
        image: "https://media.licdn.com/dms/image/v2/D4D03AQFX5d7-lnFYrg/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1705280345028?e=1738800000&v=beta&t=Kzx2-tn_vncQVhXlU7CmKsfL4Oix7ufG6HiARdRT_mU",
        team: "webdev"
    },
    {
        name: "Erkin Tuna Gumustas",
        linkedin: "#",
        image: "./src/images/default_pic.jpg",
        team: "webdev"
    },
    {
        name: "Joeseph Biesiada",
        linkedin: "#",
        image: "./src/images/default_pic.jpg",
        team: "management"
    },
    {
        name: "Kaedan Palmitier",
        linkedin: "#",
        image: "./src/images/default_pic.jpg",
        team: "management"
    },
    {
        name: "Logan Flannery",
        linkedin: "#",
        image: "./src/images/default_pic.jpg",
        team: "webdev"
    },
    {
        name: "Quinn Goergen",
        linkedin: "#",
        image: "./src/images/default_pic.jpg",
        team: "management"
    },
    {
        name: "Thomas Laidlaw",
        linkedin: "#",
        image: "./src/images/default_pic.jpg",
        team: "management"
    },
    {
        name: "Tyler Mirabitur",
        linkedin: "#",
        image: "./src/images/default_pic.jpg",
        team: "webdev"
    }
];

const projects = [
    {
        title: "Dream Cards",
        description: "NFC cloud business cards",
        link: "#",
        image: "./src/images/proj-y.jpg"
    },
    {
        title: "Rubiks Cube",
        description: "Day Dream Technologies",
        link: "#",
        image: "./src/images/proj-x.jpg"
    },
];

function renderTeamMembers() {
    const teamContainer = document.getElementById('team-container');
    if (teamContainer) {
        teamContainer.innerHTML = ''; // Clear existing members (if any)

        // Group members by team
        const teams = {};
        teamMembers.forEach(member => {
            if (!teams[member.team]) {
                teams[member.team] = [];
            }
            teams[member.team].push(member);
        });

        // Render each team
        for (const team in teams) {
            // Create a section for the team
            const teamSection = document.createElement('div');
            teamSection.classList.add('team-section');
            teamSection.innerHTML = `<h2>${team.charAt(0).toUpperCase() + team.slice(1)} Team</h2>`;

            const membersContainer = document.createElement('div');
            membersContainer.classList.add('members-container');

            // Add members to the team section
            teams[team].forEach(member => {
                const memberDiv = document.createElement('div');
                memberDiv.classList.add('team-member');

                memberDiv.innerHTML = `
                    <div class="card">
                        <div class="card-front">
                            <img src="${member.image}" alt="${member.name}">
                            <h3>${member.name}</h3>
                        </div>
                        <div class="card-back">
                            <a href="${member.linkedin}" target="_blank">LinkedIn Profile</a>
                        </div>
                    </div>
                `;

                membersContainer.appendChild(memberDiv);
            });

            teamSection.appendChild(membersContainer);
            teamContainer.appendChild(teamSection);
        }
    }
}

/*
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
*/

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
