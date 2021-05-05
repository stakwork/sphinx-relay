<script>
  import Tabs from './Tabs.svelte'

  export let nodes = []
  export let logs = {}
  export let initialSelectedTab = ''

  $: selectedTab = initialSelectedTab

  function onSelect(t) {
    selectedTab = t
  }

  function makeLogs(logs){
    let r = ''
    logs.forEach(l=> r+=l.text)
    return r
  }

  $: thelogs = logs[selectedTab] ? logs[selectedTab].reverse() : []
</script>

<section>
  <Tabs tabs={nodes} selected={selectedTab} onSelect={onSelect} />
  <pre>
    {#each thelogs as line}
      <span style={`color:${line.type==='error'?'red':'whitesmoke'};`}>{line.text}</span>
    {/each}
  </pre>
</section>

<style>
  section{
    border:1px solid green;
    display:inline-block;
    margin:20px;
  }
  pre{
    min-height:400px;
    max-height: 400px;
    max-width: calc(50vw - 80px);
    min-width: calc(50vw - 80px);
    background-color: #222;
    color:whitesmoke;
    margin: 0;
    padding:5px;
    overflow:auto;
    display: flex;
    flex-direction: column-reverse;
  }
  @media screen and (max-width:1257px) {
    pre{
      max-width: calc(100vw - 100px);
      min-width: calc(100vw - 100px);
    }
  }
</style>