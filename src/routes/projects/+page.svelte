<script>
  let projects = [
    { title: "Project Alpha", description: "Description of Project Alpha" },
    { title: "Project Beta", description: "Description of Project Beta" }
  ];
</script>

<style>
  h1 {
    text-align: center;
    margin-top: 20px;
  }
  .project-container {
    margin: 20px;
    padding: 20px;
    border: 1px solid #ccc;
    border-radius: 10px;
    background-color: #fff;
  }
  .project-title {
    font-size: 1.5rem;
    color: #333;
  }
  .project-description {
    font-size: 1rem;
    color: #666;
  }
</style>

<main>
  <h1>Current Projects</h1>
  {#each projects as project}
    <div class="project-container">
      <h2 class="project-title">{project.title}</h2>
      <p class="project-description">{project.description}</p>
    </div>
  {/each}
</main>