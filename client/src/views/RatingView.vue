<template>
  <div class="rating-container">
    <h2>🏆 Top 10 Players by Waves</h2>
    <table class="rating-table">
      <thead>
        <tr>
          <th>Rank</th>
          <th>Player</th>
          <th>Wave</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(player, idx) in topPlayers" :key="player.id" :class="{ me: player.telegram_id === myTelegramId }">
          <td>{{ idx + 1 }}</td>
          <td>{{ player.username }}</td>
          <td>{{ player.max_wave_completed }}</td>
        </tr>
      </tbody>
    </table>
    <div v-if="myRank !== null" class="my-rank">
      <span>Your rank: <b>{{ myRank }}</b></span>
    </div>
    <button class="back-btn" @click="goBack">
      <span class="icon">←</span>
      Back
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { fetchTopPlayers, fetchPlayerRank } from '../services/api/GameServerGateway';
import { PlayerRating } from '../game/types/PlayerRating';

const topPlayers = ref<PlayerRating[]>([]);
const myRank = ref<number|null>(null);
const myTelegramId = Number(window.Telegram?.WebApp?.initDataUnsafe?.user?.id) || 0;

async function loadRating() {
  topPlayers.value = await fetchTopPlayers(10);
  if (myTelegramId) {
    try {
      const { rank } = await fetchPlayerRank(myTelegramId);
      myRank.value = rank;
    } catch {
      myRank.value = null;
    }
  }
}

function goBack() {
  window.dispatchEvent(new CustomEvent('vue-hide-rating'));
}

onMounted(loadRating);
</script>

<style scoped>
.rating-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  max-width: none;
  margin: 0;
  background: rgba(34, 34, 34, 0.98);
  color: #fff;
  border-radius: 0;
  padding: 0;
  box-shadow: none;
  text-align: center;
  font-family: 'pixelFont', 'Arial', sans-serif;
}
.rating-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 16px;
  font-family: 'pixelFont', 'Arial', sans-serif;
}
.rating-table th, .rating-table td {
  padding: 6px 8px;
  border-bottom: 1px solid #444;
  font-family: 'pixelFont', 'Arial', sans-serif;
}
.rating-table th {
  background: #333;
  font-family: 'pixelFont', 'Arial', sans-serif;
}
.rating-table tr.me {
  background: #2a2;
  color: #fff;
}
.my-rank {
  margin: 12px 0 0 0;
  font-size: 1.1em;
}
.back-btn {
  font-family: 'pixelFont', sans-serif !important;
  margin-top: 32px;
  padding: 10px 24px;
  font-size: 1.1em;
  border-radius: 8px;
  border: 2px solid #ffcc00;
  background: transparent;
  color: #ffcc00;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, color 0.2s, border-color 0.2s, box-shadow 0.2s;
  outline: none;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  box-shadow: none;
}
.back-btn:hover, .back-btn:focus {
  background: #ffcc00;
  color: #222;
  border-color: #ffe066;
  box-shadow: 0 2px 12px #ffcc0033;
}
.back-btn .icon {
  font-size: 1.2em;
  margin-right: 4px;
}
</style>