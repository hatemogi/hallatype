<template>
  <div class="home">
    <img alt="Vue logo" src="../assets/logo.png">
    <canvas id="캔버스" width="640" height="480"></canvas>
    <HelloWorld msg="Welcome to Your Vue.js + TypeScript App"/>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import HelloWorld from '@/components/HelloWorld.vue'; // @ is an alias to /src
import Graphics from '@/graphics';

@Component({
  components: {
    HelloWorld,
  },
})

export default class Home extends Vue {
  public mounted() {
    const canvas = document.getElementById('캔버스') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    new Graphics(ctx).draw();
    window.onkeydown = (e: KeyboardEvent) => {
      console.log(`key=${e.key}, code=${e.code}, shift=${e.getModifierState('Shift')}`);
    };
  }
}
</script>
