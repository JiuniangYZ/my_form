<template>
  <div id="app">
    <Eform />
  </div>
</template>

<script>
// import HelloWorld from "./components/HelloWorld.vue";
/*eslint-disable*/
import Eform from "./components/Eform.vue";
export default {
  name: "App",
  components: {
    // HelloWorld
    Eform,
  },
};
</script>

<style lang="less">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  // margin-top: 60px;
}
</style>
