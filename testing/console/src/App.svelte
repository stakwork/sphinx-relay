<script lang="ts">
  import Console from './Console.svelte'

	$: logs = {}

  function setLogs(l){
    console.log(l)
    logs = l
  }

  setInterval(()=>{
    fetch('http://localhost:3333/logs').then(r=> r.json()).then(j=> setLogs(j))
  }, 2000)

  const relay_nodes = ['alice', 'bob', 'carol', 'dave']
  const go_nodes = ['proxy', 'auth', 'mqtt', 'tribes', 'meme']
</script>

<main>
	<Console nodes={relay_nodes} logs={logs} />
  <Console nodes={go_nodes} logs={logs} />
</main>

<style>
	main {
		padding: 1em;
    display:flex;
	}
</style>