/********* Begin JS for the dropdown menu *********/
const hamburger = document.querySelector('.hamburger');
const dropdown = document.querySelector('.dropdown');

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
        dropdown.style.background = '#000000';
        dropdown.style.justifyItems = 'center';
        dropdown.style.alignItems = 'center';
        dropdown.style.listStyleType = 'none';
        
        const items = dropdown.querySelectorAll('li');
        items.forEach(item => {
            item.style.marginBottom = '15px';
        });

        // Set text color to orange to match navbar
        const links = dropdown.querySelectorAll('a');
        links.forEach(link => {
            if (link.id === 'current_page') {
                link.style.color = '#000000';
                link.style.backgroundColor = '#FBE8D4';
            } else {
                link.style.color = '#D95204';
            }
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


/********* Start JS for the LANDING PAGE AOS *********/
const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add('show');
        } else {
            entry.target.classList.remove('show');
        }
    })
})
const hiddenElements = document.querySelectorAll('.hidden');
hiddenElements.forEach((el) => observer.observe(el));
/********* End JS for the LANDING PAGE AOS *********/


/********* Start JS for the PROJECTS PAGE explore dropdown *********/
const containers = document.querySelectorAll('.container');
const dropdownContents = document.querySelectorAll('.dropdown-content');

// Loop through each container and add event listeners
containers.forEach((container, index) => {
    const dropdownContent = dropdownContents[index];
    if (container && dropdownContent) {
        container.querySelector('input').addEventListener('change', event => {
            // Close all other dropdowns first
            containers.forEach((otherContainer, otherIndex) => {
                if (otherIndex !== index) {
                    const otherDropdown = dropdownContents[otherIndex];
                    otherDropdown.style.display = 'none';
                    otherContainer.querySelector('input').checked = true;
                }
            });
            
            // Toggle the current dropdown
            if (!event.target.checked) {
                dropdownContent.style.display = 'block';
                dropdownContent.style.width = '100px';
            } else {
                dropdownContent.style.display = 'none';
            }
        });
    }
});
/********* End JS for the explore dropdown *********/

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
        linkedin: "https://www.linkedin.com/in/joseph-biesiada-648775231/",
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
        name: "Jason Dominic",
        linkedin: "https://www.linkedin.com/in/jasond26/",
        image: "./src/images/Headshots/Jason.jpg",
        displayTitle: "Website Developer",
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
        name: "Jake Jackson",
        linkedin: "",
        image: "",
        displayTitle: "Hardware Developer",
        team: "Hardware"
    },
    {
        name: "Patrick Shea",
        linkedin: "https://www.linkedin.com/in/patrickshea210/",
        image: "./src/images/Headshots/Patrick.jpg",
        displayTitle: "Embedded Systems Engineer",
        team: "Hardware"
    },
    /*{
        name: "Matt Willemin",
        linkedin: "https://www.linkedin.com/in/matt-willemin/",
        image: "./src/images/Headshots/Matt.jpg",
        displayTitle: "Software Developer",
        team: "Software"
    },*/
    {
        name: "Isaac Langerman",
        linkedin: "",
        image: "",
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
        linkedin: "https://www.linkedin.com/in/logan-flannery-8173192b6/",
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
    },
    {
        name: "Marvin Opoku Kwarteng",
        linkedin: "https://www.linkedin.com/in/marvinopoku/",
        image: "./src/images/Headshots/Marvin.png",
        displayTitle: "Sales Engineer",
        team: "Sales"
    },
    {
        name: "Jayden Savin",
        linkedin: "https://www.linkedin.com/in/jayden-savin-35124030b/",
        image: "./src/images/Headshots/Jayden.png",
        displayTitle: "Medical Researcher",
        team: "Research"
    },
    {
        name: "Julian Ananyev",
        linkedin: "https://www.linkedin.com/in/julianananyev/",
        image: "./src/images/Headshots/Julian.png",
        displayTitle: "Medical Researcher",
        team: "Research"
    },
    /*{
        name: "Bill Sun",
        linkedin: "https://www.linkedin.com/in/btsun/",
        image: "",
        displayTitle: "Medical Researcher",
        team: "Research"
    }*/
];

const projects = [
    {
        title: "Bluetooth Rubiks Cube",
        description: "Interactive Bluetooth Rubiks Cube to teach users how to solve the cube",
        link: "https://daydream-technologies.github.io/Rubiks-cube-site/",
        image: "./src/images/rubiks-cube.png"
    },
    {
        title: "Cognition Daily",
        description: "Web based application to track user's daily cognitive performance",
        link: "https://cognitiondaily.net",
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
    const projectContainer = document.querySelector('.project-container');

    if (projectContainer) {
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
    }
});

function filterPreviousWork(category) {
    const projectContainer = document.querySelector('.project-container');
    if (projectContainer) {
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
            .filter(member => {
                // Check if member has LinkedIn and non-default profile picture
                const hasLinkedIn = member.linkedin && member.linkedin !== '#';
                const hasCustomImage = member.image && !member.image.includes('default_pic.jpg');
                return (team === 'all' || member.team === team) && hasLinkedIn && hasCustomImage;
            })
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

if (form && email) {
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
}

// Show contact form when #contact_form is clicked
const contactFormLink = document.querySelectorAll('#contact_form');
const contactContainer = document.querySelector('.contact-container');

if (contactFormLink && contactContainer) {
    contactFormLink.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            contactContainer.classList.remove('hidden');
            contactContainer.scrollIntoView({ behavior: 'smooth' });
        });
    });
}
/********* End JS for the contact form *********/


/********* Begin JS for fluid reveal effect *********/
function createFluidRevealEffect() {
    // Create canvas container
    const container = document.createElement('div');
    container.className = 'fluid-container';
    container.style.cssText = `
        pointer-events: none;
        position: fixed;
        left: 0;
        top: 0;
        z-index: -1;
        width: 100%;
        height: 100%;
    `;
    
    // Get navbar height to position canvas below it
    const navbar = document.querySelector('nav');
    const navbarHeight = navbar ? navbar.offsetHeight : 0;
    container.style.top = navbarHeight + 'px';
    container.style.height = `calc(100% - ${navbarHeight}px)`;
    
    const canvas = document.createElement('canvas');
    canvas.id = 'fluid';
    canvas.style.cssText = `
        display: block;
        width: 100%;
        height: 100%;
    `;
    
    // Create electricity overlay
    const electricityOverlay = document.createElement('div');
    electricityOverlay.className = 'electricity-overlay';
    
    container.appendChild(canvas);
    container.appendChild(electricityOverlay);
    document.body.appendChild(container);
    
    if (!canvas) return;
    
    // Configuration
    const config = {
        SIM_RESOLUTION: 128,
        DYE_RESOLUTION: 1440,
        CAPTURE_RESOLUTION: 512,
        DENSITY_DISSIPATION: 3.5,
        VELOCITY_DISSIPATION: 2,
        PRESSURE: 0.1,
        PRESSURE_ITERATIONS: 20,
        CURL: 3,
        SPLAT_RADIUS: 0.2,
        SPLAT_FORCE: 2000,
        SHADING: true,
        COLOR_UPDATE_SPEED: 10,
        BACK_COLOR: { r: 0.5, g: 0, b: 0 },
        TRANSPARENT: true,
        PAUSED: false,
    };
    
    // Pointer interface
    function pointerPrototype() {
        return {
            id: -1,
            texcoordX: 0,
            texcoordY: 0,
            prevTexcoordX: 0,
            prevTexcoordY: 0,
            deltaX: 0,
            deltaY: 0,
            down: false,
            moved: false,
            color: { r: 0, g: 0, b: 0 },
        };
    }
    
    const pointers = [pointerPrototype()];
    let backgroundImage = null;
    
    // Load background image
    function loadBackgroundImage() {
        backgroundImage = new Image();
        backgroundImage.crossOrigin = 'anonymous';
        backgroundImage.src = './src/images/hidden-bg.png';
    }
    loadBackgroundImage();
    
    // Get WebGL context
    function getWebGLContext(canvas) {
        const params = {
            alpha: true,
            depth: false,
            stencil: false,
            antialias: false,
            preserveDrawingBuffer: false,
        };
        
        let gl = canvas.getContext('webgl2', params);
        if (!gl) {
            gl = canvas.getContext('webgl', params) || canvas.getContext('experimental-webgl', params);
        }
        if (!gl) {
            throw new Error('Unable to initialize WebGL.');
        }
        
        const isWebGL2 = 'drawBuffers' in gl;
        let supportLinearFiltering = false;
        let halfFloat = null;
        
        if (isWebGL2) {
            gl.getExtension('EXT_color_buffer_float');
            supportLinearFiltering = !!gl.getExtension('OES_texture_float_linear');
        } else {
            halfFloat = gl.getExtension('OES_texture_half_float');
            supportLinearFiltering = !!gl.getExtension('OES_texture_half_float_linear');
        }
        
        gl.clearColor(0, 0, 0, 1);
        
        const halfFloatTexType = isWebGL2 ? gl.HALF_FLOAT : (halfFloat && halfFloat.HALF_FLOAT_OES) || 0;
        
        let formatRGBA, formatRG, formatR;
        
        if (isWebGL2) {
            formatRGBA = getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, halfFloatTexType);
            formatRG = getSupportedFormat(gl, gl.RG16F, gl.RG, halfFloatTexType);
            formatR = getSupportedFormat(gl, gl.R16F, gl.RED, halfFloatTexType);
        } else {
            formatRGBA = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
            formatRG = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
            formatR = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
        }
        
        return {
            gl,
            ext: {
                formatRGBA,
                formatRG,
                formatR,
                halfFloatTexType,
                supportLinearFiltering,
            },
        };
    }
    
    function getSupportedFormat(gl, internalFormat, format, type) {
        if (!supportRenderTextureFormat(gl, internalFormat, format, type)) {
            if ('drawBuffers' in gl) {
                const gl2 = gl;
                switch (internalFormat) {
                    case gl2.R16F:
                        return getSupportedFormat(gl2, gl2.RG16F, gl2.RG, type);
                    case gl2.RG16F:
                        return getSupportedFormat(gl2, gl2.RGBA16F, gl2.RGBA, type);
                    default:
                        return null;
                }
            }
            return null;
        }
        return { internalFormat, format };
    }
    
    function supportRenderTextureFormat(gl, internalFormat, format, type) {
        const texture = gl.createTexture();
        if (!texture) return false;
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, type, null);
        const fbo = gl.createFramebuffer();
        if (!fbo) return false;
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
        const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        return status === gl.FRAMEBUFFER_COMPLETE;
    }
    
    const { gl, ext } = getWebGLContext(canvas);
    if (!gl || !ext) return;
    
    if (!ext.supportLinearFiltering) {
        config.DYE_RESOLUTION = 256;
        config.SHADING = false;
    }
    
    // Shader compilation helpers
    function addKeywords(source, keywords) {
        if (!keywords) return source;
        let keywordsString = '';
        for (const keyword of keywords) {
            keywordsString += `#define ${keyword}\n`;
        }
        return keywordsString + source;
    }
    
    function compileShader(type, source, keywords = null) {
        const shaderSource = addKeywords(source, keywords);
        const shader = gl.createShader(type);
        if (!shader) return null;
        gl.shaderSource(shader, shaderSource);
        gl.compileShader(shader);
        return shader;
    }
    
    function createProgram(vertexShader, fragmentShader) {
        if (!vertexShader || !fragmentShader) return null;
        const program = gl.createProgram();
        if (!program) return null;
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        return program;
    }
    
    function getUniforms(program) {
        const uniforms = {};
        const uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
        for (let i = 0; i < uniformCount; i++) {
            const uniformInfo = gl.getActiveUniform(program, i);
            if (uniformInfo) {
                uniforms[uniformInfo.name] = gl.getUniformLocation(program, uniformInfo.name);
            }
        }
        return uniforms;
    }
    
    class Program {
        constructor(vertexShader, fragmentShader) {
            this.program = createProgram(vertexShader, fragmentShader);
            this.uniforms = this.program ? getUniforms(this.program) : {};
        }
        bind() {
            if (this.program) gl.useProgram(this.program);
        }
    }
    
    class Material {
        constructor(vertexShader, fragmentShaderSource) {
            this.vertexShader = vertexShader;
            this.fragmentShaderSource = fragmentShaderSource;
            this.programs = {};
            this.activeProgram = null;
            this.uniforms = {};
        }
        
        setKeywords(keywords) {
            let hash = 0;
            for (const kw of keywords) {
                hash += kw.split('').reduce((acc, char) => ((acc << 5) - acc + char.charCodeAt(0)) | 0, 0);
            }
            let program = this.programs[hash];
            if (program == null) {
                const fragmentShader = compileShader(gl.FRAGMENT_SHADER, this.fragmentShaderSource, keywords);
                program = createProgram(this.vertexShader, fragmentShader);
                this.programs[hash] = program;
            }
            if (program === this.activeProgram) return;
            if (program) {
                this.uniforms = getUniforms(program);
            }
            this.activeProgram = program;
        }
        
        bind() {
            if (this.activeProgram) {
                gl.useProgram(this.activeProgram);
            }
        }
    }
    
    // Shaders
    const baseVertexShader = compileShader(gl.VERTEX_SHADER, `
        precision highp float;
        attribute vec2 aPosition;
        varying vec2 vUv;
        varying vec2 vL;
        varying vec2 vR;
        varying vec2 vT;
        varying vec2 vB;
        uniform vec2 texelSize;
        void main () {
            vUv = aPosition * 0.5 + 0.5;
            vL = vUv - vec2(texelSize.x, 0.0);
            vR = vUv + vec2(texelSize.x, 0.0);
            vT = vUv + vec2(0.0, texelSize.y);
            vB = vUv - vec2(0.0, texelSize.y);
            gl_Position = vec4(aPosition, 0.0, 1.0);
        }
    `);
    
    const copyShader = compileShader(gl.FRAGMENT_SHADER, `
        precision mediump float;
        precision mediump sampler2D;
        varying highp vec2 vUv;
        uniform sampler2D uTexture;
        void main () {
            gl_FragColor = texture2D(uTexture, vUv);
        }
    `);
    
    const clearShader = compileShader(gl.FRAGMENT_SHADER, `
        precision mediump float;
        precision mediump sampler2D;
        varying highp vec2 vUv;
        uniform sampler2D uTexture;
        uniform float value;
        void main () {
            gl_FragColor = value * texture2D(uTexture, vUv);
        }
    `);
    
    const displayShaderSource = `
        precision highp float;
        precision highp sampler2D;
        varying vec2 vUv;
        varying vec2 vL;
        varying vec2 vR;
        varying vec2 vT;
        varying vec2 vB;
        uniform sampler2D uTexture;
        uniform sampler2D uBackground;
        uniform vec2 texelSize;
        vec3 linearToGamma (vec3 color) {
            color = max(color, vec3(0));
            return max(1.055 * pow(color, vec3(0.416666667)) - 0.055, vec3(0));
        }
        void main () {
            vec3 c = texture2D(uTexture, vUv).rgb;
            #ifdef SHADING
                vec3 lc = texture2D(uTexture, vL).rgb;
                vec3 rc = texture2D(uTexture, vR).rgb;
                vec3 tc = texture2D(uTexture, vT).rgb;
                vec3 bc = texture2D(uTexture, vB).rgb;
                float dx = length(rc) - length(lc);
                float dy = length(tc) - length(bc);
                vec3 n = normalize(vec3(dx, dy, length(texelSize)));
                vec3 l = vec3(0.0, 0.0, 1.0);
                float diffuse = clamp(dot(n, l) + 0.7, 0.7, 1.0);
                c *= diffuse;
            #endif
            float a = max(c.r, max(c.g, c.b));
            vec3 bg = texture2D(uBackground, vUv).rgb;
            gl_FragColor = vec4(mix(vec3(0.0), bg, a), a);
        }
    `;
    
    const splatShader = compileShader(gl.FRAGMENT_SHADER, `
        precision highp float;
        precision highp sampler2D;
        varying vec2 vUv;
        uniform sampler2D uTarget;
        uniform float aspectRatio;
        uniform vec3 color;
        uniform vec2 point;
        uniform float radius;
        void main () {
            vec2 p = vUv - point.xy;
            p.x *= aspectRatio;
            vec3 splat = exp(-dot(p, p) / radius) * color;
            vec3 base = texture2D(uTarget, vUv).xyz;
            gl_FragColor = vec4(base + splat, 1.0);
        }
    `);
    
    const advectionShader = compileShader(gl.FRAGMENT_SHADER, `
        precision highp float;
        precision highp sampler2D;
        varying vec2 vUv;
        uniform sampler2D uVelocity;
        uniform sampler2D uSource;
        uniform vec2 texelSize;
        uniform vec2 dyeTexelSize;
        uniform float dt;
        uniform float dissipation;
        vec4 bilerp (sampler2D sam, vec2 uv, vec2 tsize) {
            vec2 st = uv / tsize - 0.5;
            vec2 iuv = floor(st);
            vec2 fuv = fract(st);
            vec4 a = texture2D(sam, (iuv + vec2(0.5, 0.5)) * tsize);
            vec4 b = texture2D(sam, (iuv + vec2(1.5, 0.5)) * tsize);
            vec4 c = texture2D(sam, (iuv + vec2(0.5, 1.5)) * tsize);
            vec4 d = texture2D(sam, (iuv + vec2(1.5, 1.5)) * tsize);
            return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);
        }
        void main () {
            #ifdef MANUAL_FILTERING
                vec2 coord = vUv - dt * bilerp(uVelocity, vUv, texelSize).xy * texelSize;
                vec4 result = bilerp(uSource, coord, dyeTexelSize);
            #else
                vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
                vec4 result = texture2D(uSource, coord);
            #endif
            float decay = 1.0 + dissipation * dt;
            gl_FragColor = result / decay;
        }
    `, ext.supportLinearFiltering ? null : ['MANUAL_FILTERING']);
    
    const divergenceShader = compileShader(gl.FRAGMENT_SHADER, `
        precision mediump float;
        precision mediump sampler2D;
        varying highp vec2 vUv;
        varying highp vec2 vL;
        varying highp vec2 vR;
        varying highp vec2 vT;
        varying highp vec2 vB;
        uniform sampler2D uVelocity;
        void main () {
            float L = texture2D(uVelocity, vL).x;
            float R = texture2D(uVelocity, vR).x;
            float T = texture2D(uVelocity, vT).y;
            float B = texture2D(uVelocity, vB).y;
            vec2 C = texture2D(uVelocity, vUv).xy;
            if (vL.x < 0.0) { L = -C.x; }
            if (vR.x > 1.0) { R = -C.x; }
            if (vT.y > 1.0) { T = -C.y; }
            if (vB.y < 0.0) { B = -C.y; }
            float div = 0.5 * (R - L + T - B);
            gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
        }
    `);
    
    const curlShader = compileShader(gl.FRAGMENT_SHADER, `
        precision mediump float;
        precision mediump sampler2D;
        varying highp vec2 vUv;
        varying highp vec2 vL;
        varying highp vec2 vR;
        varying highp vec2 vT;
        varying highp vec2 vB;
        uniform sampler2D uVelocity;
        void main () {
            float L = texture2D(uVelocity, vL).y;
            float R = texture2D(uVelocity, vR).y;
            float T = texture2D(uVelocity, vT).x;
            float B = texture2D(uVelocity, vB).x;
            float vorticity = R - L - T + B;
            gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
        }
    `);
    
    const vorticityShader = compileShader(gl.FRAGMENT_SHADER, `
        precision highp float;
        precision highp sampler2D;
        varying vec2 vUv;
        varying vec2 vL;
        varying vec2 vR;
        varying vec2 vT;
        varying vec2 vB;
        uniform sampler2D uVelocity;
        uniform sampler2D uCurl;
        uniform float curl;
        uniform float dt;
        void main () {
            float L = texture2D(uCurl, vL).x;
            float R = texture2D(uCurl, vR).x;
            float T = texture2D(uCurl, vT).x;
            float B = texture2D(uCurl, vB).x;
            float C = texture2D(uCurl, vUv).x;
            vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
            force /= length(force) + 0.0001;
            force *= curl * C;
            force.y *= -1.0;
            vec2 velocity = texture2D(uVelocity, vUv).xy;
            velocity += force * dt;
            velocity = min(max(velocity, -1000.0), 1000.0);
            gl_FragColor = vec4(velocity, 0.0, 1.0);
        }
    `);
    
    const pressureShader = compileShader(gl.FRAGMENT_SHADER, `
        precision mediump float;
        precision mediump sampler2D;
        varying highp vec2 vUv;
        varying highp vec2 vL;
        varying highp vec2 vR;
        varying highp vec2 vT;
        varying highp vec2 vB;
        uniform sampler2D uPressure;
        uniform sampler2D uDivergence;
        void main () {
            float L = texture2D(uPressure, vL).x;
            float R = texture2D(uPressure, vR).x;
            float T = texture2D(uPressure, vT).x;
            float B = texture2D(uPressure, vB).x;
            float C = texture2D(uPressure, vUv).x;
            float divergence = texture2D(uDivergence, vUv).x;
            float pressure = (L + R + B + T - divergence) * 0.25;
            gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
        }
    `);
    
    const gradientSubtractShader = compileShader(gl.FRAGMENT_SHADER, `
        precision mediump float;
        precision mediump sampler2D;
        varying highp vec2 vUv;
        varying highp vec2 vL;
        varying highp vec2 vR;
        varying highp vec2 vT;
        varying highp vec2 vB;
        uniform sampler2D uPressure;
        uniform sampler2D uVelocity;
        void main () {
            float L = texture2D(uPressure, vL).x;
            float R = texture2D(uPressure, vR).x;
            float T = texture2D(uPressure, vT).x;
            float B = texture2D(uPressure, vB).x;
            vec2 velocity = texture2D(uVelocity, vUv).xy;
            velocity.xy -= vec2(R - L, T - B);
            gl_FragColor = vec4(velocity, 0.0, 1.0);
        }
    `);
    
    // Fullscreen triangles
    const blit = (() => {
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
        const elemBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elemBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(0);
        
        return (target, doClear = false) => {
            if (!target) {
                gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
                gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            } else {
                gl.viewport(0, 0, target.width, target.height);
                gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
            }
            if (doClear) {
                gl.clearColor(0, 0, 0, 1);
                gl.clear(gl.COLOR_BUFFER_BIT);
            }
            gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
        };
    })();
    
    // FBO creation
    function createFBO(w, h, internalFormat, format, type, param) {
        gl.activeTexture(gl.TEXTURE0);
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, param);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, param);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);
        const fbo = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
        gl.viewport(0, 0, w, h);
        gl.clear(gl.COLOR_BUFFER_BIT);
        
        return {
            texture,
            fbo,
            width: w,
            height: h,
            texelSizeX: 1 / w,
            texelSizeY: 1 / h,
            attach(id) {
                gl.activeTexture(gl.TEXTURE0 + id);
                gl.bindTexture(gl.TEXTURE_2D, texture);
                return id;
            },
        };
    }
    
    function createDoubleFBO(w, h, internalFormat, format, type, param) {
        const fbo1 = createFBO(w, h, internalFormat, format, type, param);
        const fbo2 = createFBO(w, h, internalFormat, format, type, param);
        return {
            width: w,
            height: h,
            texelSizeX: fbo1.texelSizeX,
            texelSizeY: fbo1.texelSizeY,
            read: fbo1,
            write: fbo2,
            swap() {
                const tmp = this.read;
                this.read = this.write;
                this.write = tmp;
            },
        };
    }
    
    function resizeFBO(target, w, h, internalFormat, format, type, param) {
        const newFBO = createFBO(w, h, internalFormat, format, type, param);
        copyProgram.bind();
        if (copyProgram.uniforms.uTexture)
            gl.uniform1i(copyProgram.uniforms.uTexture, target.attach(0));
        blit(newFBO, false);
        return newFBO;
    }
    
    function resizeDoubleFBO(target, w, h, internalFormat, format, type, param) {
        if (target.width === w && target.height === h) return target;
        target.read = resizeFBO(target.read, w, h, internalFormat, format, type, param);
        target.write = createFBO(w, h, internalFormat, format, type, param);
        target.width = w;
        target.height = h;
        target.texelSizeX = 1 / w;
        target.texelSizeY = 1 / h;
        return target;
    }
    
    let dye, velocity, divergence, curl, pressure;
    let backgroundTexture = null;
    
    const copyProgram = new Program(baseVertexShader, copyShader);
    const clearProgram = new Program(baseVertexShader, clearShader);
    const splatProgram = new Program(baseVertexShader, splatShader);
    const advectionProgram = new Program(baseVertexShader, advectionShader);
    const divergenceProgram = new Program(baseVertexShader, divergenceShader);
    const curlProgram = new Program(baseVertexShader, curlShader);
    const vorticityProgram = new Program(baseVertexShader, vorticityShader);
    const pressureProgram = new Program(baseVertexShader, pressureShader);
    const gradienSubtractProgram = new Program(baseVertexShader, gradientSubtractShader);
    const displayMaterial = new Material(baseVertexShader, displayShaderSource);
    
    function getResolution(resolution) {
        const w = gl.drawingBufferWidth;
        const h = gl.drawingBufferHeight;
        const aspectRatio = w / h;
        const aspect = aspectRatio < 1 ? 1 / aspectRatio : aspectRatio;
        const min = Math.round(resolution);
        const max = Math.round(resolution * aspect);
        if (w > h) {
            return { width: max, height: min };
        }
        return { width: min, height: max };
    }
    
    function scaleByPixelRatio(input) {
        const pixelRatio = window.devicePixelRatio || 1;
        return Math.floor(input * pixelRatio);
    }
    
    function initFramebuffers() {
        const simRes = getResolution(config.SIM_RESOLUTION);
        const dyeRes = getResolution(config.DYE_RESOLUTION);
        
        const texType = ext.halfFloatTexType;
        const rgba = ext.formatRGBA;
        const rg = ext.formatRG;
        const r = ext.formatR;
        const filtering = ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST;
        gl.disable(gl.BLEND);
        
        if (!dye) {
            dye = createDoubleFBO(dyeRes.width, dyeRes.height, rgba.internalFormat, rgba.format, texType, filtering);
        } else {
            dye = resizeDoubleFBO(dye, dyeRes.width, dyeRes.height, rgba.internalFormat, rgba.format, texType, filtering);
        }
        
        if (!velocity) {
            velocity = createDoubleFBO(simRes.width, simRes.height, rg.internalFormat, rg.format, texType, filtering);
        } else {
            velocity = resizeDoubleFBO(velocity, simRes.width, simRes.height, rg.internalFormat, rg.format, texType, filtering);
        }
        
        divergence = createFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);
        curl = createFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);
        pressure = createDoubleFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);
        
        // Create background texture
        if (backgroundImage && backgroundImage.complete) {
            backgroundTexture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, backgroundTexture);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, backgroundImage);
        }
    }
    
    function updateKeywords() {
        const displayKeywords = [];
        if (config.SHADING) displayKeywords.push('SHADING');
        displayMaterial.setKeywords(displayKeywords);
    }
    
    updateKeywords();
    initFramebuffers();
    
    // Update background texture when image loads
    if (backgroundImage) {
        backgroundImage.onload = () => {
            if (!backgroundTexture) {
                backgroundTexture = gl.createTexture();
            }
            gl.bindTexture(gl.TEXTURE_2D, backgroundTexture);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, backgroundImage);
        };
    }
    
    let lastUpdateTime = Date.now();
    let colorUpdateTimer = 0.0;
    
    function updateFrame() {
        const dt = calcDeltaTime();
        if (resizeCanvas()) initFramebuffers();
        updateColors(dt);
        applyInputs();
        step(dt);
        render(null);
        requestAnimationFrame(updateFrame);
    }
    
    function calcDeltaTime() {
        const now = Date.now();
        let dt = (now - lastUpdateTime) / 1000;
        dt = Math.min(dt, 0.016666);
        lastUpdateTime = now;
        return dt;
    }
    
    function resizeCanvas() {
        const width = scaleByPixelRatio(canvas.clientWidth);
        const height = scaleByPixelRatio(canvas.clientHeight);
        if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
            return true;
        }
        return false;
    }
    
    function updateColors(dt) {
        colorUpdateTimer += dt * config.COLOR_UPDATE_SPEED;
        if (colorUpdateTimer >= 1) {
            colorUpdateTimer = (colorUpdateTimer % 1);
            pointers.forEach((p) => {
                p.color = generateColor();
            });
        }
    }
    
    function applyInputs() {
        for (const p of pointers) {
            if (p.moved) {
                p.moved = false;
                splatPointer(p);
            }
        }
    }
    
    function step(dt) {
        gl.disable(gl.BLEND);
        
        curlProgram.bind();
        if (curlProgram.uniforms.texelSize) {
            gl.uniform2f(curlProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
        }
        if (curlProgram.uniforms.uVelocity) {
            gl.uniform1i(curlProgram.uniforms.uVelocity, velocity.read.attach(0));
        }
        blit(curl);
        
        vorticityProgram.bind();
        if (vorticityProgram.uniforms.texelSize) {
            gl.uniform2f(vorticityProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
        }
        if (vorticityProgram.uniforms.uVelocity) {
            gl.uniform1i(vorticityProgram.uniforms.uVelocity, velocity.read.attach(0));
        }
        if (vorticityProgram.uniforms.uCurl) {
            gl.uniform1i(vorticityProgram.uniforms.uCurl, curl.attach(1));
        }
        if (vorticityProgram.uniforms.curl) {
            gl.uniform1f(vorticityProgram.uniforms.curl, config.CURL);
        }
        if (vorticityProgram.uniforms.dt) {
            gl.uniform1f(vorticityProgram.uniforms.dt, dt);
        }
        blit(velocity.write);
        velocity.swap();
        
        divergenceProgram.bind();
        if (divergenceProgram.uniforms.texelSize) {
            gl.uniform2f(divergenceProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
        }
        if (divergenceProgram.uniforms.uVelocity) {
            gl.uniform1i(divergenceProgram.uniforms.uVelocity, velocity.read.attach(0));
        }
        blit(divergence);
        
        clearProgram.bind();
        if (clearProgram.uniforms.uTexture) {
            gl.uniform1i(clearProgram.uniforms.uTexture, pressure.read.attach(0));
        }
        if (clearProgram.uniforms.value) {
            gl.uniform1f(clearProgram.uniforms.value, config.PRESSURE);
        }
        blit(pressure.write);
        pressure.swap();
        
        pressureProgram.bind();
        if (pressureProgram.uniforms.texelSize) {
            gl.uniform2f(pressureProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
        }
        if (pressureProgram.uniforms.uDivergence) {
            gl.uniform1i(pressureProgram.uniforms.uDivergence, divergence.attach(0));
        }
        for (let i = 0; i < config.PRESSURE_ITERATIONS; i++) {
            if (pressureProgram.uniforms.uPressure) {
                gl.uniform1i(pressureProgram.uniforms.uPressure, pressure.read.attach(1));
            }
            blit(pressure.write);
            pressure.swap();
        }
        
        gradienSubtractProgram.bind();
        if (gradienSubtractProgram.uniforms.texelSize) {
            gl.uniform2f(gradienSubtractProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
        }
        if (gradienSubtractProgram.uniforms.uPressure) {
            gl.uniform1i(gradienSubtractProgram.uniforms.uPressure, pressure.read.attach(0));
        }
        if (gradienSubtractProgram.uniforms.uVelocity) {
            gl.uniform1i(gradienSubtractProgram.uniforms.uVelocity, velocity.read.attach(1));
        }
        blit(velocity.write);
        velocity.swap();
        
        advectionProgram.bind();
        if (advectionProgram.uniforms.texelSize) {
            gl.uniform2f(advectionProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
        }
        if (!ext.supportLinearFiltering && advectionProgram.uniforms.dyeTexelSize) {
            gl.uniform2f(advectionProgram.uniforms.dyeTexelSize, velocity.texelSizeX, velocity.texelSizeY);
        }
        const velocityId = velocity.read.attach(0);
        if (advectionProgram.uniforms.uVelocity) {
            gl.uniform1i(advectionProgram.uniforms.uVelocity, velocityId);
        }
        if (advectionProgram.uniforms.uSource) {
            gl.uniform1i(advectionProgram.uniforms.uSource, velocityId);
        }
        if (advectionProgram.uniforms.dt) {
            gl.uniform1f(advectionProgram.uniforms.dt, dt);
        }
        if (advectionProgram.uniforms.dissipation) {
            gl.uniform1f(advectionProgram.uniforms.dissipation, config.VELOCITY_DISSIPATION);
        }
        blit(velocity.write);
        velocity.swap();
        
        if (!ext.supportLinearFiltering && advectionProgram.uniforms.dyeTexelSize) {
            gl.uniform2f(advectionProgram.uniforms.dyeTexelSize, dye.texelSizeX, dye.texelSizeY);
        }
        if (advectionProgram.uniforms.uVelocity) {
            gl.uniform1i(advectionProgram.uniforms.uVelocity, velocity.read.attach(0));
        }
        if (advectionProgram.uniforms.uSource) {
            gl.uniform1i(advectionProgram.uniforms.uSource, dye.read.attach(1));
        }
        if (advectionProgram.uniforms.dissipation) {
            gl.uniform1f(advectionProgram.uniforms.dissipation, config.DENSITY_DISSIPATION);
        }
        blit(dye.write);
        dye.swap();
    }
    
    function render(target) {
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.enable(gl.BLEND);
        drawDisplay(target);
    }
    
    function drawDisplay(target) {
        const width = target ? target.width : gl.drawingBufferWidth;
        const height = target ? target.height : gl.drawingBufferHeight;
        displayMaterial.bind();
        if (config.SHADING && displayMaterial.uniforms.texelSize) {
            gl.uniform2f(displayMaterial.uniforms.texelSize, 1 / width, 1 / height);
        }
        if (displayMaterial.uniforms.uTexture) {
            gl.uniform1i(displayMaterial.uniforms.uTexture, dye.read.attach(0));
        }
        if (displayMaterial.uniforms.uBackground && backgroundTexture) {
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, backgroundTexture);
            gl.uniform1i(displayMaterial.uniforms.uBackground, 1);
        }
        blit(target, false);
    }
    
    function splatPointer(pointer) {
        const dx = pointer.deltaX * config.SPLAT_FORCE;
        const dy = pointer.deltaY * config.SPLAT_FORCE;
        splat(pointer.texcoordX, pointer.texcoordY, dx, dy, pointer.color);
    }
    
    function clickSplat(pointer) {
        const color = generateColor();
        color.r *= 10;
        color.g *= 10;
        color.b *= 10;
        const dx = 10 * (Math.random() - 0.5);
        const dy = 30 * (Math.random() - 0.5);
        splat(pointer.texcoordX, pointer.texcoordY, dx, dy, color);
    }
    
    function splat(x, y, dx, dy, color) {
        splatProgram.bind();
        if (splatProgram.uniforms.uTarget) {
            gl.uniform1i(splatProgram.uniforms.uTarget, velocity.read.attach(0));
        }
        if (splatProgram.uniforms.aspectRatio) {
            gl.uniform1f(splatProgram.uniforms.aspectRatio, canvas.width / canvas.height);
        }
        if (splatProgram.uniforms.point) {
            gl.uniform2f(splatProgram.uniforms.point, x, y);
        }
        if (splatProgram.uniforms.color) {
            gl.uniform3f(splatProgram.uniforms.color, dx, dy, 0);
        }
        if (splatProgram.uniforms.radius) {
            gl.uniform1f(splatProgram.uniforms.radius, correctRadius(config.SPLAT_RADIUS / 100));
        }
        blit(velocity.write);
        velocity.swap();
        
        if (splatProgram.uniforms.uTarget) {
            gl.uniform1i(splatProgram.uniforms.uTarget, dye.read.attach(0));
        }
        if (splatProgram.uniforms.color) {
            gl.uniform3f(splatProgram.uniforms.color, color.r, color.g, color.b);
        }
        blit(dye.write);
        dye.swap();
    }
    
    function correctRadius(radius) {
        const aspectRatio = canvas.width / canvas.height;
        if (aspectRatio > 1) radius *= aspectRatio;
        return radius;
    }
    
    function updatePointerDownData(pointer, id, posX, posY) {
        pointer.id = id;
        pointer.down = true;
        pointer.moved = false;
        pointer.texcoordX = posX / canvas.width;
        pointer.texcoordY = 1 - posY / canvas.height;
        pointer.prevTexcoordX = pointer.texcoordX;
        pointer.prevTexcoordY = pointer.texcoordY;
        pointer.deltaX = 0;
        pointer.deltaY = 0;
        pointer.color = generateColor();
    }
    
    function updatePointerMoveData(pointer, posX, posY, color) {
        pointer.prevTexcoordX = pointer.texcoordX;
        pointer.prevTexcoordY = pointer.texcoordY;
        pointer.texcoordX = posX / canvas.width;
        pointer.texcoordY = 1 - posY / canvas.height;
        pointer.deltaX = correctDeltaX(pointer.texcoordX - pointer.prevTexcoordX);
        pointer.deltaY = correctDeltaY(pointer.texcoordY - pointer.prevTexcoordY);
        pointer.moved = Math.abs(pointer.deltaX) > 0 || Math.abs(pointer.deltaY) > 0;
        pointer.color = color;
    }
    
    function updatePointerUpData(pointer) {
        pointer.down = false;
    }
    
    function correctDeltaX(delta) {
        const aspectRatio = canvas.width / canvas.height;
        if (aspectRatio < 1) delta *= aspectRatio;
        return delta;
    }
    
    function correctDeltaY(delta) {
        const aspectRatio = canvas.width / canvas.height;
        if (aspectRatio > 1) delta /= aspectRatio;
        return delta;
    }
    
    function generateColor() {
        const c = HSVtoRGB(Math.random(), 1.0, 1.0);
        c.r *= 0.15;
        c.g *= 0.15;
        c.b *= 0.15;
        return c;
    }
    
    function HSVtoRGB(h, s, v) {
        let r = 0, g = 0, b = 0;
        const i = Math.floor(h * 6);
        const f = h * 6 - i;
        const p = v * (1 - s);
        const q = v * (1 - f * s);
        const t = v * (1 - (1 - f) * s);
        
        switch (i % 6) {
            case 0: r = v; g = t; b = p; break;
            case 1: r = q; g = v; b = p; break;
            case 2: r = p; g = v; b = t; break;
            case 3: r = p; g = q; b = v; break;
            case 4: r = t; g = p; b = v; break;
            case 5: r = v; g = p; b = q; break;
        }
        return { r, g, b };
    }
    
    // Event listeners
    function handleFirstMouseMove(e) {
        const pointer = pointers[0];
        const posX = scaleByPixelRatio(e.clientX);
        const posY = scaleByPixelRatio(e.clientY - navbarHeight);
        const color = generateColor();
        updateFrame();
        updatePointerMoveData(pointer, posX, posY, color);
        document.body.removeEventListener('mousemove', handleFirstMouseMove);
    }
    document.body.addEventListener('mousemove', handleFirstMouseMove);
    
    window.addEventListener('mousedown', (e) => {
        const navbar = document.querySelector('nav');
        const navbarRect = navbar.getBoundingClientRect();
        if (e.clientY <= navbarRect.bottom) return;
        
        const pointer = pointers[0];
        const posX = scaleByPixelRatio(e.clientX);
        const posY = scaleByPixelRatio(e.clientY - navbarHeight);
        updatePointerDownData(pointer, -1, posX, posY);
        clickSplat(pointer);
    });
    
    window.addEventListener('mousemove', (e) => {
        const navbar = document.querySelector('nav');
        const navbarRect = navbar.getBoundingClientRect();
        if (e.clientY <= navbarRect.bottom) return;
        
        const pointer = pointers[0];
        const posX = scaleByPixelRatio(e.clientX);
        const posY = scaleByPixelRatio(e.clientY - navbarHeight);
        const color = pointer.color;
        updatePointerMoveData(pointer, posX, posY, color);
    });
    
    function handleFirstTouchStart(e) {
        const touches = e.targetTouches;
        const pointer = pointers[0];
        for (let i = 0; i < touches.length; i++) {
            const posX = scaleByPixelRatio(touches[i].clientX);
            const posY = scaleByPixelRatio(touches[i].clientY - navbarHeight);
            updateFrame();
            updatePointerDownData(pointer, touches[i].identifier, posX, posY);
        }
        document.body.removeEventListener('touchstart', handleFirstTouchStart);
    }
    document.body.addEventListener('touchstart', handleFirstTouchStart);
    
    window.addEventListener('touchstart', (e) => {
        const touches = e.targetTouches;
        const pointer = pointers[0];
        for (let i = 0; i < touches.length; i++) {
            const posX = scaleByPixelRatio(touches[i].clientX);
            const posY = scaleByPixelRatio(touches[i].clientY - navbarHeight);
            updatePointerDownData(pointer, touches[i].identifier, posX, posY);
        }
    }, false);
    
    window.addEventListener('touchmove', (e) => {
        const touches = e.targetTouches;
        const pointer = pointers[0];
        for (let i = 0; i < touches.length; i++) {
            const posX = scaleByPixelRatio(touches[i].clientX);
            const posY = scaleByPixelRatio(touches[i].clientY - navbarHeight);
            updatePointerMoveData(pointer, posX, posY, pointer.color);
        }
    }, false);
    
    window.addEventListener('touchend', (e) => {
        const touches = e.changedTouches;
        const pointer = pointers[0];
        for (let i = 0; i < touches.length; i++) {
            updatePointerUpData(pointer);
        }
    });
    
    // Handle window resize
    window.addEventListener('resize', () => {
        const newNavbarHeight = navbar ? navbar.offsetHeight : 0;
        if (newNavbarHeight !== navbarHeight) {
            container.style.top = newNavbarHeight + 'px';
            container.style.height = `calc(100% - ${newNavbarHeight}px)`;
        }
    });
    
    // Start animation
    updateFrame();
}

// Initialize the fluid reveal effect when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    createFluidRevealEffect();
});
/********* End JS for fluid reveal effect *********/
