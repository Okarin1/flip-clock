<template>
  <div class="controls">
    <div v-if="mode === 'stopwatch'" class="stopwatch-controls">
      <button type="button" class="primary" @click="emitStartStopwatch">
        开始
      </button>
      <button type="button" @click="emitStopStopwatch">暂停</button>
      <button type="button" @click="emitResetStopwatch">重置</button>
      <button type="button" class="danger" @click="emitExitStopwatch">
        停止
      </button>
    </div>
    <div v-if="mode === 'countdown'" class="countdown-controls">
      <div class="quick-buttons">
        <button type="button" @click="startQuickCountdown(5)">5min</button>
        <button type="button" @click="startQuickCountdown(10)">10min</button>
        <button type="button" @click="openCountdownModal">自定义</button>
      </div>
      <div class="row-actions">
        <button type="button" class="primary" @click="confirmCountdown">
          开始
        </button>
        <button v-if="countdownRunning" type="button" @click="emitPauseCountdown">
          暂停
        </button>
        <button
          v-else-if="countdownRemaining > 0"
          type="button"
          @click="emitResumeCountdown"
        >
          继续
        </button>
        <button type="button" class="danger" @click="emitExitCountdown">
          停止
        </button>
      </div>
    </div>
    <div v-if="mode === 'pomodoro'" class="pomodoro-controls">
      <div class="time-inputs inline-inputs">
        <label>
          工作(分钟)
          <input v-model.number="workMinutes" type="number" min="1" />
        </label>
        <label>
          休息(分钟)
          <input v-model.number="breakMinutes" type="number" min="1" />
        </label>
      </div>
      <div class="row-actions">
        <button type="button" class="primary" @click="confirmPomodoro">
          开始
        </button>
        <button v-if="pomodoroRunning" type="button" @click="emitPausePomodoro">
          暂停
        </button>
        <button
          v-else-if="pomodoroRemaining > 0"
          type="button"
          @click="emitResumePomodoro"
        >
          继续
        </button>
        <button type="button" class="danger" @click="emitExitPomodoro">
          停止
        </button>
      </div>
    </div>
    <div class="buttons">
      <button
        class="icon-button"
        :class="{ 'is-active': mode === 'countdown' }"
        type="button"
        aria-label="倒计时"
        @click="toggleCountdownPanel"
      >
        <span class="icon icon-countdown" aria-hidden="true"></span>
      </button>
      <button
        class="icon-button"
        :class="{ 'is-active': mode === 'stopwatch' }"
        type="button"
        aria-label="码表"
        @click="toggleStopwatchPanel"
      >
        <span class="icon icon-stopwatch" aria-hidden="true"></span>
      </button>
      <button
        class="icon-button"
        :class="{ 'is-active': mode === 'pomodoro' }"
        type="button"
        aria-label="番茄钟"
        @click="togglePomodoroPanel"
      >
        <span class="icon icon-pomodoro" aria-hidden="true"></span>
      </button>
      <button
        class="icon-button"
        type="button"
        aria-label="设置"
        @click="openSettings"
      >
        <span class="icon icon-settings" aria-hidden="true"></span>
      </button>
    </div>
    <button
      v-show="showFullscreenButton"
      class="fullscreen-button"
      type="button"
      :aria-label="fullscreenActive ? '退出全屏' : '全屏'"
      @click="toggleFullscreen"
    >
      <span
        class="icon"
        :class="fullscreenActive ? 'icon-exit-fullscreen' : 'icon-fullscreen'"
        aria-hidden="true"
      ></span>
    </button>

    <div v-if="showSettingsModal" class="modal-backdrop" role="dialog">
      <div class="modal">
        <h3>设置</h3>
        <div class="toggle-list">
          <label class="toggle">
            <input type="checkbox" :checked="showSeconds" @change="emitToggleSeconds" />
            <span class="track" aria-hidden="true"></span>
            <span class="toggle-text">显示秒</span>
          </label>
          <label class="toggle">
            <input type="checkbox" :checked="is24h" @change="emitToggle24h" />
            <span class="track" aria-hidden="true"></span>
            <span class="toggle-text">24小时制</span>
          </label>
          <label class="slider">
            <span class="toggle-text">时钟大小</span>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              :value="clockScale"
              @input="emitClockScale"
            />
            <span class="slider-value">{{ clockScale }}</span>
          </label>
        </div>
        <div class="modal-actions">
          <button type="button" class="primary" @click="closeSettings">
            完成
          </button>
        </div>
      </div>
    </div>

    <div v-if="showCountdownModal" class="modal-backdrop" role="dialog">
      <div class="modal">
        <h3>自定义倒计时</h3>
        <div class="time-inputs">
          <label>
            小时
            <input v-model.number="countdownHoursInput" type="number" min="0" />
          </label>
          <label>
            分钟
            <input
              v-model.number="countdownMinutesInput"
              type="number"
              min="0"
              max="59"
            />
          </label>
          <label>
            秒
            <input
              v-model.number="countdownSecondsInput"
              type="number"
              min="0"
              max="59"
            />
          </label>
        </div>
        <div class="modal-actions">
          <button type="button" @click="closeCountdownModal">取消</button>
          <button type="button" class="primary" @click="confirmCountdown">
            开始
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onBeforeUnmount } from "vue";

export default {
  name: "ClockControls",
  props: {
    showSeconds: {
      type: Boolean,
      required: true
    },
    is24h: {
      type: Boolean,
      required: true
    },
    mode: {
      type: String,
      required: true
    },
    countdownSeconds: {
      type: Number,
      required: true
    },
    countdownRemaining: {
      type: Number,
      required: true
    },
    pomodoroWorkSeconds: {
      type: Number,
      required: true
    },
    pomodoroBreakSeconds: {
      type: Number,
      required: true
    },
    pomodoroRemaining: {
      type: Number,
      required: true
    },
    pomodoroRunning: {
      type: Boolean,
      required: true
    },
    stopwatchRunning: {
      type: Boolean,
      required: true
    },
    countdownRunning: {
      type: Boolean,
      required: true
    },
    clockScale: {
      type: Number,
      required: true
    }
  },
  setup(props, { emit }) {
    const showSettingsModal = ref(false);
    const showCountdownModal = ref(false);

    const countdownHoursInput = ref(0);
    const countdownMinutesInput = ref(0);
    const countdownSecondsInput = ref(0);

    const workMinutes = ref(25);
    const breakMinutes = ref(5);

    const showFullscreenButton = ref(false);
    const fullscreenActive = ref(false);

    let fullscreenTimer = null;

    const emitToggleSeconds = () => emit("toggle-seconds");
    const emitToggle24h = () => emit("toggle-24h");
    const emitClockScale = (event) =>
      emit("update-clock-scale", Number(event.target.value));

    const emitStartStopwatch = () => emit("start-stopwatch");
    const emitStopStopwatch = () => emit("stop-stopwatch");
    const emitResetStopwatch = () => emit("reset-stopwatch");
    const emitExitStopwatch = () => emit("exit-stopwatch");

    const emitPauseCountdown = () => emit("pause-countdown");
    const emitResumeCountdown = () => emit("resume-countdown");
    const emitExitCountdown = () => emit("exit-countdown");

    const emitPausePomodoro = () => emit("pause-pomodoro");
    const emitResumePomodoro = () => emit("resume-pomodoro");
    const emitExitPomodoro = () => emit("exit-pomodoro");

    const toggleStopwatchPanel = () => {
      if (props.mode === "stopwatch") {
        emit("exit-stopwatch");
      } else {
        emit("open-stopwatch");
      }
    };

    const confirmCountdown = () => {
      const hours = Math.max(0, Math.floor(countdownHoursInput.value || 0));
      const minutes = Math.max(0, Math.floor(countdownMinutesInput.value || 0));
      const seconds = Math.max(0, Math.floor(countdownSecondsInput.value || 0));
      const totalSeconds = hours * 3600 + minutes * 60 + seconds;
      if (totalSeconds > 0) {
        emit("start-countdown", totalSeconds);
        showCountdownModal.value = false;
      }
    };

    const confirmPomodoro = () => {
      const work = Math.max(1, Math.floor(workMinutes.value || 0));
      const rest = Math.max(1, Math.floor(breakMinutes.value || 0));
      emit("start-pomodoro", {
        workSeconds: work * 60,
        breakSeconds: rest * 60
      });
    };

    const toggleCountdownPanel = () => {
      if (props.mode === "countdown") {
        emit("exit-countdown");
      } else {
        const total = Math.max(0, Math.floor(props.countdownSeconds || 0));
        countdownHoursInput.value = Math.floor(total / 3600);
        countdownMinutesInput.value = Math.floor((total % 3600) / 60);
        countdownSecondsInput.value = total % 60;
        emit("open-countdown");
      }
    };

    const startQuickCountdown = (minutes) => {
      const totalSeconds = Math.max(60, Math.floor(minutes * 60));
      emit("start-countdown", totalSeconds);
    };

    const togglePomodoroPanel = () => {
      if (props.mode === "pomodoro") {
        emit("exit-pomodoro");
      } else {
        workMinutes.value = Math.max(
          1,
          Math.floor(props.pomodoroWorkSeconds / 60)
        );
        breakMinutes.value = Math.max(
          1,
          Math.floor(props.pomodoroBreakSeconds / 60)
        );
        emit("open-pomodoro");
      }
    };

    const openSettings = () => {
      showSettingsModal.value = true;
    };

    const closeSettings = () => {
      showSettingsModal.value = false;
    };

    const openCountdownModal = () => {
      const total = Math.max(0, Math.floor(props.countdownSeconds || 0));
      countdownHoursInput.value = Math.floor(total / 3600);
      countdownMinutesInput.value = Math.floor((total % 3600) / 60);
      countdownSecondsInput.value = total % 60;
      showCountdownModal.value = true;
    };

    const closeCountdownModal = () => {
      showCountdownModal.value = false;
    };

    const toggleFullscreen = () => {
      const doc = document;
      if (!doc.fullscreenElement) {
        if (doc.documentElement.requestFullscreen) {
          doc.documentElement.requestFullscreen();
        }
      } else if (doc.exitFullscreen) {
        doc.exitFullscreen();
      }
    };

    const onMouseMove = () => {
      showFullscreenButton.value = true;
      if (fullscreenTimer) {
        clearTimeout(fullscreenTimer);
      }
      fullscreenTimer = setTimeout(() => {
        showFullscreenButton.value = false;
      }, 1500);
    };

    const onFullscreenChange = () => {
      fullscreenActive.value = Boolean(document.fullscreenElement);
    };

    onMounted(() => {
      window.addEventListener("mousemove", onMouseMove);
      document.addEventListener("fullscreenchange", onFullscreenChange);
      onFullscreenChange();
    });

    onBeforeUnmount(() => {
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      if (fullscreenTimer) {
        clearTimeout(fullscreenTimer);
        fullscreenTimer = null;
      }
    });

    return {
      showSettingsModal,
      showCountdownModal,
      countdownHoursInput,
      countdownMinutesInput,
      countdownSecondsInput,
      workMinutes,
      breakMinutes,
      showFullscreenButton,
      fullscreenActive,
      emitToggleSeconds,
      emitToggle24h,
      emitClockScale,
      emitStartStopwatch,
      emitStopStopwatch,
      emitResetStopwatch,
      emitExitStopwatch,
      emitPauseCountdown,
      emitResumeCountdown,
      emitExitCountdown,
      emitPausePomodoro,
      emitResumePomodoro,
      emitExitPomodoro,
      toggleStopwatchPanel,
      confirmCountdown,
      confirmPomodoro,
      toggleCountdownPanel,
      startQuickCountdown,
      togglePomodoroPanel,
      openSettings,
      closeSettings,
      openCountdownModal,
      closeCountdownModal,
      toggleFullscreen
    };
  }
};
</script>

<style scoped>
.controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  position: fixed;
  left: 0;
  right: 0;
  bottom: 24px;
  z-index: 5;
}

.buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: center;
}

.stopwatch-controls {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.stopwatch-controls button {
  padding: 8px 12px;
}

.countdown-controls,
.pomodoro-controls {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
}

.quick-buttons {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.inline-inputs {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-bottom: 0;
}

.pomodoro-controls .inline-inputs {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.row-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
}

button {
  background: #2b2b2b;
  color: #e6e6e6;
  border: 1px solid #3a3a3a;
  padding: 10px 12px;
  border-radius: 999px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
}

button.is-active {
  background: #3b3b3b;
  border-color: #565656;
}

button:hover {
  background: #333333;
  border-color: #5a5a5a;
  transform: translateY(-1px);
}

.icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  padding: 0;
}

.icon {
  width: 18px;
  height: 18px;
  position: relative;
}

.icon-countdown {
  border-radius: 50%;
  border: 2px solid #6a6a6a;
}

.icon-countdown::after {
  content: "";
  position: absolute;
  width: 2px;
  height: 6px;
  background: #6a6a6a;
  left: 50%;
  top: 3px;
  transform: translateX(-50%);
}

.icon-pomodoro {
  border-radius: 5px 5px 8px 8px;
  border: 2px solid #6a6a6a;
}

.icon-pomodoro::after {
  content: "";
  position: absolute;
  width: 8px;
  height: 3px;
  background: #6a6a6a;
  left: 50%;
  top: -4px;
  transform: translateX(-50%);
  border-radius: 3px;
}

.icon-settings {
  border-radius: 50%;
  border: 2px solid #6a6a6a;
}

.icon-settings::after {
  content: "";
  position: absolute;
  width: 4px;
  height: 4px;
  background: #6a6a6a;
  border-radius: 50%;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  box-shadow: -6px 0 0 #6a6a6a, 6px 0 0 #6a6a6a;
}

.icon-stopwatch {
  border-radius: 50%;
  border: 2px solid #6a6a6a;
}

.icon-stopwatch::after {
  content: "";
  position: absolute;
  width: 2px;
  height: 7px;
  background: #6a6a6a;
  left: 50%;
  top: 4px;
  transform: translateX(-50%);
  box-shadow: 5px -3px 0 0 #6a6a6a;
}

.icon-button.is-active .icon {
  border-color: #e6e6e6;
}

.icon-button.is-active .icon::after {
  background: #e6e6e6;
}

.fullscreen-button {
  position: fixed;
  left: 20px;
  bottom: 20px;
  width: 44px;
  height: 44px;
  padding: 0;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
}

.fullscreen-button:hover {
  background: transparent;
  border: none;
  transform: none;
  opacity: 0.8;
}

.icon-fullscreen {
  width: 18px;
  height: 18px;
  position: relative;
}

.icon-fullscreen::before,
.icon-fullscreen::after {
  content: "";
  position: absolute;
  width: 6px;
  height: 6px;
  border: 2px solid #6a6a6a;
}

.icon-fullscreen::before {
  left: 0;
  top: 0;
  border-right: none;
  border-bottom: none;
}

.icon-fullscreen::after {
  right: 0;
  bottom: 0;
  border-left: none;
  border-top: none;
}

.icon-exit-fullscreen {
  width: 18px;
  height: 18px;
  position: relative;
}

.icon-exit-fullscreen::before,
.icon-exit-fullscreen::after {
  content: "";
  position: absolute;
  width: 6px;
  height: 6px;
  border: 2px solid #6a6a6a;
}

.icon-exit-fullscreen::before {
  left: 0;
  bottom: 0;
  border-right: none;
  border-top: none;
}

.icon-exit-fullscreen::after {
  right: 0;
  top: 0;
  border-left: none;
  border-bottom: none;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  padding: 24px 16px;
  overflow-y: auto;
  box-sizing: border-box;
}

.modal {
  background: #1f1f1f;
  border: 1px solid #3a3a3a;
  border-radius: 12px;
  padding: 20px;
  width: 100%;
  max-width: 420px;
  max-height: 90vh;
  overflow: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  color: #e6e6e6;
  box-sizing: border-box;
}

.modal h3 {
  margin: 0 0 16px;
  font-size: 18px;
  font-weight: 600;
}

.time-inputs {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.time-inputs label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  color: #cfcfcf;
  min-width: 0;
}

.time-inputs input {
  padding: 8px;
  border-radius: 8px;
  border: 1px solid #3a3a3a;
  background: #2b2b2b;
  color: #e6e6e6;
  width: 100%;
  box-sizing: border-box;
}

.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.modal-actions .primary {
  background: #3b3b3b;
  border-color: #565656;
}

.danger {
  background: #3a2424;
  border-color: #6a3a3a;
}

.toggle-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.slider {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #cfcfcf;
}

.slider input[type="range"] {
  width: 100%;
  accent-color: #19c37d;
}

.slider-value {
  color: #e6e6e6;
  font-variant-numeric: tabular-nums;
  min-width: 48px;
  text-align: right;
}

.toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #cfcfcf;
}

.toggle input {
  display: none;
}

.toggle .track {
  width: 40px;
  height: 22px;
  background: #2b2b2b;
  border-radius: 999px;
  position: relative;
  border: 1px solid #3a3a3a;
}

.toggle .track::after {
  content: "";
  position: absolute;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #6a6a6a;
  top: 2px;
  left: 2px;
  transition: transform 0.2s ease;
}

.toggle input:checked + .track::after {
  transform: translateX(18px);
  background: #19c37d;
}

.toggle input:checked + .track {
  border-color: #19c37d;
  background: rgba(25, 195, 125, 0.2);
}

.toggle-text {
  color: #e6e6e6;
}

@media (max-width: 480px) {
  .time-inputs {
    grid-template-columns: 1fr;
  }

  .modal-backdrop {
    align-items: flex-start;
  }
}
</style>
