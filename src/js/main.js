/********* Begin JS for the dropdown menu *********/
const hamburger = document.querySelector('.hamburger');
const dropdown = document.querySelector('.dropdown');

// Remove the old menu_bar click listener since we're using the hamburger checkbox now
hamburger.querySelector('input').addEventListener('change', event => {
    if (event.target.checked) {
        dropdown.style.display = 'block';
        dropdown.style.maxHeight = '0';
        dropdown.style.transform = 'translateY(0%)';
        dropdown.style.padding = '15px';
        dropdown.style.transition = 'transform 0.1s ease-out, max-height 0s ease-out';
        dropdown.style.position = 'fixed';
        dropdown.style.top = '75px';
        dropdown.style.right = '0';
        dropdown.style.width = '100vw';
        dropdown.style.height = 'calc(100vh - 75px)';
        dropdown.style.overflow = 'hidden';
        dropdown.style.borderTop = '1px solid #d8d9da';
        dropdown.style.borderLeft = '1px solid #d8d9da';
        dropdown.style.borderBottom = '1px solid #d8d9da';
        dropdown.style.background = '#FFFFFF';
        dropdown.style.justifyItems = 'center';
        dropdown.style.alignItems = 'center';
        dropdown.style.listStyleType = 'none';
        
        const items = dropdown.querySelectorAll('li');
        items.forEach(item => {
            item.style.marginBottom = '15px';
        });

        setTimeout(function () {
            dropdown.style.transform = 'translateY(0%)';
            dropdown.style.maxHeight = 'calc(100vh - 75px)';
        }, 1);
    } else {
        dropdown.style.display = 'none';
        dropdown.style.transform = 'translateX(100%)';
        dropdown.style.maxHeight = '0';
    }
});

// Add event listener for dropdown links
dropdown.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
        // Uncheck the hamburger checkbox to trigger the close animation
        hamburger.querySelector('input').checked = false;
        // Trigger the change event to close the dropdown
        hamburger.querySelector('input').dispatchEvent(new Event('change'));
    });
});

// Function to handle dropdown visibility on resize
const handleResize = () => {
    if (window.innerWidth > 800) {
        dropdown.style.display = 'none';
        // Reset the checkbox state
        if (hamburger.querySelector('input')) {
            hamburger.querySelector('input').checked = false;
        }
    }
};

// Initial check on page load
handleResize();

// Add resize event listener
window.addEventListener('resize', handleResize);
/********* End JS for the dropdown menu *********/

const teamMembers = [
    {
        name: "David Wasilewski",
        linkedin: "https://www.linkedin.com/in/david-wasilewski/?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app",
        image: "./src/images/Headshots/David.jpg",
        displayTitle: "CTO",
        team: "Admin"
    },
    {
        name: "Milo Baran",
        linkedin: "https://www.linkedin.com/in/milo-baran-822a4126a/",
        image: "./src/images/Headshots/Milo.jpg",
        displayTitle: "Software Developer",
        team: "Software"
    },
    {
        name: "Srujan Patil",
        linkedin: "https://www.linkedin.com/in/srujan-patil/",
        image: "./src/images/Headshots/Srujan.jpg",
        displayTitle: "Software Developer",
        team: "Software"
    },
    {
        name: "Joseph Biesiada",
        linkedin: "#",
        image: "./src/images/Headshots/Joseph.jpg",
        displayTitle: "Cybersecurity Consultant",
        team: "Cybersecurity/IT"
    },
    {
        name: "Thomas Laidlaw",
        linkedin: "https://www.linkedin.com/in/thomaslaidlaw284/",
        image: "./src/images/Headshots/Tommy.jpg",
        displayTitle: "Cybersecurity Consultant",
        team: "Cybersecurity/IT"
    },
    {
        name: "Eli Klunder",
        linkedin: "https://www.linkedin.com/in/eli-klunder-9822a7270/",
        image: "./src/images/Headshots/Eli.jpg",
        displayTitle: "Software Developer",
        team: "Software"
    },
    {
        name: "Kaedan Palmitier",
        linkedin: "https://www.linkedin.com/in/kaeden-palmitier-769940259/",
        image: "./src/images/Headshots/Kaeden.jpg",
        displayTitle: "Graphic Design Consultant",
        team: "Design"
    },
    {
        name: "Emmanuel Butsana",
        linkedin: "https://www.linkedin.com/in/emmanuel-ze-butsana/",
        image: "./src/images/Headshots/Emmanuel.jpg",
        displayTitle: "Hardware Developer",
        team: "Hardware"
    },
    {
        name: "Matt Willemin",
        linkedin: "https://www.linkedin.com/in/matt-willemin/",
        image: "./src/images/Headshots/Matt.jpg",
        displayTitle: "Software Developer",
        team: "Software"
    },
    {
        name: "Jack Baldwin",
        linkedin: "https://www.linkedin.com/in/jackson-baldwin/",
        image: "./src/images/Headshots/Jack.jpg",
        displayTitle: "Software Developer",
        team: "Software"
    },
    {
        name: "Erkin Tuna Gumustas",
        linkedin: "#",
        image: "./src/images/default_pic.jpg",
        displayTitle: "Web Developer",
        team: "Software"
    },
    {
        name: "Quinn Goergen",
        linkedin: "#",
        image: "./src/images/Headshots/Quinn.png",
        displayTitle: "Web Developer",
        team: "Software"
    },
    {
        name: "Logan Flannery",
        linkedin: "#",
        image: "./src/images/Headshots/Logan.jpg",
        displayTitle: "Web Developer",
        team: "Software"
    },
    {
        name: "Humera Fatima",
        linkedin: "https://www.linkedin.com/in/humera-fatima-/",
        image: "./src/images/Headshots/Humera.jpg",
        displayTitle: "UI/UX Designer",
        team: "Design"
    }
];

const projects = [
    {
        title: "Bluetooth Rubiks Cube",
        description: "Day Dream Technologies",
        link: "https://daydream-technologies.github.io/Rubiks-cube-site/",
        image: "./src/images/rubiks-cube.png"
    }
];

const previousWork = [
    {
        title: "Card Website",
        description: "Previous Work",
        image: "./src/images/card_website_ss.png",
        category: "Web"
    },
    {
        title: "Main Website",
        description: "Previous Work",
        image: "./src/images/main_ss.png",
        category: "Web"
    },
    {
        title: "Ryan Talbot Website",
        description: "Previous Work",
        image: "./src/images/Projects/Websites/ryan_talbot_ss.png",
        category: "Web"
    },
    {
        title: "Rubik's Cube Research Website",
        description: "Previous Work",
        image: "./src/images/Projects/Websites/jay_website_ss.png",
        category: "Web"
    },
    {
        title: "Ryan Talbot Logo",
        description: "Graphic Design",
        image: "./src/images/Projects/Graphic Design/Ryan_Talbot_Logo.jpg",
        category: "Graphic Design"
    }
];

/*Function for updated job title selection*/
document.addEventListener('DOMContentLoaded', function() {
    const filterButtons = document.querySelectorAll('.filter-btn');

    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            filterButtons.forEach(btn => btn.classList.remove('selected'));
            this.classList.add('selected');
            const category = this.dataset.team;
            filterPreviousWork(category);
        });
    });

    // Initial filter to show all previous work
    filterPreviousWork('All');
});

function filterPreviousWork(category) {
    const projectContainer = document.querySelector('.project-container');
    const projectItems = projectContainer.querySelectorAll('.project-item');
    
    projectItems.forEach(item => {
        const projectCategory = item.dataset.team;
        if (category === 'All' || projectCategory === category) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

function renderTeamMembers(team = 'all') {
    const teamContainer = document.getElementById('team-container');
    if (!teamContainer) return;

    // 1) Add the fade-out class
    teamContainer.classList.add('fade-out');

    // 2) Wait for the transition to complete (0.4s) before updating content
    setTimeout(() => {
        // Clear out existing members
        teamContainer.innerHTML = '';

        // Filter and render team members
        teamMembers
            .filter(member => team === 'all' || member.team === team)
            .forEach(member => {
                // Create the card elements
                const memberDiv = document.createElement('div');
                memberDiv.classList.add('team-member');

                memberDiv.innerHTML = `
                    <div class="card">
                        <div class="card-front">
                            <img src="${member.image}" alt="${member.name}">
                            <h3>${member.name}</h3>
                            <p>${member.displayTitle}</p>
                        </div>
                        <div class="card-back">
                            <a href="${member.linkedin}" target="_blank">LinkedIn Profile</a>
                        </div>
                    </div>
                `;

                teamContainer.appendChild(memberDiv);
            });

        // 3) Remove the fade-out class so it fades back in
        teamContainer.classList.remove('fade-out');
    }, 400);
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

document.addEventListener('DOMContentLoaded', () => {
  // Select all containers that hold screenshots
  const containers = document.querySelectorAll('.screenshot-container');
  
  containers.forEach(container => {
    // For each container, find all images within it
    const images = container.querySelectorAll('img');
    
    images.forEach(image => {
      const containerHeight = container.offsetHeight;
      const imageHeight = image.offsetHeight;
      const scrollDist = imageHeight - containerHeight;

      // Only if the image is taller than the container do we need a scroll animation
      if (scrollDist > 0) {
        image.style.setProperty('--scrollDist', `-${scrollDist}px`);
      } else {
        // Otherwise, no scrolling is necessary
        image.style.setProperty('--scrollDist', '0px');
      }

      // For graphic design projects, ensure the image fits properly
      if (container.closest('[data-team="Graphic Design"]')) {
        image.style.objectFit = 'contain';
        image.style.width = '100%';
        image.style.height = '100%';
      }
    });
  });
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
