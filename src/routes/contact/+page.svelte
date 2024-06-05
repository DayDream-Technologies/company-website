<script lang="ts">
  let name = '';
  let email = '';
  let message = '';

  const handleSubmit = async () => {
    const response = await fetch('https://ioyljend8b.execute-api.us-east-1.amazonaws.com/default/sendEmail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, message })
    });
    if (response.ok) {
      alert('Message sent successfully!');
    } else {
      alert('Failed to send message.');
    }
  };
</script>

<form on:submit|preventDefault={handleSubmit}>
  <label>
    Name:
    <input type="text" bind:value={name} required />
  </label>
  <label>
    Email:
    <input type="email" bind:value={email} required />
  </label>
  <label>
    Message:
    <textarea bind:value={message} required></textarea>
  </label>
  <button type="submit">Send</button>
</form>