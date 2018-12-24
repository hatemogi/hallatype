<template>
  <div class="home">
    <canvas id="캔버스" width="640" height="400"></canvas>
    <h2>한 달짜리 개인 프로젝트 이야기</h2>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import Graphics from '@/graphics';

@Component
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

<style lang="scss">
#캔버스 {
  border: 1px solid black;
  zoom: 120%;
}
</style>