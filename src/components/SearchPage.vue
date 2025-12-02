<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'

interface SearchEngine {
  id: string
  name: string
  icon: string
  color: string
  url: string
}

const engines: SearchEngine[] = [
  { id: 'google', name: 'Google', icon: 'G', color: '#4285f4', url: 'https://www.google.com/search?q=' },
  { id: 'bing', name: 'Bing', icon: 'B', color: '#00a4ef', url: 'https://www.bing.com/search?q=' },
  { id: 'baidu', name: '百度', icon: '度', color: '#2932e1', url: 'https://www.baidu.com/s?wd=' },
  { id: 'duckduckgo', name: 'DuckDuckGo', icon: 'D', color: '#de5833', url: 'https://duckduckgo.com/?q=' },
  { id: 'github', name: 'GitHub', icon: 'GH', color: '#ffffff', url: 'https://github.com/search?q=' },
  { id: 'stackoverflow', name: 'StackOverflow', icon: 'SO', color: '#f48024', url: 'https://stackoverflow.com/search?q=' },
  { id: 'bilibili', name: 'Bilibili', icon: 'B', color: '#fb7299', url: 'https://search.bilibili.com/all?keyword=' },
  { id: 'youtube', name: 'YouTube', icon: 'YT', color: '#ff0000', url: 'https://www.youtube.com/results?search_query=' }
]

const WALLPAPER_URL = 'https://bing.img.run/1920x1080.php'

const query = ref('')
const engine = ref(engines[0]!)
const focused = ref(false)
const showSuggestions = ref(false)
const showEngines = ref(false)
const selectedIdx = ref(-1)
const btnRef = ref<HTMLButtonElement | null>(null)
const dropPos = ref({ top: 0, left: 0 })

const time = ref(new Date())
setInterval(() => time.value = new Date(), 1000)

const timeStr = computed(() => time.value.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }))
const dateStr = computed(() => time.value.toLocaleDateString('zh-CN', { weekday: 'long', month: 'long', day: 'numeric' }))

watch(query, (v) => {
  selectedIdx.value = -1
  showSuggestions.value = !!v.trim()
})

function select(e: SearchEngine) {
  engine.value = e
  showEngines.value = false
}

function toggle() {
  showEngines.value = !showEngines.value
  showSuggestions.value = false
  if (showEngines.value && btnRef.value) {
    nextTick(() => {
      const r = btnRef.value!.getBoundingClientRect()
      dropPos.value = { top: r.bottom + 20, left: r.left }
    })
  }
}

function search(e?: SearchEngine) {
  const q = query.value.trim()
  if (q) window.open((e || engine.value).url + encodeURIComponent(q), '_blank')
}

function onKey(e: KeyboardEvent) {
  if (!showSuggestions.value) return
  if (e.key === 'ArrowDown') { e.preventDefault(); selectedIdx.value = Math.min(selectedIdx.value + 1, engines.length - 1) }
  else if (e.key === 'ArrowUp') { e.preventDefault(); selectedIdx.value = Math.max(selectedIdx.value - 1, -1) }
  else if (e.key === 'Enter' && selectedIdx.value >= 0) { e.preventDefault(); search(engines[selectedIdx.value]) }
}

function onBlur() { setTimeout(() => { focused.value = false; showSuggestions.value = false }, 200) }
function onFocus() { focused.value = true; showEngines.value = false; if (query.value.trim()) showSuggestions.value = true }
function onClick(e: MouseEvent) { if (!(e.target as HTMLElement).closest('.engine-selector-wrapper')) showEngines.value = false }
</script>

<template>
  <div class="page" @click="onClick">
    <div class="bg" :style="{ backgroundImage: `url(${WALLPAPER_URL})` }"></div>
    <div class="blur" :class="{ active: focused || showSuggestions }"></div>
    
    <div class="content">
      <div class="clock">
        <div class="time">{{ timeStr }}</div>
        <div class="date">{{ dateStr }}</div>
      </div>

      <div class="search-box" :class="{ focused, expand: showSuggestions }">
        <div class="input-row">
          <div class="engine-selector-wrapper">
            <button ref="btnRef" class="engine-btn" @click.stop="toggle">
              <span :style="{ color: engine.color }">{{ engine.icon }}</span>
              <svg class="arrow" :class="{ rotated: showEngines }" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
          </div>
          <input v-model="query" class="input" :placeholder="`Search with ${engine.name}`" @keyup.enter="search()" @keydown="onKey" @focus="onFocus" @blur="onBlur"/>
          <button class="go-btn" @click="search()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
        
        <Transition name="slide">
          <div v-if="showSuggestions && query.trim()" class="suggestions">
            <div class="sug-header">在各搜索引擎中搜索 "{{ query }}"</div>
            <div v-for="(e, i) in engines" :key="e.id" class="sug-item" :class="{ sel: selectedIdx === i }" :style="{ '--d': `${i * 0.025}s` }" @mousedown.prevent="search(e)" @mouseenter="selectedIdx = i">
              <span class="sug-icon" :style="{ color: e.color }">{{ e.icon }}</span>
              <span class="sug-name">{{ e.name }}</span>
              <span class="sug-text">{{ query }}</span>
              <svg class="sug-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          </div>
        </Transition>
      </div>

      <Transition name="drop">
        <div v-if="showEngines" class="dropdown" :style="{ top: dropPos.top + 'px', left: dropPos.left + 'px' }">
          <button v-for="(e, i) in engines" :key="e.id" class="drop-item" :class="{ active: engine.id === e.id }" :style="{ '--d': `${i * 0.03}s` }" @click.stop="select(e)">
            <span class="drop-icon" :style="{ color: e.color }">{{ e.icon }}</span>
            <span class="drop-name">{{ e.name }}</span>
          </button>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.page { min-height: 100vh; position: relative; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif; }
.bg { position: absolute; inset: 0; background: #1a1a2e center/cover; transition: background-image 1s ease; }
.blur { position: absolute; inset: 0; background: rgba(0,0,0,.15); backdrop-filter: blur(0); transition: all .6s ease; }
.blur.active { background: rgba(0,0,0,.35); backdrop-filter: blur(30px) saturate(180%); }

.content { position: relative; z-index: 1; min-height: 100vh; display: flex; flex-direction: column; align-items: center; padding: 2rem; padding-top: 20vh; }

.clock { text-align: center; margin-bottom: 3rem; color: #fff; min-height: 120px; }
.time { font: 300 clamp(3rem,10vw,6rem)/1 'SF Pro Display',-apple-system,sans-serif; letter-spacing: .04em; text-shadow: 0 4px 30px rgba(0,0,0,.3); font-variant-numeric: tabular-nums; }
.date { font-size: clamp(1rem,2.5vw,1.4rem); font-weight: 300; opacity: .85; margin-top: .75rem; letter-spacing: .05em; }

.search-box { position: relative; width: 100%; max-width: 680px; background: rgba(255,255,255,.15); backdrop-filter: blur(20px) saturate(180%); border-radius: 18px; border: 1px solid rgba(255,255,255,.2); padding: 6px; transition: all .4s cubic-bezier(.34,1.56,.64,1); box-shadow: 0 8px 32px rgba(0,0,0,.2); }
.search-box.focused { background: rgba(255,255,255,.2); border-color: rgba(255,255,255,.35); box-shadow: 0 16px 56px rgba(0,0,0,.28); transform: scale(1.02); }
.search-box.expand { border-radius: 18px 18px 0 0; }

.input-row { display: flex; align-items: center; gap: 12px; padding: 8px 12px; }
.engine-selector-wrapper { position: static; }
.engine-btn { width: 52px; height: 42px; display: flex; align-items: center; justify-content: center; gap: 4px; background: rgba(255,255,255,.35); border: none; border-radius: 12px; cursor: pointer; transition: all .3s cubic-bezier(.34,1.56,.64,1); font: 700 1rem 'SF Pro Display'; }
.engine-btn:hover { background: rgba(255,255,255,.5); transform: scale(1.05); }
.engine-btn:active { transform: scale(.95); }
.arrow { color: rgba(255,255,255,.7); transition: transform .4s cubic-bezier(.34,1.56,.64,1); }
.arrow.rotated { transform: rotate(180deg); }

.input { flex: 1; padding: 12px 8px; border: none; border-radius: 12px; font-size: clamp(.95rem,2vw,1.1rem); background: transparent; color: #fff; outline: none; min-width: 0; }
.input::placeholder { color: rgba(255,255,255,.5); font-weight: 300; }
.input:focus::placeholder { color: rgba(255,255,255,.3); }

.go-btn { width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,.9); color: #1a1a2e; border: none; border-radius: 12px; cursor: pointer; transition: all .3s cubic-bezier(.34,1.56,.64,1); flex-shrink: 0; }
.go-btn:hover { background: #fff; transform: scale(1.08); box-shadow: 0 4px 20px rgba(255,255,255,.3); }
.go-btn:active { transform: scale(.95); }

.dropdown { position: fixed; min-width: 200px; background: rgba(255,255,255,.15); backdrop-filter: blur(30px) saturate(180%); border: 1px solid rgba(255,255,255,.25); border-radius: 14px; padding: 6px; z-index: 200; box-shadow: 0 12px 40px rgba(0,0,0,.2); }
.drop-item { display: flex; align-items: center; gap: 10px; width: 100%; padding: 10px 12px; background: transparent; border: none; border-radius: 10px; cursor: pointer; transition: all .25s cubic-bezier(.34,1.56,.64,1); animation: fadeX .3s cubic-bezier(.34,1.56,.64,1) backwards; animation-delay: var(--d); }
.drop-item:hover { background: rgba(255,255,255,.15); transform: translateX(4px); }
.drop-item:active { transform: scale(.98); }
.drop-item.active { background: rgba(255,255,255,.2); }
.drop-icon { font: 700 .85rem/28px 'SF Pro Display'; width: 28px; text-align: center; background: rgba(255,255,255,.25); border-radius: 6px; transition: transform .3s; }
.drop-item:hover .drop-icon { transform: scale(1.15); }
.drop-name { font-size: .9rem; color: rgba(255,255,255,.9); font-weight: 500; }

.suggestions { position: absolute; top: 100%; left: -1px; right: -1px; background: rgba(255,255,255,.12); backdrop-filter: blur(24px) saturate(180%); border: 1px solid rgba(255,255,255,.2); border-top: none; border-radius: 0 0 18px 18px; overflow: hidden; z-index: 100; }
.sug-header { padding: 12px 16px; font-size: .75rem; color: rgba(255,255,255,.5); border-bottom: 1px solid rgba(255,255,255,.1); }
.sug-item { display: flex; align-items: center; gap: 12px; padding: 12px 16px; cursor: pointer; transition: all .25s cubic-bezier(.34,1.56,.64,1); animation: fadeY .3s cubic-bezier(.34,1.56,.64,1) backwards; animation-delay: var(--d); }
.sug-item:hover, .sug-item.sel { background: rgba(255,255,255,.1); transform: translateX(4px); }
.sug-icon { font: 700 .8rem/28px 'SF Pro Display'; width: 28px; text-align: center; background: rgba(0,0,0,.3); border-radius: 6px; flex-shrink: 0; transition: transform .3s; }
.sug-item:hover .sug-icon { transform: scale(1.15); }
.sug-name { font-size: .85rem; font-weight: 500; color: rgba(255,255,255,.9); width: 100px; flex-shrink: 0; }
.sug-text { flex: 1; font-size: .9rem; color: rgba(255,255,255,.7); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sug-arrow { color: rgba(255,255,255,.4); flex-shrink: 0; transition: all .3s; }
.sug-item:hover .sug-arrow { color: rgba(255,255,255,.8); transform: translateX(4px); }

.drop-enter-active { animation: dropIn .35s cubic-bezier(.34,1.56,.64,1); }
.drop-leave-active { animation: dropOut .25s ease; }
.slide-enter-active { animation: slideIn .35s cubic-bezier(.34,1.56,.64,1); }
.slide-leave-active { animation: slideOut .2s ease; }

@keyframes dropIn { from { opacity: 0; transform: translateY(-12px) scale(.95); } }
@keyframes dropOut { to { opacity: 0; transform: translateY(-8px) scale(.95); } }
@keyframes slideIn { from { opacity: 0; transform: translateY(-8px); } }
@keyframes slideOut { to { opacity: 0; transform: translateY(-8px); } }
@keyframes fadeX { from { opacity: 0; transform: translateX(-8px); } }
@keyframes fadeY { from { opacity: 0; transform: translateY(-6px); } }

@media (max-width: 600px) {
  .content { padding: 1.5rem; padding-top: 15vh; }
  .clock { margin-bottom: 2rem; min-height: 80px; }
  .engine-btn { width: 46px; height: 36px; }
  .go-btn { width: 38px; height: 38px; }
  .input-row { gap: 8px; padding: 6px 8px; }
  .sug-name { width: 80px; }
  .dropdown { min-width: 160px; }
}
</style>
