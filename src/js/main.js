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
/********* End JS for the dropdown menu *********/

const teamMembers = [
    {
        name: "Andres Cornide",
        linkedin: "#",
        image: "./src/images/default_pic.jpg", 
        team: "Admin"
    },
    {
        name: "Ricardo Rivera",
        linkedin: "https://www.linkedin.com/in/ricardo-rivera-0090931a2/?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app",
        image: "https://media.licdn.com/dms/image/v2/D4E03AQEoBYrEyUJmvg/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1732589181706?e=1740614400&v=beta&t=SyDK7M90NSfIBUe4g-tHspnAJSuoxMPLcEjtOCgPY5A",
        team: "Admin"
    },
    {
        name: "David Wasilewski",
        linkedin: "https://www.linkedin.com/in/david-wasilewski/?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app",
        image: "https://media.licdn.com/dms/image/v2/D4E03AQFvtx7RpqgyBw/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/1729095015171?e=1737590400&v=beta&t=TcyGATLamskb9oaMLq86Co1qHD2lGTElYXG2S94tjOY",
        team: "Admin"
    },
    {
        name: "Lewi Anamo",
        linkedin: "#",
        image: "./src/images/default_pic.jpg",
        team: "Backend Dev"
    },
    {
        name: "Milo",
        linkedin: "#",
        image: "./src/images/default_pic.jpg",
        team: "Backend Dev"
    },
    {
        name: "Joseph Biesiada",
        linkedin: "#",
        image: "./src/images/default_pic.jpg",
        team: "Cybersecurity/IT"
    },
    {
        name: "Thomas Laidlaw",
        linkedin: "#",
        image: "./src/images/default_pic.jpg",
        team: "Cybersecurity/IT"
    },
    {
        name: "Eli",
        linkedin: "#",
        image: "./src/images/default_pic.jpg",
        team: "Design"
    },
    {
        name: "Kaedan Palmitier",
        linkedin: "#",
        image: "./src/images/default_pic.jpg",
        team: "Design"
    },
    {
        name: "Reid Davison",
        linkedin: "https://www.linkedin.com/in/reidddavison/",
        image: "https://media.licdn.com/dms/image/v2/D5603AQGnE_nyBxfQaw/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/1690898317331?e=1737590400&v=beta&t=6JXro648PQMKhKh12CgCXQ3lb0K3uHrEyrVUEAknCus",
        team: "Design"
    },
    {
        name: "Emmanuel",
        linkedin: "#",
        image: "./src/images/default_pic.jpg",
        team: "Hardware dev"
    },
    {
        name: "Jake",
        linkedin: "#",
        image: "./src/images/default_pic.jpg",
        team: "Hardware dev"
    },
    {
        name: "Liam",
        linkedin: "#",
        image: "./src/images/default_pic.jpg",
        team: "Hardware dev"
    },
    {
        name: "Teo",
        linkedin: "#",
        image: "./src/images/default_pic.jpg",
        team: "Hardware dev"
    },
    {
        name: "Arman",
        linkedin: "#",
        image: "./src/images/default_pic.jpg",
        team: "Mobile app dev"
    },
    {
        name: "Deni",
        linkedin: "#",
        image: "./src/images/default_pic.jpg",
        team: "Mobile app dev"
    },
    {
        name: "Gabe Moraru",
        role: "Mobile App Developer",
        linkedin: "https://www.linkedin.com/in/gabe-moraru",
        image: "https://media.licdn.com/dms/image/v2/D5603AQF9BUDyKnHJ_g/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/1718317398583?e=1737590400&v=beta&t=O95KxoB0_lYiiGnQ-k1wQkyGD6kcKJZ3CBSrYs0nigg",
        team: "Mobile app dev"
    },
    {
        name: "Joe R",
        linkedin: "#",
        image: "./src/images/default_pic.jpg",
        team: "Mobile app dev"
    },
    {
        name: "Matt",
        linkedin: "#",
        image: "./src/images/default_pic.jpg",
        team: "Mobile app dev"
    },
    {
        name: "Jack",
        linkedin: "#",
        image: "./src/images/default_pic.jpg",
        team: "Mobile app dev/Web dev"
    },
    {
        name: "Srujan Patil",
        linkedin: "https://www.linkedin.com/in/srujan-patil/",
        image: "https://media.licdn.com/dms/image/v2/D4D03AQFX5d7-lnFYrg/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1705280345028?e=1738800000&v=beta&t=Kzx2-tn_vncQVhXlU7CmKsfL4Oix7ufG6HiARdRT_mU",
        team: "Full stack developer"
    },
    {
        name: "Erkin Tuna Gumustas",
        linkedin: "#",
        image: "./src/images/default_pic.jpg",
        team: "Web dev"
    },
    {
        name: "Logan Flannery",
        linkedin: "#",
        image: "./src/images/default_pic.jpg",
        team: "Web dev"
    },
    {
        name: "Quinn Goergen",
        linkedin: "#",
        image: "./src/images/default_pic.jpg",
        team: "Web dev"
    },
    {
        name: "Tyler Mirabitur",
        linkedin: "#",
        image: "./src/images/default_pic.jpg",
        team: "Web dev"
    },
    {
        name: "Jake",
        linkedin: "#",
        image: "./src/images/default_pic.jpg",
        team: "Hardware dev"
    },
    {
        name: "Humera Fatima",
        linkedin: "#",
        image: "./src/images/default_pic.jpg",
        team: "Design"
    }
];

const projects = [
    {
        title: "Dream Cards",
        description: "NFC cloud business cards",
        link: "#",
        image: "./src/images/cards-img.png"
    },
    {
        title: "Rubiks Cube",
        description: "Day Dream Technologies",
        link: "#",
        image: "./src/images/rubiks-cube.png"
    },
];

function renderTeamMembers(team = 'all') {
    const teamContainer = document.getElementById('team-container');
    if (teamContainer) {
        teamContainer.innerHTML = '';

        teamMembers
            .filter(member => team === 'all' || member.team === team)
            .forEach(member => {
                if (member.linkedin != '#' && member.image != './src/images/default_pic.jpg') {
                    const memberDiv = document.createElement('div');
                    memberDiv.classList.add('team-member');

                    memberDiv.innerHTML = `
                        <div class="card">
                            <div class="card-front">
                                <img src="${member.image}" alt="${member.name}">
                                <h3>${member.name}</h3>
                                <p>${member.team}</p>
                            </div>
                            <div class="card-back">
                                <a href="${member.linkedin}" target="_blank">LinkedIn Profile</a>
                            </div>
                        </div>
                    `;
                    
                    teamContainer.appendChild(memberDiv);
                }
            });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('team-container')) {
        renderTeamMembers();

        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                const team = button.dataset.team;
                renderTeamMembers(team);
            });
        });
    }
});

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
