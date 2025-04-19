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
        linkedin: "https://www.linkedin.com/in/andres-cornide/",
        image: "https://media.licdn.com/dms/image/v2/D4E03AQFuhrKSSr7iiw/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1691001123915?e=1741219200&v=beta&t=VvvRdIjgBJsLFMzge23n4D5CFKKFmzX08mgVNsxeqv0", 
        team: "CFO"
    },
    {
        name: "Ricardo Rivera",
        linkedin: "https://www.linkedin.com/in/ricardo-rivera-0090931a2/?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app",
        image: "https://media.licdn.com/dms/image/v2/D4E03AQEoBYrEyUJmvg/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1732589181706?e=1740614400&v=beta&t=SyDK7M90NSfIBUe4g-tHspnAJSuoxMPLcEjtOCgPY5A",
        team: "CEO"
    },
    {
        name: "David Wasilewski",
        linkedin: "https://www.linkedin.com/in/david-wasilewski/?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app",
        image: "https://media.licdn.com/dms/image/v2/D4E03AQFvtx7RpqgyBw/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/1729095015171?e=1737590400&v=beta&t=TcyGATLamskb9oaMLq86Co1qHD2lGTElYXG2S94tjOY",
        team: "CTO"
    },
    {
        name: "Milo Baran",
        linkedin: "https://www.linkedin.com/in/milo-baran-822a4126a/",
        image: "https://media.licdn.com/dms/image/v2/D4E03AQGiJwE3Q5l0-Q/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1730849446933?e=1741219200&v=beta&t=to0LwE1F_yLEysY486nA8IdGKJAEiisgDJsVQDYM-Oo",
        team: "Software Developer"
    },
    {
        name: "Joseph Biesiada",
        linkedin: "#",
        image: "./src/images/default_pic.jpg",
        team: "Cybersecurity Consultant"
    },
    {
        name: "Thomas Laidlaw",
        linkedin: "https://www.linkedin.com/in/thomaslaidlaw284/",
        image: "https://media.licdn.com/dms/image/v2/D5603AQHeMwN-NHCikQ/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1700099652007?e=1741219200&v=beta&t=eN9---QBZh0k3FEUe7kACb3zrSWEQelhBGJDnOqctM8",
        team: "Cybersecurity Consultant"
    },
    {
        name: "Eli Klunder",
        linkedin: "https://www.linkedin.com/in/eli-klunder-9822a7270/",
        image: "https://media.licdn.com/dms/image/v2/D5635AQFwVaxJhe6tNg/profile-framedphoto-shrink_400_400/profile-framedphoto-shrink_400_400/0/1690984842227?e=1736388000&v=beta&t=KWm0Dhgq9gOo2DzXeyvvoKBTo10ZcRmuv5uwWPx5MSo",
        team: "DSoftware Developer"
    },
    {
        name: "Kaedan Palmitier",
        linkedin: "https://www.linkedin.com/in/kaeden-palmitier-769940259/",
        image: "https://media.licdn.com/dms/image/v2/D5603AQEHUXQLxeZSJQ/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1672692060654?e=1741219200&v=beta&t=4TL746QGCeuPJgaNi1b1wSoK0rmHhYoF3E12o97nekY",
        team: "Graphic Design Consultant"
    },
    {
        name: "Reid Davison",
        linkedin: "https://www.linkedin.com/in/reidddavison/",
        image: "https://media.licdn.com/dms/image/v2/D5603AQGnE_nyBxfQaw/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/1690898317331?e=1737590400&v=beta&t=6JXro648PQMKhKh12CgCXQ3lb0K3uHrEyrVUEAknCus",
        team: "UI/UX Designer"
    },
    {
        name: "Emmanuel Butsana",
        linkedin: "https://www.linkedin.com/in/emmanuel-ze-butsana/",
        image: "https://media.licdn.com/dms/image/v2/D4E03AQHUVzUHLJ2NFA/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1693768998993?e=1741219200&v=beta&t=3og-TtdDZ69zx0eRjVmsVlfrw60-0iM93YYfankZJbk",
        team: "Hardware Developer"
    },
    {
        name: "Jake Jackson",
        linkedin: "#",
        image: "./src/images/default_pic.jpg",
        team: "Hardware Developer"
    },
    {
        name: "Liam Sweetman",
        linkedin: "#",
        image: "./src/images/default_pic.jpg",
        team: "Hardware Developer"
    },
    {
        name: "Teo",
        linkedin: "#",
        image: "./src/images/default_pic.jpg",
        team: "Hardware Developer"
    },
    {
        name: "Arman",
        linkedin: "https://www.linkedin.com/in/arman-khan-17a365288/",
        image: "https://media.licdn.com/dms/image/v2/D4E03AQG2vDjlzs0-NQ/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1719433269121?e=1741219200&v=beta&t=poF--GqKPpnirI4-K_LgYcp0pgduQdCV2vxHucUlWMI",
        team: "Mobile App Developer"
    },
    {
        name: "Deni Tepic",
        linkedin: "https://www.linkedin.com/in/denitepic/",
        image: "https://media.licdn.com/dms/image/v2/D5603AQEwzgQaF-UVNg/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1666900364438?e=1741219200&v=beta&t=W2GRQZFi8PKzg8ZjGwPloAOwcXEcsIx3VKGirobto9A",
        team: "Social Media Consultant"
    },
    {
        name: "Gabe Moraru",
        role: "Mobile App Developer",
        linkedin: "https://www.linkedin.com/in/gabe-moraru",
        image: "https://media.licdn.com/dms/image/v2/D5603AQF9BUDyKnHJ_g/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/1718317398583?e=1737590400&v=beta&t=O95KxoB0_lYiiGnQ-k1wQkyGD6kcKJZ3CBSrYs0nigg",
        team: "Software Developer"
    },
    {
        name: "Joe Robertson",
        linkedin: "#",
        image: "./src/images/default_pic.jpg",
        team: "Software Developer"
    },
    {
        name: "Matt Willemin",
        linkedin: "https://www.linkedin.com/in/matt-willemin/",
        image: "https://media.licdn.com/dms/image/v2/D5603AQHgsnYVNVfLLQ/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1719518593039?e=1741219200&v=beta&t=tjBXYPkBFPo5UTKhGvvrSLOM5GX5AZXDjymWilR9SnM",
        team: "Software Developer"
    },
    {
        name: "Jack Baldwin",
        linkedin: "https://www.linkedin.com/in/jackson-baldwin/",
        image: "https://media.licdn.com/dms/image/v2/D5603AQEQM4Og3_ZPaw/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1724775174904?e=1741219200&v=beta&t=n8nKv8DsxLp3-06NcYvMsuADawh9p4YYpeEbT2TTGX4",
        team: "Software Developer"
    },
    {
        name: "Srujan Patil",
        linkedin: "https://www.linkedin.com/in/srujan-patil/",
        image: "https://media.licdn.com/dms/image/v2/D4D03AQFX5d7-lnFYrg/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1705280345028?e=1738800000&v=beta&t=Kzx2-tn_vncQVhXlU7CmKsfL4Oix7ufG6HiARdRT_mU",
        team: "Software Developer"
    },
    {
        name: "Erkin Tuna Gumustas",
        linkedin: "#",
        image: "./src/images/default_pic.jpg",
        team: "Web Developer"
    },
    {
        name: "Logan Flannery",
        linkedin: "#",
        image: "./src/images/default_pic.jpg",
        team: "Web Developer"
    },
    {
        name: "Quinn Goergen",
        linkedin: "#",
        image: "./src/images/default_pic.jpg",
        team: "Web Developer"
    },
    {
        name: "Humera Fatima",
        linkedin: "https://www.linkedin.com/in/humera-fatima-/",
        image: "https://media.licdn.com/dms/image/v2/D4D03AQFdTglFFcwptA/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1671813049469?e=1741219200&v=beta&t=3sSblD7XnX4X8r2CX2wOkFuM54eUAH-LBHQKJlZalBc",
        team: "UI/UX Designer"
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
        link: "https://daydream-technologies.github.io/Rubiks-cube-site/index.html",
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
