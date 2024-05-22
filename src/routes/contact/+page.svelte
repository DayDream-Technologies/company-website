<script>

  let name = '';
  let email = '';
  let message = '';

  function handleSubmit() {
    alert(`Message sent by ${name} (${email}): ${message}`);
    // Here you would typically handle form submission to a server
  }
</script>

<style>
  form {
    max-width: 400px;
    margin: 0 auto;
    padding: 20px;
    border: 1px solid #ccc;
    border-radius: 10px;
  }
  label {
    display: block;
    margin-top: 10px;
  }
  input, textarea {
    width: 100%;
    padding: 10px;
    margin-top: 5px;
  }
  button {
    margin-top: 20px;
    padding: 10px 20px;
  }
</style>

<main>
  <h1>Contact Us</h1>
  <form on:submit|preventDefault={handleSubmit}>
    <label>
      Name:
      <input type="text" bind:value={name} />
    </label>
    <label>
      Email:
      <input type="email" bind:value={email} />
    </label>
    <label>
      Message:
      <textarea bind:value={message}></textarea>
    </label>
    <button type="submit">Send</button>
  </form>
</main>