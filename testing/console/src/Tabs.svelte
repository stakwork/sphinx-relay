<script>
  export let tabs = []
  export let selected = ''
  export let onSelect = () => {}

  $: barLeft = tabs.indexOf(selected) * 101 + 1
</script>

<div class="wrap" style={`width:${tabs.length*101}px`}>
  {#each tabs as tab}
    <div class={selected===tab?'tab selected':'tab'} on:click={()=> onSelect(tab)}>
      {tab}
    </div>
  {/each}
  <div class="bar" style={`left:${barLeft}px;display:${barLeft<0?'none':'block'};`}></div>
</div>

<style>
  .wrap{
    height:50px;
    display:flex;
    position: relative;
  }
  .tab{
    width:100px;
    min-width:100px;
    height:50px;
    border-bottom:1px solid grey;
    border-right:1px solid grey;
    border-top:1px solid grey;
    cursor:pointer;
    display:flex;
    align-items: center;
    justify-content: center;
  }
  .tab:first-child{
    border-left: 1px solid grey;
  }
  .tab:hover{
    background:whitesmoke;
  }
  .tab.selected{
    background:rgb(4, 88, 80);
    color:white;
  }
  .bar{
    height:6px;
    width:100px;
    position:absolute;
    bottom:-2px;
    background:cyan;
  }
</style>