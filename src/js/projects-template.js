/* Auto‑generated Projects Template Script */
const projectsData = [
    {
        "title": "Bluetooth Rubik's Cube",
        "image": "./src/images/rubiks-default.jpg",
        "link": "#",
        "description": "We designed an interactive Rubik's cube for ________.",
        "outcomes": [
            {
                "title": "Visual Identity & UI Design",
                "text": "We developed a bold and clean design language that mirrors Ryan's energy and professionalism."
            },
            {
                "title": "Interactive Career Timeline",
                "text": "Visitors can scroll through major milestones, stats, and memorable moments in a rich, interactive timeline that brings the Ryan\u2019s story to life."
            },
            {
                "title": "Responsive Web Development",
                "text": "Built from the ground up using modern frameworks like React & Next.js, SEO\u2011optimized, and fully responsive on all devices."
            },
            {
                "title": "Media Gallery & Press Hub",
                "text": "A curated section for videos, highlight reels, and press mentions ensures fans and media alike can access fresh, relevant content easily."
            }
        ]
    }
];

function buildProjects() {
    const container = document.getElementById('projects-container');
    if (!container) return;
    container.innerHTML = '';

    projectsData.forEach(proj => {
        // Wrapper
        const section = document.createElement('section');
        section.classList.add('project-block');

        // Image + button
        const imgWrap = document.createElement('div');
        imgWrap.classList.add('project-image-container');
        const img = document.createElement('img');
        img.src = proj.image;
        img.alt = proj.title;
        imgWrap.appendChild(img);

        if (proj.link) {
            const a = document.createElement('a');
            a.href = proj.link;
            a.textContent = 'Open Website';
            a.target = '_blank';
            a.classList.add('project-button');
            // arrow inline svg
            a.insertAdjacentHTML('beforeend', '<span style="font-size:1.1em;">↗</span>');
            imgWrap.appendChild(a);
        }

        section.appendChild(imgWrap);

        // Title
        const h2 = document.createElement('h2');
        h2.classList.add('project-title');
        h2.textContent = proj.title;
        section.appendChild(h2);

        // Description
        const pDesc = document.createElement('p');
        pDesc.classList.add('project-description');
        pDesc.textContent = proj.description;
        section.appendChild(pDesc);

        // Outcome heading
        const outHead = document.createElement('h3');
        outHead.classList.add('project-outcome-heading');
        outHead.textContent = 'Outcome';
        section.appendChild(outHead);

        // Outcomes grid
        const grid = document.createElement('div');
        grid.classList.add('project-outcomes-grid');
        proj.outcomes.forEach(out => {
            const box = document.createElement('div');
            box.classList.add('outcome-box');
            box.innerHTML = `<h4>${out.title}</h4><p>${out.text}</p>`;
            grid.appendChild(box);
        });
        section.appendChild(grid);

        container.appendChild(section);
    });
}

document.addEventListener('DOMContentLoaded', buildProjects);