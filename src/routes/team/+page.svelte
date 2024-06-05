<script lang="ts">
  import Card from '@smui/card';
  import Paper from '@smui/paper';
  import ImageList from '@smui/image-list';
  export let data: { team: { name: string; role: string; image: string; bio: string }[] };
  console.log('Team data in component:', data.team);
</script>

<style>
  .team-grid {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 1rem;
  }

  .team-card {
    width: 300px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    border-radius: 8px;
    overflow: hidden;
  }

  .team-image {
    width: 100%;
    height: 200px;
    object-fit: cover;
  }

  .team-content {
    padding: 16px;
  }

  .team-content h2 {
    margin: 0 0 8px 0;
  }

  .team-content p {
    margin: 0 0 16px 0;
  }
</style>

<h1>Our Team</h1>

<div class="team-grid">
  {#each data.team as member}
    <Card class="team-card">
      <img src={member.image} alt={member.name} class="team-image" />
      <div class="team-content">
        <h2>{member.name}</h2>
        <p>{member.role}</p>
        <p>{member.bio}</p> <!-- Added bio field -->
      </div>
    </Card>
  {/each}
</div>