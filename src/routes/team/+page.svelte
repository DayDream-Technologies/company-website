<script>
  let team = [
    { name: "Alice", role: "CEO", bio: "Alice has been leading our company for 10 years." },
    { name: "Bob", role: "CTO", bio: "Bob is the tech genius behind our projects." }
  ];
</script>

<style>
  .team-member {
    margin-bottom: 20px;
  }
  h1 {
    text-align: center;
    margin-top: 20px;
  }
  .team-container {
    margin: 20px;
    padding: 20px;
    border: 1px solid #ccc;
    border-radius: 10px;
    background-color: #fff;
  }
  .team-title {
    font-size: 1.5rem;
    color: #333;
  }
  .team-bio {
    font-size: 1rem;
    color: #666;
  }
</style>

<main>
  <h1>Meet the Team</h1>
  {#each team as member}
    <div class="team-container">
      <h2 class="team-title">{member.name} - {member.role}</h2>
      <p class="team-bio">{member.bio}</p>
    </div>
  {/each}
</main>