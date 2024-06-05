<script lang="ts">
  import Card from '@smui/card';
  import Button from '@smui/button';
  import Paper from '@smui/paper';
  import ImageList from '@smui/image-list';
  export let data: { projects: { name: string; description: string; details: string; image: string }[] };
  console.log('Projects data in component:', data.projects);
</script>

<style>
  .project-grid {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 1rem;
  }

  .project-card {
    width: 300px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    border-radius: 8px;
    overflow: hidden;
  }

  .project-image {
    width: 100%;
    height: 200px;
    object-fit: cover;
  }

  .project-content {
    padding: 16px;
  }

  .project-content h2 {
    margin: 0 0 8px 0;
  }

  .project-content p {
    margin: 0 0 16px 0;
  }

  .project-content button {
    display: block;
    width: 100%;
  }
</style>

<h1>Our Projects</h1>

<div class="project-grid">
  {#each data.projects as project}
    <Card class="project-card">
      <img src={project.image} alt={project.name} class="project-image" />
      <div class="project-content">
        <h2>{project.name}</h2>
        <p>{project.description}</p>
        <p>{project.details}</p>
        <Button variant="raised">Learn More</Button>
      </div>
    </Card>
  {/each}
</div>